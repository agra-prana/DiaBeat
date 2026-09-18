/**
 * Gemini AI Integration & NLP Parsing Service for DiaBeat
 */

// Heuristic fallback parser when AI is unavailable or offline
export const parseInputHeuristically = (text) => {
  const lower = text.toLowerCase().trim();
  
  // 1. SLEEP DETECTION
  if (lower.includes('tidur') || lower.includes('sleep') || lower.includes('bangun')) {
    const hourMatch = lower.match(/(\d+)\s*(jam|j|hour|h)/);
    const minMatch = lower.match(/(\d+)\s*(menit|m|min)/);
    
    if (!hourMatch && !minMatch) {
      return {
        error: 'Durasi tidur tidak diketahui. Harap sertakan durasi yang akurat (contoh: "Tidur 7 jam 30 menit") atau gunakan Form Manual.',
      };
    }

    const h = hourMatch ? parseInt(hourMatch[1], 10) : 0;
    const m = minMatch ? parseInt(minMatch[1], 10) : 0;
    const duration = `${h}j ${m}m`;
    const quality = lower.includes('nyenyak') || lower.includes('segar') || lower.includes('baik') ? 'Baik' : 'Cukup';
    return {
      type: 'sleep',
      data: {
        duration,
        quality,
        date: 'Tadi Malam',
      },
    };
  }

  // 2. SCREEN TIME DETECTION
  if (
    lower.includes('layar') ||
    lower.includes('screen') ||
    lower.includes('hp') ||
    lower.includes('ig') ||
    lower.includes('instagram') ||
    lower.includes('tiktok') ||
    lower.includes('youtube') ||
    lower.includes('game') ||
    lower.includes('wa') ||
    lower.includes('whatsapp')
  ) {
    let appName = 'Penggunaan HP';
    if (lower.includes('instagram') || lower.includes('ig')) appName = 'Instagram';
    else if (lower.includes('tiktok')) appName = 'TikTok';
    else if (lower.includes('youtube')) appName = 'YouTube';
    else if (lower.includes('whatsapp') || lower.includes('wa')) appName = 'WhatsApp';
    else if (lower.includes('game')) appName = 'Game';

    const hourMatch = lower.match(/(\d+)\s*(jam|j|h)/);
    const minMatch = lower.match(/(\d+)\s*(menit|m)/);

    if (!hourMatch && !minMatch) {
      return {
        error: 'Durasi screen time tidak diketahui. Harap sertakan durasi yang akurat (contoh: "Main Instagram 45 menit") atau gunakan Form Manual.',
      };
    }

    const h = hourMatch ? parseInt(hourMatch[1], 10) : 0;
    const m = minMatch ? parseInt(minMatch[1], 10) : 0;

    return {
      type: 'screentime',
      data: {
        app: appName,
        duration: `${h}j ${m}m`,
      },
    };
  }

  // 3. ACTIVITY DETECTION
  const activityKeywords = ['lari', 'jogging', 'jalan', 'gym', 'sepeda', 'renang', 'workout', 'push up', 'futsal', 'badminton', 'basket', 'treadmill'];
  const isActivity = activityKeywords.some((kw) => lower.includes(kw));

  if (isActivity) {
    const calMatch = lower.match(/(\d+)\s*(kal|kkal|cal|kcal)/);
    const stepsMatch = lower.match(/(\d+)\s*(langkah|step|steps)/);
    const distMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(km|kilo|kilometer)/);

    // Jangan gunakan dummy data atau teori coba-coba
    if (!calMatch && !stepsMatch && !distMatch) {
      return {
        error: 'Data aktivitas tidak lengkap. Harap sertakan metrik yang akurat (contoh: "Lari 5 km 350 kkal" atau "Jalan 4000 langkah") atau gunakan Form Manual.',
      };
    }

    const cal = calMatch ? parseInt(calMatch[1], 10) : 0;
    const dist = distMatch ? parseFloat(distMatch[1].replace(',', '.')) : 0;
    const steps = stepsMatch ? parseInt(stepsMatch[1], 10) : 0;

    let name = 'Latihan';
    for (const kw of activityKeywords) {
      if (lower.includes(kw)) {
        name = kw.charAt(0).toUpperCase() + kw.slice(1);
        break;
      }
    }

    return {
      type: 'activity',
      data: {
        name: name,
        cal: cal,
        steps: steps,
        dist: dist,
        time: 'Baru saja',
      },
    };
  }

  // 4. DIET (FOOD / DRINK)
  const calMatch = lower.match(/(\d+)\s*(kal|kkal|cal|kcal)/);
  if (!calMatch) {
    // Tidak menebak kalori sembarangan demi akurasi medis/kesehatan
    return {
      error: 'Kalori makanan tidak diketahui. Harap sertakan jumlah kkal (contoh: "Makan nasi 400 kkal") atau gunakan Form Manual.',
    };
  }

  const estimatedCal = parseInt(calMatch[1], 10);
  let foodName = text
    .replace(/(\d+)\s*(kal|kkal|cal|kcal)/gi, '')
    .replace(/(makan|minum|sarapan|lunch|dinner|snack)\s*/gi, '')
    .trim();

  if (!foodName) foodName = 'Makanan';
  foodName = foodName.charAt(0).toUpperCase() + foodName.slice(1);

  return {
    type: 'diet',
    data: {
      name: foodName,
      cal: estimatedCal,
      time: 'Makan',
    },
  };
};

