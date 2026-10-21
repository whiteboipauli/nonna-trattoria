import { Link, useLocation } from 'react-router-dom'
import SeitenKopf from '../components/SeitenKopf'
import { eur } from '../store/warenkorb'
import { lesen } from '../lib/demo'
import type { BestellDaten } from './Kasse'
import { pfad } from '../lib/pfad'

export default function BestellungDanke() {
  const { state } = useLocation()
  const b = (state as BestellDaten | null) ?? lesen<BestellDaten>('nonna-bestellung')

  return (
    <>
      <SeitenKopf
        titel="Danke für deine Bestellung"
        foto={pfad('/foto/tisch-gemeinsam.jpg')}
        alt="Gedeckter Tisch mit mehreren Gerichten zum Teilen"
        hoehe="klein"
      />
      <section data-kopf="dunkel" className="best">
        <div className="best-rahmen best-rahmen--schmal">
          {b ? (
            <div className="danke">
              <p className="danke-nummer">{b.nummer}</p>
              <p className="seite-satz">Abholung: {b.abholzeit}</p>
              <ul className="wk-liste danke-liste">
                {b.positionen.map((p, i) => (
                  <li key={`${p.name}-${i}`} className="wk-position wk-position--kasse">
                    <p className="wk-name">
                      {p.menge} × {p.name}
                      {p.zusatz && <span className="wk-zusatz">{p.zusatz}</span>}
                    </p>
                    <p className="wk-preis">{eur(p.preis * p.menge)}</p>
                  </li>
                ))}
              </ul>
              <p className="wk-summe">
                <span>Summe</span>
                <span>{eur(b.summe)}</span>
              </p>
              <p className="danke-gruss">
                Danke, {b.name}! Wir backen und kochen jetzt für dich. Bis gleich!
              </p>
              <p className="wk-hinweis">Demo: es wurde nichts bestellt und nichts bezahlt.</p>
              <p className="pop-aktion">
                <Link to="/" className="knopf">
                  Zur Startseite
                </Link>
              </p>
            </div>
          ) : (
            <div className="hinweis-seite">
              <h2 className="seite-titel">Hier gibt es gerade nichts zu sehen</h2>
              <p className="seite-satz">Zu dieser Seite gehört noch keine Bestellung.</p>
              <p className="pop-aktion">
                <Link to="/bestellen" className="knopf">
                  Zur Karte
                </Link>
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
