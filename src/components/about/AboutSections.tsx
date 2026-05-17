import { Card } from '../shared/Card'

const sections = [
  {
    title: 'Who I Am',
    content: `I'm Sasha Ruiz de Aguirre, 33, based in Guadalajara, Mexico. Physicist by training, engineer by trade. I've spent the last decade building ML systems and backend infrastructure across industries ranging from fintech and e-commerce to industrial IoT and gaming. Outside of work I produce music, DJ, and shoot photography; I find these creative disciplines feed back into how I approach technical problems.`,
  },
  {
    title: 'What I Do',
    content: `I build production ML and backend services: recommendation engines, time series forecasting pipelines, anomaly detection, LLM applications, and fuzzy logic controllers for industrial automation. On the backend side I design microservice architectures in Go and Elixir. For large-scale distributed workloads I reach for Spark and Kubernetes.`,
  },
  {
    title: 'My Approach',
    content: `A physics background rewired how I approach problems: model the system first, identify the real constraints, then find the most direct path to a solution. I tend to iterate quickly, borrow ideas from adjacent fields, and question assumptions that get treated as fixed. Strong fundamentals usually mean finding faster, cleaner paths through complexity.`,
  },
  {
    title: 'Current Focus',
    content: `At Udemy I'm building behavior-based promotion and recommendation systems using deep reinforcement learning. At Sistemas Agaricus I'm working on backend architecture for web and mobile products. On the data side I handle database migrations and real-time model training pipelines. Outside of work I'm exploring systems programming, IoT, electronics, and game development.`,
  },
]

const skills = [
  { category: 'ML / AI', items: ['Python', 'PyTorch', 'scikit-learn', 'Deep RL', 'LLMs', 'Time Series'] },
  { category: 'Backend', items: ['Go', 'Elixir', 'gRPC / GraphQL', 'FastAPI', '.NET', 'PostgreSQL / MongoDB / Redis'] },
  { category: 'Data', items: ['Spark / PySpark', 'ETL', 'Anomaly Detection', 'Forecasting', 'Query Optimization', 'R'] },
  { category: 'Cloud & Tools', items: ['AWS', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'Git'] },
]

export function AboutSections() {
  return (
    <div className="space-y-12">
      <div className="grid md:grid-cols-2 gap-6">
        {sections.map(section => (
          <Card key={section.title}>
            <h2 className="text-lg font-semibold text-purple-light mb-3">{section.title}</h2>
            <p className="text-text-muted leading-relaxed text-sm">{section.content}</p>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-text-body mb-5">
          Technical <span className="text-purple-light">Skills</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {skills.map(group => (
            <Card key={group.category}>
              <h3 className="text-xs font-semibold text-purple uppercase tracking-widest mb-3">{group.category}</h3>
              <ul className="space-y-1.5">
                {group.items.map(item => (
                  <li key={item} className="text-sm text-text-muted flex items-center gap-2">
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
  )
}
