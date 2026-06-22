import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/pos/Header';
import ScanInput from '@/components/pos/ScanInput';
import TransactionGrid from '@/components/pos/TransactionGrid';
import CustomerPanel from '@/components/pos/CustomerPanel';
import ActionButtons from '@/components/pos/ActionButtons';
import StatusBar from '@/components/pos/StatusBar';
import OpenShiftModal from '@/components/modals/OpenShiftModal';
import CloseShiftModal from '@/components/modals/CloseShiftModal';
import PaymentModal from '@/components/modals/PaymentModal';
import ReturnModal from '@/components/modals/ReturnModal';
import PettyCashModal from '@/components/modals/PettyCashModal';
import ProductSearchModal from '@/components/modals/ProductSearchModal';
import PendingModal from '@/components/modals/PendingModal';
import CustomerLookupModal from '@/components/modals/CustomerLookupModal';
import TransactionListModal from '@/components/modals/TransactionListModal';
import ReceiptModal from '@/components/modals/ReceiptModal';
import { useAuthStore } from '@/stores/authStore';
import { useShiftStore } from '@/stores/shiftStore';
import { usePosStore } from '@/stores/posStore';
import { useSyncStore } from '@/stores/syncStore';
import { Toaster, toast } from 'sonner';
import { db, seedIfEmpty } from '@/db/database';

