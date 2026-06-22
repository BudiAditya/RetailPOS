import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import QRCode from 'qrcode';
import { renderReceiptText, DEFAULT_STORE } from '@/lib/escpos';
import { MessageCircle, Mail, ExternalLink, QrCode, Send } from 'lucide-react';
import { toast } from 'sonner';

export const SEND_TESTIDS = {
  modal: 'send-receipt-modal',
  channelWhatsapp: 'send-channel-whatsapp',
  channelEmail: 'send-channel-email',
  toInput: 'send-to-input',
  waLinkBtn: 'send-wa-link-btn',
  mailtoBtn: 'send-mailto-btn',
  apiBtn: 'send-api-btn',
  apiStatus: 'send-api-status',
  qrCanvas: 'send-qr-canvas',
};

const API = process.env.REACT_APP_BACKEND_URL;

export default function SendReceiptModal({ open, onOpenChange, trx, store = DEFAULT_STORE }) {
  const [channel, setChannel] = React.useState('whatsapp');
  const [to, setTo] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [integrations, setIntegrations] = React.useState(null);
  const canvasRef = React.useRef(null);

  const text = React.useMemo(() => (trx ? renderReceiptText(trx, store) : ''), [trx, store]);
  const subject = React.useMemo(() => (trx ? `Struk ${trx.trxNumber} — ${store.name}` : 'Struk'), [trx, store]);

  // Prefill phone / email from customer if available
  React.useEffect(() => {
    if (!open || !trx) return;
    if (channel === 'whatsapp' && trx.customer?.phone) setTo(trx.customer.phone);
    else if (channel === 'email' && trx.customer?.email) setTo(trx.customer.email);
    else setTo('');
  }, [open, trx, channel]);

  // Probe backend integrations status
  React.useEffect(() => {
    if (!open) return;
    fetch(`${API}/api/receipt/integrations`)
      .then((r) => r.json())
      .then(setIntegrations)
      .catch(() => setIntegrations(null));
  }, [open]);

  // QR — encodes a compact receipt summary. Long bodies make QR unreadable so we cap.
  React.useEffect(() => {
    if (!open || !canvasRef.current || !trx) return;
    const payload = `${store.name}\n${trx.trxNumber}\nTotal: Rp ${Math.round(trx.grandTotal).toLocaleString('id-ID')}\nBayar: Rp ${Math.round(trx.paid || 0).toLocaleString('id-ID')}\nKembalian: Rp ${Math.round(trx.change || 0).toLocaleString('id-ID')}\nTerima kasih.`;
    QRCode.toCanvas(canvasRef.current, payload, { width: 192, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } });
  }, [open, trx, store]);

  if (!trx) return null;

  const normalizedPhone = to.replace(/[^\d+]/g, '').replace(/^0/, '62');

  const waUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`;
  const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;

  const sendViaApi = async () => {
    if (!to.trim()) return toast.error(channel === 'whatsapp' ? 'Masukkan nomor WhatsApp.' : 'Masukkan alamat email.');
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/receipt/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          to: channel === 'whatsapp' ? `+${normalizedPhone}` : to.trim(),
          body: text,
          subject,
          trx_number: trx.trxNumber,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 501) {
        const miss = (data?.detail?.missing || []).join(', ');
        toast.warning(`API belum aktif — set env: ${miss || 'kredensial provider'}. Gunakan tombol link manual.`);
      } else if (!res.ok) {
        toast.error(`Gagal: ${data?.detail || res.statusText}`);
      } else {
        toast.success(`Terkirim via ${data.provider}. ID: ${data.id}`);
        onOpenChange(false);
      }
    } catch (e) {
      toast.error(`Gagal hubungi server: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const apiStatus = integrations?.[channel];
  const apiReady = !!apiStatus?.configured;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid={SEND_TESTIDS.modal}
        className="rounded-none border-2 border-slate-700 bg-slate-50 max-w-2xl p-0 gap-0"
      >
        <DialogHeader className="bg-teal-600 text-white px-4 py-2 border-b-2 border-teal-800">
          <DialogTitle className="font-pos-sans uppercase tracking-widest text-base flex items-center gap-2">
            <Send className="h-4 w-4" /> Kirim Struk Digital — {trx.trxNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-12">
          {/* Left: channel + form */}
          <div className="col-span-7 p-3 bg-white border-r border-slate-300 space-y-3">
            <div className="flex border border-slate-400">
              <button
                data-testid={SEND_TESTIDS.channelWhatsapp}
                onClick={() => setChannel('whatsapp')}
                className={`flex-1 h-10 flex items-center justify-center gap-2 font-pos-sans font-bold uppercase tracking-widest text-xs ${
                  channel === 'whatsapp' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </button>
              <button
                data-testid={SEND_TESTIDS.channelEmail}
                onClick={() => setChannel('email')}
                className={`flex-1 h-10 flex items-center justify-center gap-2 font-pos-sans font-bold uppercase tracking-widest text-xs border-l border-slate-400 ${
                  channel === 'email' ? 'bg-blue-700 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Mail className="h-4 w-4" /> Email
              </button>
            </div>

            <div>
              <label className="font-pos-sans text-[10px] uppercase tracking-widest text-slate-600">
                {channel === 'whatsapp' ? 'Nomor WhatsApp (0812... atau +62812...)' : 'Alamat Email'}
              </label>
              <input
                data-testid={SEND_TESTIDS.toInput}
                autoFocus
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder={channel === 'whatsapp' ? '081234567890' : 'customer@email.com'}
                className="w-full h-10 px-2 bg-white border-2 border-blue-500 font-pos-mono text-base focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              {channel === 'whatsapp' && to && (
                <div className="font-pos-mono text-[11px] text-slate-500 mt-1">
                  → wa.me/<span className="text-slate-800">{normalizedPhone}</span>
                </div>
              )}
            </div>

            {/* API status pill */}
            <div
              data-testid={SEND_TESTIDS.apiStatus}
              className={`border-2 px-2 py-1.5 font-pos-mono text-xs ${
                apiReady
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-amber-50 border-amber-300 text-amber-800'
              }`}
            >
              {apiReady ? (
                <span>
                  ✓ API aktif untuk channel <b>{channel}</b>. Klik tombol "Kirim via API" untuk auto-send.
                </span>
              ) : (
                <span>
                  ⚠ API <b>{channel}</b> belum dikonfigurasi
                  {apiStatus?.missing?.length ? ` (set env: ${apiStatus.missing.join(', ')})` : ''}
                  . Gunakan tombol manual di bawah — selalu jalan.
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              {channel === 'whatsapp' ? (
                <a
                  data-testid={SEND_TESTIDS.waLinkBtn}
                  href={to ? waUrl : undefined}
                  onClick={(e) => {
                    if (!to.trim()) {
                      e.preventDefault();
                      toast.error('Masukkan nomor WhatsApp.');
                    }
                  }}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full h-11 px-3 inline-flex items-center gap-2 border-2 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-800 font-pos-sans font-bold uppercase tracking-widest text-xs"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="flex-1 text-left">
                    Buka di WhatsApp (wa.me)
                    <div className="font-pos-mono normal-case tracking-normal text-[10px] font-normal opacity-80">
                      Buka tab baru, customer tinggal tekan Send
                    </div>
                  </span>
                </a>
              ) : (
                <a
                  data-testid={SEND_TESTIDS.mailtoBtn}
                  href={to ? mailtoUrl : undefined}
                  onClick={(e) => {
                    if (!to.trim()) {
                      e.preventDefault();
                      toast.error('Masukkan alamat email.');
                    }
                  }}
                  className="w-full h-11 px-3 inline-flex items-center gap-2 border-2 bg-blue-700 hover:bg-blue-800 text-white border-blue-900 font-pos-sans font-bold uppercase tracking-widest text-xs"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="flex-1 text-left">
                    Buka di Mail Client (mailto:)
                    <div className="font-pos-mono normal-case tracking-normal text-[10px] font-normal opacity-80">
                      Membuka aplikasi email default
                    </div>
                  </span>
                </a>
              )}

              <button
                type="button"
                data-testid={SEND_TESTIDS.apiBtn}
                onClick={sendViaApi}
                disabled={busy}
                className={`w-full h-11 px-3 inline-flex items-center gap-2 border-2 font-pos-sans font-bold uppercase tracking-widest text-xs ${
                  apiReady
                    ? 'bg-teal-600 hover:bg-teal-700 text-white border-teal-800'
                    : 'bg-slate-300 text-slate-600 border-slate-500 cursor-help'
                } disabled:opacity-60`}
                title={apiReady ? 'Kirim otomatis lewat backend' : 'Aktifkan kapan saja — tambahkan env keys, restart backend'}
              >
                <Send className="h-4 w-4" />
                <span className="flex-1 text-left">
                  {busy ? 'Mengirim...' : 'Kirim via API (Auto)'}
                  <div className="font-pos-mono normal-case tracking-normal text-[10px] font-normal opacity-80">
                    {apiReady ? 'Otomatis kirim tanpa interaksi customer' : '501 sampai env keys diset — code sudah siap'}
                  </div>
                </span>
              </button>
            </div>
          </div>

          {/* Right: QR */}
          <div className="col-span-5 p-3 bg-slate-100 flex flex-col items-center justify-start gap-2">
            <div className="font-pos-sans text-[10px] uppercase tracking-widest text-slate-600 flex items-center gap-1">
              <QrCode className="h-3 w-3" /> QR Ringkas Struk
            </div>
            <div className="bg-white border-2 border-slate-700 p-2 shadow-[4px_4px_0_0_rgba(15,23,42,0.4)]">
              <canvas
                data-testid={SEND_TESTIDS.qrCanvas}
                ref={canvasRef}
                width={192}
                height={192}
              />
            </div>
            <div className="font-pos-mono text-[10px] text-slate-500 text-center leading-tight">
              Customer scan untuk lihat ringkasan transaksi
            </div>
            <div className="mt-2 w-full bg-white border border-slate-300 p-2 font-pos-mono text-[10px] text-slate-700 max-h-28 overflow-y-auto">
              <div className="font-bold text-slate-800 mb-1">Preview pesan:</div>
              <div className="whitespace-pre-wrap break-words">{text.slice(0, 280)}...</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
