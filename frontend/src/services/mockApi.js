// Mock REST/JWT API layer (frontend-only). All operations are performed via Dexie.
// This module exists to keep the "REST + JWT" abstraction intact for future swap-in.

import { db } from '../db/database';
import { uid, nowISO } from '../lib/format';

const TOKEN_KEY = 'pos-jwt';

const fakeJwt = (payload) => {
  const body = btoa(JSON.stringify({ ...payload, iat: Date.now() }));
  return `mock.${body}.sig`;
};

export const api = {
  setToken: (t) => localStorage.setItem(TOKEN_KEY, t),
  getToken: () => localStorage.getItem(TOKEN_KEY),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),

  async login(username, pin) {
    const u = await db.users.where('username').equals(username).first();
    if (!u || u.pin !== pin) throw new Error('Invalid credentials');
    const token = fakeJwt({ sub: u.id, role: u.role });
    api.setToken(token);
    return { token, user: { id: u.id, name: u.name, role: u.role, username: u.username } };
  },

  async listProducts(q = '') {
    if (!q) return db.products.limit(50).toArray();
    const ql = q.toLowerCase();
    return (await db.products.toArray()).filter(
      (p) => p.name.toLowerCase().includes(ql) || p.barcode.includes(q),
    );
  },

  async lookupCustomer(q) {
    if (!q) return null;
    const byMember = await db.customers.where('memberNumber').equals(q).first();
    if (byMember) return byMember;
    const byPhone = await db.customers.where('phone').equals(q).first();
    return byPhone || null;
  },

  async addPettyCash({ shiftId, type, amount, reason, reference }) {
    const rec = { id: uid(), shiftId, type, amount: Number(amount) || 0, reason, reference, createdAt: nowISO() };
    await db.petty_cash.add(rec);
    await db.sync_queue.add({ entity: 'petty_cash', op: 'create', refId: rec.id, createdAt: nowISO() });
    return rec;
  },

  async listPettyCash(shiftId) {
    return db.petty_cash.where('shiftId').equals(shiftId).toArray();
  },

  async listTransactions({ shiftId } = {}) {
    if (!shiftId) return db.transactions.orderBy('createdAt').reverse().toArray();
    return db.transactions.where('shiftId').equals(shiftId).toArray();
  },

  async createReturn({ originalTrxId, items, reason, shiftId, cashierId }) {
    const total = items.reduce((s, it) => s + (Number(it.lineTotal) || 0), 0);
    const rec = {
      id: uid(),
      originalTrxId,
      items,
      reason,
      shiftId,
      cashierId,
      total,
      createdAt: nowISO(),
    };
    await db.returns.add(rec);
    await db.sync_queue.add({ entity: 'returns', op: 'create', refId: rec.id, createdAt: nowISO() });
    return rec;
  },

  async shiftSummary(shiftId) {
    const trx = await db.transactions.where('shiftId').equals(shiftId).toArray();
    const petty = await db.petty_cash.where('shiftId').equals(shiftId).toArray();
    let cashSales = 0;
    let nonCashSales = 0;
    for (const t of trx) {
      for (const p of t.payments || []) {
        if (p.method === 'CASH') cashSales += Number(p.amount) || 0;
        else nonCashSales += Number(p.amount) || 0;
      }
    }
    const pettyIn = petty.filter((p) => p.type === 'IN').reduce((s, p) => s + p.amount, 0);
    const pettyOut = petty.filter((p) => p.type === 'OUT').reduce((s, p) => s + p.amount, 0);
    return { cashSales, nonCashSales, pettyIn, pettyOut, transactions: trx.length };
  },
};
