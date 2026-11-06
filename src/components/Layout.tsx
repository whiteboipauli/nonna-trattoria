import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { ANFANG, ENDE } from '../data/fahrt'
import { pfad } from '../lib/pfad'
import Musik from './Musik'

// `hash` = Abschnitt auf der Startseite, sonst eigene Seite.
const links = [
  { to: { pathname: '/', hash: 'ingresso' }, label: 'Trattoria della Nonna' },
  { to: { pathname: '/', hash: 'carta' }, label: 'La Carta' },
  { to: { pathname: '/bestellen' }, label: 'Bestellen' },
  { to: { pathname: '/reservieren' }, label: 'Reservieren' },
]

type Ton = 'hell' | 'dunkel'

export default function Layout() {
  const { pathname, hash } = useLocation()
  const istStart = pathname === '/'
  // hell = weiße Schrift auf einem Foto, dunkel = schwarze Schrift auf hellem Papier.
  const [ton, setTon] = useState<Ton>(istStart ? 'hell' : 'dunkel')
  const [offen, setOffen] = useState(false)
  // Das Logo ist ganz oben groß und schrumpft, sobald gescrollt wird.
  const [gescrollt, setGescrollt] = useState(false)
  const wachter = useRef<HTMLDivElement>(null)

  // Weich zum Abschnitt scrollen, sonst nach oben.
  useEffect(() => {
    if (hash === '#ingresso') {
      window.dispatchEvent(new Event(ANFANG))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (hash) {
      // Bewusstes Überspringen der Kamerafahrt: Sperre vorher lösen, sonst endet die Seite an der Fahrt.
      window.dispatchEvent(new Event(ENDE))
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.scrollTo(0, 0)
    }
    setOffen(false)
  }, [pathname, hash])

  // Die Kopfzeile liegt direkt auf dem Foto. Sie wechselt ihre Schriftfarbe, je nachdem, was gerade
  // unter ihr liegt (Foto oder helles Papier).
  useEffect(() => {
    const abschnitte = document.querySelectorAll<HTMLElement>('[data-kopf]')
    // Startwert sofort bestimmen: welcher Abschnitt liegt gerade unter der Kopfzeile?
    const band = window.innerHeight * 0.06
    const darunter = [...abschnitte].find((a) => {
      const r = a.getBoundingClientRect()
      return r.top <= band && r.bottom > 0
    })
    setTon((darunter?.dataset.kopf as Ton) ?? (istStart ? 'hell' : 'dunkel'))
    const beobachter = new IntersectionObserver(
      (eintraege) => {
        for (const e of eintraege) {
          if (e.isIntersecting) setTon((e.target as HTMLElement).dataset.kopf as Ton)
        }
      },
      { rootMargin: '0px 0px -94% 0px' },
    )
    abschnitte.forEach((a) => beobachter.observe(a))
    return () => beobachter.disconnect()
  }, [pathname, istStart])

  useEffect(() => {
    if (!wachter.current) return
    const beobachter = new IntersectionObserver(([e]) => setGescrollt(!e.isIntersecting))
    beobachter.observe(wachter.current)
    return () => beobachter.disconnect()
  }, [])

  // Esc schließt das Menü auf dem Handy.
  useEffect(() => {
    const zu = (e: KeyboardEvent) => e.key === 'Escape' && setOffen(false)
    window.addEventListener('keydown', zu)
    return () => window.removeEventListener('keydown', zu)
  }, [])

  return (
    <div className="seitenrahmen">
      <div ref={wachter} className="logo-wachter" aria-hidden="true" />
      <header
        className="kopf"
        data-ton={ton}
        data-offen={offen}
        data-gross={!gescrollt && ton === 'hell' && !offen}
      >
        <Link
          to="/"
          className="logo"
          onClick={() => {
            window.dispatchEvent(new Event(ANFANG))
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        >
          <img className="logo-bild logo-bild--weiss" src={pfad('/logo/nonna-logo-weiss.png')} alt="Nonna" />
          <img className="logo-bild logo-bild--blau" src={pfad('/logo/nonna-logo-blau.png')} alt="" aria-hidden="true" />
        </Link>

        <nav className="kopf-nav" aria-label="Hauptmenü">
          {links.map((l) => (
            <Link key={l.label} to={l.to} className="kopf-link">
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="menue-knopf"
          aria-expanded={offen}
          aria-controls="menue"
          aria-label={offen ? 'Menü schließen' : 'Menü öffnen'}
          onClick={() => setOffen((o) => !o)}
        >
          <span className="menue-strich" />
          <span className="menue-strich" />
        </button>
      </header>

      <div id="menue" className="menue" data-offen={offen} inert={!offen}>
        <nav aria-label="Menü">
          {links.map((l, i) => (
            <Link key={l.label} to={l.to} className="menue-link" style={{ transitionDelay: `${i * 50}ms` }}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      <main className={istStart ? '' : 'unterseite'}>
        <Outlet />
      </main>

      <footer className="fuss" data-kopf="dunkel">
        <div className="fuss-rahmen">
          <div className="fuss-logo">
            <img src={pfad('/logo/nonna-logo-blau.png')} alt="" aria-hidden="true" />
            <p className="fuss-name">Trattoria della Nonna</p>
          </div>
          <div className="fuss-spalte">
            <h2 className="mono">Adresse</h2>
            <p>Musterstraße 12 (fiktiv)</p>
            <p>40213 Düsseldorf</p>
          </div>
          <div className="fuss-spalte">
            <h2 className="mono">Öffnungszeiten</h2>
            <p>Dienstag bis Sonntag, 12 bis 23 Uhr</p>
            <p>Montag Ruhetag</p>
          </div>
          <p className="mono fuss-klein">
            Demo- und Portfolio-Projekt, alle Angaben sind fiktiv.
            <Link to="/impressum">Impressum</Link>
            <Link to="/datenschutz">Datenschutz</Link>
            <Link to="/seitenplan">Seitenplan</Link>
          </p>
        </div>
      </footer>

      <Musik />
    </div>
  )
}
