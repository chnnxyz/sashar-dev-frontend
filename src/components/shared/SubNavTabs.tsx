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
  return (
    <div
      className="flex gap-1 p-1 rounded-xl w-fit"
      style={{
        background:
          'linear-gradient(155deg, #222229 0%, #18181e 100%) padding-box, linear-gradient(155deg, rgba(139,92,246,0.22) 0%, rgba(45,45,53,0.5) 100%) border-box',
        border: '1px solid transparent',
        boxShadow: '0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer',
            active === tab.value
              ? 'bg-purple text-white'
              : 'text-text-muted hover:text-text-body hover:bg-white/5',
          ].join(' ')}
          style={
            active === tab.value
              ? { boxShadow: '0 0 16px rgba(139,92,246,0.45), 0 2px 8px rgba(0,0,0,0.3)' }
              : {}
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
