'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, FileText, LayoutDashboard, MessageCircle } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'

function RequestReceivedInner() {
  const params = useSearchParams()
  const orderNumber = params.get('order') || '---'
  const { lang } = useLanguage()
  const ar = lang === 'ar'
  const whatsapp = (process.env.NEXT_PUBLIC_WHATSAPP || '96877222432').replace(/\D/g, '')

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-[#4A234A]/10 text-[#4A234A]">
        <CheckCircle2 className="size-9" strokeWidth={1.75} />
      </div>

      <h1 className="font-display text-3xl font-semibold tracking-tight text-[#4A234A] sm:text-4xl">
        {ar ? 'تم إرسال طلبك' : 'Request submitted'}
      </h1>
      <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
        {ar
          ? 'استلمنا طلب الضيافة. سيراجعه فريقنا ويتواصل معك قريباً. أرسلنا تأكيداً وفاتورة PDF إلى بريدك إن وُجد.'
          : 'We received your hospitality request. Our team will review it and contact you soon. A confirmation and PDF invoice were emailed if you provided an address.'}
      </p>

      <p className="mt-6 rounded-full border border-[#C9A86C]/40 bg-white/80 px-5 py-2.5 text-sm text-[#4A234A]">
        {ar ? 'رقم الطلب' : 'Order number'}{' '}
        <span className="font-mono font-bold tracking-wide" dir="ltr">
          {orderNumber}
        </span>
      </p>

      <div className="mt-8 flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
        {orderNumber !== '---' && (
          <Button
            render={
              <a href={`/api/invoice/${encodeURIComponent(orderNumber)}`} download />
            }
            nativeButton={false}
            variant="outline"
            className="h-11 gap-2"
          >
            <FileText className="size-4" />
            {ar ? 'تحميل الفاتورة' : 'Download invoice'}
          </Button>
        )}
        <Button
          render={<Link href="/profile" />}
          nativeButton={false}
          className="h-11 gap-2 bg-[#4A234A] text-[#F5F1E9] hover:bg-[#4A234A]/90"
        >
          <LayoutDashboard className="size-4" />
          {ar ? 'حسابي' : 'My account'}
        </Button>
        <Button
          render={
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                ar
                  ? `مرحباً، بخصوص طلبي ${orderNumber}`
                  : `Hello, regarding my request ${orderNumber}`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
          nativeButton={false}
          variant="outline"
          className="h-11 gap-2"
        >
          <MessageCircle className="size-4" />
          {ar ? 'واتساب' : 'WhatsApp'}
        </Button>
      </div>

      <p className="mt-8 max-w-sm text-xs leading-relaxed text-muted-foreground">
        {ar
          ? 'الدفع يتم بعد مراجعة العرض من الأدمن عند الحاجة — لا يلزم دفع الآن.'
          : 'Payment is arranged after our team reviews the quote when needed — nothing to pay now.'}
      </p>
    </main>
  )
}

export default function RequestReceivedPage() {
  return (
    <div className="page-shell flex min-h-screen flex-col bg-[linear-gradient(165deg,#F5F1E9_0%,#efe6dc_45%,#f8f4f0_100%)]">
      <SiteHeader />
      <Suspense
        fallback={
          <main className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
            …
          </main>
        }
      >
        <RequestReceivedInner />
      </Suspense>
      <SiteFooter />
    </div>
  )
}
