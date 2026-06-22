import React from 'react';
import { usePosStore } from '@/stores/posStore';
import { POS } from '@/constants/testIds';
import { toast } from 'sonner';

const ScanInput = React.forwardRef(function ScanInput(_, ref) {
  const qty = usePosStore((s) => s.qty);
  const setQty = usePosStore((s) => s.setQty);
  const addByBarcode = usePosStore((s) => s.addByBarcode);
  const items = usePosStore((s) => s.items);
  const selectedIndex = usePosStore((s) => s.selectedIndex);
  const mode = usePosStore((s) => s.mode);
  const inputRef = React.useRef(null);
  const qtyRef = React.useRef(null);

  React.useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    focusQty: () => {
      qtyRef.current?.focus();
      qtyRef.current?.select();
    },
  }));

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const [code, setCode] = React.useState('');

  const onScan = async () => {
    if (!code.trim()) return;
    const res = await addByBarcode(code.trim());
    if (!res.ok) {
      toast.error(res.error);
    }
    setCode('');
    inputRef.current?.focus();
  };

  const current = selectedIndex >= 0 ? items[selectedIndex] : null;

  return (
    <div className={`flex items-stretch gap-2 px-3 py-2 border-b-2 ${mode === 'RETURN' ? 'bg-red-900' : 'bg-slate-800'} border-slate-700`}>
      <div className="flex items-stretch gap-2 flex-1">
        <div className="flex flex-col">
          <label className="font-pos-sans text-[10px] uppercase tracking-widest text-slate-300 mb-0.5">
            F1 · QTY
          </label>
          <input
            ref={qtyRef}
            data-testid={POS.qtyInput}
            type="number"
            min="1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            onFocus={(e) => e.target.select()}
            className="w-24 h-11 px-2 bg-white border-2 border-amber-400 font-pos-mono text-xl font-bold text-slate-900 text-right tabular-nums rounded-none focus:outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        <div className="flex flex-col flex-1">
          <label className="font-pos-sans text-[10px] uppercase tracking-widest text-slate-300 mb-0.5">
            SCAN BARCODE / PLU
          </label>
          <input
            ref={inputRef}
            data-testid={POS.scanInput}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onScan();
              }
            }}
            placeholder="Scan atau ketik kode produk lalu tekan ENTER..."
            autoComplete="off"
            spellCheck={false}
            className="h-11 px-3 bg-white border-2 border-blue-500 font-pos-mono text-lg text-slate-900 rounded-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40 shadow-inner"
          />
        </div>

        <div className="flex flex-col w-[40%]">
          <label className="font-pos-sans text-[10px] uppercase tracking-widest text-slate-300 mb-0.5">
            DESKRIPSI PRODUK
          </label>
          <div
            data-testid={POS.productDescription}
            className="h-11 px-3 bg-slate-900 border-2 border-slate-600 font-pos-mono text-[15px] text-amber-300 flex items-center truncate"
          >
            {current ? current.name : <span className="text-slate-500">— belum ada item dipilih —</span>}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ScanInput;
