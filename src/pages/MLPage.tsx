import { useState, useEffect } from 'react'
import { SubNavTabs } from '../components/shared/SubNavTabs'
import { Card } from '../components/shared/Card'
import { Button } from '../components/shared/Button'
import { ScatterPlot } from '../components/ml/ScatterPlot'
import { ModelSelector } from '../components/ml/ModelSelector'
import { HyperparameterPanel } from '../components/ml/HyperparameterPanel'
import { OptimizePanel } from '../components/ml/OptimizePanel'
import { PageWrapper } from '../components/layout/PageWrapper'
import { mlApi } from '../api/api'
import {
  regressionHyperparams,
  classificationHyperparams,
  clusteringHyperparams,
  regressionScatterData,
  classificationScatterData,
  clusteringScatterData,
} from '../data/mockData'
import type {
  MLTask,
  RegressionModel,
  ClassificationModel,
  ClusteringModel,
  HyperparameterValues,
  OptimizeMethod,
} from '../types'

type MLTab = 'regression' | 'classification' | 'clustering'

const tabDefs = [
  { value: 'regression' as MLTab, label: 'Regression' },
  { value: 'classification' as MLTab, label: 'Classification' },
  { value: 'clustering' as MLTab, label: 'Clustering' },
]

const regressionModelOptions = [
  { value: 'elasticnet', label: 'ElasticNet' },
  { value: 'lightgbm', label: 'LightGBM' },
  { value: 'nn', label: 'Simple Neural Network' },
]

const classificationModelOptions = [
  { value: 'logistic_regression', label: 'Logistic Regression' },
  { value: 'svm', label: 'SVM' },
  { value: 'lightgbm', label: 'LightGBM' },
]

const clusteringModelOptions = [
  { value: 'kmeans', label: 'K-Means' },
  { value: 'dbscan', label: 'DBSCAN' },
]

function MetricsDisplay({ metrics }: { metrics: Record<string, number> }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Object.entries(metrics).map(([key, val]) => (
        <div key={key} className="bg-bg-base rounded-lg p-3 border border-border-subtle">
          <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</p>
          <p className="text-lg font-bold text-purple-light">{val.toFixed(4)}</p>
        </div>
      ))}
    </div>
  )
}

function OptimizeResultDisplay({ result }: { result: { best_params: Record<string, number>; best_score: number; n_trials: number; duration_seconds: number } }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-sm">
        <span className="text-text-muted">Best score: <strong className="text-purple-light">{result.best_score.toFixed(4)}</strong></span>
        <span className="text-text-muted">Trials: <strong className="text-text-body">{result.n_trials}</strong></span>
        <span className="text-text-muted">Duration: <strong className="text-text-body">{result.duration_seconds.toFixed(1)}s</strong></span>
      </div>
      <div>
        <p className="text-xs text-text-muted mb-2">Best parameters found:</p>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(result.best_params).map(([k, v]) => (
            <div key={k} className="bg-bg-base rounded-md px-3 py-2 border border-border-subtle">
              <p className="text-[10px] text-text-muted uppercase">{k}</p>
              <p className="text-sm font-mono text-text-body">{v.toFixed(4)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function MLPage() {
  const [tab, setTab] = useState<MLTab>('regression')
  const [regModel, setRegModel] = useState<RegressionModel>('elasticnet')
  const [clsModel, setClsModel] = useState<ClassificationModel>('logistic_regression')
  const [cluModel, setCluModel] = useState<ClusteringModel>('kmeans')
  const [hyperparams, setHyperparams] = useState<HyperparameterValues>({})
  const [scatterData, setScatterData] = useState(regressionScatterData)
  const [metrics, setMetrics] = useState<Record<string, number> | null>(null)
  const [optimizeResult, setOptimizeResult] = useState<{ best_params: Record<string, number>; best_score: number; n_trials: number; duration_seconds: number } | null>(null)
  const [runLoading, setRunLoading] = useState(false)
  const [optimizeLoading, setOptimizeLoading] = useState(false)

  const currentModel = tab === 'regression' ? regModel : tab === 'classification' ? clsModel : cluModel
  const currentDefs =
    tab === 'regression'
      ? regressionHyperparams[regModel]
      : tab === 'classification'
        ? classificationHyperparams[clsModel]
        : clusteringHyperparams[cluModel]

  useEffect(() => {
    setHyperparams(Object.fromEntries(currentDefs.map(d => [d.name, d.defaultValue])))
    setMetrics(null)
    setOptimizeResult(null)
    setScatterData(
      tab === 'regression' ? regressionScatterData
        : tab === 'classification' ? classificationScatterData
          : clusteringScatterData
    )
  }, [tab, regModel, clsModel, cluModel]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRun = async () => {
    setRunLoading(true)
    setOptimizeResult(null)
    try {
      const task = tab as MLTask
      const runner = task === 'regression' ? mlApi.runRegression : task === 'classification' ? mlApi.runClassification : mlApi.runClustering
      const result = await runner({ task, model: currentModel, hyperparameters: hyperparams })
      setScatterData(result.scatter)
      setMetrics(result.metrics)
    } finally {
      setRunLoading(false)
    }
  }

  const handleOptimize = async (method: OptimizeMethod, config: Record<string, unknown>) => {
    setOptimizeLoading(true)
    setMetrics(null)
    try {
      const result = await mlApi.optimizeParams({ task: tab as MLTask, model: currentModel, method, config: config as never })
      setOptimizeResult(result)
    } finally {
      setOptimizeLoading(false)
    }
  }

  return (
    <PageWrapper>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-body mb-1">
          Machine Learning <span className="text-purple-light">Playground</span>
        </h1>
        <p className="text-sm text-text-muted">Explore regression, classification, and clustering models with interactive hyperparameter control.</p>
      </div>

      <SubNavTabs tabs={tabDefs} active={tab} onChange={t => { setTab(t); }} />

      <div className="mt-6 grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-5">
          <Card>
            <ScatterPlot
              data={scatterData}
              title={`${tab.charAt(0).toUpperCase() + tab.slice(1)} — ${currentModel}`}
              xLabel="Feature 1"
              yLabel={tab === 'regression' ? 'Target' : 'Feature 2'}
            />
          </Card>

          {metrics && (
            <Card title="Metrics">
              <MetricsDisplay metrics={metrics} />
            </Card>
          )}

          {optimizeResult && (
            <Card title="Optimization Result">
              <OptimizeResultDisplay result={optimizeResult} />
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card title="Model">
            {tab === 'regression' && (
              <ModelSelector
                options={regressionModelOptions}
                value={regModel}
                onChange={v => setRegModel(v as RegressionModel)}
              />
            )}
            {tab === 'classification' && (
              <ModelSelector
                options={classificationModelOptions}
                value={clsModel}
                onChange={v => setClsModel(v as ClassificationModel)}
              />
            )}
            {tab === 'clustering' && (
              <ModelSelector
                options={clusteringModelOptions}
                value={cluModel}
                onChange={v => setCluModel(v as ClusteringModel)}
              />
            )}
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
              Run Model
            </Button>
            <OptimizePanel
              hyperparamDefs={currentDefs}
              onRun={handleOptimize}
              loading={optimizeLoading}
            />
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
