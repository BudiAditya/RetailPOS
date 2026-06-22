import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useShiftStore } from '@/stores/shiftStore';
import { usePosStore } from '@/stores/posStore';
import { useTotals } from '@/hooks/useTotals';
import { formatIDR, formatTime } from '@/lib/format';
import { POS } from '@/constants/testIds';

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const shift = useShiftStore((s) => s.shift);
  const trxNumber = usePosStore((s) => s.trxNumber);
  const totals = useTotals();
  const mode = usePosStore((s) => s.mode);
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="flex border-b-2 border-slate-700 bg-slate-900 text-white">
      {/* Left: Store info */}
      <div className="flex-1 px-4 py-2 border-r border-slate-700">
        <div className="font-pos-sans text-[15px] font-bold tracking-wide">
          TOKO MAJU JAYA — CABANG PUSAT
        </div>
        <div className="font-pos-mono text-[11px] text-slate-300 leading-tight">
          JL. RAYA MERDEKA NO. 88, JAKARTA SELATAN · TEL. 021-555-0188
        </div>
        <div className="font-pos-mono text-[11px] text-slate-400">
          OUTLET: <span className="text-amber-300">PST-001</span> · POS-01
        </div>
      </div>

      {/* Center: Cashier info */}
      <div className="flex-1 px-4 py-2 border-r border-slate-700">
        <div className="font-pos-sans text-[11px] uppercase tracking-widest text-slate-400">
          Kasir
        </div>
        <div className="font-pos-mono text-[15px] font-bold text-white leading-tight">
          {user?.name || '—'}{' '}
          <span className="text-slate-500">({user?.username || '—'})</span>
        </div>
        <div className="font-pos-mono text-[11px] text-slate-300 flex gap-3">
          <span>SHIFT: <span className="text-emerald-300">{shift?.shiftNumber || '—'}</span></span>
          <span>STATUS: <span className={shift ? 'text-emerald-300' : 'text-red-400'}>{shift ? 'OPEN' : 'CLOSED'}</span></span>
          <span>TRX#: <span className="text-amber-300" data-testid="header-trx-number">{trxNumber}</span></span>
        </div>
      </div>

      {/* Right: BIG TOTAL */}
      <div className="bg-blue-700 border-l-4 border-blue-900 px-5 py-2 min-w-[380px] flex flex-col items-end justify-center">
        <div className="flex justify-between w-full items-center">
          <span className="font-pos-sans text-[11px] uppercase tracking-widest text-blue-200">
            {mode === 'RETURN' ? 'RETUR PENJUALAN' : 'TOTAL BAYAR'}
          </span>
          <span className="font-pos-mono text-[11px] text-blue-200">{formatTime(now)}</span>
        </div>
        <div
          data-testid={POS.bigTotal}
          className="font-pos-mono font-bold text-white leading-none tracking-tight tabular-nums drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]"
          style={{ fontSize: 56 }}
        >
          {formatIDR(totals.grandTotal)}
        </div>
      </div>
    </header>
  );
}
