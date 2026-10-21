import { Link } from 'react-router-dom'
import { AbschnittKopf, Seite } from '../components/Platzhalter'

type Eintrag = { to: string; titel: string; unter?: string[] }

const seiten: Eintrag[] = [
  {
    to: '/',
    titel: 'Startseite (scrollbar)',
    unter: [
      'Casa della Nonna = Kamerafahrt durchs Haus (Geschichte der Familie, Gerichte tauchen an den Stationen auf). Klick aufs Logo führt hierher.',
      'La Carta: Tagesmenü + Doppelseiten (Antipasti | Pizza, Primi | Secondi, Dolci | Vini e Cocktail)',
      'Abschluss: Einladungen zu Bestellen und Reservieren',
    ],
  },
  {
    to: '/bestellen',
    titel: 'Bestellen',
    unter: [
      'Foto vom Essen oben, „Bestellen“ rechts daneben',
      'Die Karte zum Bestellen mit Warenkorb rechts',
      'Klick auf eine Pizza: große animierte Pizza',
      'Eigene Pizza: Zutaten fallen automatisch auf die Pizza',
    ],
  },
  { to: '/bestellen/kasse', titel: 'Kasse (Demo)' },
  { to: '/bestellen/danke', titel: 'Bestellbestätigung' },
  {
    to: '/reservieren',
    titel: 'Reservieren',
    unter: ['Foto oder Videoanimation oben', 'Datum', 'Uhrzeit', 'Personenzahl', 'Deine Daten', 'Öffnungszeiten, Adresse und Anfahrt, Telefon und E-Mail'],
  },
  { to: '/reservieren/danke', titel: 'Reservierungsbestätigung' },
  { to: '/impressum', titel: 'Impressum (fiktiv, mit Demo-Hinweis)' },
  { to: '/datenschutz', titel: 'Datenschutz (fiktiv, mit Demo-Hinweis)' },
]

export default function Struktur() {
  return (
    <Seite>
      <AbschnittKopf
        phase="Entwurf · nur für uns"
        titel="Seitenplan"
        text="Alle Seiten der Website auf einen Blick. Klick auf einen Titel, um die Seite zu öffnen. Diese Übersicht verschwindet am Ende."
      />
      <ol className="space-y-6">
        {seiten.map((s, i) => (
          <li key={s.to} className="flex gap-4">
            <span className="w-6 pt-1 text-sm opacity-50">{i + 1}</span>
            <div>
              <Link to={s.to} className="text-xl font-bold underline decoration-tomate/40 hover:text-tomate">
                {s.titel}
              </Link>
              {s.unter && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm opacity-70">
                  {s.unter.map((u) => (
                    <li key={u}>{u}</li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Seite>
  )
}
