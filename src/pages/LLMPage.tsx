import { useState, useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { PageWrapper } from '../components/layout/PageWrapper'
import { GitHubRepoLink } from '../components/shared/GitHubRepoLink'
import { Button } from '../components/shared/Button'
import { llmApi } from '../api/api'

type LLMStep = 'input' | 'tokenized' | 'encoded' | 'embedded' | 'generating' | 'output'

interface EmbedPoint {
  x: number
  y: number
  label: string
  color: string
}

const TOKEN_PALETTE = [
  '#60a5fa', '#f97316', '#a3e635', '#e879f9', '#fb7185', '#2dd4bf',
  '#fbbf24', '#a78bfa', '#34d399', '#f472b6', '#38bdf8', '#4ade80',
]
const OUTPUT_PALETTE = [
  '#f59e0b', '#06b6d4', '#ec4899', '#84cc16', '#a855f7', '#14b8a6',
  '#e11d48', '#0ea5e9', '#d946ef', '#22c55e', '#8b5cf6', '#f97316',
]

const STEP_INDEX: Record<LLMStep, number> = {
  input: 0, tokenized: 1, encoded: 2, embedded: 3, generating: 3, output: 3,
}

// ─── Transformer SVG loader ───────────────────────────────────────────────────

function TransformerSVG() {
  // Block visual style presets
  const S = {
    attn:    { fill: 'rgba(109,40,217,0.18)', stroke: '#7c3aed' },
    norm:    { fill: 'rgba(55,65,81,0.28)',   stroke: '#6b7280' },
    ff:      { fill: 'rgba(29,78,216,0.18)',  stroke: '#3b82f6' },
    emb:     { fill: 'rgba(180,83,9,0.20)',   stroke: '#d97706' },
    linear:  { fill: 'rgba(13,148,136,0.18)', stroke: '#14b8a6' },
    softmax: { fill: 'rgba(139,92,246,0.20)', stroke: '#a78bfa' },
    io:      { fill: 'rgba(31,31,46,0.70)',   stroke: '#4b5563' },
  }

  // All blocks left-to-right. IO blocks: yTop=36, h=28. Others: yTop=32, h=36.
  const blocks = [
    { x: 10,  w: 38, yTop: 36, h: 28, ...S.io,      d: 0.00 }, // Input
    { x: 66,  w: 52, yTop: 32, h: 36, ...S.emb,     d: 0.12 }, // Embed
    { x: 134, w: 48, yTop: 32, h: 36, ...S.attn,    d: 0.24 }, // Attn1
    { x: 198, w: 38, yTop: 32, h: 36, ...S.norm,    d: 0.36 }, // N&N1
    { x: 252, w: 48, yTop: 32, h: 36, ...S.ff,      d: 0.48 }, // FF1
    { x: 316, w: 38, yTop: 32, h: 36, ...S.norm,    d: 0.60 }, // N&N2
    { x: 370, w: 48, yTop: 32, h: 36, ...S.attn,    d: 0.72 }, // Attn2
    { x: 434, w: 38, yTop: 32, h: 36, ...S.norm,    d: 0.84 }, // N&N3
    { x: 488, w: 48, yTop: 32, h: 36, ...S.ff,      d: 0.96 }, // FF2
    { x: 552, w: 38, yTop: 32, h: 36, ...S.norm,    d: 1.08 }, // N&N4
    { x: 606, w: 44, yTop: 32, h: 36, ...S.linear,  d: 1.20 }, // Linear
    { x: 666, w: 52, yTop: 32, h: 36, ...S.softmax, d: 1.32 }, // Softmax
    { x: 734, w: 38, yTop: 36, h: 28, ...S.io,      d: 1.44 }, // Output
  ]

  // Rightward arrows between consecutive blocks
  const arrows = blocks.slice(0, -1).map((left, i) => {
    const right = blocks[i + 1]!
    const x1 = left.x + left.w
    const x2 = right.x
    return { x1, x2, d: left.d }
  })

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <p className="text-xs text-text-muted/60 font-mono animate-pulse">Processing tokens…</p>
      <svg viewBox="0 0 782 100" className="w-full">
        <defs>
          <style>{`
            @keyframes llm-pulse {
              0%, 100% { opacity: 0.28; }
              50% { opacity: 1; }
            }
          `}</style>
        </defs>

        {/* Nx bracket: horizontal line at y=86, vertical ticks */}
        <line x1={128} y1={86} x2={596} y2={86} stroke="#4b5563" strokeWidth={1} opacity={0.35} />
        <line x1={128} y1={82} x2={128} y2={90} stroke="#4b5563" strokeWidth={1} opacity={0.35} />
        <line x1={596} y1={82} x2={596} y2={90} stroke="#4b5563" strokeWidth={1} opacity={0.35} />

        {/* Layer separator: vertical dashed line at x=362 */}
        <line
          x1={362} y1={28} x2={362} y2={82}
          stroke="#4b5563" strokeWidth={0.8}
          strokeDasharray="3 4" opacity={0.28}
        />

        {/* Rightward arrows between blocks */}
        {arrows.map(({ x1, x2, d }, i) => (
          <g key={i} style={{ animation: `llm-pulse 1.4s ease-in-out ${d.toFixed(2)}s infinite` }}>
            <line x1={x1} y1={50} x2={x2 - 4} y2={50}
              stroke="#6b7280" strokeWidth={1} strokeOpacity={0.5} />
            <polygon
              points={`${x2 - 4},47 ${x2},50 ${x2 - 4},53`}
              fill="#6b7280" fillOpacity={0.45}
            />
          </g>
        ))}

        {/* Blocks */}
        {blocks.map((b, i) => (
          <rect
            key={i}
            x={b.x} y={b.yTop}
            width={b.w} height={b.h}
            rx={4}
            fill={b.fill} stroke={b.stroke} strokeWidth={1.2}
            style={{ animation: `llm-pulse 1.4s ease-in-out ${b.d.toFixed(2)}s infinite` }}
          />
        ))}
      </svg>
    </div>
  )
}

