import type {
  ScatterPoint,
  TimeSeriesPoint,
  HyperparameterDef,
  RegressionModel,
  ClassificationModel,
  ClusteringModel,
  TSModel,
  CVMetrics,
  OptimizationIteration,
  RESTEndpointDef,
  Dataset,
  ModelDefinition,
  GraphQLDoc,
} from '../types'

// ─── PCA variance constants ───────────────────────────────────────────────────

export const IRIS_PC_VARIANCE = { pc1: 72.96, pc2: 22.85 }
export const BLOBS_PC_VARIANCE = { pc1: 68.4, pc2: 21.7 }
export const BREAST_CANCER_PC_VARIANCE = { pc1: 44.3, pc2: 19.0 }

// ─── Scatter data ──────────────────────────────────────────────────────────────

function gaussianCluster(cx: number, cy: number, n: number, spread = 1): ScatterPoint[] {
  return Array.from({ length: n }, () => ({
    x: cx + (Math.random() - 0.5) * spread * 4,
    y: cy + (Math.random() - 0.5) * spread * 4,
  }))
}

// California Housing subset — stores all features; x defaults to MedInc
export const regressionScatterData: ScatterPoint[] = Array.from({ length: 80 }, () => {
  const medInc = 0.5 + Math.random() * 12.5
  const houseAge = parseFloat((5 + Math.random() * 47).toFixed(1))
  const aveRooms = parseFloat((1.5 + Math.random() * 8.5).toFixed(2))
  const population = Math.floor(200 + Math.random() * 5000)
  const aveOccup = parseFloat((1.5 + Math.random() * 4.5).toFixed(2))
  const noise = (Math.random() - 0.5) * 0.9
  const y = Math.max(0.15, Math.min(5.0, 0.33 * medInc + 0.008 * houseAge + 0.04 * aveRooms + noise))
  return {
    x: medInc,
    y,
    features: { MedInc: medInc, HouseAge: houseAge, AveRooms: aveRooms, Population: population, AveOccup: aveOccup },
  }
})

// Feature display labels for the regression X-axis selector
export const REGRESSION_FEATURES: Array<{ key: string; label: string }> = [
  { key: 'MedInc', label: 'Median Income (MedInc)' },
  { key: 'HouseAge', label: 'House Age (years)' },
  { key: 'AveRooms', label: 'Average Rooms' },
  { key: 'Population', label: 'Population' },
  { key: 'AveOccup', label: 'Avg. Occupants' },
]

