import { NextResponse } from 'next/server'
import { isPaymobEnabled } from '@/lib/paymob/client'
import { getBankDetails } from '@/lib/paymob/bank'

export const dynamic = 'force-dynamic'

/** Public checkout flags — no secrets. */
export async function GET() {
  const bank = getBankDetails()
  return NextResponse.json({
    paymobEnabled: isPaymobEnabled(),
    bankTransferEnabled: true,
    bankConfigured: Boolean(bank.accountNumber || bank.iban),
  })
}
