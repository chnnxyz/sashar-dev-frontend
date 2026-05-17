import { useEffect } from 'react'
import { NumberInput } from '../shared/NumberInput'
import type { HyperparameterDef, HyperparameterValues } from '../../types'

interface HyperparameterPanelProps {
  defs: HyperparameterDef[]
  values: HyperparameterValues
  onChange: (key: string, value: number) => void
  seed: number
  onSeedChange: (v: number) => void
  onValidChange?: (valid: boolean) => void
}

function isInvalid(def: HyperparameterDef, val: number): boolean {
  return (def.min !== undefined && val < def.min) || (def.max !== undefined && val > def.max)
}

export function HyperparameterPanel({ defs, values, onChange, seed, onSeedChange, onValidChange }: HyperparameterPanelProps) {
  useEffect(() => {
    const valid = defs.every(d => !isInvalid(d, values[d.name] ?? d.defaultValue))
    onValidChange?.(valid)
  }, [defs, values]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Hyperparameters</p>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-text-muted font-semibold uppercase tracking-widest">Seed</span>
          <input
            type="number"
            value={seed}
            onChange={e => onSeedChange(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            className="w-14 bg-bg-base/80 border border-border-subtle rounded-lg px-2 py-1 text-xs text-text-body font-mono focus:outline-none focus:border-purple/60 focus:ring-1 focus:ring-purple/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }}
          />
          <button
            onClick={() => onSeedChange(Math.floor(Math.random() * 999) + 1)}
            title="Random seed"
            className="p-1 rounded text-text-muted hover:text-purple-light transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M1 8A7 7 0 1 1 8 15" strokeLinecap="round"/>
              <path d="M1 8V4M1 8H5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {defs.map(def => (
          <NumberInput
            key={def.name}
            label={def.label}
            value={values[def.name] ?? def.defaultValue}
            onChange={v => onChange(def.name, v)}
            min={def.min}
            max={def.max}
            step={def.step}
            invalid={isInvalid(def, values[def.name] ?? def.defaultValue)}
          />
        ))}
      </div>
    </div>
  )
}
