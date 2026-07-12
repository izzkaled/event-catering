'use client'

import 'react-big-calendar/lib/css/react-big-calendar.css'

import * as React from 'react'
import { Calendar, dateFnsLocalizer, type Event as RBCEvent } from 'react-big-calendar'
import { addMinutes, format, getDay, parse, startOfWeek } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { arSA } from 'date-fns/locale/ar-SA'
import { toast } from 'sonner'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type EventType = 'campaign' | 'event' | 'deadline' | 'meeting' | 'urgent'

type CalendarEvent = RBCEvent & {
  id: string
  type: EventType
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 0 }),
  getDay,
  locales: { 'en-US': enUS, 'ar-SA': arSA },
})

const typeColor: Record<EventType, string> = {
  campaign: '#2563EB',
  event: '#0EA5E9',
  deadline: '#F59E0B',
  meeting: '#6366F1',
  urgent: '#EF4444',
}

function parseType(value: string): EventType {
  if (value === 'campaign' || value === 'event' || value === 'deadline' || value === 'meeting' || value === 'urgent') {
    return value
  }
  return 'event'
}

type ScheduleEventDTO = {
  id: string
  title: string
  type: string
  start_at: string
  end_at: string
}

export default function AdminSchedulePage() {
  const { lang, t, dir } = useLanguage()
  const [title, setTitle] = React.useState('')
  const [type, setType] = React.useState<EventType>('campaign')
  const [startAt, setStartAt] = React.useState<Date>(() => new Date())
  const [endAt, setEndAt] = React.useState<Date>(() => addMinutes(new Date(), 60))
  const [events, setEvents] = React.useState<CalendarEvent[]>([])

  const loadEvents = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/schedule')
      if (!res.ok) return
      const data = (await res.json()) as ScheduleEventDTO[]
      setEvents(
        data.map((e) => ({
          id: e.id,
          title: e.title,
          start: new Date(e.start_at),
          end: new Date(e.end_at),
          type: parseType(e.type),
        })),
      )
    } catch {
      // ignore — keep current state
    }
  }, [])

  React.useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const toLocalInputValue = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm")

  const addEvent = async () => {
    if (!title.trim()) {
      toast.error(t('schedule.toast.enterTitle'))
      return
    }
    const start = startAt
    const end = endAt
    if (!(start instanceof Date) || isNaN(start.getTime()) || !(end instanceof Date) || isNaN(end.getTime()) || end <= start) {
      toast.error(lang === 'ar' ? 'تحقق من وقت البداية والنهاية' : 'Check start/end time')
      return
    }
    try {
      const res = await fetch('/api/admin/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          type,
          start_at: start.toISOString(),
          end_at: end.toISOString(),
        }),
      })
      if (!res.ok) throw new Error('failed')
      const created = (await res.json()) as ScheduleEventDTO
      setEvents((prev) => [
        ...prev,
        {
          id: created.id,
          title: created.title,
          start: new Date(created.start_at),
          end: new Date(created.end_at),
          type: parseType(created.type),
        },
      ])
      setTitle('')
      toast.success(t('schedule.toast.added'))
    } catch {
      toast.error(lang === 'ar' ? 'تعذّر حفظ الحدث' : 'Could not save event')
    }
  }

  const onSelectSlot = (slot: { start: Date; end: Date }) => {
    // Make selection usable without drag: fill the form with the selected range.
    setStartAt(slot.start)
    setEndAt(slot.end)
    toast.success(lang === 'ar' ? 'تم تحديد الوقت — أكمل إضافة الحدث' : 'Time selected — complete the form')
  }

  const onSelectEvent = async (event: CalendarEvent) => {
    // Click event: fill the form and allow delete via confirm.
    setTitle(String(event.title || ''))
    setType(event.type)
    setStartAt(event.start as Date)
    setEndAt(event.end as Date)
    const ok = confirm(lang === 'ar' ? 'هل تريد حذف هذا الحدث؟' : 'Delete this event?')
    if (!ok) {
      toast.success(lang === 'ar' ? 'تم تحميل الحدث للتعديل' : 'Event loaded for editing')
      return
    }
    try {
      const res = await fetch(`/api/admin/schedule/${event.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('failed')
      setEvents((prev) => prev.filter((e) => e.id !== event.id))
      toast.success(t('schedule.toast.deleted'))
    } catch {
      toast.error(lang === 'ar' ? 'تعذّر حذف الحدث' : 'Could not delete event')
    }
  }

  const messages =
    lang === 'ar'
      ? {
          allDay: 'طوال اليوم',
          previous: 'السابق',
          next: 'التالي',
          today: 'اليوم',
          month: 'شهر',
          week: 'أسبوع',
          day: 'يوم',
          agenda: 'الأجندة',
          date: 'التاريخ',
          time: 'الوقت',
          event: 'الحدث',
          noEventsInRange: 'لا توجد أحداث في هذه الفترة.',
          showMore: (total: number) => `+ ${total} المزيد`,
        }
      : undefined

  return (
    <div className="space-y-6" dir={dir}>
      <Card>
        <CardHeader>
          <CardTitle>{t('schedule.title')}</CardTitle>
          <CardDescription>{t('schedule.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-3 md:col-span-1">
            <div className="space-y-1">
              <Label>{t('schedule.quickAdd')}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('schedule.eventTitle')} />
            </div>
            <div className="grid gap-3 sm:grid-cols-1">
              <div className="space-y-1">
                <Label>{lang === 'ar' ? 'البداية' : 'Start'}</Label>
                <input
                  type="datetime-local"
                  value={toLocalInputValue(startAt)}
                  onChange={(e) => setStartAt(new Date(e.target.value))}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
              <div className="space-y-1">
                <Label>{lang === 'ar' ? 'النهاية' : 'End'}</Label>
                <input
                  type="datetime-local"
                  value={toLocalInputValue(endAt)}
                  onChange={(e) => setEndAt(new Date(e.target.value))}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t('schedule.type')}</Label>
              <select
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={type}
                onChange={(e) => setType(parseType(e.target.value))}
              >
                <option value="campaign">{t('schedule.type.campaign')}</option>
                <option value="event">{t('schedule.type.event')}</option>
                <option value="deadline">{t('schedule.type.deadline')}</option>
                <option value="meeting">{t('schedule.type.meeting')}</option>
                <option value="urgent">{t('schedule.type.urgent')}</option>
              </select>
            </div>
            <Button onClick={addEvent} className="w-full">
              {t('schedule.add')}
            </Button>
            <p className="text-xs text-muted-foreground">
              {t('schedule.tip')}
            </p>
          </div>

          <div className="md:col-span-2">
            <div className="rounded-xl border border-border bg-card p-2">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                culture={lang === 'ar' ? 'ar-SA' : 'en-US'}
                messages={messages}
                defaultView="month"
                views={['month', 'week', 'day']}
                selectable
                onSelectSlot={onSelectSlot}
                onSelectEvent={(e) => onSelectEvent(e as CalendarEvent)}
                onDrillDown={(date) => {
                  // Clicking a day in Month view: set a sensible default time window.
                  const start = new Date(date)
                  start.setHours(9, 0, 0, 0)
                  const end = addMinutes(start, 60)
                  setStartAt(start)
                  setEndAt(end)
                  toast.success(lang === 'ar' ? 'تم اختيار اليوم' : 'Day selected')
                }}
                style={{ height: 520 }}
                eventPropGetter={(e) => {
                  const ev = e as CalendarEvent
                  return {
                    style: {
                      backgroundColor: typeColor[ev.type],
                      borderRadius: 10,
                      border: 'none',
                      color: 'white',
                      paddingInline: 8,
                    },
                  }
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

