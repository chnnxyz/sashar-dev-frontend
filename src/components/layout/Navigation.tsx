import { NavLink, Link } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'About' },
  { path: '/cv', label: 'CV' },
  { path: '/ml', label: 'ML Playground' },
  { path: '/llms', label: 'LLMs' },
  { path: '/backend', label: 'Backend' },
]

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-base/80 backdrop-blur-md border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-6 h-11 flex items-center justify-between">
        <Link
          to="/"
          className="text-glow-hover font-mono text-sm text-purple-light font-semibold tracking-tight transition-colors duration-200 hover:text-purple"
        >
          sashar<span className="text-text-muted">.dev</span>
        </Link>

        <ul className="flex items-center gap-1.5">
          {navItems.map(item => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  [
                    'nav-brackets px-2.5 py-1 text-sm font-medium transition-colors duration-150',
                    isActive ? 'is-active text-purple-light' : 'text-text-muted hover:text-text-body',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
