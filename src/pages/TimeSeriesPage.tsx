import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { SubNavTabs } from '../components/shared/SubNavTabs'
import { Card } from '../components/shared/Card'
import { Button } from '../components/shared/Button'
import { LinePlot } from '../components/timeseries/LinePlot'
import { ModelSelector } from '../components/ml/ModelSelector'
import { DatasetSelector } from '../components/ml/DatasetSelector'
import { HyperparameterPanel } from '../components/ml/HyperparameterPanel'
import { OptimizePanel } from '../components/ml/OptimizePanel'
import { CVMetricsCard } from '../components/shared/CVMetricsCard'
import { PageWrapper } from '../components/layout/PageWrapper'
import { GitHubRepoLink } from '../components/shared/GitHubRepoLink'
import { tsApi } from '../api/api'
import { tsHyperparams, timeSeriesData, DATASETS } from '../data/mockData'
import type { TSModel, HyperparameterValues, TimeSeriesPoint, CVMetrics } from '../types'

type TSTab = 'regression' | 'classification'
const tabDefs = [
  { value: 'regression' as TSTab, label: 'Regression' },
  { value: 'classification' as TSTab, label: 'Classification' },
]
const modelOptions = [
  { value: 'lightgbm', label: 'LightGBM' },
  { value: 'tes', label: 'Triple Exp. Smoothing' },
  { value: 'rnn', label: 'GRU (RNN)' },
]

function MetricsDisplay({ metrics }: { metrics: Record<string, number> }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Object.entries(metrics).map(([key, val]) => (
        <div key={key} className="bg-bg-base rounded-lg p-3 border border-border-subtle">
          <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">{key.toUpperCase()}</p>
          <p className="text-lg font-bold text-purple-light">{val.toFixed(4)}</p>
        </div>
      ))}
    </div>
  )
}

