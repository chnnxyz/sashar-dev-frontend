import { CVSection } from '../components/about/CVSection'
import { PageWrapper } from '../components/layout/PageWrapper'
import { focusRing } from '../components/shared/focusRing'

// The browser's default print pagination breaks the CV across arbitrary Letter-sized
// pages. Sizing a single @page box to the actual rendered content (plus a small buffer
// for print-time reflow) makes the export one continuous page instead — closer to a
// scrolled screenshot than a paginated document.
function downloadAsPdf() {
  const main = document.querySelector('main')
  if (!main) {
    window.print()
    return
  }

  const width = main.scrollWidth
  const height = main.scrollHeight + 120

  const style = document.createElement('style')
  style.textContent = `@media print { @page { size: ${width}px ${height}px; margin: 0; } }`
  document.head.appendChild(style)

  const cleanup = () => style.remove()
  window.addEventListener('afterprint', cleanup, { once: true })

  window.print()
}

export function CVPage() {
  return (
    <PageWrapper>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-purple-light">Sasha Ruiz de Aguirre</h1>
          <p className="text-sm text-text-muted mt-1">
            <a href="mailto:s@chnn.xyz" className={['hover:text-purple-light transition-colors duration-150', focusRing].join(' ')}>s@chnn.xyz</a> · <a href="https://linkedin.com/in/sruizdea" target="_blank" rel="noreferrer" className={['hover:text-purple-light transition-colors duration-150', focusRing].join(' ')}>linkedin.com/in/sruizdea</a> · <a href="https://github.com/chnnxyz" target="_blank" rel="noreferrer" className={['hover:text-purple-light transition-colors duration-150', focusRing].join(' ')}>github.com/chnnxyz</a> · <a href="https://wa.me/523314437948" target="_blank" rel="noreferrer" className={['hover:text-purple-light transition-colors duration-150', focusRing].join(' ')}>+52 (331) 443 7948</a>
          </p>
        </div>
        <button
          type="button"
          onClick={downloadAsPdf}
          className={['no-print shrink-0 font-mono text-[10px] text-text-muted border border-border-subtle px-3 py-1.5 hover:text-purple-light hover:border-purple-light/50 transition-colors duration-150', focusRing].join(' ')}
        >
          ↓ PDF
        </button>
      </div>
      <CVSection />
    </PageWrapper>
  )
}
