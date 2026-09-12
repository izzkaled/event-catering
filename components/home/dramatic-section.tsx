'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/components/language-provider'

type DramaVariant = 'rise' | 'from-start' | 'from-end' | 'zoom' | 'fade'

type FocusEntry = { id: string; score: number }

type StoryFocusApi = {
  report: (id: string, score: number) => void
  unregister: (id: string) => void
  activeId: string | null
}

const StoryFocusContext = createContext<StoryFocusApi | null>(null)

/** Wrap Custom → Trust so exactly one section is sharp at a time. */
export function StoryFocusProvider({ children }: { children: ReactNode }) {
  const scores = useRef(new Map<string, number>())
  const [activeId, setActiveId] = useState<string | null>(null)
  const raf = useRef(0)

  const flush = useCallback(() => {
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      let best: FocusEntry | null = null
      for (const [id, score] of scores.current) {
        if (!best || score > best.score) best = { id, score }
      }
      // Require a minimum presence so nothing is “active” if all far away
      const next = best && best.score > 0.18 ? best.id : best?.id ?? null
      setActiveId((prev) => (prev === next ? prev : next))
    })
  }, [])

  const report = useCallback(
    (id: string, score: number) => {
      scores.current.set(id, score)
      flush()
    },
    [flush],
  )

  const unregister = useCallback(
    (id: string) => {
      scores.current.delete(id)
      flush()
    },
    [flush],
  )

  const api = useMemo(
    () => ({ report, unregister, activeId }),
    [report, unregister, activeId],
  )

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  return <StoryFocusContext.Provider value={api}>{children}</StoryFocusContext.Provider>
}

type DramaticSectionProps = {
  children: ReactNode
  className?: string
  innerClassName?: string
  variant?: DramaVariant
  as?: ElementType
  id: string
  style?: CSSProperties
}

/**
 * Active section (closest to viewport center) = fully clear.
 * Others = soft dim only — never unreadable fog on the focused one.
 */
export function DramaticSection({
  children,
  className,
  innerClassName,
  variant = 'rise',
  as: Tag = 'section',
  id,
  style,
}: DramaticSectionProps) {
  const { dir } = useLanguage()
  const ctx = useContext(StoryFocusContext)
  const ref = useRef<HTMLElement | null>(null)
  const [score, setScore] = useState(0)
  const [side, setSide] = useState<'below' | 'center' | 'above'>('below')

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setScore(1)
      setSide('center')
      ctx?.report(id, 1)
      return () => ctx?.unregister(id)
    }

    let raf = 0
    const update = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect()
        const vh = window.innerHeight || 1
        const center = rect.top + rect.height * 0.45
        const target = vh * 0.45
        const delta = center - target
        const abs = Math.abs(delta)
        const nextScore = Math.max(0, Math.min(1, 1 - abs / (vh * 0.7)))
        const nextSide: 'below' | 'center' | 'above' =
          abs < vh * 0.14 ? 'center' : delta > 0 ? 'below' : 'above'
        setScore(nextScore)
        setSide(nextSide)
        ctx?.report(id, nextScore)
      })
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      ctx?.unregister(id)
    }
  }, [ctx, id])

  const active = ctx ? ctx.activeId === id : score > 0.5
  const rtl = dir === 'rtl'

  // Winner: crystal clear. Losers: readable dim, light drift, almost no blur.
  const opacity = active ? 1 : 0.38
  const blur = active ? 0 : 1.25
  const driftY = active ? 0 : side === 'below' ? 28 : side === 'above' ? -28 : 0
  let driftX = 0
  if (!active) {
    if (variant === 'from-start') driftX = rtl ? 22 : -22
    if (variant === 'from-end') driftX = rtl ? -22 : 22
  }
  const scale = active ? 1 : variant === 'zoom' ? 0.97 : 0.99

  return (
    <Tag
      ref={ref as never}
      id={id}
      style={style}
      className={cn('scroll-mt-20', className)}
      data-drama-active={active ? 'true' : 'false'}
      data-drama-variant={variant}
    >
      <div
        className={cn(
          'site-container w-full drama-panel drama-live',
          active && 'drama-focused',
          `drama-${variant}`,
          innerClassName,
        )}
        style={{
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : 'none',
          transform: `translate3d(${driftX}px, ${driftY}px, 0) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </Tag>
  )
}

type StaggerProps = {
  children: ReactNode
  className?: string
  stepMs?: number
}

export function DramaStagger({ children, className, stepMs = 90 }: StaggerProps) {
  return (
    <div className={cn('drama-stagger', className)}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div
              key={i}
              className="drama-stagger-item"
              style={{ ['--drama-i' as string]: String(i), ['--drama-step' as string]: `${stepMs}ms` }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  )
}
