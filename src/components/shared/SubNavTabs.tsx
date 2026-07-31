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
      className="flex gap-1 p-1 rounded-sm w-fit bg-bg-card border border-border-subtle"
      style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.35)' }}
    >
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={[
            'px-4 py-2 rounded-sm text-sm font-medium transition-colors duration-150 cursor-pointer',
            active === tab.value
              ? 'bg-purple text-white'
              : 'text-text-muted hover:text-text-body hover:bg-white/5',
          ].join(' ')}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
