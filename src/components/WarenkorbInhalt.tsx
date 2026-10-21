import { Link } from 'react-router-dom'
import { anzahl, eur, summe, useWarenkorb, type Position } from '../store/warenkorb'

// Inhalt des Warenkorbs: wird am Desktop in der rechten Spalte und am Handy im Blatt von unten gezeigt.
export default function WarenkorbInhalt({ titelId, beiKasse }: { titelId: string; beiKasse?: () => void }) {
  const positionen = useWarenkorb((z) => z.positionen)
  const hinzufuegen = useWarenkorb((z) => z.hinzufuegen)
  const weniger = useWarenkorb((z) => z.weniger)
  const entfernen = useWarenkorb((z) => z.entfernen)
  const leer = positionen.length === 0

  return (
    <>
      <h2 className="wk-titel" id={titelId}>
        Dein Warenkorb
      </h2>
      {leer ? (
        <p className="wk-leer">Noch nichts im Warenkorb.</p>
      ) : (
        <ul className="wk-liste">
          {positionen.map((p) => (
            <li key={p.id} className="wk-position">
              <p className="wk-name">
                {p.name}
                {p.zusatz && <span className="wk-zusatz">{p.zusatz}</span>}
              </p>
              <p className="wk-preis">{eur(p.preis * p.menge)}</p>
              <div className="wk-menge" role="group" aria-label={`Menge ${p.name}`}>
                <button type="button" className="rund-klein" onClick={() => weniger(p.id)} aria-label={`${p.name}: eine Portion weniger`}>
                  −
                </button>
                <span aria-label={`${p.menge} Portionen`}>{p.menge}</span>
                <button
                  type="button"
                  className="rund-klein"
                  onClick={() => hinzufuegen({ id: p.id, name: p.name, preis: p.preis, zusatz: p.zusatz })}
                  aria-label={`${p.name}: eine Portion mehr`}
                >
                  +
                </button>
              </div>
              <button type="button" className="wk-weg" onClick={() => entfernen(p.id)} aria-label={`${p.name} entfernen`}>
                Entfernen
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="wk-summe" aria-live="polite">
        <span>Summe</span>
        <span>{eur(summe(positionen))}</span>
      </p>
      <p className="wk-hinweis">Abholung, Bezahlung vor Ort</p>
      {leer ? (
        <button type="button" className="knopf" disabled>
          Zur Kasse
        </button>
      ) : (
        <Link to="/bestellen/kasse" className="knopf" onClick={beiKasse}>
          Zur Kasse
        </Link>
      )}
    </>
  )
}

export function warenkorbZeile(positionen: Position[]) {
  const n = anzahl(positionen)
  return `Warenkorb · ${n} ${n === 1 ? 'Gericht' : 'Gerichte'} · ${eur(summe(positionen))}`
}