// ─── Embedding scatter (D3) ───────────────────────────────────────────────────

function EmbedPlot({ points }: { points: EmbedPoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
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
    if (!svgRef.current || !containerRef.current || points.length === 0) return
    const width = containerRef.current.clientWidth || dims.w
    const height = containerRef.current.clientHeight || dims.h || 0
    if (!width || !height) return

    const margin = { top: 24, right: 56, bottom: 48, left: 48 }
    const iW = width - margin.left - margin.right
    const iH = height - margin.top - margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', height)
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    g.append('rect').attr('width', iW).attr('height', iH).attr('fill', '#0d0d0f').attr('rx', 6)

    const xExt = d3.extent(points, d => d.x) as [number, number]
    const yExt = d3.extent(points, d => d.y) as [number, number]
    const xPad = ((xExt[1] - xExt[0]) || 1) * 0.25
    const yPad = ((yExt[1] - yExt[0]) || 1) * 0.25
    const xScale = d3.scaleLinear().domain([xExt[0] - xPad, xExt[1] + xPad]).range([0, iW])
    const yScale = d3.scaleLinear().domain([yExt[0] - yPad, yExt[1] + yPad]).range([iH, 0])

    g.append('g').selectAll('line.v').data(xScale.ticks(5)).enter().append('line')
      .attr('x1', d => xScale(d)).attr('x2', d => xScale(d)).attr('y1', 0).attr('y2', iH).attr('stroke', '#2d2d35').attr('stroke-width', 0.5)
    g.append('g').selectAll('line.h').data(yScale.ticks(4)).enter().append('line')
      .attr('x1', 0).attr('x2', iW).attr('y1', d => yScale(d)).attr('y2', d => yScale(d)).attr('stroke', '#2d2d35').attr('stroke-width', 0.5)

    g.append('g').attr('transform', `translate(0,${iH})`).call(d3.axisBottom(xScale).ticks(5).tickSize(3))
      .call(ax => { ax.select('.domain').attr('stroke', '#2d2d35'); ax.selectAll('.tick line').attr('stroke', '#2d2d35'); ax.selectAll('.tick text').attr('fill', '#9ca3af').attr('font-size', '10px') })
    g.append('g').call(d3.axisLeft(yScale).ticks(4).tickSize(3))
      .call(ax => { ax.select('.domain').attr('stroke', '#2d2d35'); ax.selectAll('.tick line').attr('stroke', '#2d2d35'); ax.selectAll('.tick text').attr('fill', '#9ca3af').attr('font-size', '10px') })

    g.append('text').attr('x', iW / 2).attr('y', iH + 34).attr('text-anchor', 'middle').attr('fill', '#9ca3af').attr('font-size', '10px').text('PC1')
    g.append('text').attr('transform', 'rotate(-90)').attr('x', -iH / 2).attr('y', -30).attr('text-anchor', 'middle').attr('fill', '#9ca3af').attr('font-size', '10px').text('PC2')

    g.selectAll('circle').data(points).enter().append('circle')
      .attr('cx', d => xScale(d.x)).attr('cy', d => yScale(d.y))
      .attr('r', 0).attr('fill', d => d.color).attr('opacity', 0.9)
      .attr('stroke', '#0d0d0f').attr('stroke-width', 0.5)
      .transition().duration(500).delay((_, i) => i * 30).attr('r', 6)

    points.forEach((pt, i) => {
      const shortened = pt.label.length > 10 ? pt.label.slice(0, 9) + '…' : pt.label
      g.append('text')
        .attr('x', xScale(pt.x) + 9).attr('y', yScale(pt.y) + 4)
        .attr('fill', pt.color).attr('font-size', '10px').attr('font-family', 'ui-monospace, monospace').attr('opacity', 0)
        .text(shortened)
        .transition().duration(400).delay(i * 30 + 300).attr('opacity', 0.85)
    })
  }, [points, dims])

  return (
    <div ref={containerRef} className="h-72 rounded-lg overflow-hidden border border-border-subtle">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  )
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: LLMStep }) {
  const steps = ['Tokenize', 'Encode', 'Embed', 'Generate']
  const active = STEP_INDEX[step]
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {steps.map((s, i) => {
        const done = i < active
        const current = i === active
        return (
          <div key={s} className="flex items-center gap-1">
            <div
              className={[
                'px-3 py-1 rounded-full text-xs font-semibold transition-all',
                done ? 'bg-purple/20 text-purple-light border border-purple/30'
                  : current ? 'bg-purple text-white border border-purple'
                    : 'bg-bg-card text-text-muted border border-border-subtle',
              ].join(' ')}
              style={current ? { boxShadow: '0 0 12px rgba(139,92,246,0.4)' } : {}}
            >
              {done && '✓ '}{s}
            </div>
            {i < steps.length - 1 && (
              <svg className="w-3 h-3 text-text-muted/40 shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 2l4 4-4 4" />
              </svg>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Token chip ───────────────────────────────────────────────────────────────

function TokenChip({ text, color, id }: { text: string; color: string; id?: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="px-2 py-1 rounded text-xs font-mono whitespace-pre"
        style={{ backgroundColor: color + '22', color, border: `1px solid ${color}55` }}>
        {text}
      </span>
      {id !== undefined && (
        <span className="text-[9px] text-text-muted/50 font-mono">{id}</span>
      )}
    </div>
  )
}

// ─── Section divider ─────────────────────────────────────────────────────────

function SectionDivider() {
  return <hr className="border-border-subtle my-8" />
}

// ─── Back link ────────────────────────────────────────────────────────────────

function BackLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-[11px] text-text-muted/40 hover:text-purple-light transition-colors cursor-pointer mb-3 flex items-center gap-1"
    >
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2L4 6l4 4" />
      </svg>
      {label}
    </button>
  )
}

// ─── Step heading ─────────────────────────────────────────────────────────────

function StepHeading({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="w-5 h-5 rounded-full bg-purple text-white text-[10px] font-bold flex items-center justify-center shrink-0">{n}</span>
      <h2 className="text-sm font-semibold text-text-body">{label}</h2>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function LLMPage() {
  const [step, setStep] = useState<LLMStep>('input')
  const [prompt, setPrompt] = useState('')
  const [tokens, setTokens] = useState<string[]>([])
  const [tokenColors, setTokenColors] = useState<string[]>([])
  const [tokenIds, setTokenIds] = useState<number[]>([])
  const [embedPoints, setEmbedPoints] = useState<EmbedPoint[]>([])
  const [outputTokens, setOutputTokens] = useState<{ text: string; color: string }[]>([])
  const [tokenizeLoading, setTokenizeLoading] = useState(false)
  const [encodeLoading, setEncodeLoading] = useState(false)
  const [embedLoading, setEmbedLoading] = useState(false)

  const encodeRef      = useRef<HTMLDivElement>(null)
  const embedRef       = useRef<HTMLDivElement>(null)
  const genRef         = useRef<HTMLDivElement>(null)
  const transformerRef = useRef<HTMLDivElement>(null)
  const outputRef      = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (step === 'tokenized')  encodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    if (step === 'encoded')    embedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    if (step === 'embedded')   genRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    if (step === 'generating') transformerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    if (step === 'output')     outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [step])

  const atLeast = (s: LLMStep) => STEP_INDEX[step] >= STEP_INDEX[s]

  const clearFrom = (s: LLMStep) => {
    if (STEP_INDEX[s] <= 1) { setTokenIds([]); setEmbedPoints([]); setOutputTokens([]) }
    if (STEP_INDEX[s] <= 2) { setEmbedPoints([]); setOutputTokens([]) }
    if (STEP_INDEX[s] <= 3) { setOutputTokens([]) }
  }

  const handleTokenize = async () => {
    setTokenizeLoading(true)
    try {
      const result = await llmApi.tokenize(prompt)
      setTokens(result.tokens)
      setTokenColors(result.tokens.map((_, i) => TOKEN_PALETTE[i % TOKEN_PALETTE.length]!))
      setTokenIds([]); setEmbedPoints([]); setOutputTokens([])
      setStep('tokenized')
    } finally {
      setTokenizeLoading(false)
    }
  }

  const handleEncode = async () => {
    setEncodeLoading(true)
    try {
      const result = await llmApi.encode(tokens)
      setTokenIds(result.ids)
      setEmbedPoints([]); setOutputTokens([])
      setStep('encoded')
    } finally {
      setEncodeLoading(false)
    }
  }

  const handleEmbed = async () => {
    setEmbedLoading(true)
    try {
      const result = await llmApi.embed(tokens, tokenIds)
      setEmbedPoints(result.points.map((p, i) => ({ ...p, color: tokenColors[i]! })))
      setOutputTokens([])
      setStep('embedded')
    } finally {
      setEmbedLoading(false)
    }
  }

  const handleGenerate = async () => {
    setStep('generating')
    const result = await llmApi.generate(prompt, tokens, tokenIds)
    setOutputTokens(result.outputTokens.map((t, i) => ({ text: t, color: OUTPUT_PALETTE[i % OUTPUT_PALETTE.length]! })))
    setStep('output')
  }

  const handleReset = () => {
    setStep('input'); setPrompt(''); setTokens([]); setTokenColors([])
    setTokenIds([]); setEmbedPoints([]); setOutputTokens([])
  }

  const done = (s: LLMStep) => STEP_INDEX[step] > STEP_INDEX[s]

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-baseline gap-4 mb-1">
          <h1 className="text-2xl font-bold text-text-body">LLMs <span className="text-purple-light">Explained</span></h1>
          <GitHubRepoLink repo="chnnxyz/sashar-dev-llm-api" />
        </div>
        <p className="text-sm text-text-muted mb-3">Step through how a large language model processes and generates text.</p>
        <p className="text-xs text-text-muted/70 leading-relaxed">
          Text is first <span className="text-text-muted">tokenized</span> into subword units, not necessarily whole words; a single word can split into multiple tokens, and punctuation or whitespace often becomes its own token.
          Each token is then <span className="text-text-muted">encoded</span> as a vocabulary index, a unique integer from a table of tens of thousands of entries fixed during training.
          Those indices are projected into dense <span className="text-text-muted">embedding</span> vectors, high-dimensional numeric representations where semantically related tokens cluster nearby in the learned space.
          Finally, stacked transformer layers combining multi-head self-attention and feed-forward blocks <span className="text-text-muted">generate</span> output by predicting the probability distribution over the next token, sampling one at a time until a stopping criterion is reached.
        </p>
      </div>

      <StepIndicator step={step} />

      <div className="mt-8">

        {/* ── Section 1: Tokenization ─────────────────────────────────── */}
        <div
          className={['transition-opacity duration-500', done('input') ? 'opacity-35 pointer-events-none select-none' : ''].join(' ')}
        >
          <StepHeading n={1} label="Tokenization" />
          <p className="text-xs text-text-muted leading-relaxed mb-4">
            Text is split into chunks called tokens, often words or word pieces. The model never sees raw letters; it converts everything into tokens first. This vocabulary is fixed at training time, so every input maps to known pieces.
          </p>
          <div className="w-[85%] mx-auto">
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Enter a prompt…"
              rows={3}
              className="w-full bg-bg-base/80 border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-body placeholder:text-text-muted/50 focus:outline-none focus:border-purple/60 focus:ring-1 focus:ring-purple/20 transition-all resize-none mb-2"
              style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey && prompt.trim()) handleTokenize() }}
            />
            <p className="text-[11px] text-text-muted/40 mb-3">
              ⚠ English only. Tokenization uses whitespace splitting and will not handle other scripts correctly.
            </p>
            <Button onClick={handleTokenize} disabled={!prompt.trim()} loading={tokenizeLoading} size="sm">
              Tokenize
            </Button>
          </div>
        </div>

        {/* ── Section 2: Encoding ─────────────────────────────────────── */}
        {atLeast('tokenized') && (
          <div ref={encodeRef}>
            <SectionDivider />

            {/* Output from step 1 */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {tokens.map((t, i) => (
                <TokenChip key={i} text={t} color={tokenColors[i]!} />
              ))}
            </div>

            {/* Back link + controls */}
            <BackLink label="re-tokenize" onClick={() => { clearFrom('input'); setStep('input') }} />
            <div className={['transition-opacity duration-500', done('tokenized') ? 'opacity-35 pointer-events-none select-none' : ''].join(' ')}>
              <StepHeading n={2} label="Encoding" />
              <p className="text-xs text-text-muted leading-relaxed mb-4">
                Each token is looked up in a vocabulary table and replaced with a unique integer ID. These numbers are what the model actually processes, similar to turning words into dictionary page numbers. A typical vocabulary contains 30,000–100,000 entries.
              </p>
              <Button onClick={handleEncode} loading={encodeLoading} size="sm">
                Encode →
              </Button>
            </div>
          </div>
        )}

        {/* ── Section 3: Embedding ────────────────────────────────────── */}
        {atLeast('encoded') && (
          <div ref={embedRef}>
            <SectionDivider />

            {/* Output from step 2 */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {tokens.map((t, i) => (
                <TokenChip key={i} text={t} color={tokenColors[i]!} id={tokenIds[i]} />
              ))}
            </div>

            <BackLink label="re-encode" onClick={() => { clearFrom('tokenized'); setStep('tokenized') }} />
            <div className={['transition-opacity duration-500', done('encoded') ? 'opacity-35 pointer-events-none select-none' : ''].join(' ')}>
              <StepHeading n={3} label="Embedding" />
              <p className="text-xs text-text-muted leading-relaxed mb-4">
                Each ID is mapped to a dense vector of hundreds of numbers that captures semantic meaning, so similar concepts land nearby. The plot shows a 2D PCA projection of those high-dimensional vectors. Distance in the chart reflects conceptual similarity.
              </p>
              <Button onClick={handleEmbed} loading={embedLoading} size="sm">
                Embed →
              </Button>
            </div>
          </div>
        )}

        {/* ── Section 4: Generation ───────────────────────────────────── */}
        {atLeast('embedded') && (
          <div ref={genRef}>
            <SectionDivider />

            {/* Output from step 3 */}
            {embedPoints.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-text-muted/60 font-medium mb-2">Token Embedding Space (2D PCA)</p>
                <EmbedPlot points={embedPoints} />
              </div>
            )}

            <BackLink label="re-embed" onClick={() => { clearFrom('encoded'); setStep('encoded') }} />
            <div className={['transition-opacity duration-500', (step === 'generating' || step === 'output') ? 'opacity-35 pointer-events-none select-none' : ''].join(' ')}>
              <StepHeading n={4} label="Generation" />
              <p className="text-xs text-text-muted leading-relaxed mb-4">
                Stacked attention and feed-forward layers predict the most likely next token, one at a time. Attention lets every token look at every other to build rich context. This repeats until a stopping condition is reached.
              </p>
              <Button onClick={handleGenerate} size="sm">
                Generate Output →
              </Button>
            </div>

            {/* Transformer SVG while generating */}
            {step === 'generating' && (
              <div ref={transformerRef} className="mt-6">
                <TransformerSVG />
              </div>
            )}

            {/* Output */}
            {step === 'output' && (
              <div ref={outputRef} className="mt-6">
                <SectionDivider />
                <p className="text-xs text-text-muted/60 font-medium mb-3">Generated Output</p>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {outputTokens.map((t, i) => (
                    <TokenChip key={i} text={t.text} color={t.color} />
                  ))}
                </div>
                <Button onClick={handleReset} variant="secondary" size="sm">
                  New Prompt
                </Button>
              </div>
            )}
          </div>
        )}

      </div>
    </PageWrapper>
  )
}
