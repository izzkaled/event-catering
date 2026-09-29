'use client'

import { useEffect, useRef } from 'react'

/** Fire-and-forget view counter so package pages can stay ISR-cached. */
export function PackageViewBeacon({ packageId }: { packageId: string }) {
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current || !packageId || packageId.startsWith('fallback-')) return
    sent.current = true
    void fetch('/api/packages/view', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: packageId }),
      keepalive: true,
    }).catch(() => {})
  }, [packageId])

  return null
}
