import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/services/mockApi';
import { usePosStore } from '@/stores/posStore';
import { formatIDR } from '@/lib/format';

export default function ProductSearchModal({ open, onOpenChange }) {
  const [q, setQ] = React.useState('');
  const [rows, setRows] = React.useState([]);
  const [idx, setIdx] = React.useState(0);
  const addProduct = usePosStore((s) => s.addProduct);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setQ('');
      api.listProducts('').then(setRows);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => api.listProducts(q).then(setRows), 100);
    return () => clearTimeout(t);
  }, [q, open]);

  const pick = (p) => {
    addProduct(p);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-2 border-slate-700 bg-slate-50 max-w-4xl p-0 gap-0">
        <DialogHeader className="bg-teal-600 text-white px-4 py-2 border-b-2 border-teal-800">
          <DialogTitle className="font-pos-sans uppercase tracking-widest text-base">Cari Produk (F4)</DialogTitle>
        </DialogHeader>
        <div className="p-3 bg-slate-100 border-b border-slate-300">
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(rows.length - 1, i + 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
              if (e.key === 'Enter') { e.preventDefault(); if (rows[idx]) pick(rows[idx]); }
            }}
            placeholder="Cari berdasarkan nama atau barcode..."
            className="w-full h-11 px-3 bg-white border-2 border-blue-500 font-pos-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
        <div className="max-h-[55vh] overflow-y-auto bg-white">
          <div className="sticky top-0 grid grid-cols-12 bg-slate-200 border-b border-slate-400 px-2 py-1.5 font-pos-sans text-[11px] uppercase tracking-widest font-bold text-slate-700">
            <div className="col-span-3">BARCODE</div>
            <div className="col-span-5">NAMA</div>
            <div className="col-span-1 text-center">UNIT</div>
            <div className="col-span-2 text-right">HARGA</div>
            <div className="col-span-1 text-right">STOK</div>
          </div>
          {rows.map((p, i) => (
            <button
              key={p.id}
              onClick={() => pick(p)}
              className={`w-full grid grid-cols-12 items-center px-2 py-1.5 border-b border-slate-200 font-pos-mono text-xs text-left ${
                i === idx ? 'bg-blue-600 text-white' : 'text-slate-900 hover:bg-blue-50'
              }`}
            >
              <div className="col-span-3">{p.barcode}</div>
              <div className="col-span-5 truncate">{p.name}</div>
              <div className="col-span-1 text-center">{p.unit}</div>
              <div className="col-span-2 text-right tabular-nums">{formatIDR(p.price)}</div>
              <div className="col-span-1 text-right tabular-nums">{p.stock}</div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