// Seeded train/test split using Fisher-Yates shuffle with a simple LCG
export function applySeededSplit(data: ScatterPoint[], seed: number, trainFrac = 0.7): ScatterPoint[] {
  let s = seed | 0
  const lcg = () => { s = (Math.imul(s, 1664525) + 1013904223) | 0; return (s >>> 0) / 0x100000000 }
  const indices = Array.from({ length: data.length }, (_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(lcg() * (i + 1));
    [indices[i], indices[j]] = [indices[j]!, indices[i]!]
  }
  const trainSet = new Set(indices.slice(0, Math.floor(data.length * trainFrac)))
  return data.map((p, i) => ({ ...p, isTrain: trainSet.has(i) }))
}

// Iris dataset projected to first two PCs (sklearn PCA on standardized features)
// PC1: driven by petal length/width; PC2: driven by sepal width
// Setosa is well-separated; Versicolor and Virginica overlap slightly
export const classificationScatterData: ScatterPoint[] = [
  ...gaussianCluster(-2.1, 0.35, 50, 0.33).map(p => ({ ...p, label: 'Setosa' })),
  ...gaussianCluster(0.75, -0.5, 50, 0.44).map(p => ({ ...p, label: 'Versicolor' })),
  ...gaussianCluster(2.2, -0.65, 50, 0.48).map(p => ({ ...p, label: 'Virginica' })),
]

// Diabetes dataset — BMI (x: 0.02–0.18) vs disease progression (y: 30–350), moderate positive correlation
export const diabetesScatterData: ScatterPoint[] = Array.from({ length: 60 }, () => {
  const bmi = parseFloat((0.02 + Math.random() * 0.16).toFixed(3))
  const age = parseFloat((-0.10 + Math.random() * 0.22).toFixed(3))
  const bp  = parseFloat((-0.08 + Math.random() * 0.20).toFixed(3))
  const s5  = parseFloat((-0.12 + bmi * 0.6 + (Math.random() - 0.5) * 0.10).toFixed(3))
  const noise = (Math.random() - 0.5) * 80
  const y = Math.max(30, Math.min(350, 1400 * bmi + 30 + noise))
  return { x: bmi, y, features: { BMI: bmi, Age: age, BloodPressure: bp, S5: s5 } }
})

export const DIABETES_FEATURES: Array<{ key: string; label: string }> = [
  { key: 'BMI', label: 'BMI' },
  { key: 'Age', label: 'Age' },
  { key: 'BloodPressure', label: 'Blood Pressure (BP)' },
  { key: 'S5', label: 'Serum Triglycerides (S5)' },
]

// Breast Cancer Wisconsin — 2-class PCA projection; Malignant clustered tighter and left, Benign wider spread right
export const breastCancerScatterData: ScatterPoint[] = [
  ...gaussianCluster(-2.2, 0.1, 40, 0.5).map(p => ({ ...p, label: 'Malignant' })),
  ...gaussianCluster(2.8, 0.2, 40, 0.85).map(p => ({ ...p, label: 'Benign' })),
]

// Blobs clustering data — generate once so base and labeled share identical coordinates
const _blob1 = gaussianCluster(1, 1, 35, 0.7)
const _blob2 = gaussianCluster(6, 2, 35, 0.7)
const _blob3 = gaussianCluster(3, 7, 35, 0.7)
const _blob4 = gaussianCluster(8, 8, 25, 0.6)

export const clusteringBaseData: ScatterPoint[] = [..._blob1, ..._blob2, ..._blob3, ..._blob4]

export const clusteringScatterData: ScatterPoint[] = [
  ..._blob1.map(p => ({ ...p, label: 'Cluster 1' })),
  ..._blob2.map(p => ({ ...p, label: 'Cluster 2' })),
  ..._blob3.map(p => ({ ...p, label: 'Cluster 3' })),
  ..._blob4.map(p => ({ ...p, label: 'Cluster 4' })),
]

// Moons dataset — two interleaving crescent shapes; no labels for initial unclustered view
function crescent(cx: number, cy: number, n: number, arc: number, flip = false): ScatterPoint[] {
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * arc + (flip ? Math.PI : 0)
    const r = 1.5 + (Math.random() - 0.5) * 0.4
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  })
}
const _moonA = crescent(1, 0.5, 50, 1)
const _moonB = crescent(2, -0.3, 50, 1, true)

export const moonsBaseData: ScatterPoint[] = [..._moonA, ..._moonB]
export const moonsScatterData: ScatterPoint[] = [
  ..._moonA.map(p => ({ ...p, label: 'Crescent A' })),
  ..._moonB.map(p => ({ ...p, label: 'Crescent B' })),
]

// Dataset → initial scatter data map (used when switching dataset selectors)
export const DATASET_BASE_DATA: Record<string, ScatterPoint[]> = {
  california_housing: regressionScatterData,
  diabetes: diabetesScatterData,
  iris: classificationScatterData,
  breast_cancer: breastCancerScatterData,
  blobs: clusteringBaseData,
  moons: moonsBaseData,
}

// ─── Time series data ─────────────────────────────────────────────────────────

// Real Air Passengers dataset (Box & Jenkins, 1976) — Jan 1949 to Dec 1960
const _airPassengersRaw = [
  112,118,132,129,121,135,148,148,136,119,104,118,
  115,126,141,135,125,149,170,170,158,133,114,140,
  145,150,178,163,172,178,199,199,184,162,146,166,
  171,180,193,181,183,218,230,242,209,191,172,194,
  196,196,236,235,229,243,264,272,237,211,180,201,
  204,188,235,227,234,264,302,293,259,229,203,229,
  242,233,267,269,270,315,364,347,312,274,237,278,
  284,277,317,313,318,374,413,405,355,306,271,306,
  315,301,356,348,355,422,465,467,404,347,305,336,
  340,318,362,348,363,435,491,505,404,359,310,337,
  360,342,406,396,420,472,548,559,463,407,362,405,
  417,391,419,461,472,535,622,606,508,461,390,432,
]

