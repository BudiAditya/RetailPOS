import { create } from 'zustand';
import { db } from '../db/database';
import { nowISO } from '../lib/format';

export const useSyncStore = create((set, get) => ({
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pending: 0,
  lastSync: null,
  setOnline: (v) => set({ online: v }),
  refreshPending: async () => {
    const c = await db.sync_queue.count();
    set({ pending: c });
  },
  sync: async () => {
    const items = await db.sync_queue.toArray();
    if (items.length === 0) {
      set({ lastSync: nowISO() });
      return { ok: true, synced: 0 };
    }
    // Frontend-only mock: pretend to push and clear the queue
    await new Promise((r) => setTimeout(r, 600));
    await db.sync_queue.clear();
    set({ pending: 0, lastSync: nowISO() });
    return { ok: true, synced: items.length };
  },
}));
