import { useEffect, useRef, useState } from 'react'

const SKILLS = [
  { label: 'Machine Learning', pct: 95 },
  { label: 'Python / PyTorch', pct: 93 },
  { label: 'MLOps / Deployment', pct: 85 },
  { label: 'Backend (FastAPI)', pct: 82 },
  { label: 'Data Engineering', pct: 78 },
  { label: 'Frontend (React)', pct: 72 },
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
  bullets: string[]
}

const experience: CVEntry[] = [
  {
    title: 'Senior Machine Learning Engineer',
    org: 'Lorem Ipsum Corp · San Francisco, CA',
    period: '2022 – Present',
    bullets: [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.',
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
      'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim.',
    ],
  },
  {
    title: 'ML Engineer',
    org: 'Dolor Amet Analytics · New York, NY',
    period: '2020 – 2022',
    bullets: [
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.',
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque.',
    ],
  },
  {
    title: 'Data Scientist',
    org: 'Consectetur Insights · Remote',
    period: '2018 – 2020',
    bullets: [
      'Neque porro quisquam est qui dolorem ipsum quia dolor sit amet consectetur adipisci velit.',
      'Nam libero tempore cum soluta nobis est eligendi optio cumque nihil impedit.',
    ],
  },
]

const education: CVEntry[] = [
  {
    title: 'M.Sc. Artificial Intelligence',
    org: 'University of Lorem Ipsum',
    period: '2016 – 2018',
    bullets: ['Thesis: Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.', 'GPA: 3.94 / 4.00'],
  },
  {
    title: 'B.Sc. Computer Science & Mathematics',
    org: 'Dolor Sit University',
    period: '2012 – 2016',
    bullets: ['Graduated Magna Cum Laude', 'Specialization in Statistical Learning and Optimisation'],
  },
]

const publications = [
  {
    title: 'Lorem Ipsum Dolor: A Novel Approach to Temporal Forecasting with Sparse Signals',
    venue: 'NeurIPS 2023',
    authors: 'Ruiz de Aguirre S., et al.',
  },
  {
    title: 'Consectetur Adipiscing Elit: Scalable Bayesian Optimization for Hyperparameter Search',
    venue: 'ICML 2022',
    authors: 'Ruiz de Aguirre S., Lorem J., Ipsum K.',
  },
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
            {b}
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
          Sasha Ruiz de Aguirre · <a href="mailto:sasha@sashar.dev" className="hover:text-purple-light transition-colors duration-150">sasha@sashar.dev</a> · <a href="https://github.com/sashardev" target="_blank" rel="noreferrer" className="hover:text-purple-light transition-colors duration-150">github.com/sashardev</a> · <a href="https://wa.me/34600000000" target="_blank" rel="noreferrer" className="hover:text-purple-light transition-colors duration-150">+34 600 000 000</a>
        </p>
      </div>
      <div className="h-px bg-gradient-to-r from-purple/25 via-border-subtle/60 to-transparent" />

      <div className="grid md:grid-cols-[2fr_1fr] divide-y md:divide-y-0 md:divide-x divide-border-subtle">
        {/* Left column */}
        <div className="p-6 space-y-7">
          <div>
            <SectionHeader>Professional Summary</SectionHeader>
            <p className="text-sm text-text-muted leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit.
            </p>
          </div>

          <div>
            <SectionHeader>Work Experience</SectionHeader>
            {experience.map(e => <EntryBlock key={e.title} entry={e} />)}
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
                  <p className="text-text-body font-medium leading-relaxed">{p.title}</p>
                  <p className="text-text-muted mt-0.5">{p.authors}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded bg-purple/10 text-purple-light text-[10px] font-semibold">{p.venue}</span>
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
            <SectionHeader>Languages</SectionHeader>
            <ul className="space-y-2">
              {[
                { lang: 'English', level: 'Native' },
                { lang: 'Spanish', level: 'Native' },
                { lang: 'French', level: 'Intermediate' },
                { lang: 'Portuguese', level: 'Basic' },
              ].map(l => (
                <li key={l.lang} className="flex justify-between text-xs">
                  <span className="text-text-muted">{l.lang}</span>
                  <span className="text-text-body">{l.level}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionHeader>Certifications</SectionHeader>
            <ul className="space-y-2 text-xs text-text-muted">
              {[
                'AWS Certified ML Specialist · 2023',
                'Google Professional Data Engineer · 2022',
                'Deep Learning Specialization (Coursera) · 2020',
                'Kubernetes CKA · 2021',
              ].map(c => (
                <li key={c} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-purple shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionHeader>Open Source</SectionHeader>
            <ul className="space-y-2 text-xs text-text-muted">
              {[
                'lorem-ts · TypeScript utility library (1.2k ★)',
                'ipsum-ml · Scikit-learn pipelines toolkit (890 ★)',
                'dolor-bench · Benchmarking framework for time series models (540 ★)',
              ].map(p => (
                <li key={p} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-purple shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionHeader>Interests</SectionHeader>
            <div className="flex flex-wrap gap-2">
              {['Bayesian ML', 'Time Series', 'NLP', 'Edge AI', 'Neuro-AI', 'Open Source', 'Rock Climbing', 'Jazz Piano'].map(i => (
                <span key={i} className="text-[10px] px-2 py-1 rounded-md bg-bg-base border border-border-subtle text-text-muted">{i}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
