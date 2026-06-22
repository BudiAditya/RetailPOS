import React from 'react';
import { usePosStore } from '@/stores/posStore';
import { useTotals } from '@/hooks/useTotals';
import {
  formatIDR,
  tierForSpend,
  isBirthdayMonth,
  pointsEarned,
  pointsValueRp,
  BIRTHDAY_DISCOUNT_PCT,
  MONTH_LABELS_ID,
} from '@/lib/format';
import { Cake, Coins, Crown, Sparkles } from 'lucide-react';

export const MEMBER_TESTIDS = {
  ribbon: 'member-ribbon',
  pointsBalance: 'member-points-balance',
  tier: 'member-tier',
  birthdayBanner: 'member-birthday-banner',
  birthdayToggle: 'member-birthday-toggle',
  birthMonthEdit: 'member-birth-month-edit',
  pointsToEarn: 'member-points-to-earn',
};

export default function MemberRibbon({ onUpdateCustomer }) {
  const customer = usePosStore((s) => s.customer);
  const birthdayDiscount = usePosStore((s) => s.birthdayDiscount);
  const setBirthdayDiscount = usePosStore((s) => s.setBirthdayDiscount);
  const totals = useTotals();

  if (!customer?.id) return null;

  const tier = tierForSpend(customer.lifetimeSpend || 0);
  const points = Number(customer.points || 0);
  const eligibleBirthday = isBirthdayMonth(customer.birthMonth);
  const earned = pointsEarned(totals.grandTotal);

  return (
    <div
      data-testid={MEMBER_TESTIDS.ribbon}
      className={`flex items-stretch gap-2 px-3 py-1.5 border-y border-slate-300 ${
        eligibleBirthday ? 'bg-gradient-to-r from-pink-100 via-pink-50 to-white' : 'bg-slate-50'
      }`}
    >
      {/* Tier badge */}
      <div className="flex items-center gap-2 pr-3 border-r border-slate-300">
        <div
          data-testid={MEMBER_TESTIDS.tier}
          className={`inline-flex items-center gap-1 px-2 py-1 border font-pos-sans text-[11px] font-bold uppercase tracking-widest ${tier.cls}`}
        >
          <Crown className="w-3 h-3" />
          {tier.label}
        </div>
        <div className="font-pos-mono text-[10px] text-slate-500 leading-tight">
          Lifetime
          <div className="text-slate-800 font-bold tabular-nums">{formatIDR(customer.lifetimeSpend || 0)}</div>
        </div>
      </div>

      {/* Points balance */}
      <div className="flex items-center gap-2 px-3 border-r border-slate-300">
        <Coins className="w-4 h-4 text-amber-600" />
        <div className="font-pos-mono text-[10px] text-slate-500 leading-tight">
          Saldo Poin
          <div
            data-testid={MEMBER_TESTIDS.pointsBalance}
            className="text-slate-900 text-base font-bold tabular-nums"
          >
            {points.toLocaleString('id-ID')} <span className="text-[10px] text-slate-500 font-normal">= Rp {formatIDR(pointsValueRp(points))}</span>
          </div>
        </div>
      </div>

      {/* Points to earn */}
      <div className="flex items-center gap-2 px-3 border-r border-slate-300">
        <Sparkles className="w-4 h-4 text-emerald-600" />
        <div className="font-pos-mono text-[10px] text-slate-500 leading-tight">
          Akan Dapat
          <div
            data-testid={MEMBER_TESTIDS.pointsToEarn}
            className="text-emerald-700 text-base font-bold tabular-nums"
          >
            +{earned} pt
          </div>
        </div>
      </div>

      {/* Birthday banner / set month */}
      {eligibleBirthday ? (
        <div
          data-testid={MEMBER_TESTIDS.birthdayBanner}
          className="flex-1 flex items-center justify-between gap-2 px-3 bg-pink-200 border border-pink-400"
        >
          <div className="flex items-center gap-2">
            <Cake className="w-5 h-5 text-pink-700" />
            <div className="font-pos-sans text-[12px] font-bold uppercase tracking-widest text-pink-800 leading-tight">
              🎂 Promo Ulang Tahun
              <div className="font-pos-mono text-[10px] font-normal text-pink-700 normal-case tracking-normal">
                Diskon otomatis {BIRTHDAY_DISCOUNT_PCT}% untuk member di bulan ini
              </div>
            </div>
          </div>
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input
              data-testid={MEMBER_TESTIDS.birthdayToggle}
              type="checkbox"
              checked={birthdayDiscount}
              onChange={(e) => setBirthdayDiscount(e.target.checked)}
              className="w-4 h-4 accent-pink-600"
            />
            <span className="font-pos-sans text-[10px] uppercase tracking-widest text-pink-900 font-bold">
              Terapkan
            </span>
          </label>
        </div>
      ) : (
        <div className="flex-1 flex items-center gap-2 px-3 font-pos-mono text-[11px] text-slate-500">
          <Cake className="w-4 h-4 opacity-60" />
          <span>Bln Lahir:</span>
          <select
            data-testid={MEMBER_TESTIDS.birthMonthEdit}
            value={Number(customer.birthMonth) || 0}
            onChange={(e) => onUpdateCustomer?.({ ...customer, birthMonth: Number(e.target.value) || null })}
            className="h-7 px-1 bg-white border border-slate-400 font-pos-mono text-xs"
          >
            <option value={0}>— belum diset —</option>
            {MONTH_LABELS_ID.map((m, i) => (
              <option key={m} value={i + 1}>
                {i + 1}. {m}
              </option>
            ))}
          </select>
          <span className="text-slate-400 italic ml-2">
            {customer.birthMonth ? `(${MONTH_LABELS_ID[customer.birthMonth - 1]})` : 'Set ini untuk promo birthday bulan depan'}
          </span>
        </div>
      )}
    </div>
  );
}
