import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LOGIN } from '@/constants/testIds';
import { seedIfEmpty } from '@/db/database';
import { Lock, ShoppingCart } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = React.useState('cashier');
  const [pin, setPin] = React.useState('');
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    seedIfEmpty();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    const res = await login(username.trim(), pin.trim());
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    navigate('/pos');
  };

  return (
    <div className="h-screen w-screen flex items-stretch bg-slate-900 font-pos-sans select-none overflow-hidden">
      {/* Left brand panel */}
      <div className="hidden md:flex md:w-2/5 lg:w-1/2 flex-col justify-between bg-slate-950 text-white p-10 border-r-4 border-blue-700 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-700 flex items-center justify-center border-2 border-blue-900">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div className="font-pos-mono text-sm tracking-widest text-slate-400">RETAIL POS · v1.0</div>
        </div>
        <div className="space-y-3">
          <div className="text-6xl font-black tracking-tight leading-none">
            TOKO MAJU<br />JAYA<span className="text-blue-500">.</span>
          </div>
          <div className="font-pos-mono text-sm text-slate-400 max-w-md">
            Sistem Kasir Retail Grocery — Workstation Kasir profesional. Optimal untuk barcode scanner, keyboard-first, dan offline-first operation.
          </div>
        </div>
        <div className="font-pos-mono text-[11px] text-slate-500 tracking-widest">
          OUTLET PST-001 · POS-01 · {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-700 opacity-10 blur-3xl" />
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-100">
        <form
          onSubmit={submit}
          className="w-full max-w-sm bg-white border-2 border-slate-700 shadow-[6px_6px_0_0_rgba(15,23,42,0.5)]"
        >
          <div className="bg-slate-900 text-white px-4 py-2 border-b-2 border-slate-700 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span className="font-pos-sans uppercase tracking-widest text-sm font-bold">Login Kasir</span>
          </div>
          <div className="p-5 space-y-3">
            <div>
              <label className="font-pos-sans text-xs uppercase tracking-widest text-slate-600">Username</label>
              <input
                data-testid={LOGIN.usernameInput}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                autoComplete="off"
                className="w-full h-11 px-3 bg-white border-2 border-slate-400 font-pos-mono text-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div>
              <label className="font-pos-sans text-xs uppercase tracking-widest text-slate-600">PIN</label>
              <input
                data-testid={LOGIN.pinInput}
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="• • • •"
                className="w-full h-11 px-3 bg-white border-2 border-slate-400 font-pos-mono text-lg tracking-[0.4em] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            {err ? (
              <div data-testid={LOGIN.error} className="bg-red-50 border border-red-300 text-red-700 px-2 py-1.5 font-pos-mono text-xs">
                {err}
              </div>
            ) : null}
            <button
              type="submit"
              data-testid={LOGIN.submitBtn}
              disabled={busy}
              className="w-full h-12 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 disabled:bg-slate-400 text-white border-2 border-blue-900 font-pos-sans font-bold uppercase tracking-widest"
            >
              {busy ? 'Masuk...' : 'MASUK (ENTER)'}
            </button>
            <div className="bg-slate-50 border border-slate-300 p-2 font-pos-mono text-[11px] text-slate-600 leading-relaxed">
              <div className="font-bold text-slate-700">AKUN DEMO:</div>
              <div>cashier / PIN 1234 — kasir</div>
              <div>manager / PIN 9999 — manager</div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
