import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import type {
  RunMLParams,
  RunTSParams,
  OptimizeParams,
  GraphQLRequest,
  RESTRequest,
  ScatterPoint,
  TimeSeriesPoint,
} from '../types'
import {
  regressionScatterData,
  classificationScatterData,
  clusteringScatterData,
  generateTimeSeriesData,
  generateForecastData,
  mockRESTResponses,
  mockGraphQLResponse,
} from '../data/mockData'

const MOCK_DELAY_MS = 600

function mockDelay<T>(data: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(data), MOCK_DELAY_MS))
}

// ─── Axios base instance ───────────────────────────────────────────────────────

const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30_000,
})

axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  error => {
    const message: string =
      error.response?.data?.message ?? error.message ?? 'An unexpected error occurred'
    return Promise.reject(new Error(message))
  },
)

// ─── ML API ───────────────────────────────────────────────────────────────────

export interface MLRunResult {
  scatter: ScatterPoint[]
  metrics: Record<string, number>
  model: string
}

export interface OptimizeResult {
  best_params: Record<string, number>
  best_score: number
  n_trials: number
  duration_seconds: number
}

export const mlApi = {
  runRegression: (_params: RunMLParams): Promise<MLRunResult> =>
    mockDelay({
      scatter: regressionScatterData,
      metrics: { rmse: 0.38 + Math.random() * 0.2, mae: 0.27 + Math.random() * 0.15, r2: 0.87 + Math.random() * 0.1 },
      model: _params.model,
    }),

  runClassification: (_params: RunMLParams): Promise<MLRunResult> =>
    mockDelay({
      scatter: classificationScatterData,
      metrics: { accuracy: 0.91 + Math.random() * 0.07, f1: 0.90 + Math.random() * 0.08, auc_roc: 0.95 + Math.random() * 0.04 },
      model: _params.model,
    }),

  runClustering: (_params: RunMLParams): Promise<MLRunResult> =>
    mockDelay({
      scatter: clusteringScatterData,
      metrics: { silhouette: 0.62 + Math.random() * 0.2, inertia: 120 + Math.random() * 80 },
      model: _params.model,
    }),

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
}

export const tsApi = {
  runForecast: (_params: RunTSParams): Promise<TSRunResult> =>
    mockDelay({
      historical: generateTimeSeriesData(),
      forecast: generateForecastData(),
      metrics: { rmse: 4.2 + Math.random() * 2, mae: 3.1 + Math.random() * 1.5, mape: 2.8 + Math.random() * 2 },
      model: _params.model,
    }),

  optimizeParams: (_params: OptimizeParams): Promise<OptimizeResult> =>
    mockDelay({
      best_params: { n_estimators: 120, learning_rate: 0.08, max_depth: 5 },
      best_score: 0.92 + Math.random() * 0.06,
      n_trials: 'n_trials' in _params.config ? (_params.config.n_trials as number) : 50,
      duration_seconds: 5 + Math.random() * 20,
    }),
}

// ─── Backend Playground API ───────────────────────────────────────────────────

export interface GraphQLResult {
  data?: Record<string, unknown>
  errors?: Array<{ message: string; locations?: Array<{ line: number; column: number }> }>
}

export const backendApi = {
  executeGraphQL: (_request: GraphQLRequest): Promise<GraphQLResult> =>
    mockDelay(mockGraphQLResponse),

  executeREST: (request: RESTRequest): Promise<unknown> => {
    const endpoint = Object.keys(mockRESTResponses).find(key => {
      const mapping: Record<string, string> = {
        'get-users': 'GET /users',
        'get-user-by-id': 'GET /users/:id',
        'post-users': 'POST /users',
        'get-models': 'GET /models',
        'post-predict': 'POST /predict',
        'get-metrics': 'GET /metrics',
        'delete-model': 'DELETE /models/:id',
      }
      return mapping[key] === `${request.method} ${request.endpoint}`
    })
    const response = endpoint ? mockRESTResponses[endpoint] : { error: 'Endpoint not found', status: 404 }
    return mockDelay(response)
  },
}

export default axiosInstance