export function generateAirPassengersData(): TimeSeriesPoint[] {
  const start = new Date(1949, 0, 1)
  return _airPassengersRaw.map((value, i) => {
    const date = new Date(start)
    date.setMonth(i)
    return { date, value }
  })
}

export const timeSeriesData: TimeSeriesPoint[] = generateAirPassengersData()

export function generateETTh1Data(): TimeSeriesPoint[] {
  const start = new Date(2016, 0, 1)
  let v = 22
  return Array.from({ length: 144 }, (_, i) => {
    const date = new Date(start)
    date.setDate(i + 1)
    const seasonal = 8 * Math.sin((2 * Math.PI * (i % 24)) / 24)
    const trend = i * 0.02
    const noise = (Math.random() - 0.5) * 3
    v = Math.max(8, Math.min(42, 22 + seasonal + trend + noise))
    return { date, value: v }
  })
}

export const ettH1Data: TimeSeriesPoint[] = generateETTh1Data()

export function generateTimeSeriesData(): TimeSeriesPoint[] {
  return generateAirPassengersData()
}

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

export function generateAlignedForecast(historical: TimeSeriesPoint[]): TimeSeriesPoint[] {
  const split = Math.floor(historical.length * 0.7)
  const testSlice = historical.slice(split)
  if (testSlice.length === 0) return []
  const lastTrainValue = historical[split - 1]?.value ?? 100
  const trainSlice = historical.slice(0, split)
  const trend = trainSlice.length > 1
    ? (trainSlice[trainSlice.length - 1]!.value - trainSlice[0]!.value) / trainSlice.length
    : 0
  return testSlice.map((point, i) => {
    // Monthly seasonality approximation (period 12)
    const seasonal = lastTrainValue * 0.12 * Math.sin((2 * Math.PI * (split + i)) / 12)
    const noise = (Math.random() - 0.5) * lastTrainValue * 0.04
    return { date: point.date, value: Math.max(0, lastTrainValue + trend * i * 0.5 + seasonal + noise) }
  })
}

