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
    const h = hourMatch ? parseInt(hourMatch[1], 10) : 7;
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
    const h = hourMatch ? parseInt(hourMatch[1], 10) : 1;
    const m = minMatch ? parseInt(minMatch[1], 10) : 30;

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

    let cal = calMatch ? parseInt(calMatch[1], 10) : 250;
    let dist = distMatch ? parseFloat(distMatch[1].replace(',', '.')) : 0;
    let steps = stepsMatch ? parseInt(stepsMatch[1], 10) : 0;

    if (dist > 0 && steps === 0) {
      steps = Math.round(dist * 1400); // approx 1400 steps per km
    }
    if (steps > 0 && cal === 250 && !calMatch) {
      cal = Math.round(steps * 0.04); // approx 40 kcal per 1000 steps
    }

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
        steps: steps || 3000,
        dist: dist || (steps ? Number((steps * 0.0007).toFixed(1)) : 2.0),
        time: 'Baru saja',
      },
    };
  }

  // 4. DEFAULT TO DIET (FOOD / DRINK)
  const calMatch = lower.match(/(\d+)\s*(kal|kkal|cal|kcal)/);
  const estimatedCal = calMatch ? parseInt(calMatch[1], 10) : 350;
  // Clean name
  let foodName = text
    .replace(/(\d+)\s*(kal|kkal|cal|kcal)/gi, '')
    .replace(/(makan|minum|sarapan|lunch|dinner|snack)\s*/gi, '')
    .trim();

  if (!foodName) foodName = 'Makanan Sehat';
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
    Analisis input cepat kesehatan: "${inputString}".
    Ekstrak ke salah satu kategori JSON berikut secara tepat:
    1. "diet" -> { "type": "diet", "data": { "name": "Nama Makanan", "cal": 350 } }
    2. "activity" -> { "type": "activity", "data": { "name": "Lari", "cal": 250, "steps": 3000, "dist": 2.1, "time": "Sekarang" } }
    3. "sleep" -> { "type": "sleep", "data": { "duration": "7j 30m", "quality": "Baik", "date": "Tadi Malam" } }
    4. "screentime" -> { "type": "screentime", "data": { "app": "Instagram", "duration": "1j 30m" } }

    Output WAJIB hanya JSON murni.
  `;

  const aiResult = await callGeminiAPI(prompt, userContext);
  if (aiResult) {
    try {
      const cleanJson = aiResult.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
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
