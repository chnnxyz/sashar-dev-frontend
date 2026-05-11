import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { TimeSeriesPoint } from '../../types'

interface LinePlotProps {
  historical: TimeSeriesPoint[]
  forecast?: TimeSeriesPoint[]
  title?: string
}

export function LinePlot({ historical, forecast = [], title }: LinePlotProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || historical.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = 340
    const margin = { top: 24, right: 24, bottom: 50, left: 56 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', height)

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    g.append('rect')
      .attr('width', innerW)
      .attr('height', innerH)
      .attr('fill', '#0d0d0f')
      .attr('rx', 8)

    const allDates = [...historical, ...forecast].map(d => d.date)
    const allValues = [...historical, ...forecast].map(d => d.value)

    const xScale = d3.scaleTime().domain(d3.extent(allDates) as [Date, Date]).range([0, innerW])
    const yExtent = d3.extent(allValues) as [number, number]
    const yPad = (yExtent[1] - yExtent[0]) * 0.1
    const yScale = d3.scaleLinear().domain([yExtent[0] - yPad, yExtent[1] + yPad]).range([innerH, 0])

    // Gradient defs
    const defs = svg.append('defs')
    const gradId = 'hist-area-grad'
    const grad = defs.append('linearGradient').attr('id', gradId).attr('gradientUnits', 'userSpaceOnUse').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', innerH)
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#8b5cf6').attr('stop-opacity', 0.4)
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#8b5cf6').attr('stop-opacity', 0)

    // Grid
    g.append('g')
      .selectAll('line')
      .data(yScale.ticks(5))
      .enter().append('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', d => yScale(d)).attr('y2', d => yScale(d))
      .attr('stroke', '#2d2d35').attr('stroke-width', 0.5)

    // Area
    const area = d3.area<TimeSeriesPoint>()
      .x(d => xScale(d.date))
      .y0(innerH)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(historical)
      .attr('fill', `url(#${gradId})`)
      .attr('d', area)

    // Historical line
    const line = d3.line<TimeSeriesPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX)

    const histPath = g.append('path')
      .datum(historical)
      .attr('fill', 'none')
      .attr('stroke', '#8b5cf6')
      .attr('stroke-width', 2)
      .attr('d', line)

    const histLength = histPath.node()?.getTotalLength() ?? 0
    histPath
      .attr('stroke-dasharray', histLength)
      .attr('stroke-dashoffset', histLength)
      .transition().duration(1200).ease(d3.easeQuadInOut)
      .attr('stroke-dashoffset', 0)

    // Forecast line
    if (forecast.length > 0) {
      const combined = [historical[historical.length - 1]!, ...forecast]
      g.append('path')
        .datum(combined)
        .attr('fill', 'none')
        .attr('stroke', '#a78bfa')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '6 3')
        .attr('d', line)
        .attr('opacity', 0)
        .transition().delay(1200).duration(600)
        .attr('opacity', 1)
    }

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(6).tickFormat(d => d3.timeFormat('%b %d')(d as Date)))
      .call(ax => ax.select('.domain').attr('stroke', '#2d2d35'))
      .call(ax => ax.selectAll('.tick line').attr('stroke', '#2d2d35'))
      .call(ax => ax.selectAll('.tick text').attr('fill', '#9ca3af').attr('font-size', '11px'))

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .call(ax => ax.select('.domain').attr('stroke', '#2d2d35'))
      .call(ax => ax.selectAll('.tick line').attr('stroke', '#2d2d35'))
      .call(ax => ax.selectAll('.tick text').attr('fill', '#9ca3af').attr('font-size', '11px'))

    // Legend
    if (forecast.length > 0) {
      const legend = g.append('g').attr('transform', `translate(12, 8)`)
      const items = [{ label: 'Historical', color: '#8b5cf6', dash: false }, { label: 'Forecast', color: '#a78bfa', dash: true }]
      items.forEach((item, i) => {
        const row = legend.append('g').attr('transform', `translate(${i * 100}, 0)`)
        row.append('line').attr('x1', 0).attr('x2', 20).attr('y1', 0).attr('y2', 0)
          .attr('stroke', item.color).attr('stroke-width', 2)
          .attr('stroke-dasharray', item.dash ? '6 3' : 'none')
        row.append('text').attr('x', 24).attr('y', 4).attr('fill', '#9ca3af').attr('font-size', '11px').text(item.label)
      })
    }
  }, [historical, forecast])

  return (
    <div className="space-y-2">
      {title && <p className="text-sm text-text-muted font-medium">{title}</p>}
      <div ref={containerRef} className="w-full rounded-lg overflow-hidden border border-border-subtle">
        <svg ref={svgRef} className="w-full" />
      </div>
    </div>
  )
}
