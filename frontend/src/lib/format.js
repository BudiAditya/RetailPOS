// Indonesian Rupiah formatting helpers — POS-style with dot as thousands separator.
export const formatIDR = (n) => {
  const v = Number.isFinite(+n) ? +n : 0;
  return Math.round(v).toLocaleString('id-ID');
};

export const formatIDRWithSymbol = (n) => `Rp ${formatIDR(n)}`;

export const formatQty = (n) => {
  const v = Number.isFinite(+n) ? +n : 0;
  return Number.isInteger(v) ? `${v}` : v.toFixed(2);
};

export const formatDateTime = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatTime = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const nowISO = () => new Date().toISOString();

export const normalizePhone = (s) => (s || '').replace(/[^\d]/g, '').replace(/^0/, '62');

// ----- Loyalty -----
export const POINTS_PER_RUPIAH = 10000; // Rp 10.000 spent => 1 point
export const RUPIAH_PER_POINT = 1000;   // 1 point => Rp 1.000 discount
export const BIRTHDAY_DISCOUNT_PCT = 10; // 10% off on birth-month transactions

export const pointsEarned = (subtotal) => Math.floor((Number(subtotal) || 0) / POINTS_PER_RUPIAH);
export const pointsValueRp = (points) => (Number(points) || 0) * RUPIAH_PER_POINT;

export const tierForSpend = (lifetimeSpend) => {
  const v = Number(lifetimeSpend) || 0;
  if (v >= 5_000_000) return { key: 'GOLD', label: 'GOLD', cls: 'bg-amber-400 text-amber-950 border-amber-600' };
  if (v >= 500_000) return { key: 'SILVER', label: 'SILVER', cls: 'bg-slate-300 text-slate-800 border-slate-500' };
  return { key: 'BRONZE', label: 'BRONZE', cls: 'bg-orange-300 text-orange-950 border-orange-600' };
};

export const isBirthdayMonth = (birthMonth) => {
  const m = Number(birthMonth);
  if (!m || m < 1 || m > 12) return false;
  return m === new Date().getMonth() + 1;
};

export const MONTH_LABELS_ID = [
  'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES',
];

export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
