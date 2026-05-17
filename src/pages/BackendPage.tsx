import { useState } from 'react'
import { SubNavTabs } from '../components/shared/SubNavTabs'
import { Card } from '../components/shared/Card'
import { GraphQLEditor } from '../components/backend/GraphQLEditor'
import { GQLDocsSidebar } from '../components/backend/GQLDocsSidebar'
import { RESTExplorer } from '../components/backend/RESTExplorer'
import { PageWrapper } from '../components/layout/PageWrapper'
import { GitHubRepoLink } from '../components/shared/GitHubRepoLink'
import { defaultGraphQLQuery, REST_PROD_URL, GQL_PROD_URL } from '../data/mockData'

type BackendTab = 'graphql' | 'rest'

const tabDefs = [
  { value: 'graphql' as BackendTab, label: 'GraphQL' },
  { value: 'rest' as BackendTab, label: 'REST' },
]

export function BackendPage() {
  const [tab, setTab] = useState<BackendTab>('graphql')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [gqlQuery, setGqlQuery] = useState(defaultGraphQLQuery)

  return (
    <>
      {tab === 'graphql' && (
        <GQLDocsSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onUse={q => setGqlQuery(q)}
        />
      )}

      <PageWrapper>
        {/* Entire page content — shifts right on desktop when sidebar is open */}
        <div className={['transition-[padding] duration-300', sidebarOpen && tab === 'graphql' ? 'lg:pl-72' : ''].join(' ')}>
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-4 mb-1">
                <h1 className="text-2xl font-bold text-text-body">
                  Backend <span className="text-purple-light">Playground</span>
                </h1>
                <GitHubRepoLink repo={tab === 'graphql' ? 'chnnxyz/sashar-dev-gql-api' : 'chnnxyz/sashar-dev-rest-api'} />
              </div>
              <p className="text-sm text-text-muted">Explore this site via GraphQL queries or REST endpoints backed by a live Go API.</p>
              <p className="text-xs text-text-muted/70 mt-1.5 font-mono">
                {tab === 'graphql'
                  ? `Go · gqlgen · SQLite (shared) · ${GQL_PROD_URL}`
                  : `Go · Gorilla Mux · SQLite (shared) · ${REST_PROD_URL}`}
              </p>
            </div>
            {tab === 'graphql' && (
              <button
                onClick={() => setSidebarOpen(v => !v)}
                className={[
                  'shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer mt-1',
                  sidebarOpen
                    ? 'bg-purple/20 border-purple/40 text-purple-light'
                    : 'border-border-subtle text-text-muted hover:text-purple-light hover:border-purple/40',
                ].join(' ')}
              >
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2 2h12v1H2V2zm0 3h8v1H2V5zm0 3h10v1H2V8zm0 3h6v1H2V11z" />
                </svg>
                API Docs
              </button>
            )}
          </div>

          <SubNavTabs tabs={tabDefs} active={tab} onChange={t => { setTab(t); setSidebarOpen(false) }} />

          <div className="mt-6">
            {tab === 'graphql' && (
              <>
                <div className="mb-3 flex items-center gap-3 bg-bg-surface border border-border-subtle rounded-lg px-4 py-2.5">
                  <span className="text-xs font-mono text-text-muted">Endpoint:</span>
                  <span className="text-xs font-mono text-purple-light">{GQL_PROD_URL}</span>
                </div>
                <Card title="GraphQL Explorer" className="overflow-visible">
                  <GraphQLEditor query={gqlQuery} onQueryChange={setGqlQuery} />
                </Card>
              </>
            )}
            {tab === 'rest' && (
              <div className="space-y-4">
                <div className="bg-bg-surface border border-border-subtle rounded-lg px-4 py-3 flex items-center gap-3">
                  <span className="text-xs font-mono text-text-muted">Base URL:</span>
                  <span className="text-xs font-mono text-purple-light">{REST_PROD_URL}</span>
                </div>
                <RESTExplorer />
              </div>
            )}
          </div>
        </div>
      </PageWrapper>
    </>
  )
}
