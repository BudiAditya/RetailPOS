import { create } from 'zustand';
import { db } from '../db/database';
import { uid, nowISO, BIRTHDAY_DISCOUNT_PCT, RUPIAH_PER_POINT, pointsEarned, isBirthdayMonth } from '../lib/format';
import { api } from '../services/mockApi';

const calcLine = (it) => {
  const sign = (Number(it.qty) || 0) < 0 ? -1 : 1;
  const grossAbs = Math.abs(Number(it.qty) || 0) * (Number(it.unitPrice) || 0);
  const discAmt =
    (Number(it.discPct) || 0) > 0
      ? grossAbs * ((Number(it.discPct) || 0) / 100)
      : Number(it.discAmount) || 0;
  return sign * Math.max(0, grossAbs - discAmt);
};

const recompute = (items) => items.map((it) => ({ ...it, lineTotal: calcLine(it) }));

let trxCounter = 1;
const newTrxNumber = () => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const n = String(trxCounter++).padStart(4, '0');
  return `TRX-${ymd}-${n}`;
};

export const usePosStore = create((set, get) => ({
  trxNumber: newTrxNumber(),
  items: [],
  qty: 1,
  selectedIndex: -1,
  customer: null, // {id, memberNumber, name, phone, address, points, lifetimeSpend, birthMonth}
  deliveryMethod: 'TAKE AWAY',
  pendingList: [],
  mode: 'SALE', // SALE | RETURN
  loyaltyRedeem: 0, // points redeemed in current transaction
  birthdayDiscount: false, // auto-enabled when customer.birthMonth matches today

  setQty: (q) => set({ qty: Math.max(1, Number(q) || 1) }),
  setSelectedIndex: (i) => set({ selectedIndex: i }),
  setDelivery: (m) => set({ deliveryMethod: m }),
  setCustomer: (c) => set({
    customer: c,
    birthdayDiscount: !!(c && isBirthdayMonth(c.birthMonth)),
    loyaltyRedeem: 0,
  }),
  setMode: (m) => set({ mode: m }),
  setLoyaltyRedeem: (p) => {
    const c = get().customer;
    const max = Math.max(0, Number(c?.points || 0));
    set({ loyaltyRedeem: Math.max(0, Math.min(max, Number(p) || 0)) });
  },
  setBirthdayDiscount: (v) => set({ birthdayDiscount: !!v }),

  addByBarcode: async (barcode) => {
    if (!barcode) return { ok: false, error: 'Barcode kosong' };
    const p = await db.products.where('barcode').equals(barcode.trim()).first();
    if (!p) return { ok: false, error: `Produk tidak ditemukan: ${barcode}` };
    const { qty, items, mode } = get();
    const sign = mode === 'RETURN' ? -1 : 1;
    // Stack same product
    const idx = items.findIndex((it) => it.productId === p.id && it.discPct === 0 && it.discAmount === 0);
    let next;
    if (idx >= 0) {
      next = [...items];
      next[idx] = { ...next[idx], qty: next[idx].qty + sign * qty };
    } else {
      next = [
        ...items,
        {
          id: uid(),
          productId: p.id,
          barcode: p.barcode,
          name: p.name,
          unit: p.unit,
          qty: sign * qty,
          unitPrice: p.price,
          discPct: 0,
          discAmount: 0,
          lineTotal: 0,
        },
      ];
    }
    set({ items: recompute(next), qty: 1, selectedIndex: (idx >= 0 ? idx : next.length - 1) });
    return { ok: true, product: p };
  },

  addProduct: (p, qtyOverride) => {
    const { items, qty, mode } = get();
    const sign = mode === 'RETURN' ? -1 : 1;
    const useQty = (qtyOverride ?? qty) * sign;
    const next = [
      ...items,
      {
        id: uid(),
        productId: p.id,
        barcode: p.barcode,
        name: p.name,
        unit: p.unit,
        qty: useQty,
        unitPrice: p.price,
        discPct: 0,
        discAmount: 0,
        lineTotal: 0,
      },
    ];
    set({ items: recompute(next), qty: 1, selectedIndex: next.length - 1 });
  },

  updateItem: (id, patch) => {
    const next = get().items.map((it) => (it.id === id ? { ...it, ...patch } : it));
    set({ items: recompute(next) });
  },

  removeItem: (id) => {
    const next = get().items.filter((it) => it.id !== id);
    set({ items: next, selectedIndex: Math.min(get().selectedIndex, next.length - 1) });
  },

  cancelTransaction: () => set({ items: [], qty: 1, selectedIndex: -1, customer: null, deliveryMethod: 'TAKE AWAY', mode: 'SALE', trxNumber: newTrxNumber(), loyaltyRedeem: 0, birthdayDiscount: false }),

  totals: () => {
    const items = get().items;
    const totalQty = items.reduce((s, it) => s + (Number(it.qty) || 0), 0);
    const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0);
    const lineTotal = items.reduce((s, it) => s + (Number(it.lineTotal) || 0), 0);
    const discount = subtotal - lineTotal;
    return { totalQty, subtotal, discount, grandTotal: lineTotal };
  },

  savePending: async () => {
    const { items, customer, deliveryMethod, trxNumber } = get();
    if (items.length === 0) return { ok: false, error: 'Transaksi kosong' };
    const rec = {
      id: uid(),
      trxNumber,
      items,
      customer,
      deliveryMethod,
      createdAt: nowISO(),
    };
    await db.pending_transactions.add(rec);
    set({ items: [], customer: null, deliveryMethod: 'TAKE AWAY', selectedIndex: -1, trxNumber: newTrxNumber() });
    return { ok: true };
  },

  loadPending: async () => {
    const list = await db.pending_transactions.orderBy('createdAt').reverse().toArray();
    set({ pendingList: list });
    return list;
  },

  resumePending: async (id) => {
    const rec = await db.pending_transactions.get(id);
    if (!rec) return;
    set({
      items: recompute(rec.items),
      customer: rec.customer || null,
      deliveryMethod: rec.deliveryMethod || 'TAKE AWAY',
      trxNumber: rec.trxNumber,
      selectedIndex: rec.items.length - 1,
    });
    await db.pending_transactions.delete(id);
    await get().loadPending();
  },

  deletePending: async (id) => {
    await db.pending_transactions.delete(id);
    await get().loadPending();
  },

  finalize: async ({ payments, shiftId, cashierId }) => {
    const { items, customer, deliveryMethod, trxNumber, mode, loyaltyRedeem, birthdayDiscount } = get();
    // Item-level totals
    const totalQty = items.reduce((s, it) => s + (Number(it.qty) || 0), 0);
    const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0);
    const lineTotal = items.reduce((s, it) => s + (Number(it.lineTotal) || 0), 0);
    const itemDiscount = subtotal - lineTotal;
    // Birthday discount
    const birthdayAmt = birthdayDiscount ? Math.round(lineTotal * (BIRTHDAY_DISCOUNT_PCT / 100)) : 0;
    // Loyalty redemption
    const redeemPoints = Math.max(0, Math.min(Number(loyaltyRedeem) || 0, Number(customer?.points || 0)));
    const redeemAmt = redeemPoints * RUPIAH_PER_POINT;
    const grandTotal = Math.max(0, lineTotal - birthdayAmt - redeemAmt);
    const earnedPoints = customer?.id ? pointsEarned(grandTotal) : 0;

    const trx = {
      id: uid(),
      trxNumber,
      shiftId,
      cashierId,
      type: mode,
      customer,
      deliveryMethod,
      payments,
      paid: payments.reduce((s, p) => s + (Number(p.amount) || 0), 0),
      change: Math.max(0, payments.reduce((s, p) => s + (Number(p.amount) || 0), 0) - grandTotal),
      totalQty,
      subtotal,
      discount: itemDiscount,
      birthdayDiscount: birthdayAmt,
      loyaltyRedeem: redeemAmt,
      loyaltyRedeemPoints: redeemPoints,
      loyaltyEarnedPoints: earnedPoints,
      grandTotal,
      status: 'COMPLETED',
      createdAt: nowISO(),
    };
    const itemRows = items.map((it) => ({ ...it, transactionId: trx.id }));
    await db.transactions.add(trx);
    await db.transaction_items.bulkAdd(itemRows);
    await db.sync_queue.add({ entity: 'transactions', op: 'create', refId: trx.id, createdAt: nowISO() });
    if (customer?.id) {
      await api.applyLoyalty({
        customerId: customer.id,
        redeemed: redeemPoints,
        earned: earnedPoints,
        spend: grandTotal,
      });
    }
    set({ items: [], customer: null, deliveryMethod: 'TAKE AWAY', selectedIndex: -1, mode: 'SALE', trxNumber: newTrxNumber(), loyaltyRedeem: 0, birthdayDiscount: false });
    return { ...trx, items: itemRows };
  },
}));
