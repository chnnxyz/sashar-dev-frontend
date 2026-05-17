import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import type {
  RunMLParams,
  RunTSParams,
  OptimizeParams,
  GraphQLRequest,
  RESTRequest,
  ScatterPoint,
  TimeSeriesPoint,
  CVMetrics,
  TokenizeResult,
  EncodeResult,
  EmbedResult,
  GenerateResult,
} from '../types'
import {
  regressionScatterData,
  diabetesScatterData,
  classificationScatterData,
  breastCancerScatterData,
  clusteringScatterData,
  moonsScatterData,
  generateTimeSeriesData,
  ettH1Data,
  generateAlignedForecast,
  generateTestPredictions,
  generateCVMetrics,
  CV_DATA,
  DATASETS,
  MODEL_DEFINITIONS,
} from '../data/mockData'

const MOCK_DELAY_MS = 600

function mockDelay<T>(data: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(data), MOCK_DELAY_MS))
}

// ─── Axios instances (one per microservice) ───────────────────────────────────

const ML_BASE  = import.meta.env.VITE_ML_API_URL  ?? 'http://localhost:8000/ml/v1'
const REST_BASE = import.meta.env.VITE_REST_API_URL ?? 'http://localhost:8001/api/v1'
const GQL_BASE  = import.meta.env.VITE_GQL_API_URL  ?? 'http://localhost:8002/gql/v1'
const LLM_BASE  = import.meta.env.VITE_LLM_API_URL  ?? 'http://localhost:8003/llm/v1'

export const ML_BASE_URL  = ML_BASE
export const REST_BASE_URL = REST_BASE
export const GQL_BASE_URL  = GQL_BASE
export const LLM_BASE_URL  = LLM_BASE

function makeInstance(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    timeout: 30_000,
  })
  instance.interceptors.request.use(config => {
    const token = localStorage.getItem('auth_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    error => {
      const message: string =
        error.response?.data?.message ?? error.message ?? 'An unexpected error occurred'
      return Promise.reject(new Error(message))
    },
  )
  return instance
}

export const mlAxios  = makeInstance(ML_BASE)
export const restAxios = makeInstance(REST_BASE)
export const gqlAxios  = makeInstance(GQL_BASE)
export const llmAxios  = makeInstance(LLM_BASE)

const axiosInstance = restAxios

// ─── ML API ───────────────────────────────────────────────────────────────────

export interface MLRunResult {
  scatter: ScatterPoint[]
  testPredictions?: ScatterPoint[]
  metrics: Record<string, number>
  model: string
  cv: CVMetrics
}

export interface OptimizeResult {
  best_params: Record<string, number>
  best_score: number
  n_trials: number
  duration_seconds: number
}

export const mlApi = {
  runRegression: (_params: RunMLParams): Promise<MLRunResult> => {
    const base = _params.dataset === 'diabetes' ? diabetesScatterData : regressionScatterData
    const trainSize = Math.floor(base.length * 0.7)
    const rmse = 0.38 + Math.random() * 0.2
    return mockDelay({ scatter: base, testPredictions: generateTestPredictions(base, trainSize), metrics: { rmse, mae: 0.27 + Math.random() * 0.15, r2: 0.87 + Math.random() * 0.1 }, model: _params.model, cv: generateCVMetrics(base.length, rmse) })
  },

  runClassification: (_params: RunMLParams): Promise<MLRunResult> => {
    const base = _params.dataset === 'breast_cancer' ? breastCancerScatterData : classificationScatterData
    const trainSize = Math.floor(base.length * 0.7)
    const rmse = 0.28 + Math.random() * 0.15
    return mockDelay({ scatter: base, testPredictions: generateTestPredictions(base, trainSize), metrics: { accuracy: 0.91 + Math.random() * 0.07, f1: 0.90 + Math.random() * 0.08, auc_roc: 0.95 + Math.random() * 0.04 }, model: _params.model, cv: generateCVMetrics(base.length, rmse) })
  },

  runClustering: (_params: RunMLParams): Promise<MLRunResult> => {
    const base = _params.dataset === 'moons' ? moonsScatterData : clusteringScatterData
    const rmse = 0.35 + Math.random() * 0.2
    return mockDelay({ scatter: base, metrics: { silhouette: 0.62 + Math.random() * 0.2, inertia: 120 + Math.random() * 80 }, model: _params.model, cv: generateCVMetrics(base.length, rmse) })
  },

  optimizeParams: (_params: OptimizeParams): Promise<OptimizeResult> =>
    mockDelay({
      best_params: Object.fromEntries(
        Object.keys(_params.config).map(k => [k, parseFloat((Math.random() * 10).toFixed(4))]),
      ),
      best_score: 0.88 + Math.random() * 0.1,
      n_trials: 'n_trials' in _params.config ? (_params.config.n_trials as number) : 50,
      duration_seconds: 3 + Math.random() * 12,
    }),
}

