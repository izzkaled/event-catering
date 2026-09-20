export type ProfileCompletenessUser = {
  name?: string | null
  phone?: string | null
  area?: string | null
}

/** New customers must set name, Oman phone, and Muscat area before ordering. */
export function isCustomerProfileComplete(user: ProfileCompletenessUser | null | undefined): boolean {
  if (!user) return false
  return Boolean(user.name?.trim() && user.phone?.trim() && user.area?.trim())
}

export const COMPLETE_PROFILE_PATH = '/auth/complete-profile'
