import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/services/mockApi';
import { useShiftStore } from '@/stores/shiftStore';
import { formatIDR, formatDateTime } from '@/lib/format';

export default function TransactionListModal({ open, onOpenChange }) {
  const shift = useShiftStore((s) => s.shift);
  const [rows, setRows] = React.useState([]);

  React.useEffect(() => {
    if (open) api.listTransactions({ shiftId: shift?.id }).then(setRows);
  }, [open, shift]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-2 border-slate-700 bg-slate-50 max-w-4xl p-0 gap-0">
        <DialogHeader className="bg-slate-900 text-white px-4 py-2 border-b-2 border-slate-700">
          <DialogTitle className="font-pos-sans uppercase tracking-widest text-base">Daftar Transaksi (F6) — Shift Saat Ini</DialogTitle>
        </DialogHeader>
        <div className="max-h-[65vh] overflow-y-auto bg-white">
          <div className="sticky top-0 grid grid-cols-12 bg-slate-200 border-b border-slate-400 px-2 py-1.5 font-pos-sans text-[11px] uppercase tracking-widest font-bold text-slate-700">
            <div className="col-span-3">TRX#</div>
            <div className="col-span-3">WAKTU</div>
            <div className="col-span-2">CUSTOMER</div>
            <div className="col-span-1 text-right">ITEM</div>
            <div className="col-span-2 text-right">TOTAL</div>
            <div className="col-span-1 text-center">STATUS</div>
          </div>
          {rows.length === 0 ? (
            <div className="p-6 text-center text-slate-500 font-pos-mono text-sm">Belum ada transaksi.</div>
          ) : (
            rows.map((t) => (
              <div key={t.id} className="grid grid-cols-12 items-center px-2 py-1.5 border-b border-slate-200 font-pos-mono text-xs">
                <div className="col-span-3 font-bold">{t.trxNumber}</div>
                <div className="col-span-3 text-slate-600">{formatDateTime(t.createdAt)}</div>
                <div className="col-span-2 truncate">{t.customer?.name || 'UMUM'}</div>
                <div className="col-span-1 text-right">{t.items?.length || 0}</div>
                <div className="col-span-2 text-right font-bold tabular-nums">{formatIDR(t.grandTotal)}</div>
                <div className="col-span-1 text-center">
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-600 text-white">{t.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
