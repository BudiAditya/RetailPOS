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

export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
