import type {
  ScatterPoint,
  TimeSeriesPoint,
  HyperparameterDef,
  RegressionModel,
  ClassificationModel,
  ClusteringModel,
  TSModel,
  RESTEndpointDef,
} from '../types'

// ─── Scatter data ──────────────────────────────────────────────────────────────

function gaussianCluster(cx: number, cy: number, n: number, spread = 1): ScatterPoint[] {
  return Array.from({ length: n }, () => ({
    x: cx + (Math.random() - 0.5) * spread * 4,
    y: cy + (Math.random() - 0.5) * spread * 4,
  }))
}

export const regressionScatterData: ScatterPoint[] = Array.from({ length: 80 }, (_, i) => {
  const x = (i / 80) * 10
  const noise = (Math.random() - 0.5) * 2
  return { x, y: 2 * x + 1 + noise }
})

export const classificationScatterData: ScatterPoint[] = [
  ...gaussianCluster(2, 2, 40, 0.8).map(p => ({ ...p, label: 'Class A' })),
  ...gaussianCluster(6, 6, 40, 0.8).map(p => ({ ...p, label: 'Class B' })),
  ...gaussianCluster(2, 8, 30, 0.7).map(p => ({ ...p, label: 'Class C' })),
]

export const clusteringScatterData: ScatterPoint[] = [
  ...gaussianCluster(1, 1, 35, 0.7),
  ...gaussianCluster(6, 2, 35, 0.7),
  ...gaussianCluster(3, 7, 35, 0.7),
  ...gaussianCluster(8, 8, 25, 0.6),
]

// ─── Time series data ─────────────────────────────────────────────────────────

export function generateTimeSeriesData(n = 120): TimeSeriesPoint[] {
  const now = new Date()
  let value = 100
  return Array.from({ length: n }, (_, i) => {
    const date = new Date(now)
    date.setDate(now.getDate() - (n - i))
    const trend = i * 0.3
    const seasonal = 15 * Math.sin((2 * Math.PI * i) / 30)
    const noise = (Math.random() - 0.5) * 8
    value = 100 + trend + seasonal + noise
    return { date, value }
  })
}

export const timeSeriesData = generateTimeSeriesData()

export function generateForecastData(n = 30): TimeSeriesPoint[] {
  const now = new Date()
  const baseValue = timeSeriesData[timeSeriesData.length - 1]?.value ?? 140
  let value = baseValue
  return Array.from({ length: n }, (_, i) => {
    const date = new Date(now)
    date.setDate(now.getDate() + i + 1)
    const trend = i * 0.4
    const seasonal = 15 * Math.sin((2 * Math.PI * (120 + i)) / 30)
    const noise = (Math.random() - 0.5) * 5
    value = baseValue + trend + seasonal + noise
    return { date, value }
  })
}

// ─── Hyperparameter definitions ───────────────────────────────────────────────

