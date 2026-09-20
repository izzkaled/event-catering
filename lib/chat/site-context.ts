import { MUSCAT_AREAS, MUSCAT_AREAS_EN } from '@/lib/constants'
import { getActivePackagesWithSections } from '@/lib/packages/queries'
import { toExperiencePackage } from '@/lib/packages/experience-map'
import type { PackageWithSection } from '@/lib/packages/types'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '96877222432'

export type ChatSiteContext = {
  packages: Array<{
    id: string
    slug: string
    name_ar: string
    name_en: string
    section_ar: string | null
    section_en: string | null
    hours_per_visit: number
    visits_per_week: number
    visits_per_month: number
    price_omr: string
    popular: boolean
    package_url: string
    customize_url: string
  }>
  areas_ar: readonly string[]
  areas_en: readonly string[]
  whatsapp: string
  whatsapp_url: string
  booking_url: string
  packages_url: string
  find_url: string
  subscriptions_url: string
  profile_url: string
  login_url: string
  forgot_url: string
  home_url: string
  site_name_ar: string
  site_name_en: string
}

export async function buildChatSiteContext(): Promise<ChatSiteContext> {
  let packages: PackageWithSection[] = []
  try {
    packages = await getActivePackagesWithSections()
  } catch {
    packages = []
  }

  return {
    packages: packages.map((p) => {
      const exp = toExperiencePackage(p)
      return {
        id: p.id,
        slug: exp.slug,
        name_ar: p.name_ar,
        name_en: p.name_en,
        section_ar: p.section_name_ar,
        section_en: p.section_name_en,
        hours_per_visit: p.hours_per_visit,
        visits_per_week: p.visits_per_week,
        visits_per_month: p.visits_per_month,
        price_omr: String(p.price_omr),
        popular: Boolean(p.is_popular || p.is_featured),
        package_url: `/packages/${exp.slug}`,
        customize_url: `/experience?package=${exp.slug}`,
      }
    }),
    areas_ar: MUSCAT_AREAS,
    areas_en: MUSCAT_AREAS_EN,
    whatsapp: WHATSAPP,
    whatsapp_url: `https://wa.me/${WHATSAPP}`,
    booking_url: '/booking',
    packages_url: '/packages',
    find_url: '/experience/find',
    subscriptions_url: '/subscriptions',
    profile_url: '/profile',
    login_url: '/auth/login',
    forgot_url: '/auth/forgot',
    home_url: '/',
    site_name_ar: 'إيفنت كاترينج',
    site_name_en: 'Event Catering',
  }
}

export function formatContextForPrompt(ctx: ChatSiteContext): string {
  const lines = ctx.packages.map((p) => {
    const flag = p.popular ? ' [popular]' : ''
    return `- id:${p.id} | slug:${p.slug} | ${p.name_ar} / ${p.name_en}${flag} | capacity ${p.visits_per_week} | ${p.price_omr} OMR | PACKAGE_LINK: ${p.package_url} | CUSTOMIZE_LINK: ${p.customize_url}`
  })

  return [
    `Brand: ${ctx.site_name_ar} (${ctx.site_name_en}) — hospitality experience platform for occasions in Oman.`,
    `Model: browse/customize experience → request → admin coordinates partners → quote/approval.`,
    `Currency: OMR (indicative until final quote).`,
    `IMPORTANT SITE LINKS (use these exact paths in markdown links):`,
    `- Home: ${ctx.home_url}`,
    `- All packages: ${ctx.packages_url}`,
    `- Find my experience: ${ctx.find_url}`,
    `- Final request: complete the Request step inside /experience?package=SLUG (never dump users into old /booking wizard for browsing)`,
    `- Payment after submit: /booking/payment (OK)`,
    `- My requests: ${ctx.subscriptions_url}`,
    `- My profile: ${ctx.profile_url}`,
    `- Login: ${ctx.login_url} (Google or email OTP — no password)`,
    `- WhatsApp: ${ctx.whatsapp_url}`,
    `Service areas (AR): ${ctx.areas_ar.join(', ')}`,
    `Service areas (EN): ${ctx.areas_en.join(', ')}`,
    `Payment: card/Apple Pay via Paymob, or bank transfer (often after quote confirmation).`,
    `Active packages (${ctx.packages.length}) — when recommending a package ALWAYS include PACKAGE_LINK (not old /booking?package=):`,
    lines.length ? lines.join('\n') : '(no packages loaded)',
  ].join('\n')
}
