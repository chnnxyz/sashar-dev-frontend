interface ModelOption {
  value: string
  label: string
}

interface ModelSelectorProps {
  options: ModelOption[]
  value: string
  onChange: (value: string) => void
  label?: string
}

export function ModelSelector({ options, value, onChange, label = 'Model' }: ModelSelectorProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] text-text-muted font-semibold uppercase tracking-widest">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none bg-bg-base/80 border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-body focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/30 transition-all duration-150 cursor-pointer pr-8"
          style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-bg-card">
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted"
          viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </label>
  )
}
