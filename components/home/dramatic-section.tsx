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
  as?: ElementType
  id?: string
  style?: CSSProperties
}

/**
 * Light scroll reveal — enters when visible. No sticky / no full-viewport hijack.
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
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setVisible(true)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true)
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref as never}
      id={id}
      style={style}
      className={cn('scroll-mt-20', className)}
      data-drama={visible ? 'in' : 'wait'}
      data-drama-variant={variant}
    >
      <div
        className={cn(
          'site-container w-full drama-panel',
          visible ? 'drama-in' : 'drama-wait',
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
