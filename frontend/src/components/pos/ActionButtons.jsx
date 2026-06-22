import React from 'react';
import { FKEY } from '@/constants/testIds';

const GROUPS = {
  nav: 'bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-900 border-slate-400 shadow-[0_2px_0_0_#94a3b8]',
  action: 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white border-teal-800 shadow-[0_2px_0_0_#115e59]',
  admin: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-900 border-amber-700 shadow-[0_2px_0_0_#b45309]',
  danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border-red-800 shadow-[0_2px_0_0_#991b1b]',
  primary: 'bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white border-blue-900 shadow-[0_2px_0_0_#1e3a8a]',
};

function KeyButton({ fkey, label, group, testid, onClick }) {
  return (
    <button
      type="button"
      data-testid={testid}
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center h-14 px-2 border ${GROUPS[group]} font-pos-sans select-none active:translate-y-[2px] active:shadow-none transition-[transform,box-shadow] duration-75`}
    >
      <span className="absolute top-1 left-1 font-pos-mono text-[10px] font-bold opacity-70">
        {fkey}
      </span>
      <span className="text-[12px] font-bold tracking-wide text-center mt-1.5 leading-tight">
        {label}
      </span>
    </button>
  );
}

export default function ActionButtons({ on }) {
  return (
    <div className="bg-slate-100 border-t border-slate-300 px-3 py-2">
      <div className="grid grid-cols-12 gap-1.5">
        <KeyButton fkey="F1" label="QTY" group="nav" testid={FKEY.qty} onClick={on.qty} />
        <KeyButton fkey="F2" label="LOGOUT" group="danger" testid={FKEY.logout} onClick={on.logout} />
        <KeyButton fkey="F3" label="SETUP" group="nav" testid={FKEY.setup} onClick={on.setup} />
        <KeyButton fkey="F4" label="CARI PRODUK" group="action" testid={FKEY.productSearch} onClick={on.productSearch} />
        <KeyButton fkey="F5" label="BAYAR" group="primary" testid={FKEY.payment} onClick={on.payment} />
        <KeyButton fkey="F6" label="DAFTAR TRX" group="nav" testid={FKEY.transactionList} onClick={on.transactionList} />
        <KeyButton fkey="F7" label="PENDING" group="admin" testid={FKEY.pending} onClick={on.pending} />
        <KeyButton fkey="F8" label="EDIT ITEM" group="action" testid={FKEY.editItem} onClick={on.editItem} />
        <KeyButton fkey="F9" label="BATAL TRX" group="danger" testid={FKEY.cancel} onClick={on.cancel} />
        <KeyButton fkey="F10" label="OPEN DRAWER" group="admin" testid={FKEY.cashDrawer} onClick={on.cashDrawer} />
        <KeyButton fkey="F11" label="CUSTOMER" group="action" testid={FKEY.customer} onClick={on.customer} />
        <KeyButton fkey="F12" label="SYNC" group="nav" testid={FKEY.sync} onClick={on.sync} />
      </div>
      <div className="grid grid-cols-12 gap-1.5 mt-1.5">
        <KeyButton fkey="ALT+R" label="RETUR" group="danger" testid={FKEY.return} onClick={on.return} />
        <KeyButton fkey="ALT+P" label="KAS KECIL" group="admin" testid={FKEY.petty} onClick={on.petty} />
        <KeyButton fkey="ALT+C" label="TUTUP SHIFT" group="danger" testid={FKEY.closeShift} onClick={on.closeShift} />
      </div>
    </div>
  );
}
