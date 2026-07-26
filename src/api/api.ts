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
  EmbedResultPoint,
  GenerateResult,
  ClusterResult,
  OptimizationIteration,
} from '../types'

// ─── Service base URLs ────────────────────────────────────────────────────────
// Two backend services (see repo root):
//   • Go REST + GraphQL  → :8001  (/api/v1, /gql/v1)
//   • Python ML + LLM    → :8002  (/ml/v1, /llm/v1)
// Override any of these via a .env file (VITE_* keys) — see .env at the repo root.

const ML_BASE   = import.meta.env.VITE_ML_API_URL   ?? 'http://localhost:8002/ml/v1'
const REST_BASE = import.meta.env.VITE_REST_API_URL ?? 'http://localhost:8001/api/v1'
const GQL_BASE  = import.meta.env.VITE_GQL_API_URL  ?? 'http://localhost:8001/gql/v1'
const LLM_BASE  = import.meta.env.VITE_LLM_API_URL  ?? 'http://localhost:8002/llm/v1'

// WebSocket base for the ML streaming routes (ws(s)://…/ml/v1).
const ML_WS_BASE = ML_BASE.replace(/^http/, 'ws')

export const ML_BASE_URL   = ML_BASE
export const REST_BASE_URL = REST_BASE
export const GQL_BASE_URL   = GQL_BASE
export const LLM_BASE_URL   = LLM_BASE

function makeInstance(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    timeout: 120_000, // model fits / CPU generation can be slow
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
        error.response?.data?.message ?? error.response?.data?.error ?? error.message ?? 'An unexpected error occurred'
      return Promise.reject(new Error(message))
    },
  )
  return instance
}

export const mlAxios   = makeInstance(ML_BASE)
export const restAxios = makeInstance(REST_BASE)
export const gqlAxios   = makeInstance(GQL_BASE)
export const llmAxios   = makeInstance(LLM_BASE)

const axiosInstance = restAxios

// ─── ML API (Python :8002 /ml/v1) ─────────────────────────────────────────────

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
  runRegression: async (params: RunMLParams): Promise<MLRunResult> =>
    (await mlAxios.post<MLRunResult>('/run-regression', params)).data,

  runClassification: async (params: RunMLParams): Promise<MLRunResult> =>
    (await mlAxios.post<MLRunResult>('/run-classification', params)).data,

  runClustering: async (params: RunMLParams): Promise<MLRunResult> =>
    (await mlAxios.post<MLRunResult>('/run-clustering', params)).data,

  optimizeParams: async (params: OptimizeParams): Promise<OptimizeResult> =>
    (await mlAxios.post<OptimizeResult>('/optimize-params', params)).data,
}

// ─── Time Series API (Python :8002 /ml/v1) ─────────────────────────────────────

export interface TSRunResult {
  historical: TimeSeriesPoint[]
  forecast: TimeSeriesPoint[]
  metrics: Record<string, number>
  model: string
  cv: CVMetrics
}

// The backend serializes dates as ISO strings; the charts expect Date objects.
function reviveDates(points: Array<TimeSeriesPoint & { date: string | Date }>): TimeSeriesPoint[] {
  return points.map(p => ({ ...p, date: p.date instanceof Date ? p.date : new Date(p.date) }))
}

export const tsApi = {
  runForecast: async (params: RunTSParams): Promise<TSRunResult> => {
    const data = (await mlAxios.post<TSRunResult>('/run-forecast', params)).data
    return { ...data, historical: reviveDates(data.historical as never), forecast: reviveDates(data.forecast as never) }
  },

  optimizeParams: async (params: OptimizeParams): Promise<OptimizeResult> =>
    (await mlAxios.post<OptimizeResult>('/optimize-params', params)).data,
}

// ─── ML WebSocket streaming (optimization trials & NN training epochs) ─────────

export interface OptimizeStreamHandlers {
  onIteration: (iteration: OptimizationIteration) => void
  onComplete: (result?: OptimizeResult) => void
  onError?: (message: string) => void
}

/**
 * Open a WebSocket to /ml/v1/ws/optimize, send the optimize request, and stream
 * each trial ({iteration, rmse, params}) to onIteration. Returns a cleanup fn.
 */
