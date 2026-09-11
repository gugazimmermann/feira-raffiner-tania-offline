const CODES = [
  {
    label: 'Raffiner',
    src: '/qr-raffiner.svg',
  },
  {
    label: 'Tânia Veiga',
    src: '/qr-tania.svg',
  },
] as const

export function QrLinks() {
  return (
    <aside className="qr-links" aria-label="QR Codes das marcas">
      {CODES.map((code) => (
        <div key={code.label} className="qr-links__item">
          <img
            className="qr-links__image"
            src={code.src}
            alt={`QR Code ${code.label}`}
            width={100}
            height={100}
          />
          <span className="qr-links__label">{code.label}</span>
        </div>
      ))}
    </aside>
  )
}
