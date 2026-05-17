import { LossIterationChart } from './LossIterationChart'
import type { OptimizationIteration } from '../../types'

interface OptimizationProgressProps {
  iterations: OptimizationIteration[]
  streaming: boolean
  method: string
}

export function OptimizationProgress({ iterations, streaming, method }: OptimizationProgressProps) {
  const best = iterations.length > 0 ? iterations.reduce((a, b) => a.rmse < b.rmse ? a : b) : null
  const paramKeys = best ? Object.keys(best.params) : []
  const recent = [...iterations].reverse().slice(0, 8)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {streaming
            ? <><span className="w-2 h-2 rounded-full bg-purple animate-pulse" /><span className="text-xs text-purple-light">Streaming — {method}</span></>
            : <><span className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-xs text-emerald-400">Complete — {iterations.length} iterations</span></>}
        </div>
        {best && <span className="text-xs text-text-muted">best RMSE <strong className="text-emerald-400 font-mono">{best.rmse.toFixed(4)}</strong></span>}
      </div>

      <LossIterationChart data={iterations.map(it => ({ iteration: it.iteration, rmse: it.rmse }))} />

      {iterations.length > 0 && (
        <div>
          <p className="text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-2">Recent iterations</p>
          <div className="rounded-lg border border-border-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border-subtle bg-bg-base/60">
                    <th className="text-left px-3 py-2 text-text-muted font-medium w-10">#</th>
                    <th className="text-left px-3 py-2 text-text-muted font-medium w-20">RMSE</th>
                    {paramKeys.map(k => (
                      <th key={k} className="text-left px-3 py-2 text-text-muted font-medium">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map(it => {
                    const isBest = best?.iteration === it.iteration
                    return (
                      <tr key={it.iteration} className={`border-b border-border-subtle/40 last:border-0 ${isBest ? 'bg-emerald-950/30' : ''}`}>
                        <td className="px-3 py-1.5 text-text-muted font-mono">{it.iteration}</td>
                        <td className={`px-3 py-1.5 font-mono font-medium ${isBest ? 'text-emerald-400' : 'text-text-body'}`}>{it.rmse.toFixed(4)}</td>
                        {paramKeys.map(k => (
                          <td key={k} className="px-3 py-1.5 text-text-muted font-mono">{it.params[k]?.toFixed(4) ?? '—'}</td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
