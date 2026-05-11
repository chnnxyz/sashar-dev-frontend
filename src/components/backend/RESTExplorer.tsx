import { useState } from 'react'
import { Button } from '../shared/Button'
import { backendApi } from '../../api/api'
import { restEndpoints } from '../../data/mockData'
import type { EndpointParam, RESTEndpointDef } from '../../types'

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-green-400 bg-green-400/10 border-green-800/40',
  POST: 'text-blue-400 bg-blue-400/10 border-blue-800/40',
  PUT: 'text-yellow-400 bg-yellow-400/10 border-yellow-800/40',
  DELETE: 'text-red-400 bg-red-400/10 border-red-800/40',
}

interface ParamValues {
  [key: string]: string
}

function EndpointCard({ endpoint }: { endpoint: RESTEndpointDef }) {
  const [expanded, setExpanded] = useState(false)
  const [paramValues, setParamValues] = useState<ParamValues>(
    () => Object.fromEntries(endpoint.params.map(p => [p.name, String(p.defaultValue ?? '')]))
  )
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const updateParam = (name: string, value: string) =>
    setParamValues(prev => ({ ...prev, [name]: value }))

  const handleSend = async () => {
    setLoading(true)
    try {
      const queryParams = Object.fromEntries(
        endpoint.params.filter(p => p.location === 'query').map(p => [p.name, paramValues[p.name] ?? ''])
      )
      const bodyParams = Object.fromEntries(
        endpoint.params.filter(p => p.location === 'body').map(p => [p.name, paramValues[p.name] ?? ''])
      )
      const result = await backendApi.executeREST({
        endpoint: endpoint.path,
        method: endpoint.method,
        params: queryParams,
        body: Object.keys(bodyParams).length > 0 ? bodyParams : undefined,
      })
      setResponse(JSON.stringify(result, null, 2))
    } finally {
      setLoading(false)
    }
  }

  const renderParamInput = (param: EndpointParam) => (
    <div key={param.name} className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-text-body">{param.name}</span>
        {param.required && <span className="text-[10px] text-red-400">required</span>}
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-base text-text-muted border border-border-subtle">{param.location}</span>
        <span className="text-[10px] text-text-muted">{param.type}</span>
      </div>
      <input
        type="text"
        value={paramValues[param.name] ?? ''}
        onChange={e => updateParam(param.name, e.target.value)}
        placeholder={param.description}
        className="w-full bg-bg-base border border-border-subtle rounded-lg px-3 py-1.5 text-xs text-text-body font-mono placeholder-text-muted focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/30 transition-colors"
      />
    </div>
  )

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-surface/50 transition-colors text-left cursor-pointer"
      >
        <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded border ${METHOD_COLORS[endpoint.method]}`}>
          {endpoint.method}
        </span>
        <span className="font-mono text-sm text-text-body">{endpoint.path}</span>
        <span className="text-xs text-text-muted ml-1">{endpoint.description}</span>
        <svg
          className={`ml-auto w-3.5 h-3.5 text-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-border-subtle p-4 space-y-4">
          {endpoint.params.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Parameters</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {endpoint.params.map(renderParamInput)}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button size="sm" loading={loading} onClick={handleSend}>
              <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2l12 6-12 6V9.5l8-1.5-8-1.5V2z" />
              </svg>
              Send Request
            </Button>
          </div>

          {response && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted font-medium uppercase tracking-wide">Response</span>
                <button onClick={() => setResponse(null)} className="text-xs text-text-muted hover:text-text-body cursor-pointer">Clear</button>
              </div>
              <pre className="bg-bg-base rounded-lg p-3 text-xs font-mono text-green-400 overflow-auto max-h-60 border border-border-subtle leading-relaxed">
                {response}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function RESTExplorer() {
  return (
    <div className="space-y-3">
      {restEndpoints.map(endpoint => (
        <EndpointCard key={endpoint.id} endpoint={endpoint} />
      ))}
    </div>
  )
}
