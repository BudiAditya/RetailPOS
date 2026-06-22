// ESC-POS command builder for thermal receipt printers.
// Outputs a Uint8Array of raw bytes that can be sent over WebUSB / Web Serial
// or downloaded as a .bin file to feed `lp -d` / printer drivers directly.

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const enc = new TextEncoder();

const bytes = (...parts) => {
  const chunks = parts.map((p) => (typeof p === 'string' ? enc.encode(p) : p instanceof Uint8Array ? p : new Uint8Array(p)));
  const len = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(len);
  let i = 0;
  for (const c of chunks) {
    out.set(c, i);
    i += c.length;
  }
  return out;
};

export const escpos = {
  init: () => new Uint8Array([ESC, 0x40]), // ESC @
  alignLeft: () => new Uint8Array([ESC, 0x61, 0]),
  alignCenter: () => new Uint8Array([ESC, 0x61, 1]),
  alignRight: () => new Uint8Array([ESC, 0x61, 2]),
  bold: (on) => new Uint8Array([ESC, 0x45, on ? 1 : 0]),
  doubleSize: (on) => new Uint8Array([GS, 0x21, on ? 0x11 : 0x00]),
  underline: (on) => new Uint8Array([ESC, 0x2d, on ? 1 : 0]),
  feed: (n = 1) => new Uint8Array([ESC, 0x64, Math.max(0, Math.min(255, n))]),
  cut: () => new Uint8Array([GS, 0x56, 0x00]), // full cut
  partialCut: () => new Uint8Array([GS, 0x56, 0x01]),
  cashDrawer: () => new Uint8Array([ESC, 0x70, 0x00, 0x19, 0xfa]), // open drawer pin 2
  text: (s) => enc.encode(s),
  lf: () => new Uint8Array([LF]),
  bytes,
};

// Receipt builder — fits 32 character columns (80mm @ Font A, common default).
const WIDTH = 32;

const padR = (s, n) => (s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length));
const padL = (s, n) => (s.length >= n ? s.slice(s.length - n) : ' '.repeat(n - s.length) + s);
const line = (ch = '-') => ch.repeat(WIDTH);

const fmtIDR = (n) => Math.round(Number(n) || 0).toLocaleString('id-ID');

const twoCol = (left, right) => {
  const r = String(right);
  const space = WIDTH - r.length;
  return padR(String(left), Math.max(1, space)) + r;
};

export const RECEIPT_WIDTH = WIDTH;

// Plain-text receipt suitable for both ESC-POS and on-screen <pre> preview
export function renderReceiptText(trx, store) {
  const out = [];
  out.push(centerText(store.name));
  out.push(centerText(store.outlet));
  out.push(centerText(store.address));
  if (store.phone) out.push(centerText(`TEL. ${store.phone}`));
  out.push(line('='));
  out.push(`No.   : ${trx.trxNumber}`);
  out.push(`Tgl   : ${new Date(trx.createdAt).toLocaleString('id-ID')}`);
  out.push(`Kasir : ${trx.cashierName || trx.cashierId}`);
  if (trx.customer?.name) out.push(`Plgn  : ${trx.customer.name}`);
  out.push(line('-'));
  for (const it of trx.items || []) {
    out.push(it.name.slice(0, WIDTH));
    const q = `${it.qty} ${it.unit} x ${fmtIDR(it.unitPrice)}`;
    out.push(twoCol(`  ${q}`, fmtIDR(it.lineTotal)));
  }
  out.push(line('-'));
  out.push(twoCol('Subtotal', fmtIDR(trx.subtotal)));
  if ((trx.discount || 0) > 0) out.push(twoCol('Diskon', `-${fmtIDR(trx.discount)}`));
  out.push(twoCol('TOTAL', fmtIDR(trx.grandTotal)));
  out.push(line('-'));
  for (const p of trx.payments || []) {
    out.push(twoCol(`Bayar (${p.method})`, fmtIDR(p.amount)));
  }
  out.push(twoCol('Kembalian', fmtIDR(trx.change || 0)));
  out.push(line('='));
  out.push(centerText('TERIMA KASIH'));
  out.push(centerText('Selamat Belanja Kembali'));
  out.push('');
  out.push(centerText(`* ${trx.trxNumber} *`));
  return out.join('\n');
}

function centerText(s) {
  s = String(s || '').slice(0, WIDTH);
  const pad = Math.max(0, Math.floor((WIDTH - s.length) / 2));
  return ' '.repeat(pad) + s;
}