// ─── Time Series API ──────────────────────────────────────────────────────────

export interface TSRunResult {
  historical: TimeSeriesPoint[]
  forecast: TimeSeriesPoint[]
  metrics: Record<string, number>
  model: string
  cv: CVMetrics
}

export const tsApi = {
  runForecast: (_params: RunTSParams): Promise<TSRunResult> => {
    const hist = _params.dataset === 'etth1' ? [...ettH1Data] : generateTimeSeriesData()
    const rmse = 4.2 + Math.random() * 2
    const split = Math.floor(hist.length * 0.7)
    const historical = hist.map((p, i) =>
      i < split ? p : { ...p, predicted: p.value + (Math.random() - 0.5) * rmse * 1.8 }
    )
    return mockDelay({ historical, forecast: generateAlignedForecast(hist), metrics: { rmse, mae: 3.1 + Math.random() * 1.5, mape: 2.8 + Math.random() * 2 }, model: _params.model, cv: generateCVMetrics(hist.length, rmse) })
  },

  optimizeParams: (_params: OptimizeParams): Promise<OptimizeResult> =>
    mockDelay({
      best_params: { n_estimators: 120, learning_rate: 0.08, max_depth: 5 },
      best_score: 0.92 + Math.random() * 0.06,
      n_trials: 'n_trials' in _params.config ? (_params.config.n_trials as number) : 50,
      duration_seconds: 5 + Math.random() * 20,
    }),
}

// ─── LLM Pipeline API ────────────────────────────────────────────────────────

export const llmApi = {
  tokenize: (prompt: string): Promise<TokenizeResult> => {
    const tokens = prompt.match(/\S+\s*/g) ?? []
    return mockDelay({ tokens })
  },

  encode: (tokens: string[]): Promise<EncodeResult> => {
    const ids = tokens.map(() => Math.floor(1000 + Math.random() * 49000))
    return mockDelay({ ids })
  },

  embed: (tokens: string[], ids: number[]): Promise<EmbedResult> => {
    // Group semantically similar tokens near each other using hash-based offsets
    const points = tokens.map((t, i) => {
      const hash = t.trim().split('').reduce((acc, c) => acc + c.charCodeAt(0), ids[i] ?? 0)
      return {
        x: ((hash % 600) / 100 - 3) + (Math.random() - 0.5) * 0.8,
        y: ((hash % 400) / 100 - 2) + (Math.random() - 0.5) * 0.8,
        label: t.trim(),
      }
    })
    return mockDelay({ points })
  },

  generate: (prompt: string, _tokens: string[], _ids: number[]): Promise<GenerateResult> => {
    // Generate a plausible mock response based on prompt content
    const lower = prompt.toLowerCase()
    const outputTokens = lower.includes('hello') || lower.includes('hi')
      ? ['Hello', '!', ' How', ' can', ' I', ' help', ' you', ' today', '?']
      : lower.includes('what') || lower.includes('who') || lower.includes('how')
      ? ['That', "'s", ' a', ' great', ' question', '.', ' The', ' answer', ' is', ' 42', '.']
      : ['I', ' understand', '.', ' Here', ' is', ' my', ' response', ' to', ' your', ' prompt', '.']
    return new Promise(resolve => setTimeout(() => resolve({ outputTokens }), 2500))
  },
}

// ─── Backend Playground API ───────────────────────────────────────────────────

export interface GraphQLResult {
  data?: Record<string, unknown>
  errors?: Array<{ message: string; locations?: Array<{ line: number; column: number }> }>
}

