import { Suspense } from 'react'
import { BookingSuccessContent } from './success-content'

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">...</div>}>
      <BookingSuccessContent />
    </Suspense>
  )
}
