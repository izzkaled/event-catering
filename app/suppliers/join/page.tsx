import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SupplierJoinForm } from '@/components/suppliers/supplier-join-form'
import { SITE_NAME, SITE_URL } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'تسجيل مورد ضيافة | إيفنت كاترينج',
  description:
    'سجّل شركتك كمورد ضيافة على منصة إيفنت كاترينج: بيانات التواصل، الأسعار، نوع المطبخ، وصور المناسبات.',
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_URL}/suppliers/join` },
  openGraph: {
    title: `تسجيل مورد | ${SITE_NAME}`,
    url: `${SITE_URL}/suppliers/join`,
  },
}

export default function SupplierJoinPage() {
  return (
    <div className="page-shell flex min-h-screen flex-col">
      <SiteHeader />
      <main className="min-w-0 flex-1 overflow-x-clip">
        <section className="border-b border-[var(--line)] bg-[linear-gradient(180deg,#f7f3ec_0%,#fff_70%)] py-10 sm:py-14">
          <div className="site-container max-w-3xl">
            <p className="text-sm font-medium text-brand-palm">Event Catering · إيفنت كاترينج</p>
            <h1 className="mt-2 font-ios text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
              تسجيل مورد ضيافة
            </h1>
            <p className="mt-3 max-w-2xl text-[var(--ink-soft)]">
              عبّئ بيانات الشركة والأسعار ونوع المطبخ، وارفع صور المناسبات والبوفيه. الطلب يصل للإدارة فقط ولن يُعرض للعامة.
            </p>
          </div>
        </section>
        <section className="py-8 sm:py-12">
          <div className="site-container max-w-3xl">
            <SupplierJoinForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
