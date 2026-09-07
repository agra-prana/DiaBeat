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

// Helper to verify if user has filled all essential physical biometric metrics
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

  // Auth & View
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: '', age: 0, height: 0, weight: 0 });
  const [view, setView] = useState('auth'); // 'auth' | 'profile' | 'app'
  const [showIntro, setShowIntro] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isHealthReportOpen, setIsHealthReportOpen] = useState(false);
  const [healthReport, setHealthReport] = useState(null);
  const [isAnalyzingHealth, setIsAnalyzingHealth] = useState(false);

  // Real Production Logs (Clean Initial State)
  const [logs, setLogs] = useState({
    activity: [],
    diet: [],
    sleep: [],
    screentime: [],
  });

  // Load initial data on client mount, initialize Cloudflare DB & listen to Auth
  useEffect(() => {
    setIsClient(true);

    // Initialize Cloudflare D1 tables if configured
    cloudflareDb.init().catch(() => {});

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

          // 1. Try fetching profile from Cloudflare D1 first
          let fetchedProfile = await cloudflareDb.getProfile(firebaseUser.uid);
          
          // 2. Fallback to Firestore if D1 returns empty
          if (!fetchedProfile) {
            fetchedProfile = await getProfileFromFirestore(firebaseUser.uid);
          }

          if (isProfileComplete(fetchedProfile)) {
            setProfile(fetchedProfile);
            storage.saveProfile(fetchedProfile);
            setView('app');
          } else {
            const fallbackProfile = storage.getProfile();
            if (isProfileComplete(fallbackProfile)) {
              setProfile(fallbackProfile);
              setView('app');
            } else {
              setProfile({
                name: firebaseUser.displayName || fetchedProfile?.name || '',
                age: fetchedProfile?.age || 0,
                height: fetchedProfile?.height || 0,
                weight: fetchedProfile?.weight || 0,
                gender: fetchedProfile?.gender || 'male',
              });
              setView('profile'); // Force onboarding for physical data
            }
          }
        } else {
          setUser(null);
          const storedUser = storage.getUser();
          const storedProfile = storage.getProfile();
          if (storedUser && isProfileComplete(storedProfile)) {
            setUser(storedUser);
            setProfile(storedProfile);
            setView('app');
          } else {
            setView('auth');
          }
        }
        setAuthLoading(false);
      });

      return () => unsubscribe();
    } else {
      // Local fallback mode
      const storedUser = storage.getUser();
      const storedProfile = storage.getProfile();
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

  // Reload logs / subscribe to Cloudflare D1 / Firestore logs
  useEffect(() => {
    if (!isClient) return;

    let isMounted = true;

    async function loadLogs() {
      if (user?.uid) {
        // Try Cloudflare D1 logs
        const cfLogs = await cloudflareDb.getLogs(user.uid, selectedDate);
        if (cfLogs && isMounted) {
          setLogs(cfLogs);
          return;
        }
      }

      // Firestore or local storage fallback
      if (isFirebaseConfigured && user?.uid) {
        const unsubscribe = subscribeToDateLogs(user.uid, selectedDate, (dateLogs) => {
          if (isMounted) setLogs(dateLogs);
        });
        return () => unsubscribe();
      } else {
        const currentLogs = storage.getAllLogs(selectedDate);
        if (isMounted) setLogs(currentLogs);
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

  // Authentication Actions
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

        // Fast check local storage profile first
        const localProfile = storage.getProfile();
        if (isProfileComplete(localProfile)) {
          setProfile(localProfile);
          setView('app');
          return;
        }

        // Fetch profile from Cloudflare D1 or Firestore
        let profileData = await cloudflareDb.getProfile(fbUser.uid);
        if (!profileData) {
          profileData = await getProfileFromFirestore(fbUser.uid);
        }

        if (isProfileComplete(profileData)) {
          setProfile(profileData);
          storage.saveProfile(profileData);
          setView('app');
        } else {
          setProfile((prev) => ({
            ...prev,
            name: fbUser.displayName || prev.name || '',
          }));
          setView('profile'); // Ask for age, height, weight etc.
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

        let profileData = await cloudflareDb.getProfile(fbUser.uid);
        if (!profileData) {
          profileData = await getProfileFromFirestore(fbUser.uid);
        }

        if (isProfileComplete(profileData)) {
          setProfile(profileData);
          storage.saveProfile(profileData);
          setView('app');
        } else {
          setProfile((prev) => ({
            ...prev,
            name: profileData?.name || prev.name || email.split('@')[0],
          }));
          setView('profile'); // Force asking physical data
        }
      }
    } else {
      // Local fallback
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
        setView('profile'); // Always ask for physical metrics on register
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
    // 1. Instant optimistic local update (No lag / no UI lock)
    const saved = storage.saveProfile(newProfile);
    setProfile(saved);
    setView('app');
    setIsEditProfileOpen(false);

    // 2. Background async sync to databases
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
    // 1. Save locally & refresh UI immediately (Zero latency)
    let record;
    if (type === 'activity') record = storage.addActivity(item, dateKey);
    else if (type === 'diet') record = storage.addDiet(item, dateKey);
    else if (type === 'sleep') record = storage.addSleep(item, dateKey);
    else if (type === 'screentime') record = storage.addScreenTime(item, dateKey);

    refreshLogs(dateKey);

    // 2. Background sync to Cloudflare D1 & Firestore
    if (user?.uid) {
      cloudflareDb.addLog(user.uid, type, item, dateKey).catch(() => {});
      if (isFirebaseConfigured) {
        addLogToFirestore(user.uid, type, item, dateKey).catch(() => {});
      }
    }

    return record;
  };

  const deleteLogItem = async (type, id, dateKey = selectedDate) => {
    // 1. Instant local deletion & UI update
    storage.deleteLog(type, id);
    refreshLogs(dateKey);

    // 2. Background sync to Cloudflare D1 & Firestore
    if (user?.uid) {
      cloudflareDb.deleteLog(user.uid, id).catch(() => {});
      if (isFirebaseConfigured) {
        deleteLogFromFirestore(user.uid, id).catch(() => {});
      }
    }
  };

  // Real Metrics Calculations
  const totalCal = logs.diet.reduce((acc, curr) => acc + (curr.cal || 0), 0);
  const totalBurned = logs.activity.reduce((acc, curr) => acc + (curr.cal || 0), 0);
  const netCalories = totalCal - totalBurned;
  const totalSteps = logs.activity.reduce((acc, curr) => acc + (curr.steps || 0), 0);
  const totalDistance = logs.activity.reduce(
    (acc, curr) => acc + (curr.dist || (curr.steps ? curr.steps * 0.0007 : 0)),
    0
  );
  const lastSleep = logs.sleep[0]?.duration || '0j 0m';
  const totalScreenMinutes = logs.screentime.reduce((acc, curr) => acc + (curr.minutes || 0), 0);
  const formattedScreenTime = `${Math.floor(totalScreenMinutes / 60)}j ${totalScreenMinutes % 60}m`;

  const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.gender);
  const tdee = calculateTDEE(bmr);
  const bmiData = calculateBMI(profile.weight, profile.height);
  const waterTarget = calculateWaterTargetLiters(profile.weight, totalBurned);

  // Health Assessment Analysis
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