export const backendApi = {
  executeGraphQL: (request: GraphQLRequest): Promise<GraphQLResult> => {
    const q = request.query.toLowerCase()
    const vars = request.variables ?? {}

    if (q.includes('sendcontact') || (q.includes('contact') && q.includes('mutation'))) {
      return mockDelay({ data: { sendContact: { success: true, message: 'Message received.' } } })
    }
    if (q.includes('cvsection')) {
      const section = (vars.section as keyof typeof CV_DATA) ?? 'summary'
      const raw = CV_DATA[section]
      if (raw === undefined) return mockDelay({ data: { cvSection: null } })
      if (Array.isArray(raw)) {
        const numEntries = vars.numEntries ? parseInt(String(vars.numEntries)) : null
        const startYear = vars.startYear ? String(vars.startYear) : null
        const initialEntries = vars.initialEntries ? parseInt(String(vars.initialEntries)) : null
        let result = [...raw] as Array<Record<string, unknown>>
        if (initialEntries) result = result.slice(0, initialEntries)
        if (startYear) result = result.filter(e => typeof e.startYear === 'string' && e.startYear >= startYear)
        if (numEntries) result = result.slice(0, numEntries)
        return mockDelay({ data: { cvSection: result } })
      }
      return mockDelay({ data: { cvSection: raw } })
    }
    if (/\bcv\b/.test(q)) {
      return mockDelay({ data: { cv: CV_DATA } })
    }
    if (q.includes('datasets')) {
      const type = vars.type as string | undefined
      const data = type ? DATASETS.filter(d => d.type === type) : DATASETS
      return mockDelay({ data: { datasets: data } })
    }
    if (q.includes('models')) {
      const type = vars.type as string | undefined
      const data = type ? MODEL_DEFINITIONS.filter(m => m.type === type) : MODEL_DEFINITIONS
      return mockDelay({ data: { models: data } })
    }
    return mockDelay({ data: null, errors: [{ message: 'Unknown operation. Available queries: cv, cvSection, datasets, models. Mutation: sendContact.' }] })
  },

  executeREST: (request: RESTRequest): Promise<unknown> => {
    const { endpoint, method, params, body } = request

    if (method === 'GET' && /^\/cv\/(.+)$/.test(endpoint)) {
      const section = endpoint.replace('/cv/', '') as keyof typeof CV_DATA
      const raw = CV_DATA[section]
      if (raw === undefined) return mockDelay({ error: 'Section not found', status: 404 })
      if (Array.isArray(raw)) {
        const numEntries = params?.numEntries ? parseInt(String(params.numEntries)) : null
        const startYear = params?.startYear ? String(params.startYear) : null
        const initialEntries = params?.initialEntries ? parseInt(String(params.initialEntries)) : null
        let result = [...raw] as Array<Record<string, unknown>>
        if (initialEntries) result = result.slice(0, initialEntries)
        if (startYear) result = result.filter(e => typeof e.startYear === 'string' && e.startYear >= startYear)
        if (numEntries) result = result.slice(0, numEntries)
        return mockDelay({ data: result })
      }
      return mockDelay({ data: raw })
    }
    if (method === 'GET' && endpoint === '/cv') {
      return mockDelay({ data: CV_DATA })
    }
    if (method === 'POST' && endpoint === '/contact') {
      const { name, email } = (body ?? {}) as Record<string, string>
      if (!name || !email) return mockDelay({ error: 'name and email are required', status: 400 })
      return mockDelay({ success: true, message: 'Message received. I will get back to you shortly.' })
    }
    if (method === 'GET' && endpoint === '/datasets') {
      const type = params?.type as string | undefined
      const data = type ? DATASETS.filter(d => d.type === type) : DATASETS
      return mockDelay({ data, total: data.length })
    }
    if (method === 'GET' && endpoint === '/models') {
      const type = params?.type as string | undefined
      const data = type ? MODEL_DEFINITIONS.filter(m => m.type === type) : MODEL_DEFINITIONS
      return mockDelay({ data, total: data.length })
    }
    return mockDelay({ error: 'Endpoint not found', status: 404 })
  },
}

export default axiosInstance
