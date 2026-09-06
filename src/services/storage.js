/**
 * Repository / Storage Service Layer for DiaBeat
 * 
 * Provides an abstract data access layer for all health and activity logs.
 * Currently persists data in browser localStorage with structured models,
 * designed with exact parity for Prisma / PostgreSQL / Supabase server APIs.
 */

const STORAGE_KEYS = {
  USER: 'fitplus_user',
  PROFILE: 'fitplus_profile',
  LOGS_ACTIVITY: 'fitplus_logs_activity',
  LOGS_DIET: 'fitplus_logs_diet',
  LOGS_SLEEP: 'fitplus_logs_sleep',
  LOGS_SCREENTIME: 'fitplus_logs_screentime',
  INSIGHTS: 'fitplus_insights',
};

// Helper to generate unique ID
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper for today's date in YYYY-MM-DD
export const getTodayKey = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format date object to YYYY-MM-DD
export const formatDateKey = (year, monthIndex, day) => {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

// Parse minutes from duration string e.g. "2j 30m" or "1h 45m"
export const parseDurationMinutes = (str) => {
  if (!str) return 0;
  let total = 0;
  const parts = str.toLowerCase().split(/\s+/);
  parts.forEach((p) => {
    if (p.includes('j') || p.includes('h')) {
      const val = parseInt(p, 10);
      if (!isNaN(val)) total += val * 60;
    } else if (p.includes('m')) {
      const val = parseInt(p, 10);
      if (!isNaN(val)) total += val;
    } else {
      const val = parseInt(p, 10);
      if (!isNaN(val)) total += val;
    }
  });
  return total;
};

// Format minutes to readable string e.g. "2j 30m"
export const formatMinutesToDuration = (minutes) => {
  if (!minutes || minutes <= 0) return '0j 0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}j ${m}m`;
};

class StorageService {
  // --- USER & PROFILE ---
  getUser() {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  }

  saveUser(user) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  getProfile() {
    if (typeof window === 'undefined') {
      return { name: '', age: 0, height: 0, weight: 0 };
    }
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      return { name: '', age: 0, height: 0, weight: 0 };
    }
    return JSON.parse(raw);
  }

  saveProfile(profile) {
    if (typeof window === 'undefined') return;
    const cleanProfile = {
      name: profile.name || '',
      age: Number(profile.age) || 0,
      height: Number(profile.height) || 0,
      weight: Number(profile.weight) || 0,
      gender: profile.gender || 'unspecified',
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(cleanProfile));
    return cleanProfile;
  }

  // --- GENERIC LOG COLLECTION HELPERS ---
  _getCollection(key) {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  _saveCollection(key, items) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(items));
  }

  // --- ALL LOGS BY DATE ---
  getAllLogs(dateKey = getTodayKey()) {
    const activities = this._getCollection(STORAGE_KEYS.LOGS_ACTIVITY).filter(
      (item) => item.date === dateKey
    );
    const diets = this._getCollection(STORAGE_KEYS.LOGS_DIET).filter(
      (item) => item.date === dateKey
    );
    const sleeps = this._getCollection(STORAGE_KEYS.LOGS_SLEEP).filter(
      (item) => item.date === dateKey
    );
    const screentimes = this._getCollection(STORAGE_KEYS.LOGS_SCREENTIME).filter(
      (item) => item.date === dateKey
    );

    return {
      activity: activities,
      diet: diets,
      sleep: sleeps,
      screentime: screentimes,
    };
  }

  // --- ADD LOG ITEMS ---
  addActivity(item, dateKey = getTodayKey()) {
    const list = this._getCollection(STORAGE_KEYS.LOGS_ACTIVITY);
    const newRecord = {
      id: item.id || generateId(),
      date: dateKey,
      name: item.name || 'Latihan',
      cal: Number(item.cal) || 0,
      steps: Number(item.steps) || 0,
      dist: Number(item.dist) || (item.steps ? Number(item.steps) * 0.0007 : 0),
      time: item.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    };
    list.unshift(newRecord);
    this._saveCollection(STORAGE_KEYS.LOGS_ACTIVITY, list);
    return newRecord;
  }

  addDiet(item, dateKey = getTodayKey()) {
    const list = this._getCollection(STORAGE_KEYS.LOGS_DIET);
    const newRecord = {
      id: item.id || generateId(),
      date: dateKey,
      name: item.name || 'Makanan',
      cal: Number(item.cal) || 0,
      time: item.time || 'Makan',
      createdAt: new Date().toISOString(),
    };
    list.unshift(newRecord);
    this._saveCollection(STORAGE_KEYS.LOGS_DIET, list);
    return newRecord;
  }

  addSleep(item, dateKey = getTodayKey()) {
    const list = this._getCollection(STORAGE_KEYS.LOGS_SLEEP);
    const minutes = item.minutes || parseDurationMinutes(item.duration);
    const newRecord = {
      id: item.id || generateId(),
      date: dateKey,
      duration: item.duration || formatMinutesToDuration(minutes),
      minutes: minutes,
      quality: item.quality || 'Baik',
      createdAt: new Date().toISOString(),
    };
    list.unshift(newRecord);
    this._saveCollection(STORAGE_KEYS.LOGS_SLEEP, list);
    return newRecord;
  }

  addScreenTime(item, dateKey = getTodayKey()) {
    const list = this._getCollection(STORAGE_KEYS.LOGS_SCREENTIME);
    const minutes = item.minutes || parseDurationMinutes(item.duration);
    const newRecord = {
      id: item.id || generateId(),
      date: dateKey,
      app: item.app || 'Penggunaan HP',
      duration: item.duration || formatMinutesToDuration(minutes),
      minutes: minutes,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newRecord);
    this._saveCollection(STORAGE_KEYS.LOGS_SCREENTIME, list);
    return newRecord;
  }

  // --- DELETE LOG ITEM ---
  deleteLog(type, id) {
    const keyMap = {
      activity: STORAGE_KEYS.LOGS_ACTIVITY,
      diet: STORAGE_KEYS.LOGS_DIET,
      sleep: STORAGE_KEYS.LOGS_SLEEP,
      screentime: STORAGE_KEYS.LOGS_SCREENTIME,
    };
    const key = keyMap[type];
    if (!key) return false;
    const list = this._getCollection(key);
    const updated = list.filter((i) => i.id !== id);
    this._saveCollection(key, updated);
    return true;
  }

  // --- INSIGHTS / AI REPORTS ---
  getInsight(dateKey = getTodayKey()) {
    const list = this._getCollection(STORAGE_KEYS.INSIGHTS);
    return list.find((ins) => ins.date === dateKey) || null;
  }

  saveInsight(insight, dateKey = getTodayKey()) {
    const list = this._getCollection(STORAGE_KEYS.INSIGHTS);
    const index = list.findIndex((ins) => ins.date === dateKey);
    const record = {
      ...insight,
      date: dateKey,
      savedAt: new Date().toISOString(),
    };
    if (index >= 0) {
      list[index] = record;
    } else {
      list.unshift(record);
    }
    this._saveCollection(STORAGE_KEYS.INSIGHTS, list);
    return record;
  }

  // --- CALENDAR AGGREGATION FOR A SPECIFIC DATE ---
  getDaySummary(dateKey) {
    const logs = this.getAllLogs(dateKey);
    const totalCal = logs.diet.reduce((acc, curr) => acc + (curr.cal || 0), 0);
    const totalBurned = logs.activity.reduce((acc, curr) => acc + (curr.cal || 0), 0);
    const totalSteps = logs.activity.reduce((acc, curr) => acc + (curr.steps || 0), 0);
    const totalDist = logs.activity.reduce((acc, curr) => acc + (curr.dist || 0), 0);

    const sleepRecord = logs.sleep[0];
    const totalScreenMinutes = logs.screentime.reduce(
      (acc, curr) => acc + (curr.minutes || parseDurationMinutes(curr.duration)),
      0
    );

    // Dynamic health score calculation
    let baseScore = 50;
    if (totalSteps >= 8000) baseScore += 20;
    else if (totalSteps >= 4000) baseScore += 10;

    if (totalCal > 0 && totalBurned > 0) baseScore += 15;
    if (sleepRecord && (sleepRecord.minutes >= 420 || sleepRecord.quality === 'Baik')) baseScore += 15;

    const score = Math.min(100, Math.max(20, baseScore));

    return {
      date: dateKey,
      score: score,
      totalCal,
      totalBurned,
      netCalories: totalCal - totalBurned,
      totalSteps,
      totalDist,
      sleepDuration: sleepRecord ? sleepRecord.duration : '0j 0m',
      screenTimeFormatted: formatMinutesToDuration(totalScreenMinutes),
      logs,
      hasData:
        logs.activity.length > 0 ||
        logs.diet.length > 0 ||
        logs.sleep.length > 0 ||
        logs.screentime.length > 0,
    };
  }

  // Clear all local logs
  clearAll() {
    if (typeof window === 'undefined') return;
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  }
}

export const storage = new StorageService();
