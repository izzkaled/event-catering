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
      className="fixed bottom-6 left-6 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
    >
      <MessageCircle className="size-7" />
    </a>
  )
}
