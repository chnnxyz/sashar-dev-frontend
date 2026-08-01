import { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react'
import { SubNavTabs } from '../components/shared/SubNavTabs'
import { Card } from '../components/shared/Card'
import { Button } from '../components/shared/Button'
import { ScatterPlot } from '../components/ml/ScatterPlot'
import { LinePlot } from '../components/timeseries/LinePlot'
import { ModelSelector } from '../components/ml/ModelSelector'
import { DatasetSelector } from '../components/ml/DatasetSelector'
import { HyperparameterPanel } from '../components/ml/HyperparameterPanel'
import { OptimizePanel } from '../components/ml/OptimizePanel'
import { CVMetricsCard } from '../components/shared/CVMetricsCard'
import { PageWrapper } from '../components/layout/PageWrapper'
import { GitHubRepoLink } from '../components/shared/GitHubRepoLink'
import { mlApi, tsApi } from '../api/api'
import {
  regressionHyperparams, classificationHyperparams, clusteringHyperparams, tsHyperparams,
  regressionScatterData, classificationScatterData, clusteringBaseData, timeSeriesData,
  DATASETS, IRIS_PC_VARIANCE, BLOBS_PC_VARIANCE, BREAST_CANCER_PC_VARIANCE,
  REGRESSION_FEATURES, DIABETES_FEATURES, applySeededSplit, DATASET_BASE_DATA, generateTestPredictions,
} from '../data/mockData'
import type {
  MLTask, RegressionModel, ClassificationModel, ClusteringModel, TSModel,
  HyperparameterValues, ScatterPoint, TimeSeriesPoint, CVMetrics,
} from '../types'

type MLTab = 'regression' | 'classification' | 'clustering' | 'timeseries'

const tabDefs = [
  { value: 'regression' as MLTab, label: 'Regression' },
  { value: 'classification' as MLTab, label: 'Classification' },
  { value: 'clustering' as MLTab, label: 'Clustering' },
  { value: 'timeseries' as MLTab, label: 'Time Series' },
]
const regressionModelOptions = [
  { value: 'elasticnet', label: 'ElasticNet' },
  { value: 'lightgbm', label: 'LightGBM' },
  { value: 'mlp', label: 'Multi-Layer Perceptron' },
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
const tsModelOptions = [
  { value: 'lightgbm', label: 'LightGBM' },
  { value: 'tes', label: 'Triple Exp. Smoothing' },
  { value: 'rnn', label: 'GRU (RNN)' },
]

const aboutModels: Record<MLTab, Array<{ name: string; desc: string }>> = {
  regression: [
    { name: 'ElasticNet', desc: 'Linear regression with L1+L2 regularization — my default first pass on any small-to-medium tabular set. Cheap to fit, and the coefficients actually tell you something.' },
    { name: 'LightGBM', desc: 'Leaf-wise gradient boosting. Usually wins on this dataset; the tradeoff is you lose the coefficient-level interpretability ElasticNet gives you for free.' },
    { name: 'Multi-Layer Perceptron', desc: 'A plain feedforward net in PyTorch, capped at 50 epochs on this box (no GPU here). Worth trying when the relationship clearly isn’t linear — otherwise it’s usually not worth the training time.' },
  ],
  classification: [
    { name: 'Logistic Regression', desc: 'Still the first thing I reach for on a binary/multiclass problem. Boring, fast, and the decision boundary is easy to reason about.' },
    { name: 'SVM', desc: 'The kernel trick handles non-linear boundaries well, though it gets slow past a few thousand rows — fine here, would reconsider at scale.' },
    { name: 'LightGBM', desc: 'Same boosted-tree engine as the regression tab, tuned for classification. Tends to edge out logistic regression on accuracy at the cost of a black-box decision boundary.' },
  ],
  clustering: [
    { name: 'K-Means', desc: 'Centroid-based, assumes roughly spherical clusters. Fast and a reasonable first guess — the real work is picking k.' },
    { name: 'DBSCAN', desc: 'Density-based instead of centroid-based, so it finds irregular cluster shapes and actually flags outliers rather than forcing every point into a group.' },
  ],
  timeseries: [
    { name: 'LightGBM', desc: 'Same boosting engine again, this time fed lag features and rolling stats instead of raw time. Treats forecasting as a regression problem, which works better than it should.' },
    { name: 'Triple Exp. Smoothing', desc: 'Classic Holt-Winters: separate smoothing terms for level, trend, and seasonality. No neural net required, and for a lot of seasonal series it’s hard to beat.' },
    { name: 'GRU (RNN)', desc: 'Recurrent net (PyTorch) over a sliding window. Can pick up longer-range temporal patterns the other two miss, but needs more data to be worth it.' },
  ],
}

function MetricsDisplay({ metrics }: { metrics: Record<string, number> }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Object.entries(metrics).map(([key, val]) => (
        <Card key={key} static innerClassName="p-3">
          <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</p>
          <p className="text-lg font-bold text-purple-light">{val.toFixed(4)}</p>
        </Card>
      ))}
    </div>
  )
}

