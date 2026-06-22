import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePosStore } from '@/stores/posStore';
import { formatIDR, formatDateTime } from '@/lib/format';

export default function PendingModal({ open, onOpenChange }) {
  const list = usePosStore((s) => s.pendingList);
  const loadPending = usePosStore((s) => s.loadPending);
  const resumePending = usePosStore((s) => s.resumePending);
  const deletePending = usePosStore((s) => s.deletePending);

  React.useEffect(() => { if (open) loadPending(); }, [open, loadPending]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-2 border-slate-700 bg-slate-50 max-w-3xl p-0 gap-0">
        <DialogHeader className="bg-amber-500 text-slate-900 px-4 py-2 border-b-2 border-amber-700">
          <DialogTitle className="font-pos-sans uppercase tracking-widest text-base">Transaksi Pending (F7)</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto bg-white">
          {list.length === 0 ? (
            <div className="p-6 text-center text-slate-500 font-pos-mono text-sm">Tidak ada transaksi pending.</div>
          ) : (
            list.map((p) => {
              const total = (p.items || []).reduce((s, it) => s + (it.lineTotal || 0), 0);
              return (
                <div key={p.id} className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 font-pos-mono text-sm">
                  <div className="flex-1">
                    <div className="font-bold">{p.trxNumber}</div>
                    <div className="text-xs text-slate-500">{formatDateTime(p.createdAt)} · {p.items?.length || 0} item · {p.customer?.name || 'UMUM'}</div>
                  </div>
                  <div className="w-32 text-right font-bold tabular-nums">{formatIDR(total)}</div>
                  <button onClick={() => { resumePending(p.id); onOpenChange(false); }} className="h-9 px-3 bg-teal-600 hover:bg-teal-700 text-white border border-teal-800 font-pos-sans font-bold uppercase text-xs">
                    Resume
                  </button>
                  <button onClick={() => deletePending(p.id)} className="h-9 px-3 bg-red-600 hover:bg-red-700 text-white border border-red-800 font-pos-sans font-bold uppercase text-xs">
                    Hapus
                  </button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
