'use client'

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/components/language-provider'

type DramaVariant = 'rise' | 'from-start' | 'from-end' | 'zoom' | 'fade'

type DramaticSectionProps = {
  children: ReactNode
  className?: string
  innerClassName?: string
  variant?: DramaVariant
  as?: ElementType
  id?: string
  style?: CSSProperties
}

/**
 * Focus one section at a time while scrolling down or up.
 * Centered section is sharp; others fade / drift away so attention stays locked.
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
  const ref = useRef<HTMLElement | null>(null)
  const [focus, setFocus] = useState(0)
  const [side, setSide] = useState<'below' | 'center' | 'above'>('below')

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setFocus(1)
      setSide('center')
      return
    }

    let raf = 0
    const update = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect()
        const vh = window.innerHeight || 1
        const center = rect.top + rect.height * 0.42
        const target = vh * 0.42
        const delta = center - target
        const abs = Math.abs(delta)
        // Full focus near viewport center; fades as it leaves
        const nextFocus = Math.max(0, Math.min(1, 1 - abs / (vh * 0.62)))
        const nextSide: 'below' | 'center' | 'above' =
          abs < vh * 0.12 ? 'center' : delta > 0 ? 'below' : 'above'

        setFocus(nextFocus)
        setSide(nextSide)
      })
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const rtl = dir === 'rtl'
  const driftY =
    side === 'below' ? (1 - focus) * 48 : side === 'above' ? (1 - focus) * -48 : 0
  let driftX = 0
  if (variant === 'from-start') driftX = (1 - focus) * (rtl ? 36 : -36)
  if (variant === 'from-end') driftX = (1 - focus) * (rtl ? -36 : 36)
  const scale = variant === 'zoom' ? 0.94 + focus * 0.06 : 0.985 + focus * 0.015

  return (
    <Tag
      ref={ref as never}
      id={id}
      style={style}
      className={cn('scroll-mt-20', className)}
      data-drama-side={side}
      data-drama-variant={variant}
    >
      <div
        className={cn(
          'site-container w-full drama-panel drama-live',
          focus > 0.45 && 'drama-focused',
          `drama-${variant}`,
          innerClassName,
        )}
        style={{
          opacity: 0.12 + focus * 0.88,
          filter: `blur(${((1 - focus) * 5).toFixed(2)}px)`,
          transform: `translate3d(${driftX.toFixed(1)}px, ${driftY.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`,
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
