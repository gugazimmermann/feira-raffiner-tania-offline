import { useCallback, useEffect, useRef, useState } from 'react'
import {
  parseLeadSpeech,
  type LeadSpeechPatch,
} from '../lib/parseLeadSpeech'

export type SpeechStatus = 'idle' | 'listening' | 'unsupported' | 'error'

type UseSpeechToLeadOptions = {
  onResult: (patch: LeadSpeechPatch, transcript: string) => void
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

export function useSpeechToLead({ onResult }: UseSpeechToLeadOptions) {
  const Recognition = getSpeechRecognitionConstructor()
  const supported = Boolean(Recognition)

  const [status, setStatus] = useState<SpeechStatus>(
    supported ? 'idle' : 'unsupported',
  )
  const [interimTranscript, setInterimTranscript] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const onResultRef = useRef(onResult)
  const intentionalStopRef = useRef(false)

  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  useEffect(() => {
    return () => {
      intentionalStopRef.current = true
      recognitionRef.current?.abort()
      recognitionRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    intentionalStopRef.current = true
    recognitionRef.current?.stop()
  }, [])

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionConstructor()
    if (!Ctor) {
      setStatus('unsupported')
      setErrorMessage('Microfone disponível no Chrome.')
      return
    }

    recognitionRef.current?.abort()
    intentionalStopRef.current = false
    setErrorMessage(null)
    setInterimTranscript('')

    const recognition = new Ctor()
    recognition.lang = 'pt-BR'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    recognition.onstart = () => {
      setStatus('listening')
    }

    recognition.onresult = (event) => {
      let interim = ''
      let finalText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const piece = result[0]?.transcript ?? ''
        if (result.isFinal) {
          finalText += piece
        } else {
          interim += piece
        }
      }

      if (interim) {
        setInterimTranscript(interim.trim())
      }

      if (finalText.trim()) {
        const transcript = finalText.trim()
        setInterimTranscript(transcript)
        const patch = parseLeadSpeech(transcript)
        onResultRef.current(patch, transcript)
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'aborted' || intentionalStopRef.current) {
        return
      }

      const messages: Record<string, string> = {
        'not-allowed': 'Permissão do microfone negada.',
        'no-speech': 'Não ouvimos nada. Tente de novo.',
        'audio-capture': 'Não foi possível acessar o microfone.',
        network: 'Sem conexão para reconhecer a voz.',
      }

      setStatus('error')
      setErrorMessage(
        messages[event.error] ?? 'Não foi possível usar o microfone.',
      )
    }

    recognition.onend = () => {
      recognitionRef.current = null
      setStatus((current) => (current === 'error' ? current : 'idle'))
    }

    try {
      recognition.start()
    } catch {
      setStatus('error')
      setErrorMessage('Não foi possível iniciar o microfone.')
    }
  }, [])

  const toggle = useCallback(() => {
    if (status === 'listening') {
      stop()
      return
    }
    start()
  }, [start, status, stop])

  return {
    supported,
    status,
    interimTranscript,
    errorMessage,
    start,
    stop,
    toggle,
  }
}
