'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const VISITOR_KEY = 'event_visitor_id'
/** Keep live presence without inventing new “visits”. */
const HEARTBEAT_MS = 4 * 60 * 1000
const LAST_PING_KEY = 'event_visitor_last_ping'

function getVisitorId() {
  let id = localStorage.getItem(VISITOR_KEY)
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    id = crypto.randomUUID()
    localStorage.setItem(VISITOR_KEY, id)
  }
  return id
}

function shouldSkipPath(pathname: string | null) {
  if (!pathname) return true
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/booking/pending') ||
    pathname.startsWith('/booking/success') ||
    pathname.startsWith('/booking/failed')
  )
}

function isBot() {
  if (typeof navigator === 'undefined') return true
  if (navigator.webdriver) return true
  const ua = navigator.userAgent || ''
  return /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora|linkedinbot|pinterest|redditbot|whatsapp|telegram/i.test(
    ua,
  )
}

export function VisitorTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (shouldSkipPath(pathname) || isBot()) return

    const ping = () => {
      const now = Date.now()
      const last = Number(sessionStorage.getItem(LAST_PING_KEY) || 0)
      // Client throttle: at most one ping every ~3.5 minutes per tab
      if (last && now - last < 3.5 * 60 * 1000) return
      sessionStorage.setItem(LAST_PING_KEY, String(now))

      fetch('/api/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: pathname, visitor_id: getVisitorId() }),
        keepalive: true,
      }).catch(() => {})
    }

    ping()
    const interval = setInterval(ping, HEARTBEAT_MS)
    return () => clearInterval(interval)
  }, [pathname])

  return null
}
