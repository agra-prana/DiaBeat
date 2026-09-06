/**
 * Cloudflare D1 Client Service Layer for DiaBeat
 * Interacts with the backend Next.js Cloudflare D1 route
 */

export const cloudflareDb = {
  async init() {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'init' }),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async getProfile(userId) {
    if (!userId) return null;
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getProfile', userId }),
      });
      const data = await res.json();
      return data.profile || null;
    } catch (err) {
      console.warn('Cloudflare getProfile fallback:', err);
      return null;
    }
  },

  async saveProfile(userId, profile) {
    if (!userId || !profile) return false;
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveProfile', userId, profile }),
      });
      const data = await res.json();
      return data.success || false;
    } catch (err) {
      console.warn('Cloudflare saveProfile fallback:', err);
      return false;
    }
  },

  async getLogs(userId, dateKey) {
    if (!userId || !dateKey) return null;
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getLogs', userId, dateKey }),
      });
      const data = await res.json();
      return data.logs || null;
    } catch (err) {
      console.warn('Cloudflare getLogs fallback:', err);
      return null;
    }
  },

  async addLog(userId, type, logItem, dateKey) {
    if (!userId || !type || !logItem) return null;
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addLog', userId, type, logItem, dateKey }),
      });
      const data = await res.json();
      return data.id || null;
    } catch (err) {
      console.warn('Cloudflare addLog fallback:', err);
      return null;
    }
  },

  async deleteLog(userId, logId) {
    if (!userId || !logId) return false;
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteLog', userId, logId }),
      });
      const data = await res.json();
      return data.success || false;
    } catch (err) {
      console.warn('Cloudflare deleteLog fallback:', err);
      return false;
    }
  },
};
