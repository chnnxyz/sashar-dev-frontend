import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { ScatterPoint } from '../../types'

interface ScatterPlotProps {
  data: ScatterPoint[]
  title?: string
  xLabel?: string
  yLabel?: string
}

const COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#6d28d9', '#ddd6fe', '#7c3aed']

export function ScatterPlot({ data, title, xLabel = 'X', yLabel = 'Y' }: ScatterPlotProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = 320
    const margin = { top: 20, right: 20, bottom: 45, left: 50 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', height)

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // Background
    g.append('rect')
      .attr('width', innerW)
      .attr('height', innerH)
      .attr('fill', '#0d0d0f')
      .attr('rx', 8)

    // Scales
    const xExtent = d3.extent(data, d => d.x) as [number, number]
    const yExtent = d3.extent(data, d => d.y) as [number, number]
    const xPad = (xExtent[1] - xExtent[0]) * 0.05
    const yPad = (yExtent[1] - yExtent[0]) * 0.05

    const xScale = d3.scaleLinear().domain([xExtent[0] - xPad, xExtent[1] + xPad]).range([0, innerW])
    const yScale = d3.scaleLinear().domain([yExtent[0] - yPad, yExtent[1] + yPad]).range([innerH, 0])

    const labels = [...new Set(data.map(d => d.label ?? 'Data'))]
    const colorMap = new Map(labels.map((l, i) => [l, COLORS[i % COLORS.length]]))

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line.vert')
      .data(xScale.ticks(6))
      .enter().append('line')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', '#2d2d35')
      .attr('stroke-width', 0.5)

    g.append('g')
      .selectAll('line.horiz')
      .data(yScale.ticks(5))
      .enter().append('line')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#2d2d35')
      .attr('stroke-width', 0.5)

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(6).tickSize(4))
      .call(ax => ax.select('.domain').attr('stroke', '#2d2d35'))
      .call(ax => ax.selectAll('.tick line').attr('stroke', '#2d2d35'))
      .call(ax => ax.selectAll('.tick text').attr('fill', '#9ca3af').attr('font-size', '11px'))

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickSize(4))
      .call(ax => ax.select('.domain').attr('stroke', '#2d2d35'))
      .call(ax => ax.selectAll('.tick line').attr('stroke', '#2d2d35'))
      .call(ax => ax.selectAll('.tick text').attr('fill', '#9ca3af').attr('font-size', '11px'))

    // Axis labels
    g.append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH + 38)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9ca3af')
      .attr('font-size', '12px')
      .text(xLabel)

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2)
      .attr('y', -38)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9ca3af')
      .attr('font-size', '12px')
      .text(yLabel)

    // Points
    g.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', 0)
      .attr('fill', d => colorMap.get(d.label ?? 'Data') ?? COLORS[0])
      .attr('opacity', 0.8)
      .attr('stroke', '#0d0d0f')
      .attr('stroke-width', 0.5)
      .transition()
      .duration(600)
      .delay((_, i) => i * 2)
      .attr('r', 4)

    // Legend
    if (labels.length > 1) {
      const legend = g.append('g').attr('transform', `translate(${innerW - 100}, 8)`)
      labels.forEach((label, i) => {
        const row = legend.append('g').attr('transform', `translate(0, ${i * 18})`)
        row.append('circle').attr('r', 4).attr('fill', colorMap.get(label) ?? COLORS[0])
        row.append('text').attr('x', 10).attr('y', 4).attr('fill', '#9ca3af').attr('font-size', '11px').text(label)
      })
    }
  }, [data, xLabel, yLabel])

  return (
    <div className="space-y-2">
      {title && <p className="text-sm text-text-muted font-medium">{title}</p>}
      <div ref={containerRef} className="w-full rounded-lg overflow-hidden border border-border-subtle">
        <svg ref={svgRef} className="w-full" />
      </div>
    </div>
  )
}
