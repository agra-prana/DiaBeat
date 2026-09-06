import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Heart, Medal, MoreVertical, Plus, Activity as ActivityIcon, Moon, Smartphone, Utensils, Home, Sparkles, Loader2, X, Send, ChevronRight, ChevronLeft, Zap, Dumbbell, Salad, User, ArrowRight, Lock, Mail, Ruler, Weight, Edit2, Flame, AlertTriangle, CheckCircle } from 'lucide-react';

// --- Asisten Pribadi (Integrasi API Gemini) ---
const callGemini = async (prompt, userContext = "") => {
  const apiKey = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "") : "";
  if (!apiKey) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  // UPDATE PROMPT: Instruksi Global untuk gaya bahasa yang singkat, padat, jelas
  const finalPrompt = `
    ${userContext ? `KONTEKS: Profil Pengguna: ${userContext}. Selalu pertimbangkan profil fisik ini.` : ''}
    TUGAS: ${prompt}
    
    INSTRUKSI GAYA BAHASA (WAJIB):
    1. Jawab dalam Bahasa Indonesia.
    2. Berikan jawaban dalam bentuk POIN-POIN INTI (bullet points) jika memungkinkan.
    3. SINGKAT, PADAT, JELAS, dan langsung pada intinya (To-The-Point).
    4. HILANGKAN kata-kata pembuka/penutup yang basa-basi (seperti "Halo", "Tentu", "Berikut adalah").
    5. Fokus pada actionable insight (saran yang bisa langsung dilakukan).
  `;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: finalPrompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    
    if (!response.ok) throw new Error('API Failed');
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};

// --- Komponen-komponen UI (Building Blocks) ---

const LogItem = ({ title, subtitle, value, icon: Icon, colorClass }) => (
    <div className="bg-gray-800 p-4 rounded-2xl flex justify-between items-center shadow-md border border-gray-700 animate-slide-up mb-3 hover:bg-gray-750 transition-colors relative overflow-hidden group">
        <div className="flex items-center gap-4 relative z-10">
            <div className={`p-3 rounded-xl ${colorClass} shadow-sm`}>
                <Icon size={20} />
            </div>
            <div>
                <h4 className="font-bold text-white text-sm">{title}</h4>
                <p className="text-xs text-gray-400">{subtitle}</p>
            </div>
        </div>
        <span className="font-black text-xl text-white relative z-10">{value}</span>
    </div>
);

