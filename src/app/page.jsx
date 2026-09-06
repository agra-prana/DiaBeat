'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import IntroScreen from '@/components/auth/IntroScreen';
import AuthScreen from '@/components/auth/AuthScreen';
import ProfileModal from '@/components/modals/ProfileModal';
import HomeScreen from '@/components/dashboard/HomeScreen';
import ActivityScreen from '@/components/logs/ActivityScreen';
import DietScreen from '@/components/logs/DietScreen';
import SleepScreen from '@/components/logs/SleepScreen';
import ScreenTimeScreen from '@/components/logs/ScreenTimeScreen';
import CalendarScreen from '@/components/calendar/CalendarScreen';
import BottomNavigation from '@/components/layout/BottomNavigation';
import QuickAddModal from '@/components/modals/QuickAddModal';
import HealthReportModal from '@/components/modals/HealthReportModal';

export default function MainPage() {
  const {
    isClient,
    view,
    showIntro,
    setShowIntro,
    activeTab,
    isAddModalOpen,
    setIsAddModalOpen,
    isEditProfileOpen,
    setIsEditProfileOpen,
    isHealthReportOpen,
    setIsHealthReportOpen,
    healthReport,
  } = useApp();

  // Prevent SSR flash until hydration completes
  if (!isClient) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-3xl font-black italic tracking-tighter text-blue-950">
          DiaBeat
        </div>
      </div>
    );
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'activity':
        return <ActivityScreen />;
      case 'diet':
        return <DietScreen />;
      case 'sleep':
        return <SleepScreen />;
      case 'screentime':
        return <ScreenTimeScreen />;
      case 'calendar':
        return <CalendarScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/25 to-slate-200/50 text-blue-950 font-sans selection:bg-blue-950 selection:text-white">
      <div className="max-w-md mx-auto min-h-screen relative z-10 bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9]/80 to-[#f8fafc] shadow-2xl border-x border-slate-200/80">
        {/* Intro Overlay */}
        {showIntro && <IntroScreen onFinish={() => setShowIntro(false)} />}

        {/* Auth / Onboarding / Main Views */}
        {view === 'auth' && <AuthScreen />}
        {view === 'profile' && <ProfileModal isModal={false} />}
        {view === 'app' && (
          <>
            <div className="p-5">{renderActiveScreen()}</div>

            {/* Bottom Navigation */}
            <BottomNavigation />

            {/* Modals & Dialogs */}
            <QuickAddModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
            />

            <HealthReportModal
              report={healthReport}
              isOpen={isHealthReportOpen}
              onClose={() => setIsHealthReportOpen(false)}
            />

            {isEditProfileOpen && (
              <ProfileModal
                isModal={true}
                onClose={() => setIsEditProfileOpen(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
