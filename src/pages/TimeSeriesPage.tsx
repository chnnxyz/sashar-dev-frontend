import { useState, useEffect } from 'react'
import { SubNavTabs } from '../components/shared/SubNavTabs'
import { Card } from '../components/shared/Card'
import { Button } from '../components/shared/Button'
import { LinePlot } from '../components/timeseries/LinePlot'
import { ModelSelector } from '../components/ml/ModelSelector'
import { HyperparameterPanel } from '../components/ml/HyperparameterPanel'
import { OptimizePanel } from '../components/ml/OptimizePanel'
import { PageWrapper } from '../components/layout/PageWrapper'
import { tsApi } from '../api/api'
import { tsHyperparams, timeSeriesData } from '../data/mockData'
import type { TSModel, HyperparameterValues, OptimizeMethod, TimeSeriesPoint } from '../types'

type TSTab = 'regression' | 'classification'

const tabDefs = [
  { value: 'regression' as TSTab, label: 'Regression' },
  { value: 'classification' as TSTab, label: 'Classification' },
]

const modelOptions = [
  { value: 'xgboost', label: 'XGBoost' },
  { value: 'croston', label: 'Croston' },
  { value: 'rnn', label: 'RNN' },
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
  const [tab, setTab] = useState<TSTab>('regression')
  const [model, setModel] = useState<TSModel>('xgboost')
  const [hyperparams, setHyperparams] = useState<HyperparameterValues>({})
  const [historical, setHistorical] = useState<TimeSeriesPoint[]>(timeSeriesData)
  const [forecast, setForecast] = useState<TimeSeriesPoint[]>([])
  const [metrics, setMetrics] = useState<Record<string, number> | null>(null)
  const [optimizeResult, setOptimizeResult] = useState<{
    best_params: Record<string, number>
    best_score: number
    n_trials: number
    duration_seconds: number
  } | null>(null)
  const [runLoading, setRunLoading] = useState(false)
  const [optimizeLoading, setOptimizeLoading] = useState(false)

  const currentDefs = tsHyperparams[model]

  useEffect(() => {
    setHyperparams(Object.fromEntries(currentDefs.map(d => [d.name, d.defaultValue])))
    setMetrics(null)
    setForecast([])
    setOptimizeResult(null)
  }, [model]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRun = async () => {
    setRunLoading(true)
    setOptimizeResult(null)
    try {
      const result = await tsApi.runForecast({ model, hyperparameters: hyperparams })
      setHistorical(result.historical)
      setForecast(result.forecast)
      setMetrics(result.metrics)
    } finally {
      setRunLoading(false)
    }
  }

  const handleOptimize = async (method: OptimizeMethod, config: Record<string, unknown>) => {
    setOptimizeLoading(true)
    setMetrics(null)
    try {
      const result = await tsApi.optimizeParams({ task: 'timeseries', model, method, config: config as never })
      setOptimizeResult(result)
    } finally {
      setOptimizeLoading(false)
    }
  }

  return (
    <PageWrapper>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-body mb-1">
          Time Series <span className="text-purple-light">Playground</span>
        </h1>
        <p className="text-sm text-text-muted">Forecast with XGBoost, Croston, and RNN models. Visualize historical data and future predictions.</p>
      </div>

      <SubNavTabs tabs={tabDefs} active={tab} onChange={setTab} />

      <div className="mt-6 grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-5">
          <Card>
            <LinePlot
              historical={historical}
              forecast={forecast}
              title={`${tab.charAt(0).toUpperCase() + tab.slice(1)} · ${model.toUpperCase()}${forecast.length > 0 ? ` — ${forecast.length}-step forecast` : ''}`}
            />
          </Card>

          {metrics && (
            <Card title="Forecast Metrics">
              <MetricsDisplay metrics={metrics} />
            </Card>
          )}

          {optimizeResult && (
            <Card title="Optimization Result">
              <div className="space-y-3">
                <div className="flex gap-4 text-sm">
                  <span className="text-text-muted">Best score: <strong className="text-purple-light">{optimizeResult.best_score.toFixed(4)}</strong></span>
                  <span className="text-text-muted">Trials: <strong className="text-text-body">{optimizeResult.n_trials}</strong></span>
                  <span className="text-text-muted">Duration: <strong className="text-text-body">{optimizeResult.duration_seconds.toFixed(1)}s</strong></span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(optimizeResult.best_params).map(([k, v]) => (
                    <div key={k} className="bg-bg-base rounded-md px-3 py-2 border border-border-subtle">
                      <p className="text-[10px] text-text-muted uppercase">{k}</p>
                      <p className="text-sm font-mono text-text-body">{v.toFixed(4)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card title="Model">
            <ModelSelector
              options={modelOptions}
              value={model}
              onChange={v => setModel(v as TSModel)}
            />
          </Card>

          <Card>
            <HyperparameterPanel
              defs={currentDefs}
              values={hyperparams}
              onChange={(k, v) => setHyperparams(prev => ({ ...prev, [k]: v }))}
            />
          </Card>

          <div className="flex flex-col gap-2">
            <Button onClick={handleRun} loading={runLoading} className="w-full">
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3 2.5l11 5.5-11 5.5V2.5z" />
              </svg>
              Run Forecast
            </Button>
            <OptimizePanel
              hyperparamDefs={currentDefs}
              onRun={handleOptimize}
              loading={optimizeLoading}
            />
          </div>

          <Card title="About the Models" className="text-xs text-text-muted leading-relaxed space-y-3">
            <div>
              <p className="text-purple-light font-semibold mb-1">XGBoost</p>
              <p>Gradient boosted trees adapted for time series via lag features and rolling statistics.</p>
            </div>
            <div>
              <p className="text-purple-light font-semibold mb-1">Croston</p>
              <p>Classic method for intermittent demand series, separately smoothing demand size and inter-occurrence intervals.</p>
            </div>
            <div>
              <p className="text-purple-light font-semibold mb-1">RNN</p>
              <p>Recurrent neural network (LSTM/GRU) that captures temporal dependencies across a sliding window of observations.</p>
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  )
}
