-- Cloudflare D1 Database Schema for DiaBeat
-- Run via: npx wrangler d1 execute <database_name> --file=schema.sql

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  photo_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'activity' | 'diet' | 'sleep' | 'screentime'
  date TEXT NOT NULL, -- YYYY-MM-DD
  name TEXT,
  time TEXT,
  calories INTEGER DEFAULT 0,
  steps INTEGER DEFAULT 0,
  distance REAL DEFAULT 0,
  duration TEXT,
  minutes INTEGER DEFAULT 0,
  quality TEXT,
  app TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_logs_user_date ON logs(user_id, date);

CREATE TABLE IF NOT EXISTS daily_insights (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  score INTEGER NOT NULL,
  risk TEXT NOT NULL,
  analysis TEXT,
  diet_advice TEXT,
  sleep_advice TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
