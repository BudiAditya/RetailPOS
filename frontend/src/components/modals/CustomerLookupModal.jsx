import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/services/mockApi';
import { usePosStore } from '@/stores/posStore';
import { toast } from 'sonner';

export default function CustomerLookupModal({ open, onOpenChange }) {
  const [q, setQ] = React.useState('');
  const setCustomer = usePosStore((s) => s.setCustomer);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setQ('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const search = async () => {
    const c = await api.lookupCustomer(q.trim());
    if (!c) {
      toast.error('Member tidak ditemukan.');
      return;
    }
    setCustomer({ id: c.id, memberNumber: c.memberNumber, name: c.name, phone: c.phone, address: c.address });
    toast.success(`Member ${c.name} terhubung.`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-2 border-slate-700 bg-slate-50 max-w-md p-0 gap-0">
        <DialogHeader className="bg-teal-600 text-white px-4 py-2 border-b-2 border-teal-800">
          <DialogTitle className="font-pos-sans uppercase tracking-widest text-base">Cari Member (F11)</DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-3 bg-white">
          <label className="font-pos-sans text-xs uppercase tracking-widest text-slate-600">
            Member ID / Nomor Telepon / Barcode
          </label>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="M-0001 atau 081xxx"
            className="w-full h-11 px-3 bg-white border-2 border-blue-500 font-pos-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <div className="flex gap-2">
            <button onClick={() => onOpenChange(false)} className="flex-1 h-10 bg-slate-200 hover:bg-slate-300 border border-slate-400 font-pos-sans font-bold uppercase text-xs">
              Batal
            </button>
            <button onClick={search} className="flex-1 h-10 bg-teal-600 hover:bg-teal-700 text-white border-2 border-teal-800 font-pos-sans font-bold uppercase text-xs">
              Cari
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
