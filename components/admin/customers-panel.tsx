'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Copy, Mail, MessageCircle, UserCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatPhoneDisplay } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useLanguage } from '@/components/language-provider'

type Customer = {
  id: string
  auth_user_id: string | null
  phone: string | null
  name: string | null
  email: string | null
  address: string | null
  area: string | null
  created_at: string | Date | null
  auth_source: 'neon' | 'phone' | 'unknown'
  order_count: number
  total_spent: string
  active_subscriptions: number
}

export function CustomersPanel() {
  const { t, lang } = useLanguage()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchCustomers = useCallback(async () => {
    const res = await fetch('/api/admin/customers')
    if (res.ok) {
      const data = await res.json()
      setCustomers(data.customers ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const filtered = useMemo(() => {
    if (!search.trim()) return customers
    const q = search.toLowerCase()
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.area?.toLowerCase().includes(q),
    )
  }, [customers, search])

  const totals = useMemo(
    () => ({
      count: filtered.length,
      orders: filtered.reduce((s, c) => s + c.order_count, 0),
      spent: filtered.reduce((s, c) => s + parseFloat(c.total_spent), 0),
      neon: filtered.filter((c) => c.auth_source === 'neon').length,
    }),
    [filtered],
  )

  if (loading) return <p className="text-muted-foreground">{t('admin.customers.loading')}</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder={t('admin.customers.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-secondary/30 p-4 text-sm">
        <span>
          {t('admin.customers.total')}: <strong>{totals.count}</strong>
        </span>
        <span>
          {t('admin.customers.neonLinked')}: <strong>{totals.neon}</strong>
        </span>
        <span>
          {t('admin.customers.totalOrders')}: <strong>{totals.orders}</strong>
        </span>
        <span>
          {t('admin.customers.totalSpent')}: <strong className="ltr-data">{totals.spent.toFixed(2)} OMR</strong>
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.customers.name')}</TableHead>
              <TableHead>{t('admin.customers.contact')}</TableHead>
              <TableHead>{t('admin.customers.area')}</TableHead>
              <TableHead>{t('admin.customers.auth')}</TableHead>
              <TableHead>{t('admin.customers.orders')}</TableHead>
              <TableHead>{t('admin.customers.active')}</TableHead>
              <TableHead>{t('admin.customers.spent')}</TableHead>
              <TableHead>{t('admin.customers.joined')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <UserCircle2 className="size-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{customer.name || '—'}</p>
                      {customer.address && (
                        <p className="truncate-cell-md truncate text-xs text-muted-foreground">
                          {customer.address}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 text-sm">
                    {customer.phone ? (
                      <div className="flex items-center gap-1">
                        <span className="ltr-data">{formatPhoneDisplay(customer.phone.replace(/\D/g, ''))}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(customer.phone!)
                            toast.success(lang === 'ar' ? 'تم النسخ' : 'Copied')
                          }}
                        >
                          <Copy className="size-3" />
                        </button>
                        <a
                          href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="size-3 text-primary" />
                        </a>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                    {customer.email && (
                      <div className="ltr-data flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="size-3" />
                        {customer.email}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{customer.area || '—'}</TableCell>
                <TableCell>
                  {customer.auth_source === 'neon' ? (
                    <Badge variant="default">{t('admin.customers.neon')}</Badge>
                  ) : customer.auth_source === 'phone' ? (
                    <Badge variant="secondary">{t('admin.customers.phoneAuth')}</Badge>
                  ) : (
                    <Badge variant="outline">{t('admin.customers.unknownAuth')}</Badge>
                  )}
                  {customer.auth_user_id && (
                    <p className="ltr-data truncate-cell-sm mt-1 truncate font-mono text-[10px] text-muted-foreground">
                      {customer.auth_user_id}
                    </p>
                  )}
                </TableCell>
                <TableCell>{customer.order_count}</TableCell>
                <TableCell>{customer.active_subscriptions}</TableCell>
                <TableCell className="ltr-data">{customer.total_spent} OMR</TableCell>
                <TableCell className="ltr-data whitespace-nowrap text-xs text-muted-foreground">
                  {customer.created_at
                    ? new Date(customer.created_at).toLocaleDateString(lang === 'ar' ? 'ar-OM' : 'en-GB')
                    : '—'}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  {t('admin.customers.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
