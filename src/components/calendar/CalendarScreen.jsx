'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Activity, Utensils, Moon, Smartphone } from 'lucide-react';
import { storage, formatDateKey, getTodayKey } from '@/services/storage';
import { useApp } from '@/context/AppContext';
import LogItem from '../logs/LogItem';

export default function CalendarScreen() {
  const { setSelectedDate } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeDayKey, setActiveDayKey] = useState(getTodayKey());

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

  const daySummary = storage.getDaySummary(activeDayKey);

  const onSelectDay = (day) => {
    const key = formatDateKey(year, month, day);
    setActiveDayKey(key);
    setSelectedDate(key);
  };

  return (
    <div className="animate-fade-in pb-32 pt-2">
      <h1 className="text-blue-950 text-2xl font-black mb-5 italic uppercase tracking-wider">Riwayat Harian</h1>

      <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm mb-5">
        <div className="flex justify-between items-center mb-5">
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

        <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
          {dayHeaders.map((d, i) => (
            <span key={i} className="text-xs font-bold text-slate-400">
              {d}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-9 w-9"></div>
          ))}

          {days.map((day) => {
            const thisDayKey = formatDateKey(year, month, day);
            const isSelected = activeDayKey === thisDayKey;
            const isToday = thisDayKey === getTodayKey();

            return (
              <button
                key={day}
                onClick={() => onSelectDay(day)}
                className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isSelected
                    ? 'bg-blue-950 text-white'
                    : 'text-blue-950 hover:bg-slate-100'
                } ${isToday && !isSelected ? 'border-2 border-blue-950' : ''}`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 animate-slide-up">
        <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                Tanggal {activeDayKey}
              </p>
              <h3 className="text-blue-950 font-bold text-base">Ringkasan Aktivitas</h3>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-blue-950">{daySummary.score}</span>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Skor Fisik</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Kalori Masuk</span>
              <span className="text-base font-black text-blue-950">{daySummary.totalCal} kkal</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Kalori Terbakar</span>
              <span className="text-base font-black text-blue-950">{daySummary.totalBurned} kkal</span>
            </div>
          </div>

          <h4 className="text-blue-950 text-xs font-bold uppercase tracking-wider mb-2.5">Daftar Log Hari Terpilih</h4>
          <div className="space-y-2">
            {!daySummary.hasData ? (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                Tidak ada data aktivitas yang dicatat pada tanggal ini.
              </div>
            ) : (
              <>
                {daySummary.logs.activity.map((item) => (
                  <LogItem
                    key={item.id}
                    title={item.name}
                    subtitle={item.time || 'Aktivitas'}
                    value={`${item.cal} Kkal`}
                    icon={Activity}
                  />
                ))}
                {daySummary.logs.diet.map((item) => (
                  <LogItem
                    key={item.id}
                    title={item.name}
                    subtitle={item.time || 'Makan'}
                    value={`${item.cal} Kkal`}
                    icon={Utensils}
                  />
                ))}
                {daySummary.logs.sleep.map((item) => (
                  <LogItem
                    key={item.id}
                    title={item.duration}
                    subtitle={item.date || 'Tidur'}
                    value={item.quality}
                    icon={Moon}
                  />
                ))}
                {daySummary.logs.screentime.map((item) => (
                  <LogItem
                    key={item.id}
                    title={item.app}
                    subtitle="Screen Time"
                    value={item.duration}
                    icon={Smartphone}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