export function TimeSeriesPage() {
  const tsDatasets = DATASETS.filter(d => d.type === 'timeseries')
  const [tab, setTab] = useState<TSTab>('regression')
  const [model, setModel] = useState<TSModel>('lightgbm')
  const [dataset, setDataset] = useState(tsDatasets[0]?.id ?? '')
  const [hyperparams, setHyperparams] = useState<HyperparameterValues>({})
  const [hyperparamsValid, setHyperparamsValid] = useState(true)
  const [historical, setHistorical] = useState<TimeSeriesPoint[]>(timeSeriesData)
  const [forecast, setForecast] = useState<TimeSeriesPoint[]>([])
  const [metrics, setMetrics] = useState<Record<string, number> | null>(null)
  const [cvMetrics, setCvMetrics] = useState<CVMetrics | null>(null)
  const [runLoading, setRunLoading] = useState(false)
  const [seed, setSeed] = useState(13)

  // Right-column height measurement — chart wrapper matches this on desktop
  const rightColRef = useRef<HTMLDivElement>(null)
  const [rightColHeight, setRightColHeight] = useState<number | null>(null)
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const el = rightColRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const e = entries[0]
      if (e) setRightColHeight(e.contentRect.height)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Synchronously read right column height before paint on model change (Bug 3)
  useLayoutEffect(() => {
    const el = rightColRef.current
    if (!el) return
    const h = el.getBoundingClientRect().height
    if (h > 0) setRightColHeight(h)
  }, [model]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentDefs = tsHyperparams[model]

  useEffect(() => {
    setHyperparams(Object.fromEntries(currentDefs.map(d => [d.name, d.defaultValue])))
    setMetrics(null)
    setCvMetrics(null)
    setForecast([])
  }, [model]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRun = async () => {
    setRunLoading(true)
    try {
      const result = await tsApi.runForecast({ model, hyperparameters: hyperparams })
      setHistorical(result.historical)
      setForecast(result.forecast)
      setMetrics(result.metrics)
      setCvMetrics(result.cv)
    } finally {
      setRunLoading(false)
    }
  }

  const trainSize = Math.floor(historical.length * 0.7)

  return (
    <PageWrapper>
      <div className="mb-6">
        <div className="flex items-baseline gap-4 mb-1">
          <h1 className="text-2xl font-bold text-text-body">Time Series <span className="text-purple-light">Playground</span></h1>
          <GitHubRepoLink repo="chnnxyz/sashar-dev-ml-api" />
        </div>
        <p className="text-sm text-text-muted">Forecast with LightGBM, Triple Exponential Smoothing, and GRU models. Visualize historical data and future predictions.</p>
        <p className="text-xs text-text-muted/70 mt-1.5 font-mono">Python · FastAPI · LightGBM · statsmodels (TES) · PyTorch (GRU) · SQLite</p>
      </div>

      <SubNavTabs tabs={tabDefs} active={tab} onChange={setTab} />

      <div className="mt-6 grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          <div
            className="flex flex-col"
            style={isDesktop && rightColHeight ? { height: rightColHeight } : undefined}
          >
            <Card className={isDesktop && rightColHeight ? 'flex-1' : ''}>
              <LinePlot
                historical={historical}
                forecast={forecast}
                trainSize={trainSize}
                title={`${tab.charAt(0).toUpperCase() + tab.slice(1)} · ${model.toUpperCase()}${forecast.length > 0 ? ` — ${forecast.length}-step forecast` : ''}`}
                height={isDesktop && rightColHeight ? Math.max(280, rightColHeight - 100) : undefined}
                rmse={metrics?.rmse}
              />
            </Card>
          </div>
        </div>

        {/* Right column — self-start prevents stretching to match left column height (Bug 2) */}
        <div ref={rightColRef} className="space-y-5 self-start">
          <Card title="Dataset & Model">
            <div className="space-y-3">
              <DatasetSelector datasets={tsDatasets} value={dataset} onChange={setDataset} />
              <ModelSelector options={modelOptions} value={model} onChange={v => setModel(v as TSModel)} />
            </div>
          </Card>

          <Card>
            <HyperparameterPanel
              defs={currentDefs}
              values={hyperparams}
              onChange={(k, v) => setHyperparams(prev => ({ ...prev, [k]: v }))}
              seed={seed}
              onSeedChange={setSeed}
              onValidChange={setHyperparamsValid}
            />
          </Card>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleRun}
              loading={runLoading}
              disabled={!hyperparamsValid}
              title={!hyperparamsValid ? 'Fix hyperparameter values before running' : undefined}
              className="w-full"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M3 2.5l11 5.5-11 5.5V2.5z" /></svg>
              Run Forecast
            </Button>
            <OptimizePanel hyperparamDefs={currentDefs} onApply={params => setHyperparams(params)} />
          </div>
        </div>
      </div>

      {metrics && (
        <Card title="Forecast Metrics" className="mt-5">
          <MetricsDisplay metrics={metrics} />
        </Card>
      )}

      {cvMetrics && (
        <Card title="Training / Evaluation" className="mt-5">
          <CVMetricsCard cv={cvMetrics} />
        </Card>
      )}

      {/* About the Models — outside grid */}
      <div className="mt-6">
        <Card title="About the Models" className="text-xs text-text-muted leading-relaxed">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <p className="text-purple-light font-semibold mb-1">LightGBM</p>
              <p>Gradient boosted trees adapted for time series via lag features and rolling window statistics. Efficient on large datasets with strong baseline accuracy.</p>
            </div>
            <div>
              <p className="text-purple-light font-semibold mb-1">Triple Exp. Smoothing</p>
              <p>Holt-Winters method that models level, trend, and seasonality with separate smoothing parameters. Interpretable and effective for seasonal time series.</p>
            </div>
            <div>
              <p className="text-purple-light font-semibold mb-1">GRU (RNN)</p>
              <p>Gated Recurrent Unit network (PyTorch) that captures long-range temporal dependencies across a sliding input window.</p>
            </div>
          </div>
        </Card>
      </div>
    </PageWrapper>
  )
}
