import React from 'react';
import { usePosStore } from '@/stores/posStore';
import { useTotals } from '@/hooks/useTotals';
import { formatIDR, formatQty } from '@/lib/format';
import { POS } from '@/constants/testIds';

const COLS = [
  { key: 'idx', label: 'NO.', w: 'w-12', align: 'text-right' },
  { key: 'qty', label: 'QTY', w: 'w-20', align: 'text-right' },
  { key: 'unit', label: 'UNIT', w: 'w-16', align: 'text-center' },
  { key: 'barcode', label: 'PLU / BARCODE', w: 'w-44', align: 'text-left' },
  { key: 'name', label: 'NAMA PRODUK', w: 'flex-1', align: 'text-left' },
  { key: 'unitPrice', label: 'HARGA', w: 'w-28', align: 'text-right' },
  { key: 'discPct', label: 'DISC %', w: 'w-20', align: 'text-right' },
  { key: 'discAmount', label: 'DISC RP', w: 'w-28', align: 'text-right' },
  { key: 'lineTotal', label: 'SUBTOTAL', w: 'w-32', align: 'text-right' },
];

export default function TransactionGrid() {
  const items = usePosStore((s) => s.items);
  const selectedIndex = usePosStore((s) => s.selectedIndex);
  const setSelectedIndex = usePosStore((s) => s.setSelectedIndex);
  const removeItem = usePosStore((s) => s.removeItem);
  const updateItem = usePosStore((s) => s.updateItem);
  const totals = useTotals();
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [items.length]);

  return (
    <div className="flex flex-col flex-1 min-h-0 border-y border-slate-300 bg-white">
      {/* Header row */}
      <div className="flex bg-slate-200 border-b border-slate-400 sticky top-0 z-10">
        {COLS.map((c) => (
          <div
            key={c.key}
            className={`${c.w} ${c.align} px-2 py-1.5 font-pos-sans text-[11px] font-bold uppercase tracking-wider text-slate-700 border-r border-slate-300 last:border-r-0`}
          >
            {c.label}
          </div>
        ))}
      </div>

      {/* Body */}
      <div
        ref={scrollRef}
        data-testid={POS.transactionGrid}
        className="flex-1 overflow-y-auto bg-white"
      >
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 font-pos-mono text-sm">
            — KOSONG — Scan barcode untuk menambah item —
          </div>
        ) : (
          items.map((it, i) => {
            const selected = i === selectedIndex;
            return (
              <div
                key={it.id}
                data-testid={POS.gridRow(i)}
                onClick={() => setSelectedIndex(i)}
                onDoubleClick={() => removeItem(it.id)}
                className={`flex h-8 items-center border-b border-slate-200 font-pos-mono text-[13px] cursor-pointer ${
                  selected
                    ? 'bg-blue-600 text-white'
                    : i % 2 === 0
                      ? 'bg-white text-slate-900 hover:bg-blue-50'
                      : 'bg-slate-50 text-slate-900 hover:bg-blue-50'
                }`}
              >
                <div className={`w-12 text-right px-2 ${selected ? 'text-blue-100' : 'text-slate-500'}`}>{i + 1}</div>
                <div className="w-20 text-right px-2 tabular-nums font-bold">{formatQty(it.qty)}</div>
                <div className="w-16 text-center px-2">{it.unit}</div>
                <div className="w-44 text-left px-2 truncate">{it.barcode}</div>
                <div className="flex-1 text-left px-2 truncate">{it.name}</div>
                <div className="w-28 text-right px-2 tabular-nums">{formatIDR(it.unitPrice)}</div>
                <div className="w-20 text-right px-2 tabular-nums">
                  <input
                    type="number"
                    value={it.discPct || 0}
                    min="0"
                    max="100"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateItem(it.id, { discPct: Number(e.target.value) || 0, discAmount: 0 })}
                    className={`w-full text-right bg-transparent outline-none ${selected ? 'text-white placeholder-blue-200' : 'text-slate-900'}`}
                  />
                </div>
                <div className="w-28 text-right px-2 tabular-nums">
                  <input
                    type="number"
                    value={it.discAmount || 0}
                    min="0"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateItem(it.id, { discAmount: Number(e.target.value) || 0, discPct: 0 })}
                    className={`w-full text-right bg-transparent outline-none ${selected ? 'text-white' : 'text-slate-900'}`}
                  />
                </div>
                <div className="w-32 text-right px-2 tabular-nums font-bold">{formatIDR(it.lineTotal)}</div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer totals */}
      <div className="flex bg-slate-900 text-white border-t-2 border-slate-700">
        <div className="flex-1 flex items-center px-3 py-1.5 border-r border-slate-700">
          <span className="font-pos-sans text-[11px] uppercase tracking-widest text-slate-400 mr-2">
            Total Qty
          </span>
          <span data-testid={POS.totalQty} className="font-pos-mono text-base font-bold tabular-nums text-amber-300">
            {formatQty(totals.totalQty)}
          </span>
        </div>
        <div className="flex-1 flex items-center px-3 py-1.5 border-r border-slate-700">
          <span className="font-pos-sans text-[11px] uppercase tracking-widest text-slate-400 mr-2">
            Subtotal
          </span>
          <span data-testid={POS.subtotal} className="font-pos-mono text-base font-bold tabular-nums">
            {formatIDR(totals.subtotal)}
          </span>
        </div>
        <div className="flex-1 flex items-center px-3 py-1.5 border-r border-slate-700">
          <span className="font-pos-sans text-[11px] uppercase tracking-widest text-slate-400 mr-2">
            Discount
          </span>
          <span data-testid={POS.discountTotal} className="font-pos-mono text-base font-bold tabular-nums text-red-300">
            {formatIDR(totals.discount)}
          </span>
        </div>
        <div className="flex-1 flex items-center px-3 py-1.5 bg-blue-800">
          <span className="font-pos-sans text-[11px] uppercase tracking-widest text-blue-200 mr-2">
            Grand Total
          </span>
          <span className="font-pos-mono text-lg font-bold tabular-nums">
            {formatIDR(totals.grandTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
