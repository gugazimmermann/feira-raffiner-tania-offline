export type LeadSpeechPatch = {
  nome?: string
  empresa?: string
  whatsapp?: string
}

type FieldKey = keyof LeadSpeechPatch

const LABEL_DEFS: { key: FieldKey; pattern: string }[] = [
  { key: 'whatsapp', pattern: 'whats\\s*app|telefone|celular|zap' },
  { key: 'empresa', pattern: 'empresa|companhia' },
  { key: 'nome', pattern: 'nome' },
]

const LABEL_SPLIT = new RegExp(
  `\\b(${LABEL_DEFS.map((d) => d.pattern).join('|')})\\b`,
  'gi',
)

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

function cleanValue(raw: string) {
  return raw
    .replace(/^[\s,:.\-–—]+/, '')
    .replace(/[\s,:.\-–—]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleCaseWords(value: string) {
  return value.replace(/\S+/g, (word) => {
    if (word.length === 1) return word.toUpperCase()
    return word.charAt(0).toUpperCase() + word.slice(1)
  })
}

function matchLabelKey(label: string): FieldKey | null {
  const normalized = label.toLowerCase().replace(/\s+/g, ' ').trim()
  for (const def of LABEL_DEFS) {
    if (new RegExp(`^(?:${def.pattern})$`, 'i').test(normalized)) {
      return def.key
    }
  }
  return null
}

/**
 * Extrai nome, empresa e WhatsApp de uma fala com rótulos em português.
 * Ex.: "nome José, empresa Raffiner, WhatsApp 47 98870 4247"
 */
export function parseLeadSpeech(transcript: string): LeadSpeechPatch {
  const text = transcript.replace(/\s+/g, ' ').trim()
  if (!text) return {}

  const matches = [...text.matchAll(LABEL_SPLIT)]
  if (matches.length === 0) return {}

  const patch: LeadSpeechPatch = {}

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const key = matchLabelKey(match[0])
    if (!key) continue

    const start = (match.index ?? 0) + match[0].length
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length
    const value = cleanValue(text.slice(start, end))
    if (!value) continue

    if (key === 'whatsapp') {
      const digits = onlyDigits(value).slice(0, 11)
      if (digits.length >= 10) {
        patch.whatsapp = digits
      }
    } else if (key === 'nome') {
      patch.nome = titleCaseWords(value)
    } else {
      patch.empresa = titleCaseWords(value)
    }
  }

  return patch
}
