import { useState, useRef, useEffect } from 'react'
import { Button } from '../shared/Button'
import { NumberInput } from '../shared/NumberInput'
import { SubNavTabs } from '../shared/SubNavTabs'
import { OptimizationProgress } from '../shared/OptimizationProgress'
import { simulateOptimizationStream } from '../../data/mockData'
import type { OptimizeMethod, HyperparameterDef, HyperparameterValues, OptimizationIteration } from '../../types'

type Phase = 'config' | 'running' | 'complete'

interface SearchBound {
  min: number; max: number; step: number; low: number; high: number
}

interface OptimizePanelProps {
  hyperparamDefs: HyperparameterDef[]
  onApply: (params: HyperparameterValues) => void
}

const methodTabs = [
  { value: 'gridsearch' as OptimizeMethod, label: 'Grid Search' },
  { value: 'tpe' as OptimizeMethod, label: 'Tree Parzen (TPE)' },
  { value: 'genetic' as OptimizeMethod, label: 'Genetic' },
]

function defaultBound(def: HyperparameterDef): SearchBound {
  return {
    min: def.min ?? 0,
    max: def.max ?? def.defaultValue * 3,
    step: def.step ?? 0.1,
    low: def.min ?? 0,
    high: def.max ?? def.defaultValue * 3,
  }
}

export function OptimizePanel({ hyperparamDefs, onApply }: OptimizePanelProps) {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>('config')
  const [method, setMethod] = useState<OptimizeMethod>('gridsearch')
  const [nTrials, setNTrials] = useState(50)
  const [nStartup, setNStartup] = useState(10)
  const [popSize, setPopSize] = useState(50)
  const [nGenerations, setNGenerations] = useState(20)
  const [mutationRate, setMutationRate] = useState(0.1)
  const [crossoverRate, setCrossoverRate] = useState(0.7)
  const [iterations, setIterations] = useState<OptimizationIteration[]>([])
  const [streaming, setStreaming] = useState(false)
  const streamCleanup = useRef<(() => void) | null>(null)

  const [bounds, setBounds] = useState<Record<string, SearchBound>>(
    () => Object.fromEntries(hyperparamDefs.map(d => [d.name, defaultBound(d)])),
  )

  useEffect(() => {
    streamCleanup.current?.()
    streamCleanup.current = null
    setPhase('config')
    setIterations([])
    setStreaming(false)
    setBounds(Object.fromEntries(hyperparamDefs.map(d => [d.name, defaultBound(d)])))
  }, [hyperparamDefs]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { streamCleanup.current?.() }, [])

  const updateBound = (name: string, key: keyof SearchBound, val: number) =>
    setBounds(prev => ({ ...prev, [name]: { ...prev[name]!, [key]: val } }))

  const handleRun = () => {
    streamCleanup.current?.()
    setIterations([])
    setPhase('running')
    setStreaming(true)

    const n = method === 'tpe' ? Math.min(nTrials, 55)
      : method === 'genetic' ? Math.min(nGenerations * 2, 55)
      : 40

    streamCleanup.current = simulateOptimizationStream(
      hyperparamDefs, n,
      iter => setIterations(prev => [...prev, iter]),
      () => { setStreaming(false); setPhase('complete') },
    )
  }

  const handleClose = () => {
    streamCleanup.current?.()
    streamCleanup.current = null
    setOpen(false)
    setPhase('config')
    setIterations([])
    setStreaming(false)
  }

  const handleApply = () => {
    const best = iterations.reduce((a, b) => a.rmse < b.rmse ? a : b)
    onApply(best.params)
    handleClose()
  }

  const best = iterations.length > 0 ? iterations.reduce((a, b) => a.rmse < b.rmse ? a : b) : null

  const searchSpaceSummary = hyperparamDefs.map(d => {
    const b = bounds[d.name] ?? defaultBound(d)
    if (method === 'gridsearch') return { label: d.label, range: `${b.min}–${b.max} / ${b.step}` }
    if (method === 'tpe') return { label: d.label, range: `[${b.low}, ${b.high}]` }
    return { label: d.label, range: `[${b.min}, ${b.max}]` }
  })

  const methodLabel = method === 'gridsearch' ? 'Grid Search' : method === 'tpe' ? 'Tree Parzen (TPE)' : 'Genetic Algorithm'

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} size="sm">
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M2 4h12M4 8h8M6 12h4" strokeLinecap="round" />
        </svg>
        Optimize Hyperparameters
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={handleClose}>
          <div
            className="bg-bg-card border border-border-subtle rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header — always visible */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle flex-shrink-0">
              <h3 className="font-semibold text-text-body">Optimize Hyperparameters</h3>
              <button onClick={handleClose} className="text-text-muted hover:text-text-body transition-colors cursor-pointer">
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Method tabs — always visible */}
            <div className="px-5 pt-4 pb-3 border-b border-border-subtle flex-shrink-0">
              {phase === 'config'
                ? <SubNavTabs tabs={methodTabs} active={method} onChange={setMethod} />
                : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted uppercase tracking-wide font-medium">Method</span>
                    <span className="text-xs font-semibold text-purple-light">{methodLabel}</span>
                  </div>
                )}
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {phase === 'config' && (
                <>
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
                </>
              )}

              {(phase === 'running' || phase === 'complete') && (
                <>
                  <div className="bg-bg-base rounded-lg p-3">
                    <p className="text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-2">Search Space</p>
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                      {searchSpaceSummary.map(s => (
                        <div key={s.label} className="flex items-center gap-1.5 text-xs">
                          <span className="text-purple-light font-medium">{s.label}</span>
                          <span className="text-text-muted font-mono">{s.range}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <OptimizationProgress iterations={iterations} streaming={streaming} method={method} />

                  {phase === 'complete' && best && (
                    <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-lg p-3">
                      <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-widest mb-2">
                        Best Parameters — RMSE {best.rmse.toFixed(4)}
                      </p>
                      <div className="flex flex-wrap gap-x-5 gap-y-1">
                        {Object.entries(best.params).map(([k, v]) => (
                          <span key={k} className="text-xs">
                            <span className="text-text-muted">{k}: </span>
                            <span className="text-text-body font-mono">{v.toFixed(4)}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer — always visible */}
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-border-subtle flex-shrink-0">
              <Button variant="ghost" onClick={handleClose}>{phase === 'complete' ? 'Close' : 'Cancel'}</Button>
              {phase === 'config' && <Button onClick={handleRun}>Run Optimization →</Button>}
              {phase === 'complete' && <Button onClick={handleApply}>Apply Best Params</Button>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
