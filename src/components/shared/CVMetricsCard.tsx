import type { CVMetrics } from '../../types'

interface CVMetricsCardProps {
  cv: CVMetrics
  mode?: 'regression' | 'classification' | 'clustering'
}

function metricLabel(mode?: string): string {
  if (mode === 'classification') return 'CE'
  if (mode === 'clustering') return 'Inertia'
  return 'RMSE'
}

function foldColor(v: number, min: number, max: number): string {
  const t = max > min ? (v - min) / (max - min) : 0.5
  // emerald-300 (#6ee7b7) → emerald-800 (#065f46): higher value = darker
  const r = Math.round(110 - 104 * t)
  const g = Math.round(231 - 136 * t)
  const b = Math.round(183 - 113 * t)
  return `rgb(${r},${g},${b})`
}

export function CVMetricsCard({ cv, mode }: CVMetricsCardProps) {
  const { trainRMSE, testRMSE, trainSize, testSize, cvFolds } = cv
  const label = metricLabel(mode)
  const cvMean = cvFolds.reduce((a, b) => a + b, 0) / cvFolds.length
  const cvStd = Math.sqrt(cvFolds.map(f => (f - cvMean) ** 2).reduce((a, b) => a + b, 0) / cvFolds.length)
  const foldMin = Math.min(...cvFolds)
  const foldMax = Math.max(...cvFolds)
  const MIN_BAR_PX = 26
  const MAX_BAR_PX = 48

  return (
    <div className="grid grid-cols-3 gap-0 divide-x divide-border-subtle">
      {/* Train */}
      <div className="px-4 py-3 space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple flex-shrink-0" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Train</p>
        </div>
        <p className="text-2xl font-bold font-mono text-purple-light">{trainRMSE.toFixed(4)}</p>
        <p className="text-[10px] text-text-muted">{label} · n={trainSize}</p>
      </div>

      {/* Test */}
      <div className="px-4 py-3 space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Test</p>
        </div>
        <p className="text-2xl font-bold font-mono text-amber-400">{testRMSE.toFixed(4)}</p>
        <p className="text-[10px] text-text-muted">{label} · n={testSize}</p>
      </div>

      {/* CV */}
      <div className="px-4 py-3 space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">5-Fold CV</p>
        </div>
        <p className="text-2xl font-bold font-mono text-emerald-400">{cvMean.toFixed(4)}</p>
        <p className="text-[10px] text-text-muted">{label} ± {cvStd.toFixed(4)}</p>
        <div className="flex items-end gap-1 pt-2">
          {cvFolds.map((v, i) => {
            const t = foldMax > foldMin ? (v - foldMin) / (foldMax - foldMin) : 0.5
            const barH = Math.round(MIN_BAR_PX + t * (MAX_BAR_PX - MIN_BAR_PX))
            const textColor = t > 0.5 ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.9)'
            return (
              <div
                key={i}
                className="flex-1 rounded-sm overflow-hidden flex items-center justify-center"
                style={{ height: `${barH}px`, backgroundColor: foldColor(v, foldMin, foldMax) }}
                title={`Fold ${i + 1}: ${v.toFixed(4)}`}
              >
                <span className="text-[9px] font-mono leading-none select-none" style={{ color: textColor }}>
                  {v.toFixed(3)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
