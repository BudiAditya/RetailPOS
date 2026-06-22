import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePosStore } from '@/stores/posStore';
import { useShiftStore } from '@/stores/shiftStore';
import { useAuthStore } from '@/stores/authStore';
import { PAY } from '@/constants/testIds';
import { formatIDR } from '@/lib/format';
import { toast } from 'sonner';

const METHODS = [
  { key: 'CASH', label: 'TUNAI' },
  { key: 'DEBIT', label: 'DEBIT' },
  { key: 'CREDIT', label: 'KREDIT' },
  { key: 'QRIS', label: 'QRIS' },
  { key: 'EWALLET', label: 'E-WALLET' },
  { key: 'SPLIT', label: 'SPLIT' },
];

const QUICK = [50000, 100000, 200000, 500000];

export default function PaymentModal({ open, onOpenChange, onPaid }) {
  const finalize = usePosStore((s) => s.finalize);
  const items = usePosStore((s) => s.items);
  const totals = React.useMemo(() => {
    const totalQty = items.reduce((s, it) => s + (Number(it.qty) || 0), 0);
    const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0);
    const lineTotal = items.reduce((s, it) => s + (Number(it.lineTotal) || 0), 0);
    return { totalQty, subtotal, discount: subtotal - lineTotal, grandTotal: lineTotal };
  }, [items]);
  const shift = useShiftStore((s) => s.shift);
  const user = useAuthStore((s) => s.user);

  const [method, setMethod] = React.useState('CASH');
  const [cash, setCash] = React.useState('');
  const [splitList, setSplitList] = React.useState([{ method: 'CASH', amount: '' }]);
  const cashRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setMethod('CASH');
      setCash('');
      setSplitList([{ method: 'CASH', amount: '' }]);
      setTimeout(() => cashRef.current?.focus(), 50);
    }
  }, [open]);

  const paid =
    method === 'SPLIT'
      ? splitList.reduce((s, p) => s + (Number(p.amount) || 0), 0)
      : method === 'CASH'
        ? Number(cash) || 0
        : totals.grandTotal;
  const change = Math.max(0, paid - totals.grandTotal);
  const canPay = paid >= totals.grandTotal && items.length > 0 && shift;

  const confirm = async () => {
    if (!canPay) {
      toast.error('Jumlah bayar kurang dari total.');
      return;
    }
    const payments =
      method === 'SPLIT'
        ? splitList.filter((p) => Number(p.amount) > 0)
        : [{ method, amount: paid }];
    const trx = await finalize({ payments, shiftId: shift.id, cashierId: user.id });
    toast.success(`Transaksi ${trx.trxNumber} berhasil.`);
    onPaid?.(trx);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-2 border-slate-700 bg-slate-50 max-w-3xl p-0 gap-0">
        <DialogHeader className="bg-blue-700 text-white px-4 py-2 border-b-4 border-blue-900">
          <DialogTitle data-testid={PAY.modal} className="font-pos-sans uppercase tracking-widest text-base">
            Pembayaran
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-12 gap-0">
          {/* Left: methods */}
          <div className="col-span-4 bg-slate-100 border-r border-slate-300 p-2 space-y-1">
            {METHODS.map((m) => (
              <button
                key={m.key}
                data-testid={PAY.methodTab(m.key.toLowerCase())}
                onClick={() => setMethod(m.key)}
                className={`w-full h-12 px-3 border font-pos-sans font-bold uppercase tracking-widest text-sm text-left ${
                  method === m.key
                    ? 'bg-blue-700 text-white border-blue-900'
                    : 'bg-white text-slate-800 border-slate-400 hover:bg-slate-50'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Right: amounts */}
          <div className="col-span-8 p-4 space-y-3 bg-white">
            <BigRow label="Grand Total" value={formatIDR(totals.grandTotal)} tone="primary" />

            {method === 'CASH' && (
              <>
                <div>
                  <label className="font-pos-sans text-xs uppercase tracking-widest text-slate-600">
                    Diterima (Cash)
                  </label>
                  <input
                    ref={cashRef}
                    data-testid={PAY.cashInput}
                    type="number"
                    value={cash}
                    onChange={(e) => setCash(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirm();
                    }}
                    placeholder="0"
                    className="w-full h-14 px-3 bg-white border-2 border-blue-500 font-pos-mono text-3xl text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setCash(String(q))}
                      className="h-10 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 border border-slate-400 font-pos-mono text-sm font-bold"
                    >
                      {formatIDR(q)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCash(String(totals.grandTotal))}
                    className="col-span-4 h-10 bg-teal-600 hover:bg-teal-700 text-white border border-teal-800 font-pos-sans font-bold uppercase tracking-widest"
                  >
                    Bayar Pas — {formatIDR(totals.grandTotal)}
                  </button>
                </div>
              </>
            )}

            {method !== 'CASH' && method !== 'SPLIT' && (
              <div className="bg-slate-100 border border-slate-300 p-4 font-pos-mono text-sm text-slate-700">
                Lakukan transaksi {METHODS.find((x) => x.key === method)?.label} di mesin EDC / aplikasi. Setelah berhasil tekan KONFIRMASI.
              </div>
            )}

            {method === 'SPLIT' && (
              <div className="space-y-1">
                {splitList.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <select
                      value={p.method}
                      onChange={(e) => {
                        const next = [...splitList];
                        next[i] = { ...next[i], method: e.target.value };
                        setSplitList(next);
                      }}
                      className="h-10 px-2 bg-white border border-slate-400 font-pos-sans text-sm font-bold uppercase rounded-none"
                    >
                      {METHODS.filter((m) => m.key !== 'SPLIT').map((m) => (
                        <option key={m.key} value={m.key}>{m.label}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={p.amount}
                      onChange={(e) => {
                        const next = [...splitList];
                        next[i] = { ...next[i], amount: e.target.value };
                        setSplitList(next);
                      }}
                      placeholder="0"
                      className="flex-1 h-10 px-2 bg-white border border-slate-400 font-pos-mono text-right tabular-nums focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSplitList([...splitList, { method: 'DEBIT', amount: '' }])}
                  className="h-9 px-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-pos-sans font-bold uppercase text-xs border border-amber-700"
                >
                  + Tambah Pembayaran
                </button>
              </div>
            )}

            <BigRow label="Paid" value={formatIDR(paid)} tone="ok" testid={PAY.paidAmount} />
            <BigRow label="Kembalian" value={formatIDR(change)} tone={change > 0 ? 'amber' : 'mute'} testid={PAY.changeAmount} />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                data-testid={PAY.cancelBtn}
                onClick={() => onOpenChange(false)}
                className="flex-1 h-12 bg-slate-200 hover:bg-slate-300 text-slate-900 font-pos-sans font-bold uppercase tracking-widest border border-slate-400"
              >
                Batal (ESC)
              </button>
              <button
                type="button"
                data-testid={PAY.confirmBtn}
                onClick={confirm}
                disabled={!canPay}
                className="flex-[2] h-12 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-pos-sans font-bold uppercase tracking-widest border-2 border-teal-800"
              >
                Konfirmasi Bayar (ENTER)
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BigRow({ label, value, tone, testid }) {
  const tones = {
    primary: 'bg-blue-700 text-white border-blue-900',
    ok: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    amber: 'bg-amber-50 text-amber-800 border-amber-300',
    mute: 'bg-slate-50 text-slate-700 border-slate-300',
  };
  return (
    <div className={`flex items-center justify-between border-2 px-3 py-2 ${tones[tone] || tones.mute}`}>
      <span className="font-pos-sans text-xs uppercase tracking-widest opacity-80">{label}</span>
      <span data-testid={testid} className="font-pos-mono text-2xl font-bold tabular-nums">
        {value}
      </span>
    </div>
  );
}
