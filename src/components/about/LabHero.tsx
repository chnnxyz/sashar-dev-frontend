import { useEffect, useState } from 'react'
import { GitHubRepoLink } from '../shared/GitHubRepoLink'

const WHOAMI = 'whoami'
const STAGE_ORDER = ['prompt', 'typing', 'name', 'role', 'link', 'done'] as const
type Stage = (typeof STAGE_ORDER)[number]

interface LabHeroProps {
  /** Fires once the boot sequence finishes — lets the page reveal content below in sync. */
  onComplete?: () => void
}

export function LabHero({ onComplete }: LabHeroProps) {
  const [stage, setStage] = useState<Stage>('prompt')
  const [typed, setTyped] = useState('')

  const atLeast = (s: Stage) => STAGE_ORDER.indexOf(stage) >= STAGE_ORDER.indexOf(s)
  const fade = (visible: boolean) => ['transition-opacity duration-500', visible ? 'opacity-100' : 'opacity-0'].join(' ')

  // Boot sequence: prompt -> type "whoami" -> name -> role -> link -> done.
  useEffect(() => {
    const t = setTimeout(() => setStage('typing'), 500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (stage !== 'typing') return
    if (typed.length >= WHOAMI.length) {
      const t = setTimeout(() => setStage('name'), 350)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setTyped(WHOAMI.slice(0, typed.length + 1)), 90)
    return () => clearTimeout(t)
  }, [stage, typed])

  useEffect(() => {
    if (stage !== 'name') return
    const t = setTimeout(() => setStage('role'), 450)
    return () => clearTimeout(t)
  }, [stage])

  useEffect(() => {
    if (stage !== 'role') return
    const t = setTimeout(() => setStage('link'), 350)
    return () => clearTimeout(t)
  }, [stage])

  useEffect(() => {
    if (stage !== 'link') return
    const t = setTimeout(() => { setStage('done'); onComplete?.() }, 350)
    return () => clearTimeout(t)
  }, [stage, onComplete])

  return (
    <div className="relative h-[20vh] min-h-[210px] w-full select-none overflow-hidden flex flex-col items-center justify-center pt-14 px-6">
      <div className="flex flex-col items-center">
        <p className="font-mono text-xs sm:text-sm text-text-muted/80 mb-2">
          <span className="text-purple-light">visitor@sashar</span>:~$ {typed}
          <span className={['terminal-cursor ml-0.5', atLeast('name') ? 'opacity-0' : 'opacity-100'].join(' ')}>▮</span>
        </p>
        <h1 className={[fade(atLeast('name')), 'text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-center leading-tight text-purple-light'].join(' ')}>
          Sasha Marina Ruiz de Aguirre
        </h1>
        <p className={[fade(atLeast('role')), 'mt-2.5 font-mono text-xs sm:text-sm text-text-muted text-center'].join(' ')}>
          machine_learning_engineer · backend_developer · technical_lead
        </p>
        <div className={[fade(atLeast('link')), 'mt-2'].join(' ')}>
          <GitHubRepoLink repo="chnnxyz" />
        </div>
      </div>
    </div>
  )
}
