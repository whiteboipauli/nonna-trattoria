import { useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import SeitenKopf from '../components/SeitenKopf'
import { feldFehler, gleicherTag, hhmm, istRuhetag, nummer, speichern, tagLang, type Feld } from '../lib/demo'
import { pfad } from '../lib/pfad'

export type ReservierungsDaten = {
  nummer: string
  name: string
  datum: string
  uhrzeit: string
  personen: number
}

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
const KOPF = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const ZEITEN = Array.from({ length: 20 }, (_, i) => 12 * 60 + i * 30) // 12:00 bis 21:30
const feldNamen: Feld[] = ['name', 'telefon', 'email']

const tagStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const tagPlus = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

// Feste Regel statt Zufall: dasselbe Datum ist immer gleich ausgebucht. Freitag und Samstag sind voller.
function ausgebucht(d: Date, minuten: number): boolean {
  const wt = d.getDay()
  const h = Math.imul(d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate(), 2654435761) ^ Math.imul(minuten / 30 + 7, 40503)
  const zahl = Math.abs(Math.imul(h ^ (h >>> 15), 2246822519)) % 100
  const grenze = wt === 5 || wt === 6 ? 38 : 18
  return zahl < grenze
}

function Kalender({ gewaehlt, onWahl, heute }: { gewaehlt: Date | null; onWahl: (d: Date) => void; heute: Date }) {
  const [ansicht, setAnsicht] = useState({ j: heute.getFullYear(), m: heute.getMonth() })
  const [fokus, setFokus] = useState<Date>(gewaehlt ?? heute)
  const raster = useRef<HTMLDivElement>(null)
  const erster = new Date(ansicht.j, ansicht.m, 1)
  const letzteAnsicht = new Date(heute.getFullYear(), heute.getMonth() + 3, 1)
  const maxTag = new Date(letzteAnsicht.getFullYear(), letzteAnsicht.getMonth() + 1, 0)
  const imAnfang = ansicht.j === heute.getFullYear() && ansicht.m === heute.getMonth()
  const imEnde = ansicht.j === letzteAnsicht.getFullYear() && ansicht.m === letzteAnsicht.getMonth()
  const vorlauf = (erster.getDay() + 6) % 7
  const tage = new Date(ansicht.j, ansicht.m + 1, 0).getDate()

  const springe = (m: number) => {
    const d = new Date(ansicht.j, ansicht.m + m, 1)
    setAnsicht({ j: d.getFullYear(), m: d.getMonth() })
  }

  const taste = (e: KeyboardEvent) => {
    const schritt: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    let ziel: Date | null = null
    if (e.key in schritt) ziel = tagPlus(fokus, schritt[e.key])
    else if (e.key === 'PageDown') ziel = new Date(fokus.getFullYear(), fokus.getMonth() + 1, fokus.getDate())
    else if (e.key === 'PageUp') ziel = new Date(fokus.getFullYear(), fokus.getMonth() - 1, fokus.getDate())
    if (!ziel) return
    e.preventDefault()
    if (ziel < heute) ziel = heute
    if (ziel > maxTag) ziel = maxTag
    setFokus(ziel)
    setAnsicht({ j: ziel.getFullYear(), m: ziel.getMonth() })
    requestAnimationFrame(() => raster.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus())
  }

  return (
    <div className="kal">
      <div className="kal-kopf">
        <button type="button" className="rund-klein" onClick={() => springe(-1)} disabled={imAnfang} aria-label="Vorheriger Monat">
          ←
        </button>
        <p className="kal-monat" aria-live="polite">
          {MONATE[ansicht.m]} {ansicht.j}
        </p>
        <button type="button" className="rund-klein" onClick={() => springe(1)} disabled={imEnde} aria-label="Nächster Monat">
          →
        </button>
      </div>
      <div className="kal-raster" role="grid" aria-label={`${MONATE[ansicht.m]} ${ansicht.j}`} ref={raster} onKeyDown={taste}>
        {KOPF.map((k) => (
          <span key={k} className="kal-wochentag" role="columnheader">
            {k}
          </span>
        ))}
        {Array.from({ length: vorlauf }, (_, i) => (
          <span key={`l${i}`} role="presentation" />
        ))}
        {Array.from({ length: tage }, (_, i) => {
          const d = new Date(ansicht.j, ansicht.m, i + 1)
          const ruhetag = istRuhetag(d)
          const vorbei = d < heute || d > maxTag
          const aus = ruhetag || vorbei
          const gewahlt = gewaehlt !== null && gleicherTag(d, gewaehlt)
          const hatFokus = gleicherTag(d, fokus)
          return (
            <button
              key={i}
              type="button"
              role="gridcell"
              className="kal-tag"
              data-gewaehlt={gewahlt || undefined}
              aria-disabled={aus || undefined}
              aria-selected={gewahlt}
              aria-label={`${tagLang(d)}${ruhetag ? ', Montag Ruhetag' : ''}`}
              title={ruhetag && !vorbei ? 'Montag Ruhetag' : undefined}
              tabIndex={hatFokus ? 0 : -1}
              onClick={() => {
                setFokus(d)
                if (!aus) onWahl(d)
              }}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
      <p className="kal-hinweis">Montag Ruhetag</p>
    </div>
  )
}

export default function Reservierung() {
  const navigate = useNavigate()
  const heute = useMemo(() => tagStart(new Date()), [])
  const [datum, setDatum] = useState<Date | null>(null)
  const [zeit, setZeit] = useState<number | null>(null)
  const [personen, setPersonen] = useState(2)
  const [werte, setWerte] = useState({ name: '', telefon: '', email: '', wuensche: '' })
  const [angefasst, setAngefasst] = useState<Partial<Record<Feld, boolean>>>({})
  const [versucht, setVersucht] = useState(false)

  const jetzt = new Date()
  const minJetzt = jetzt.getHours() * 60 + jetzt.getMinutes()
  const vergangen = (m: number) => datum !== null && gleicherTag(datum, heute) && m <= minJetzt
  const zuGross = personen > 8
  const bereit = datum !== null && zeit !== null && !zuGross

  const waehleDatum = (d: Date) => {
    setDatum(d)
    if (zeit !== null && (ausgebucht(d, zeit) || (gleicherTag(d, heute) && zeit <= minJetzt))) setZeit(null)
  }

  const feldFehlerAnzeige = (f: Feld) => (angefasst[f] || versucht ? feldFehler(f, werte[f]) : '')

  const absenden = (e: FormEvent) => {
    e.preventDefault()
    setVersucht(true)
    const erstes = feldNamen.find((f) => feldFehler(f, werte[f]))
    if (!bereit) return
    if (erstes) {
      document.getElementById(`r-${erstes}`)?.focus()
      return
    }
    const r: ReservierungsDaten = {
      nummer: nummer('R'),
      name: werte.name.trim(),
      datum: tagLang(datum),
      uhrzeit: `${hhmm(zeit)} Uhr`,
      personen,
    }
    speichern('nonna-reservierung', r)
    navigate('/reservieren/danke', { state: r })
  }

  const feld = (f: Feld, label: string, art: string, auto: string) => {
    const msg = feldFehlerAnzeige(f)
    return (
      <div className="feld">
        <label htmlFor={`r-${f}`}>{label}</label>
        <input
          id={`r-${f}`}
          className="feld-eingabe"
          type={art}
          autoComplete={auto}
          value={werte[f]}
          onChange={(e) => setWerte({ ...werte, [f]: e.target.value })}
          onBlur={() => setAngefasst({ ...angefasst, [f]: true })}
          aria-invalid={msg ? true : undefined}
          aria-describedby={msg ? `r-${f}-fehler` : undefined}
          required
        />
        {msg && (
          <p className="feld-fehler" id={`r-${f}-fehler`}>
            {msg}
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      <SeitenKopf
        titel="Reservieren"
        foto={pfad('/foto/reservieren.jpg')}
        alt="Eine Familie über drei Generationen stößt lachend mit Gläsern an, vor ihr ein Tisch voller Pizza und Pasta"
        fokus="60% 50%"
        seite="links"
      />
      <section data-kopf="dunkel" className="best">
        <form className="best-rahmen res" onSubmit={absenden} noValidate>
          <div className="res-schritte">
            <section className="res-schritt" aria-labelledby="r1">
              <p className="res-nr" aria-hidden="true">1</p>
              <h2 className="res-titel" id="r1">Datum</h2>
              <Kalender gewaehlt={datum} onWahl={waehleDatum} heute={heute} />
            </section>

            <section className="res-schritt" aria-labelledby="r2">
              <p className="res-nr" aria-hidden="true">2</p>
              <h2 className="res-titel" id="r2">Uhrzeit</h2>
              {datum === null && <p className="res-text">Wähle zuerst ein Datum.</p>}
              <div className="chips" role="group" aria-labelledby="r2">
                {ZEITEN.map((m) => {
                  const aus = datum !== null && ausgebucht(datum, m)
                  const weg = vergangen(m)
                  return (
                    <button
                      key={m}
                      type="button"
                      className="chip"
                      data-gewaehlt={zeit === m || undefined}
                      data-aus={aus || undefined}
                      disabled={datum === null || aus || weg}
                      aria-pressed={zeit === m}
                      aria-label={`${hhmm(m)} Uhr${aus ? ', ausgebucht' : ''}`}
                      onClick={() => setZeit(m)}
                    >
                      {hhmm(m)}
                    </button>
                  )
                })}
              </div>
              {datum !== null && <p className="kal-hinweis">Durchgestrichene Zeiten sind ausgebucht.</p>}
            </section>

            <section className="res-schritt" aria-labelledby="r3">
              <p className="res-nr" aria-hidden="true">3</p>
              <h2 className="res-titel" id="r3">Personenzahl</h2>
              <div className="zaehler">
                <button type="button" className="rund" onClick={() => setPersonen(Math.max(1, personen - 1))} disabled={personen <= 1} aria-label="Eine Person weniger">
                  −
                </button>
                <p className="zaehler-wert" aria-live="polite">
                  {personen > 8 ? '9 oder mehr Personen' : `${personen} ${personen === 1 ? 'Person' : 'Personen'}`}
                </p>
                <button type="button" className="rund" onClick={() => setPersonen(Math.min(9, personen + 1))} disabled={personen >= 9} aria-label="Eine Person mehr">
                  +
                </button>
              </div>
              {zuGross && <p className="res-text">Für größere Gruppen ruf uns bitte an: 0211 123456 (fiktiv).</p>}
            </section>

            <section className="res-schritt" aria-labelledby="r4">
              <p className="res-nr" aria-hidden="true">4</p>
              <h2 className="res-titel" id="r4">Deine Daten</h2>
              {feld('name', 'Name', 'text', 'name')}
              {feld('telefon', 'Telefon', 'tel', 'tel')}
              {feld('email', 'E-Mail', 'email', 'email')}
              <div className="feld">
                <label htmlFor="r-wuensche">Wünsche (optional)</label>
                <textarea
                  id="r-wuensche"
                  className="feld-eingabe"
                  rows={3}
                  placeholder="z. B. Kinderstuhl, Allergien, Anlass"
                  value={werte.wuensche}
                  onChange={(e) => setWerte({ ...werte, wuensche: e.target.value })}
                />
              </div>
            </section>
          </div>

          <aside className="wk wk--seite tisch" aria-labelledby="tisch-titel">
            <h2 className="wk-titel" id="tisch-titel">Dein Tisch</h2>
            <dl className="tisch-liste">
              <div><dt>Datum</dt><dd>{datum ? tagLang(datum) : '–'}</dd></div>
              <div><dt>Uhrzeit</dt><dd>{zeit !== null ? `${hhmm(zeit)} Uhr` : '–'}</dd></div>
              <div><dt>Personen</dt><dd>{zuGross ? 'ab 9, bitte anrufen' : personen}</dd></div>
            </dl>
            <button type="submit" className="knopf" disabled={!bereit}>
              Tisch reservieren
            </button>
            {versucht && !bereit && <p className="feld-fehler">Bitte wähle Datum, Uhrzeit und Personenzahl.</p>}
            <p className="wk-hinweis">Demo: es wird nichts reserviert.</p>
          </aside>
        </form>

        <div className="res-info">
          <section>
            <h2 className="res-info-titel">Öffnungszeiten</h2>
            <p>Dienstag bis Sonntag, 12 bis 23 Uhr<br />Montag Ruhetag</p>
          </section>
          <section>
            <h2 className="res-info-titel">Adresse</h2>
            <p>Musterstraße 12 (fiktiv)<br />40213 Düsseldorf</p>
          </section>
          <section>
            <h2 className="res-info-titel">Kontakt</h2>
            <p>Telefon 0211 123456 (fiktiv)<br />hallo@trattoria-nonna.example</p>
          </section>
        </div>
      </section>
    </>
  )
}
