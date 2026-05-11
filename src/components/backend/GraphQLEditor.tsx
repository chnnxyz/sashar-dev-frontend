import { useState } from 'react'
import { Button } from '../shared/Button'
import { backendApi } from '../../api/api'
import { defaultGraphQLQuery } from '../../data/mockData'

export function GraphQLEditor() {
  const [query, setQuery] = useState(defaultGraphQLQuery)
  const [variables, setVariables] = useState('{}')
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showVars, setShowVars] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRun = async () => {
    setLoading(true)
    setError(null)
    try {
      let parsedVars: Record<string, unknown> = {}
      try { parsedVars = JSON.parse(variables) } catch { /* ignore */ }
      const result = await backendApi.executeGraphQL({ query, variables: parsedVars })
      setResponse(JSON.stringify(result, null, 2))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted font-medium uppercase tracking-wide">Query / Mutation</span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowVars(v => !v)}
                className="text-xs text-text-muted hover:text-purple-light transition-colors cursor-pointer"
              >
                {showVars ? '− Variables' : '+ Variables'}
              </button>
              <button
                onClick={() => setQuery(defaultGraphQLQuery)}
                className="text-xs text-text-muted hover:text-purple-light transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="code-editor"
            style={{ minHeight: showVars ? '200px' : '280px' }}
            spellCheck={false}
            placeholder="Enter your GraphQL query..."
          />
          {showVars && (
            <>
              <span className="text-xs text-text-muted font-medium uppercase tracking-wide">Variables (JSON)</span>
              <textarea
                value={variables}
                onChange={e => setVariables(e.target.value)}
                className="code-editor"
                style={{ minHeight: '80px' }}
                spellCheck={false}
                placeholder="{}"
              />
            </>
          )}
          <Button onClick={handleRun} loading={loading} className="w-full">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 2.5l11 5.5-11 5.5V2.5z" />
            </svg>
            Run Query
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted font-medium uppercase tracking-wide">Response</span>
            {response && (
              <button
                onClick={() => setResponse(null)}
                className="text-xs text-text-muted hover:text-text-body transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="bg-bg-base border border-border-subtle rounded-lg p-4 font-mono text-sm min-h-[300px] overflow-auto">
            {loading && (
              <div className="flex items-center gap-2 text-text-muted">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Executing query…
              </div>
            )}
            {error && <pre className="text-red-400 text-xs whitespace-pre-wrap">{error}</pre>}
            {response && !loading && (
              <pre className="text-green-400 text-xs whitespace-pre-wrap leading-relaxed">{response}</pre>
            )}
            {!response && !loading && !error && (
              <p className="text-text-muted text-xs">Run a query to see the response here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
