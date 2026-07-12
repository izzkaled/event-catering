/** Stripe is enabled when both keys are set in the environment. */
export function isStripeEnabled(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim(),
  )
}

export function getStripeCurrency(): string {
  return (process.env.STRIPE_CURRENCY || 'usd').trim().toLowerCase()
}

/** 1 OMR → target currency (e.g. 2.597 USD per OMR). Override via env. */
export function getOmrExchangeRate(): number {
  const raw = process.env.STRIPE_OMR_EXCHANGE_RATE?.trim()
  const rate = raw ? Number.parseFloat(raw) : 2.597
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('STRIPE_OMR_EXCHANGE_RATE must be a positive number')
  }
  return rate
}

export function getStripeWebhookSecret(): string | undefined {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || undefined
}
