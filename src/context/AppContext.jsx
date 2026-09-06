'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage, getTodayKey } from '@/services/storage';
import {
  isFirebaseConfigured,
  subscribeToAuth,
  signInWithGoogle,
  logOut,
  saveProfileToFirestore,
  getProfileFromFirestore,
  addLogToFirestore,
  deleteLogFromFirestore,
  subscribeToDateLogs,
} from '@/services/firebase';
import {
  calculateBMR,
  calculateTDEE,
  calculateBMI,
  calculateWaterTargetLiters,
} from '@/services/healthEngine';
import { callGeminiAPI } from '@/services/gemini';

const AppContext = createContext(null);

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

  // Load initial data on client mount and listen to Firebase Auth
  useEffect(() => {
    setIsClient(true);

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

          // Fetch profile from Firestore
          const firestoreProfile = await getProfileFromFirestore(firebaseUser.uid);
          if (firestoreProfile && firestoreProfile.name) {
            setProfile(firestoreProfile);
            storage.saveProfile(firestoreProfile);
            setView('app');
          } else {
            const fallbackProfile = storage.getProfile();
            if (fallbackProfile && fallbackProfile.name) {
              setProfile(fallbackProfile);
              setView('app');
            } else {
              setProfile({
                name: firebaseUser.displayName || '',
                age: 0,
                height: 0,
                weight: 0,
              });
              setView('profile');
            }
          }
        } else {
          setUser(null);
          // Check local user if offline
          const storedUser = storage.getUser();
          const storedProfile = storage.getProfile();
          if (storedUser && storedProfile && storedProfile.name) {
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
      if (storedUser && storedProfile && storedProfile.name) {
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

  // Reload logs / subscribe to Firestore logs when user or selectedDate changes
  useEffect(() => {
    if (!isClient) return;

    if (isFirebaseConfigured && user?.uid) {
      const unsubscribe = subscribeToDateLogs(user.uid, selectedDate, (dateLogs) => {
        setLogs(dateLogs);
      });
      return () => unsubscribe();
    } else {
      const currentLogs = storage.getAllLogs(selectedDate);
      setLogs(currentLogs);
    }
  }, [isClient, user?.uid, selectedDate]);

  const refreshLogs = useCallback(
    (dateKey = selectedDate) => {
      if (!isFirebaseConfigured || !user?.uid) {
        const data = storage.getAllLogs(dateKey);
        setLogs(data);
      }
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

        const profileData = await getProfileFromFirestore(fbUser.uid);
        if (profileData && profileData.name) {
          setProfile(profileData);
          setView('app');
        } else {
          setProfile((prev) => ({
            ...prev,
            name: fbUser.displayName || prev.name || '',
          }));
          setView('profile');
        }
      }
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      throw error;
    }
  };

  const handleEmailLogin = (email) => {
    const newUser = {
      id: 'usr_' + Date.now(),
      uid: 'usr_' + Date.now(),
      email,
      createdAt: new Date().toISOString(),
    };
    storage.saveUser(newUser);
    setUser(newUser);
    const existingProfile = storage.getProfile();
    if (existingProfile && existingProfile.name) {
      setProfile(existingProfile);
      setView('app');
    } else {
      setView('profile');
    }
  };

  const handleLogout = async () => {
    try {
      if (isFirebaseConfigured) {
        await logOut();
      }
      setUser(null);
      setView('auth');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSaveProfile = async (newProfile) => {
    const saved = storage.saveProfile(newProfile);
    setProfile(saved);

    if (isFirebaseConfigured && user?.uid) {
      try {
        await saveProfileToFirestore(user.uid, saved);
      } catch (err) {
        console.warn('Firestore profile save warning:', err);
      }
    }

    setView('app');
    setIsEditProfileOpen(false);
  };

  const addLogItem = async (type, item, dateKey = selectedDate) => {
    // 1. Save locally for instant UI response
    let record;
    if (type === 'activity') record = storage.addActivity(item, dateKey);
    else if (type === 'diet') record = storage.addDiet(item, dateKey);
    else if (type === 'sleep') record = storage.addSleep(item, dateKey);
    else if (type === 'screentime') record = storage.addScreenTime(item, dateKey);

    // 2. Sync to Firestore in real-time
    if (isFirebaseConfigured && user?.uid) {
      try {
        await addLogToFirestore(user.uid, type, item, dateKey);
      } catch (err) {
        console.warn('Firestore add log error:', err);
      }
    } else {
      refreshLogs(dateKey);
    }

    return record;
  };

  const deleteLogItem = async (type, id, dateKey = selectedDate) => {
    storage.deleteLog(type, id);

    if (isFirebaseConfigured && user?.uid) {
      try {
        await deleteLogFromFirestore(user.uid, id);
      } catch (err) {
        console.warn('Firestore delete log error:', err);
      }
    } else {
      refreshLogs(dateKey);
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
        handleLogin: handleEmailLogin,
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
