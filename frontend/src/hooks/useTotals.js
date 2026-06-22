import React from 'react';
import { usePosStore } from '@/stores/posStore';
import { BIRTHDAY_DISCOUNT_PCT, RUPIAH_PER_POINT } from '@/lib/format';

// Single source of truth for transaction totals.
// Returns memoized object including loyalty + birthday adjustments.
export function useTotals() {
  const items = usePosStore((s) => s.items);
  const customer = usePosStore((s) => s.customer);
  const loyaltyRedeem = usePosStore((s) => s.loyaltyRedeem);
  const birthdayDiscount = usePosStore((s) => s.birthdayDiscount);

  return React.useMemo(() => {
    const totalQty = items.reduce((s, it) => s + (Number(it.qty) || 0), 0);
    const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0);
    const lineTotal = items.reduce((s, it) => s + (Number(it.lineTotal) || 0), 0);
    const itemDiscount = subtotal - lineTotal;
    const birthdayAmt = birthdayDiscount ? Math.round(lineTotal * (BIRTHDAY_DISCOUNT_PCT / 100)) : 0;
    const redeemPoints = Math.max(0, Math.min(Number(loyaltyRedeem) || 0, Number(customer?.points || 0)));
    const redeemAmt = redeemPoints * RUPIAH_PER_POINT;
    const grandTotal = Math.max(0, lineTotal - birthdayAmt - redeemAmt);
    return {
      totalQty,
      subtotal,
      discount: itemDiscount,
      birthdayDiscount: birthdayAmt,
      loyaltyRedeem: redeemAmt,
      loyaltyRedeemPoints: redeemPoints,
      grandTotal,
    };
  }, [items, customer, loyaltyRedeem, birthdayDiscount]);
}
