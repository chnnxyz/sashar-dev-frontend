import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface IterPoint { iteration: number; rmse: number }

interface LossIterationChartProps {
  data: IterPoint[]
}

export function LossIterationChart({ data }: LossIterationChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return

    const width = containerRef.current.clientWidth
    const height = 200
    const m = { top: 16, right: 60, bottom: 36, left: 50 }
    const iW = width - m.left - m.right
    const iH = height - m.top - m.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', height)

    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`)
    g.append('rect').attr('width', iW).attr('height', iH).attr('fill', '#0d0d0f').attr('rx', 6)

    const xScale = d3.scaleLinear().domain([1, Math.max(data.length, 10)]).range([0, iW])
    const rmseValues = data.map(d => d.rmse)
    const yMin = Math.min(...rmseValues) * 0.93
    const yMax = Math.max(...rmseValues) * 1.07
    const yScale = d3.scaleLinear().domain([yMin, yMax]).range([iH, 0])

    // grid
    g.append('g').selectAll('line').data(yScale.ticks(4)).enter().append('line')
      .attr('x1', 0).attr('x2', iW).attr('y1', d => yScale(d)).attr('y2', d => yScale(d))
      .attr('stroke', '#2d2d35').attr('stroke-width', 0.5)

    // area fill
    const defs = svg.append('defs')
    const ag = defs.append('linearGradient').attr('id', 'loss-grad').attr('gradientUnits', 'userSpaceOnUse').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', iH)
    ag.append('stop').attr('offset', '0%').attr('stop-color', '#8b5cf6').attr('stop-opacity', 0.22)
    ag.append('stop').attr('offset', '100%').attr('stop-color', '#8b5cf6').attr('stop-opacity', 0)

    g.append('path')
      .datum(data)
      .attr('fill', 'url(#loss-grad)')
      .attr('d', d3.area<IterPoint>().x(d => xScale(d.iteration)).y0(iH).y1(d => yScale(d.rmse)).curve(d3.curveMonotoneX))

    // line
    g.append('path')
      .datum(data)
      .attr('fill', 'none').attr('stroke', '#8b5cf6').attr('stroke-width', 2)
      .attr('d', d3.line<IterPoint>().x(d => xScale(d.iteration)).y(d => yScale(d.rmse)).curve(d3.curveMonotoneX))

    // best point (green dot)
    const best = data.reduce((a, b) => a.rmse < b.rmse ? a : b)
    g.append('circle').attr('cx', xScale(best.iteration)).attr('cy', yScale(best.rmse))
      .attr('r', 4).attr('fill', '#10b981').attr('stroke', '#0d0d0f').attr('stroke-width', 2)

    // current (last) point
    const last = data[data.length - 1]!
    if (last.iteration !== best.iteration) {
      g.append('circle').attr('cx', xScale(last.iteration)).attr('cy', yScale(last.rmse))
        .attr('r', 3.5).attr('fill', '#a78bfa').attr('stroke', '#0d0d0f').attr('stroke-width', 1.5)
    }

    // axes
    g.append('g').attr('transform', `translate(0,${iH})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => `#${d}`))
      .call(ax => { ax.select('.domain').attr('stroke', '#2d2d35'); ax.selectAll('.tick line').attr('stroke', '#2d2d35'); ax.selectAll('.tick text').attr('fill', '#9ca3af').attr('font-size', '10px') })

    g.append('g').call(d3.axisLeft(yScale).ticks(4).tickFormat(d => (d as number).toFixed(3)))
      .call(ax => { ax.select('.domain').attr('stroke', '#2d2d35'); ax.selectAll('.tick line').attr('stroke', '#2d2d35'); ax.selectAll('.tick text').attr('fill', '#9ca3af').attr('font-size', '10px') })

    // axis labels
    g.append('text').attr('x', iW / 2).attr('y', iH + 30).attr('text-anchor', 'middle').attr('fill', '#6b7280').attr('font-size', '10px').text('Iteration')
    g.append('text').attr('transform', 'rotate(-90)').attr('x', -iH / 2).attr('y', -38).attr('text-anchor', 'middle').attr('fill', '#6b7280').attr('font-size', '10px').text('RMSE')

    // best annotation
    g.append('text').attr('x', iW - 2).attr('y', 10).attr('text-anchor', 'end').attr('fill', '#10b981').attr('font-size', '10px')
      .text(`best: ${best.rmse.toFixed(4)}`)
  }, [data])

  return (
    <div ref={containerRef} className="w-full rounded-lg overflow-hidden border border-border-subtle bg-bg-base min-h-[200px] flex items-center justify-center">
      {data.length === 0
        ? <p className="text-text-muted text-xs">Waiting for first iteration…</p>
        : <svg ref={svgRef} className="w-full" />}
    </div>
  )
}