export function openOptimizeStream(request: OptimizeParams, handlers: OptimizeStreamHandlers): () => void {
  let closed = false
  const ws = new WebSocket(`${ML_WS_BASE}/ws/optimize`)

  ws.onopen = () => ws.send(JSON.stringify(request))
  ws.onmessage = (event: MessageEvent<string>) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.done) {
        handlers.onComplete(msg.result as OptimizeResult | undefined)
        closed = true
        ws.close()
      } else if (msg.type === 'error') {
        handlers.onError?.(String(msg.message))
        closed = true
        ws.close()
      } else if (typeof msg.iteration === 'number') {
        handlers.onIteration({ iteration: msg.iteration, rmse: msg.rmse, params: msg.params })
      }
    } catch {
      /* ignore malformed frames */
    }
  }
  ws.onerror = () => { if (!closed) handlers.onError?.('WebSocket connection error') }

  return () => { closed = true; ws.close() }
}

export interface TrainStreamHandlers {
  onEpoch: (epoch: number, loss: number) => void
  onComplete: () => void
  onError?: (message: string) => void
}

/** Open /ml/v1/ws/train and stream {epoch, loss} for NN (mlp / rnn) training. */
export function openTrainStream(
  request: RunMLParams | RunTSParams,
  handlers: TrainStreamHandlers,
): () => void {
  let closed = false
  const ws = new WebSocket(`${ML_WS_BASE}/ws/train`)

  ws.onopen = () => ws.send(JSON.stringify(request))
  ws.onmessage = (event: MessageEvent<string>) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.done) { handlers.onComplete(); closed = true; ws.close() }
      else if (msg.type === 'error') { handlers.onError?.(String(msg.message)); closed = true; ws.close() }
      else if (typeof msg.epoch === 'number') handlers.onEpoch(msg.epoch, msg.loss)
    } catch {
      /* ignore malformed frames */
    }
  }
  ws.onerror = () => { if (!closed) handlers.onError?.('WebSocket connection error') }

  return () => { closed = true; ws.close() }
}

// ─── LLM Pipeline API (Python :8002 /llm/v1) ───────────────────────────────────

export const llmApi = {
  tokenize: async (prompt: string): Promise<TokenizeResult> =>
    (await llmAxios.post<TokenizeResult>('/tokenize', { prompt })).data,

  encode: async (tokens: string[]): Promise<EncodeResult> =>
    (await llmAxios.post<EncodeResult>('/encode', { tokens })).data,

  embed: async (tokens: string[], ids: number[]): Promise<EmbedResult> =>
    (await llmAxios.post<EmbedResult>('/embed', { tokens, ids })).data,

  generate: async (prompt: string, tokens: string[], ids: number[]): Promise<GenerateResult> =>
    (await llmAxios.post<GenerateResult>('/generate', { prompt, tokens, ids })).data,

  cluster: async (points: EmbedResultPoint[], nClusters?: number): Promise<ClusterResult> =>
    (await llmAxios.post<ClusterResult>('/cluster', { points, n_clusters: nClusters })).data,
}

// ─── Backend Playground API (Go :8001 /api/v1 & /gql/v1) ───────────────────────

export interface GraphQLResult {
  data?: Record<string, unknown>
  errors?: Array<{ message: string; locations?: Array<{ line: number; column: number }> }>
}

export const backendApi = {
  executeGraphQL: async (request: GraphQLRequest): Promise<GraphQLResult> =>
    (await gqlAxios.post<GraphQLResult>('', request)).data,

  executeREST: async (request: RESTRequest): Promise<unknown> => {
    const { endpoint, method, params, body } = request
    // Drop empty query params so the backend applies its own defaults.
    const cleanParams = params
      ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null))
      : undefined
    const res = await restAxios.request({
      url: endpoint,
      method,
      params: cleanParams,
      data: body,
      // Return the response body for 4xx too (e.g. 404 {error,status}) instead of throwing,
      // so the REST explorer can display it like any other response.
      validateStatus: () => true,
    })
    return res.data
  },
}

export default axiosInstance
