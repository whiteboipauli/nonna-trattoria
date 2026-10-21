type Props = {
  titel: string
  satz?: string
  foto: string
  alt: string
  fokus?: string
  seite?: 'links' | 'rechts'
  hoehe?: 'gross' | 'klein'
}

// Kopf einer Unterseite: Foto bis an den Rand, Titel in Pinselschrift direkt darauf, genau wie bei
// Bestellen und Reservieren am Ende der Startseite. Nur nicht klickbar.
export default function SeitenKopf({
  titel,
  satz,
  foto,
  alt,
  fokus = '50% 50%',
  seite = 'links',
  hoehe = 'gross',
}: Props) {
  return (
    <header data-kopf="hell" className={`einladung einladung--${seite} seitenkopf--${hoehe}${titel.length > 16 ? ' einladung--lang' : ''}`}>
      <img
        className="einladung-foto"
        src={foto}
        alt={alt}
        style={{ objectPosition: fokus }}
        fetchPriority="high"
        decoding="async"
      />
      <div className="einladung-text">
        <h1 className="einladung-titel">{titel}</h1>
        {satz && <p className="einladung-satz">{satz}</p>}
      </div>
    </header>
  )
}
