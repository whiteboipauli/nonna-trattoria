import { motion, useReducedMotion } from 'motion/react'
import { weingruppen, type Weingruppe } from '../data/weine'
import { useDialog } from './useDialog'
import { pfad } from '../lib/pfad'

const spalten: Weingruppe[][] = [weingruppen.slice(0, 2), weingruppen.slice(2)]
const preis = (n?: number) => (n === undefined ? '–' : String(n))

// Vollbild-Blatt mit der Weinkarte. Nur zum Ansehen.
export default function Weinkarte({ onClose }: { onClose: () => void }) {
  const reduziert = useReducedMotion()
  const ref = useDialog(true, onClose)

  return (
    <motion.div
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wein-titel"
      className="weinkarte"
      initial={reduziert ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <button type="button" className="schliessen" onClick={onClose} aria-label="Weinkarte schließen">
        ×
      </button>
      <div className="weinkarte-rahmen">
        <header className="karte-kopf">
          <h2 className="karte-titel" id="wein-titel">
            Weinkarte
          </h2>
          <p className="karte-satz">Eine kleine Auswahl für den Abend. Mehr bringt dir unser Service an den Tisch.</p>
        </header>
        <div className="wein-spalten">
          {spalten.map((spalte, i) => (
            <div className="wein-spalte" key={i}>
              {spalte.map((g) => (
                <section key={g.id} className="wein-gruppe" aria-labelledby={`w-${g.id}`}>
                  <h3 className="wein-gruppenname" id={`w-${g.id}`}>
                    {g.name}
                  </h3>
                  <p className="wein-hinweis">{g.hinweis}</p>
                  <div className="wein-spaltenkoepfe" aria-hidden="true">
                    <span>Glas</span>
                    <span>Flasche</span>
                  </div>
                  <ul className="wein-liste">
                    {g.weine.map((w) => (
                      <li key={w.name} className="wein">
                        <p className="gericht-name">{w.name}</p>
                        <p className="gericht-text">
                          {w.herkunft} · {w.rebsorte} · {w.jahrgang}
                        </p>
                        <p className="wein-preis" aria-label={w.glas === undefined ? 'Glas: nicht im Glas' : `Glas: ${w.glas} Euro`}>
                          {preis(w.glas)}
                        </p>
                        <p className="wein-preis" aria-label={w.flasche === undefined ? 'Flasche: nicht als Flasche' : `Flasche: ${w.flasche} Euro`}>
                          {preis(w.flasche)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ))}
        </div>
      </div>
      <img className="seite-zeichnung weinkarte-zeichnung" src={pfad('/karte/vino.webp')} alt="" aria-hidden="true" />
    </motion.div>
  )
}
