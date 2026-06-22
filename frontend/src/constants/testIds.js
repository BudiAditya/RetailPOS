export const HOME = {
  emergentLink: 'home-emergent-link',
};

export const POS = {
  scanInput: 'pos-scan-input',
  qtyInput: 'pos-qty-input',
  productDescription: 'pos-product-description',
  transactionGrid: 'pos-transaction-grid',
  gridRow: (i) => `pos-grid-row-${i}`,
  bigTotal: 'pos-big-total',
  subtotal: 'pos-subtotal',
  discountTotal: 'pos-discount-total',
  totalQty: 'pos-total-qty',
  customerField: 'pos-customer-field',
  memberField: 'pos-member-field',
  phoneField: 'pos-phone-field',
  addressField: 'pos-address-field',
  deliverySelect: 'pos-delivery-select',
  statusBar: 'pos-status-bar',
  syncIndicator: 'pos-sync-indicator',
};

export const FKEY = {
  qty: 'fkey-f1-qty',
  logout: 'fkey-f2-logout',
  setup: 'fkey-f3-setup',
  productSearch: 'fkey-f4-product-search',
  payment: 'fkey-f5-payment',
  transactionList: 'fkey-f6-transaction-list',
  pending: 'fkey-f7-pending',
  editItem: 'fkey-f8-edit',
  cancel: 'fkey-f9-cancel',
  cashDrawer: 'fkey-f10-cash-drawer',
  customer: 'fkey-f11-customer',
  sync: 'fkey-f12-sync',
  petty: 'fkey-petty-cash',
  return: 'fkey-return',
  closeShift: 'fkey-close-shift',
};

export const LOGIN = {
  usernameInput: 'login-username-input',
  pinInput: 'login-pin-input',
  submitBtn: 'login-submit-btn',
  error: 'login-error',
};

export const SHIFT = {
  openingCashInput: 'shift-opening-cash-input',
  shiftNoteInput: 'shift-note-input',
  openShiftBtn: 'shift-open-btn',
  closeShiftBtn: 'shift-close-btn',
  expectedCash: 'shift-expected-cash',
  actualCashInput: 'shift-actual-cash-input',
  differenceDisplay: 'shift-difference',
};

export const PAY = {
  modal: 'payment-modal',
  cashInput: 'payment-cash-input',
  methodTab: (m) => `payment-method-${m}`,
  paidAmount: 'payment-paid-amount',
  changeAmount: 'payment-change-amount',
  confirmBtn: 'payment-confirm-btn',
  cancelBtn: 'payment-cancel-btn',
};
