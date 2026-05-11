import { ThreeHero } from '../components/about/ThreeHero'
import { AboutSections } from '../components/about/AboutSections'
import { PageWrapper } from '../components/layout/PageWrapper'

export function AboutPage() {
  return (
    <div>
      <ThreeHero />
      <PageWrapper className="space-y-16">
        <AboutSections />
      </PageWrapper>
    </div>
  )
}
