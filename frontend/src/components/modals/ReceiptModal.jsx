import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DEFAULT_STORE, renderReceiptText, renderReceiptEscPos, printViaWebUSB } from '@/lib/escpos';
import { formatIDR } from '@/lib/format';
import { Printer, Download, Usb, Copy, X, Send } from 'lucide-react';
import { toast } from 'sonner';
import SendReceiptModal from './SendReceiptModal';

export const RECEIPT_TESTIDS = {
  modal: 'receipt-modal',
  preview: 'receipt-preview',
  printBtn: 'receipt-print-btn',
  downloadBtn: 'receipt-download-btn',
  usbBtn: 'receipt-usb-btn',
  copyBtn: 'receipt-copy-btn',
  closeBtn: 'receipt-close-btn',
  sendBtn: 'receipt-send-btn',
};

export default function ReceiptModal({ open, onOpenChange, trx, store = DEFAULT_STORE }) {
  const text = React.useMemo(() => (trx ? renderReceiptText(trx, store) : ''), [trx, store]);
  const lines = React.useMemo(() => text.split('\n'), [text]);
  const [sendOpen, setSendOpen] = React.useState(false);

  const handlePrint = () => {
    // Use the @media print stylesheet — only #receipt-print is shown
    window.print();
  };

  const handleDownload = () => {
    if (!trx) return;
    const data = renderReceiptEscPos(trx, store);
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trx.trxNumber}.escpos.bin`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`File ESC-POS ${trx.trxNumber}.escpos.bin diunduh.`);
  };

  const handleUSB = async () => {
    if (!trx) return;
    try {
      const data = renderReceiptEscPos(trx, store);
      await printViaWebUSB(data);
      toast.success('Struk berhasil dikirim ke printer USB.');
    } catch (e) {
      toast.error(e.message || 'Gagal mencetak via USB.');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Teks struk disalin ke clipboard.');
    } catch {
      toast.error('Clipboard tidak tersedia.');
    }
  };

  if (!trx) return null;

  return (
    <>
      {/* Hidden print-only render — entire viewport replaced by this when window.print() runs */}
      <div id="receipt-print" aria-hidden className="receipt-print-only">
        <pre className="receipt-paper-print">{text}</pre>
      </div>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          data-testid={RECEIPT_TESTIDS.modal}
          className="rounded-none border-2 border-slate-700 bg-slate-50 max-w-3xl p-0 gap-0 no-print"
        >
          <DialogHeader className="bg-slate-900 text-white px-4 py-2 border-b-2 border-slate-700">
            <DialogTitle className="font-pos-sans uppercase tracking-widest text-base flex items-center gap-2">
              <Printer className="h-4 w-4" /> Cetak Struk — {trx.trxNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-12 gap-0">
            {/* Receipt preview — 80mm thermal */}
            <div className="col-span-7 bg-slate-300 p-4 flex items-start justify-center border-r border-slate-400">
              <div
                data-testid={RECEIPT_TESTIDS.preview}
                className="bg-white shadow-[6px_6px_0_0_rgba(15,23,42,0.35)] border border-slate-400 receipt-paper"
              >
                <pre className="font-pos-mono text-[12px] leading-[1.35] text-slate-900 whitespace-pre p-3">
                  {lines.map((ln, i) => (
                    <div key={i}>{ln || '\u00A0'}</div>
                  ))}
                </pre>
                {/* Perforated edge */}
                <div className="h-3 bg-[radial-gradient(circle_at_4px_50%,transparent_3px,#fff_3px)] [background-size:8px_8px] border-t border-dashed border-slate-300" />
              </div>
            </div>

            {/* Actions */}
            <div className="col-span-5 p-4 space-y-3 bg-white">
              <div className="grid grid-cols-2 gap-2">
                <Stat label="GRAND TOTAL" value={formatIDR(trx.grandTotal)} tone="primary" />
                <Stat label="KEMBALIAN" value={formatIDR(trx.change || 0)} tone={trx.change > 0 ? 'amber' : 'mute'} />
              </div>
              <div>
                <div className="font-pos-sans text-[10px] uppercase tracking-widest text-slate-500 mb-1">Pembayaran</div>
                <div className="border border-slate-300 divide-y divide-slate-200">
                  {(trx.payments || []).map((p, i) => (
                    <div key={i} className="flex justify-between px-2 py-1 font-pos-mono text-sm">
                      <span>{p.method}</span>
                      <span className="tabular-nums">{formatIDR(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <ActionBtn
                  testid={RECEIPT_TESTIDS.printBtn}
                  onClick={handlePrint}
                  tone="primary"
                  icon={<Printer className="h-4 w-4" />}
                  label="Cetak (Browser / Driver)"
                  hint="Membuka dialog cetak — gunakan printer thermal 80mm"
                />
                <ActionBtn
                  testid={RECEIPT_TESTIDS.sendBtn}
                  onClick={() => setSendOpen(true)}
                  tone="emerald"
                  icon={<Send className="h-4 w-4" />}
                  label="Kirim Digital (WhatsApp / Email)"
                  hint="wa.me + mailto + QR + Auto-API (Twilio / Resend)"
                />
                <ActionBtn
                  testid={RECEIPT_TESTIDS.usbBtn}
                  onClick={handleUSB}
                  tone="teal"
                  icon={<Usb className="h-4 w-4" />}
                  label="Print via USB (ESC-POS)"
                  hint="Pilih printer thermal langsung (WebUSB)"
                />
                <ActionBtn
                  testid={RECEIPT_TESTIDS.downloadBtn}
                  onClick={handleDownload}
                  tone="amber"
                  icon={<Download className="h-4 w-4" />}
                  label="Unduh .escpos.bin"
                  hint="Untuk dikirim ke printer via lp / driver"
                />
                <ActionBtn
                  testid={RECEIPT_TESTIDS.copyBtn}
                  onClick={handleCopy}
                  tone="slate"
                  icon={<Copy className="h-4 w-4" />}
                  label="Salin Teks"
                />
                <ActionBtn
                  testid={RECEIPT_TESTIDS.closeBtn}
                  onClick={() => onOpenChange(false)}
                  tone="danger"
                  icon={<X className="h-4 w-4" />}
                  label="Tutup (ESC)"
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <SendReceiptModal open={sendOpen} onOpenChange={setSendOpen} trx={trx} store={store} />
    </>
  );
}

function Stat({ label, value, tone }) {
  const tones = {
    primary: 'bg-blue-700 text-white border-blue-900',
    amber: 'bg-amber-50 text-amber-800 border-amber-300',
    mute: 'bg-slate-50 text-slate-700 border-slate-300',
  };
  return (
    <div className={`border-2 px-2 py-1.5 ${tones[tone] || tones.mute}`}>
      <div className="font-pos-sans text-[10px] uppercase tracking-widest opacity-80">{label}</div>
      <div className="font-pos-mono text-lg font-bold tabular-nums">{value}</div>
    </div>
  );
}

function ActionBtn({ onClick, tone, icon, label, hint, testid }) {
  const tones = {
    primary: 'bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white border-blue-900',
    teal: 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white border-teal-800',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white border-emerald-800',
    amber: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-900 border-amber-700',
    slate: 'bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-900 border-slate-400',
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border-red-800',
  };
  return (
    <button
      type="button"
      data-testid={testid}
      onClick={onClick}
      className={`w-full h-11 px-3 border-2 font-pos-sans font-bold uppercase tracking-widest text-xs flex items-center gap-2 ${tones[tone]}`}
    >
      {icon}
      <span className="flex-1 text-left">
        {label}
        {hint && <div className="font-pos-mono normal-case tracking-normal text-[10px] font-normal opacity-70 truncate">{hint}</div>}
      </span>
    </button>
  );
}
