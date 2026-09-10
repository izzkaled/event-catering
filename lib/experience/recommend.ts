import { calculateExperiencePrice } from '@/lib/experience/pricing'
import { budgetMax } from '@/lib/experience/filters'
import type {
  BudgetBand,
  ExperiencePackage,
  OccasionType,
} from '@/lib/experience/types'

export type RecommendationReason =
  | 'guests'
  | 'occasion'
  | 'budget'
  | 'services'

export function recommendPackages(input: {
  packages: ExperiencePackage[]
  occasion: OccasionType | null
  guests: number
  budget: BudgetBand | null
  desiredServiceIds?: string[]
  limit?: number
}): { pkg: ExperiencePackage; score: number; reasons: RecommendationReason[] }[] {
  const { packages, occasion, guests, budget, desiredServiceIds = [], limit = 3 } = input
  const maxBudget = budgetMax(budget)

  const scored = packages
    .map((pkg) => {
      const reasons: RecommendationReason[] = []
      let score = 0

      if (guests >= pkg.min_guests && guests <= pkg.max_guests) {
        score += 40
        reasons.push('guests')
      } else if (guests >= pkg.min_guests * 0.7 && guests <= pkg.max_guests * 1.2) {
        score += 20
        reasons.push('guests')
      }

      if (occasion && pkg.occasion_types.includes(occasion)) {
        score += 30
        reasons.push('occasion')
      } else if (occasion === 'other') {
        score += 10
      }

      const estimate = calculateExperiencePrice({
        pkg,
        guests,
        selectedServiceIds: desiredServiceIds,
      }).estimatedTotal

      if (maxBudget != null) {
        if (estimate <= maxBudget) {
          score += 25
          reasons.push('budget')
        } else if (estimate <= maxBudget * 1.15) {
          score += 10
          reasons.push('budget')
        }
      } else {
        score += 5
      }

      const overlap = desiredServiceIds.filter((id) =>
        pkg.included_service_ids.includes(id) || pkg.recommended_service_ids.includes(id),
      ).length
      if (overlap > 0) {
        score += Math.min(15, overlap * 5)
        reasons.push('services')
      }

      if (pkg.is_recommended || pkg.is_popular) score += 8

      return { pkg, score, reasons: [...new Set(reasons)] }
    })
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit)
}

export function optimizeForBudget(input: {
  pkg: ExperiencePackage
  guests: number
  selectedServiceIds: string[]
  budget: BudgetBand
}) {
  const max = budgetMax(input.budget)
  if (max == null) return input.selectedServiceIds

  let selected = [...input.selectedServiceIds]
  let total = calculateExperiencePrice({
    pkg: input.pkg,
    guests: input.guests,
    selectedServiceIds: selected,
  }).estimatedTotal

  const removable = selected
    .filter((id) => !input.pkg.included_service_ids.includes(id))
    .reverse()

  for (const id of removable) {
    if (total <= max) break
    selected = selected.filter((s) => s !== id)
    total = calculateExperiencePrice({
      pkg: input.pkg,
      guests: input.guests,
      selectedServiceIds: selected,
    }).estimatedTotal
  }

  return selected
}

export function reasonLabel(reason: RecommendationReason, lang: 'ar' | 'en') {
  const map = {
    guests: { ar: 'تناسب عدد ضيوفك', en: 'Fits your guest count' },
    occasion: { ar: 'تناسب نوع مناسبتك', en: 'Matches your occasion' },
    budget: { ar: 'ضمن ميزانيتك المفضلة', en: 'Within your preferred budget' },
    services: { ar: 'تتضمن الخدمات التي اخترتها', en: 'Includes the services you selected' },
  }
  return map[reason][lang]
}
