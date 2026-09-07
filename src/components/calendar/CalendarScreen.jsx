'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Activity,
  Utensils,
  Moon,
  Smartphone,
  Calendar as CalendarIcon,
  Plus,
} from 'lucide-react';
import { storage, formatDateKey, getTodayKey } from '@/services/storage';
import { useApp } from '@/context/AppContext';
import LogItem from '../logs/LogItem';

export default function CalendarScreen() {
  const { setSelectedDate, deleteLogItem, setIsAddModalOpen } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeDayKey, setActiveDayKey] = useState(getTodayKey());
  const [filterCategory, setFilterCategory] = useState('all'); // 'all' | 'diet' | 'activity' | 'sleep' | 'screentime'

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const dayHeaders = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];

  // Historical data metadata
  const loggedDatesMap = storage.getAllLoggedDates();
  const accountStartDate = storage.getAccountStartDate();
  const streakDays = storage.getDailyStreak();
  const totalLogsCount = storage.getTotalLogCount();

  // Today & Selected Day Summaries
  const todayKey = getTodayKey();
  const daySummary = storage.getDaySummary(activeDayKey);

  const onSelectDay = (day) => {
    const key = formatDateKey(year, month, day);
    setActiveDayKey(key);
    setSelectedDate(key);
  };

  // Format readable Indonesian Date
  const formatReadableDate = (key) => {
    if (!key) return '';
    const [y, m, d] = key.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return `${dayNames[dateObj.getDay()]}, ${d} ${monthNames[m - 1]} ${y}`;
  };

  // Filter logs for selected day
  const filteredLogs = useMemo(() => {
    const l = daySummary.logs;
    const items = [];
    if (filterCategory === 'all' || filterCategory === 'diet') {
      l.diet.forEach((item) => items.push({ ...item, category: 'diet', icon: Utensils, subtitle: item.time || 'Pola Makan', valText: `${item.cal} Kkal` }));
    }
    if (filterCategory === 'all' || filterCategory === 'activity') {
      l.activity.forEach((item) => items.push({ ...item, category: 'activity', icon: Activity, subtitle: item.time || 'Latihan', valText: `${item.cal} Kkal` }));
    }
    if (filterCategory === 'all' || filterCategory === 'sleep') {
      l.sleep.forEach((item) => items.push({ ...item, category: 'sleep', icon: Moon, subtitle: 'Tidur & Pemulihan', valText: item.duration, title: `${item.quality || 'Tidur'}` }));
    }
    if (filterCategory === 'all' || filterCategory === 'screentime') {
      l.screentime.forEach((item) => items.push({ ...item, category: 'screentime', icon: Smartphone, subtitle: 'Screen Time', valText: item.duration, title: item.app || 'Layar' }));
    }
    return items;
  }, [daySummary, filterCategory]);

  return (
    <div className="pb-32 pt-2">
      {/* Page Title */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Timeline Kesehatan
          </span>
          <h1 className="text-blue-950 text-2xl font-black italic uppercase tracking-wider">
            Riwayat Harian
          </h1>
        </div>

        <button
          onClick={() => {
            setSelectedDate(activeDayKey);
            setIsAddModalOpen(true);
          }}
          className="bg-blue-950 text-white font-black text-xs px-3.5 py-2 rounded-2xl flex items-center gap-1.5 hover:bg-blue-900 transition-colors shadow-xs"
        >
          <Plus size={15} />
          <span>Log</span>
        </button>
      </div>

      {/* Account Journey Stats Card */}
      <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100">
          <div>
            <h3 className="text-blue-950 font-black text-sm uppercase tracking-wider">
              Perjalanan Akunmu
            </h3>
          </div>
          <span className="text-[10px] font-bold bg-slate-100 px-2.5 py-1 rounded-full text-slate-600 border border-slate-200">
            Mulai: {accountStartDate}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
              Streak Aktif
            </span>
            <span className="text-base font-black text-blue-950 block">
              {streakDays} Hari
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
              Total Log
            </span>
            <span className="text-base font-black text-blue-950 block">
              {totalLogsCount}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
              Hari Tercatat
            </span>
            <span className="text-base font-black text-blue-950 block">
              {Object.keys(loggedDatesMap).length}
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm mb-5">
        {/* Month Navigation */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-slate-100 rounded-full text-blue-950 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-blue-950 font-black text-sm uppercase tracking-wider">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-slate-100 rounded-full text-blue-950 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {dayHeaders.map((d, i) => (
            <span key={i} className="text-xs font-bold text-slate-400">
              {d}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-11 w-full" />
          ))}

          {days.map((day) => {
            const thisDayKey = formatDateKey(year, month, day);
            const isSelected = activeDayKey === thisDayKey;
            const isToday = thisDayKey === todayKey;
            const meta = loggedDatesMap[thisDayKey];
            const hasData = Boolean(meta && meta.total > 0);

            return (
              <button
                key={day}
                onClick={() => onSelectDay(day)}
                className={`h-11 w-full rounded-2xl flex flex-col items-center justify-center text-xs font-bold transition-all relative ${
                  isSelected
                    ? 'bg-blue-950 text-white shadow-xs'
                    : hasData
                    ? 'bg-blue-50/60 text-blue-950 hover:bg-blue-100/60 border border-blue-200/50'
                    : 'text-slate-700 hover:bg-slate-100'
                } ${isToday && !isSelected ? 'border-2 border-blue-950' : ''}`}
              >
                <span>{day}</span>

                {/* Activity Dots */}
                {hasData && (
                  <div className="flex gap-0.5 mt-0.5">
                    {meta.diet > 0 && (
                      <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-emerald-500'}`} />
                    )}
                    {meta.activity > 0 && (
                      <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-blue-300' : 'bg-blue-600'}`} />
                    )}
                    {meta.sleep > 0 && (
                      <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-purple-300' : 'bg-purple-500'}`} />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Section */}
      <div className="space-y-4">
        <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm">
          {/* Header Date & Score */}
          <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                {activeDayKey === todayKey ? 'Hari Ini' : 'Detail Riwayat'}
              </p>
              <h3 className="text-blue-950 font-black text-base">
                {formatReadableDate(activeDayKey)}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-blue-950">{daySummary.score}</span>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Skor Fisik</p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Kalori Masuk</span>
              <span className="text-base font-black text-blue-950">{daySummary.totalCal} kkal</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Kalori Terbakar</span>
              <span className="text-base font-black text-blue-950">{daySummary.totalBurned} kkal</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Langkah</span>
              <span className="text-base font-black text-blue-950">{daySummary.totalSteps.toLocaleString()}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Tidur</span>
              <span className="text-base font-black text-blue-950">{daySummary.sleepDuration}</span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide pb-1">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'diet', label: 'Pola Makan' },
              { id: 'activity', label: 'Latihan' },
              { id: 'sleep', label: 'Tidur' },
              { id: 'screentime', label: 'Screen Time' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterCategory(tab.id)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors shrink-0 ${
                  filterCategory === tab.id
                    ? 'bg-blue-950 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-blue-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Logs List */}
          <div className="space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-4">
                <CalendarIcon size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 text-xs font-bold">
                  Belum ada log {filterCategory !== 'all' ? `kategori ini` : ''} di tanggal ini
                </p>
                <button
                  onClick={() => {
                    setSelectedDate(activeDayKey);
                    setIsAddModalOpen(true);
                  }}
                  className="mt-3 text-xs font-black text-blue-950 bg-white px-4 py-2 rounded-xl border border-slate-200 hover:border-blue-950 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus size={14} />
                  <span>Catat Aktivitas Sekarang</span>
                </button>
              </div>
            ) : (
              filteredLogs.map((item) => (
                <LogItem
                  key={item.id}
                  title={item.title || item.name}
                  subtitle={item.subtitle}
                  value={item.valText}
                  icon={item.icon}
                  onDelete={() => deleteLogItem(item.category, item.id, activeDayKey)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

