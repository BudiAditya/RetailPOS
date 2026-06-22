import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/services/mockApi';
import { useShiftStore } from '@/stores/shiftStore';
import { useAuthStore } from '@/stores/authStore';
import { formatIDR, formatDateTime } from '@/lib/format';
import ReceiptModal from './ReceiptModal';
import { Printer } from 'lucide-react';

export default function TransactionListModal({ open, onOpenChange }) {
  const shift = useShiftStore((s) => s.shift);
  const user = useAuthStore((s) => s.user);
  const [rows, setRows] = React.useState([]);
  const [reprint, setReprint] = React.useState(null);

  React.useEffect(() => {
    if (open) api.listTransactions({ shiftId: shift?.id }).then(setRows);
  }, [open, shift]);

  return (
    <>
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
              <div className="col-span-1 text-center">AKSI</div>
            </div>
            {rows.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-pos-mono text-sm">Belum ada transaksi.</div>
            ) : (
              rows.map((t) => (
                <div key={t.id} className="grid grid-cols-12 items-center px-2 py-1.5 border-b border-slate-200 font-pos-mono text-xs">
                  <div className="col-span-3 font-bold">{t.trxNumber}</div>
                  <div className="col-span-3 text-slate-600">{formatDateTime(t.createdAt)}</div>
                  <div className="col-span-2 truncate">{t.customer?.name || 'UMUM'}</div>
                  <div className="col-span-1 text-right">{(t.items || []).length}</div>
                  <div className="col-span-2 text-right font-bold tabular-nums">{formatIDR(t.grandTotal)}</div>
                  <div className="col-span-1 text-center">
                    <button
                      data-testid={`trx-reprint-${t.trxNumber}`}
                      onClick={() => setReprint({ ...t, cashierName: user?.name })}
                      className="h-7 px-2 inline-flex items-center gap-1 bg-blue-700 hover:bg-blue-800 text-white border border-blue-900 font-pos-sans font-bold uppercase tracking-widest text-[10px]"
                      title="Cetak Ulang"
                    >
                      <Printer className="h-3 w-3" /> CETAK
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
      <ReceiptModal open={!!reprint} onOpenChange={(v) => !v && setReprint(null)} trx={reprint} />
    </>
  );
}