// Main Gemini AI Caller
export const callGeminiAPI = async (prompt, userContext = '') => {
  // Check both NEXT_PUBLIC and VITE_ prefixes for compatibility
  const apiKey =
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    (typeof window !== 'undefined' && window.ENV_GEMINI_KEY) ||
    '';

  if (!apiKey) {
    return null;
  }

  const systemInstructions = `
    ${userContext ? `KONTEKS PENGGUNA: ${userContext}` : ''}
    INSTRUKSI GAYA BAHASA:
    1. Jawab dalam Bahasa Indonesia.
    2. Format singkat, padat, berbobot (to-the-point).
    3. Hapus basa-basi seperti "Halo", "Tentu", "Berikut adalah".
    4. Fokus pada tindakan praktis yang bisa langsung diterapkan.
  `;

  const finalPrompt = `${systemInstructions}\n\nTUGAS: ${prompt}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: finalPrompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('No content returned from Gemini');

    return rawText;
  } catch (err) {
    console.warn('Gemini API fetch error, falling back to local processor:', err.message);
    return null;
  }
};

// Smart Add Extractor: uses Gemini AI if possible, fallback to heuristic
export const extractSmartAdd = async (inputString, userContext = '') => {
  const prompt = `
    Analisis input cepat log kesehatan: "${inputString}".
    ATURAN KETAT AKURASI DATA MEDIS & KESEHATAN:
    1. DILARANG KERAS menggunakan dummy data, asumsi, atau teori coba-coba. Setiap angka harus didasarkan murni dari apa yang disebutkan pengguna.
    2. Kategori "diet": Pengguna wajib mencantumkan kalori (kkal/kal). Jika tidak ada angka kalori yang valid, kembalikan JSON:
       { "error": "Kalori makanan tidak diketahui. Harap sertakan jumlah kkal (contoh: 'Makan nasi 400 kkal') atau gunakan Form Manual." }
    3. Kategori "activity": Pengguna wajib mencantumkan metrik yang akurat (kalori kkal, langkah, atau jarak km). Jangan mengarang angka yang tidak ada (isi dengan 0 jika metrik tersebut tidak disebutkan). Jika tidak ada metrik angka sama sekali, kembalikan JSON:
       { "error": "Data aktivitas tidak lengkap. Harap sertakan jumlah kalori, langkah, atau jarak atau gunakan Form Manual." }
    4. Kategori "sleep": Pengguna wajib mencantumkan durasi waktu yang jelas. Jika tidak ada durasi, kembalikan JSON:
       { "error": "Durasi tidur tidak diketahui. Harap sertakan durasi tidur atau gunakan Form Manual." }
    5. Kategori "screentime": Pengguna wajib mencantumkan durasi waktu yang jelas. Jika tidak ada durasi, kembalikan JSON:
       { "error": "Durasi screen time tidak diketahui. Harap sertakan durasi atau gunakan Form Manual." }

    Format JSON jika data lengkap dan valid:
    - Diet: { "type": "diet", "data": { "name": "...", "cal": 0 } }
    - Activity: { "type": "activity", "data": { "name": "...", "cal": 0, "steps": 0, "dist": 0, "time": "Baru saja" } }
    - Sleep: { "type": "sleep", "data": { "duration": "...j ...m", "quality": "Baik", "date": "Tadi Malam" } }
    - Screentime: { "type": "screentime", "data": { "app": "...", "duration": "...j ...m" } }

    Output WAJIB hanya JSON murni tanpa markdown.
  `;

  const aiResult = await callGeminiAPI(prompt, userContext);
  if (aiResult) {
    try {
      const cleanJson = aiResult.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed?.error) {
        return parsed;
      }
      if (parsed && parsed.type && parsed.data) {
        return parsed;
      }
    } catch {
      // Fallback below
    }
  }

  // Fallback to local heuristic
  return parseInputHeuristically(inputString);
};
