'use client';

import React, { useState, useEffect } from 'react';

export default function IntroScreen({ onFinish }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 800);
    const t2 = setTimeout(() => setStep(2), 2600);
    const t3 = setTimeout(() => onFinish(), 3400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-white transition-all duration-700 ease-out ${
        step === 2 ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex gap-1 mb-6 relative z-10">
        {['D', 'i', 'a', 'B', 'e', 'a', 't'].map((char, i) => (
          <span
            key={i}
            className="text-6xl sm:text-7xl font-black text-blue-950 animate-pop-out italic tracking-tight"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            {char}
          </span>
        ))}
      </div>

      <div
        className={`absolute bottom-12 text-center transition-all duration-700 ease-out transform ${
          step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        } z-10`}
      >
        <p className="text-slate-400 text-[10px] font-bold tracking-[0.3em] uppercase mb-1">Developed by</p>
        <p className="text-blue-950 text-xs font-black tracking-[0.2em] uppercase">
          Agra Prana
        </p>
      </div>

      <style jsx>{`
        @keyframes popOut {
          0% {
            transform: scale(0.6);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-pop-out {
          animation: popOut 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          display: inline-block;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
