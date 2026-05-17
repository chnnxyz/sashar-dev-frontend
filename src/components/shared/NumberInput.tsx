import { useState, useEffect, useRef, type ChangeEvent, type FocusEvent, type InputHTMLAttributes } from 'react'

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  label: string
  value: number
  onChange: (value: number) => void
  invalid?: boolean
}

export function NumberInput({ label, value, onChange, invalid, className = '', ...props }: NumberInputProps) {
  const [displayValue, setDisplayValue] = useState(String(value))
  const isFocused = useRef(false)

  useEffect(() => {
    if (!isFocused.current) setDisplayValue(String(value))
  }, [value])

  const handleFocus = () => { isFocused.current = true }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value)
    const n = parseFloat(e.target.value)
    if (!isNaN(n)) onChange(n)
  }

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    isFocused.current = false
    const n = parseFloat(e.target.value)
    const final = isNaN(n) ? value : n
    setDisplayValue(String(final))
    onChange(final)
  }

  const borderClass = invalid
    ? 'border-rose-500/50 focus:border-rose-500/70 focus:ring-1 focus:ring-rose-500/20'
    : 'border-border-subtle focus:border-purple focus:ring-1 focus:ring-purple/30'

  return (
    <label className={['flex flex-col gap-1.5', className].join(' ')}>
      <span className="text-[10px] text-text-muted font-semibold uppercase tracking-widest leading-tight min-h-[2.5em] flex items-end break-words">{label}</span>
      <input
        type="number"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={[
          'w-full bg-bg-base/80 rounded-lg px-3 py-2 text-sm text-text-body placeholder-text-muted',
          'border focus:outline-none transition-all duration-150',
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
          borderClass,
        ].join(' ')}
        style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }}
        {...props}
      />
    </label>
  )
}
