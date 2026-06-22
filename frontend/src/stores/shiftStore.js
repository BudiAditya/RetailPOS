import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '../db/database';
import { uid, nowISO } from '../lib/format';

export const useShiftStore = create(
  persist(
    (set, get) => ({
      shift: null,
      openShift: async ({ cashierId, openingCash, note }) => {
        const shiftNumber = `SH-${Date.now().toString().slice(-8)}`;
        const shift = {
          id: uid(),
          shiftNumber,
          cashierId,
          openingCash: Number(openingCash) || 0,
          note: note || '',
          openTime: nowISO(),
          closeTime: null,
          status: 'OPEN',
        };
        await db.shifts.add(shift);
        set({ shift });
        return shift;
      },
      closeShift: async ({ actualCash, expectedCash, summary }) => {
        const s = get().shift;
        if (!s) return null;
        const closed = {
          ...s,
          status: 'CLOSED',
          closeTime: nowISO(),
          actualCash: Number(actualCash) || 0,
          expectedCash: Number(expectedCash) || 0,
          difference: (Number(actualCash) || 0) - (Number(expectedCash) || 0),
          summary,
        };
        await db.shifts.put(closed);
        set({ shift: null });
        return closed;
      },
    }),
    { name: 'pos-shift' }
  )
);
