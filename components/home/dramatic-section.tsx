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

type DramaVariant = 'rise' | 'from-start' | 'from-end' | 'zoom' | 'fade'

type DramaticSectionProps = {
  children: ReactNode
  className?: string
  innerClassName?: string
  variant?: DramaVariant
  /** Larger stage so the viewer feels “standing still” while content arrives */
  stage?: boolean
  as?: ElementType
  id?: string
  style?: CSSProperties
}

/**
 * Scroll stage: content enters dramatically when it hits the viewport,
 * holds while centered, then exits as you scroll past.
 */
export function DramaticSection({
  children,
  className,
  innerClassName,
  variant = 'rise',
  stage = true,
  as: Tag = 'section',
  id,
  style,
}: DramaticSectionProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [phase, setPhase] = useState<'wait' | 'in' | 'out'>('wait')

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setPhase('in')
      return
    }

    const update = () => {
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight || 1
      const mid = rect.top + rect.height * 0.35

      if (mid < vh * 0.08) {
        setPhase('out')
      } else if (rect.top < vh * 0.88 && rect.bottom > vh * 0.12) {
        setPhase('in')
      } else if (rect.top >= vh * 0.88) {
        setPhase('wait')
      } else {
        setPhase('out')
      }
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <Tag
      ref={ref as never}
      id={id}
      style={style}
      className={cn(
        'scroll-mt-20 border-t border-border/70',
        stage && 'flex min-h-[min(88vh,920px)] items-center py-16 sm:py-20',
        !stage && 'py-16 sm:py-20',
        className,
      )}
      data-drama={phase}
      data-drama-variant={variant}
    >
      <div
        className={cn(
          'site-container w-full drama-panel',
          phase === 'wait' && 'drama-wait',
          phase === 'in' && 'drama-in',
          phase === 'out' && 'drama-out',
          `drama-${variant}`,
          innerClassName,
        )}
      >
        {children}
      </div>
    </Tag>
  )
}

type StaggerProps = {
  children: ReactNode
  className?: string
  /** Stagger delay step in ms */
  stepMs?: number
}

/** Children fade/slide in one after another when parent section is in view */
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
