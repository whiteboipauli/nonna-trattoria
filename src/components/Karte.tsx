import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import Weinkarte from './Weinkarte'
import { kategorien, tagesmenue, type Kategorie } from '../data/karte'

// La Carta: ruhig und minimal. Immer zwei Seiten nebeneinander. Oben der Name der Kategorie in Pinselschrift
// mit einem kleinen Satz darunter, dann nur die Gerichte: Name, darunter was drin ist, rechts der Preis.
// Jede Seite kann eine kleine Zeichnung im Hintergrund tragen (Feld `zeichnung` in data/karte.ts).
const doppelseiten: Kategorie[][] = []
for (let i = 0; i < kategorien.length; i += 2) {
  doppelseiten.push(kategorien.slice(i, i + 2))
}

export default function Karte() {
  const reduziert = useReducedMotion()
  const [weinOffen, setWeinOffen] = useState(false)
  const einblenden = {
    initial: reduziert ? false : { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.1 },
    transition: { duration: 0.7, ease: [0.23, 1, 0.32, 1] as const },
  }

  return (
    <section id="carta" data-kopf="dunkel" className="karte" aria-labelledby="karte-titel">
      <div className="karte-rahmen">
        <header className="karte-kopf">
          <h2 className="karte-titel" id="karte-titel">
            La Carta
          </h2>
          <p className="karte-satz">Klein gehalten, jeden Tag frisch gemacht.</p>
        </header>

        <motion.aside className="tagesmenue" aria-labelledby="tm-titel" {...einblenden}>
          <h3 className="seite-titel" id="tm-titel">
            {tagesmenue.titel}
          </h3>
          <p className="seite-satz">{tagesmenue.hinweis}</p>
          <ol className="tm-liste">
            {tagesmenue.gaenge.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ol>
          <p className="tm-preis">{tagesmenue.preis}</p>
        </motion.aside>

        {doppelseiten.map((paar) => (
          <motion.div className="doppelseite" key={paar[0].id} {...einblenden}>
            {paar.map((k) => (
              <section className="seite" key={k.id} aria-labelledby={`s-${k.id}`}>
                {k.zeichnung && (
                  <img
                    className="seite-zeichnung"
                    src={k.zeichnung}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <div className="seite-inhalt">
                  <h3 className="seite-titel" id={`s-${k.id}`}>
                    {k.name}
                  </h3>
                  <p className="seite-satz">{k.hinweis}</p>
                  <ul className="karte-gerichte">
                    {k.gerichte.map((g) => (
                      <li key={g.name} className="gericht">
                        <p className="gericht-name">{g.name}</p>
                        <p className="gericht-text">{g.text}</p>
                        <p className="gericht-preis">{g.preis}</p>
                        {g.eigen && (
                          <Link to="/bestellen" className="gericht-link">
                            Beim Bestellen zusammenstellen →
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                  {k.fuss && <p className="seite-fuss">{k.fuss}</p>}
                  {k.id === 'vino' && (
                    <p className="seite-aktion">
                      <button type="button" className="knopf" onClick={() => setWeinOffen(true)} aria-haspopup="dialog">
                        Weinkarte ansehen
                      </button>
                    </p>
                  )}
                </div>
              </section>
            ))}
          </motion.div>
        ))}

        <p className="karte-fuss">Alle Preise in Euro, inklusive Steuern. Zu Allergenen beraten wir dich gern.</p>
      </div>
      {weinOffen && <Weinkarte onClose={() => setWeinOffen(false)} />}
    </section>
  )
}
