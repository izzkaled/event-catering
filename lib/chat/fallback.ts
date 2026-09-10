import type { ChatSiteContext } from '@/lib/chat/site-context'

function normalize(s: string) {
  return s.toLowerCase().trim()
}

function greet(name: string | null | undefined, ar: boolean) {
  const n = name?.trim()
  if (!n) return ar ? 'أهلاً بك' : 'Welcome'
  return ar ? `أهلاً ${n}` : `Hi ${n}`
}

function md(label: string, href: string) {
  return `[${label}](${href})`
}

/** Lightweight answers when Gemini is unavailable — still uses live package data + links. */
export function fallbackChatReply(
  message: string,
  lang: 'ar' | 'en',
  ctx: ChatSiteContext,
  customerName?: string | null,
): string {
  const q = normalize(message)
  const ar = lang === 'ar'
  const hi = greet(customerName, ar)

  const wantsPackages =
    /باق|سعر|اسعار|أسعار|package|price|cost|كم|عرض|ضياف|cater/.test(q) &&
    !/طلباتي|subscriptions|my request|my order/.test(q)
  const wantsMySubs = /اشتراكاتي|subscriptions|طلباتي|my order|my request|حسابي|profile|بروفايل/.test(q)
  const wantsAreas = /منطق|مساح|أين|اين|area|muscat|مسقط|تغط|خدم/.test(q)
  const wantsBook = /حجز|احجز|book|ابدأ|ابدا|order|طلب|اطلب/.test(q)
  const wantsPay = /دفع|بطاقة|تحويل|pay|card|bank|ابل|apple/.test(q)
  const wantsWhatsapp = /واتس|whatsapp|تواصل|كلم|اتصل/.test(q)
  const wantsLogin = /دخول|login|تسجيل|password|كلمة المرور|نسيت/.test(q)

  if (wantsMySubs) {
    return ar
      ? `${hi}\nتلاقي طلباتك هنا:\n${md('طلباتي', ctx.subscriptions_url)}\n\nأو ملفك الشخصي:\n${md('حسابي', ctx.profile_url)}`
      : `${hi}\nFind your requests here:\n${md('My requests', ctx.subscriptions_url)}\n\nOr your profile:\n${md('My profile', ctx.profile_url)}`
  }

  if (wantsLogin) {
    return ar
      ? `${hi}، سجّل الدخول من هنا:\n${md('تسجيل الدخول', ctx.login_url)}\n\nنسيت كلمة المرور؟\n${md('استعادة كلمة المرور', ctx.forgot_url)}`
      : `${hi} — sign in here:\n${md('Log in', ctx.login_url)}\n\nForgot password?\n${md('Reset password', ctx.forgot_url)}`
  }

  if (wantsWhatsapp) {
    return ar
      ? `${hi}\nتواصل واتساب:\n${md('واتساب إيفنت كاترينج', ctx.whatsapp_url)}\n\nأو اطلب باقة:\n${md('اطلب باقة', ctx.booking_url)}`
      : `${hi}\nWhatsApp us:\n${md('Event Catering WhatsApp', ctx.whatsapp_url)}\n\nOr request a package:\n${md('Request package', ctx.booking_url)}`
  }

  if (wantsAreas) {
    const areas = ar ? ctx.areas_ar.join(' · ') : ctx.areas_en.join(' · ')
    return ar
      ? `${hi}، نخدم مسقط وضواحيها:\n${areas}\n\n${md('عرض الباقات', ctx.packages_url)} · ${md('اطلب باقة', ctx.booking_url)}`
      : `${hi} — we serve Muscat:\n${areas}\n\n${md('View packages', ctx.packages_url)} · ${md('Request package', ctx.booking_url)}`
  }

  if (wantsPay) {
    return ar
      ? `${hi}، الدفع غالباً بعد تأكيد العرض: بطاقة / Apple Pay عبر Paymob، أو تحويل بنكي.\n${md('ابدأ الطلب', ctx.booking_url)}`
      : `${hi} — payment is often after quote confirmation: card / Apple Pay (Paymob) or bank transfer.\n${md('Start request', ctx.booking_url)}`
  }

  if (wantsBook || wantsPackages) {
    if (!ctx.packages.length) {
      return ar
        ? `${hi}، الباقات تُحدَّث الآن. ${md('تواصل واتساب', ctx.whatsapp_url)}`
        : `${hi} — packages updating. ${md('WhatsApp us', ctx.whatsapp_url)}`
    }

    const top = [...ctx.packages]
      .sort((a, b) => Number(a.price_omr) - Number(b.price_omr))
      .slice(0, 5)

    const list = top
      .map((p) => {
        const name = ar ? p.name_ar : p.name_en
        const pop = p.popular ? ' ★' : ''
        const label = ar ? 'اطلب هذه الباقة' : 'Request this package'
        return ar
          ? `• ${name}${pop} — يبدأ من ${p.price_omr} ر.ع\n  ${md(label, p.book_url)}`
          : `• ${name}${pop} — from ${p.price_omr} OMR\n  ${md(label, p.book_url)}`
      })
      .join('\n\n')

    return ar
      ? `${hi}، هذه باقات مناسبة:\n\n${list}\n\n${md('كل الباقات', ctx.packages_url)} · ${md('طلب عام', ctx.booking_url)}`
      : `${hi} — packages that fit:\n\n${list}\n\n${md('All packages', ctx.packages_url)} · ${md('General request', ctx.booking_url)}`
  }

  return ar
    ? `${hi} في إيفنت كاترينج\nأقدر أساعدك بالباقات، المناطق، طلبات الضيافة، أو طلباتك.\n\n${md('الباقات', ctx.packages_url)} · ${md('اطلب', ctx.booking_url)} · ${md('طلباتي', ctx.subscriptions_url)}`
    : `${hi} to Event Catering\nI can help with packages, areas, hospitality requests, or your orders.\n\n${md('Packages', ctx.packages_url)} · ${md('Request', ctx.booking_url)} · ${md('My requests', ctx.subscriptions_url)}`
}
