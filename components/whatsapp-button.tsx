'use client'

import { MessageCircle } from 'lucide-react'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '96877222432'

export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed z-50 flex size-14 touch-target items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform active:scale-95 sm:hover:scale-105 end-4 bottom-[max(1rem,env(safe-area-inset-bottom))] sm:end-6 sm:bottom-6"
    >
      <MessageCircle className="size-7" />
    </a>
  )
}
