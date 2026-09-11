import { useEffect, useState } from 'react'

const CODES = [
  {
    label: 'Raffiner',
    src: '/qr-raffiner.svg',
    url: 'https://www.raffiner.com.br/',
  },
  {
    label: 'Tânia Veiga',
    src: '/qr-tania.svg',
    url: 'https://taniaveiga.com.br/',
  },
] as const

type ActiveCode = (typeof CODES)[number]

export function QrLinks() {
  const [active, setActive] = useState<ActiveCode | null>(null)

  useEffect(() => {
    if (!active) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active])

  return (
    <>
      <aside className="qr-links" aria-label="QR Codes das marcas">
        {CODES.map((code) => (
          <button
            key={code.label}
            type="button"
            className="qr-links__item"
            onClick={() => setActive(code)}
            aria-label={`Abrir site ${code.label}`}
          >
            <img
              className="qr-links__image"
              src={code.src}
              alt={`QR Code ${code.label}`}
              width={100}
              height={100}
            />
            <span className="qr-links__label">{code.label}</span>
          </button>
        ))}
      </aside>

      {active ? (
        <div
          className="qr-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={active.label}
          onClick={() => setActive(null)}
        >
          <div
            className="qr-overlay__panel"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="qr-overlay__header">
              <h2 className="qr-overlay__title">{active.label}</h2>
              <button
                type="button"
                className="qr-overlay__close"
                onClick={() => setActive(null)}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>
            <iframe
              className="qr-overlay__frame"
              title={active.label}
              src={active.url}
            />
          </div>
        </div>
      ) : null}
    </>
  )
}
