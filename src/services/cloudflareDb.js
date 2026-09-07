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

async function callDbApi(payload) {
  try {
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('D1 Database API call warning:', err?.message || err);
  }
  return null;
}

export const cloudflareDb = {
  async init() {
    const res = await callDbApi({ action: 'init' });
    return res?.success ? { success: true } : null;
  },

  async getProfile(userId) {
    if (!userId) return null;
    const res = await callDbApi({ action: 'getProfile', userId });
    return res?.profile || null;
  },

  async saveProfile(userId, profile) {
    if (!userId || !profile) return false;
    const res = await callDbApi({ action: 'saveProfile', userId, profile });
    return Boolean(res?.success);
  },

  async getLogs(userId, dateKey) {
    if (!userId || !dateKey) return null;
    const res = await callDbApi({ action: 'getLogs', userId, dateKey });
    return res?.logs || null;
  },

  async addLog(userId, type, logItem, dateKey) {
    if (!userId || !type || !logItem) return null;
    const res = await callDbApi({ action: 'addLog', userId, type, logItem, dateKey });
    return res?.id || null;
  },

  async deleteLog(userId, logId) {
    if (!userId || !logId) return false;
    const res = await callDbApi({ action: 'deleteLog', userId, logId });
    return Boolean(res?.success);
  },
};
