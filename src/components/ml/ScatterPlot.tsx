import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import * as d3 from 'd3'
import type { ScatterPoint } from '../../types'

const TRAIN_COLOR = '#8b5cf6'
const TEST_COLOR = '#f59e0b'
const PRED_COLOR = '#10b981'
const CORRECT_COLOR = '#10b981'
const INCORRECT_COLOR = '#ef4444'
// High-contrast palette spanning distinct hue regions for clustering (visible on dark bg)
const CLASS_COLORS = ['#60a5fa', '#f97316', '#a3e635', '#e879f9', '#fb7185', '#2dd4bf']

const CLASS_SYMBOLS = [
  d3.symbolCircle,
  d3.symbolSquare,
  d3.symbolTriangle,
  d3.symbolCross,
  d3.symbolStar,
]

interface ScatterPlotProps {
  data: ScatterPoint[]
  predictions?: ScatterPoint[]
  trainSize?: number
  title?: string
  xLabel?: string
  yLabel?: string
  mode?: 'regression' | 'classification' | 'clustering'
  className?: string
  height?: number
  rmse?: number
}

export function ScatterPlot({ data, predictions, trainSize, title, xLabel = 'X', yLabel = 'Y', mode, className, height, rmse }: ScatterPlotProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const e = entries[0]
      if (e) setDims({ w: e.contentRect.width, h: e.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth || dims.w
    // Prefer live clientHeight; fall back to ResizeObserver reading; skip if unmeasured
    const height = container.clientHeight || dims.h || 0
    if (width === 0 || height === 0) return

    const margin = { top: 20, right: 20, bottom: 50, left: 50 }
    const iW = width - margin.left - margin.right
    const iH = height - margin.top - margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', height)
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    g.append('rect').attr('width', iW).attr('height', iH).attr('fill', '#0d0d0f').attr('rx', 8)

    const allData = predictions ? [...data, ...predictions] : data
    const xExt = d3.extent(allData, d => d.x) as [number, number]
    const yExt = d3.extent(allData, d => d.y) as [number, number]
    const xPad = (xExt[1] - xExt[0]) * 0.05
    const yPad = (yExt[1] - yExt[0]) * 0.05
    const xScale = d3.scaleLinear().domain([xExt[0] - xPad, xExt[1] + xPad]).range([0, iW])
    const yScale = d3.scaleLinear().domain([yExt[0] - yPad, yExt[1] + yPad]).range([iH, 0])

    const positionTooltip = (tip: HTMLDivElement, event: Event) => {
      const el = event.currentTarget as Element
      const elRect = el.getBoundingClientRect()
      const svgRect = svgRef.current?.getBoundingClientRect()
      const cx = elRect.left + elRect.width / 2
      let left = cx - tip.offsetWidth / 2 + 1
      let top = elRect.top - tip.offsetHeight - 8
      if (svgRect && left + tip.offsetWidth > svgRect.right - 4) left = svgRect.right - tip.offsetWidth - 4
      if (svgRect && left < svgRect.left) left = svgRect.left
      if (svgRect && top < svgRect.top) top = elRect.bottom + 8
      tip.style.left = `${left}px`
      tip.style.top = `${top}px`
    }

    const hasIsTrain = data.some(d => d.isTrain !== undefined)
    const hasSplit = hasIsTrain || trainSize !== undefined
    const labels = [...new Set(data.map(d => d.label ?? 'Data'))]
    const labelIndexMap = new Map(labels.map((l, i) => [l, i]))
    const classColorMap = new Map(labels.map((l, i) => [l, CLASS_COLORS[i % CLASS_COLORS.length]]))

    const isTrainPoint = (d: ScatterPoint, i: number): boolean =>
      hasIsTrain ? (d.isTrain ?? true) : i < (trainSize ?? data.length)

    // grid
    g.append('g').selectAll('line.v').data(xScale.ticks(6)).enter().append('line')
      .attr('x1', d => xScale(d)).attr('x2', d => xScale(d)).attr('y1', 0).attr('y2', iH).attr('stroke', '#2d2d35').attr('stroke-width', 0.5)
    g.append('g').selectAll('line.h').data(yScale.ticks(5)).enter().append('line')
      .attr('x1', 0).attr('x2', iW).attr('y1', d => yScale(d)).attr('y2', d => yScale(d)).attr('stroke', '#2d2d35').attr('stroke-width', 0.5)

    // axes
    g.append('g').attr('transform', `translate(0,${iH})`).call(d3.axisBottom(xScale).ticks(6).tickSize(4))
      .call(ax => { ax.select('.domain').attr('stroke', '#2d2d35'); ax.selectAll('.tick line').attr('stroke', '#2d2d35'); ax.selectAll('.tick text').attr('fill', '#9ca3af').attr('font-size', '11px') })
    g.append('g').call(d3.axisLeft(yScale).ticks(5).tickSize(4))
      .call(ax => { ax.select('.domain').attr('stroke', '#2d2d35'); ax.selectAll('.tick line').attr('stroke', '#2d2d35'); ax.selectAll('.tick text').attr('fill', '#9ca3af').attr('font-size', '11px') })

    g.append('text').attr('x', iW / 2).attr('y', iH + 30).attr('text-anchor', 'middle').attr('fill', '#9ca3af').attr('font-size', '12px').text(xLabel)
    g.append('text').attr('transform', 'rotate(-90)').attr('x', -iH / 2).attr('y', -30).attr('text-anchor', 'middle').attr('fill', '#9ca3af').attr('font-size', '12px').text(yLabel)

    if (mode === 'classification') {
      // Render symbol paths per class, colored by train/test
      const symbolGen = (labelKey: string) => {
        const idx = labelIndexMap.get(labelKey) ?? 0
        return d3.symbol().type(CLASS_SYMBOLS[idx % CLASS_SYMBOLS.length]!).size(52)
      }

      g.selectAll('path.pt').data(data).enter().append('path')
        .attr('class', 'pt')
        .attr('transform', d => `translate(${xScale(d.x)},${yScale(d.y)})`)
        .attr('d', d => symbolGen(d.label ?? 'Data')())
        .attr('fill', (d, i) => isTrainPoint(d, i) ? TRAIN_COLOR : TEST_COLOR)
        .attr('opacity', 0)
        .attr('stroke', '#0d0d0f').attr('stroke-width', 0.5)
        .transition().duration(600).delay((_, i) => i * 2)
        .attr('opacity', (d, i) => isTrainPoint(d, i) ? 0.85 : 0.6)

      if (predictions && predictions.length > 0) {
        const symbolGenLarge = (labelKey: string) => {
          const idx = labelIndexMap.get(labelKey) ?? 0
          return d3.symbol().type(CLASS_SYMBOLS[idx % CLASS_SYMBOLS.length]!).size(110)
        }
        const predSel = g.selectAll('path.pred-cls').data(predictions).enter().append('path')
          .attr('class', 'pred-cls')
          .attr('transform', d => `translate(${xScale(d.x)},${yScale(d.y)})`)
          .attr('d', d => symbolGenLarge(d.label ?? 'Data')())
          .attr('fill', 'transparent')
          .attr('stroke', d => d.correct === false ? INCORRECT_COLOR : CORRECT_COLOR)
          .attr('stroke-width', 2)
          .attr('opacity', 0)
        predSel
          .on('mouseover', (event, d: ScatterPoint) => {
            if (d.correct !== false || !tooltipRef.current) return
            const tip = tooltipRef.current
            tip.innerHTML = `<div style="font-size:10px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Prediction</div><div style="font-size:11px;color:#d1d5db">True: <span style="font-family:monospace;color:#f59e0b">${d.label ?? '?'}</span></div><div style="font-size:11px;color:#d1d5db">Predicted: <span style="font-family:monospace;color:#ef4444">${d.predictedLabel ?? '?'}</span></div><div style="font-size:11px;color:#d1d5db">Confidence: <span style="font-family:monospace;color:#9ca3af">${d.predictedProb !== undefined ? (d.predictedProb * 100).toFixed(1) + '%' : '?'}</span></div>`
            tip.style.opacity = '1'
            positionTooltip(tip, event)
          })
          .on('mouseout', () => {
            if (tooltipRef.current) tooltipRef.current.style.opacity = '0'
          })
        predSel.transition().duration(500).delay(700).attr('opacity', 0.9)
      }
    } else if (mode === 'clustering') {
      g.selectAll('circle').data(data).enter().append('circle')
        .attr('cx', d => xScale(d.x)).attr('cy', d => yScale(d.y))
        .attr('r', 0)
        .attr('fill', d => classColorMap.get(d.label ?? 'Data') ?? CLASS_COLORS[0]!)
        .attr('opacity', 0.82)
        .attr('stroke', '#0d0d0f').attr('stroke-width', 0.5)
        .transition().duration(600).delay((_, i) => i * 2).attr('r', 4)
    } else {
      // regression mode (default)
      const pointColor = (d: ScatterPoint, i: number): string =>
        hasSplit ? (isTrainPoint(d, i) ? TRAIN_COLOR : TEST_COLOR) : (classColorMap.get(d.label ?? 'Data') ?? CLASS_COLORS[0]!)
      const pointOpacity = (d: ScatterPoint, i: number): number =>
        hasSplit && !isTrainPoint(d, i) ? 0.75 : 0.82

      g.selectAll('circle').data(data).enter().append('circle')
        .attr('cx', d => xScale(d.x)).attr('cy', d => yScale(d.y))
        .attr('r', 0)
        .attr('fill', (d, i) => pointColor(d, i))
        .attr('opacity', (d, i) => pointOpacity(d, i))
        .attr('stroke', '#0d0d0f').attr('stroke-width', 0.5)
        .transition().duration(600).delay((_, i) => i * 2).attr('r', 4)

      if (predictions && predictions.length > 0) {
        const diamondPath = d3.symbol().type(d3.symbolDiamond).size(64)
        const predSel = g.selectAll('path.pred').data(predictions).enter().append('path')
          .attr('class', 'pred')
          .attr('transform', d => `translate(${xScale(d.x)},${yScale(d.y)})`)
          .attr('d', diamondPath)
          .attr('fill', PRED_COLOR)
          .attr('opacity', 0)
          .attr('stroke', '#0d0d0f').attr('stroke-width', 0.5)
          .style('cursor', 'default')
        predSel
          .on('mouseover', (event, d: ScatterPoint) => {
            if (!tooltipRef.current) return
            const tip = tooltipRef.current
            tip.innerHTML = `<div style="font-size:10px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Prediction</div><div style="font-size:11px;color:#d1d5db">Real: <span style="font-family:monospace;color:#f59e0b">${d.realValue !== undefined ? d.realValue.toFixed(3) : '?'}</span></div><div style="font-size:11px;color:#d1d5db">Predicted: <span style="font-family:monospace;color:#10b981">${d.y.toFixed(3)}</span></div><div style="font-size:11px;color:#d1d5db">RMSE: <span style="font-family:monospace;color:#9ca3af">${rmse !== undefined ? rmse.toFixed(3) : '?'}</span></div>`
            tip.style.opacity = '1'
            positionTooltip(tip, event)
          })
          .on('mouseout', () => {
            if (tooltipRef.current) tooltipRef.current.style.opacity = '0'
          })
        predSel.transition().duration(500).delay(700).attr('opacity', 0.85)
      }
    }
  }, [data, predictions, trainSize, xLabel, yLabel, mode, dims, rmse])

  // Legend computation
  const hasIsTrainFlag = data.some(d => d.isTrain !== undefined)
  const hasSplit = hasIsTrainFlag || trainSize !== undefined
  const trainCount = hasIsTrainFlag ? data.filter(d => d.isTrain).length : (trainSize ?? 0)
  const testCount = data.length - trainCount
  const labels = [...new Set(data.map(d => d.label ?? 'Data'))]

  // SVG path strings for legend shapes
  const symbolSvg = (idx: number, color: string) => {
    const pathStr = d3.symbol().type(CLASS_SYMBOLS[idx % CLASS_SYMBOLS.length]!).size(52)() ?? ''
    return (
      <svg width="14" height="14" viewBox="-7 -7 14 14">
        <path d={pathStr} fill={color} />
      </svg>
    )
  }

  return (
    <div className={['space-y-2 flex flex-col', className ?? ''].join(' ').trim()}>
      {title && <p className="text-sm text-text-muted font-medium shrink-0">{title}</p>}
      <div ref={containerRef} style={height ? { height } : undefined} className="w-full min-h-[280px] rounded-lg overflow-hidden border border-border-subtle">
        <svg ref={svgRef} className="w-full h-full" />
      </div>

      {/* Legend */}
      {mode === 'classification' ? (
        <div className="space-y-1 shrink-0">
          {/* Color row — train/test/predicted */}
          {(hasSplit || (predictions && predictions.length > 0)) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 px-1">
              {hasSplit && (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: TRAIN_COLOR }} />
                    <span className="text-[11px] text-text-muted">Train ({trainCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: TEST_COLOR }} />
                    <span className="text-[11px] text-text-muted">Test ({testCount})</span>
                  </div>
                </>
              )}
              {predictions && predictions.length > 0 && (
                <>
                  <div className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="-7 -7 14 14" className="flex-shrink-0">
                      <path d={d3.symbol().type(d3.symbolCircle).size(52)() ?? ''} fill="none" stroke={CORRECT_COLOR} strokeWidth="1.5" />
                    </svg>
                    <span className="text-[11px] text-text-muted">Correct</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="-7 -7 14 14" className="flex-shrink-0">
                      <path d={d3.symbol().type(d3.symbolCircle).size(52)() ?? ''} fill="none" stroke={INCORRECT_COLOR} strokeWidth="1.5" />
                    </svg>
                    <span className="text-[11px] text-text-muted">Incorrect (hover for details)</span>
                  </div>
                </>
              )}
            </div>
          )}
          {/* Shape row — one shape per class label */}
          {labels.length > 1 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 px-1">
              {labels.map((l, i) => (
                <div key={l} className="flex items-center gap-1.5">
                  {symbolSvg(i, '#9ca3af')}
                  <span className="text-[11px] text-text-muted">{l}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : mode === 'clustering' ? (
        labels.length > 1 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 shrink-0">
            {labels.map((l, i) => (
              <div key={l} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: CLASS_COLORS[i % CLASS_COLORS.length] }} />
                <span className="text-[11px] text-text-muted">{l}</span>
              </div>
            ))}
          </div>
        )
      ) : (
        hasSplit && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: TRAIN_COLOR }} />
              <span className="text-[11px] text-text-muted">Train ({trainCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: TEST_COLOR }} />
              <span className="text-[11px] text-text-muted">Test ({testCount})</span>
            </div>
            {predictions && predictions.length > 0 && (
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12"><polygon points="6,1 11,6 6,11 1,6" fill={PRED_COLOR} /></svg>
                <span className="text-[11px] text-text-muted">Predicted</span>
              </div>
            )}
          </div>
        )
      )}
      {createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-[9999] pointer-events-none rounded-lg px-3 py-2 shadow-xl"
          style={{ opacity: 0, transition: 'opacity 0.1s', top: 0, left: 0, background: '#1a1a22', border: '1px solid #2d2d35' }}
        />,
        document.body
      )}
    </div>
  )
}