export default function POSPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const shift = useShiftStore((s) => s.shift);
  const items = usePosStore((s) => s.items);
  const cancelTransaction = usePosStore((s) => s.cancelTransaction);
  const savePending = usePosStore((s) => s.savePending);
  const removeItem = usePosStore((s) => s.removeItem);
  const selectedIndex = usePosStore((s) => s.selectedIndex);
  const setSelectedIndex = usePosStore((s) => s.setSelectedIndex);
  const setMode = usePosStore((s) => s.setMode);
  const mode = usePosStore((s) => s.mode);
  const sync = useSyncStore((s) => s.sync);
  const setOnline = useSyncStore((s) => s.setOnline);
  const refreshPending = useSyncStore((s) => s.refreshPending);

  const [openShift, setOpenShift] = React.useState(false);
  const [closeShift, setCloseShift] = React.useState(false);
  const [payment, setPayment] = React.useState(false);
  const [returnMod, setReturnMod] = React.useState(false);
  const [petty, setPetty] = React.useState(false);
  const [search, setSearch] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [lookup, setLookup] = React.useState(false);
  const [trxList, setTrxList] = React.useState(false);
  const [receipt, setReceipt] = React.useState(null); // { trx } or null
  const scanRef = React.useRef(null);

  React.useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    seedIfEmpty().then(() => refreshPending());
    if (!shift) setOpenShift(true);
  }, [user, shift, navigate, refreshPending]);

  // Online/offline detection
  React.useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, [setOnline]);

  const anyModalOpen =
    openShift || closeShift || payment || returnMod || petty || search || pending || lookup || trxList || !!receipt;

  const doSync = async () => {
    const r = await sync();
    toast.success(`Sinkronisasi selesai. ${r.synced} item terkirim.`);
    refreshPending();
  };

  // Keyboard shortcuts F1-F12
  React.useEffect(() => {
    const onKey = (e) => {
      // Don't capture function keys when typing in inputs? Function keys should always work.
      const ctrlAlt = e.altKey;
      const target = e.target;
      const isText = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      const trigger = (fn) => {
        e.preventDefault();
        e.stopPropagation();
        fn();
      };

      // Block all shortcuts when a modal is open EXCEPT Escape handled by Radix
      if (anyModalOpen && !['Escape'].includes(e.key)) return;

      switch (e.key) {
        case 'F1':
          trigger(() => scanRef.current?.focusQty());
          break;
        case 'F2':
          trigger(() => {
            logout();
            navigate('/login');
          });
          break;
        case 'F3':
          trigger(() => toast.info('Setup belum tersedia di demo.'));
          break;
        case 'F4':
          trigger(() => setSearch(true));
          break;
        case 'F5':
          trigger(() => {
            if (items.length === 0) return toast.error('Tidak ada item untuk dibayar.');
            setPayment(true);
          });
          break;
        case 'F6':
          trigger(() => setTrxList(true));
          break;
        case 'F7':
          trigger(() => setPending(true));
          break;
        case 'F8':
          trigger(() => {
            if (selectedIndex < 0) return toast.error('Pilih item terlebih dahulu.');
            toast.info('Edit qty/diskon langsung di grid (klik kolom).');
          });
          break;
        case 'F9':
          trigger(() => {
            cancelTransaction();
            toast.success('Transaksi dibatalkan.');
          });
          break;
        case 'F10':
          trigger(() => toast.success('Cash drawer terbuka.'));
          break;
        case 'F11':
          trigger(() => setLookup(true));
          break;
        case 'F12':
          trigger(doSync);
          break;
        case 'Delete':
          if (!isText && selectedIndex >= 0 && items[selectedIndex]) {
            trigger(() => removeItem(items[selectedIndex].id));
          }
          break;
        case 'ArrowUp':
          if (!isText && items.length > 0) {
            trigger(() => setSelectedIndex(Math.max(0, selectedIndex - 1)));
          }
          break;
        case 'ArrowDown':
          if (!isText && items.length > 0) {
            trigger(() => setSelectedIndex(Math.min(items.length - 1, selectedIndex + 1)));
          }
          break;
        default:
          break;
      }

      if (ctrlAlt && e.key.toLowerCase() === 'r') trigger(() => setReturnMod(true));
      if (ctrlAlt && e.key.toLowerCase() === 'p') trigger(() => setPetty(true));
      if (ctrlAlt && e.key.toLowerCase() === 'c') trigger(() => setCloseShift(true));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [anyModalOpen, items, selectedIndex, cancelTransaction, logout, navigate, removeItem, setSelectedIndex]);

  const onAction = {
    qty: () => scanRef.current?.focusQty(),
    logout: () => { logout(); navigate('/login'); },
    setup: () => toast.info('Setup belum tersedia di demo.'),
    productSearch: () => setSearch(true),
    payment: () => {
      if (items.length === 0) return toast.error('Tidak ada item untuk dibayar.');
      setPayment(true);
    },
    transactionList: () => setTrxList(true),
    pending: () => setPending(true),
    editItem: () => {
      if (selectedIndex < 0) return toast.error('Pilih item terlebih dahulu.');
      toast.info('Edit qty/diskon langsung di grid.');
    },
    cancel: () => { cancelTransaction(); toast.success('Transaksi dibatalkan.'); },
    cashDrawer: () => toast.success('Cash drawer terbuka.'),
    customer: () => setLookup(true),
    sync: doSync,
    return: () => setReturnMod(true),
    petty: () => setPetty(true),
    closeShift: () => setCloseShift(true),
  };

  if (!user) return null;

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden font-pos-sans">
      <Toaster position="top-center" richColors closeButton />
      <Header />
      <ScanInput ref={scanRef} />
      <div className="flex-1 flex flex-col min-h-0">
        <TransactionGrid />
      </div>
      <CustomerPanel onLookup={() => setLookup(true)} />

      {/* Mode toggle pill (SALE/RETURN) */}
      <div className="px-3 py-1 bg-slate-200 border-t border-slate-300 flex items-center gap-2">
        <span className="font-pos-sans text-[10px] uppercase tracking-widest text-slate-600">MODE:</span>
        <button onClick={() => setMode('SALE')} className={`h-7 px-3 border font-pos-sans text-[11px] font-bold uppercase tracking-widest ${mode === 'SALE' ? 'bg-blue-700 text-white border-blue-900' : 'bg-white text-slate-700 border-slate-400 hover:bg-slate-50'}`}>
          PENJUALAN
        </button>
        <button onClick={() => setMode('RETURN')} className={`h-7 px-3 border font-pos-sans text-[11px] font-bold uppercase tracking-widest ${mode === 'RETURN' ? 'bg-red-700 text-white border-red-900' : 'bg-white text-slate-700 border-slate-400 hover:bg-slate-50'}`}>
          RETUR
        </button>
        <div className="flex-1" />
        <button
          data-testid="pos-save-pending"
          onClick={async () => {
            const r = await savePending();
            if (r.ok) toast.success('Transaksi disimpan sebagai pending.');
            else toast.error(r.error);
          }}
          className="h-7 px-3 bg-amber-500 hover:bg-amber-600 text-slate-900 border border-amber-700 font-pos-sans text-[11px] font-bold uppercase tracking-widest"
        >
          SIMPAN PENDING (CTRL+S)
        </button>
      </div>

      <ActionButtons on={onAction} />
      <StatusBar />

      <OpenShiftModal open={openShift} onOpenChange={setOpenShift} />
      <CloseShiftModal
        open={closeShift}
        onOpenChange={setCloseShift}
        onClosed={() => {
          logout();
          navigate('/login');
        }}
      />
      <PaymentModal open={payment} onOpenChange={setPayment} onPaid={(trx) => setReceipt({ ...trx, cashierName: user?.name })} />
      <ReceiptModal open={!!receipt} onOpenChange={(v) => !v && setReceipt(null)} trx={receipt} />
      <ReturnModal open={returnMod} onOpenChange={setReturnMod} />
      <PettyCashModal open={petty} onOpenChange={setPetty} />
      <ProductSearchModal open={search} onOpenChange={setSearch} />
      <PendingModal open={pending} onOpenChange={setPending} />
      <CustomerLookupModal open={lookup} onOpenChange={setLookup} />
      <TransactionListModal open={trxList} onOpenChange={setTrxList} />
    </div>
  );
}
