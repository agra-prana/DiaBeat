'use client';

import React from 'react';
import { Home, Smartphone, Utensils, Moon, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function BottomNavigation() {
  const { activeTab, setActiveTab, setIsAddModalOpen } = useApp();

  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'screentime', icon: Smartphone, label: 'Layar' },
    { id: 'add', isAdd: true },
    { id: 'diet', icon: Utensils, label: 'Diet' },
    { id: 'sleep', icon: Moon, label: 'Tidur' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t-2 border-slate-200 pb-safe-area shadow-lg">
      <div className="max-w-md mx-auto h-18 flex justify-between items-center px-5 relative">
        {tabs.map((tab) => {
          if (tab.isAdd) {
            return (
              <button
                key="add-btn"
                onClick={() => setIsAddModalOpen(true)}
                aria-label="Tambah Catatan"
                className="relative -top-5 bg-blue-950 text-white hover:bg-blue-900 w-14 h-14 rounded-2xl flex items-center justify-center border-4 border-white shadow-md active:scale-95 transition-transform"
              >
                <Plus size={28} className="text-white" />
              </button>
            );
          }

          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-3.5 rounded-2xl transition-all flex flex-col items-center gap-1 ${
                isActive
                  ? 'bg-blue-950 text-white shadow-sm'
                  : 'text-slate-400 hover:text-blue-950 hover:bg-slate-50'
              }`}
            >
              <Icon
                size={18}
                fill={isActive ? 'currentColor' : 'none'}
              />
              <span className="text-[10px] font-black uppercase tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
