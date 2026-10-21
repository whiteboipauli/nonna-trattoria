import { useEffect, useRef, useState } from 'react'
import { kategorien, tagesmenue } from '../data/karte'
import { gerichtId, preisZahl, useWarenkorb } from '../store/warenkorb'
import SeitenKopf from '../components/SeitenKopf'
import WarenkorbInhalt, { warenkorbZeile } from '../components/WarenkorbInhalt'
import { useDialog } from '../components/useDialog'
import PizzaKonfigurator from '../components/PizzaKonfigurator'
import { pfad } from '../lib/pfad'

const TM_ID = 'tagesmenue:Heute bei Nonna'

// Runder, dünner Knopf: + legt eine Portion hinein, kurz ein Häkchen, danach die Menge.
function PlusKnopf({ id, name, preis }: { id: string; name: string; preis: number }) {
  const hinzufuegen = useWarenkorb((z) => z.hinzufuegen)
  const menge = useWarenkorb((z) => z.positionen.find((p) => p.id === id)?.menge ?? 0)
  const [haken, setHaken] = useState(false)
  const timer = useRef<number>(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const klick = () => {
    hinzufuegen({ id, name, preis })
    setHaken(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setHaken(false), 1100)
  }
  return (
    <button type="button" className="rund" onClick={klick} aria-label={`${name} in den Warenkorb legen`}>
      {haken ? '✓' : menge > 0 ? menge : '+'}
    </button>
  )
}

export default function Bestellung() {
  const positionen = useWarenkorb((z) => z.positionen)
  const [pizzaOffen, setPizzaOffen] = useState(false)
  const [blattOffen, setBlattOffen] = useState(false)
  const blattRef = useDialog(blattOffen, () => setBlattOffen(false))

  return (
    <>
      <SeitenKopf
        titel="Bestellen"
        foto={pfad('/foto/bestellen.jpg')}
        alt="Margherita mit gebräuntem Blasenrand und Basilikum auf einem Holzschieber, hinter ihr der blau gekachelte Pizzaofen, Dampf steigt auf"
        fokus="40% 50%"
        seite="rechts"
      />

      <section data-kopf="dunkel" className="best">
        <div className="best-rahmen">
          <div className="best-karte">
            <section className="best-abschnitt" aria-labelledby="b-tm">
              <h2 className="seite-titel" id="b-tm">
                {tagesmenue.titel}
              </h2>
              <p className="seite-satz">{tagesmenue.hinweis}</p>
              <ul className="karte-gerichte">
                <li className="gericht gericht--bestellen">
                  <p className="gericht-name">Tagesmenü in drei Gängen</p>
                  <p className="gericht-text">{tagesmenue.gaenge.join(' · ')}</p>
                  <p className="gericht-preis">{tagesmenue.preis}</p>
                  <PlusKnopf id={TM_ID} name="Tagesmenü" preis={Number(tagesmenue.preis)} />
                </li>
              </ul>
            </section>

            {kategorien.map((k) => (
              <section className="best-abschnitt" key={k.id} aria-labelledby={`b-${k.id}`}>
                <h2 className="seite-titel" id={`b-${k.id}`}>
                  {k.name}
                </h2>
                <p className="seite-satz">{k.hinweis}</p>
                <ul className="karte-gerichte">
                  {k.gerichte.map((g) => {
                    const preis = preisZahl(g.preis)
                    return (
                      <li key={g.name} className="gericht gericht--bestellen">
                        <p className="gericht-name">{g.name}</p>
                        <p className="gericht-text">{g.text}</p>
                        <p className="gericht-preis">{g.preis}</p>
                        {g.eigen || preis === null ? (
                          <button type="button" className="knopf knopf--klein" onClick={() => setPizzaOffen(true)}>
                            Zusammenstellen
                          </button>
                        ) : (
                          <PlusKnopf id={gerichtId(k.id, g.name)} name={g.name} preis={preis} />
                        )}
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
            <p className="karte-fuss">Alle Preise in Euro, inklusive Steuern. Es gibt nur Abholung, keine Lieferung.</p>
          </div>

          <aside className="wk wk--seite" aria-labelledby="wk-titel">
            <WarenkorbInhalt titelId="wk-titel" />
          </aside>
        </div>
      </section>

      <button
        type="button"
        className="wk-streifen"
        onClick={() => setBlattOffen(true)}
        aria-label="Warenkorb öffnen"
        aria-haspopup="dialog"
      >
        {positionen.length === 0 ? 'Warenkorb · leer' : warenkorbZeile(positionen)}
      </button>

      {blattOffen && (
        <div className="overlay overlay--unten" onClick={() => setBlattOffen(false)}>
          <div
            ref={blattRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wk-titel-blatt"
            className="blatt wk"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="schliessen" onClick={() => setBlattOffen(false)} aria-label="Warenkorb schließen">
              ×
            </button>
            <WarenkorbInhalt titelId="wk-titel-blatt" beiKasse={() => setBlattOffen(false)} />
          </div>
        </div>
      )}

      {pizzaOffen && <PizzaKonfigurator onClose={() => setPizzaOffen(false)} />}
    </>
  )
}
