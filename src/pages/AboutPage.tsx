import { useState } from 'react'
import { LabHero } from '../components/about/LabHero'
import { AboutSections } from '../components/about/AboutSections'
import { PageWrapper } from '../components/layout/PageWrapper'

export function AboutPage() {
  const [heroDone, setHeroDone] = useState(false)

  return (
    <div>
      <LabHero onComplete={() => setHeroDone(true)} />
      <PageWrapper className="!pt-2 !pb-6">
        <AboutSections visible={heroDone} />
      </PageWrapper>
    </div>
  )
}
