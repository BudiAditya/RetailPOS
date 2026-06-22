import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useShiftStore } from '@/stores/shiftStore';
import { api } from '@/services/mockApi';
import { SHIFT } from '@/constants/testIds';
import { formatIDR } from '@/lib/format';

export default function CloseShiftModal({ open, onOpenChange, onClosed }) {
  const shift = useShiftStore((s) => s.shift);
  const closeShift = useShiftStore((s) => s.closeShift);
  const [actual, setActual] = React.useState('');
  const [summary, setSummary] = React.useState(null);

  React.useEffect(() => {
    if (!open || !shift) return;
    api.shiftSummary(shift.id).then(setSummary);
    setActual('');
  }, [open, shift]);

  if (!shift) return null;

  const expected =
    Number(shift.openingCash) +
    Number(summary?.cashSales || 0) +
    Number(summary?.pettyIn || 0) -
    Number(summary?.pettyOut || 0);
  const diff = (Number(actual) || 0) - expected;

  const submit = async (e) => {
    e?.preventDefault();
    const closed = await closeShift({ actualCash: actual, expectedCash: expected, summary });
    onOpenChange(false);
    onClosed?.(closed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-2 border-slate-700 bg-slate-50 max-w-xl p-0 gap-0">
        <DialogHeader className="bg-red-700 text-white px-4 py-2 border-b-2 border-red-900">
          <DialogTitle className="font-pos-sans uppercase tracking-widest text-base">
            Tutup Shift — {shift.shiftNumber}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="p-4 space-y-2">
          <Row label="Kas Awal" value={formatIDR(shift.openingCash)} />
          <Row label="Total Penjualan Cash" value={formatIDR(summary?.cashSales || 0)} />
          <Row label="Total Penjualan Non-Cash" value={formatIDR(summary?.nonCashSales || 0)} />
          <Row label="Kas Kecil Masuk" value={formatIDR(summary?.pettyIn || 0)} />
          <Row label="Kas Kecil Keluar" value={`(${formatIDR(summary?.pettyOut || 0)})`} />
          <Row
            label="Expected Cash (Seharusnya)"
            value={formatIDR(expected)}
            highlight
            testid={SHIFT.expectedCash}
          />
          <div className="pt-2">
            <label className="font-pos-sans text-xs uppercase tracking-widest text-slate-600">
              Actual Cash (Fisik di Drawer)
            </label>
            <input
              data-testid={SHIFT.actualCashInput}
              type="number"
              autoFocus
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              className="w-full h-12 px-3 bg-white border-2 border-blue-500 font-pos-mono text-xl text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          <Row
            label="Selisih"
            value={`${diff < 0 ? '-' : diff > 0 ? '+' : ''}${formatIDR(Math.abs(diff))}`}
            tone={diff === 0 ? 'ok' : diff < 0 ? 'bad' : 'warn'}
            testid={SHIFT.differenceDisplay}
          />
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11 bg-slate-200 hover:bg-slate-300 text-slate-800 font-pos-sans font-bold uppercase border border-slate-400"
            >
              Batal
            </button>
            <button
              type="submit"
              data-testid={SHIFT.closeShiftBtn}
              className="flex-1 h-11 bg-red-700 hover:bg-red-800 text-white font-pos-sans font-bold uppercase border-2 border-red-900"
            >
              Konfirmasi Tutup Shift
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, highlight, tone, testid }) {
  const toneCls = tone === 'ok' ? 'text-emerald-600' : tone === 'bad' ? 'text-red-600' : tone === 'warn' ? 'text-amber-600' : 'text-slate-900';
  return (
    <div
      className={`flex items-center justify-between border-b border-slate-300 py-1 ${
        highlight ? 'bg-blue-50 border-blue-300 px-2' : ''
      }`}
    >
      <span className="font-pos-sans text-xs uppercase tracking-widest text-slate-600">{label}</span>
      <span data-testid={testid} className={`font-pos-mono font-bold tabular-nums ${highlight ? 'text-lg text-blue-700' : `text-base ${toneCls}`}`}>
        {value}
      </span>
    </div>
  );
}
