import { Link, useLocation } from 'react-router-dom'
import SeitenKopf from '../components/SeitenKopf'
import { lesen } from '../lib/demo'
import type { ReservierungsDaten } from './Reservierung'
import { pfad } from '../lib/pfad'

export default function ReservierungDanke() {
  const { state } = useLocation()
  const r = (state as ReservierungsDaten | null) ?? lesen<ReservierungsDaten>('nonna-reservierung')

  return (
    <>
      <SeitenKopf
        titel="Danke für deine Reservierung"
        foto={pfad('/foto/strasse-trattoria.jpg')}
        alt="Tische mit rot-weiß karierten Tischdecken in einer italienischen Gasse am Abend"
        fokus="50% 60%"
        hoehe="klein"
      />
      <section data-kopf="dunkel" className="best">
        <div className="best-rahmen best-rahmen--schmal">
          {r ? (
            <div className="danke">
              <p className="danke-nummer">{r.nummer}</p>
              <dl className="tisch-liste">
                <div><dt>Name</dt><dd>{r.name}</dd></div>
                <div><dt>Datum</dt><dd>{r.datum}</dd></div>
                <div><dt>Uhrzeit</dt><dd>{r.uhrzeit}</dd></div>
                <div><dt>Personen</dt><dd>{r.personen}</dd></div>
              </dl>
              <p className="danke-gruss">Wir freuen uns auf dich. Nonna deckt schon den Tisch.</p>
              <p className="wk-hinweis">Demo: es wurde nichts reserviert.</p>
              <p className="pop-aktion">
                <Link to="/" className="knopf">
                  Zur Startseite
                </Link>
              </p>
            </div>
          ) : (
            <div className="hinweis-seite">
              <h2 className="seite-titel">Hier gibt es gerade nichts zu sehen</h2>
              <p className="seite-satz">Zu dieser Seite gehört noch keine Reservierung.</p>
              <p className="pop-aktion">
                <Link to="/reservieren" className="knopf">
                  Tisch reservieren
                </Link>
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
