import { Link } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import { pfad } from '../lib/pfad'

type Einladung = {
  to: string
  seite: 'links' | 'rechts'
  titel: string
  link: string
  foto: string
  alt: string
  fokus: string
}

const einladungen: Einladung[] = [
  {
    to: '/bestellen',
    seite: 'rechts',
    titel: 'Bestellen',
    link: 'Zur Karte',
    foto: pfad('/foto/bestellen.jpg'),
    alt: 'Margherita mit gebräuntem Blasenrand und Basilikum auf einem Holzschieber, hinter ihr der blau gekachelte Pizzaofen, Dampf steigt auf',
    fokus: '40% 50%',
  },
  {
    to: '/reservieren',
    seite: 'links',
    titel: 'Reservieren',
    link: 'Tisch sichern',
    foto: pfad('/foto/reservieren.jpg'),
    alt: 'Eine Familie über drei Generationen stößt lachend mit Gläsern an, vor ihr ein Tisch voller Pizza und Pasta',
    fokus: '60% 50%',
  },
]

// Zwei große Fotos am Ende der Startseite, Text direkt darauf: Bestellen und Reservieren.
export default function Abschluss() {
  return (
    <section id="abschluss" className="abschluss">
      {einladungen.map((e) => (
        <Link key={e.to} to={e.to} data-kopf="hell" className={`einladung einladung--${e.seite}`}>
          <img
            className="einladung-foto"
            src={e.foto}
            alt={e.alt}
            style={{ objectPosition: e.fokus }}
            loading="lazy"
            decoding="async"
          />
          <div className="einladung-text">
            <h2 className="einladung-titel">{e.titel}</h2>
            <span className="einladung-link">
              {e.link} <ArrowRight weight="light" aria-hidden="true" />
            </span>
          </div>
        </Link>
      ))}
    </section>
  )
}
