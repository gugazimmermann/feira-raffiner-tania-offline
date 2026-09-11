import { useEffect, useState } from 'react'
import './App.css'
import {
  LeadForm,
  formatWhatsapp,
  type LeadData,
} from './components/LeadForm'
import { LogoPair } from './components/LogoPair'
import { QrLinks } from './components/QrLinks'

const SUCCESS_TIMEOUT_MS = 30_000

function App() {
  const [submitted, setSubmitted] = useState<LeadData | null>(null)

  useEffect(() => {
    if (!submitted) return

    const timer = window.setTimeout(() => {
      setSubmitted(null)
    }, SUCCESS_TIMEOUT_MS)

    return () => window.clearTimeout(timer)
  }, [submitted])

  return (
    <main className="page">
      <div className="page__inner">
        <LogoPair />

        {/* <header className="page__intro">
          <p>Deixe seus dados e entraremos em contato em breve.</p>
        </header> */}

        <section className="panel" aria-live="polite">
          {submitted ? (
            <div className="success">
              <div className="success__badge" aria-hidden="true">
                ✓
              </div>
              <h2>Dados recebidos</h2>
              <p>Obrigado! Confira o resumo do que foi enviado.</p>
              <ul className="success__summary">
                <li>
                  <span>Nome</span>
                  <strong>{submitted.nome}</strong>
                </li>
                <li>
                  <span>Empresa</span>
                  <strong>{submitted.empresa}</strong>
                </li>
                <li>
                  <span>WhatsApp</span>
                  <strong>{formatWhatsapp(submitted.whatsapp)}</strong>
                </li>
                {/* Instagram desabilitado por enquanto
                <li>
                  <span>Instagram</span>
                  <strong>@{submitted.instagram}</strong>
                </li>
                */}
              </ul>
              <button
                className="reset-btn"
                type="button"
                onClick={() => setSubmitted(null)}
              >
                Voltar
              </button>
            </div>
          ) : (
            <LeadForm onSuccess={setSubmitted} />
          )}
        </section>
      </div>

      <QrLinks />
    </main>
  )
}

export default App
