'use client';

import React from 'react';
import {
  Calendar,
  User,
  Edit2,
  ChevronRight,
  Activity,
  MapPin,
  Moon,
  Smartphone,
  Flame,
  ShieldCheck,
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import LogItem from '../logs/LogItem';

export default function HomeScreen() {
  const {
    profile,
    logs,
    totalCal,
    totalBurned,
    netCalories,
    totalSteps,
    totalDistance,
    lastSleep,
    formattedScreenTime,
    waterTarget,
    bmr,
    tdee,
    runHealthAnalysis,
    isAnalyzingHealth,
    setIsEditProfileOpen,
    setActiveTab,
    deleteLogItem,
  } = useApp();

  // Progress percentages (capped at 100)
  const stepProgress = Math.min(100, Math.round((totalSteps / 10000) * 100));
  const calRatio = tdee > 0 ? Math.min(100, Math.max(5, Math.round((totalCal / tdee) * 100))) : 40;

  return (
    <div className="animate-fade-in pb-32">
      {/* Top Bar with Profile & Calendar Trigger */}
      <div className="flex justify-between items-center mb-5 pt-1">
        <button
          onClick={() => setIsEditProfileOpen(true)}
          className="flex items-center gap-3 hover:opacity-90 transition-opacity text-left group"
        >
          <div className="w-12 h-12 bg-blue-950 text-white rounded-2xl border-2 border-blue-950 shadow-sm flex items-center justify-center relative shrink-0">
            <User size={20} className="text-white" />
            <div className="absolute -bottom-1 -right-1 bg-white text-blue-950 rounded-full p-0.5 border border-slate-200">
              <Edit2 size={10} />
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Profile
            </span>
            <h2 className="text-blue-950 font-black text-lg italic tracking-tight leading-tight">
              {profile.name || 'Pengguna'}
            </h2>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          title="Lihat Riwayat Kalender"
          className="h-10 px-3.5 border-2 border-slate-200 bg-white rounded-2xl flex items-center gap-2 hover:border-blue-950 shadow-sm transition-colors text-blue-950 font-bold text-xs"
        >
          <Calendar size={15} />
          <span className="hidden sm:inline">Riwayat</span>
        </button>
      </div>

      {/* Main Energy & Net Calories Hero Card */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm mb-5 relative">
        <div className="text-center py-2">
          <div className="inline-block relative">
            <h1 className="text-7xl font-black text-blue-950 tracking-tight italic">
              {netCalories.toLocaleString()}
            </h1>
            <span className="text-xs font-bold text-slate-400 block -mt-1 uppercase tracking-wider">
              Kkal Tersisa
            </span>
          </div>
        </div>

        {/* Caloric Progress Bar */}
        <div className="my-4">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
            <span>Progress Asupan Energi</span>
            <span className="text-blue-950">{calRatio}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
            <div
              className="bg-blue-950 h-full rounded-full transition-all duration-500"
              style={{ width: `${calRatio}%` }}
            ></div>
          </div>
        </div>

        {/* Dual Masuk vs Bakar Cards without inner fill */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-950 text-white">
                <ArrowDownLeft size={14} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Masuk</span>
                <span className="text-sm font-black text-blue-950">{totalCal} kkal</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-950 text-white">
                <ArrowUpRight size={14} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Bakar</span>
                <span className="text-sm font-black text-blue-950">{totalBurned} kkal</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Biometric Badges */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">BMR Statis</span>
            <span className="text-xs font-black text-blue-950">{bmr} kkal</span>
          </div>
          <div className="text-center border-x border-slate-100">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">TDEE Harian</span>
            <span className="text-xs font-black text-blue-950">{tdee} kkal</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Air Target</span>
            <span className="text-xs font-black text-blue-950">{waterTarget} L</span>
          </div>
        </div>
      </div>

      {/* Health Evaluation Card (Placed below Energy Hero with Rotating Light-to-Deep Blue Gradient Outline) */}
      <div className="relative p-[2.5px] rounded-3xl overflow-hidden mb-6 shadow-sm">
        {/* Animated Rotating Gradient Border */}
        <div className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,_#38bdf8_0deg,_#2563eb_90deg,_#0f172a_180deg,_#1e3a8a_270deg,_#38bdf8_360deg)] animate-[spin_4s_linear_infinite]" />

        {/* Inner Solid White Card */}
        <button
          onClick={runHealthAnalysis}
          disabled={isAnalyzingHealth}
          className="relative z-10 w-full bg-white hover:bg-slate-50 text-blue-950 px-6 py-5 rounded-[22px] transition-colors text-left flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-blue-950 text-white p-3.5 rounded-2xl shrink-0 shadow-sm">
              {isAnalyzingHealth ? (
                <Loader2 size={24} className="text-white animate-spin" />
              ) : (
                <ShieldCheck size={24} className="text-white" />
              )}
            </div>
            <div className="text-left">
              <p className="font-black text-blue-950 text-sm uppercase italic tracking-wider">
                {isAnalyzingHealth ? 'MENGANALISIS DATA...' : 'ANALISIS KESEHATAN'}
              </p>
            </div>
          </div>
          {!isAnalyzingHealth && (
            <div className="bg-slate-100 group-hover:bg-blue-950 group-hover:text-white text-blue-950 p-2 rounded-xl transition-colors">
              <ChevronRight size={16} />
            </div>
          )}
        </button>
      </div>

      {/* 4 Activity Metric Cards */}
      <div className="mb-6">
        <div className="flex justify-between items-center px-1 mb-3">
          <h3 className="text-xs font-black text-blue-950 italic uppercase tracking-wider">
            Metrik Aktivitas Harian
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Card Langkah */}
          <div
            onClick={() => setActiveTab('activity')}
            className="bg-white p-4 rounded-3xl border-2 border-slate-200 hover:border-blue-950 transition-all cursor-pointer shadow-sm group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-slate-100 text-blue-950 group-hover:bg-blue-950 group-hover:text-white transition-colors">
                <Activity size={16} />
              </div>
              <span className="text-[10px] font-bold text-slate-400">{stepProgress}%</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Langkah</span>
            <p className="text-2xl font-black text-blue-950 italic leading-tight my-0.5">
              {totalSteps.toLocaleString()}
            </p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-blue-950 h-full rounded-full" style={{ width: `${stepProgress}%` }}></div>
            </div>
          </div>

          {/* Card Jarak */}
          <div
            onClick={() => setActiveTab('activity')}
            className="bg-white p-4 rounded-3xl border-2 border-slate-200 hover:border-blue-950 transition-all cursor-pointer shadow-sm group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-slate-100 text-blue-950 group-hover:bg-blue-950 group-hover:text-white transition-colors">
                <MapPin size={16} />
              </div>
              <span className="text-[10px] font-bold text-slate-400">Jarak</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Tempuh</span>
            <p className="text-2xl font-black text-blue-950 italic leading-tight my-0.5">
              {totalDistance.toFixed(1)} <span className="text-xs not-italic font-medium text-slate-400">km</span>
            </p>
          </div>

          {/* Card Tidur */}
          <div
            onClick={() => setActiveTab('sleep')}
            className="bg-white p-4 rounded-3xl border-2 border-slate-200 hover:border-blue-950 transition-all cursor-pointer shadow-sm group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-slate-100 text-blue-950 group-hover:bg-blue-950 group-hover:text-white transition-colors">
                <Moon size={16} />
              </div>
              <span className="text-[10px] font-bold text-slate-400">Tidur</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Durasi Istirahat</span>
            <p className="text-2xl font-black text-blue-950 italic leading-tight my-0.5">{lastSleep}</p>
          </div>

          {/* Card Screen Time */}
          <div
            onClick={() => setActiveTab('screentime')}
            className="bg-white p-4 rounded-3xl border-2 border-slate-200 hover:border-blue-950 transition-all cursor-pointer shadow-sm group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-slate-100 text-blue-950 group-hover:bg-blue-950 group-hover:text-white transition-colors">
                <Smartphone size={16} />
              </div>
              <span className="text-[10px] font-bold text-slate-400">Layar</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Screen Time</span>
            <p className="text-2xl font-black text-blue-950 italic leading-tight my-0.5">{formattedScreenTime}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity List */}
      <div>
        <div className="flex justify-between items-center px-1 mb-3">
          <h3 className="text-xs font-black text-blue-950 italic uppercase tracking-wider">Aktivitas Terkini</h3>
        </div>

        <div className="space-y-2">
          {logs.activity.length === 0 && logs.diet.length === 0 ? (
            <div className="text-center p-6 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 font-medium text-xs">
              Belum ada aktivitas atau makanan tercatat hari ini. Tekan tombol{' '}
              <span className="font-bold text-blue-950">+</span> untuk mulai mencatat.
            </div>
          ) : (
            <>
              {logs.activity.slice(0, 2).map((act) => (
                <LogItem
                  key={act.id}
                  title={act.name}
                  subtitle={act.time || 'Hari Ini'}
                  value={`${act.cal} Kkal`}
                  icon={Activity}
                  onDelete={() => deleteLogItem('activity', act.id)}
                />
              ))}
              {logs.diet.slice(0, 2).map((food) => (
                <LogItem
                  key={food.id}
                  title={food.name}
                  subtitle={food.time || 'Makan'}
                  value={`${food.cal} Kkal`}
                  icon={Flame}
                  onDelete={() => deleteLogItem('diet', food.id)}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
