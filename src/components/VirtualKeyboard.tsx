import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

export type VirtualKeyboardMode = 'text' | 'numeric'

type TextLayer = 'letters' | 'accents' | 'symbols'

type VirtualKeyboardProps = {
  open: boolean
  mode: VirtualKeyboardMode
  onInput: (char: string) => void
  onBackspace: () => void
  onClose: () => void
}

type ShiftState = 'off' | 'once' | 'caps'

type AccentPopup = {
  base: string
  options: string[]
  left: number
  bottom: number
}

const LONG_PRESS_MS = 400

const LETTER_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ç'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
] as const

const ACCENT_VARIANTS: Record<string, string[]> = {
  a: ['á', 'à', 'ã', 'â'],
  e: ['é', 'ê', 'è'],
  i: ['í', 'î', 'ì'],
  o: ['ó', 'õ', 'ô', 'ò'],
  u: ['ú', 'ü', 'û', 'ù'],
  c: ['ç'],
  n: ['ñ'],
}

const ACCENT_ROWS = [
  ['á', 'é', 'í', 'ó', 'ú'],
  ['ã', 'õ', 'â', 'ê', 'ô'],
  ['à', 'è', 'ì', 'ò', 'ù'],
  ['ü', 'û', 'î', 'ñ', 'ç'],
] as const

const SYMBOL_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['-', '_', '.', '@', ',', '!', '?', "'", '"'],
  ['(', ')', '/', '&', '+', '=', '%'],
] as const

const NUMERIC_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['0'],
] as const

function preventFocusSteal(event: PointerEvent<HTMLButtonElement>) {
  event.preventDefault()
}