export function generateTestPredictions(
  data: ScatterPoint[],
  trainSize: number,
  mode: 'regression' | 'classification' = 'regression',
): ScatterPoint[] {
  const testPoints = data.some(p => p.isTrain !== undefined)
    ? data.filter(p => !p.isTrain)
    : data.slice(trainSize)
  if (mode === 'classification') {
    const allLabels = [...new Set(data.map(p => p.label ?? 'Data'))]
    return testPoints.map(p => {
      const isCorrect = Math.random() > 0.15
      const trueLabel = p.label ?? 'Data'
      const otherLabels = allLabels.filter(l => l !== trueLabel)
      const predictedLabel = isCorrect
        ? trueLabel
        : (otherLabels[Math.floor(Math.random() * otherLabels.length)] ?? trueLabel)
      const predictedProb = isCorrect
        ? 0.75 + Math.random() * 0.22
        : 0.40 + Math.random() * 0.35
      return { ...p, correct: isCorrect, predictedLabel, predictedProb }
    })
  }
  return testPoints.map(p => ({
    ...p,
    realValue: p.y,
    y: p.y * (0.88 + Math.random() * 0.25) + (Math.random() - 0.5) * 0.5,
  }))
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
  mlp: [
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
  lightgbm: [
    { name: 'n_estimators', label: 'N Estimators', defaultValue: 100, min: 10, step: 10 },
    { name: 'learning_rate', label: 'Learning Rate', defaultValue: 0.1, min: 0.001, max: 1, step: 0.001 },
    { name: 'num_leaves', label: 'Num Leaves', defaultValue: 31, min: 2, step: 1 },
    { name: 'max_depth', label: 'Max Depth', defaultValue: -1, step: 1 },
    { name: 'min_child_samples', label: 'Min Child Samples', defaultValue: 20, min: 1, step: 1 },
  ],
  tes: [
    { name: 'alpha', label: 'Alpha (Level)', defaultValue: 0.3, min: 0, max: 1, step: 0.01 },
    { name: 'beta', label: 'Beta (Trend)', defaultValue: 0.1, min: 0, max: 1, step: 0.01 },
    { name: 'gamma', label: 'Gamma (Season)', defaultValue: 0.1, min: 0, max: 1, step: 0.01 },
    { name: 'seasonal_periods', label: 'Seasonal Periods', defaultValue: 12, min: 1, max: 52, step: 1 },
  ],
  rnn: [
    { name: 'hidden_size', label: 'Hidden Size', defaultValue: 64, min: 8, step: 8 },
    { name: 'num_layers', label: 'Num Layers', defaultValue: 2, min: 1, max: 8, step: 1 },
    { name: 'learning_rate', label: 'Learning Rate', defaultValue: 0.001, min: 0.0001, step: 0.0001 },
    { name: 'epochs', label: 'Epochs', defaultValue: 50, min: 1, step: 5 },
    { name: 'sequence_length', label: 'Sequence Length', defaultValue: 30, min: 5, step: 5 },
  ],
}

// ─── Datasets ─────────────────────────────────────────────────────────────────

export const DATASETS: Dataset[] = [
  { id: 'iris', name: 'Iris', type: 'classification', description: 'Classic multiclass dataset with 3 flower species described by 4 morphological features.', rows: 150, features: ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'] },
  { id: 'breast_cancer', name: 'Breast Cancer Wisconsin', type: 'classification', description: 'Binary classification of malignant vs benign tumors from 30 numeric cell-nucleus features.', rows: 569, features: ['radius_mean', 'texture_mean', 'perimeter_mean', 'area_mean', 'smoothness_mean', '...25 more'] },
  { id: 'california_housing', name: 'California Housing', type: 'regression', description: 'Predict median house values in California census blocks using 8 socioeconomic features.', rows: 20640, features: ['MedInc', 'HouseAge', 'AveRooms', 'AveBedrms', 'Population', 'AveOccup', 'Latitude', 'Longitude'] },
  { id: 'diabetes', name: 'Diabetes', type: 'regression', description: 'Predict disease progression one year after baseline from 10 clinical variables.', rows: 442, features: ['age', 'sex', 'bmi', 'bp', 's1', 's2', 's3', 's4', 's5', 's6'] },
  { id: 'blobs', name: 'Blobs', type: 'clustering', description: 'Synthetic isotropic Gaussian clusters — ideal for benchmarking centroid-based methods.', rows: 300, features: ['x', 'y'] },
  { id: 'moons', name: 'Moons', type: 'clustering', description: 'Two interleaving half-circle shapes — a non-convex challenge for distance-based clustering.', rows: 200, features: ['x', 'y'] },
  { id: 'air_passengers', name: 'Air Passengers', type: 'timeseries', description: 'Monthly totals of international airline passengers from 1949 to 1960. Strong trend and seasonality.', rows: 144, features: ['month', 'passengers'] },
  { id: 'etth1', name: 'ETTh1', type: 'timeseries', description: 'Electricity transformer temperature — hourly oil temperature and power load readings over two years.', rows: 17420, features: ['date', 'HUFL', 'HULL', 'MUFL', 'MULL', 'LUFL', 'LULL', 'OT'] },
]

// ─── Model definitions ────────────────────────────────────────────────────────

export const MODEL_DEFINITIONS: ModelDefinition[] = [
  { id: 'elasticnet', name: 'ElasticNet', type: 'regression', description: 'Linear model combining L1 and L2 regularization. Robust for sparse, high-dimensional data.' },
  { id: 'lightgbm_reg', name: 'LightGBM', type: 'regression', description: 'Fast gradient boosted decision trees with leaf-wise growth. Handles large datasets efficiently.' },
  { id: 'mlp', name: 'Multi-Layer Perceptron', type: 'regression', description: 'Fully connected feedforward network (PyTorch). Flexible universal approximator for non-linear relationships.' },
  { id: 'logistic_regression', name: 'Logistic Regression', type: 'classification', description: 'Linear probabilistic classifier. Fast, interpretable, and a strong baseline for binary and multiclass tasks.' },
  { id: 'svm', name: 'SVM', type: 'classification', description: 'Support Vector Machine with kernel trick. Effective in high-dimensional spaces with clear margins.' },
  { id: 'lightgbm_cls', name: 'LightGBM', type: 'classification', description: 'Gradient boosted trees optimized for classification. Excellent accuracy with a low memory footprint.' },
  { id: 'kmeans', name: 'K-Means', type: 'clustering', description: 'Centroid-based partitioning into k clusters. Simple, fast, and effective for spherical cluster shapes.' },
  { id: 'dbscan', name: 'DBSCAN', type: 'clustering', description: 'Density-based clustering that discovers arbitrary shapes and marks low-density points as outliers.' },
  { id: 'lightgbm_ts', name: 'LightGBM', type: 'timeseries', description: 'Gradient boosted trees adapted for time series via lag features and rolling window statistics.' },
  { id: 'tes', name: 'Triple Exp. Smoothing', type: 'timeseries', description: 'Holt-Winters method — separately smooths level, trend, and seasonality components via exponential weighting.' },
  { id: 'rnn', name: 'GRU (RNN)', type: 'timeseries', description: 'Gated Recurrent Unit network that captures long-range temporal dependencies across a sliding input window.' },
]

// ─── Production URLs ──────────────────────────────────────────────────────────

export const REST_PROD_URL = 'sashar.dev/api/v1'
export const GQL_PROD_URL = 'sashar.dev/gql/v1'

// ─── CV data (used by REST and GraphQL API mocks) ─────────────────────────────

export const CV_DATA = {
  summary: 'Engineer with 9+ years of experience across machine learning, backend systems, and data science. Currently a Senior ML Engineer at Udemy building recommendation and promotion systems at scale, and Technical Lead at Sistemas Agaricus designing microservice backends in Go and Elixir. Proven track record delivering production ML systems ranging from deep RL and LLM applications to time series forecasting and anomaly detection, with a rigorous quantitative foundation in Physics and Risk Management.',
  experience: [
    { title: 'Senior Machine Learning Engineer', org: 'Udemy · Remote', period: '2025 – Present', startYear: '2025', bullets: ['Leading automation of behavior-based promotions using traditional ML and deep reinforcement learning.', 'Building personalized recommendation systems for email and push notification channels; running A/B experiments across strategies.', 'Contributing to the microservices migration of the recommendations infrastructure.'] },
    { title: 'Founding Backend Engineer / Technical Lead', org: 'Sistemas Agaricus · Mexico', period: '2025 – Present', startYear: '2025', bullets: ['Defined system architecture for multiple web and mobile products from the ground up.', 'Built a Go + gRPC microservice backend for a local eTicketing platform and an Elixir microservice backend for a fintech application.', 'Delivered a .NET web application for automated invoice processing and accounting workflows.'] },
    { title: 'Data Science Technical Lead', org: 'Valiot · Mexico', period: '2023 – 2025', startYear: '2023', bullets: ['Directed data science teams through the full product lifecycle: PoC, proof of value, development, and deployment.', 'Designed and built an LLM-powered chatbot enabling natural-language interaction with industrial software.', 'Developed internal Python libraries for NN optimization (NEAT, Tabu Search), metaheuristic algorithms (GA, SA, PSO), fuzzy logic, and anomaly detection.'] },
    { title: 'Senior Data Scientist / Software Engineer', org: 'Valiot · Mexico', period: '2022 – 2023', startYear: '2022', bullets: ['Built a low-code time series forecasting solution adopted across multiple manufacturing clients.', 'Developed anomaly detection libraries for time series and tabular data in production IoT pipelines.', 'Deployed CI/CD pipelines for AI model lifecycle management.'] },
    { title: 'Lead Data Scientist', org: 'Junction AI · Remote', period: '2021 – 2022', startYear: '2021', bullets: ['Developed NLP pipelines for e-commerce listings: topic extraction, relevance scoring, and AI-driven title generation.', 'Researched and deployed a modular demand forecasting pipeline using neural networks, Bayesian models, and time series methods.'] },
    { title: 'Analytic Consultant / Data Scientist', org: 'Fair Isaac Corporation (FICO) · Remote', period: '2020 – 2021', startYear: '2020', bullets: ['Developed ML models to optimize credit decisions for international financial institutions.', 'Built analytical tools and data pipelines in Python and PySpark.'] },
    { title: 'Business Intelligence Analyst', org: 'Garena Online Private Limited · Mexico City, MX', period: '2019 – 2020', startYear: '2019', bullets: ['Built predictive models using supervised and unsupervised ML to forecast mobile game user quantities.', 'Identified high-value audience segments to develop social media strategies that increased revenue.'] },
  ],
  education: [
    { title: 'M.Sc. Risk Management', org: 'Instituto Tecnológico Autónomo de México (ITAM)', period: '2025', startYear: '2025', bullets: ['Quantitative focus: financial risk models, statistical inference, and stochastic processes.', 'Thesis (Special Mention): An Automated System for Time Series Prediction Applied to Stock Market Prices and Returns.'] },
    { title: 'B.Sc. Physics', org: 'Universidad de Guadalajara', period: '2015', startYear: '2015', bullets: ['Focus: Lie Algebras, Quantum Mechanics, Statistical Mechanics, and Dynamical Systems.', 'Worked two years with the Quantum Optics and Quantum Information group led by Andrei Klimov, Ph.D.'] },
  ],
  publications: [
    { title: 'A Deep Reinforcement Learning Approach to Modeling Rat Behavior in Peak Interval Procedure', venue: 'Timing Research Forum 4 · University of Tokyo, Japan · 2025', href: 'https://github.com/chnnxyz/trfjpn' },
    { title: 'Kicked Harmonic Oscillator', venue: 'Congreso Nacional de Física 2013 · Oct 14, 2013', href: null },
  ],
  languages: [
    { lang: 'Spanish', level: 'Native' },
    { lang: 'English', level: 'Professional' },
    { lang: 'Japanese', level: 'N4' },
  ],
  techStack: ['Python', 'Go', 'Rust', 'Elixir', 'R', 'C/C++', 'C#', 'JavaScript', 'FastAPI', 'gRPC', 'GraphQL', 'React', 'Vue', 'Redis', 'PostgreSQL', 'MongoDB', 'Spark', 'PySpark', 'ETL', 'AWS', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'Git'],
  interests: ['Reinforcement Learning', 'Bayesian ML', 'Time Series', 'Metaheuristics', 'LLMs', 'Systems Programming', 'Neuro-Fuzzy Systems', 'Open Source'],
}

// ─── REST Endpoints ───────────────────────────────────────────────────────────

export const restEndpoints: RESTEndpointDef[] = [
  {
    id: 'get-cv',
    method: 'GET',
    path: '/cv',
    description: 'Return the full CV as a structured JSON object',
    params: [],
  },
  {
    id: 'get-cv-section',
    method: 'GET',
    path: '/cv/:section',
    description: 'Return a specific CV section, with optional filters for list sections',
    params: [
      { name: 'section', type: 'string', required: true, description: 'summary | experience | education | publications | languages | techStack | interests', location: 'path' },
      { name: 'numEntries', type: 'integer', required: false, description: 'Max entries to return (default: all)', location: 'query' },
      { name: 'startYear', type: 'string', required: false, description: 'Filter entries at or after this year, e.g. "2022"', location: 'query' },
      { name: 'initialEntries', type: 'integer', required: false, description: 'Take only the first N entries before other filters', location: 'query' },
    ],
  },
  {
    id: 'post-contact',
    method: 'POST',
    path: '/contact',
    description: 'Send a contact message',
    params: [
      { name: 'name', type: 'string', required: true, description: 'Your name', location: 'body' },
      { name: 'email', type: 'string', required: true, description: 'Your email address', location: 'body' },
      { name: 'message', type: 'string', required: true, description: 'Your message', location: 'body' },
    ],
  },
  {
    id: 'get-datasets',
    method: 'GET',
    path: '/datasets',
    description: 'List available datasets, optionally filtered by type',
    params: [
      { name: 'type', type: 'string', required: false, description: 'classification | regression | clustering | timeseries', location: 'query' },
    ],
  },
  {
    id: 'get-models',
    method: 'GET',
    path: '/models',
    description: 'List available ML models with descriptions, optionally filtered by type',
    params: [
      { name: 'type', type: 'string', required: false, description: 'regression | classification | clustering | timeseries', location: 'query' },
    ],
  },
]

// ─── GraphQL schema docs (for the sidebar) ────────────────────────────────────

export const GRAPHQL_SCHEMA_DOCS: GraphQLDoc[] = [
  {
    name: 'cv',
    kind: 'query',
    args: [],
    description: 'Returns the full CV including summary, experience, education, publications, languages, tech stack, and interests.',
    exampleQuery: `query {\n  cv {\n    summary\n    languages { lang level }\n    techStack\n    interests\n  }\n}`,
  },
  {
    name: 'cvSection',
    kind: 'query',
    args: [
      { name: 'section', type: 'String!', required: true, description: 'CV section to retrieve', values: ['summary', 'experience', 'education', 'publications', 'languages', 'techStack', 'interests'] },
      { name: 'numEntries', type: 'Int', required: false, description: 'Max number of list items returned (default: all)' },
      { name: 'startYear', type: 'String', required: false, description: 'Filter list entries from this year onwards, e.g. "2022"' },
      { name: 'initialEntries', type: 'Int', required: false, description: 'Take only the first N entries before applying other filters' },
    ],
    description: 'Returns a single CV section. Valid values: summary, experience, education, publications, languages, techStack, interests. List sections (experience, education) support optional filters: numEntries, startYear, initialEntries.',
    exampleQuery: `query {\n  cvSection(\n    section: "experience"\n    startYear: "2022"\n    numEntries: 3\n  ) {\n    title\n    org\n    period\n    startYear\n    bullets\n  }\n}`,
  },
  {
    name: 'datasets',
    kind: 'query',
    args: [{ name: 'type', type: 'String', required: false, description: 'Filter by dataset category', values: ['classification', 'regression', 'clustering', 'timeseries'] }],
    description: 'Returns available datasets. Filter by type: classification, regression, clustering, or timeseries.',
    exampleQuery: `query {\n  datasets(type: "classification") {\n    id\n    name\n    rows\n    description\n    features\n  }\n}`,
  },
  {
    name: 'models',
    kind: 'query',
    args: [{ name: 'type', type: 'String', required: false, description: 'Filter by model category', values: ['regression', 'classification', 'clustering', 'timeseries'] }],
    description: 'Returns available ML models with descriptions. Filter by type: regression, classification, clustering, or timeseries.',
    exampleQuery: `query {\n  models(type: "timeseries") {\n    id\n    name\n    description\n  }\n}`,
  },
  {
    name: 'sendContact',
    kind: 'mutation',
    args: [
      { name: 'name', type: 'String!', required: true, description: 'Sender full name' },
      { name: 'email', type: 'String!', required: true, description: 'Sender email address' },
      { name: 'message', type: 'String!', required: true, description: 'Message body' },
    ],
    description: 'Sends a contact message. Returns a success confirmation.',
    exampleQuery: `mutation {\n  sendContact(\n    name: "Jane"\n    email: "jane@example.com"\n    message: "Hello!"\n  ) {\n    success\n    message\n  }\n}`,
  },
]

export const defaultGraphQLQuery = `query {
  datasets(type: "classification") {
    id
    name
    rows
    description
    features
  }
}`

// ─── CV metrics generator ─────────────────────────────────────────────────────

export function generateCVMetrics(totalSamples: number, baseRMSE: number): CVMetrics {
  const trainSize = Math.floor(totalSamples * 0.7)
  const testSize = totalSamples - trainSize
  const trainRMSE = baseRMSE * (0.78 + Math.random() * 0.06)
  const testRMSE = baseRMSE * (1.0 + Math.random() * 0.12)
  const cvFolds = Array.from({ length: 5 }, () =>
    baseRMSE * (0.88 + Math.random() * 0.26),
  )
  return { trainRMSE, testRMSE, trainSize, testSize, cvFolds }
}

// ─── Optimization stream simulator ───────────────────────────────────────────

export function simulateOptimizationStream(
  paramDefs: HyperparameterDef[],
  nIterations: number,
  onIteration: (data: OptimizationIteration) => void,
  onComplete: () => void,
): () => void {
  let stopped = false
  let i = 0
  const startRMSE = 0.52 + Math.random() * 0.28
  const floor = 0.08 + Math.random() * 0.1
  const delayMs = Math.max(55, Math.floor(4800 / nIterations))

  function tick() {
    if (stopped) return
    i++
    const decay = Math.exp(-(i / nIterations) * 3.2)
    const noise = (Math.random() - 0.5) * 0.055
    const rmse = Math.max(floor, floor + (startRMSE - floor) * decay + noise)

    const params: Record<string, number> = Object.fromEntries(
      paramDefs.map(d => [
        d.name,
        +(d.defaultValue * (0.4 + Math.random() * 1.3)).toFixed(4),
      ]),
    )

    onIteration({ iteration: i, rmse, params })

    if (i < nIterations) {
      setTimeout(tick, delayMs + (Math.random() - 0.5) * 25)
    } else {
      onComplete()
    }
  }

  setTimeout(tick, 60)
  return () => { stopped = true }
}
