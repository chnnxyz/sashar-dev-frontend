import { NumberInput } from '../shared/NumberInput'
import type { HyperparameterDef, HyperparameterValues } from '../../types'

interface HyperparameterPanelProps {
  defs: HyperparameterDef[]
  values: HyperparameterValues
  onChange: (key: string, value: number) => void
}

export function HyperparameterPanel({ defs, values, onChange }: HyperparameterPanelProps) {
  return (
    <div>
      <p className="text-xs text-text-muted font-medium uppercase tracking-wide mb-3">Hyperparameters</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {defs.map(def => (
          <NumberInput
            key={def.name}
            label={def.label}
            value={values[def.name] ?? def.defaultValue}
            onChange={v => onChange(def.name, v)}
            min={def.min}
            max={def.max}
            step={def.step}
          />
        ))}
      </div>
    </div>
  )
}
