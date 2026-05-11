import { type InputHTMLAttributes } from 'react'

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label: string
  value: number
  onChange: (value: number) => void
}

export function NumberInput({ label, value, onChange, className = '', ...props }: NumberInputProps) {
  return (
    <label className={['flex flex-col gap-1.5', className].join(' ')}>
      <span className="text-[10px] text-text-muted font-semibold uppercase tracking-widest leading-tight min-h-[2.5em] flex items-end">{label}</span>
      <input
        type="number"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-bg-base/80 border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-body placeholder-text-muted focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/30 transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }}
        {...props}
      />
    </label>
  )
}