function KeyButton({
  label,
  ariaLabel,
  className,
  wide,
  active,
  longPressOptions,
  holdHint,
  onPress,
  onLongPress,
}: {
  label: string
  ariaLabel?: string
  className?: string
  wide?: boolean
  active?: boolean
  longPressOptions?: string[]
  holdHint?: string
  onPress: () => void
  onLongPress?: (options: string[], rect: DOMRect) => void
}) {
  const timerRef = useRef<number | null>(null)
  const longPressedRef = useRef(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    preventFocusSteal(event)
    longPressedRef.current = false

    if (!longPressOptions?.length || !onLongPress) return

    clearTimer()
    timerRef.current = window.setTimeout(() => {
      longPressedRef.current = true
      const rect = buttonRef.current?.getBoundingClientRect()
      if (rect) onLongPress(longPressOptions, rect)
    }, LONG_PRESS_MS)
  }

  function handlePointerEnd() {
    clearTimer()
  }

  const canHold = Boolean(longPressOptions?.length)

  return (
    <button
      ref={buttonRef}
      type="button"
      className={[
        'vk-key',
        wide ? 'vk-key--wide' : '',
        active ? 'vk-key--active' : '',
        canHold ? 'vk-key--holdable' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={
        canHold
          ? `${ariaLabel ?? label}. Segure para acentos`
          : (ariaLabel ?? label)
      }
      title={canHold ? 'Segure para ver acentos' : undefined}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onClick={(event) => {
        event.preventDefault()
        if (longPressedRef.current) {
          longPressedRef.current = false
          return
        }
        onPress()
      }}
    >
      <span className="vk-key__label">{label}</span>
      {canHold && holdHint ? (
        <span className="vk-key__hold-hint" aria-hidden="true">
          {holdHint}
        </span>
      ) : null}
    </button>
  )
}

export function VirtualKeyboard({
  open,
  mode,
  onInput,
  onBackspace,
  onClose,
}: VirtualKeyboardProps) {
  const [shift, setShift] = useState<ShiftState>('off')
  const [layer, setLayer] = useState<TextLayer>('letters')
  const [mounted, setMounted] = useState(false)
  const [accentPopup, setAccentPopup] = useState<AccentPopup | null>(null)
  const keyboardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) {
      setShift('off')
      setLayer('letters')
      setAccentPopup(null)
    }
  }, [open])

  useEffect(() => {
    setShift('off')
    setLayer('letters')
    setAccentPopup(null)
  }, [mode])

  useEffect(() => {
    if (!accentPopup) return

    function handlePointerDown(event: globalThis.PointerEvent) {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('.vk-accent-popup') || target.closest('.vk-key--holdable')) {
        return
      }
      setAccentPopup(null)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [accentPopup])

  function applyCase(char: string) {
    if (shift === 'off') return char
    return char.toUpperCase()
  }

  function handleChar(char: string) {
    onInput(applyCase(char))
    if (shift === 'once') setShift('off')
  }

  function handleAccentLayerChar(char: string) {
    handleChar(char)
    setLayer('letters')
    setAccentPopup(null)
  }

  function toggleShift() {
    setAccentPopup(null)
    setShift((current) => {
      if (current === 'off') return 'once'
      if (current === 'once') return 'caps'
      return 'off'
    })
  }

  function openAccentPopup(base: string, options: string[], rect: DOMRect) {
    const keyboardRect = keyboardRef.current?.getBoundingClientRect()
    if (!keyboardRect) {
      setAccentPopup({
        base,
        options,
        left: rect.left,
        bottom: window.innerHeight - rect.top + 8,
      })
      return
    }

    const popupWidth = Math.min(
      keyboardRect.width - 16,
      options.length * 56 + (options.length - 1) * 8 + 16,
    )
    const idealLeft =
      rect.left - keyboardRect.left + rect.width / 2 - popupWidth / 2
    const left = Math.min(
      Math.max(8, idealLeft),
      keyboardRect.width - popupWidth - 8,
    )
    const bottom = keyboardRect.bottom - rect.top + 8

    setAccentPopup({ base, options, left, bottom })
  }

  function chooseAccent(char: string) {
    handleChar(char)
    setAccentPopup(null)
  }

  function renderLetterRows() {
    return LETTER_ROWS.map((row, rowIndex) => (
      <div key={`letters-${rowIndex}`} className="vk-row">
        {rowIndex === 2 ? (
          <KeyButton
            label={shift === 'caps' ? '⇪' : '⇧'}
            ariaLabel={
              shift === 'caps'
                ? 'Caps Lock ativado'
                : shift === 'once'
                  ? 'Shift ativado'
                  : 'Shift'
            }
            className="vk-key--action"
            active={shift !== 'off'}
            onPress={toggleShift}
          />
        ) : null}
        {row.map((char) => {
          const variants = ACCENT_VARIANTS[char]
          return (
            <KeyButton
              key={char}
              label={applyCase(char)}
              longPressOptions={variants}
              holdHint={variants ? applyCase(variants[0]) : undefined}
              onPress={() => {
                setAccentPopup(null)
                handleChar(char)
              }}
              onLongPress={
                variants
                  ? (options, rect) => openAccentPopup(char, options, rect)
                  : undefined
              }
            />
          )
        })}
        {rowIndex === 2 ? (
          <KeyButton
            label="⌫"
            ariaLabel="Apagar"
            className="vk-key--action"
            onPress={() => {
              setAccentPopup(null)
              onBackspace()
            }}
          />
        ) : null}
      </div>
    ))
  }

  function renderAccentRows() {
    return ACCENT_ROWS.map((row, rowIndex) => (
      <div key={`accents-${rowIndex}`} className="vk-row">
        {row.map((char) => (
          <KeyButton
            key={char}
            label={applyCase(char)}
            onPress={() => handleAccentLayerChar(char)}
          />
        ))}
      </div>
    ))
  }

  function renderSymbolRows() {
    return SYMBOL_ROWS.map((row, rowIndex) => (
      <div key={`symbols-${rowIndex}`} className="vk-row">
        {row.map((char) => (
          <KeyButton
            key={char}
            label={char}
            onPress={() => {
              setAccentPopup(null)
              onInput(char)
            }}
          />
        ))}
        {rowIndex === 2 ? (
          <KeyButton
            label="⌫"
            ariaLabel="Apagar"
            className="vk-key--action"
            onPress={() => {
              setAccentPopup(null)
              onBackspace()
            }}
          />
        ) : null}
      </div>
    ))
  }

  function renderNumeric() {
    return (
      <div className="vk-numeric">
        {NUMERIC_ROWS.map((row, rowIndex) => (
          <div key={`num-${rowIndex}`} className="vk-row vk-row--numeric">
            {row.map((digit) => (
              <KeyButton
                key={digit}
                label={digit}
                className="vk-key--numeric"
                onPress={() => onInput(digit)}
              />
            ))}
            {rowIndex === 3 ? (
              <KeyButton
                label="⌫"
                ariaLabel="Apagar"
                className="vk-key--action vk-key--numeric"
                onPress={onBackspace}
              />
            ) : null}
          </div>
        ))}
        <div className="vk-row vk-row--bottom">
          <KeyButton
            label="OK"
            ariaLabel="Fechar teclado"
            className="vk-key--done"
            wide
            onPress={onClose}
          />
        </div>
      </div>
    )
  }

  if (!mounted) return null

  let body: ReactNode
  if (mode === 'numeric') {
    body = renderNumeric()
  } else {
    body = (
      <>
        {layer === 'letters'
          ? renderLetterRows()
          : layer === 'accents'
            ? renderAccentRows()
            : renderSymbolRows()}

        <div className="vk-row vk-row--bottom">
          <KeyButton
            label={layer === 'symbols' ? 'ABC' : '123'}
            ariaLabel={layer === 'symbols' ? 'Letras' : 'Números e símbolos'}
            className="vk-key--action"
            onPress={() => {
              setAccentPopup(null)
              setLayer((current) =>
                current === 'symbols' ? 'letters' : 'symbols',
              )
            }}
          />
          <KeyButton
            label="áÀ"
            ariaLabel="Acentos"
            className="vk-key--action"
            active={layer === 'accents'}
            onPress={() => {
              setAccentPopup(null)
              setLayer((current) =>
                current === 'accents' ? 'letters' : 'accents',
              )
            }}
          />
          <KeyButton
            label="espaço"
            ariaLabel="Espaço"
            className="vk-key--space"
            wide
            onPress={() => {
              setAccentPopup(null)
              onInput(' ')
            }}
          />
          {layer !== 'letters' ? (
            <KeyButton
              label="⌫"
              ariaLabel="Apagar"
              className="vk-key--action"
              onPress={() => {
                setAccentPopup(null)
                onBackspace()
              }}
            />
          ) : null}
          <KeyButton
            label="OK"
            ariaLabel="Fechar teclado"
            className="vk-key--done"
            onPress={() => {
              setAccentPopup(null)
              onClose()
            }}
          />
        </div>
      </>
    )
  }

  return createPortal(
    <div
      ref={keyboardRef}
      className={
        open ? 'virtual-keyboard virtual-keyboard--open' : 'virtual-keyboard'
      }
      role="group"
      aria-label="Teclado virtual"
      aria-hidden={!open}
    >
      {accentPopup ? (
        <div
          className="vk-accent-popup"
          style={{ left: accentPopup.left, bottom: accentPopup.bottom }}
          role="listbox"
          aria-label={`Acentos para ${accentPopup.base}`}
        >
          {accentPopup.options.map((option) => (
            <button
              key={option}
              type="button"
              className="vk-key vk-key--accent"
              aria-label={applyCase(option)}
              onPointerDown={preventFocusSteal}
              onClick={(event) => {
                event.preventDefault()
                chooseAccent(option)
              }}
            >
              {applyCase(option)}
            </button>
          ))}
        </div>
      ) : null}
      {body}
    </div>,
    document.body,
  )
}
