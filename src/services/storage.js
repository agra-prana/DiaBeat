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

  // --- ALL LOGGED DATES & METADATA ---
  getAllLoggedDates() {
    const datesMap = {};
    const categories = [
      { key: STORAGE_KEYS.LOGS_ACTIVITY, type: 'activity' },
      { key: STORAGE_KEYS.LOGS_DIET, type: 'diet' },
      { key: STORAGE_KEYS.LOGS_SLEEP, type: 'sleep' },
      { key: STORAGE_KEYS.LOGS_SCREENTIME, type: 'screentime' },
    ];

    categories.forEach(({ key, type }) => {
      const items = this._getCollection(key);
      items.forEach((item) => {
        if (item.date) {
          if (!datesMap[item.date]) {
            datesMap[item.date] = { activity: 0, diet: 0, sleep: 0, screentime: 0, total: 0 };
          }
          datesMap[item.date][type] += 1;
          datesMap[item.date].total += 1;
        }
      });
    });

    return datesMap;
  }

  // Get account start date (YYYY-MM-DD)
  getAccountStartDate() {
    const user = this.getUser();
    if (user?.createdAt) {
      const d = new Date(user.createdAt);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }

    // Fallback: earliest logged date or today
    const datesMap = this.getAllLoggedDates();
    const sortedDates = Object.keys(datesMap).sort();
    if (sortedDates.length > 0) {
      return sortedDates[0];
    }
    return getTodayKey();
  }

  // Calculate current active logging streak (consecutive days)
  getDailyStreak() {
    const datesMap = this.getAllLoggedDates();
    const today = new Date();
    let streak = 0;

    for (let i = 0; i < 365; i++) {
      const target = new Date();
      target.setDate(today.getDate() - i);
      const year = target.getFullYear();
      const month = String(target.getMonth() + 1).padStart(2, '0');
      const day = String(target.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;

      if (datesMap[key] && datesMap[key].total > 0) {
        streak++;
      } else if (i === 0) {
        // Today hasn't been logged yet, check yesterday
        continue;
      } else {
        break;
      }
    }
    return streak;
  }

  // Total recorded log count across all time
  getTotalLogCount() {
    let count = 0;
    const keys = [
      STORAGE_KEYS.LOGS_ACTIVITY,
      STORAGE_KEYS.LOGS_DIET,
      STORAGE_KEYS.LOGS_SLEEP,
      STORAGE_KEYS.LOGS_SCREENTIME,
    ];
    keys.forEach((k) => {
      count += this._getCollection(k).length;
    });
    return count;
  }

  // --- CALENDAR AGGREGATION FOR A SPECIFIC DATE ---
  getDaySummary(dateKey) {
    const logs = this.getAllLogs(dateKey);
    const totalCal = logs.diet.reduce((acc, curr) => acc + (curr.cal || 0), 0);
    const totalBurned = logs.activity.reduce((acc, curr) => acc + (curr.cal || 0), 0);
    const totalSteps = logs.activity.reduce((acc, curr) => acc + (curr.steps || 0), 0);
    const totalDist = logs.activity.reduce((acc, curr) => acc + (curr.dist || (curr.steps ? curr.steps * 0.0007 : 0)), 0);

    const sleepRecord = logs.sleep[0];
    const totalScreenMinutes = logs.screentime.reduce(
      (acc, curr) => acc + (curr.minutes || parseDurationMinutes(curr.duration)),
      0
    );

    // Dynamic physical health score calculation (0 - 100)
    let score = 50;
    if (totalSteps >= 8000) score += 20;
    else if (totalSteps >= 4000) score += 10;

    if (totalCal > 0 && totalBurned > 0) score += 15;
    if (sleepRecord && (sleepRecord.minutes >= 420 || sleepRecord.quality === 'Baik' || sleepRecord.quality === 'Sangat Baik')) {
      score += 15;
    }

    if (logs.diet.length === 0 && logs.activity.length === 0 && logs.sleep.length === 0 && logs.screentime.length === 0) {
      score = 0;
    } else {
      score = Math.min(100, Math.max(25, score));
    }

    return {
      date: dateKey,
      score: score,
      totalCal,
      totalBurned,
      netCalories: totalCal - totalBurned,
      totalSteps,
      totalDist: parseFloat(totalDist.toFixed(2)),
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
