import { useState } from 'react'
import { Button } from '../shared/Button'
import { NumberInput } from '../shared/NumberInput'
import { SubNavTabs } from '../shared/SubNavTabs'
import type { OptimizeMethod, HyperparameterDef } from '../../types'

interface SearchBound {
  min: number
  max: number
  step: number
  low: number
  high: number
}

interface OptimizePanelProps {
  hyperparamDefs: HyperparameterDef[]
  onRun: (method: OptimizeMethod, config: Record<string, unknown>) => void
  loading?: boolean
}

const methodTabs = [
  { value: 'gridsearch' as OptimizeMethod, label: 'Grid Search' },
  { value: 'tpe' as OptimizeMethod, label: 'Tree Parzen (TPE)' },
  { value: 'genetic' as OptimizeMethod, label: 'Genetic' },
]

export function OptimizePanel({ hyperparamDefs, onRun, loading = false }: OptimizePanelProps) {
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState<OptimizeMethod>('gridsearch')
  const [nTrials, setNTrials] = useState(100)
  const [nStartup, setNStartup] = useState(10)
  const [popSize, setPopSize] = useState(50)
  const [nGenerations, setNGenerations] = useState(20)
  const [mutationRate, setMutationRate] = useState(0.1)
  const [crossoverRate, setCrossoverRate] = useState(0.7)

  const defaultBound = (def: HyperparameterDef): SearchBound => ({
    min: def.min ?? 0,
    max: def.max ?? def.defaultValue * 3,
    step: def.step ?? 0.1,
    low: def.min ?? 0,
    high: def.max ?? def.defaultValue * 3,
  })

  const [bounds, setBounds] = useState<Record<string, SearchBound>>(
    () => Object.fromEntries(hyperparamDefs.map(d => [d.name, defaultBound(d)])),
  )

  const updateBound = (name: string, key: keyof SearchBound, val: number) =>
    setBounds(prev => ({ ...prev, [name]: { ...prev[name]!, [key]: val } }))

  const handleRun = () => {
    const config =
      method === 'gridsearch'
        ? { bounds: hyperparamDefs.map(d => ({ param: d.name, min: bounds[d.name]!.min, max: bounds[d.name]!.max, step: bounds[d.name]!.step })) }
        : method === 'tpe'
          ? { n_trials: nTrials, n_startup_trials: nStartup, bounds: hyperparamDefs.map(d => ({ param: d.name, low: bounds[d.name]!.low, high: bounds[d.name]!.high })) }
          : { population_size: popSize, n_generations: nGenerations, mutation_rate: mutationRate, crossover_rate: crossoverRate }
    onRun(method, config)
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} size="sm">
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M2 4h12M4 8h8M6 12h4" strokeLinecap="round" />
        </svg>
        Optimize Parameters
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="bg-bg-card border border-border-subtle rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle sticky top-0 bg-bg-card z-10">
              <h3 className="font-semibold text-text-body">Optimize Parameters</h3>
              <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-body transition-colors cursor-pointer">
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs text-text-muted font-medium uppercase tracking-wide mb-3">Search Method</p>
                <SubNavTabs tabs={methodTabs} active={method} onChange={setMethod} />
              </div>

              {method === 'tpe' && (
                <div className="grid grid-cols-2 gap-3">
                  <NumberInput label="N Trials" value={nTrials} onChange={setNTrials} min={1} step={10} />
                  <NumberInput label="N Startup Trials" value={nStartup} onChange={setNStartup} min={1} step={5} />
                </div>
              )}

              {method === 'genetic' && (
                <div className="grid grid-cols-2 gap-3">
                  <NumberInput label="Population Size" value={popSize} onChange={setPopSize} min={4} step={4} />
                  <NumberInput label="N Generations" value={nGenerations} onChange={setNGenerations} min={1} step={5} />
                  <NumberInput label="Mutation Rate" value={mutationRate} onChange={setMutationRate} min={0} max={1} step={0.01} />
                  <NumberInput label="Crossover Rate" value={crossoverRate} onChange={setCrossoverRate} min={0} max={1} step={0.01} />
                </div>
              )}

              <div>
                <p className="text-xs text-text-muted font-medium uppercase tracking-wide mb-3">
                  {method === 'gridsearch' ? 'Search Grid (min / max / step)' : method === 'tpe' ? 'Search Bounds (low / high)' : 'Parameter Bounds'}
                </p>
                <div className="space-y-3">
                  {hyperparamDefs.map(def => (
                    <div key={def.name} className="bg-bg-base rounded-lg p-3">
                      <p className="text-xs text-purple-light font-medium mb-2">{def.label}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {method === 'gridsearch' ? (
                          <>
                            <NumberInput label="Min" value={bounds[def.name]?.min ?? 0} onChange={v => updateBound(def.name, 'min', v)} step={def.step} />
                            <NumberInput label="Max" value={bounds[def.name]?.max ?? 10} onChange={v => updateBound(def.name, 'max', v)} step={def.step} />
                            <NumberInput label="Step" value={bounds[def.name]?.step ?? 0.1} onChange={v => updateBound(def.name, 'step', v)} min={0.0001} step={def.step} />
                          </>
                        ) : (
                          <>
                            <NumberInput label="Low" value={bounds[def.name]?.low ?? 0} onChange={v => updateBound(def.name, 'low', v)} step={def.step} />
                            <NumberInput label="High" value={bounds[def.name]?.high ?? 10} onChange={v => updateBound(def.name, 'high', v)} step={def.step} />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button loading={loading} onClick={handleRun}>Run Optimization</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
