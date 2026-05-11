import { useState } from 'react'
import { SubNavTabs } from '../components/shared/SubNavTabs'
import { Card } from '../components/shared/Card'
import { GraphQLEditor } from '../components/backend/GraphQLEditor'
import { RESTExplorer } from '../components/backend/RESTExplorer'
import { PageWrapper } from '../components/layout/PageWrapper'

type BackendTab = 'graphql' | 'rest'

const tabDefs = [
  { value: 'graphql' as BackendTab, label: 'GraphQL' },
  { value: 'rest' as BackendTab, label: 'REST' },
]

export function BackendPage() {
  const [tab, setTab] = useState<BackendTab>('graphql')

  return (
    <PageWrapper>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-body mb-1">
          Backend <span className="text-purple-light">Playground</span>
        </h1>
        <p className="text-sm text-text-muted">Explore GraphQL queries and REST endpoints with mock responses.</p>
      </div>

      <SubNavTabs tabs={tabDefs} active={tab} onChange={setTab} />

      <div className="mt-6">
        {tab === 'graphql' && (
          <Card title="GraphQL Explorer">
            <GraphQLEditor />
          </Card>
        )}
        {tab === 'rest' && (
          <div className="space-y-4">
            <div className="bg-bg-surface border border-border-subtle rounded-lg px-4 py-3 flex items-center gap-3">
              <span className="text-xs font-mono text-text-muted">Base URL:</span>
              <span className="text-xs font-mono text-purple-light">http://localhost:8000/api/v1</span>
              <span className="text-xs text-text-muted ml-auto">{`All responses are mocked`}</span>
            </div>
            <RESTExplorer />
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
