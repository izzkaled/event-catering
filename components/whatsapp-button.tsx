'use client'

import { usePathname } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '96877222432'

const NO_BOTTOM_NAV = ['/admin', '/auth', '/booking']

/** Always on the end side (يسار في RTL) — chat lives on start so they never overlap. */
export function WhatsAppButton() {
  const pathname = usePathname()
  const onBooking = pathname?.startsWith('/booking')
  const hasBottomNav = !NO_BOTTOM_NAV.some((p) => pathname?.startsWith(p))

  return (
    <div
      className={cn(
        'fixed z-40 end-3 sm:end-6 flex flex-col items-center gap-1.5',
        onBooking
          ? 'bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] sm:bottom-6'
          : hasBottomNav
            ? 'bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-6'
            : 'bottom-[max(1rem,env(safe-area-inset-bottom,0px))] sm:bottom-6',
      )}
    >
      <span className="pointer-events-none rounded-full border border-white/20 bg-[#128C7E]/95 px-2.5 py-1 text-[10px] font-bold text-white shadow-md backdrop-blur-sm">
        WhatsApp
      </span>
      <a
        href={`https://wa.me/${WHATSAPP}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        className="flex size-12 touch-target items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform active:scale-95 sm:size-14 sm:hover:scale-105"
      >
        <MessageCircle className="size-6 sm:size-7" />
      </a>
    </div>
  )
}
