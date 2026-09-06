'use client';

import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function AuthScreen() {
  const { handleLogin, handleGoogleLogin, isFirebaseConfigured } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      handleLogin(email.trim());
    }
  };

  const onGoogleClick = async () => {
    setErrorMsg('');
    setLoadingGoogle(true);
    try {
      await handleGoogleLogin();
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err?.message || 'Gagal login dengan Google. Pastikan konfigurasi Firebase sudah benar.'
      );
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 animate-fade-in relative">
      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-black text-blue-950 mb-2 italic tracking-tighter">
            DiaBeat
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Platform Pemantauan & Pencegahan Risiko Diabetes
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border-2 border-slate-200 shadow-sm">
          <h2 className="text-2xl font-black text-blue-950 mb-1 italic">Masuk / Daftar</h2>
          <p className="text-slate-500 text-xs mb-6">Mulai kelola kesehatan dan aktivitas harianmu</p>

          {errorMsg && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 font-medium">
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={onGoogleClick}
            disabled={loadingGoogle}
            className="w-full bg-white hover:bg-slate-50 text-blue-950 font-black py-3.5 px-4 rounded-2xl border-2 border-slate-200 hover:border-blue-950 transition-all text-sm flex items-center justify-center gap-3 shadow-xs mb-5 active:scale-[0.99]"
          >
            {loadingGoogle ? (
              <Loader2 size={18} className="animate-spin text-blue-950" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{loadingGoogle ? 'Menghubungkan...' : 'Lanjut dengan Google'}</span>
          </button>

          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              atau dengan Email
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-blue-950 uppercase tracking-wider block mb-1">
                Email
              </label>
              <div className="flex items-center bg-white p-3.5 rounded-2xl border-2 border-slate-200 focus-within:border-blue-950 transition-colors">
                <Mail className="text-slate-400 mr-3 shrink-0" size={18} />
                <input
                  type="email"
                  required
                  className="bg-transparent w-full outline-none text-blue-950 font-bold placeholder:text-slate-400 text-sm"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-blue-950 uppercase tracking-wider block mb-1">
                Kata Sandi
              </label>
              <div className="flex items-center bg-white p-3.5 rounded-2xl border-2 border-slate-200 focus-within:border-blue-950 transition-colors">
                <Lock className="text-slate-400 mr-3 shrink-0" size={18} />
                <input
                  type="password"
                  required
                  className="bg-transparent w-full outline-none text-blue-950 font-bold placeholder:text-slate-400 text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-950 text-white font-black py-4 rounded-2xl hover:bg-blue-900 active:bg-blue-950 transition-colors uppercase tracking-wider text-sm flex items-center justify-center gap-2 mt-4"
            >
              <span>Masuk dengan Email</span>
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
