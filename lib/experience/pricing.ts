import { getServiceById } from '@/lib/experience/catalog'
import type { CatalogService, ExperiencePackage, PriceBreakdown, VenueType } from '@/lib/experience/types'

/** Line total for one service given guest count. */
export function serviceLineTotal(
  service: Pick<CatalogService, 'price_omr' | 'pricing_model'>,
  guests: number,
): number {
  const unit = Number(service.price_omr) || 0
  if (service.pricing_model === 'per_guest') {
    return Math.round(unit * Math.max(1, guests) * 100) / 100
  }
  return Math.round(unit * 100) / 100
}

export function formatServicePriceLabel(
  service: Pick<CatalogService, 'price_omr' | 'pricing_model'>,
  guests: number,
  lang: 'ar' | 'en',
): string {
  const unit = Number(service.price_omr) || 0
  if (service.pricing_model === 'per_guest') {
    const total = serviceLineTotal(service, guests)
    return lang === 'ar'
      ? `${unit} ر.ع / ضيف · ${Math.round(total)} ر.ع لـ ${guests}`
      : `${unit} OMR / guest · ${Math.round(total)} OMR for ${guests}`
  }
  return formatOmr(unit, lang)
}

export function calculateExperiencePrice(input: {
  pkg: ExperiencePackage
  guests: number
  selectedServiceIds: string[]
  venueType?: VenueType | null
  /** Prefer live catalog (DB); falls back to static catalog lookup */
  servicesCatalog?: CatalogService[]
}): PriceBreakdown {
  const { pkg, guests, selectedServiceIds, venueType, servicesCatalog } = input
  const includedGuests = pkg.visits_per_week
  const guestsExtra =
    guests > includedGuests ? Math.round((guests - includedGuests) * pkg.per_guest_omr) : 0

  let services = 0
  let setup = 0
  let staff = 0

  const resolve = (id: string): CatalogService | undefined =>
    servicesCatalog?.find((s) => s.id === id) || getServiceById(id)

  for (const id of selectedServiceIds) {
    if (pkg.included_service_ids.includes(id)) continue
    const service = resolve(id)
    if (!service) continue
    const line = serviceLineTotal(service, guests)
    if (service.category === 'setup') setup += line
    else if (service.category === 'staff') staff += line
    else services += line
  }

  const location = venueType === 'outdoor' ? 40 : venueType === 'venue' ? 25 : 0
  const packageBase = pkg.base_price
  const estimatedTotal = packageBase + guestsExtra + services + setup + staff + location

  return {
    packageBase,
    guestsExtra,
    services,
    setup,
    staff,
    location,
    estimatedTotal,
  }
}

export function formatOmr(amount: number, lang: 'ar' | 'en' = 'ar') {
  const value = Math.round(amount)
  return lang === 'ar' ? `${value} ر.ع` : `${value} OMR`
}
