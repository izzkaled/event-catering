'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const VISITOR_KEY = 'event_visitor_id'
const HEARTBEAT_MS = 5 * 60 * 1000

function getVisitorId() {
  let id = localStorage.getItem(VISITOR_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(VISITOR_KEY, id)
  }
  return id
}

export function VisitorTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const track = () => {
      fetch('/api/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: pathname, visitor_id: getVisitorId() }),
      }).catch(() => {})
    }

    track()
    const interval = setInterval(track, HEARTBEAT_MS)
    return () => clearInterval(interval)
  }, [pathname])

  return null
}
