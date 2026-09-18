'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage, getTodayKey } from '@/services/storage';
import {
  isFirebaseConfigured,
  subscribeToAuth,
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  logOut,
  saveProfileToFirestore,
  getProfileFromFirestore,
  addLogToFirestore,
  deleteLogFromFirestore,
  subscribeToDateLogs,
} from '@/services/firebase';
import { cloudflareDb } from '@/services/cloudflareDb';
import {
  calculateBMR,
  calculateTDEE,
  calculateBMI,
  calculateWaterTargetLiters,
} from '@/services/healthEngine';
import { callGeminiAPI } from '@/services/gemini';

const AppContext = createContext(null);

// ngecek user udah isi profil fisik lengkap apa belom
export const isProfileComplete = (p) => {
  return Boolean(
    p &&
    p.name &&
    p.name.trim() !== '' &&
    Number(p.age) > 0 &&
    Number(p.height) > 0 &&
    Number(p.weight) > 0
  );
};

export function AppProvider({ children }) {
  const [isClient, setIsClient] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayKey());
  const [activeTab, setActiveTab] = useState('home');

  // state buat login & tampilan
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: '', age: 0, height: 0, weight: 0 });
  const [view, setView] = useState('auth'); 
  const [showIntro, setShowIntro] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  // state buat popup-popup
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isHealthReportOpen, setIsHealthReportOpen] = useState(false);
  const [healthReport, setHealthReport] = useState(null);
  const [isAnalyzingHealth, setIsAnalyzingHealth] = useState(false);

  // state data beneran (kosongan di awal)
  const [logs, setLogs] = useState({
    activity: [],
    diet: [],
    sleep: [],
    screentime: [],
  });

  // narik data awal pas pertama buka, nyalain db, sekalian pantau login
  useEffect(() => {
    setIsClient(true);

    // nyalain db cloudflare kalo disetup
    cloudflareDb.init().catch(() => {});

    // PONYTAIL FIX: ZERO LATENCY INIT
    // Langsung cek memori lokal sebelum Firebase loading buat cegah flash login/reset
    const storedUser = storage.getUser();
    const storedProfile = storage.getProfile();
    
    if (storedUser && isProfileComplete(storedProfile)) {
      setUser(storedUser);
      setProfile(storedProfile);
      setView('app');
    }

    if (isFirebaseConfigured) {
      const unsubscribe = subscribeToAuth(async (firebaseUser) => {
        if (firebaseUser) {
          const userObj = {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          };
          setUser(userObj);
          storage.saveUser(userObj);

          // PONYTAIL FIX: Zero Latency Login
          // 1. Tarik dari lokal dulu biar instan
          const localProfile = storage.getProfile();
          if (isProfileComplete(localProfile)) {
            setProfile(localProfile);
            if (view !== 'app') setView('app');
          }

          // 2. Background sync dari D1 & Firestore secara paralel (Biar loading screen cepet ilang)
          const [cfProfile, fsProfile] = await Promise.all([
            cloudflareDb.getProfile(firebaseUser.uid).catch(() => null),
            getProfileFromFirestore(firebaseUser.uid).catch(() => null)
          ]);
          let fetchedProfile = cfProfile || fsProfile;

          if (isProfileComplete(fetchedProfile)) {
            setProfile(fetchedProfile);
            storage.saveProfile(fetchedProfile);
            if (view !== 'app') setView('app'); // antisipasi kalo lokal kosong
          } else if (!isProfileComplete(localProfile)) {
            setProfile({
              name: firebaseUser.displayName || fetchedProfile?.name || '',
              age: fetchedProfile?.age || 0,
              height: fetchedProfile?.height || 0,
              weight: fetchedProfile?.weight || 0,
              gender: fetchedProfile?.gender || 'male',
            });
            setView('profile'); // maksa user isi data fisik jika D1 & lokal sama2 kosong
          }
        } else {
          setUser(null);
          const currentStoredUser = storage.getUser();
          const currentStoredProfile = storage.getProfile();
          if (currentStoredUser && isProfileComplete(currentStoredProfile)) {
            setUser(currentStoredUser);
            setProfile(currentStoredProfile);
            setView('app');
          } else {
            setView('auth');
          }
        }
        setAuthLoading(false);
      });

      return () => unsubscribe();
    } else {
      // mode lokal tanpa server
      if (storedUser && isProfileComplete(storedProfile)) {
        setUser(storedUser);
        setProfile(storedProfile);
        setView('app');
      } else if (storedUser) {
        setUser(storedUser);
        setView('profile');
      } else {
        setView('auth');
      }
      setAuthLoading(false);
    }
  }, []);

  // refresh data log & dengerin update dari db
  useEffect(() => {
    if (!isClient) return;

    let isMounted = true;

    async function loadLogs() {
      // PONYTAIL FIX: Zero Latency Load
      // Langsung munculin data dari localStorage secara instan!
      const localLogs = storage.getAllLogs(selectedDate);
      if (isMounted) setLogs(localLogs);

      if (user?.uid) {
        // Background sync dari D1
        const cfLogs = await cloudflareDb.getLogs(user.uid, selectedDate);
        if (cfLogs && isMounted) {
          // Hanya update state jika D1 punya data (mencegah UI blank karena D1 kosong)
          const hasD1Data = 
            cfLogs.activity.length > 0 || 
            cfLogs.diet.length > 0 || 
            cfLogs.sleep.length > 0 || 
            cfLogs.screentime.length > 0;
            
          if (hasD1Data) {
            setLogs(cfLogs);
            // Idealnya sync balik ke localStorage juga jika D1 punya data yg ga ada di lokal
            cfLogs.activity.forEach(a => storage.addActivity(a, selectedDate));
            cfLogs.diet.forEach(a => storage.addDiet(a, selectedDate));
            cfLogs.sleep.forEach(a => storage.addSleep(a, selectedDate));
            cfLogs.screentime.forEach(a => storage.addScreenTime(a, selectedDate));
          }
          return;
        }
      }

      // kalo d1 gagal, lari ke firestore
      if (isFirebaseConfigured && user?.uid) {
        const unsubscribe = subscribeToDateLogs(user.uid, selectedDate, (dateLogs) => {
          if (isMounted) setLogs(dateLogs);
        });
        return () => unsubscribe();
      }
    }

    loadLogs();

    return () => {
      isMounted = false;
    };
  }, [isClient, user?.uid, selectedDate]);

  const refreshLogs = useCallback(
    async (dateKey = selectedDate) => {
      if (user?.uid) {
        const cfLogs = await cloudflareDb.getLogs(user.uid, dateKey);
        if (cfLogs) {
          setLogs(cfLogs);
          return;
        }
      }
      const data = storage.getAllLogs(dateKey);
      setLogs(data);
    },
    [selectedDate, user?.uid]
  );

  // fungsi-fungsi login & daftar
  const handleGoogleLogin = async () => {
    try {
      const fbUser = await signInWithGoogle();
      if (fbUser) {
        const userObj = {
          id: fbUser.uid,
          uid: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName,
          photoURL: fbUser.photoURL,
        };
        setUser(userObj);
        storage.saveUser(userObj);

        // ngebut cek profil dari lokal dulu
        const localProfile = storage.getProfile();
        if (isProfileComplete(localProfile)) {
          setProfile(localProfile);
          setView('app');
          return;
        }

        // tarik profil dari db secara paralel (Biar 2x lebih cepet!)
        const [cfProfile, fsProfile] = await Promise.all([
          cloudflareDb.getProfile(fbUser.uid).catch(() => null),
          getProfileFromFirestore(fbUser.uid).catch(() => null)
        ]);
        const profileData = cfProfile || fsProfile;

        if (isProfileComplete(profileData)) {
          setProfile(profileData);
          storage.saveProfile(profileData);
          setView('app');
        } else {
          setProfile((prev) => ({
            ...prev,
            name: fbUser.displayName || prev.name || '',
          }));
          setView('profile'); // suruh ngisi umur, tinggi, berat dll
        }
      }
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      throw error;
    }
  };

  const handleEmailLogin = async (email, password) => {
    if (isFirebaseConfigured) {
      const fbUser = await signInWithEmail(email, password);
      if (fbUser) {
        const userObj = {
          id: fbUser.uid,
          uid: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName || email.split('@')[0],
          photoURL: fbUser.photoURL,
        };
        setUser(userObj);
        storage.saveUser(userObj);

        const localProfile = storage.getProfile();
        if (isProfileComplete(localProfile)) {
          setProfile(localProfile);
          setView('app');
          return;
        }

        // tarik profil dari db secara paralel
        const [cfProfile, fsProfile] = await Promise.all([
          cloudflareDb.getProfile(fbUser.uid).catch(() => null),
          getProfileFromFirestore(fbUser.uid).catch(() => null)
        ]);
        const profileData = cfProfile || fsProfile;

        if (isProfileComplete(profileData)) {
          setProfile(profileData);
          storage.saveProfile(profileData);
          setView('app');
        } else {
          setProfile((prev) => ({
            ...prev,
            name: profileData?.name || prev.name || email.split('@')[0],
          }));
          setView('profile'); // maksa ngisi data fisik
        }
      }
    } else {
      // mode lokal
      const newUser = {
        id: 'usr_' + Date.now(),
        uid: 'usr_' + Date.now(),
        email,
        createdAt: new Date().toISOString(),
      };
      storage.saveUser(newUser);
      setUser(newUser);
      const existingProfile = storage.getProfile();
      if (isProfileComplete(existingProfile)) {
        setProfile(existingProfile);
        setView('app');
      } else {
        setView('profile');
      }
    }
  };

  const handleEmailRegister = async (email, password) => {
    if (isFirebaseConfigured) {
      const fbUser = await registerWithEmail(email, password);
      if (fbUser) {
        const userObj = {
          id: fbUser.uid,
          uid: fbUser.uid,
          email: fbUser.email,
          name: email.split('@')[0],
          photoURL: fbUser.photoURL,
        };
        setUser(userObj);
        storage.saveUser(userObj);
        setProfile({
          name: email.split('@')[0],
          age: 0,
          height: 0,
          weight: 0,
          gender: 'male',
        });
        setView('profile'); // abis daftar wajib ngisi profil fisik
      }
    } else {
      handleEmailLogin(email, password);
    }
  };

  const handleLogout = async () => {
    try {
      if (isFirebaseConfigured) {
        await logOut();
      }
      setUser(null);
      storage.clearAll();
      setView('auth');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSaveProfile = async (newProfile) => {
    // 1. update di lokal dulu biar sat set ga pake loading
    const saved = storage.saveProfile(newProfile);
    setProfile(saved);
    setView('app');
    setIsEditProfileOpen(false);

    // 2. sinkron ke db di belakang layar
    if (user?.uid) {
      cloudflareDb.saveProfile(user.uid, saved).catch((err) => {
        console.warn('Background D1 profile save:', err);
      });

      if (isFirebaseConfigured) {
        saveProfileToFirestore(user.uid, saved).catch((err) => {
          console.warn('Background Firestore profile save:', err);
        });
      }
    }
  };

  const addLogItem = async (type, item, dateKey = selectedDate) => {
    // 1. simpen ke lokal & update UI seketika (no lelet)
    let record;
    if (type === 'activity') record = storage.addActivity(item, dateKey);
    else if (type === 'diet') record = storage.addDiet(item, dateKey);
    else if (type === 'sleep') record = storage.addSleep(item, dateKey);
    else if (type === 'screentime') record = storage.addScreenTime(item, dateKey);

    refreshLogs(dateKey);

    // 2. sinkron ke server diem-diem
    if (user?.uid) {
      cloudflareDb.addLog(user.uid, type, item, dateKey).catch(() => {});
      if (isFirebaseConfigured) {
        addLogToFirestore(user.uid, type, item, dateKey).catch(() => {});
      }
    }

    return record;
  };

  const deleteLogItem = async (type, id, dateKey = selectedDate) => {
    // 1. hapus di lokal langsung ilang dari layar
    storage.deleteLog(type, id);
    refreshLogs(dateKey);

    // 2. hapus di server diem-diem
    if (user?.uid) {
      cloudflareDb.deleteLog(user.uid, id).catch(() => {});
      if (isFirebaseConfigured) {
        deleteLogFromFirestore(user.uid, id).catch(() => {});
      }
    }
  };

  // itung-itungan metrik harian
  const totalCal = logs.diet.reduce((acc, curr) => acc + (curr.cal || 0), 0);
  const totalBurned = logs.activity.reduce((acc, curr) => acc + (curr.cal || 0), 0);
  const netCalories = totalCal - totalBurned;
  const totalSteps = logs.activity.reduce((acc, curr) => acc + (curr.steps || 0), 0);
  const totalDistance = logs.activity.reduce((acc, curr) => acc + (curr.dist || 0), 0);
  const lastSleep = logs.sleep[0]?.duration || '0j 0m';
  const totalScreenMinutes = logs.screentime.reduce((acc, curr) => acc + (curr.minutes || 0), 0);
  const formattedScreenTime = `${Math.floor(totalScreenMinutes / 60)}j ${totalScreenMinutes % 60}m`;

  const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.gender);
  const tdee = calculateTDEE(bmr);
  const bmiData = calculateBMI(profile.weight, profile.height);
  const waterTarget = calculateWaterTargetLiters(profile.weight, totalBurned);

  // analisa kesehatan pakai AI
  const runHealthAnalysis = async () => {
    setIsAnalyzingHealth(true);
    const userContext = `Nama: ${profile.name}, Usia: ${profile.age}, Tinggi: ${profile.height}cm, Berat: ${profile.weight}kg, BMI: ${bmiData.bmi} (${bmiData.category})`;

    const recentFood =
      logs.diet.map((f) => `${f.name} (${f.cal} kkal)`).join(', ') || 'Belum ada catatan makan';
    const recentActivity =
      logs.activity
        .map((a) => `${a.name} (${a.steps || 0} langkah, ${a.cal} kkal)`)
        .join(', ') || 'Belum ada aktivitas fisik';
    const recentSleep = logs.sleep[0]
      ? `${logs.sleep[0].duration} (${logs.sleep[0].quality})`
      : 'Belum tercatat';
    const recentScreen =
      logs.screentime.map((s) => `${s.app} (${s.duration})`).join(', ') || 'Normal';

    const prompt = `
      Analisis Kesehatan Komprehensif Hari Ini:
      - Profil Fisik: ${userContext}
      - Total Kalori Masuk: ${totalCal} kkal (${recentFood})
      - Total Kalori Bakar: ${totalBurned} kkal (${recentActivity})
      - Kalori Bersih (Net): ${netCalories} kkal
      - Total Langkah: ${totalSteps}
      - Tidur: ${recentSleep}
      - Screen Time: ${recentScreen}

      Format JSON Wajib:
      {
        "score": 85,
        "risk": "Rendah",
        "analysis": "Poin analisis kondisi fisik dan metabolisme (maksimal 2 kalimat padat).",
        "dietAdvice": "Saran nutrisi spesifik (maksimal 2 kalimat).",
        "sleepAdvice": "Saran pemulihan dan istirahat (maksimal 2 kalimat)."
      }
    `;

    try {
      const response = await callGeminiAPI(prompt, userContext);
      if (response) {
        const clean = response.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(clean);
        setHealthReport(parsed);
        storage.saveInsight(parsed, selectedDate);
        if (user?.uid) {
          cloudflareDb.saveInsight(user.uid, selectedDate, parsed).catch(() => {});
        }
      } else {
        const fallback = {
          score: Math.min(
            100,
            Math.max(
              30,
              60 + Math.floor(totalSteps / 500) - (netCalories > 500 ? 15 : 0)
            )
          ),
          risk: netCalories > 700 && totalSteps < 4000 ? 'Sedang' : 'Rendah',
          analysis:
            'Keseimbangan energi harian terpantau baik. Pertahankan target langkah aktif.',
          dietAdvice:
            'Cukupi asupan protein bersih dan hidrasi harian minimal 2.5 liter.',
          sleepAdvice:
            'Usahakan tidur teratur minimal 7 jam untuk pemulihan otot optimal.',
        };
        setHealthReport(fallback);
        storage.saveInsight(fallback, selectedDate);
        if (user?.uid) {
          cloudflareDb.saveInsight(user.uid, selectedDate, fallback).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzingHealth(false);
      setIsHealthReportOpen(true);
    }
  };

  return (
    <AppContext.Provider
      value={{
        isClient,
        authLoading,
        selectedDate,
        setSelectedDate,
        activeTab,
        setActiveTab,
        user,
        profile,
        view,
        setView,
        showIntro,
        setShowIntro,
        handleGoogleLogin,
        handleEmailLogin,
        handleEmailRegister,
        handleLogout,
        handleSaveProfile,
        logs,
        refreshLogs,
        addLogItem,
        deleteLogItem,
        totalCal,
        totalBurned,
        netCalories,
        totalSteps,
        totalDistance,
        lastSleep,
        formattedScreenTime,
        bmr,
        tdee,
        bmiData,
        waterTarget,
        isAddModalOpen,
        setIsAddModalOpen,
        isEditProfileOpen,
        setIsEditProfileOpen,
        isHealthReportOpen,
        setIsHealthReportOpen,
        healthReport,
        isAnalyzingHealth,
        runHealthAnalysis,
        isFirebaseConfigured,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
