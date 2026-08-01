import { Card } from '../shared/Card'

const sections = [
  {
    title: '$ whoami',
    content: `Sasha Marina Ruiz de Aguirre. 33. Guadalajara, Mexico. Physicist by training, engineer by trade. I've spent the last decade building ML systems and backend infrastructure across industries ranging from fintech and e-commerce to industrial IoT and gaming. Outside of work I produce music, DJ, and shoot photography; I find these creative disciplines feed back into how I approach technical problems.`,
  },
  {
    title: '$ mywork',
    content: `I build production ML and backend services: recommendation engines, time series forecasting pipelines, Spark ETL workflows, anomaly detection, LLM applications, and fuzzy logic controllers. On the backend side I design microservice architectures in Go and Elixir with Kubernetes.`,
  },
  {
    title: '$ myapproach',
    content: `My background in physics defined how I approach problems: model the system first, identify the real constraints, then find the most direct path to a solution. I tend to iterate quickly, research on the relevant industry fields, and question assumptions that would commonly be treated as hard rules. My knowledge of mathematics and algorithms helps me identify the ideal balance between cost and accuracy.`,
  },
  {
    title: '$ currentfocus',
    content: `At Udemy I'm building behavior-based promotion and recommendation systems using deep reinforcement learning. At Sistemas Agaricus I'm working on end-to-end product architecture. I work with DeltaLake lakehouses and on-line model training anf inference pipelines. As a hobby I'm exploring systems programming, IoT, electronics, and game development.`,
  },
]

const skills = [
  { category: 'ML / AI', items: ['Python', 'PyTorch', 'scikit-learn', 'Deep RL', 'LLMs', 'Time Series'] },
  { category: 'Backend', items: ['Go', 'Elixir', 'gRPC / GraphQL', 'FastAPI', '.NET', 'PostgreSQL / MongoDB / Redis'] },
  { category: 'Data', items: ['Spark / PySpark', 'ETL', 'Anomaly Detection', 'Forecasting', 'Query Optimization', 'R'] },
  { category: 'Cloud & Tools', items: ['AWS', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'Git'] },
]

interface AboutSectionsProps {
  /** Reveal rows one by one (staggered) once true; stays hidden-but-mounted until then. */
  visible: boolean
}

export function AboutSections({ visible }: AboutSectionsProps) {
  const rowClass = 'flex gap-4 py-3.5 border-b border-border-subtle/60 transition-opacity duration-[600ms]'
  const rowStyle = (i: number) => ({ transitionDelay: visible ? `${i * 180}ms` : '0ms' })

  return (
    <div className="border-t border-border-subtle/60">
      {sections.map((section, i) => (
        <div
          key={section.title}
          className={[rowClass, visible ? 'opacity-100' : 'opacity-0'].join(' ')}
          style={rowStyle(i)}
        >
          <span className="font-mono text-[10px] text-text-muted/80 pt-0.5 shrink-0 w-6">
            {String(i + 1).padStart(2, '0')}
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-purple-light mb-1">{section.title}</h2>
            <p className="text-text-muted leading-normal text-sm">{section.content}</p>
          </div>
        </div>
      ))}

      <div
        className={[rowClass, visible ? 'opacity-100' : 'opacity-0'].join(' ')}
        style={rowStyle(sections.length)}
      >
        <span className="font-mono text-[10px] text-text-muted/80 pt-0.5 shrink-0 w-6">
          {String(sections.length + 1).padStart(2, '0')}
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-purple-light mb-2">$ techskills</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {skills.map(group => (
              <Card key={group.category} static innerClassName="p-3">
                <h3 className="text-[10px] font-semibold text-purple uppercase tracking-widest mb-2">{group.category}</h3>
                <ul className="space-y-1">
                  {group.items.map(item => (
                    <li key={item} className="font-mono text-xs text-text-muted flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-purple shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
