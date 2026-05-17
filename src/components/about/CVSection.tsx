import { useEffect, useRef, useState, type ReactNode } from 'react'

const SKILLS = [
  { label: 'Python / ML Stack', pct: 95 },
  { label: 'Backend Systems', pct: 88 },
  { label: 'Deep Learning', pct: 85 },
  { label: 'MLOps / Cloud', pct: 82 },
  { label: 'Distributed Systems / Microservices', pct: 80 },
  { label: 'Data Engineering', pct: 75 },
]

function SkillBars() {
  const [filled, setFilled] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setFilled(true); observer.disconnect() } },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="space-y-3">
      {SKILLS.map((skill, i) => (
        <div key={skill.label}>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-text-muted">{skill.label}</span>
            <span className="text-purple-light">{skill.pct}%</span>
          </div>
          <div className="h-1.5 bg-bg-base rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-dark to-purple-light rounded-full"
              style={{
                width: filled ? `${skill.pct}%` : '0%',
                transition: `width 800ms cubic-bezier(0.4, 0, 0.2, 1) ${i * 80}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

interface CVEntry {
  title: string
  org: string
  period: string
  bullets: ReactNode[]
}

const experience: CVEntry[] = [
  {
    title: 'Senior Machine Learning Engineer',
    org: 'Udemy · Remote',
    period: '2025 – Present',
    bullets: [
      'Leading automation of behavior-based promotions using traditional ML and deep reinforcement learning across Udemy\'s global user base.',
      'Building personalized recommendation systems for email and push notification channels; designing and running A/B experiments across recommendation strategies.',
      'Contributing to the microservices migration of the recommendations infrastructure.',
    ],
  },
  {
    title: 'Founding Backend Engineer / Technical Lead',
    org: 'Sistemas Agaricus · Mexico',
    period: '2025 – Present',
    bullets: [
      'Defined system architecture for multiple web and mobile products from the ground up.',
      'Built a Go + gRPC microservice backend for a local eTicketing platform and an Elixir microservice backend for a fintech application.',
      'Delivered a .NET web application for automated invoice processing and accounting workflows.',
    ],
  },
  {
    title: 'Data Science Technical Lead',
    org: 'Valiot · Mexico',
    period: '2023 – 2025',
    bullets: [
      'Directed data science teams through the full product lifecycle: PoC, proof of value, development, and deployment in industrial IoT contexts.',
      'Designed and built an LLM-powered chatbot enabling natural-language interaction with industrial software.',
      'Developed internal Python libraries for NN architecture optimization (NEAT, Tabu Search), metaheuristic algorithms (GA, SA, PSO), fuzzy logic, and anomaly/outlier detection; created ML bindings for the Elixir backend.',
    ],
  },
  {
    title: 'Senior Data Scientist / Software Engineer',
    org: 'Valiot · Mexico',
    period: '2022 – 2023',
    bullets: [
      'Built a low-code time series forecasting solution adopted across multiple manufacturing clients.',
      'Developed anomaly detection libraries for time series and tabular data used in production industrial IoT pipelines.',
      'Deployed CI/CD pipelines for AI model lifecycle management; optimized manufacturing programs with metaheuristics.',
    ],
  },
  {
    title: 'Lead Data Scientist',
    org: 'Junction AI · Remote',
    period: '2021 – 2022',
    bullets: [
      'Developed NLP pipelines for e-commerce listings: topic extraction, relevance scoring, and AI-driven title generation.',
      'Researched and deployed to cloud a modular demand forecasting pipeline leveraging neural networks, Bayesian models, and classical time series methods for retail clients.',
    ],
  },
  {
    title: 'Analytic Consultant / Data Scientist',
    org: 'Fair Isaac Corporation (FICO) · Remote',
    period: '2020 – 2021',
    bullets: [
      'Developed ML models to optimize credit decisions for international financial institutions.',
      'Built analytical tools and data pipelines in Python and PySpark across large-scale financial datasets.',
    ],
  },
  {
    title: 'Business Intelligence Analyst',
    org: 'Garena Online Private Limited · Mexico City, MX',
    period: '2019 – 2020',
    bullets: [
      'Built predictive models using supervised and unsupervised ML to forecast mobile game user quantities.',
      'Leveraged marketing data to identify high-value audience segments and develop social media strategies to increase revenue.',
    ],
  },
]

const education: CVEntry[] = [
  {
    title: 'M.Sc. Risk Management',
    org: 'Instituto Tecnológico Autónomo de México (ITAM)',
    period: '2025',
    bullets: [
      'Quantitative focus: financial risk models, statistical inference, and stochastic processes.',
      <>Thesis (Special Mention): <em>An Automated System for Time Series Prediction Applied to Stock Market Prices and Returns.</em></>,
    ],
  },
  {
    title: 'B.Sc. Physics',
    org: 'Universidad de Guadalajara',
    period: '2015',
    bullets: [
      'Focus: Lie Algebras, Quantum Mechanics, Statistical Mechanics, and Dynamical Systems.',
      'Worked two years with the Quantum Optics and Quantum Information group led by Andrei Klimov, Ph.D.',
    ],
  },
]

const publications = [
  {
    title: 'A Deep Reinforcement Learning Approach to Modeling Rat Behavior in Peak Interval Procedure',
    venue: 'Timing Research Forum 4 · University of Tokyo, Japan · 2025',
    href: 'https://github.com/chnnxyz/trfjpn',
    description: [
      'Customizable Skinner box with configurable reward and loss logic; independent rat agents trained via deep reinforcement learning to replicate the timing behavior of control group rats in a peak interval procedure.',
    ],
  },
  {
    title: 'Kicked Harmonic Oscillator',
    venue: 'Congreso Nacional de Física 2013 · Oct 14, 2013',
    href: null,
    description: [
      'Numerical study of quantum chaos via a time-dependent cosine kick (Dirac delta Hamiltonian perturbation) across the first 100 harmonic oscillator eigenstates.',
    ],
  },
]

const techStack = [
  'Python', 'Go', 'Rust', 'Elixir', 'R', 'C/C++', 'C#', 'JavaScript',
  'FastAPI', 'gRPC', 'GraphQL', 'React', 'Vue', 'Redis', 'PostgreSQL', 'MongoDB', 'AWS', 'Azure', 'Docker', 'CI/CD', 'REST APIs',
  'Spark', 'PySpark', 'ETL', 'Kubernetes', 'Subversion', 'Git',
]

function EntryBlock({ entry }: { entry: CVEntry }) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="font-semibold text-text-body text-sm">{entry.title}</span>
        <span className="text-xs text-text-muted whitespace-nowrap shrink-0">{entry.period}</span>
      </div>
      <div className="text-xs text-purple-light mb-2">{entry.org}</div>
      <ul className="space-y-1">
        {entry.bullets.map((b, i) => (
          <li key={i} className="text-xs text-text-muted flex gap-2">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-border-subtle shrink-0" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SectionHeader({ children }: { children: string }) {
  return (
    <h3 className="text-xs font-bold text-purple uppercase tracking-widest mb-4 pb-2 border-b border-border-subtle">
      {children}
    </h3>
  )
}

export function CVSection() {
  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-5">
        <h2 className="text-xl font-bold text-text-body">Curriculum Vitae</h2>
        <p className="text-sm text-text-muted mt-0.5">
          Sasha Ruiz de Aguirre · <a href="mailto:s@chnn.xyz" className="hover:text-purple-light transition-colors duration-150">s@chnn.xyz</a> · <a href="https://linkedin.com/in/sruizdea" target="_blank" rel="noreferrer" className="hover:text-purple-light transition-colors duration-150">linkedin.com/in/sruizdea</a> · <a href="https://github.com/chnnxyz" target="_blank" rel="noreferrer" className="hover:text-purple-light transition-colors duration-150">github.com/chnnxyz</a> · <a href="https://wa.me/523314437948" target="_blank" rel="noreferrer" className="hover:text-purple-light transition-colors duration-150">+52 (331) 443 7948</a>
        </p>
      </div>
      <div className="h-px bg-gradient-to-r from-purple/25 via-border-subtle/60 to-transparent" />

      <div className="grid md:grid-cols-[2fr_1fr] divide-y md:divide-y-0 md:divide-x divide-border-subtle">
        {/* Left column */}
        <div className="p-6 space-y-7">
          <div>
            <SectionHeader>Professional Summary</SectionHeader>
            <p className="text-sm text-text-muted leading-relaxed">
              Engineer with 9+ years of experience across machine learning, backend systems, and data science. Currently a Senior ML Engineer at Udemy building recommendation and promotion systems at scale, and Technical Lead at Sistemas Agaricus designing microservice backends in Go and Elixir. Proven track record delivering production ML systems ranging from deep RL and LLM applications to time series forecasting and anomaly detection, with a rigorous quantitative foundation in Physics and Risk Management.
            </p>
          </div>

          <div>
            <SectionHeader>Work Experience</SectionHeader>
            {experience.map(e => <EntryBlock key={e.title + e.period} entry={e} />)}
          </div>

          <div>
            <SectionHeader>Education</SectionHeader>
            {education.map(e => <EntryBlock key={e.title} entry={e} />)}
          </div>

          <div>
            <SectionHeader>Publications</SectionHeader>
            <div className="space-y-4">
              {publications.map(p => (
                <div key={p.title} className="text-xs">
                  {p.href ? (
                    <a href={p.href} target="_blank" rel="noreferrer" className="text-text-body font-medium leading-relaxed hover:text-purple-light transition-colors duration-150">
                      <em>{p.title}</em>
                    </a>
                  ) : (
                    <span className="text-text-body font-medium leading-relaxed"><em>{p.title}</em></span>
                  )}
                  <p className="text-text-muted mt-0.5">{p.venue}</p>
                  <ul className="mt-1 space-y-0.5">
                    {p.description.map((d, i) => (
                      <li key={i} className="text-text-muted opacity-75 flex gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-border-subtle shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="p-6 space-y-7">
          <div>
            <SectionHeader>Core Skills</SectionHeader>
            <SkillBars />
          </div>

          <div>
            <SectionHeader>Tech Stack</SectionHeader>
            <div className="flex flex-wrap gap-2">
              {techStack.map(t => (
                <span key={t} className="text-[10px] px-2 py-1 rounded-md bg-bg-base border border-border-subtle text-text-muted">{t}</span>
              ))}
            </div>
          </div>

          <div>
            <SectionHeader>Languages</SectionHeader>
            <ul className="space-y-2">
              {[
                { lang: 'Spanish', level: 'Native' },
                { lang: 'English', level: 'Professional' },
                { lang: 'Japanese', level: 'N4' },
              ].map(l => (
                <li key={l.lang} className="flex justify-between text-xs">
                  <span className="text-text-muted">{l.lang}</span>
                  <span className="text-text-body">{l.level}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionHeader>Interests</SectionHeader>
            <div className="flex flex-wrap gap-2">
              {[
                'Reinforcement Learning', 'Bayesian ML', 'Time Series',
                'Metaheuristics', 'LLMs', 'Systems Programming',
                'Neuro-Fuzzy Systems', 'Open Source',
              ].map(i => (
                <span key={i} className="text-[10px] px-2 py-1 rounded-md bg-bg-base border border-border-subtle text-text-muted">{i}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
