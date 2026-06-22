import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/authStore';
import { useShiftStore } from '@/stores/shiftStore';
import { SHIFT } from '@/constants/testIds';
import { formatIDR } from '@/lib/format';

export default function OpenShiftModal({ open, onOpenChange }) {
  const user = useAuthStore((s) => s.user);
  const openShift = useShiftStore((s) => s.openShift);
  const [opening, setOpening] = React.useState('500000');
  const [note, setNote] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    setBusy(true);
    await openShift({ cashierId: user.id, openingCash: opening, note });
    setBusy(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        className="rounded-none border-2 border-slate-700 bg-slate-50 max-w-md p-0 gap-0"
      >
        <DialogHeader className="bg-slate-900 text-white px-4 py-2 border-b-2 border-slate-700">
          <DialogTitle className="font-pos-sans uppercase tracking-widest text-base">
            Buka Shift
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="p-4 space-y-3">
          <div>
            <label className="font-pos-sans text-xs uppercase tracking-widest text-slate-600">
              Kasir
            </label>
            <div className="h-9 px-2 bg-white border border-slate-400 font-pos-mono text-sm flex items-center">
              {user?.name} ({user?.username})
            </div>
          </div>
          <div>
            <label className="font-pos-sans text-xs uppercase tracking-widest text-slate-600">
              Kas Awal (Modal Cash Drawer)
            </label>
            <input
              data-testid={SHIFT.openingCashInput}
              type="number"
              autoFocus
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              className="w-full h-11 px-3 bg-white border-2 border-blue-500 font-pos-mono text-xl text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <div className="font-pos-mono text-xs text-slate-600 mt-1 text-right">
              = Rp {formatIDR(opening)}
            </div>
          </div>
          <div>
            <label className="font-pos-sans text-xs uppercase tracking-widest text-slate-600">
              Catatan Shift (opsional)
            </label>
            <textarea
              data-testid={SHIFT.shiftNoteInput}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-2 py-1 bg-white border border-slate-400 font-pos-mono text-sm resize-none focus:outline-none focus:border-blue-500"
            />
          </div>
          <DialogFooter className="pt-2">
            <button
              type="submit"
              data-testid={SHIFT.openShiftBtn}
              disabled={busy}
              className="w-full h-11 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-pos-sans font-bold uppercase tracking-widest border-2 border-blue-900"
            >
              {busy ? 'Membuka...' : 'BUKA SHIFT — ENTER'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
