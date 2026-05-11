import { Card } from '../shared/Card'

const sections = [
  {
    title: 'Who I Am',
    content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`,
  },
  {
    title: 'What I Do',
    content: `Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.`,
  },
  {
    title: 'My Approach',
    content: `Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit. At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.`,
  },
  {
    title: 'Current Focus',
    content: `Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est.`,
  },
]

const skills = [
  { category: 'ML / AI', items: ['Python', 'PyTorch', 'scikit-learn', 'XGBoost', 'LightGBM', 'Transformers'] },
  { category: 'Backend', items: ['FastAPI', 'GraphQL', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes'] },
  { category: 'Frontend', items: ['React', 'TypeScript', 'D3.js', 'Three.js', 'Tailwind CSS'] },
  { category: 'Cloud', items: ['AWS', 'GCP', 'MLflow', 'Airflow', 'Terraform'] },
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
