import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  innerClassName?: string
  title?: string
  actions?: ReactNode
  /** Suppress the hover-lift for purely static/container cards */
  static?: boolean
}

export function Card({ children, className = '', innerClassName = '', title, actions, static: isStatic = false }: CardProps) {
  return (
    <div className={['card', isStatic ? 'hover:transform-none hover:shadow-none' : '', className].join(' ').trim()}>
      {(title || actions) && (
        <>
          <div className="flex items-center justify-between px-5 py-4">
            {title && (
              <h3 className="font-semibold text-text-body text-sm tracking-wide">{title}</h3>
            )}
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
          {/* gradient separator */}
          <div className="h-px mx-0 bg-gradient-to-r from-purple/25 via-border-subtle/60 to-transparent" />
        </>
      )}
      <div className={['p-5', innerClassName].join(' ').trim()}>{children}</div>
    </div>
  )
}
