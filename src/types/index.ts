// ─── Chart data ───────────────────────────────────────────────────────────────

export interface ScatterPoint {
  x: number
  y: number
  label?: string
}

export interface TimeSeriesPoint {
  date: Date
  value: number
}

// ─── ML Models ────────────────────────────────────────────────────────────────

export type MLTask = 'regression' | 'classification' | 'clustering'

export type RegressionModel = 'elasticnet' | 'lightgbm' | 'nn'
export type ClassificationModel = 'logistic_regression' | 'svm' | 'lightgbm'
export type ClusteringModel = 'kmeans' | 'dbscan'
export type TSModel = 'xgboost' | 'croston' | 'rnn'

export interface HyperparameterDef {
  name: string
  label: string
  defaultValue: number
  min?: number
  max?: number
  step?: number
}

export interface HyperparameterValues {
  [key: string]: number
}

// ─── Optimization ─────────────────────────────────────────────────────────────

export type OptimizeMethod = 'gridsearch' | 'tpe' | 'genetic'

export interface SearchSpaceBound {
  param: string
  min: number
  max: number
  step?: number
}

export interface GridSearchConfig {
  bounds: SearchSpaceBound[]
}

export interface TPEConfig {
  n_trials: number
  n_startup_trials: number
  bounds: Omit<SearchSpaceBound, 'step'>[]
}

export interface GeneticConfig {
  population_size: number
  n_generations: number
  mutation_rate: number
  crossover_rate: number
}

export type OptimizeConfig = GridSearchConfig | TPEConfig | GeneticConfig

// ─── API payloads ─────────────────────────────────────────────────────────────

export interface RunMLParams {
  task: MLTask
  model: string
  hyperparameters: HyperparameterValues
}

export interface RunTSParams {
  model: TSModel
  hyperparameters: HyperparameterValues
}

export interface OptimizeParams {
  task: MLTask | 'timeseries'
  model: string
  method: OptimizeMethod
  config: OptimizeConfig
}

export interface GraphQLRequest {
  query: string
  variables?: Record<string, unknown>
}

export interface RESTRequest {
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  params?: Record<string, string | number | boolean>
  body?: Record<string, unknown>
}

// ─── WebSocket ────────────────────────────────────────────────────────────────

export type WSStatus = 'connecting' | 'open' | 'closed' | 'error'

export interface WSMessage {
  id: string
  timestamp: Date
  direction: 'sent' | 'received'
  data: string
}

// ─── REST Endpoint definitions ────────────────────────────────────────────────

export interface EndpointParam {
  name: string
  type: 'string' | 'number' | 'boolean'
  required: boolean
  description: string
  defaultValue?: string | number | boolean
  location: 'query' | 'path' | 'body'
}

export interface RESTEndpointDef {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  params: EndpointParam[]
}