// Build ESC-POS byte stream for the receipt
export function renderReceiptEscPos(trx, store) {
  const parts = [];
  parts.push(escpos.init());
  parts.push(escpos.alignCenter());
  parts.push(escpos.bold(true));
  parts.push(escpos.doubleSize(true));
  parts.push(escpos.text(store.name), escpos.lf());
  parts.push(escpos.doubleSize(false));
  parts.push(escpos.bold(false));
  parts.push(escpos.text(store.outlet), escpos.lf());
  parts.push(escpos.text(store.address), escpos.lf());
  if (store.phone) parts.push(escpos.text(`TEL. ${store.phone}`), escpos.lf());
  parts.push(escpos.alignLeft());
  parts.push(escpos.text(line('=')), escpos.lf());
  parts.push(escpos.text(`No.   : ${trx.trxNumber}`), escpos.lf());
  parts.push(escpos.text(`Tgl   : ${new Date(trx.createdAt).toLocaleString('id-ID')}`), escpos.lf());
  parts.push(escpos.text(`Kasir : ${trx.cashierName || trx.cashierId}`), escpos.lf());
  if (trx.customer?.name) parts.push(escpos.text(`Plgn  : ${trx.customer.name}`), escpos.lf());
  parts.push(escpos.text(line('-')), escpos.lf());
  for (const it of trx.items || []) {
    parts.push(escpos.text(it.name.slice(0, WIDTH)), escpos.lf());
    const q = `${it.qty} ${it.unit} x ${fmtIDR(it.unitPrice)}`;
    parts.push(escpos.text(twoCol(`  ${q}`, fmtIDR(it.lineTotal))), escpos.lf());
  }
  parts.push(escpos.text(line('-')), escpos.lf());
  parts.push(escpos.text(twoCol('Subtotal', fmtIDR(trx.subtotal))), escpos.lf());
  if ((trx.discount || 0) > 0) parts.push(escpos.text(twoCol('Diskon', `-${fmtIDR(trx.discount)}`)), escpos.lf());
  parts.push(escpos.bold(true));
  parts.push(escpos.text(twoCol('TOTAL', fmtIDR(trx.grandTotal))), escpos.lf());
  parts.push(escpos.bold(false));
  parts.push(escpos.text(line('-')), escpos.lf());
  for (const p of trx.payments || []) {
    parts.push(escpos.text(twoCol(`Bayar (${p.method})`, fmtIDR(p.amount))), escpos.lf());
  }
  parts.push(escpos.text(twoCol('Kembalian', fmtIDR(trx.change || 0))), escpos.lf());
  parts.push(escpos.text(line('=')), escpos.lf());
  parts.push(escpos.alignCenter());
  parts.push(escpos.text('TERIMA KASIH'), escpos.lf());
  parts.push(escpos.text('Selamat Belanja Kembali'), escpos.lf());
  parts.push(escpos.feed(2));
  parts.push(escpos.text(`* ${trx.trxNumber} *`), escpos.lf());
  parts.push(escpos.feed(3));
  parts.push(escpos.cut());
  return bytes(...parts);
}

export const DEFAULT_STORE = {
  name: 'TOKO MAJU JAYA',
  outlet: 'CABANG PUSAT — PST-001',
  address: 'JL. RAYA MERDEKA NO. 88, JAKARTA SELATAN',
  phone: '021-555-0188',
};

// WebUSB ESC-POS print (best-effort, requires user gesture + supported printer)
export async function printViaWebUSB(escposBytes) {
  if (!navigator.usb) throw new Error('WebUSB tidak didukung pada browser ini.');
  const device = await navigator.usb.requestDevice({
    filters: [
      { classCode: 7 }, // Printer
      { vendorId: 0x04b8 }, // Epson
      { vendorId: 0x0519 }, // Star
      { vendorId: 0x0fe6 }, // Generic
      { vendorId: 0x1504 }, // BIXOLON
      { vendorId: 0x0dd4 }, // Custom
    ],
  });
  await device.open();
  if (device.configuration === null) await device.selectConfiguration(1);
  const iface = device.configuration.interfaces.find((i) =>
    i.alternates.some((a) => a.endpoints.some((e) => e.direction === 'out')),
  );
  if (!iface) throw new Error('Tidak menemukan interface OUT pada printer.');
  await device.claimInterface(iface.interfaceNumber);
  const ep = iface.alternates[0].endpoints.find((e) => e.direction === 'out');
  if (!ep) throw new Error('Tidak menemukan endpoint OUT.');
  // Send in chunks of 64 bytes for safety
  const CHUNK = 64;
  for (let i = 0; i < escposBytes.length; i += CHUNK) {
    await device.transferOut(ep.endpointNumber, escposBytes.slice(i, i + CHUNK));
  }
  await device.releaseInterface(iface.interfaceNumber);
  await device.close();
}