export function MLPage() {
  const regDatasets = DATASETS.filter(d => d.type === 'regression')
  const clsDatasets = DATASETS.filter(d => d.type === 'classification')
  const cluDatasets = DATASETS.filter(d => d.type === 'clustering')
  const tsDatasets  = DATASETS.filter(d => d.type === 'timeseries')

  const [tab, setTab] = useState<MLTab>('regression')

  // ML model state
  const [regModel, setRegModel] = useState<RegressionModel>('elasticnet')
  const [clsModel, setClsModel] = useState<ClassificationModel>('logistic_regression')
  const [cluModel, setCluModel] = useState<ClusteringModel>('kmeans')
  const [tsModel,  setTsModel]  = useState<TSModel>('lightgbm')

  // Dataset selection state
  const [regDataset, setRegDataset] = useState(regDatasets[0]?.id ?? '')
  const [clsDataset, setClsDataset] = useState(clsDatasets[0]?.id ?? '')
  const [cluDataset, setCluDataset] = useState(cluDatasets[0]?.id ?? '')
  const [tsDataset,  setTsDataset]  = useState(tsDatasets[0]?.id ?? '')

  // Shared hyperparameter / run state
  const [hyperparams, setHyperparams] = useState<HyperparameterValues>({})
  const [hyperparamsValid, setHyperparamsValid] = useState(true)
  const [metrics, setMetrics] = useState<Record<string, number> | null>(null)
  const [cvMetrics, setCvMetrics] = useState<CVMetrics | null>(null)
  const [runLoading, setRunLoading] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [splitSeed, setSplitSeed] = useState(13)
  const [hpSeed, setHpSeed] = useState(42)

  // ML scatter state
  const [scatterData, setScatterData] = useState<ScatterPoint[]>(regressionScatterData)
  const [predictions, setPredictions] = useState<ScatterPoint[] | null>(null)
  const [xFeature, setXFeature] = useState('MedInc')

  // Time series state
  const [historical, setHistorical] = useState<TimeSeriesPoint[]>(timeSeriesData)
  const [forecast, setForecast] = useState<TimeSeriesPoint[]>([])

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

  // ResizeObserver for window-resize-driven height updates
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

  // Synchronously read right column height before paint on any model/tab change
  useLayoutEffect(() => {
    const el = rightColRef.current
    if (!el) return
    const h = el.getBoundingClientRect().height
    if (h > 0) setRightColHeight(h)
  }, [tab, regModel, clsModel, cluModel, tsModel]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentDefs =
    tab === 'regression'     ? regressionHyperparams[regModel]
    : tab === 'classification' ? classificationHyperparams[clsModel]
    : tab === 'clustering'     ? clusteringHyperparams[cluModel]
    : tsHyperparams[tsModel]

  // Reset on tab or ML-model change
  useEffect(() => {
    setHyperparams(Object.fromEntries(currentDefs.map(d => [d.name, d.defaultValue])))
    setMetrics(null); setCvMetrics(null); setPredictions(null); setRunError(null)
    if (tab === 'timeseries') {
      setHistorical(timeSeriesData); setForecast([])
    } else {
      const base = tab === 'regression' ? (DATASET_BASE_DATA[regDataset] ?? regressionScatterData)
        : tab === 'classification' ? (DATASET_BASE_DATA[clsDataset] ?? classificationScatterData)
          : (DATASET_BASE_DATA[cluDataset] ?? clusteringBaseData)
      setScatterData(base)
    }
    if (tab === 'regression') setXFeature(regDataset === 'diabetes' ? 'BMI' : 'MedInc')
  }, [tab, regModel, clsModel, cluModel]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset hyperparams/results when TS model changes
  useEffect(() => {
    if (tab !== 'timeseries') return
    setHyperparams(Object.fromEntries(tsHyperparams[tsModel].map(d => [d.name, d.defaultValue])))
    setMetrics(null); setCvMetrics(null); setForecast([]); setRunError(null)
  }, [tsModel, tab]) // eslint-disable-line react-hooks/exhaustive-deps

  // Dataset-switch effects — tab guard prevents wrong effect winning on mount
  useEffect(() => {
    if (tab !== 'regression') return
    setScatterData(DATASET_BASE_DATA[regDataset] ?? regressionScatterData)
    setMetrics(null); setCvMetrics(null); setPredictions(null); setRunError(null)
    setXFeature(regDataset === 'diabetes' ? 'BMI' : 'MedInc')
  }, [regDataset, tab]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab !== 'classification') return
    setScatterData(DATASET_BASE_DATA[clsDataset] ?? classificationScatterData)
    setMetrics(null); setCvMetrics(null); setPredictions(null); setRunError(null)
  }, [clsDataset, tab]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab !== 'clustering') return
    setScatterData(DATASET_BASE_DATA[cluDataset] ?? clusteringBaseData)
    setMetrics(null); setCvMetrics(null); setPredictions(null); setRunError(null)
  }, [cluDataset, tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const taggedData = useMemo(() => applySeededSplit(scatterData, splitSeed), [scatterData, splitSeed])

  const displayData = useMemo(() => {
    if (tab !== 'regression') return taggedData
    return taggedData.map(p => ({ ...p, x: p.features?.[xFeature] ?? p.x }))
  }, [taggedData, xFeature, tab])

  const displayPredictions = useMemo(() => {
    if (!predictions || tab !== 'regression') return predictions
    return predictions.map(p => ({ ...p, x: p.features?.[xFeature] ?? p.x }))
  }, [predictions, xFeature, tab])

  // Classification predictions derived from seeded taggedData so they always match train/test colors
  const classificationPredictions = useMemo(() => {
    if (tab !== 'classification' || metrics === null) return null
    return generateTestPredictions(taggedData, 0, 'classification')
  }, [tab, metrics, taggedData])

  const handleRun = async () => {
    setRunLoading(true)
    setRunError(null)
    try {
      if (tab === 'timeseries') {
        const result = await tsApi.runForecast({ model: tsModel, hyperparameters: hyperparams, dataset: tsDataset })
        setHistorical(result.historical)
        setForecast(result.forecast)
        setMetrics(result.metrics)
        setCvMetrics(result.cv)
      } else {
        const task = tab as MLTask
        const runner = task === 'regression' ? mlApi.runRegression
          : task === 'classification' ? mlApi.runClassification
          : mlApi.runClustering
        const dataset = tab === 'regression' ? regDataset : tab === 'classification' ? clsDataset : cluDataset
        const result = await runner({ task, model: tab === 'regression' ? regModel : tab === 'classification' ? clsModel : cluModel, hyperparameters: hyperparams, dataset })
        setScatterData(result.scatter)
        setMetrics(result.metrics)
        setCvMetrics(result.cv)
        setPredictions(result.testPredictions ?? null)
      }
    } catch {
      setRunError('Run failed — the ML service may be unavailable. Try again.')
    } finally {
      setRunLoading(false)
    }
  }

  const currentRegFeatures = regDataset === 'diabetes' ? DIABETES_FEATURES : REGRESSION_FEATURES
  const xFeatureLabel = currentRegFeatures.find(f => f.key === xFeature)?.label ?? xFeature
  const REGRESSION_AXIS: Record<string, { x: string; y: string }> = {
    california_housing: { x: xFeatureLabel, y: 'Median House Value' },
    diabetes: { x: xFeatureLabel, y: 'Disease Progression' },
  }
  const regAxis = REGRESSION_AXIS[regDataset] ?? { x: 'X', y: 'Y' }
  const xLabel = tab === 'regression'
    ? regAxis.x
    : `PC1 (${tab === 'classification'
      ? (clsDataset === 'breast_cancer' ? BREAST_CANCER_PC_VARIANCE.pc1 : IRIS_PC_VARIANCE.pc1)
      : BLOBS_PC_VARIANCE.pc1}% var.)`
  const yLabel = tab === 'regression'
    ? regAxis.y
    : `PC2 (${tab === 'classification'
      ? (clsDataset === 'breast_cancer' ? BREAST_CANCER_PC_VARIANCE.pc2 : IRIS_PC_VARIANCE.pc2)
      : BLOBS_PC_VARIANCE.pc2}% var.)`

  const tsTrainSize = Math.floor(historical.length * 0.7)

  const stackDesc = tab === 'timeseries'
    ? 'Python · FastAPI · LightGBM · statsmodels (TES) · PyTorch (GRU) · SQLite'
    : tab === 'regression'
      ? 'Python · FastAPI · scikit-learn · PyTorch (MLP) · SQLite'
      : 'Python · FastAPI · scikit-learn · SQLite'

  return (
    <PageWrapper>
      <div className="mb-6">
        <div className="flex items-baseline gap-4 mb-1">
          <h1 className="text-2xl font-bold text-purple-light">Machine Learning Playground</h1>
          <GitHubRepoLink repo="chnnxyz/sashar-dev-ml-api" />
        </div>
        <p className="text-sm text-text-muted">
          {tab === 'timeseries'
            ? 'Forecast with LightGBM, Triple Exponential Smoothing, and GRU models. Visualize historical data and future predictions.'
            : 'Explore regression, classification, and clustering models with interactive hyperparameter control.'}
        </p>
        <p className="text-xs text-text-muted/80 mt-1.5 font-mono">{stackDesc}</p>
      </div>

      <SubNavTabs tabs={tabDefs} active={tab} onChange={t => setTab(t)} />

      <div className="mt-6 grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Left column — chart only */}
        <div
          className="flex flex-col"
          style={isDesktop && rightColHeight ? { height: rightColHeight } : undefined}
        >
          <Card className={isDesktop && rightColHeight ? 'flex-1' : ''}>
            {tab === 'timeseries' ? (
              <LinePlot
                historical={historical}
                forecast={forecast}
                trainSize={tsTrainSize}
                title={`Time Series Forecasting — ${tsModel.toUpperCase()}${forecast.length > 0 ? ` — ${forecast.length}-step forecast` : ''}`}
                height={isDesktop && rightColHeight ? Math.max(280, rightColHeight - 100) : undefined}
              />
            ) : (
              <ScatterPlot
                data={displayData}
                predictions={
                  tab === 'regression' ? (displayPredictions ?? undefined)
                    : tab === 'classification' ? (classificationPredictions ?? undefined)
                      : undefined
                }
                mode={tab}
                title={`${tab.charAt(0).toUpperCase() + tab.slice(1)} — ${tab === 'regression' ? regModel : tab === 'classification' ? clsModel : cluModel}`}
                xLabel={xLabel}
                yLabel={yLabel}
                height={isDesktop && rightColHeight ? Math.max(280, rightColHeight - (tab === 'classification' ? 120 : 100)) : undefined}
                rmse={tab === 'regression' ? (metrics?.rmse ?? undefined) : undefined}
              />
            )}
          </Card>
        </div>

        {/* Right column — self-start prevents stretching to match left column height */}
        <div ref={rightColRef} className="space-y-5 self-start">
          <Card title="Dataset & Model">
            <div className="space-y-3">
              {/* Dataset selector + Split Seed inline for regression/classification */}
              {(tab === 'regression' || tab === 'classification') && (
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    {tab === 'regression'     && <DatasetSelector datasets={regDatasets} value={regDataset} onChange={setRegDataset} />}
                    {tab === 'classification' && <DatasetSelector datasets={clsDatasets} value={clsDataset} onChange={setClsDataset} />}
                  </div>
                  <label className="flex flex-col gap-1.5 shrink-0">
                    <span className="text-xs text-text-muted font-medium">Split Seed</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={splitSeed}
                        onChange={e => setSplitSeed(Math.max(1, parseInt(e.target.value) || 1))}
                        min={1}
                        className="w-16 bg-bg-base/80 border border-border-subtle rounded-sm px-2 py-2 text-sm text-text-body font-mono focus:outline-none focus:border-purple/60 focus:ring-1 focus:ring-purple/20 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inset-field"
                      />
                      <button
                        onClick={() => setSplitSeed(Math.floor(Math.random() * 999) + 1)}
                        title="Random split seed"
                        aria-label="Random split seed"
                        className="p-1.5 rounded-sm text-text-muted hover:text-purple-light transition-colors cursor-pointer border border-border-subtle hover:border-purple/40"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8}>
                          <path d="M1 8A7 7 0 1 1 8 15" strokeLinecap="round"/>
                          <path d="M1 8V4M1 8H5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </label>
                </div>
              )}
              {tab === 'clustering' && <DatasetSelector datasets={cluDatasets} value={cluDataset} onChange={setCluDataset} />}
              {tab === 'timeseries' && <DatasetSelector datasets={tsDatasets}  value={tsDataset}  onChange={setTsDataset} />}

              {tab === 'regression'     && <ModelSelector options={regressionModelOptions}  value={regModel} onChange={v => setRegModel(v as RegressionModel)} />}
              {tab === 'classification' && <ModelSelector options={classificationModelOptions} value={clsModel} onChange={v => setClsModel(v as ClassificationModel)} />}
              {tab === 'clustering'     && <ModelSelector options={clusteringModelOptions}  value={cluModel} onChange={v => setCluModel(v as ClusteringModel)} />}
              {tab === 'timeseries'     && <ModelSelector options={tsModelOptions}          value={tsModel}  onChange={v => setTsModel(v as TSModel)} />}

              {tab === 'regression' && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-text-muted font-medium">X Axis Feature</span>
                  <div className="relative">
                    <select
                      value={xFeature}
                      onChange={e => setXFeature(e.target.value)}
                      className="w-full appearance-none bg-bg-base/80 border border-border-subtle rounded-sm px-3 py-2 text-sm text-text-body focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/30 transition duration-150 cursor-pointer pr-8 shadow-inset-field"
                    >
                      {currentRegFeatures.map(f => (
                        <option key={f.key} value={f.key} className="bg-bg-card">{f.label}</option>
                      ))}
                    </select>
                    <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </label>
              )}
            </div>
          </Card>

          <Card>
            <HyperparameterPanel
              defs={currentDefs}
              values={hyperparams}
              onChange={(k, v) => setHyperparams(prev => ({ ...prev, [k]: v }))}
              seed={hpSeed}
              onSeedChange={setHpSeed}
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
              {tab === 'timeseries' ? 'Run Forecast' : 'Run Model'}
            </Button>
            {runError && (
              <div className="bg-rose-950/30 border border-rose-800/40 rounded-sm px-3 py-2">
                <p className="text-xs text-rose-400">{runError}</p>
              </div>
            )}
            <p className="text-[10px] text-text-muted/60">
              Or let Optimize search parameters for you
            </p>
            <OptimizePanel
              hyperparamDefs={currentDefs}
              onApply={params => setHyperparams(params)}
              task={tab === 'timeseries' ? 'timeseries' : (tab as MLTask)}
              model={tab === 'regression' ? regModel : tab === 'classification' ? clsModel : tab === 'clustering' ? cluModel : tsModel}
            />
          </div>
        </div>
      </div>

      {/* Metrics and CV — full width below the grid */}
      {metrics && (
        <Card title={tab === 'timeseries' ? 'Forecast Metrics' : 'Metrics'} className="mt-5">
          <MetricsDisplay metrics={metrics} />
        </Card>
      )}
      {cvMetrics && (
        <Card title="Training / Evaluation" className="mt-5">
          <CVMetricsCard
            cv={cvMetrics}
            mode={tab === 'classification' ? 'classification' : tab === 'clustering' ? 'clustering' : 'regression'}
          />
        </Card>
      )}

      {/* About the Models — outside grid */}
      <div className="mt-6">
        <Card title="About the Models" className="text-xs text-text-muted leading-relaxed">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {aboutModels[tab].map(m => (
              <div key={m.name}>
                <p className="text-purple-light font-semibold mb-1">{m.name}</p>
                <p>{m.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageWrapper>
  )
}