export const regressionHyperparams: Record<RegressionModel, HyperparameterDef[]> = {
  elasticnet: [
    { name: 'alpha', label: 'Alpha', defaultValue: 1.0, min: 0, step: 0.01 },
    { name: 'l1_ratio', label: 'L1 Ratio', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
    { name: 'max_iter', label: 'Max Iterations', defaultValue: 1000, min: 100, step: 100 },
    { name: 'tol', label: 'Tolerance', defaultValue: 0.0001, min: 0, step: 0.0001 },
  ],
  lightgbm: [
    { name: 'n_estimators', label: 'N Estimators', defaultValue: 100, min: 10, step: 10 },
    { name: 'learning_rate', label: 'Learning Rate', defaultValue: 0.1, min: 0.001, max: 1, step: 0.001 },
    { name: 'num_leaves', label: 'Num Leaves', defaultValue: 31, min: 2, step: 1 },
    { name: 'max_depth', label: 'Max Depth', defaultValue: -1, step: 1 },
    { name: 'min_child_samples', label: 'Min Child Samples', defaultValue: 20, min: 1, step: 1 },
  ],
  nn: [
    { name: 'hidden_layers', label: 'Hidden Layers', defaultValue: 2, min: 1, max: 10, step: 1 },
    { name: 'neurons', label: 'Neurons per Layer', defaultValue: 64, min: 8, step: 8 },
    { name: 'learning_rate', label: 'Learning Rate', defaultValue: 0.001, min: 0.0001, step: 0.0001 },
    { name: 'epochs', label: 'Epochs', defaultValue: 100, min: 1, step: 10 },
    { name: 'batch_size', label: 'Batch Size', defaultValue: 32, min: 1, step: 8 },
  ],
}

export const classificationHyperparams: Record<ClassificationModel, HyperparameterDef[]> = {
  logistic_regression: [
    { name: 'C', label: 'C (Regularization)', defaultValue: 1.0, min: 0.001, step: 0.1 },
    { name: 'max_iter', label: 'Max Iterations', defaultValue: 100, min: 10, step: 10 },
    { name: 'tol', label: 'Tolerance', defaultValue: 0.0001, min: 0, step: 0.0001 },
  ],
  svm: [
    { name: 'C', label: 'C (Penalty)', defaultValue: 1.0, min: 0.001, step: 0.1 },
    { name: 'gamma', label: 'Gamma', defaultValue: 0.1, min: 0.0001, step: 0.01 },
    { name: 'degree', label: 'Degree (Poly)', defaultValue: 3, min: 1, max: 10, step: 1 },
    { name: 'coef0', label: 'Coef0', defaultValue: 0.0, step: 0.1 },
  ],
  lightgbm: [
    { name: 'n_estimators', label: 'N Estimators', defaultValue: 100, min: 10, step: 10 },
    { name: 'learning_rate', label: 'Learning Rate', defaultValue: 0.1, min: 0.001, max: 1, step: 0.001 },
    { name: 'num_leaves', label: 'Num Leaves', defaultValue: 31, min: 2, step: 1 },
    { name: 'max_depth', label: 'Max Depth', defaultValue: -1, step: 1 },
  ],
}

export const clusteringHyperparams: Record<ClusteringModel, HyperparameterDef[]> = {
  kmeans: [
    { name: 'n_clusters', label: 'N Clusters', defaultValue: 3, min: 2, max: 20, step: 1 },
    { name: 'max_iter', label: 'Max Iterations', defaultValue: 300, min: 10, step: 10 },
    { name: 'tol', label: 'Tolerance', defaultValue: 0.0001, min: 0, step: 0.0001 },
    { name: 'n_init', label: 'N Init', defaultValue: 10, min: 1, step: 1 },
  ],
  dbscan: [
    { name: 'eps', label: 'Epsilon', defaultValue: 0.5, min: 0.01, step: 0.01 },
    { name: 'min_samples', label: 'Min Samples', defaultValue: 5, min: 1, step: 1 },
    { name: 'leaf_size', label: 'Leaf Size', defaultValue: 30, min: 1, step: 5 },
  ],
}

export const tsHyperparams: Record<TSModel, HyperparameterDef[]> = {
  xgboost: [
    { name: 'n_estimators', label: 'N Estimators', defaultValue: 100, min: 10, step: 10 },
    { name: 'learning_rate', label: 'Learning Rate', defaultValue: 0.1, min: 0.001, max: 1, step: 0.001 },
    { name: 'max_depth', label: 'Max Depth', defaultValue: 6, min: 1, step: 1 },
    { name: 'subsample', label: 'Subsample', defaultValue: 0.8, min: 0.1, max: 1, step: 0.05 },
    { name: 'colsample_bytree', label: 'Colsample by Tree', defaultValue: 0.8, min: 0.1, max: 1, step: 0.05 },
  ],
  croston: [
    { name: 'alpha', label: 'Alpha (Demand)', defaultValue: 0.1, min: 0, max: 1, step: 0.01 },
    { name: 'beta', label: 'Beta (Interval)', defaultValue: 0.1, min: 0, max: 1, step: 0.01 },
  ],
  rnn: [
    { name: 'hidden_size', label: 'Hidden Size', defaultValue: 64, min: 8, step: 8 },
    { name: 'num_layers', label: 'Num Layers', defaultValue: 2, min: 1, max: 8, step: 1 },
    { name: 'learning_rate', label: 'Learning Rate', defaultValue: 0.001, min: 0.0001, step: 0.0001 },
    { name: 'epochs', label: 'Epochs', defaultValue: 50, min: 1, step: 5 },
    { name: 'sequence_length', label: 'Sequence Length', defaultValue: 30, min: 5, step: 5 },
  ],
}

// ─── REST Endpoints ───────────────────────────────────────────────────────────

export const restEndpoints: RESTEndpointDef[] = [
  {
    id: 'get-users',
    method: 'GET',
    path: '/users',
    description: 'Retrieve a paginated list of users',
    params: [
      { name: 'page', type: 'number', required: false, description: 'Page number', defaultValue: 1, location: 'query' },
      { name: 'limit', type: 'number', required: false, description: 'Items per page', defaultValue: 20, location: 'query' },
    ],
  },
  {
    id: 'get-user-by-id',
    method: 'GET',
    path: '/users/:id',
    description: 'Retrieve a single user by ID',
    params: [
      { name: 'id', type: 'string', required: true, description: 'User UUID', location: 'path' },
    ],
  },
  {
    id: 'post-users',
    method: 'POST',
    path: '/users',
    description: 'Create a new user',
    params: [
      { name: 'name', type: 'string', required: true, description: 'Full name', location: 'body' },
      { name: 'email', type: 'string', required: true, description: 'Email address', location: 'body' },
      { name: 'role', type: 'string', required: false, description: 'User role (admin|user|viewer)', defaultValue: 'user', location: 'body' },
    ],
  },
  {
    id: 'get-models',
    method: 'GET',
    path: '/models',
    description: 'List available ML models',
    params: [
      { name: 'task_type', type: 'string', required: false, description: 'regression|classification|clustering', location: 'query' },
    ],
  },
  {
    id: 'post-predict',
    method: 'POST',
    path: '/predict',
    description: 'Run inference on a deployed model',
    params: [
      { name: 'model_id', type: 'string', required: true, description: 'Model identifier', location: 'body' },
      { name: 'features', type: 'string', required: true, description: 'JSON array of feature values', location: 'body' },
    ],
  },
  {
    id: 'get-metrics',
    method: 'GET',
    path: '/metrics',
    description: 'Retrieve evaluation metrics for a trained model',
    params: [
      { name: 'model_id', type: 'string', required: true, description: 'Model identifier', location: 'query' },
      { name: 'split', type: 'string', required: false, description: 'train|val|test', defaultValue: 'test', location: 'query' },
    ],
  },
  {
    id: 'delete-model',
    method: 'DELETE',
    path: '/models/:id',
    description: 'Delete a deployed model',
    params: [
      { name: 'id', type: 'string', required: true, description: 'Model identifier', location: 'path' },
    ],
  },
]

// ─── Mock API responses ───────────────────────────────────────────────────────

export const mockRESTResponses: Record<string, unknown> = {
  'get-users': {
    data: [
      { id: 'usr_01', name: 'Alice Thornton', email: 'alice@example.com', role: 'admin', created_at: '2024-01-15T09:12:00Z' },
      { id: 'usr_02', name: 'Bob Marlowe', email: 'bob@example.com', role: 'user', created_at: '2024-02-03T14:30:00Z' },
      { id: 'usr_03', name: 'Clara Voss', email: 'clara@example.com', role: 'viewer', created_at: '2024-03-22T11:00:00Z' },
    ],
    meta: { page: 1, limit: 20, total: 3 },
  },
  'get-user-by-id': {
    id: 'usr_01',
    name: 'Alice Thornton',
    email: 'alice@example.com',
    role: 'admin',
    created_at: '2024-01-15T09:12:00Z',
    last_login: '2025-05-10T08:45:00Z',
  },
  'post-users': { id: 'usr_04', name: 'New User', email: 'new@example.com', role: 'user', created_at: new Date().toISOString() },
  'get-models': {
    models: [
      { id: 'mdl_elasticnet_01', name: 'ElasticNet v1', task: 'regression', status: 'deployed', rmse: 0.42 },
      { id: 'mdl_lgbm_01', name: 'LightGBM v3', task: 'classification', status: 'deployed', f1: 0.91 },
      { id: 'mdl_rnn_01', name: 'RNN Forecaster', task: 'timeseries', status: 'training', rmse: null },
    ],
  },
  'post-predict': { predictions: [2.71, 4.82, 1.95, 7.34, 3.16], model_id: 'mdl_lgbm_01', latency_ms: 12 },
  'get-metrics': {
    model_id: 'mdl_lgbm_01', split: 'test',
    metrics: { accuracy: 0.923, f1: 0.918, precision: 0.931, recall: 0.906, auc_roc: 0.971 },
  },
  'delete-model': { success: true, message: 'Model deleted successfully' },
}

export const mockGraphQLResponse = {
  data: {
    users: [
      { id: 'usr_01', name: 'Alice Thornton', email: 'alice@example.com', role: 'admin' },
      { id: 'usr_02', name: 'Bob Marlowe', email: 'bob@example.com', role: 'user' },
    ],
  },
}

export const defaultGraphQLQuery = `query GetUsers {
  users(limit: 10, offset: 0) {
    id
    name
    email
    role
    createdAt
  }
}

# Mutation example:
# mutation CreateUser($input: CreateUserInput!) {
#   createUser(input: $input) {
#     id
#     name
#     email
#   }
# }`
