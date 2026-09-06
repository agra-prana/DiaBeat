import { NextResponse } from 'next/server';

/**
 * Cloudflare D1 Database Proxy API Route
 * Handles secure database operations using Cloudflare D1 REST API
 */

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

async function executeD1Query(sql, params = []) {
  if (!ACCOUNT_ID || !DATABASE_ID || !API_TOKEN) {
    throw new Error('Cloudflare D1 credentials are not configured in environment variables');
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sql,
      params,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    const errorMsg = data.errors?.[0]?.message || 'Cloudflare D1 Query failed';
    throw new Error(errorMsg);
  }

  return data.result?.[0]?.results || [];
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, userId, profile, logItem, dateKey, logId, type } = body;

    // Check if Cloudflare is configured
    if (!ACCOUNT_ID || !DATABASE_ID || !API_TOKEN) {
      return NextResponse.json({
        configured: false,
        message: 'Cloudflare credentials not set, fallback to client store',
      });
    }

    switch (action) {
      case 'init': {
        // Auto initialize tables if not exist
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
        await executeD1Query(initSql);
        return NextResponse.json({ success: true, message: 'Database initialized' });
      }

      case 'getProfile': {
        const rows = await executeD1Query(
          'SELECT * FROM profiles WHERE user_id = ? LIMIT 1',
          [userId]
        );
        const p = rows[0];
        if (!p) return NextResponse.json({ profile: null });
        return NextResponse.json({
          profile: {
            name: p.name,
            age: Number(p.age),
            height: Number(p.height),
            weight: Number(p.weight),
            gender: p.gender || 'male',
          },
        });
      }

      case 'saveProfile': {
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
        await executeD1Query(query, [
          profileId,
          userId,
          profile.name || '',
          Number(profile.age) || 0,
          Number(profile.height) || 0,
          Number(profile.weight) || 0,
          profile.gender || 'male',
        ]);
        return NextResponse.json({ success: true });
      }

      case 'getLogs': {
        const rows = await executeD1Query(
          'SELECT * FROM logs WHERE user_id = ? AND date = ? ORDER BY created_at DESC',
          [userId, dateKey]
        );
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
        return NextResponse.json({ logs: grouped });
      }

      case 'addLog': {
        const id = logItem.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const query = `
          INSERT INTO logs (id, user_id, type, date, name, time, calories, steps, distance, duration, minutes, quality, app)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await executeD1Query(query, [
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
        return NextResponse.json({ success: true, id });
      }

      case 'deleteLog': {
        await executeD1Query('DELETE FROM logs WHERE id = ? AND user_id = ?', [logId, userId]);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Cloudflare D1 API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
