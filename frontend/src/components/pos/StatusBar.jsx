import React from 'react';
import { useSyncStore } from '@/stores/syncStore';
import { useAuthStore } from '@/stores/authStore';
import { useShiftStore } from '@/stores/shiftStore';
import { usePosStore } from '@/stores/posStore';
import { formatTime } from '@/lib/format';
import { POS } from '@/constants/testIds';
import { Wifi, WifiOff, RefreshCw, Lock } from 'lucide-react';

export default function StatusBar() {
  const online = useSyncStore((s) => s.online);
  const pending = useSyncStore((s) => s.pending);
  const lastSync = useSyncStore((s) => s.lastSync);
  const user = useAuthStore((s) => s.user);
  const shift = useShiftStore((s) => s.shift);
  const trxNumber = usePosStore((s) => s.trxNumber);

  const state = pending > 0 ? 'pending' : online ? 'online' : 'offline';
  const dotCls =
    state === 'online'
      ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
      : state === 'offline'
        ? 'bg-red-500 shadow-[0_0_8px_#ef4444]'
        : 'bg-amber-300 shadow-[0_0_8px_#fcd34d]';
  const stateLabel = state === 'online' ? 'ONLINE' : state === 'offline' ? 'OFFLINE' : 'SYNC PENDING';

  return (
    <div
      data-testid={POS.statusBar}
      className="h-7 bg-slate-950 text-slate-200 flex items-center justify-between px-3 border-t-2 border-slate-800 font-pos-mono text-[11px] select-none"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5" data-testid={POS.syncIndicator}>
          <span className={`w-2 h-2 rounded-full ${dotCls}`} />
          {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          <span className="font-pos-sans font-bold tracking-widest">{stateLabel}</span>
        </div>
        <span className="text-slate-500">|</span>
        <span>
          PENDING SYNC: <span className="text-amber-300 font-bold">{pending}</span>
        </span>
        <span className="text-slate-500">|</span>
        <span className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3" />
          LAST SYNC: <span className="text-slate-100">{lastSync ? formatTime(lastSync) : '—'}</span>
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span>
          SESSION: <span className="text-slate-100">{shift?.id?.slice(0, 8) || '—'}</span>
        </span>
        <span>
          SHIFT: <span className="text-emerald-300 font-bold">{shift?.shiftNumber || '—'}</span>
        </span>
        <span className="flex items-center gap-1">
          <Lock className="h-3 w-3" /> USER: <span className="text-slate-100">{user?.username || '—'}</span>
        </span>
        <span>
          TRX#: <span className="text-amber-300 font-bold">{trxNumber}</span>
        </span>
      </div>
    </div>
  );
}
