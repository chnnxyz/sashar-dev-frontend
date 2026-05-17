import { useState } from 'react'
import { GRAPHQL_SCHEMA_DOCS } from '../../data/mockData'
import type { GraphQLDoc } from '../../types'

interface DocEntryProps {
  doc: GraphQLDoc
  onUse: (q: string) => void
}

function DocEntry({ doc, onUse }: DocEntryProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border-subtle last:border-0 py-2.5">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 text-left cursor-pointer group"
      >
        <span className="text-xs font-mono font-semibold text-purple-light group-hover:text-purple transition-colors">{doc.name}</span>
        <svg className={`ml-auto w-3 h-3 text-text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="mt-2 space-y-3">
          <p className="text-[11px] text-text-muted leading-relaxed">{doc.description}</p>

          {doc.args.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">Parameters</p>
              {doc.args.map(arg => (
                <div key={arg.name} className="bg-bg-base/60 rounded-lg p-2 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-semibold text-purple-light">{arg.name}</span>
                    <span className="text-[10px] font-mono text-text-muted bg-bg-surface px-1.5 py-0.5 rounded">{arg.type}</span>
                    {!arg.required && (
                      <span className="text-[9px] text-text-muted/60 uppercase tracking-wide">optional</span>
                    )}
                  </div>
                  {arg.description && (
                    <p className="text-[10px] text-text-muted leading-relaxed">{arg.description}</p>
                  )}
                  {arg.values && arg.values.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {arg.values.map(v => (
                        <span key={v} className="text-[9px] font-mono bg-purple/10 text-purple-light px-1.5 py-0.5 rounded border border-purple/20">{v}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => onUse(doc.exampleQuery)}
            className="text-[10px] px-2 py-1 rounded bg-purple/15 text-purple-light hover:bg-purple/25 transition-colors cursor-pointer font-mono"
          >
            Use example
          </button>
        </div>
      )}
    </div>
  )
}

interface GQLDocsSidebarProps {
  open: boolean
  onClose: () => void
  onUse: (query: string) => void
}

export function GQLDocsSidebar({ open, onClose, onUse }: GQLDocsSidebarProps) {
  const queries = GRAPHQL_SCHEMA_DOCS.filter(d => d.kind === 'query')
  const mutations = GRAPHQL_SCHEMA_DOCS.filter(d => d.kind === 'mutation')

  const handleUse = (q: string) => {
    onUse(q)
    onClose()
  }

  return (
    <>
      {/* Backdrop (mobile only) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={[
          'fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-72 flex flex-col',
          'bg-bg-card border-r border-border-subtle',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Sticky header */}
        <div className="shrink-0 px-5 py-4 border-b border-border-subtle flex items-center justify-between">
          <span className="text-xs font-bold text-purple uppercase tracking-widest">API Docs</span>
          <button onClick={onClose} className="text-text-muted hover:text-text-body transition-colors cursor-pointer">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-6">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2">Queries</p>
            {queries.map(doc => (
              <DocEntry key={doc.name} doc={doc} onUse={handleUse} />
            ))}
          </div>

          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2">Mutations</p>
            {mutations.map(doc => (
              <DocEntry key={doc.name} doc={doc} onUse={handleUse} />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
