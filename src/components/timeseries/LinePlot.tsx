import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import * as d3 from 'd3'
import type { TimeSeriesPoint } from '../../types'

interface LinePlotProps {
  historical: TimeSeriesPoint[]
  forecast?: TimeSeriesPoint[]
  trainSize?: number
  title?: string
  className?: string
  height?: number
  rmse?: number
}

export function LinePlot({ historical, forecast = [], trainSize, title, className, height, rmse }: LinePlotProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })

  const split = trainSize ?? Math.floor(historical.length * 0.7)

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
    if (!svgRef.current || !containerRef.current || historical.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth || dims.w
    const height = container.clientHeight || 420
    if (width === 0 || height === 0) return

    const m = { top: 24, right: 24, bottom: 50, left: 56 }
    const iW = width - m.left - m.right
    const iH = height - m.top - m.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', height)
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`)
    g.append('rect').attr('width', iW).attr('height', iH).attr('fill', '#0d0d0f').attr('rx', 8)

    const trainData = historical.slice(0, split)
    const testData = historical.slice(split - 1)

    const allValues = [...historical, ...forecast].map(d => d.value)
    const xScale = d3.scaleTime().domain(d3.extent(historical.map(d => d.date)) as [Date, Date]).range([0, iW])
    const yExt = d3.extent(allValues) as [number, number]
    const yPad = (yExt[1] - yExt[0]) * 0.1
    const yScale = d3.scaleLinear().domain([yExt[0] - yPad, yExt[1] + yPad]).range([iH, 0])

    const defs = svg.append('defs')
    const ag = defs.append('linearGradient').attr('id', 'train-area-grad').attr('gradientUnits', 'userSpaceOnUse').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', iH)
    ag.append('stop').attr('offset', '0%').attr('stop-color', '#8b5cf6').attr('stop-opacity', 0.3)
    ag.append('stop').attr('offset', '100%').attr('stop-color', '#8b5cf6').attr('stop-opacity', 0)

    // grid
    g.append('g').selectAll('line').data(yScale.ticks(5)).enter().append('line')
      .attr('x1', 0).attr('x2', iW).attr('y1', d => yScale(d)).attr('y2', d => yScale(d))
      .attr('stroke', '#2d2d35').attr('stroke-width', 0.5)

    // train/test boundary
    if (trainData.length > 0) {
      const splitX = xScale(trainData[trainData.length - 1]!.date)
      g.append('line')
        .attr('x1', splitX).attr('x2', splitX).attr('y1', 0).attr('y2', iH)
        .attr('stroke', '#4b5563').attr('stroke-width', 1).attr('stroke-dasharray', '4 3')
    }

    const line = d3.line<TimeSeriesPoint>().x(d => xScale(d.date)).y(d => yScale(d.value)).curve(d3.curveMonotoneX)
    const area = d3.area<TimeSeriesPoint>().x(d => xScale(d.date)).y0(iH).y1(d => yScale(d.value)).curve(d3.curveMonotoneX)

    g.append('path').datum(trainData).attr('fill', 'url(#train-area-grad)').attr('d', area)

    const trainPath = g.append('path').datum(trainData)
      .attr('fill', 'none').attr('stroke', '#8b5cf6').attr('stroke-width', 2).attr('d', line)
    const tLen = trainPath.node()?.getTotalLength() ?? 0
    trainPath.attr('stroke-dasharray', tLen).attr('stroke-dashoffset', tLen)
      .transition().duration(1000).ease(d3.easeQuadInOut).attr('stroke-dashoffset', 0)

    const testPath = g.append('path').datum(testData)
      .attr('fill', 'none').attr('stroke', '#f59e0b').attr('stroke-width', 2).attr('d', line).attr('opacity', 0)
    testPath.transition().delay(1000).duration(700).ease(d3.easeQuadInOut).attr('opacity', 1)

    if (forecast.length > 0) {
      const combined = [historical[split - 1]!, ...forecast]
      g.append('path').datum(combined)
        .attr('fill', 'none').attr('stroke', '#a78bfa').attr('stroke-width', 2).attr('stroke-dasharray', '6 3').attr('d', line)
        .attr('opacity', 0).transition().delay(1700).duration(500).attr('opacity', 1)
    }

    // axes
    g.append('g').attr('transform', `translate(0,${iH})`)
      .call(d3.axisBottom(xScale).ticks(6).tickFormat(d => d3.timeFormat('%b %Y')(d as Date)))
      .call(ax => { ax.select('.domain').attr('stroke', '#2d2d35'); ax.selectAll('.tick line').attr('stroke', '#2d2d35'); ax.selectAll('.tick text').attr('fill', '#9ca3af').attr('font-size', '11px') })
    g.append('g').call(d3.axisLeft(yScale).ticks(5))
      .call(ax => { ax.select('.domain').attr('stroke', '#2d2d35'); ax.selectAll('.tick line').attr('stroke', '#2d2d35'); ax.selectAll('.tick text').attr('fill', '#9ca3af').attr('font-size', '11px') })

    if (forecast.length > 0) {
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

      g.selectAll('circle.fc').data(forecast).enter().append('circle')
        .attr('class', 'fc')
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.value))
        .attr('r', 3)
        .attr('fill', '#a78bfa')
        .attr('opacity', 0)
        .attr('stroke', '#0d0d0f')
        .attr('stroke-width', 0.5)
        .style('cursor', 'default')
        .on('mouseover', (event, d: TimeSeriesPoint) => {
          if (!tooltipRef.current) return
          const tip = tooltipRef.current
          const dateStr = d3.timeFormat('%b %d, %Y')(d.date)
          tip.innerHTML = [
            `<div style="font-size:10px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">${dateStr}</div>`,
            `<div style="font-size:11px;color:#d1d5db">Forecast: <span style="font-family:monospace;color:#a78bfa">${d.value.toFixed(3)}</span></div>`,
            rmse !== undefined ? `<div style="font-size:11px;color:#d1d5db">RMSE: <span style="font-family:monospace;color:#9ca3af">${rmse.toFixed(3)}</span></div>` : '',
          ].join('')
          tip.style.opacity = '1'
          positionTooltip(tip, event)
          d3.select(event.currentTarget as Element).attr('r', 5).attr('opacity', 1)
        })
        .on('mouseout', (event) => {
          if (tooltipRef.current) tooltipRef.current.style.opacity = '0'
          d3.select(event.currentTarget as Element).attr('r', 3).attr('opacity', 0.7)
        })
        .transition().delay(1700).duration(500).attr('opacity', 0.7)
    }
  }, [historical, forecast, split, dims, rmse])

  const legendItems = [
    { label: `Train (${split})`, color: '#8b5cf6', dash: false },
    { label: `Test (${historical.length - split})`, color: '#f59e0b', dash: false },
    ...(forecast.length > 0 ? [{ label: 'Forecast', color: '#a78bfa', dash: true }] : []),
  ]

  return (
    <div className={['space-y-2 flex flex-col', className ?? ''].join(' ').trim()}>
      {title && <p className="text-sm text-text-muted font-medium shrink-0">{title}</p>}
      <div ref={containerRef} style={height ? { height } : undefined} className="w-full min-h-[280px] rounded-lg overflow-hidden border border-border-subtle">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 shrink-0">
        {legendItems.map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <svg width="18" height="8" viewBox="0 0 18 8">
              <line x1="0" y1="4" x2="18" y2="4" stroke={item.color} strokeWidth="2"
                strokeDasharray={item.dash ? '6 3' : undefined} />
            </svg>
            <span className="text-[11px] text-text-muted">{item.label}</span>
          </div>
        ))}
      </div>
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
