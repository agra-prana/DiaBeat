'use client';

import React from 'react';
import { X, Salad, Moon, Activity, ShieldCheck } from 'lucide-react';

export default function HealthReportModal({ report, isOpen, onClose }) {
  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 border-2 border-blue-950 shadow-2xl max-h-[90vh] overflow-y-auto relative">
        <div className="flex justify-between items-center mb-5 sticky top-0 bg-white py-1 z-10">
          <h2 className="text-xl font-black text-blue-950 italic uppercase tracking-wider">
            Evaluasi Kesehatan
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-blue-950 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 pb-2">
          <div className="bg-slate-50 rounded-3xl p-5 text-center border-2 border-slate-200 relative overflow-hidden">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Skor Kesehatan Harian</p>
            <h1 className="text-5xl font-black text-blue-950 mb-2">{report.score}</h1>
            <div className="inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-slate-300">
              <Activity size={13} className="text-blue-950" />
              <span className="text-xs font-bold text-blue-950">Risiko Diabetes: {report.risk}</span>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white border border-slate-200">
              <div className="bg-blue-950 text-white p-2.5 rounded-xl shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="text-blue-950 font-bold text-sm mb-0.5">Analisis Kondisi Fisik</h3>
                <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-line">{report.analysis}</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white border border-slate-200">
              <div className="bg-blue-950 text-white p-2.5 rounded-xl shrink-0">
                <Salad size={18} />
              </div>
              <div>
                <h3 className="text-blue-950 font-bold text-sm mb-0.5">Saran Asupan Nutrisi</h3>
                <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-line">{report.dietAdvice}</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white border border-slate-200">
              <div className="bg-blue-950 text-white p-2.5 rounded-xl shrink-0">
                <Moon size={18} />
              </div>
              <div>
                <h3 className="text-blue-950 font-bold text-sm mb-0.5">Saran Pemulihan & Tidur</h3>
                <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-line">{report.sleepAdvice}</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-blue-950 text-white font-black py-3.5 rounded-2xl uppercase tracking-wider hover:bg-blue-900 transition-colors text-xs mt-3"
        >
          Tutup Laporan
        </button>
      </div>
    </div>
  );
}
