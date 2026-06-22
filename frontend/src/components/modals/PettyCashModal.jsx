import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/services/mockApi';
import { useShiftStore } from '@/stores/shiftStore';
import { formatIDR, formatDateTime } from '@/lib/format';
import { toast } from 'sonner';

export default function PettyCashModal({ open, onOpenChange }) {
  const shift = useShiftStore((s) => s.shift);
  const [type, setType] = React.useState('IN');
  const [amount, setAmount] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [reference, setReference] = React.useState('');
  const [list, setList] = React.useState([]);

  const reload = React.useCallback(async () => {
    if (!shift) return;
    setList(await api.listPettyCash(shift.id));
  }, [shift]);

  React.useEffect(() => {
    if (open) {
      reload();
      setAmount('');
      setReason('');
      setReference('');
      setType('IN');
    }
  }, [open, reload]);

  const submit = async () => {
    if (!shift) return toast.error('Shift belum dibuka.');
    if (!amount || Number(amount) <= 0) return toast.error('Nominal harus > 0');
    if (!reason.trim()) return toast.error('Alasan wajib diisi.');
    await api.addPettyCash({ shiftId: shift.id, type, amount, reason, reference });
    toast.success(`Kas ${type === 'IN' ? 'masuk' : 'keluar'} dicatat.`);
    reload();
    setAmount('');
    setReason('');
    setReference('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-2 border-slate-700 bg-slate-50 max-w-3xl p-0 gap-0">
        <DialogHeader className="bg-amber-500 text-slate-900 px-4 py-2 border-b-2 border-amber-700">
          <DialogTitle className="font-pos-sans uppercase tracking-widest text-base">Kas Kecil (Petty Cash)</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-12 gap-0">
          <div className="col-span-5 p-3 border-r border-slate-300 bg-white space-y-2">
            <div className="flex border border-slate-400">
              <button onClick={() => setType('IN')} className={`flex-1 h-10 font-pos-sans font-bold uppercase tracking-widest ${type === 'IN' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>Cash IN</button>
              <button onClick={() => setType('OUT')} className={`flex-1 h-10 font-pos-sans font-bold uppercase tracking-widest border-l border-slate-400 ${type === 'OUT' ? 'bg-red-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>Cash OUT</button>
            </div>
            <div>
              <label className="font-pos-sans text-xs uppercase tracking-widest text-slate-600">Nominal</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-11 px-3 bg-white border-2 border-blue-500 font-pos-mono text-xl text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div>
              <label className="font-pos-sans text-xs uppercase tracking-widest text-slate-600">Alasan</label>
              <input value={reason} onChange={(e) => setReason(e.target.value)} className="w-full h-9 px-2 bg-white border border-slate-400 font-pos-mono text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="font-pos-sans text-xs uppercase tracking-widest text-slate-600">Referensi (opsional)</label>
              <input value={reference} onChange={(e) => setReference(e.target.value)} className="w-full h-9 px-2 bg-white border border-slate-400 font-pos-mono text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <button onClick={submit} className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white border-2 border-blue-900 font-pos-sans font-bold uppercase tracking-widest">
              Simpan Kas {type === 'IN' ? 'Masuk' : 'Keluar'}
            </button>
          </div>
          <div className="col-span-7 bg-white overflow-y-auto max-h-[60vh]">
            <div className="sticky top-0 bg-slate-200 border-b border-slate-400 px-2 py-1.5 font-pos-sans text-xs uppercase tracking-widest font-bold text-slate-700">
              Riwayat Shift Ini
            </div>
            {list.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 font-pos-mono">Belum ada catatan.</div>
            ) : (
              list.map((p) => (
                <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 border-b border-slate-200 font-pos-mono text-xs">
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold ${p.type === 'IN' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    {p.type}
                  </span>
                  <span className="flex-1 text-slate-800">{p.reason}</span>
                  <span className="text-slate-500">{formatDateTime(p.createdAt)}</span>
                  <span className={`w-28 text-right tabular-nums font-bold ${p.type === 'IN' ? 'text-emerald-700' : 'text-red-700'}`}>
                    {p.type === 'IN' ? '+' : '-'} {formatIDR(p.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