const InsightCard = ({ title, text, loading, onGenerate, onClose, icon: Icon, colorClass, buttonText }) => {
    if (!text && !loading) {
        return (
            <button 
                onClick={onGenerate}
                className="w-full bg-gray-800 p-4 rounded-2xl border border-gray-700 shadow-md flex items-center justify-between hover:bg-gray-750 transition-colors mb-6 group relative overflow-hidden"
            >
                <div className="flex items-center gap-3 relative z-10">
                    <div className={`p-2 rounded-lg ${colorClass} group-hover:scale-110 transition-transform shadow-sm`}>
                        <Icon size={20} />
                    </div>
                    <span className="font-bold text-white text-sm">{buttonText || title}</span>
                </div>
                <div className="bg-gray-700 p-2 rounded-full relative z-10">
                    <Sparkles size={16} className="text-orange-400" />
                </div>
            </button>
        );
    }

    if (loading) {
        return (
            <div className="w-full bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-md flex justify-center mb-6">
                <Loader2 className="animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="bg-gray-800 p-5 rounded-2xl shadow-lg border-l-4 border-orange-500 animate-slide-up relative mb-6">
            <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white"><X size={14}/></button>
            <div className="flex gap-3 items-start">
                <div className="bg-orange-500/20 p-2 rounded-full mt-1">
                    <Zap size={16} className="text-orange-500 fill-orange-500" />
                </div>
                <div className="w-full">
                    <p className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-1">Analisis AI</p>
                    <p className="text-white text-sm font-medium leading-relaxed whitespace-pre-line">{text}</p>
                </div>
            </div>
        </div>
    );
};

// --- Layar Kalender & Riwayat ---
const CalendarScreen = ({ logs }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().getDate());
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
        setSelectedDate(1);
    };
    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
        setSelectedDate(1);
    };

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const getDayData = (day) => {
        const today = new Date().getDate();
        const isToday = day === today && month === new Date().getMonth() && year === new Date().getFullYear();

        if (isToday) {
            const score = Math.min(100, Math.floor((logs.activity.length * 20) + (logs.diet.length * 10)));
            return {
                score: score || 50,
                summary: score > 0 ? "Hari ini produktif! Pertahankan ritme ini." : "Belum ada aktivitas tercatat hari ini.",
                items: [...logs.activity, ...logs.diet, ...logs.sleep]
            };
        } else {
            const seed = day * (month + 1);
            const randomScore = 60 + (seed % 40); 
            return {
                score: randomScore,
                summary: randomScore > 80 ? "Performa luar biasa! Nutrisi dan latihan seimbang." : "Cukup baik, namun istirahat perlu ditingkatkan.",
                items: [
                    { name: "Lari Pagi", time: "06:00", cal: 300, icon: ActivityIcon, color: "bg-orange-500/20 text-orange-400" },
                    { name: "Oatmeal", time: "07:30", cal: 250, icon: Utensils, color: "bg-emerald-500/20 text-emerald-400" },
                    { name: "Tidur", duration: "7j 30m", quality: "Baik", icon: Moon, color: "bg-indigo-500/20 text-indigo-400" }
                ]
            };
        }
    };

    const activeData = getDayData(selectedDate);
    const scoreColor = activeData.score >= 80 ? 'text-green-500' : activeData.score >= 60 ? 'text-yellow-500' : 'text-red-500';

    return (
        <div className="animate-fade-in pb-32 pt-4">
            <h1 className="text-white text-4xl font-black mb-6 italic uppercase tracking-wider">Riwayat</h1>
            
            <div className="bg-gray-800 rounded-[2rem] p-6 shadow-lg border border-gray-700 mb-6">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={prevMonth} className="p-2 hover:bg-gray-700 rounded-full text-gray-400"><ChevronLeft size={20}/></button>
                    <h2 className="text-white font-bold text-lg">{monthNames[month]} {year}</h2>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-700 rounded-full text-gray-400"><ChevronRight size={20}/></button>
                </div>
                
                <div className="grid grid-cols-7 gap-2 text-center mb-2">
                    {dayHeaders.map((d,i) => (
                        <span key={i} className="text-xs font-bold text-gray-500">{d}</span>
                    ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: firstDayIndex }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-10 w-10"></div>
                    ))}
                    
                    {days.map(day => (
                        <button 
                            key={day}
                            onClick={() => setSelectedDate(day)}
                            className={`
                                h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
                                ${selectedDate === day 
                                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md scale-105' 
                                    : 'text-gray-300 hover:bg-gray-700'}
                                ${day === new Date().getDate() && month === new Date().getMonth() && selectedDate !== day ? 'border border-orange-500 text-orange-500' : ''}
                            `}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4 animate-slide-up">
                <div className="bg-gray-800/50 p-6 rounded-[2rem] border border-gray-700 backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Tanggal {selectedDate} {monthNames[month]}</p>
                            <h3 className="text-white font-bold text-xl">Ringkasan Harian</h3>
                        </div>
                        <div className="text-right">
                             <span className={`text-4xl font-black ${scoreColor}`}>{activeData.score}</span>
                             <p className="text-[10px] text-gray-500 uppercase font-bold">Skor Kesehatan</p>
                        </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm leading-relaxed border-l-2 border-orange-500 pl-4 mb-6">
                        "{activeData.summary}"
                    </p>

                    <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-3">Detail Aktivitas</h4>
                    <div className="space-y-3">
                        {activeData.items.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm">Tidak ada data tercatat.</div>
                        ) : (
                            activeData.items.map((item, i) => (
                                <LogItem 
                                    key={i}
                                    title={item.name || item.app || "Aktivitas"}
                                    subtitle={item.time || item.duration || "Log"}
                                    value={item.cal ? `${item.cal} Kkal` : item.quality || item.duration}
                                    icon={item.icon || (item.cal ? (item.steps ? ActivityIcon : Utensils) : Moon)}
                                    colorClass={item.color || "bg-gray-700 text-gray-300"}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Modal Hasil Analisis (Pop-up Laporan) ---
const AnalysisResultModal = ({ result, onClose }) => {
    if (!result) return null;

    const riskColor = result.risk === 'Tinggi' ? 'text-red-500' : result.risk === 'Sedang' ? 'text-yellow-500' : 'text-green-500';
    const scoreColor = result.score >= 80 ? 'text-green-500' : result.score >= 50 ? 'text-yellow-500' : 'text-red-500';

    return (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-gray-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-gray-800 max-h-[90vh] overflow-y-auto relative">
                 <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-900/95 py-2 z-10">
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-wider">Laporan AI</h2>
                    <button onClick={onClose} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="space-y-6 pb-6">
                    <div className="bg-gray-800 rounded-3xl p-6 text-center border border-gray-700 relative overflow-hidden">
                        <p className="text-gray-400 text-sm font-bold uppercase mb-2">Skor Kesehatan Harian</p>
                        <h1 className={`text-6xl font-black ${scoreColor} mb-2`}>{result.score}</h1>
                        <div className="inline-flex items-center gap-2 bg-gray-900 px-3 py-1 rounded-full border border-gray-700">
                            <ActivityIcon size={14} className={riskColor} />
                            <span className={`text-xs font-bold ${riskColor}`}>Risiko Diabetes: {result.risk}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-orange-500/20 p-3 rounded-2xl text-orange-400 shrink-0">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg mb-1">Analisis Gaya Hidup</h3>
                                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{result.analysis}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-emerald-500/20 p-3 rounded-2xl text-emerald-400 shrink-0">
                                <Salad size={24} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg mb-1">Saran Nutrisi</h3>
                                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{result.dietAdvice}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-indigo-500/20 p-3 rounded-2xl text-indigo-400 shrink-0">
                                <Moon size={24} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg mb-1">Saran Pemulihan</h3>
                                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{result.sleepAdvice}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <button onClick={onClose} className="w-full bg-gray-800 border border-gray-700 text-white font-black py-4 rounded-2xl shadow-lg mt-4 active:scale-95 transition-transform uppercase tracking-wider hover:bg-gray-700">
                    Tutup Laporan
                </button>
            </div>
        </div>
    );
};

// --- Intro Screen ---
const IntroScreen = ({ onFinish }) => {
    const [step, setStep] = useState(0); 

    useEffect(() => { 
        const t1 = setTimeout(() => setStep(1), 1000); 
        const t2 = setTimeout(() => setStep(2), 4000); 
        const t3 = setTimeout(() => onFinish(), 5000); 
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    return (
        <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-black transition-all duration-1000 ease-[cubic-bezier(0.65,0,0.35,1)] ${step === 2 ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100'}`}>
            <div className="flex gap-2 mb-8 relative z-10"> 
                {['F', 'I', 'T', '+'].map((char, i) => ( 
                    <span key={i} className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 animate-pop-out italic" style={{ animationDelay: `${i * 0.2}s` }}>{char}</span> 
                ))} 
            </div>
            
            <div className={`absolute bottom-12 text-center transition-all duration-1000 ease-out transform ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} z-10`}>
                <p className="text-gray-500 text-[10px] font-bold tracking-[0.4em] uppercase mb-1">Developed by</p>
                <p className="text-white text-xs font-black tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">Abi Bhaskara</p>
            </div>

            <style>{` 
                @keyframes pop-out { 
                    0% { transform: scale(0) skewX(-10deg); opacity: 0; } 
                    60% { transform: scale(1.2) skewX(-10deg); opacity: 1; } 
                    100% { transform: scale(1) skewX(-10deg); opacity: 1; } 
                } 
                .animate-pop-out { 
                    animation: pop-out 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; 
                    display: inline-block; 
                    opacity: 0;
                } 
            `}</style>
        </div>
    );
};

const AuthScreen = ({ onNext }) => {
    const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
    const handleSubmit = (e) => { e.preventDefault(); if(email && password) onNext({ email }); };
    return (
        <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center p-6 animate-fade-in relative overflow-hidden">
            <div className="w-full max-w-md relative z-10">
                <div className="mb-10 text-center">
                    <h1 className="text-5xl font-black text-white mb-2 italic tracking-tighter">FIT<span className="text-orange-500">+</span></h1>
                    <p className="text-gray-400">Platform Kebugaran Cerdas Anda</p>
                </div>
                
                <div className="bg-gray-800/50 backdrop-blur-xl p-8 rounded-3xl border border-gray-700 shadow-2xl">
                    <h2 className="text-3xl font-black text-white mb-2 italic">Buat Akun</h2>
                    <p className="text-gray-400 mb-8">Daftar untuk memulai hidup sehatmu</p>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div> <label className="text-sm font-bold text-gray-300 ml-1 uppercase">Email</label> <div className="flex items-center bg-gray-900 p-4 rounded-2xl border border-gray-700 mt-2 focus-within:border-orange-500 transition-colors shadow-sm"> <Mail className="text-gray-500 mr-3" size={20} /> <input type="email" required className="bg-transparent w-full outline-none text-white font-bold placeholder:text-gray-600" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /> </div> </div>
                        <div> <label className="text-sm font-bold text-gray-300 ml-1 uppercase">Kata Sandi</label> <div className="flex items-center bg-gray-900 p-4 rounded-2xl border border-gray-700 mt-2 focus-within:border-orange-500 transition-colors shadow-sm"> <Lock className="text-gray-500 mr-3" size={20} /> <input type="password" required className="bg-transparent w-full outline-none text-white font-bold placeholder:text-gray-600" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} /> </div> </div>
                        <button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-black py-5 rounded-2xl shadow-md mt-8 flex items-center justify-center gap-2 active:scale-95 transition-transform uppercase tracking-wider relative overflow-hidden group"> <span className="relative z-10 flex items-center gap-2">Lanjut <ArrowRight size={20}/></span> </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const ProfileScreen = ({ onFinish, initialData }) => {
    const [profile, setProfile] = useState(initialData || { name: '', age: '', height: '', weight: '' });
    const handleSubmit = (e) => { e.preventDefault(); if(profile.name && profile.age && profile.height && profile.weight) { onFinish(profile); } };
    return (
        <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center p-6 animate-fade-in relative overflow-hidden">
             <div className="w-full max-w-md relative z-10">
                 <div className="bg-gray-800/50 backdrop-blur-xl p-8 rounded-3xl border border-gray-700 shadow-2xl">
                    <h1 className="text-3xl font-black text-white mb-2 italic">{initialData ? "Edit Profil" : "Tentang Kamu"}</h1>
                    <p className="text-gray-400 mb-8">Data ini digunakan untuk analisis AI yang akurat</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="bg-gray-900 p-4 rounded-2xl border border-gray-700 focus-within:border-orange-500 transition-colors shadow-sm"> <div className="flex items-center"> <User className="text-orange-500 mr-3" /> <input type="text" placeholder="Nama Lengkap" required className="bg-transparent w-full outline-none font-black text-white placeholder:text-gray-600" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} /> </div> </div>
                        <div className="flex gap-4"> <div className="bg-gray-900 p-4 rounded-2xl border border-gray-700 flex-1 focus-within:border-orange-500 transition-colors shadow-sm"> <label className="text-xs text-gray-400 font-bold block mb-1 uppercase">USIA</label> <input type="number" placeholder="0" required className="bg-transparent w-full outline-none font-black text-xl text-white placeholder:text-gray-600" value={profile.age} onChange={(e) => setProfile({...profile, age: e.target.value})} /> </div> <div className="bg-gray-900 p-4 rounded-2xl border border-gray-700 flex-1 focus-within:border-orange-500 transition-colors shadow-sm"> <label className="text-xs text-gray-400 font-bold block mb-1 uppercase">TINGGI (cm)</label> <input type="number" placeholder="0" required className="bg-transparent w-full outline-none font-black text-xl text-white placeholder:text-gray-600" value={profile.height} onChange={(e) => setProfile({...profile, height: e.target.value})} /> </div> </div>
                        <div className="bg-gray-900 p-4 rounded-2xl border border-gray-700 focus-within:border-orange-500 transition-colors shadow-sm"> <label className="text-xs text-gray-400 font-bold block mb-1 uppercase">BERAT (kg)</label> <input type="number" placeholder="0" required className="bg-transparent w-full outline-none font-black text-xl text-white placeholder:text-gray-600" value={profile.weight} onChange={(e) => setProfile({...profile, weight: e.target.value})} /> </div>
                        <button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-black py-5 rounded-2xl shadow-md mt-8 flex items-center justify-center gap-2 active:scale-95 transition-transform uppercase tracking-wider relative overflow-hidden group"> <span className="relative z-10 flex items-center gap-2">{initialData ? "Simpan Perubahan" : "Mulai Sekarang"} <Sparkles size={20} className="text-white"/></span> </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- LAYAR UTAMA ---
const HomeScreen = ({ logs, userProfile, onInsightReq, onEditProfile, isAnalyzingHome, onOpenCalendar }) => {
    const totalCal = logs.diet.reduce((acc, curr) => acc + (curr.cal || 0), 0);
    const totalSteps = logs.activity.reduce((acc, curr) => acc + (curr.steps || 0), 0);
    const totalDistance = logs.activity.reduce((acc, curr) => { if (curr.dist) return acc + curr.dist; return acc + ((curr.steps || 0) * 0.0007); }, 0);
    const totalBurned = logs.activity.reduce((acc, curr) => acc + (curr.cal || 0), 0);
    const netCalories = totalCal - totalBurned;

    const lastSleep = logs.sleep[0]?.duration || "0j 0m";
    const totalScreenTime = logs.screentime.reduce((acc, curr) => { const parts = curr.duration.split(' '); let h = 0, m = 0; parts.forEach(p => { if(p.includes('j') || p.includes('h')) h = parseInt(p); if(p.includes('m')) m = parseInt(p); }); return acc + h * 60 + m; }, 0);
    const formattedScreenTime = `${Math.floor(totalScreenTime/60)}j ${totalScreenTime%60}m`;
    
    return (
      <div className="animate-fade-in pb-32">
        <div className="flex justify-between items-center mb-8 pt-4">
          <button onClick={onEditProfile} className="flex items-center gap-4 hover:opacity-80 transition-opacity text-left">
            <div className="w-14 h-14 bg-gray-800 rounded-full overflow-hidden border-2 border-orange-500 shadow-sm flex items-center justify-center relative group">
               <User className="text-orange-500" size={24} />
               <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"> <Edit2 size={18} className="text-white"/> </div>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Halo,</p>
              <h2 className="text-white font-black text-2xl italic">{userProfile.name}</h2>
            </div>
          </button>
          <button 
            onClick={onOpenCalendar}
            className="w-12 h-12 border border-gray-700 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 shadow-sm transition-colors"
          > 
            <Calendar size={20} className="text-gray-300" /> 
          </button>
        </div>

        <div className="mb-10">
             <button 
                 onClick={onInsightReq}
                 disabled={isAnalyzingHome}
                 className="w-full bg-gray-800 hover:bg-gray-750 border border-gray-700 p-5 rounded-2xl shadow-md transition-all group relative overflow-hidden text-left"
             >
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-orange-500/20 p-3 rounded-xl">
                            {isAnalyzingHome ? <Loader2 size={24} className="text-orange-400 animate-spin"/> : <Sparkles size={24} className="text-orange-400" />}
                        </div>
                        <div className="text-left">
                            <p className="font-black text-white text-base uppercase italic">Analisis Kesehatan AI</p>
                            <p className="text-sm text-gray-400 font-medium">
                                {isAnalyzingHome ? "Sedang Menganalisis Data..." : "Cek Risiko Diabetes & Laporan"}
                            </p>
                        </div>
                    </div>
                    {!isAnalyzingHome && <ChevronRight size={20} className="text-orange-500" />}
                 </div>
             </button>
        </div>

        <div className="text-center mb-10 relative">
          <div className="inline-block relative">
            <h1 className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 mb-2 tracking-tighter transition-all duration-500 italic">
                {netCalories.toLocaleString()}
            </h1>
            <span className="absolute -top-4 -right-10 text-xs bg-gray-800 text-gray-300 border border-gray-700 px-3.5 py-1 rounded-full font-black uppercase tracking-wider shadow-sm transform rotate-12">Net</span>
          </div>
          <p className="text-gray-400 text-base font-bold uppercase tracking-wider mb-4">Kalori Bersih</p>
          
          <div className="flex justify-center gap-6 text-sm font-medium text-gray-400 bg-gray-800/50 py-3 px-6 rounded-full inline-flex border border-gray-700 backdrop-blur-sm">
              <span className="text-orange-400">Masuk: {totalCal}</span>
              <span className="text-gray-600">|</span>
              <span className="text-blue-400">Bakar: {totalBurned}</span>
          </div>
        </div>

        <h3 className="text-sm font-black text-white italic uppercase tracking-wider mb-4 px-1">Ringkasan Aktivitas</h3>
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-gray-800 p-5 rounded-3xl border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="flex items-center gap-2 mb-2"> <ActivityIcon size={20} className="text-orange-400"/> <span className="text-xs font-bold text-orange-400 uppercase">Langkah</span> </div>
              <p className="text-3xl font-black text-white italic">{totalSteps.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">Target: 10k</p>
          </div>
          <div className="bg-gray-800 p-5 rounded-3xl border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="flex items-center gap-2 mb-2"> <MapPin size={20} className="text-emerald-400"/> <span className="text-xs font-bold text-emerald-400 uppercase">Jarak</span> </div>
              <p className="text-3xl font-black text-white italic">{totalDistance.toFixed(1)} <span className="text-base not-italic font-medium text-gray-500">km</span></p>
          </div>
          <div className="bg-gray-800 p-5 rounded-3xl border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="flex items-center gap-2 mb-2"> <Moon size={20} className="text-indigo-400"/> <span className="text-xs font-bold text-indigo-400 uppercase">Tidur</span> </div>
              <p className="text-3xl font-black text-white italic">{lastSleep}</p>
          </div>
          <div className="bg-gray-800 p-5 rounded-3xl border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="flex items-center gap-2 mb-2"> <Smartphone size={20} className="text-pink-400"/> <span className="text-xs font-bold text-pink-400 uppercase">Layar</span> </div>
              <p className="text-3xl font-black text-white italic">{formattedScreenTime}</p>
          </div>
        </div>

        <div className="flex justify-between items-end px-2 mb-4">
            <h3 className="text-lg font-black text-white italic uppercase tracking-wider">Aktivitas Terkini</h3>
        </div>
        <div className="space-y-3">
            {logs.activity.length === 0 ? (
                <div className="text-center p-10 text-gray-500 border-2 border-dashed border-gray-700 rounded-3xl bg-gray-800/30 font-medium"> Belum ada aktivitas. Tekan <span className="font-bold text-orange-500">+</span> untuk mulai! </div>
            ) : ( logs.activity.slice(0, 3).map((act, i) => ( <LogItem key={i} title={act.name} subtitle={act.time || "Hari Ini"} value={`${act.cal} Kkal`} icon={ActivityIcon} colorClass="bg-orange-500/20 text-orange-400" /> )) )}
        </div>
      </div>
    );
};

const SportyActivityScreen = ({ logs, callGemini }) => {
    const [tip, setTip] = useState(null); const [loading, setLoading] = useState(false);
    const getWorkoutTip = async () => {
        setLoading(true);
        const steps = logs.activity.reduce((a, b) => a + (b.steps || 0), 0);
        const remaining = Math.max(0, 10000 - steps);
        const prompt = `Pengguna jalan ${steps} langkah. Target 10k. Sisa ${remaining}. Berikan 3 poin saran latihan spesifik, singkat, dan padat. Format JSON { "text": "..." }`;
        try { const res = await callGemini(prompt); if(res) setTip(JSON.parse(res.replace(/```json/g, '').replace(/```/g, '').trim()).text); } catch(e) { setTip("Lari santai 15 menit!"); }
        setLoading(false);
    };
    return ( 
        <div className="animate-fade-in pb-32 pt-4"> 
            <h1 className="text-white text-4xl font-black mb-8 italic uppercase tracking-wider">Log Aktivitas</h1> 
            <div className="bg-gray-800 rounded-[2.5rem] p-6 min-h-[500px] shadow-lg border border-gray-700 relative overflow-hidden"> 
                <InsightCard title="Pelatih Pintar" buttonText="Dapatkan Saran Latihan" text={tip} loading={loading} onGenerate={getWorkoutTip} onClose={() => setTip(null)} icon={Dumbbell} colorClass="bg-orange-500/20 text-orange-400" /> 
                <div className="space-y-2"> 
                    {logs.activity.length === 0 ? <div className="text-center text-gray-500 mt-10">Belum ada aktivitas.</div> : logs.activity.map((item, i) => ( <LogItem key={i} title={item.name} subtitle={item.time || "Hari Ini"} value={`${item.cal} Kkal`} icon={ActivityIcon} colorClass="bg-orange-500/20 text-orange-400" /> ))} 
                </div> 
            </div> 
        </div> 
    );
};

const SportyDietScreen = ({ logs, callGemini }) => {
    const [insight, setInsight] = useState(null); const [loading, setLoading] = useState(false);
    const analyzeNutrition = async () => {
        setLoading(true);
        const foods = logs.diet.map(f => f.name).join(", ") || "kosong";
        const prompt = `Makanan: ${foods}. Analisis nutrisi singkat (point form). Saran 1 tambahan sehat. Format JSON { "text": "..." }`;
        try { const res = await callGemini(prompt); if(res) setInsight(JSON.parse(res.replace(/```json/g, '').replace(/```/g, '').trim()).text); } catch(e) { setInsight("Makan sayur!"); }
        setLoading(false);
    };
    return ( 
        <div className="animate-fade-in pb-32 pt-4"> 
            <h1 className="text-white text-4xl font-black mb-8 italic uppercase tracking-wider">Log Diet</h1> 
            <div className="bg-gray-800 rounded-[2.5rem] p-6 min-h-[500px] shadow-lg border border-gray-700 relative overflow-hidden"> 
                <InsightCard title="Ahli Gizi AI" buttonText="Analisis Makanan" text={insight} loading={loading} onGenerate={analyzeNutrition} onClose={() => setInsight(null)} icon={Salad} colorClass="bg-emerald-500/20 text-emerald-400" /> 
                <div className="space-y-2"> 
                    {logs.diet.length === 0 ? <div className="text-center text-gray-500 mt-10">Belum ada makanan.</div> : logs.diet.map((item, i) => ( <LogItem key={i} title={item.name} subtitle="Makan" value={`${item.cal} Kkal`} icon={Utensils} colorClass="bg-emerald-500/20 text-emerald-400" /> ))} 
                </div> 
            </div> 
        </div> 
    );
};

const SportySleepScreen = ({ logs, callGemini }) => {
    const [advice, setAdvice] = useState(null); const [loading, setLoading] = useState(false);
    const analyzeSleep = async () => {
        setLoading(true);
        const sleep = logs.sleep[0] ? logs.sleep[0].duration : "unknown";
        const prompt = `Tidur ${sleep}. Berikan 3 poin saran pemulihan atlet yang singkat & padat. Format JSON { "text": "..." }`;
        try { const res = await callGemini(prompt); if(res) setAdvice(JSON.parse(res.replace(/```json/g, '').replace(/```/g, '').trim()).text); } catch(e) { setAdvice("Tidur 8 jam!"); }
        setLoading(false);
    };
    return ( 
        <div className="animate-fade-in pb-32 pt-4"> 
            <h1 className="text-white text-4xl font-black mb-8 italic uppercase tracking-wider">Log Tidur</h1> 
            <div className="bg-gray-800 rounded-[2.5rem] p-6 min-h-[500px] shadow-lg border border-gray-700 relative overflow-hidden"> 
                <InsightCard title="Pelatih Pemulihan" buttonText="Analisis Tidur" text={advice} loading={loading} onGenerate={analyzeSleep} onClose={() => setAdvice(null)} icon={Moon} colorClass="bg-indigo-500/20 text-indigo-400" /> 
                <div className="space-y-2"> 
                    {logs.sleep.length === 0 ? <div className="text-center text-gray-500 mt-10">Belum ada data tidur.</div> : logs.sleep.map((item, i) => ( <LogItem key={i} title={item.duration} subtitle={item.date || "Tadi Malam"} value={item.quality} icon={Moon} colorClass="bg-indigo-500/20 text-indigo-400" /> ))} 
                </div> 
            </div> 
        </div> 
    );
};

// --- Komponen Utama Aplikasi ---

export default function App() { 
  const [showIntro, setShowIntro] = useState(true);
  const [view, setView] = useState('auth');
  const [activeTab, setActiveTab] = useState('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [isAnalyzingHome, setIsAnalyzingHome] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const [userProfile, setUserProfile] = useState({ name: '', age: '', height: '', weight: '' });
  
  const [logs, setLogs] = useState({
      diet: [],
      activity: [],
      sleep: [],
      screentime: []
  });

  const getUserContextString = () => {
      return `Nama: ${userProfile.name}, Usia: ${userProfile.age}, Tinggi: ${userProfile.height}cm, Berat: ${userProfile.weight}kg`;
  };

  const handleSmartAdd = async () => {
      if (!promptText.trim()) return;
      setIsAnalyzing(true);
      const systemPrompt = `
        Analisis input: "${promptText}". Kategori: "diet", "activity", "sleep", "screentime".
        JSON Valid. Format:
        - diet: { "type": "diet", "data": { "name": "Makanan", "cal": int } }
        - activity: { "type": "activity", "data": { "name": "Aktivitas", "cal": int, "dist": float (km, opsional), "steps": int (opsional), "time": "Sekarang" } }
        - sleep: { "type": "sleep", "data": { "duration": "Xj Ym", "quality": "Baik/Cukup", "date": "Tadi Malam" } }
        - screentime: { "type": "screentime", "data": { "app": "App", "duration": "Xj Ym" } }
      `;
      try {
          const result = await callGemini(systemPrompt, getUserContextString());
          if (result) {
              const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(cleanJson);
              if (parsed && parsed.type && logs[parsed.type]) {
                  setLogs(prev => ({ ...prev, [parsed.type]: [parsed.data, ...prev[parsed.type]] }));
                  setIsAddModalOpen(false); setPromptText(""); setActiveTab(parsed.type);
              } else { alert("Gagal memahami input."); }
          }
      } catch (e) { console.error(e); alert("Error AI."); }
      setIsAnalyzing(false);
  };

  const handleHomeInsight = async () => {
      setIsAnalyzingHome(true);
      const recentFood = logs.diet.map(f => `${f.name} (${f.cal}cal)`).join(", ") || "Tidak ada data makan";
      const recentActivity = logs.activity.map(a => `${a.name} (${a.steps || 0} steps)`).join(", ") || "Tidak ada aktivitas";
      const recentApps = logs.screentime.map(s => `${s.app} (${s.duration})`).join(", ") || "Tidak ada screen time";
      const lastSleep = logs.sleep[0] ? `${logs.sleep[0].duration} (${logs.sleep[0].quality})` : "Tidak ada data tidur";
      const totalCal = logs.diet.reduce((a,b)=>a+(b.cal||0),0);
      const totalSteps = logs.activity.reduce((a,b)=>a+(b.steps||0),0);

      const prompt = `
        Analisis Mendalam Data Pengguna:
        - Profil: ${getUserContextString()}
        - Makanan Hari Ini: ${recentFood} (Total: ${totalCal} kkal)
        - Aktivitas: ${recentActivity} (Total Langkah: ${totalSteps})
        - Tidur Terakhir: ${lastSleep}
        - Screen Time: ${recentApps}

        Tugas: Berikan laporan kesehatan komprehensif.
        1. Berikan 'score' kesehatan harian (0-100).
        2. Tentukan 'risk' diabetes (Rendah/Sedang/Tinggi).
        3. 'analysis': Analisis singkat, padat, langsung pada masalah utama (max 2 kalimat).
        4. 'dietAdvice': Saran nutrisi to-the-point (max 2 kalimat).
        5. 'sleepAdvice': Saran pemulihan to-the-point (max 2 kalimat).

        Format JSON Wajib:
        { "score": 85, "risk": "Rendah", "analysis": "...", "dietAdvice": "...", "sleepAdvice": "..." }
      `;
      
      const res = await callGemini(prompt, getUserContextString());
      if(res) {
           const clean = res.replace(/```json/g, '').replace(/```/g, '').trim();
           try { setAnalysisResult(JSON.parse(clean)); } catch (e) { console.error(e); alert("Maaf, gagal memproses analisis AI."); }
      }
      setIsAnalyzingHome(false);
  };

  const callGeminiWithContext = (p) => callGemini(p, getUserContextString());
  
  const renderScreen = () => {
    switch(activeTab) {
      case 'home': return <HomeScreen logs={logs} userProfile={userProfile} onInsightReq={handleHomeInsight} onEditProfile={() => setIsEditProfileOpen(true)} isAnalyzingHome={isAnalyzingHome} onOpenCalendar={() => setActiveTab('calendar')} />;
      case 'activity': return <SportyActivityScreen logs={logs} callGemini={callGeminiWithContext} />;
      case 'diet': return <SportyDietScreen logs={logs} callGemini={callGeminiWithContext} />;
      case 'sleep': return <SportySleepScreen logs={logs} callGemini={callGeminiWithContext} />;
      case 'screentime': 
        return (
            <div className="animate-fade-in pb-32 pt-4"> 
                <h1 className="text-white text-4xl font-black mb-8 italic uppercase tracking-wider">Screen Time</h1> 
                <div className="bg-gray-800 rounded-[2.5rem] p-6 min-h-[500px] shadow-lg border border-gray-700 relative overflow-hidden"> 
                    <div className="space-y-2"> 
                        {logs.screentime.length === 0 ? <div className="text-center text-gray-500 mt-10">Belum ada log layar.</div> : logs.screentime.map((item, i) => ( <LogItem key={i} title={item.app} subtitle="Penggunaan App" value={item.duration} icon={Smartphone} colorClass="bg-pink-500/20 text-pink-400" /> ))} 
                    </div> 
                </div> 
            </div>
        );
      case 'calendar': return <CalendarScreen logs={logs} />; 
      default: return <HomeScreen logs={logs} userProfile={userProfile} />;
    }
  };

  const NavItem = ({ icon: Icon, tabName, isMain = false }) => {
     if (isMain) return ( 
        <button onClick={() => setIsAddModalOpen(true)} className="relative -top-12 bg-gradient-to-r from-orange-500 to-pink-500 w-20 h-20 p-5 rounded-full flex items-center justify-center shadow-xl border-[6px] border-gray-900 transition-transform active:scale-95 group hover:scale-105"> 
            <Plus size={36} className="text-white group-hover:rotate-90 transition-transform" /> 
        </button> 
     );
     return ( 
        <button onClick={() => setActiveTab(tabName)} className={`p-4 transition-all rounded-2xl group ${activeTab === tabName ? 'bg-gray-800 text-orange-500' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}> 
            <Icon size={24} fill={activeTab === tabName ? "currentColor" : "none"} className="group-active:scale-90 transition-transform"/> 
        </button> 
     );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-orange-500/30">
      <div className="max-w-md mx-auto min-h-screen relative z-10 bg-gray-900/0 shadow-2xl">
          
          {/* INTRO OVERLAY */}
          {showIntro && <IntroScreen onFinish={() => setShowIntro(false)} />}
          
          {/* MAIN CONTENT */}
          {view === 'auth' && <AuthScreen onNext={(data) => setView('profile')} />}
          {view === 'profile' && <ProfileScreen initialData={null} onFinish={(data) => { setUserProfile(data); setView('app'); }} />}
          {view === 'app' && (
            <>
                {isEditProfileOpen ? (
                    <div className="fixed inset-0 z-50 bg-gray-900 overflow-y-auto"> 
                        <div className="max-w-md mx-auto min-h-screen relative p-6">
                            <div className="flex justify-end mb-4"> <button onClick={() => setIsEditProfileOpen(false)} className="p-2 bg-gray-800 rounded-full"><X className="text-white"/></button> </div> 
                            <ProfileScreen initialData={userProfile} onFinish={(newData) => { setUserProfile(newData); setIsEditProfileOpen(false); }} /> 
                        </div>
                    </div>
                ) : (
                    <div className="p-6">
                        {renderScreen()}
                    </div>
                )}

                <AnalysisResultModal result={analysisResult} onClose={() => setAnalysisResult(null)} />

                {!isEditProfileOpen && ( 
                    <div className="fixed bottom-0 left-0 right-0 z-40">
                        <div className="bg-gray-900/90 backdrop-blur-xl border-t border-gray-800 pb-safe-area">
                            <div className="max-w-md mx-auto h-24 flex justify-between items-center px-8 relative">
                                <NavItem icon={Home} tabName="home" /> 
                                <NavItem icon={Smartphone} tabName="screentime" /> 
                                <NavItem icon={null} tabName="add" isMain={true} /> 
                                <NavItem icon={Utensils} tabName="diet" /> 
                                <NavItem icon={Moon} tabName="sleep" /> 
                            </div>
                        </div>
                    </div>
                )}

                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[50] bg-black/80 backdrop-blur-md flex items-end justify-center animate-fade-in p-4 pb-8">
                        <div className="bg-gray-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-slide-up border border-gray-800 relative overflow-hidden">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-gray-700 rounded-full mt-3"></div>
                            <div className="flex justify-between items-center mb-8 mt-4"> 
                                <h2 className="text-3xl font-black text-white italic uppercase tracking-wider">Catat Cepat</h2> 
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"> 
                                    <X size={24} /> 
                                </button> 
                            </div>
                            <p className="text-gray-400 text-base font-medium mb-8 leading-relaxed"> 
                                Ketik apa saja aktivitasmu (Makan, Lari, Tidur), AI akan otomatis mencatatnya. 
                            </p>
                            <div className="relative"> 
                                <input 
                                    autoFocus 
                                    type="text" 
                                    value={promptText} 
                                    onChange={(e) => setPromptText(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleSmartAdd()} 
                                    placeholder="Contoh: Makan nasi padang..." 
                                    className="w-full bg-gray-800 p-6 pr-16 rounded-2xl text-lg font-bold outline-none text-white placeholder:text-gray-600 border border-gray-700 focus:border-orange-500 transition-colors shadow-sm" 
                                /> 
                                <button 
                                    onClick={handleSmartAdd} 
                                    disabled={isAnalyzing || !promptText} 
                                    className={`absolute right-3 top-3 bottom-3 w-14 rounded-xl flex items-center justify-center transition-all z-10 ${promptText ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md' : 'bg-gray-700 text-gray-500'}`}
                                > 
                                    {isAnalyzing ? <Loader2 className="animate-spin" /> : <Send size={24} />} 
                                </button> 
                            </div>
                        </div>
                    </div>
                )}
            </>
          )}

      </div>

      <style>{` .pb-safe-area { padding-bottom: env(safe-area-inset-bottom); } .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; } @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } } .animate-fade-in { animation: fade-in 0.4s ease-out forwards; } @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } } .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; } `}</style>
    </div>
  );
}