'use client';

import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function AuthScreen() {
  const { handleEmailLogin, handleEmailRegister, handleGoogleLogin } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const formatFirebaseError = (err) => {
    const code = err?.code || '';
    if (code === 'auth/email-already-in-use') {
      return 'Email ini sudah terdaftar. Silakan pilih tab Masuk.';
    }
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return 'Email atau kata sandi tidak cocok. Silakan periksa kembali.';
    }
    if (code === 'auth/user-not-found') {
      return 'Akun belum terdaftar. Silakan buat akun baru.';
    }
    if (code === 'auth/weak-password') {
      return 'Kata sandi terlalu pendek. Minimal gunakan 6 karakter.';
    }
    if (code === 'auth/invalid-email') {
      return 'Format alamat email tidak valid.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Proses login Google dibatalkan.';
    }
    return err?.message || 'Terjadi kesalahan autentikasi. Silakan coba lagi.';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setErrorMsg('');
    setLoadingEmail(true);

    try {
      if (isRegister) {
        await handleEmailRegister(email.trim(), password.trim());
      } else {
        await handleEmailLogin(email.trim(), password.trim());
      }
    } catch (err) {
      console.error('Email Auth Error:', err);
      setErrorMsg(formatFirebaseError(err));
    } finally {
      setLoadingEmail(false);
    }
  };

  const onGoogleClick = async () => {
    setErrorMsg('');
    setLoadingGoogle(true);
    try {
      await handleGoogleLogin();
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      setErrorMsg(formatFirebaseError(err));
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative">
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
          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                !isRegister
                  ? 'bg-blue-950 text-white shadow-xs'
                  : 'text-slate-500 hover:text-blue-950'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                isRegister
                  ? 'bg-blue-950 text-white shadow-xs'
                  : 'text-slate-500 hover:text-blue-950'
              }`}
            >
              Daftar Baru
            </button>
          </div>

          <h2 className="text-2xl font-black text-blue-950 mb-1 italic">
            {isRegister ? 'Buat Akun Baru' : 'Selamat Datang'}
          </h2>
          <p className="text-slate-500 text-xs mb-6">
            {isRegister
              ? 'Daftar dan lengkapi data fisikmu untuk analisis kesehatan'
              : 'Masuk untuk memantau asupan, aktivitas, & risiko kesehatan'}
          </p>

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
            disabled={loadingGoogle || loadingEmail}
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
            <span>{loadingGoogle ? 'Menghubungkan Google...' : 'Lanjut dengan Google'}</span>
          </button>

          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              atau dengan Email & Sandi
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-blue-950 uppercase tracking-wider block mb-1">
                Alamat Email
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
                  minLength={6}
                  className="bg-transparent w-full outline-none text-blue-950 font-bold placeholder:text-slate-400 text-sm"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingEmail || loadingGoogle}
              className="w-full bg-blue-950 text-white font-black py-4 rounded-2xl hover:bg-blue-900 active:bg-blue-950 transition-colors uppercase tracking-wider text-sm flex items-center justify-center gap-2 mt-4 shadow-xs"
            >
              {loadingEmail ? (
                <Loader2 size={18} className="animate-spin text-white" />
              ) : (
                <>
                  <span>{isRegister ? 'Daftar Sekarang' : 'Masuk ke Aplikasi'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
