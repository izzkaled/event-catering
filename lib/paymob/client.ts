import { createHmac, timingSafeEqual } from 'crypto'

/** Oman default — override with PAYMOB_BASE_URL for Egypt/KSA/UAE. */
export function getPaymobBaseUrl(): string {
  return (process.env.PAYMOB_BASE_URL || 'https://oman.paymob.com').replace(/\/$/, '')
}

export function isPaymobEnabled(): boolean {
  return Boolean(
    process.env.PAYMOB_SECRET_KEY?.trim() &&
      process.env.PAYMOB_PUBLIC_KEY?.trim() &&
      (process.env.PAYMOB_INTEGRATION_ID || process.env.PAYMOB_INTEGRATION_ID_CARD)?.trim(),
  )
}

export function getPaymobSecretKey(): string {
  const key = process.env.PAYMOB_SECRET_KEY?.trim()
  if (!key) throw new Error('PAYMOB_SECRET_KEY is not configured')
  return key
}

export function getPaymobPublicKey(): string {
  const key = process.env.PAYMOB_PUBLIC_KEY?.trim()
  if (!key) throw new Error('PAYMOB_PUBLIC_KEY is not configured')
  return key
}

export function getPaymobHmacSecret(): string {
  const key = process.env.PAYMOB_HMAC_SECRET?.trim()
  if (!key) throw new Error('PAYMOB_HMAC_SECRET is not configured')
  return key
}

/** Card / Apple Pay / wallet integration IDs (comma-separated supported). */
export function getPaymobIntegrationIds(): number[] {
  const raw =
    process.env.PAYMOB_INTEGRATION_ID?.trim() ||
    process.env.PAYMOB_INTEGRATION_ID_CARD?.trim() ||
    ''
  const ids = raw
    .split(',')
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0)
  if (!ids.length) throw new Error('PAYMOB_INTEGRATION_ID is not configured')
  return ids
}

export function getPaymobCurrency(): string {
  return (process.env.PAYMOB_CURRENCY || 'OMR').trim().toUpperCase()
}

/**
 * Minor units per major currency unit.
 * OMR/KWD/BHD use 1000; most others use 100. Override with PAYMOB_AMOUNT_MULTIPLIER.
 */
export function getPaymobAmountMultiplier(): number {
  const raw = process.env.PAYMOB_AMOUNT_MULTIPLIER?.trim()
  if (raw) {
    const n = Number.parseInt(raw, 10)
    if (Number.isFinite(n) && n > 0) return n
  }
  const currency = getPaymobCurrency()
  return ['OMR', 'KWD', 'BHD'].includes(currency) ? 1000 : 100
}

export function omrToPaymobAmount(omr: number | string): number {
  const value = typeof omr === 'string' ? Number.parseFloat(omr) : omr
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Invalid amount')
  }
  return Math.round(value * getPaymobAmountMultiplier())
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

export type PaymobBillingCustomer = {
  firstName: string
  lastName: string
  email: string
  phone: string
  street?: string
  city?: string
  country?: string
}

export type CreateIntentionInput = {
  amountOmr: number | string
  specialReference: string
  itemName: string
  customer: PaymobBillingCustomer
}

export type IntentionResult = {
  id: string
  clientSecret: string
  intentionOrderId?: number | string
  checkoutUrl: string
}

export async function createPaymobIntention(
  input: CreateIntentionInput,
): Promise<IntentionResult> {
  const amount = omrToPaymobAmount(input.amountOmr)
  const currency = getPaymobCurrency()
  const base = getPaymobBaseUrl()
  const appUrl = getAppUrl()

  const body = {
    amount,
    currency,
    payment_methods: getPaymobIntegrationIds(),
    items: [
      {
        name: input.itemName.slice(0, 120),
        amount,
        quantity: 1,
        description: input.specialReference,
      },
    ],
    billing_data: {
      first_name: input.customer.firstName || 'Customer',
      last_name: input.customer.lastName || 'Customer',
      email: input.customer.email || 'noreply@example.com',
      phone_number: input.customer.phone,
      apartment: 'NA',
      floor: 'NA',
      street: input.customer.street || 'NA',
      building: 'NA',
      shipping_method: 'NA',
      postal_code: 'NA',
      city: input.customer.city || 'Muscat',
      state: 'Muscat',
      country: input.customer.country || 'OMN',
    },
    customer: {
      first_name: input.customer.firstName || 'Customer',
      last_name: input.customer.lastName || 'Customer',
      email: input.customer.email || 'noreply@example.com',
    },
    special_reference: input.specialReference,
    extras: { merchant_order_id: input.specialReference },
    notification_url: `${appUrl}/api/payment/webhook`,
    redirection_url: `${appUrl}/booking/success?order=${encodeURIComponent(input.specialReference)}`,
    expiration: 3600,
  }

  const res = await fetch(`${base}/v1/intention/`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${getPaymobSecretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null
  if (!res.ok) {
    const detail =
      (data && (data.detail || data.message || JSON.stringify(data))) || res.statusText
    throw new Error(`Paymob intention failed: ${detail}`)
  }

  const clientSecret = String(data?.client_secret ?? '')
  if (!clientSecret) {
    throw new Error('Paymob intention missing client_secret')
  }

  const publicKey = getPaymobPublicKey()
  const checkoutUrl = `${base}/unifiedcheckout/?publicKey=${encodeURIComponent(publicKey)}&clientSecret=${encodeURIComponent(clientSecret)}`

  return {
    id: String(data?.id ?? ''),
    clientSecret,
    intentionOrderId: (data?.intention_order_id as number | string | undefined) ?? undefined,
    checkoutUrl,
  }
}

type PaymobTxnObj = {
  amount_cents?: unknown
  created_at?: unknown
  currency?: unknown
  error_occured?: unknown
  has_parent_transaction?: unknown
  id?: unknown
  integration_id?: unknown
  is_3d_secure?: unknown
  is_auth?: unknown
  is_capture?: unknown
  is_refunded?: unknown
  is_standalone_payment?: unknown
  is_voided?: unknown
  order?: { id?: unknown; merchant_order_id?: unknown }
  owner?: unknown
  pending?: unknown
  source_data?: { pan?: unknown; sub_type?: unknown; type?: unknown }
  success?: unknown
}

/** Verify Transaction Processed callback HMAC (SHA-512). */
export function verifyPaymobTransactionHmac(
  obj: PaymobTxnObj,
  receivedHmac: string,
): boolean {
  if (!receivedHmac || !obj) return false

  const fields = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    obj.order?.id,
    obj.owner,
    obj.pending,
    obj.source_data?.pan,
    obj.source_data?.sub_type,
    obj.source_data?.type,
    obj.success,
  ]

  const concatenated = fields.map((v) => String(v)).join('')
  const computed = createHmac('sha512', getPaymobHmacSecret())
    .update(concatenated)
    .digest('hex')

  try {
    const a = Buffer.from(computed, 'utf8')
    const b = Buffer.from(receivedHmac.toLowerCase(), 'utf8')
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function refundPaymobTransaction(
  transactionId: string | number,
  amountCents: number,
): Promise<unknown> {
  const base = getPaymobBaseUrl()
  const res = await fetch(`${base}/api/acceptance/void_refund/refund`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${getPaymobSecretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transaction_id: Number(transactionId),
      amount_cents: amountCents,
    }),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(
      `Paymob refund failed: ${JSON.stringify(data) || res.statusText}`,
    )
  }
  return data
}

export function splitCustomerName(fullName: string): {
  firstName: string
  lastName: string
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: 'Customer', lastName: 'Customer' }
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}
