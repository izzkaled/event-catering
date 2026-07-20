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
    /باق|سعر|اسعار|أسعار|package|price|cost|كم|عرض|plan|subscription|اشتراك/.test(q) &&
    !/اشتراكاتي|subscriptions|my sub/.test(q)
  const wantsMySubs = /اشتراكاتي|subscriptions|طلباتي|my order|حسابي|profile|بروفايل/.test(q)
  const wantsAreas = /منطق|مساح|أين|اين|area|muscat|مسقط|تغط|خدم/.test(q)
  const wantsBook = /حجز|احجز|book|ابدأ|ابدا|order|طلب/.test(q)
  const wantsPay = /دفع|بطاقة|تحويل|pay|card|bank|ابل|apple/.test(q)
  const wantsWhatsapp = /واتس|whatsapp|تواصل|كلم|اتصل/.test(q)
  const wantsLogin = /دخول|login|تسجيل|password|كلمة المرور|نسيت/.test(q)

  if (wantsMySubs) {
    return ar
      ? `${hi} 🌿\nتلاقي اشتراكاتك هنا:\n${md('اشتراكاتي', ctx.subscriptions_url)}\n\nأو ملفك الشخصي:\n${md('حسابي', ctx.profile_url)}`
      : `${hi} 🌿\nFind your subscriptions here:\n${md('My subscriptions', ctx.subscriptions_url)}\n\nOr your profile:\n${md('My profile', ctx.profile_url)}`
  }

  if (wantsLogin) {
    return ar
      ? `${hi}، سجّل الدخول من هنا:\n${md('تسجيل الدخول', ctx.login_url)}\n\nنسيت كلمة المرور؟\n${md('استعادة كلمة المرور', ctx.forgot_url)}`
      : `${hi} — sign in here:\n${md('Log in', ctx.login_url)}\n\nForgot password?\n${md('Reset password', ctx.forgot_url)}`
  }

  if (wantsWhatsapp) {
    return ar
      ? `${hi} 🌿\nتواصل واتساب:\n${md('واتساب خوصة', ctx.whatsapp_url)}\n\nأو احجز مباشرة:\n${md('ابدأ الحجز', ctx.booking_url)}`
      : `${hi} 🌿\nWhatsApp us:\n${md('KHOUSA WhatsApp', ctx.whatsapp_url)}\n\nOr book directly:\n${md('Start booking', ctx.booking_url)}`
  }

  if (wantsAreas) {
    const areas = ar ? ctx.areas_ar.join(' · ') : ctx.areas_en.join(' · ')
    return ar
      ? `${hi}، نخدم مسقط وضواحيها:\n${areas}\n\n${md('عرض الباقات', ctx.packages_url)} · ${md('احجز الآن', ctx.booking_url)}`
      : `${hi} — we serve Muscat:\n${areas}\n\n${md('View packages', ctx.packages_url)} · ${md('Book now', ctx.booking_url)}`
  }

  if (wantsPay) {
    return ar
      ? `${hi}، الدفع: بطاقة / Apple Pay عبر Paymob، أو تحويل بنكي.\n${md('ابدأ الحجز واختر الدفع', ctx.booking_url)}`
      : `${hi} — pay by card / Apple Pay (Paymob) or bank transfer.\n${md('Start booking & choose payment', ctx.booking_url)}`
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
        const label = ar ? 'احجز هذه الباقة' : 'Book this package'
        return ar
          ? `• ${name}${pop} — ${p.hours_per_visit}س × ${p.visits_per_week}/أسبوع — ${p.price_omr} ر.ع\n  ${md(label, p.book_url)}`
          : `• ${name}${pop} — ${p.hours_per_visit}h × ${p.visits_per_week}/week — ${p.price_omr} OMR\n  ${md(label, p.book_url)}`
      })
      .join('\n\n')

    return ar
      ? `${hi}، هذه باقات مناسبة:\n\n${list}\n\n${md('كل الباقات', ctx.packages_url)} · ${md('حجز عام', ctx.booking_url)}`
      : `${hi} — packages that fit:\n\n${list}\n\n${md('All packages', ctx.packages_url)} · ${md('General booking', ctx.booking_url)}`
  }

  return ar
    ? `${hi} في خوصة 🌿\nأقدر أساعدك بالباقات، المناطق، الحجز، أو اشتراكاتك.\n\n${md('الباقات', ctx.packages_url)} · ${md('احجز', ctx.booking_url)} · ${md('اشتراكاتي', ctx.subscriptions_url)}`
    : `${hi} to KHOUSA 🌿\nI can help with packages, areas, booking, or your subscriptions.\n\n${md('Packages', ctx.packages_url)} · ${md('Book', ctx.booking_url)} · ${md('My subscriptions', ctx.subscriptions_url)}`
}
