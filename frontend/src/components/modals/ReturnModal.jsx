import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/services/mockApi';
import { formatIDR, formatDateTime } from '@/lib/format';
import { useShiftStore } from '@/stores/shiftStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export default function ReturnModal({ open, onOpenChange }) {
  const [list, setList] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [reason, setReason] = React.useState('');
  const [picked, setPicked] = React.useState({}); // {itemId: qty}
  const shift = useShiftStore((s) => s.shift);
  const user = useAuthStore((s) => s.user);

  React.useEffect(() => {
    if (!open) return;
    api.listTransactions().then((all) => setList(all.slice(0, 30)));
    setSelected(null);
    setPicked({});
    setReason('');
  }, [open]);

  const total = selected
    ? (selected.items || []).reduce((s, it) => {
        const q = Number(picked[it.id] || 0);
        const unit = it.qty !== 0 ? it.lineTotal / it.qty : 0;
        return s + q * unit;
      }, 0)
    : 0;

  const submit = async () => {
    if (!selected) return toast.error('Pilih transaksi asal terlebih dahulu.');
    if (!reason.trim()) return toast.error('Wajib mengisi alasan retur.');
    const items = (selected.items || [])
      .filter((it) => Number(picked[it.id] || 0) > 0)
      .map((it) => {
        const unit = it.qty !== 0 ? it.lineTotal / it.qty : 0;
        const q = Number(picked[it.id]);
        return { ...it, qty: -q, lineTotal: -(q * unit) };
      });
    if (items.length === 0) return toast.error('Pilih minimal 1 item.');
    await api.createReturn({
      originalTrxId: selected.id,
      items,
      reason,
      shiftId: shift?.id,
      cashierId: user?.id,
    });
    toast.success('Retur berhasil disimpan.');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-2 border-slate-700 bg-slate-50 max-w-5xl p-0 gap-0 max-h-[85vh]">
        <DialogHeader className="bg-red-700 text-white px-4 py-2 border-b-2 border-red-900">
          <DialogTitle className="font-pos-sans uppercase tracking-widest text-base">
            Retur Penjualan
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-12 gap-0 h-[70vh]">
          {/* Original transactions list */}
          <div className="col-span-5 border-r border-slate-300 overflow-y-auto bg-white">
            <div className="sticky top-0 bg-slate-200 border-b border-slate-400 px-2 py-1.5 font-pos-sans text-xs uppercase tracking-widest font-bold text-slate-700">
              Transaksi Asal
            </div>
            {list.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 font-pos-mono">Belum ada transaksi.</div>
            ) : (
              list.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setSelected(t); setPicked({}); }}
                  className={`w-full text-left px-2 py-1.5 border-b border-slate-200 font-pos-mono text-xs ${
                    selected?.id === t.id ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-slate-900'
                  }`}
                >
                  <div className="flex justify-between font-bold">
                    <span>{t.trxNumber}</span>
                    <span>{formatIDR(t.grandTotal)}</span>
                  </div>
                  <div className={selected?.id === t.id ? 'text-blue-100' : 'text-slate-500'}>
                    {formatDateTime(t.createdAt)} · {(t.items || []).length} item
                  </div>
                </button>
              ))
            )}
          </div>
          {/* Items to return */}
          <div className="col-span-7 bg-white overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-slate-200 border-b border-slate-400 px-2 py-1.5 font-pos-sans text-xs uppercase tracking-widest font-bold text-slate-700">
              Item Diretur
            </div>
            <div className="flex-1 overflow-y-auto">
              {!selected ? (
                <div className="p-4 text-sm text-slate-500 font-pos-mono">Pilih transaksi di kiri untuk melihat item.</div>
              ) : (
                selected.items?.map?.((it) => {
                  const max = Math.abs(it.qty);
                  return (
                    <div key={it.id} className="flex items-center gap-2 px-2 py-1.5 border-b border-slate-200 font-pos-mono text-xs">
                      <div className="flex-1 truncate text-slate-900">{it.name}</div>
                      <div className="w-20 text-right text-slate-600">x{max}</div>
                      <div className="w-24 text-right text-slate-700">{formatIDR(it.lineTotal / it.qty)}</div>
                      <input
                        type="number"
                        min="0"
                        max={max}
                        value={picked[it.id] || ''}
                        onChange={(e) =>
                          setPicked({ ...picked, [it.id]: Math.min(max, Math.max(0, Number(e.target.value) || 0)) })
                        }
                        className="w-20 h-8 px-1 border border-blue-500 text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  );
                })
              )}
            </div>
            <div className="border-t-2 border-slate-700 bg-slate-100 p-2 space-y-2">
              <div>
                <label className="font-pos-sans text-xs uppercase tracking-widest text-slate-600">Alasan Retur</label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Cth: Produk rusak / salah ambil"
                  className="w-full h-9 px-2 bg-white border border-slate-400 font-pos-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center justify-between border-2 border-red-300 bg-red-50 px-3 py-2">
                <span className="font-pos-sans uppercase tracking-widest text-xs text-red-700">Total Retur</span>
                <span className="font-pos-mono text-xl font-bold text-red-700 tabular-nums">- {formatIDR(total)}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onOpenChange(false)} className="flex-1 h-10 bg-slate-200 hover:bg-slate-300 border border-slate-400 font-pos-sans font-bold uppercase text-xs">
                  Batal
                </button>
                <button onClick={submit} className="flex-1 h-10 bg-red-700 hover:bg-red-800 text-white border-2 border-red-900 font-pos-sans font-bold uppercase text-xs">
                  Proses Retur
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
