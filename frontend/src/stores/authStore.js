import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '../db/database';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      login: async (username, pin) => {
        const u = await db.users.where('username').equals(username).first();
        if (!u || u.pin !== pin) return { ok: false, error: 'Username atau PIN salah.' };
        set({ user: { id: u.id, username: u.username, name: u.name, role: u.role } });
        return { ok: true };
      },
      logout: () => set({ user: null }),
      isAuthed: () => !!get().user,
    }),
    { name: 'pos-auth' }
  )
);
