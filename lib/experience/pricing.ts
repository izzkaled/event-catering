import { getServiceById } from '@/lib/experience/catalog'
import type { ExperiencePackage, PriceBreakdown, VenueType } from '@/lib/experience/types'

export function calculateExperiencePrice(input: {
  pkg: ExperiencePackage
  guests: number
  selectedServiceIds: string[]
  venueType?: VenueType | null
}): PriceBreakdown {
  const { pkg, guests, selectedServiceIds, venueType } = input
  const includedGuests = pkg.visits_per_week
  const guestsExtra =
    guests > includedGuests ? Math.round((guests - includedGuests) * pkg.per_guest_omr) : 0

  let services = 0
  let setup = 0
  let staff = 0

  for (const id of selectedServiceIds) {
    if (pkg.included_service_ids.includes(id)) continue
    const service = getServiceById(id)
    if (!service) continue
    if (service.category === 'setup') setup += service.price_omr
    else if (service.category === 'staff') staff += service.price_omr
    else services += service.price_omr
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
