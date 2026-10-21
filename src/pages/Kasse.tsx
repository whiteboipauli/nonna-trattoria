import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SeitenKopf from '../components/SeitenKopf'
import { eur, summe, useWarenkorb } from '../store/warenkorb'
import { feldFehler, hhmm, istRuhetag, nummer, speichern, tagLang, type Feld } from '../lib/demo'
import { pfad } from '../lib/pfad'

export type BestellDaten = {
  nummer: string
  name: string
  abholzeit: string
  positionen: { name: string; menge: number; preis: number; zusatz?: string }[]
  summe: number
}

type Option = { wert: string; label: string }

// Abholzeiten: heute, solange noch Zeit ist; sonst der nächste Öffnungstag (Montag ist Ruhetag).
function abholOptionen(jetzt: Date): Option[] {
  const min = jetzt.getHours() * 60 + jetzt.getMinutes()
  const fenster = (ab: number) => {
    const o: Option[] = []
    for (let m = 12 * 60; m <= 22 * 60 + 30; m += 15) if (m >= ab) o.push({ wert: hhmm(m), label: `${hhmm(m)} Uhr` })
    return o
  }
  if (!istRuhetag(jetzt)) {
    const heute = fenster(min + 20)
    if (heute.length) {
      const offen = min >= 12 * 60
      return [...(offen ? [{ wert: 'asap', label: 'So schnell wie möglich (ca. 30 Minuten)' }] : []), ...heute]
    }
  }
  const tag = new Date(jetzt)
  do tag.setDate(tag.getDate() + 1)
  while (istRuhetag(tag))
  const datum = tagLang(tag)
  return fenster(0).map((o) => ({ wert: `${datum}, ${o.wert}`, label: `${datum}, ${o.label}` }))
}

const feldNamen = ['name', 'telefon', 'email'] as const

const fehler = feldFehler

export default function Kasse() {
  const positionen = useWarenkorb((z) => z.positionen)
  const leeren = useWarenkorb((z) => z.leeren)
  const navigate = useNavigate()
  const optionen = useMemo(() => abholOptionen(new Date()), [])
  const [werte, setWerte] = useState({ name: '', telefon: '', email: '', anmerkung: '' })
  const [zeit, setZeit] = useState(optionen[0].wert)
  const [angefasst, setAngefasst] = useState<Partial<Record<Feld, boolean>>>({})

  const fehlerFuer = (f: Feld) => (angefasst[f] ? fehler(f, werte[f]) : '')
  const setze = (k: keyof typeof werte) => (e: { target: { value: string } }) => setWerte({ ...werte, [k]: e.target.value })
  const verlassen = (f: Feld) => () => setAngefasst({ ...angefasst, [f]: true })

  const absenden = (e: FormEvent) => {
    e.preventDefault()
    if (feldNamen.some((f) => fehler(f, werte[f]))) {
      setAngefasst({ name: true, telefon: true, email: true })
      const erstes = feldNamen.find((f) => fehler(f, werte[f]))
      if (erstes) document.getElementById(`k-${erstes}`)?.focus()
      return
    }
    const bestellung: BestellDaten = {
      nummer: nummer('N'),
      name: werte.name.trim(),
      abholzeit: zeit === 'asap' ? 'So schnell wie möglich (ca. 30 Minuten)' : optionen.find((o) => o.wert === zeit)?.label ?? zeit,
      positionen: positionen.map((p) => ({ name: p.name, menge: p.menge, preis: p.preis, zusatz: p.zusatz })),
      summe: summe(positionen),
    }
    speichern('nonna-bestellung', bestellung)
    leeren()
    navigate('/bestellen/danke', { state: bestellung })
  }

  const feld = (f: Feld, label: string, art: string, auto: string) => {
    const msg = fehlerFuer(f)
    return (
      <div className="feld">
        <label htmlFor={`k-${f}`}>{label}</label>
        <input
          id={`k-${f}`}
          className="feld-eingabe"
          type={art}
          autoComplete={auto}
          value={werte[f]}
          onChange={setze(f)}
          onBlur={verlassen(f)}
          aria-invalid={msg ? true : undefined}
          aria-describedby={msg ? `k-${f}-fehler` : undefined}
          required
        />
        {msg && (
          <p className="feld-fehler" id={`k-${f}-fehler`}>
            {msg}
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      <SeitenKopf
        titel="Kasse"
        satz="Letzter Schritt vor der Bestellung."
        foto={pfad('/foto/pizza-margherita-tuch.jpg')}
        alt="Pizza Margherita auf einem Leinentuch"
        hoehe="klein"
      />
      <section data-kopf="dunkel" className="best">
        <div className="best-rahmen best-rahmen--schmal">
          {positionen.length === 0 ? (
            <div className="hinweis-seite">
              <h2 className="seite-titel">Noch nichts im Warenkorb</h2>
              <p className="seite-satz">Such dir in Ruhe etwas aus, wir warten gern.</p>
              <p className="pop-aktion">
                <Link to="/bestellen" className="knopf">
                  Zurück zur Karte
                </Link>
              </p>
            </div>
          ) : (
            <form className="kasse" onSubmit={absenden} noValidate>
              <div className="kasse-formular">
                <h2 className="seite-titel seite-titel--links">Deine Daten</h2>
                {feld('name', 'Name', 'text', 'name')}
                {feld('telefon', 'Telefon', 'tel', 'tel')}
                {feld('email', 'E-Mail', 'email', 'email')}
                <div className="feld">
                  <label htmlFor="k-zeit">Abholzeit</label>
                  <select id="k-zeit" className="feld-eingabe" value={zeit} onChange={(e) => setZeit(e.target.value)}>
                    {optionen.map((o) => (
                      <option key={o.wert} value={o.wert}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="feld">
                  <label htmlFor="k-anmerkung">Anmerkung (optional)</label>
                  <textarea
                    id="k-anmerkung"
                    className="feld-eingabe"
                    rows={3}
                    value={werte.anmerkung}
                    onChange={setze('anmerkung')}
                  />
                </div>
                <fieldset className="feld feld-gruppe">
                  <legend>Zahlung</legend>
                  <label className="auswahl">
                    <input type="radio" name="zahlung" checked readOnly />
                    <span>Bezahlung bei Abholung (bar oder Karte)</span>
                  </label>
                </fieldset>
              </div>

              <aside className="kasse-summe wk" aria-labelledby="kasse-summe-titel">
                <h2 className="wk-titel" id="kasse-summe-titel">
                  Deine Bestellung
                </h2>
                <ul className="wk-liste">
                  {positionen.map((p) => (
                    <li key={p.id} className="wk-position wk-position--kasse">
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
                  <span>{eur(summe(positionen))}</span>
                </p>
                <p className="wk-hinweis">Abholung, Bezahlung vor Ort. Demo: es wird nichts bestellt oder bezahlt.</p>
                <button type="submit" className="knopf">
                  Verbindlich bestellen
                </button>
                <p className="wk-hinweis">
                  <Link to="/bestellen" className="textlink">
                    ← Zurück zur Karte
                  </Link>
                </p>
              </aside>
            </form>
          )}
        </div>
      </section>
    </>
  )
}
