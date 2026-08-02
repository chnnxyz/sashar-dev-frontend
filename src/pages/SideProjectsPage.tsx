import { PageWrapper } from '../components/layout/PageWrapper'
import { Card } from '../components/shared/Card'
import { focusRing } from '../components/shared/focusRing'

interface SideProject {
  name: string
  url: string
  description: string
}

const projects: SideProject[] = [
  {
    name: 'versasha.com : A site for my music projects',
    url: 'https://versasha.com',
    description: 'A site where you can find my music and play with Rust + WebAssembly synths.',
  },
]

export function SideProjectsPage() {
  return (
    <PageWrapper>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-purple-light mb-1">Side Projects</h1>
        <p className="text-sm text-text-muted"> Projects unrelated to my main work..</p>
      </div>

      <div className="flex flex-col gap-4">
        {projects.map(project => (
          <a
            key={project.url}
            href={project.url}
            target="_blank"
            rel="noreferrer"
            className={['block', focusRing].join(' ')}
          >
            <Card title={project.name}>
              <p className="text-sm text-text-muted mb-3">{project.description}</p>
              <span className="text-glow-hover inline-flex items-center gap-1.5 text-xs font-mono text-purple-light">
                {project.url.replace('https://', '')}
                <svg className="w-3 h-3 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M6 3H3v10h10v-3M9 3h4v4M13 3L7 9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Card>
          </a>
        ))}
      </div>
    </PageWrapper>
  )
}
