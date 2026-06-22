import React from 'react';
import { usePosStore } from '@/stores/posStore';
import { POS } from '@/constants/testIds';
import { User, Phone, MapPin, Truck } from 'lucide-react';

const DELIVERIES = ['TAKE AWAY', 'DELIVERY', 'PICK UP'];

export default function CustomerPanel({ onLookup }) {
  const customer = usePosStore((s) => s.customer);
  const deliveryMethod = usePosStore((s) => s.deliveryMethod);
  const setDelivery = usePosStore((s) => s.setDelivery);
  const setCustomer = usePosStore((s) => s.setCustomer);

  return (
    <div className="bg-slate-100 border-t border-slate-300 px-3 py-2">
      <div className="grid grid-cols-12 gap-2 items-end">
        <Field label="MEMBER" colSpan={2} icon={<User className="h-3 w-3" />}>
          <input
            data-testid={POS.memberField}
            value={customer?.memberNumber || ''}
            placeholder="M-XXXX / ENTER"
            onChange={(e) => setCustomer({ ...(customer || {}), memberNumber: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onLookup?.(customer?.memberNumber || '');
              }
            }}
            className="w-full h-8 px-2 bg-white border border-slate-400 font-pos-mono text-sm rounded-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </Field>
        <Field label="CUSTOMER" colSpan={3} icon={<User className="h-3 w-3" />}>
          <input
            data-testid={POS.customerField}
            value={customer?.name || ''}
            placeholder="UMUM"
            onChange={(e) => setCustomer({ ...(customer || {}), name: e.target.value })}
            className="w-full h-8 px-2 bg-white border border-slate-400 font-pos-mono text-sm rounded-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </Field>
        <Field label="TELEPON" colSpan={2} icon={<Phone className="h-3 w-3" />}>
          <input
            data-testid={POS.phoneField}
            value={customer?.phone || ''}
            placeholder="08xx-xxxx"
            onChange={(e) => setCustomer({ ...(customer || {}), phone: e.target.value })}
            className="w-full h-8 px-2 bg-white border border-slate-400 font-pos-mono text-sm rounded-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </Field>
        <Field label="ALAMAT" colSpan={3} icon={<MapPin className="h-3 w-3" />}>
          <input
            data-testid={POS.addressField}
            value={customer?.address || ''}
            placeholder="Alamat pengiriman"
            onChange={(e) => setCustomer({ ...(customer || {}), address: e.target.value })}
            className="w-full h-8 px-2 bg-white border border-slate-400 font-pos-mono text-sm rounded-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </Field>
        <Field label="DELIVERY" colSpan={2} icon={<Truck className="h-3 w-3" />}>
          <div className="flex border border-slate-400 bg-white h-8">
            {DELIVERIES.map((d) => (
              <button
                key={d}
                type="button"
                data-testid={`${POS.deliverySelect}-${d.replace(' ', '-').toLowerCase()}`}
                onClick={() => setDelivery(d)}
                className={`flex-1 px-1 font-pos-sans text-[10px] font-bold uppercase tracking-wider border-r border-slate-300 last:border-r-0 ${
                  deliveryMethod === d ? 'bg-blue-700 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </Field>
      </div>
    </div>
  );
}

function Field({ label, icon, colSpan, children }) {
  const cls = { 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4' }[colSpan] || 'col-span-3';
  return (
    <div className={cls}>
      <div className="flex items-center gap-1 mb-0.5">
        {icon}
        <label className="font-pos-sans text-[10px] uppercase tracking-widest text-slate-600">{label}</label>
      </div>
      {children}
    </div>
  );
}
