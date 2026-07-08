'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { saveReturnTo } from '@/lib/auth/session-storage'

type LoginRequiredDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginRequiredDialog({ open, onOpenChange }: LoginRequiredDialogProps) {
  const router = useRouter()
  const { lang } = useLanguage()
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en)

  if (!open) return null

  const goLogin = () => {
    saveReturnTo('/booking')
    onOpenChange(false)
    router.push('/auth/login')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle>{t('يلزم تسجيل الدخول', 'Login required')}</CardTitle>
          <CardDescription>
            {t(
              'يجب تسجيل الدخول عبر Google أو البريد الإلكتروني لمتابعة الطلب',
              'Sign in with Google or email to continue your order',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {t(
            'لن تفقد بيانات طلبك — سنحفظها ونعيدك لنفس الصفحة بعد تسجيل الدخول.',
            'Your order details will be saved and restored after you sign in.',
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Button className="w-full sm:flex-1" onClick={goLogin}>
            {t('متابعة', 'Continue')}
          </Button>
          <Button
            variant="outline"
            className="w-full sm:flex-1"
            render={<Link href="/booking" />}
            nativeButton={false}
            onClick={() => onOpenChange(false)}
          >
            {t('إلغاء والعودة', 'Cancel')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
