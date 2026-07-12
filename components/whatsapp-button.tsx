'use client'

import { usePathname } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '96877222432'

const NO_BOTTOM_NAV = ['/admin', '/auth', '/booking']

export function WhatsAppButton() {
  const pathname = usePathname()
  const onBooking = pathname?.startsWith('/booking')
  const hasBottomNav = !NO_BOTTOM_NAV.some((p) => pathname?.startsWith(p))

  return (
    <a
      href={`https://wa.me/${WHATSAPP}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className={cn(
        'fixed z-40 flex size-12 touch-target items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform active:scale-95 sm:size-14 sm:hover:scale-105 end-3 sm:end-6',
        onBooking
          ? 'bottom-[calc(5.25rem+env(safe-area-inset-bottom))] sm:bottom-6'
          : hasBottomNav
            ? 'bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-6'
            : 'bottom-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-6',
      )}
    >
      <MessageCircle className="size-6 sm:size-7" />
    </a>
  )
}
