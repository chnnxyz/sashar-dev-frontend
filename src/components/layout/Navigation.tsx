import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { focusRing } from '../shared/focusRing'

const navItems = [
  { path: '/', label: 'About' },
  { path: '/cv', label: 'CV' },
  { path: '/ml', label: 'ML Playground' },
  { path: '/llms', label: 'LLMs' },
  { path: '/backend', label: 'Backend' },
]

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'nav-brackets px-2.5 py-1 text-sm font-medium transition-colors duration-150',
      isActive ? 'is-active text-purple-light' : 'text-text-muted hover:text-text-body',
      focusRing,
    ].join(' ')

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-base/80 backdrop-blur-md border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-6 h-11 flex items-center justify-between">
        <Link
          to="/"
          className={['text-glow-hover font-mono text-sm text-purple-light font-semibold tracking-tight transition-colors duration-200 hover:text-purple', focusRing].join(' ')}
        >
          sashar<span className="text-text-muted">.dev</span>
        </Link>

        <ul className="hidden sm:flex items-center gap-1.5">
          {navItems.map(item => (
            <li key={item.path}>
              <NavLink to={item.path} end={item.path === '/'} className={linkClass}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setMobileOpen(v => !v)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className={['sm:hidden p-1.5 text-text-muted hover:text-purple-light transition-colors duration-150 cursor-pointer', focusRing].join(' ')}
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            {mobileOpen ? (
              <>
                <rect x="7.3" y="1" width="1.4" height="14" transform="rotate(45 8 8)" />
                <rect x="7.3" y="1" width="1.4" height="14" transform="rotate(-45 8 8)" />
              </>
            ) : (
              <>
                <rect x="2" y="4" width="12" height="1.4" />
                <rect x="2" y="7.3" width="12" height="1.4" />
                <rect x="2" y="10.6" width="12" height="1.4" />
              </>
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <ul className="sm:hidden flex flex-col border-t border-border-subtle bg-bg-base/95 backdrop-blur-md px-6 py-2">
          {navItems.map(item => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={['block w-full py-2.5', focusRing].join(' ')}
                onClick={() => setMobileOpen(false)}
              >
                {({ isActive }) => <span className={linkClass({ isActive })}>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}
