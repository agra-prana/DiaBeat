'use client';

import React, { useState } from 'react';
import { User, X, Check, LogOut } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function ProfileModal({ isModal = false, onClose }) {
  const { profile, handleSaveProfile, handleLogout } = useApp();
  const [form, setForm] = useState(() => ({
    name: profile?.name || '',
    age: profile?.age ? String(profile.age) : '',
    height: profile?.height ? String(profile.height) : '',
    weight: profile?.weight ? String(profile.weight) : '',
    gender: profile?.gender || 'male',
  }));

  const [prevProfile, setPrevProfile] = useState(profile);
  if (profile !== prevProfile) {
    setPrevProfile(profile);
    if (profile) {
      setForm({
        name: profile.name || '',
        age: profile.age ? String(profile.age) : '',
        height: profile.height ? String(profile.height) : '',
        weight: profile.weight ? String(profile.weight) : '',
        gender: profile.gender || 'male',
      });
    }
  }

  const onSubmit = (e) => {
    e.preventDefault();
    if (form.name.trim() && form.age && form.height && form.weight) {
      handleSaveProfile({
        name: form.name.trim(),
        age: parseInt(form.age, 10),
        height: parseFloat(form.height),
        weight: parseFloat(form.weight),
        gender: form.gender,
      });
      if (onClose) onClose();
    }
  };

  const content = (
    <div className="bg-white p-8 rounded-3xl border-2 border-blue-950 shadow-sm relative">
      {isModal && onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-blue-950 transition-colors"
        >
          <X size={18} />
        </button>
      )}

      <h1 className="text-2xl font-black text-blue-950 mb-1 italic">
        {isModal ? 'Edit Profil' : 'Tentang Kamu'}
      </h1>
      <p className="text-slate-500 text-xs mb-6">
        Data fisik digunakan untuk kalkulasi BMR, TDEE, & evaluasi metabolisme secara presisi.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-blue-950 font-bold block mb-1 uppercase tracking-wider">Nama Lengkap</label>
          <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-200 focus-within:border-blue-950 transition-colors flex items-center">
            <User className="text-blue-950 mr-3 shrink-0" size={18} />
            <input
              type="text"
              placeholder="Contoh: Agra Prana"
              required
              className="bg-transparent w-full outline-none font-bold text-blue-950 placeholder:text-slate-400 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 flex-1 focus-within:border-blue-950 transition-colors">
            <label className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">USIA</label>
            <input
              type="number"
              placeholder="25"
              required
              min="10"
              max="120"
              className="bg-transparent w-full outline-none font-black text-lg text-blue-950 placeholder:text-slate-400"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />
          </div>
          <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 flex-1 focus-within:border-blue-950 transition-colors">
            <label className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">TINGGI (cm)</label>
            <input
              type="number"
              placeholder="175"
              required
              min="50"
              max="250"
              className="bg-transparent w-full outline-none font-black text-lg text-blue-950 placeholder:text-slate-400"
              value={form.height}
              onChange={(e) => setForm({ ...form, height: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 flex-1 focus-within:border-blue-950 transition-colors">
            <label className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">BERAT (kg)</label>
            <input
              type="number"
              placeholder="70"
              required
              min="20"
              max="300"
              className="bg-transparent w-full outline-none font-black text-lg text-blue-950 placeholder:text-slate-400"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
            />
          </div>
          <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 flex-1 focus-within:border-blue-950 transition-colors">
            <label className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">GENDER</label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="bg-transparent w-full outline-none font-bold text-sm text-blue-950 cursor-pointer pt-1"
            >
              <option value="male">Pria</option>
              <option value="female">Wanita</option>
            </select>
          </div>
        </div>

        {/* Button without any AI SVG icons */}
        <button
          type="submit"
          className="w-full bg-blue-950 text-white font-black py-4 rounded-2xl hover:bg-blue-900 active:bg-blue-950 transition-colors uppercase tracking-wider text-sm mt-4 flex items-center justify-center gap-2 shadow-xs"
        >
          <span>{isModal ? 'Simpan Perubahan' : 'Mulai Sekarang'}</span>
          <Check size={18} />
        </button>

        {isModal && (
          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
              handleLogout();
            }}
            className="w-full bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 font-bold py-3 rounded-2xl transition-colors uppercase tracking-wider text-xs flex items-center justify-center gap-2 mt-2"
          >
            <LogOut size={14} />
            <span>Ganti Akun / Keluar</span>
          </button>
        )}
      </form>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 animate-fade-in">
        <div className="w-full max-w-md">{content}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-6 animate-fade-in relative">
      <div className="w-full max-w-md relative z-10">{content}</div>
    </div>
  );
}
