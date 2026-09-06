/**
 * Cloudflare D1 Client Service Layer for DiaBeat
 * Supports both /api/db proxy and direct Cloudflare D1 REST API execution
 */

const ACCOUNT_ID =
  process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID ||
  process.env.CLOUDFLARE_ACCOUNT_ID ||
  '';

const DATABASE_ID =
  process.env.NEXT_PUBLIC_CLOUDFLARE_D1_DATABASE_ID ||
  process.env.CLOUDFLARE_D1_DATABASE_ID ||
  '';

const API_TOKEN =
  process.env.NEXT_PUBLIC_CLOUDFLARE_API_TOKEN ||
  process.env.CLOUDFLARE_API_TOKEN ||
  '';

async function executeD1(sql, params = []) {
  // 1. Try server API route first
  try {
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'raw', sql, params }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.results) return data.results;
    }
  } catch {
    // Fallback to direct REST API
  }

  // 2. Direct Cloudflare D1 REST API
  if (ACCOUNT_ID && DATABASE_ID && API_TOKEN) {
    try {
      const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql, params }),
      });
      const data = await response.json();
      return data.result?.[0]?.results || [];
    } catch (err) {
      console.warn('Direct Cloudflare D1 error:', err);
    }
  }

  return [];
}

export const cloudflareDb = {
  async init() {
    const initSql = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        photo_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        age INTEGER NOT NULL DEFAULT 0,
        height REAL NOT NULL DEFAULT 0,
        weight REAL NOT NULL DEFAULT 0,
        gender TEXT DEFAULT 'male',
        target_cal INTEGER DEFAULT 2000,
        target_steps INTEGER DEFAULT 10000,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        name TEXT,
        time TEXT,
        calories INTEGER DEFAULT 0,
        steps INTEGER DEFAULT 0,
        distance REAL DEFAULT 0,
        duration TEXT,
        minutes INTEGER DEFAULT 0,
        quality TEXT,
        app TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    try {
      await executeD1(initSql);
      return { success: true };
    } catch {
      return null;
    }
  },

  async getProfile(userId) {
    if (!userId) return null;
    try {
      const rows = await executeD1(
        'SELECT * FROM profiles WHERE user_id = ? LIMIT 1',
        [userId]
      );
      const p = rows[0];
      if (!p) return null;
      return {
        name: p.name,
        age: Number(p.age),
        height: Number(p.height),
        weight: Number(p.weight),
        gender: p.gender || 'male',
      };
    } catch (err) {
      console.warn('Cloudflare getProfile fallback:', err);
      return null;
    }
  },

  async saveProfile(userId, profile) {
    if (!userId || !profile) return false;
    try {
      const profileId = `prof_${userId}`;
      const query = `
        INSERT INTO profiles (id, user_id, name, age, height, weight, gender, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(user_id) DO UPDATE SET
          name = excluded.name,
          age = excluded.age,
          height = excluded.height,
          weight = excluded.weight,
          gender = excluded.gender,
          updated_at = datetime('now');
      `;
      await executeD1(query, [
        profileId,
        userId,
        profile.name || '',
        Number(profile.age) || 0,
        Number(profile.height) || 0,
        Number(profile.weight) || 0,
        profile.gender || 'male',
      ]);
      return true;
    } catch (err) {
      console.warn('Cloudflare saveProfile fallback:', err);
      return false;
    }
  },

  async getLogs(userId, dateKey) {
    if (!userId || !dateKey) return null;
    try {
      const rows = await executeD1(
        'SELECT * FROM logs WHERE user_id = ? AND date = ? ORDER BY created_at DESC',
        [userId, dateKey]
      );
      if (!rows || rows.length === 0) return null;
      const grouped = { activity: [], diet: [], sleep: [], screentime: [] };
      rows.forEach((r) => {
        if (grouped[r.type]) {
          grouped[r.type].push({
            id: r.id,
            type: r.type,
            date: r.date,
            name: r.name,
            time: r.time,
            cal: r.calories,
            steps: r.steps,
            dist: r.distance,
            duration: r.duration,
            minutes: r.minutes,
            quality: r.quality,
            app: r.app,
          });
        }
      });
      return grouped;
    } catch (err) {
      console.warn('Cloudflare getLogs fallback:', err);
      return null;
    }
  },

  async addLog(userId, type, logItem, dateKey) {
    if (!userId || !type || !logItem) return null;
    try {
      const id =
        logItem.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const query = `
        INSERT INTO logs (id, user_id, type, date, name, time, calories, steps, distance, duration, minutes, quality, app)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await executeD1(query, [
        id,
        userId,
        type,
        dateKey,
        logItem.name || null,
        logItem.time || null,
        Number(logItem.cal) || 0,
        Number(logItem.steps) || 0,
        Number(logItem.dist) || 0,
        logItem.duration || null,
        Number(logItem.minutes) || 0,
        logItem.quality || null,
        logItem.app || null,
      ]);
      return id;
    } catch (err) {
      console.warn('Cloudflare addLog fallback:', err);
      return null;
    }
  },

  async deleteLog(userId, logId) {
    if (!userId || !logId) return false;
    try {
      await executeD1('DELETE FROM logs WHERE id = ? AND user_id = ?', [
        logId,
        userId,
      ]);
      return true;
    } catch (err) {
      console.warn('Cloudflare deleteLog fallback:', err);
      return false;
    }
  },
};
