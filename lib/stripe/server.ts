import Stripe from 'stripe'
import { getStripeCurrency } from '@/lib/stripe/config'

let stripeClient: Stripe | null = null

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }

  if (!stripeClient) {
    stripeClient = new Stripe(key)
  }

  return stripeClient
}

/** Zero-decimal currencies (e.g. JPY) are charged as whole units. */
const ZERO_DECIMAL_CURRENCIES = new Set([
  'bif',
  'clp',
  'djf',
  'gnf',
  'jpy',
  'kmf',
  'krw',
  'mga',
  'pyg',
  'rwf',
  'ugx',
  'vnd',
  'vuv',
  'xaf',
  'xof',
  'xpf',
])

/** Convert OMR package price to Stripe amount in smallest currency unit. */
export function omrToStripeAmount(priceOmr: string | number, exchangeRate: number): number {
  const omr = typeof priceOmr === 'string' ? Number.parseFloat(priceOmr) : priceOmr
  if (!Number.isFinite(omr) || omr <= 0) {
    throw new Error('Invalid OMR price')
  }

  const currency = getStripeCurrency()
  const converted = omr * exchangeRate

  if (ZERO_DECIMAL_CURRENCIES.has(currency)) {
    return Math.max(1, Math.round(converted))
  }

  return Math.max(50, Math.round(converted * 100))
}

export function formatStripeDisplayAmount(amountMinor: number, currency: string): string {
  const upper = currency.toUpperCase()
  if (ZERO_DECIMAL_CURRENCIES.has(currency)) {
    return `${amountMinor} ${upper}`
  }
  return `${(amountMinor / 100).toFixed(2)} ${upper}`
}
