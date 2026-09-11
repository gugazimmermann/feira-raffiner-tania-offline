import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import {
  VirtualKeyboard,
  type VirtualKeyboardMode,
} from './VirtualKeyboard'

export type LeadData = {
  nome: string
  empresa: string
  whatsapp: string
  instagram: string
}

type FieldErrors = Partial<Record<keyof LeadData, string>>

type LeadFormProps = {
  onSuccess: (data: LeadData) => void
}

const INSTAGRAM_HANDLE = /^[a-zA-Z0-9._]{1,30}$/

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

export function formatWhatsapp(value: string) {
  const digits = onlyDigits(value).slice(0, 11)

  if (digits.length <= 2) {
    return digits.length ? `(${digits}` : ''
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function normalizeInstagram(value: string) {
  return value.replace(/^@+/, '').slice(0, 30)
}

function validate(data: LeadData): FieldErrors {
  const errors: FieldErrors = {}

  if (data.nome.trim().length < 2) {
    errors.nome = 'Informe seu nome completo.'
  }

  const empresa = data.empresa.trim()
  if (empresa && empresa.length < 2) {
    errors.empresa = 'Informe o nome da empresa.'
  }

  const digits = onlyDigits(data.whatsapp)
  if (digits.length === 0) {
    errors.whatsapp = 'Informe seu WhatsApp.'
  } else if (digits.length !== 11 || digits[2] !== '9') {
    errors.whatsapp = 'Informe um WhatsApp válido com DDD.'
  }

  const handle = data.instagram.trim()
  if (handle && !INSTAGRAM_HANDLE.test(handle)) {
    errors.instagram = 'Informe um Instagram válido.'
  }

  return errors
}

function keyboardModeFor(field: keyof LeadData): VirtualKeyboardMode {
  return field === 'whatsapp' ? 'numeric' : 'text'
}

export function LeadForm({ onSuccess }: LeadFormProps) {
  const [form, setForm] = useState<LeadData>({
    nome: '',
    empresa: '',
    whatsapp: '',
    instagram: '',
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeField, setActiveField] = useState<keyof LeadData | null>(null)

  useEffect(() => {
    document.body.classList.toggle('keyboard-open', Boolean(activeField))
    return () => document.body.classList.remove('keyboard-open')
  }, [activeField])

  useEffect(() => {
    if (!activeField) return

    const timer = window.setTimeout(() => {
      document.getElementById(activeField)?.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      })
    }, 280)

    return () => window.clearTimeout(timer)
  }, [activeField])

  function clearFieldFeedback(key: keyof LeadData) {
    setSubmitError(null)
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function formatFieldValue(field: keyof LeadData, nextRaw: string) {
    if (field === 'whatsapp') return formatWhatsapp(nextRaw)
    if (field === 'instagram') return normalizeInstagram(nextRaw)
    return nextRaw
  }

  function handleKeyboardInput(char: string) {
    if (!activeField) return
    const field = activeField

    setForm((current) => ({
      ...current,
      [field]: formatFieldValue(field, current[field] + char),
    }))
    clearFieldFeedback(field)
  }

  function handleKeyboardBackspace() {
    if (!activeField) return
    const field = activeField

    setForm((current) => {
      if (field === 'whatsapp') {
        const digits = onlyDigits(current.whatsapp).slice(0, -1)
        return { ...current, whatsapp: formatWhatsapp(digits) }
      }

      return {
        ...current,
        [field]: formatFieldValue(field, current[field].slice(0, -1)),
      }
    })
    clearFieldFeedback(field)
  }

  function openKeyboard(field: keyof LeadData) {
    setActiveField(field)
    window.requestAnimationFrame(() => {
      document.getElementById(field)?.focus({ preventScroll: true })
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setActiveField(null)

    const nextErrors = validate(form)
    setErrors(nextErrors)
    setSubmitError(null)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    const payload: LeadData = {
      nome: form.nome.trim(),
      empresa: form.empresa.trim(),
      whatsapp: onlyDigits(form.whatsapp),
      instagram: form.instagram.trim(),
    }

    setSubmitting(true)

    const { error } = await supabase.from('leads').insert(payload)

    setSubmitting(false)

    if (error) {
      setSubmitError('Não foi possível enviar seus dados. Tente novamente.')
      return
    }

    onSuccess(payload)
  }

  return (
    <>
      <form className="lead-form" onSubmit={handleSubmit} noValidate>
        <div
          className={
            activeField === 'nome' ? 'field field--active' : 'field'
          }
          onPointerDown={() => openKeyboard('nome')}
        >
          <label htmlFor="nome">Nome</label>
          <input
            id="nome"
            name="nome"
            type="text"
            placeholder="Seu nome"
            value={form.nome}
            readOnly
            inputMode="none"
            tabIndex={0}
            aria-invalid={Boolean(errors.nome)}
            aria-describedby={errors.nome ? 'nome-error' : undefined}
          />
          {errors.nome ? (
            <p id="nome-error" className="field__error" role="alert">
              {errors.nome}
            </p>
          ) : null}
        </div>

        <div
          className={
            activeField === 'empresa' ? 'field field--active' : 'field'
          }
          onPointerDown={() => openKeyboard('empresa')}
        >
          <label htmlFor="empresa">Empresa</label>
          <input
            id="empresa"
            name="empresa"
            type="text"
            placeholder="Nome da empresa"
            value={form.empresa}
            readOnly
            inputMode="none"
            tabIndex={0}
            aria-invalid={Boolean(errors.empresa)}
            aria-describedby={errors.empresa ? 'empresa-error' : undefined}
          />
          {errors.empresa ? (
            <p id="empresa-error" className="field__error" role="alert">
              {errors.empresa}
            </p>
          ) : null}
        </div>

        <div
          className={
            activeField === 'whatsapp' ? 'field field--active' : 'field'
          }
          onPointerDown={() => openKeyboard('whatsapp')}
        >
          <label htmlFor="whatsapp">WhatsApp</label>
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            inputMode="none"
            placeholder="(11) 99999-9999"
            value={form.whatsapp}
            readOnly
            tabIndex={0}
            aria-invalid={Boolean(errors.whatsapp)}
            aria-describedby={errors.whatsapp ? 'whatsapp-error' : undefined}
          />
          {errors.whatsapp ? (
            <p id="whatsapp-error" className="field__error" role="alert">
              {errors.whatsapp}
            </p>
          ) : null}
        </div>

        {/* Instagram desabilitado por enquanto
        <div
          className={
            activeField === 'instagram' ? 'field field--active' : 'field'
          }
          onPointerDown={() => openKeyboard('instagram')}
        >
          <label htmlFor="instagram">Instagram</label>
          <div
            className={
              errors.instagram
                ? 'field__control field__control--prefix field__control--invalid'
                : 'field__control field__control--prefix'
            }
          >
            <span className="field__prefix" aria-hidden="true">
              @
            </span>
            <input
              id="instagram"
              name="instagram"
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="seu_usuario"
              value={form.instagram}
              readOnly
              inputMode="none"
              tabIndex={0}
              aria-invalid={Boolean(errors.instagram)}
              aria-describedby={
                errors.instagram ? 'instagram-error' : undefined
              }
            />
          </div>
          {errors.instagram ? (
            <p id="instagram-error" className="field__error" role="alert">
              {errors.instagram}
            </p>
          ) : null}
        </div>
        */}

        {submitError ? (
          <p className="field__error" role="alert">
            {submitError}
          </p>
        ) : null}

        <button className="submit-btn" type="submit" disabled={submitting}>
          {submitting ? 'Enviando…' : 'Enviar'}
        </button>
      </form>

      <VirtualKeyboard
        open={Boolean(activeField)}
        mode={activeField ? keyboardModeFor(activeField) : 'text'}
        onInput={handleKeyboardInput}
        onBackspace={handleKeyboardBackspace}
        onClose={() => setActiveField(null)}
      />
    </>
  )
}
