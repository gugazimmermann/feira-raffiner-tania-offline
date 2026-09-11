export function LogoPair() {
  return (
    <div className="logo-pair" aria-label="Feira - Raffiner x Tânia Veiga">
      <div className="logo-pair__slot">
        <img
          className="logo-pair__logo logo-pair__logo--raffiner"
          src="/raffiner2.png"
          alt="Raffiner"
        />
      </div>
      <span className="logo-pair__divider" aria-hidden="true" />
      <div className="logo-pair__slot">
        <img
          className="logo-pair__logo logo-pair__logo--tania"
          src="/tania_veiga.png"
          alt="Tânia Veiga"
        />
      </div>
    </div>
  )
}
