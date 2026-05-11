import { NavLink, Link } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'About' },
  { path: '/cv', label: 'CV' },
  { path: '/ml', label: 'ML Playground' },
  { path: '/timeseries', label: 'Time Series' },
  { path: '/backend', label: 'Backend' },
]

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-base/80 backdrop-blur-md border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          to="/"
          className="text-purple-light font-semibold tracking-tight transition-all duration-200 hover:text-purple"
          style={{ textShadow: 'none' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textShadow = '0 0 12px rgba(139,92,246,0.8), 0 0 28px rgba(109,40,217,0.5)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textShadow = 'none' }}
        >
          sashar<span className="text-text-muted">.dev</span>
        </Link>

        <ul className="flex items-center gap-0.5">
          {navItems.map(item => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  [
                    'px-4 py-2 text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'text-purple-light'
                      : 'text-text-muted hover:text-text-body',
                  ].join(' ')
                }
                style={({ isActive }) =>
                  isActive
                    ? { textShadow: '0 0 10px rgba(167,139,250,0.6)' }
                    : {}
                }
              >
                {({ isActive: _isActive }) => item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
