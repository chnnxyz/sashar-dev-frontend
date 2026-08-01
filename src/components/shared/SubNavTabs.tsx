import { useEffect, useRef, useState } from 'react'
import { focusRing } from './focusRing'

interface Tab<T extends string> {
  value: T
  label: string
}

interface SubNavTabsProps<T extends string> {
  tabs: Tab<T>[]
  active: T
  onChange: (value: T) => void
}

export function SubNavTabs<T extends string>({ tabs, active, onChange }: SubNavTabsProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 2)
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', update); ro.disconnect() }
  }, [tabs])

  return (
    <div className="relative w-fit max-w-full">
      <div
        ref={scrollRef}
        className="flex gap-1 p-1 rounded-sm overflow-x-auto bg-bg-card border border-border-subtle"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}
      >
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={[
              'shrink-0 px-4 py-2 rounded-sm text-sm font-medium transition-colors duration-150 cursor-pointer',
              active === tab.value
                ? 'bg-purple text-white'
                : 'text-text-muted hover:text-text-body hover:bg-white/5',
              focusRing,
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Edge scroll cues — only shown when there's actually more to scroll to, so a tray
          that already fits (e.g. Backend's 2 tabs) never shows a misleading hint. A plain
          color fade reads as near-invisible against this palette's low ambient contrast,
          so a small chevron carries the actual signal; the fade just softens its edge. */}
      {canScrollLeft && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 flex items-center justify-start bg-gradient-to-r from-bg-card to-transparent rounded-l-sm">
          <svg className="w-3 h-3 text-purple-light" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M10 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      {canScrollRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 flex items-center justify-end bg-gradient-to-l from-bg-card to-transparent rounded-r-sm">
          <svg className="w-3 h-3 text-purple-light" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  )
}
