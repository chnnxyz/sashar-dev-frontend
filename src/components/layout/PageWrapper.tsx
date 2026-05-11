import { type ReactNode } from 'react'

interface PageWrapperProps {
  children: ReactNode
  className?: string
}

export function PageWrapper({ children, className = '' }: PageWrapperProps) {
  return (
    <main className={['max-w-7xl mx-auto px-6 pt-20 pb-16', className].join(' ')}>
      {children}
    </main>
  )
}
