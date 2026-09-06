'use client';

import React, { useState } from 'react';
import { X, Send, Loader2, Utensils, Activity, Moon, Smartphone } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { extractSmartAdd } from '@/services/gemini';

export default function QuickAddModal({ isOpen, onClose }) {
  const { addLogItem, profile, setActiveTab } = useApp();
  const [mode, setMode] = useState('smart'); // 'smart' | 'manual'
  const [manualCategory, setManualCategory] = useState('diet'); // 'diet' | 'activity' | 'sleep' | 'screentime'

  const [promptText, setPromptText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Manual Form States
  const [dietForm, setDietForm] = useState({ name: '', cal: '' });
  const [activityForm, setActivityForm] = useState({ name: '', cal: '', steps: '', dist: '' });
  const [sleepForm, setSleepForm] = useState({ duration: '7j 30m', quality: 'Baik' });
  const [screenForm, setScreenForm] = useState({ app: '', duration: '1j 30m' });

  if (!isOpen) return null;

  const handleSmartSubmit = async () => {
    if (!promptText.trim()) return;
    setIsAnalyzing(true);
    const userContext = `Nama: ${profile.name}, Berat: ${profile.weight}kg, Usia: ${profile.age}`;

    try {
      const extracted = await extractSmartAdd(promptText, userContext);
      if (extracted && extracted.type && extracted.data) {
        addLogItem(extracted.type, extracted.data);
        setActiveTab(extracted.type);
        setPromptText('');
        onClose();
      }
    } catch (err) {
      console.error('Smart add error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCategory === 'diet' && dietForm.name) {
      addLogItem('diet', { name: dietForm.name, cal: Number(dietForm.cal) || 300 });
      setDietForm({ name: '', cal: '' });
    } else if (manualCategory === 'activity' && activityForm.name) {
      addLogItem('activity', {
        name: activityForm.name,
        cal: Number(activityForm.cal) || 200,
        steps: Number(activityForm.steps) || 0,
        dist: Number(activityForm.dist) || 0,
      });
      setActivityForm({ name: '', cal: '', steps: '', dist: '' });
    } else if (manualCategory === 'sleep') {
      addLogItem('sleep', { duration: sleepForm.duration, quality: sleepForm.quality });
    } else if (manualCategory === 'screentime' && screenForm.app) {
      addLogItem('screentime', { app: screenForm.app, duration: screenForm.duration });
      setScreenForm({ app: '', duration: '1j 30m' });
    }
    setActiveTab(manualCategory);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 border-2 border-blue-950 shadow-xl relative animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-xl font-black text-blue-950 italic uppercase tracking-wider">Catat Aktivitas</h2>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setMode('smart')}
                className={`text-xs px-3 py-1 rounded-full font-bold transition-colors ${
                  mode === 'smart' ? 'bg-blue-950 text-white' : 'bg-slate-100 text-slate-500 hover:text-blue-950'
                }`}
              >
                Teks Cepat
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`text-xs px-3 py-1 rounded-full font-bold transition-colors ${
                  mode === 'manual' ? 'bg-blue-950 text-white' : 'bg-slate-100 text-slate-500 hover:text-blue-950'
                }`}
              >
                Form Manual
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors text-blue-950"
          >
            <X size={18} />
          </button>
        </div>

        {mode === 'smart' ? (
          <div>
            <p className="text-slate-500 text-xs font-medium mb-3.5 leading-relaxed">
              Ketik aktivitasmu secara bebas (contoh: <span className="font-bold text-blue-950">"Makan salad 250 kalori"</span> atau{' '}
              <span className="font-bold text-blue-950">"Lari pagi 30 menit 300 kkal"</span>), sistem akan memprosesnya otomatis.
            </p>

            <div className="relative">
              <input
                autoFocus
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSmartSubmit()}
                placeholder="Contoh: Tidur 8 jam nyenyak..."
                className="w-full bg-white p-4 pr-14 rounded-2xl text-sm font-bold outline-none text-blue-950 placeholder:text-slate-400 border-2 border-slate-200 focus:border-blue-950 transition-colors"
              />
              <button
                onClick={handleSmartSubmit}
                disabled={isAnalyzing || !promptText.trim()}
                className={`absolute right-2 top-2 bottom-2 w-10 rounded-xl flex items-center justify-center transition-colors ${
                  promptText.trim()
                    ? 'bg-blue-950 text-white hover:bg-blue-900'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-3.5">
            {/* Category Selectors */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'diet', label: 'Diet', icon: Utensils },
                { id: 'activity', label: 'Latihan', icon: Activity },
                { id: 'sleep', label: 'Tidur', icon: Moon },
                { id: 'screentime', label: 'Layar', icon: Smartphone },
              ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = manualCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setManualCategory(cat.id)}
                    className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-1 transition-colors ${
                      isSelected
                        ? 'bg-blue-950 border-blue-950 text-white'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-[10px] font-bold uppercase">{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-form based on category */}
            {manualCategory === 'diet' && (
              <div className="space-y-2.5">
                <input
                  type="text"
                  required
                  placeholder="Nama Makanan (cth: Dada Ayam Bakar)"
                  value={dietForm.name}
                  onChange={(e) => setDietForm({ ...dietForm, name: e.target.value })}
                  className="w-full bg-white p-3 rounded-xl text-xs font-bold text-blue-950 border-2 border-slate-200 focus:border-blue-950 outline-none"
                />
                <input
                  type="number"
                  placeholder="Estimasi Kalori (kkal)"
                  value={dietForm.cal}
                  onChange={(e) => setDietForm({ ...dietForm, cal: e.target.value })}
                  className="w-full bg-white p-3 rounded-xl text-xs font-bold text-blue-950 border-2 border-slate-200 focus:border-blue-950 outline-none"
                />
              </div>
            )}

            {manualCategory === 'activity' && (
              <div className="space-y-2.5">
                <input
                  type="text"
                  required
                  placeholder="Nama Aktivitas (cth: Lari Sore)"
                  value={activityForm.name}
                  onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })}
                  className="w-full bg-white p-3 rounded-xl text-xs font-bold text-blue-950 border-2 border-slate-200 focus:border-blue-950 outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Kalori Terbakar (kkal)"
                    value={activityForm.cal}
                    onChange={(e) => setActivityForm({ ...activityForm, cal: e.target.value })}
                    className="w-full bg-white p-3 rounded-xl text-xs font-bold text-blue-950 border-2 border-slate-200 focus:border-blue-950 outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Langkah (opsional)"
                    value={activityForm.steps}
                    onChange={(e) => setActivityForm({ ...activityForm, steps: e.target.value })}
                    className="w-full bg-white p-3 rounded-xl text-xs font-bold text-blue-950 border-2 border-slate-200 focus:border-blue-950 outline-none"
                  />
                </div>
              </div>
            )}

            {manualCategory === 'sleep' && (
              <div className="space-y-2.5">
                <input
                  type="text"
                  placeholder="Durasi (cth: 7j 30m)"
                  value={sleepForm.duration}
                  onChange={(e) => setSleepForm({ ...sleepForm, duration: e.target.value })}
                  className="w-full bg-white p-3 rounded-xl text-xs font-bold text-blue-950 border-2 border-slate-200 focus:border-blue-950 outline-none"
                />
                <select
                  value={sleepForm.quality}
                  onChange={(e) => setSleepForm({ ...sleepForm, quality: e.target.value })}
                  className="w-full bg-white p-3 rounded-xl text-xs font-bold text-blue-950 border-2 border-slate-200 focus:border-blue-950 outline-none cursor-pointer"
                >
                  <option value="Sangat Baik">Sangat Baik</option>
                  <option value="Baik">Baik</option>
                  <option value="Cukup">Cukup</option>
                  <option value="Kurang">Kurang</option>
                </select>
              </div>
            )}

            {manualCategory === 'screentime' && (
              <div className="space-y-2.5">
                <input
                  type="text"
                  required
                  placeholder="Nama Aplikasi (cth: TikTok)"
                  value={screenForm.app}
                  onChange={(e) => setScreenForm({ ...screenForm, app: e.target.value })}
                  className="w-full bg-white p-3 rounded-xl text-xs font-bold text-blue-950 border-2 border-slate-200 focus:border-blue-950 outline-none"
                />
                <input
                  type="text"
                  placeholder="Durasi (cth: 2j 15m)"
                  value={screenForm.duration}
                  onChange={(e) => setScreenForm({ ...screenForm, duration: e.target.value })}
                  className="w-full bg-white p-3 rounded-xl text-xs font-bold text-blue-950 border-2 border-slate-200 focus:border-blue-950 outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-950 hover:bg-blue-900 text-white font-black py-3.5 rounded-xl uppercase tracking-wider text-xs transition-colors"
            >
              Simpan Data
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
