/** Normalize Paymob / bank payment details for admin display. */

export type PaymentChannel =
  | 'visa'
  | 'mastercard'
  | 'apple_pay'
  | 'card'
  | 'bank_transfer'
  | 'stripe'
  | 'paymob'
  | 'unknown'

export type ParsedPaymentSource = {
  channel: PaymentChannel
  cardLast4: string | null
  /** Raw Paymob source type / sub_type for debugging */
  rawType: string | null
  rawSubType: string | null
}

const CHANNEL_LABELS: Record<PaymentChannel, { ar: string; en: string }> = {
  visa: { ar: 'فيزا', en: 'Visa' },
  mastercard: { ar: 'ماستركارد', en: 'Mastercard' },
  apple_pay: { ar: 'Apple Pay', en: 'Apple Pay' },
  card: { ar: 'بطاقة', en: 'Card' },
  bank_transfer: { ar: 'تحويل بنكي', en: 'Bank transfer' },
  stripe: { ar: 'Stripe', en: 'Stripe' },
  paymob: { ar: 'بطاقة (Paymob)', en: 'Card (Paymob)' },
  unknown: { ar: 'غير محدد', en: 'Unknown' },
}

export function paymentChannelLabel(channel: string | null | undefined, lang: 'ar' | 'en') {
  const key = (channel || 'unknown') as PaymentChannel
  const row = CHANNEL_LABELS[key] || CHANNEL_LABELS.unknown
  return lang === 'ar' ? row.ar : row.en
}

export function paymentChannelBadgeClass(channel: string | null | undefined) {
  switch (channel) {
    case 'visa':
      return 'bg-sky-100 text-sky-900 ring-1 ring-sky-200/80'
    case 'mastercard':
      return 'bg-orange-100 text-orange-900 ring-1 ring-orange-200/80'
    case 'apple_pay':
      return 'bg-zinc-900 text-white ring-1 ring-zinc-700'
    case 'card':
    case 'paymob':
      return 'bg-indigo-100 text-indigo-900 ring-1 ring-indigo-200/80'
    case 'bank_transfer':
      return 'bg-amber-100 text-amber-900 ring-1 ring-amber-200/80'
    case 'stripe':
      return 'bg-violet-100 text-violet-900 ring-1 ring-violet-200/80'
    default:
      return 'bg-muted text-muted-foreground ring-1 ring-border'
  }
}

function normalizeToken(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
}

function last4FromPan(pan: unknown): string | null {
  const digits = String(pan ?? '').replace(/\D/g, '')
  if (digits.length < 4) return null
  return digits.slice(-4)
}

/**
 * Map Paymob webhook `source_data` (+ optional integration hints) to a clear channel.
 * Typical Paymob shapes:
 * - type: "card" | "wallet" | ...
 * - sub_type: "Visa" | "MasterCard" | "Apple Pay" | ...
 * - pan: masked card ending
 */
export function parsePaymobSourceData(input: {
  source_data?: { pan?: unknown; sub_type?: unknown; type?: unknown } | null
  integration_id?: unknown
  data_message?: unknown
}): ParsedPaymentSource {
  const type = normalizeToken(input.source_data?.type)
  const sub = normalizeToken(input.source_data?.sub_type)
  const msg = normalizeToken(input.data_message)
  const hay = `${type} ${sub} ${msg}`

  let channel: PaymentChannel = 'card'
  if (/apple\s*pay|applepay/.test(hay)) channel = 'apple_pay'
  else if (/visa/.test(hay)) channel = 'visa'
  else if (/master\s*card|mastercard|maestro/.test(hay)) channel = 'mastercard'
  else if (/wallet|apple/.test(hay)) channel = 'apple_pay'
  else if (type === 'card' || sub) channel = 'card'
  else channel = 'paymob'

  return {
    channel,
    cardLast4: last4FromPan(input.source_data?.pan),
    rawType: input.source_data?.type != null ? String(input.source_data.type) : null,
    rawSubType: input.source_data?.sub_type != null ? String(input.source_data.sub_type) : null,
  }
}

export function channelFromPaymentMethod(method: string | null | undefined): PaymentChannel {
  if (method === 'bank_transfer') return 'bank_transfer'
  if (method === 'stripe') return 'stripe'
  if (method === 'paymob') return 'paymob'
  return 'unknown'
}
