import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { eur, useWarenkorb } from '../store/warenkorb'
import { useDialog } from './useDialog'
import { BASIS_SCHATTEN, DAMPF, FALL, GRUPPEN, PREIS_BASIS, SCHATTEN, ZUTATEN, type ZutatConfig } from '../pizza/pizzaConfig'
import { composePortion, mulberry32, type Manifest, type Platzierung } from '../pizza/platzieren'
import { PIZZA_URL, ladeManifest, ladeZutat, maskenKarte } from '../pizza/laden'

const BUEHNE = 1400
const konfig = Object.fromEntries(ZUTATEN.map((z) => [z.id, z]))
const zufall = ([a, b]: [number, number]) => a + Math.random() * (b - a)

type Stueck = { id: number; p: Platzierung; verzoegerung: number; weg: boolean; hoehe: number; drehung: number }

function Stueck({ s, manifest, reduziert }: { s: Stueck; manifest: Manifest; reduziert: boolean }) {
  const p = s.p
  const cfg = konfig[p.zutat]
  const w = p.breite * p.skala
  const h = p.hoehe * p.skala
  const schatten = cfg.schatten ? manifest.zutaten[p.zutat].schatten : null
  const huelle = useRef<HTMLDivElement>(null)

  // Der Schatten wächst beim Aufkommen mit.
  useEffect(() => {
    if (!schatten) return
    const t = window.setTimeout(
      () => huelle.current?.style.setProperty('--sa', String(schatten.deckkraft)),
      reduziert ? 0 : (s.verzoegerung + FALL.dauer * 0.7) * 1000,
    )
    return () => window.clearTimeout(t)
  }, [schatten, s.verzoegerung, reduziert])

  const filter = schatten
    ? `drop-shadow(${schatten.versatz * SCHATTEN.versatzX * SCHATTEN.faktor}px ${schatten.versatz * SCHATTEN.versatzY * SCHATTEN.faktor}px ${2 * schatten.blur * SCHATTEN.faktor}px rgba(${SCHATTEN.farbe}, var(--sa)))`
    : undefined

  const gesamt = FALL.dauer + FALL.nachfedern
  const t1 = FALL.dauer / gesamt
  const t2 = t1 + FALL.nachfedern / 2 / gesamt
  const federn = { duration: gesamt, times: [0, t1, t2, 1], ease: ['easeIn', 'easeOut', 'easeInOut'] as const, delay: s.verzoegerung }

  const initial = reduziert
    ? { opacity: 0 }
    : { opacity: 0, y: -s.hoehe, scaleX: FALL.startSkala, scaleY: FALL.startSkala, rotate: s.drehung }
  const da = reduziert
    ? { opacity: 1, transition: { duration: 0.25, delay: s.verzoegerung } }
    : {
        opacity: 1,
        y: [-s.hoehe, FALL.tiefer, -FALL.zurueck, 0],
        scaleX: [FALL.startSkala, 1, 1, 1],
        scaleY: [FALL.startSkala, FALL.stauchung, 1, 1],
        rotate: [s.drehung, 0],
        transition: {
          opacity: { duration: 0.14, delay: s.verzoegerung },
          y: federn,
          scaleX: federn,
          scaleY: federn,
          rotate: { duration: FALL.dauer, ease: 'easeIn', delay: s.verzoegerung },
        },
      }
  const raus = { opacity: 0, scaleX: FALL.rausSkala, scaleY: FALL.rausSkala, transition: { duration: FALL.raus, ease: 'easeOut' as const } }

  return (
    <motion.div
      className="pz-stueck"
      style={{ left: p.x - w / 2, top: p.y - h / 2, width: w, height: h, zIndex: p.ebene * 100000 + s.id }}
      initial={initial}
      animate={s.weg ? raus : da}
    >
      <div ref={huelle} className="pz-schatten" style={{ filter, '--sa': 0 } as CSSProperties}>
        <img
          src={PIZZA_URL + p.stueckDatei}
          alt=""
          draggable={false}
          style={{ transform: `rotate(${p.drehung}deg) scaleX(${p.spiegeln ? -1 : 1})` }}
        />
      </div>
    </motion.div>
  )
}

// „Eigene Pizza zusammenstellen": Basis mit Tomate, darauf fallen die gewählten Zutaten.
export default function PizzaKonfigurator({ onClose }: { onClose: () => void }) {
  const reduziert = useReducedMotion() ?? false
  const hinzufuegen = useWarenkorb((z) => z.hinzufuegen)
  const dialog = useDialog(true, onClose)

  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [basisDa, setBasisDa] = useState(false)
  const [gewaehlt, setGewaehlt] = useState<Set<string>>(new Set())
  const [stuecke, setStuecke] = useState<Stueck[]>([])
  const [fehler, setFehler] = useState('')
  const [skala, setSkala] = useState(0.5)
  const [dampfStark, setDampfStark] = useState(false)
  const [sichtbar, setSichtbar] = useState(true)

  const gewaehltRef = useRef(gewaehlt)
  const stueckeRef = useRef(stuecke)
  const zaehler = useRef(1)
  const buehne = useRef<HTMLDivElement>(null)
  const dampfTimer = useRef<number>(0)
  useEffect(() => {
    gewaehltRef.current = gewaehlt
    stueckeRef.current = stuecke
  })

  // Nur die Basis und das Manifest laden. Die Stücke kommen erst, wenn eine Zutat gebraucht wird.
  useEffect(() => {
    let aktiv = true
    ladeManifest()
      .then((m) => aktiv && setManifest(m))
      .catch(() => aktiv && setFehler('Die Pizza konnte nicht geladen werden. Versuch es bitte gleich noch einmal.'))
    return () => {
      aktiv = false
      window.clearTimeout(dampfTimer.current)
    }
  }, [])

  // Bühne mitskalieren
  useEffect(() => {
    const el = buehne.current
    if (!el) return
    const ro = new ResizeObserver(() => setSkala(el.clientWidth / BUEHNE))
    ro.observe(el)
    setSkala(el.clientWidth / BUEHNE)
    return () => ro.disconnect()
  }, [])

  // Dampf nur animieren, solange die Bühne zu sehen ist
  useEffect(() => {
    const el = buehne.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setSichtbar(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const vorladen = useCallback((id: string) => {
    ladeManifest()
      .then((m) => ladeZutat(id, m))
      .catch(() => undefined)
  }, [])

  const entfernen = useCallback((id: string) => {
    setStuecke((alt) => alt.map((s) => (s.p.zutat === id && !s.weg ? { ...s, weg: true } : s)))
    window.setTimeout(() => setStuecke((alt) => alt.filter((s) => !(s.p.zutat === id && s.weg))), FALL.raus * 1000 + 60)
  }, [])

  const auflegen = useCallback(async (id: string) => {
    try {
      const m = await ladeManifest()
      await ladeZutat(id, m)
      // Wurde die Zutat inzwischen wieder abgewählt, bleibt die Pizza so.
      if (!gewaehltRef.current.has(id)) return
      const bestehende = stueckeRef.current.filter((s) => !s.weg && s.p.zutat !== id).map((s) => s.p)
      const portion = composePortion(id, bestehende, mulberry32((Math.random() * 2 ** 32) >>> 0), {
        manifest: m,
        config: konfig,
        masken: maskenKarte,
      })
      let t = 0
      const neu: Stueck[] = portion.map((p) => {
        t += zufall(FALL.versatzMs) / 1000
        return { id: zaehler.current++, p, verzoegerung: t, weg: false, hoehe: zufall(FALL.hoehe), drehung: (Math.random() * 2 - 1) * FALL.startDrehung }
      })
      setStuecke((alt) => [...alt, ...neu])
      if (!reduziert) {
        window.clearTimeout(dampfTimer.current)
        dampfTimer.current = window.setTimeout(() => {
          setDampfStark(true)
          dampfTimer.current = window.setTimeout(() => setDampfStark(false), DAMPF.nachLandungMs)
        }, (t + FALL.dauer) * 1000)
      }
    } catch {
      setGewaehlt((alt) => {
        const n = new Set(alt)
        n.delete(id)
        return n
      })
      setFehler('Diese Zutat konnte nicht geladen werden. Versuch es bitte noch einmal.')
    }
  }, [reduziert])

  const umschalten = (id: string) => {
    setFehler('')
    const n = new Set(gewaehltRef.current)
    if (n.has(id)) {
      n.delete(id)
      gewaehltRef.current = n
      setGewaehlt(n)
      entfernen(id)
    } else {
      n.add(id)
      gewaehltRef.current = n
      setGewaehlt(n)
      void auflegen(id)
    }
  }

  const zuruecksetzen = () => {
    for (const id of gewaehltRef.current) entfernen(id)
    gewaehltRef.current = new Set()
    setGewaehlt(new Set())
  }

  const liste = useMemo(() => ZUTATEN.filter((z) => gewaehlt.has(z.id)), [gewaehlt])
  const preis = Math.round((PREIS_BASIS + liste.reduce((s, z) => s + z.preis, 0)) * 100) / 100

  const inDenWarenkorb = () => {
    hinzufuegen({
      id: `eigene-pizza:${liste.map((z) => z.id).sort().join('+')}`,
      name: 'Eigene Pizza',
      preis,
      zusatz: liste.length ? liste.map((z) => z.name).join(', ') : 'nur Tomate',
    })
    onClose()
  }

  const gruppe = (g: string, zutaten: ZutatConfig[]) => (
    <section className="pz-gruppe" key={g} aria-labelledby={`pz-g-${g}`}>
      <h3 className="pz-gruppe-name" id={`pz-g-${g}`}>
        {g}
      </h3>
      <ul className="pz-zutaten">
        {zutaten.map((z) => (
          <li key={z.id}>
            <button
              type="button"
              className="pz-zutat"
              aria-pressed={gewaehlt.has(z.id)}
              onClick={() => umschalten(z.id)}
              onPointerEnter={() => vorladen(z.id)}
              onFocus={() => vorladen(z.id)}
              onTouchStart={() => vorladen(z.id)}
            >
              <span className="pz-vorschau" aria-hidden="true">
                {basisDa && <img src={`${PIZZA_URL}${z.id}/${z.id}_01.webp`} alt="" loading="lazy" decoding="async" draggable={false} />}
              </span>
              <span className="pz-zutat-name">{z.name}</span>
              <span className="pz-zutat-preis">+ {eur(z.preis)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )

  return (
    <div className="overlay pz-overlay">
      <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="pz-titel" className="pz">
        <button type="button" className="schliessen" onClick={onClose} aria-label="Pizza-Konfigurator schließen">
          ×
        </button>

        <div className="pz-links">
          <div className="pz-buehne" ref={buehne}>
            {!basisDa && <div className="pz-skelett" aria-hidden="true" />}
            <div className="pz-welt" style={{ transform: `scale(${skala})` }} aria-hidden="true">
              <img
                className="pz-basis"
                src={`${PIZZA_URL}basis.webp`}
                alt=""
                width={BUEHNE}
                height={BUEHNE}
                draggable={false}
                fetchPriority="high"
                style={{ filter: BASIS_SCHATTEN, opacity: basisDa ? 1 : 0 }}
                onLoad={() => setBasisDa(true)}
              />
              {manifest && stuecke.map((s) => <Stueck key={s.id} s={s} manifest={manifest} reduziert={reduziert} />)}
            </div>
            {!reduziert && (
              <div className="pz-dampf" aria-hidden="true" data-an={sichtbar || undefined} style={{ '--dampf': dampfStark ? DAMPF.nachLandung : DAMPF.normal } as CSSProperties}>
                <span />
                <span />
                <span />
                <span />
              </div>
            )}
          </div>
        </div>

        <div className="pz-rechts">
          <header className="pz-kopf">
            <h2 className="seite-titel seite-titel--links" id="pz-titel">
              Eigene Pizza
            </h2>
            <p className="pz-satz">Tipp eine Zutat an, sie fällt auf deine Pizza. Nochmal tippen nimmt sie wieder runter.</p>
            <p className="pz-satz pz-satz--klein">Die Basis mit Tomate gibt es ab {eur(PREIS_BASIS)}.</p>
            <button type="button" className="textlink pz-reset" onClick={zuruecksetzen} disabled={gewaehlt.size === 0}>
              Alles zurücksetzen
            </button>
          </header>

          {GRUPPEN.map((g) =>
            gruppe(
              g,
              ZUTATEN.filter((z) => z.gruppe === g),
            ),
          )}

          <p className="sr-only" aria-live="polite">
            {liste.length ? `Gewählt: ${liste.map((z) => z.name).join(', ')}.` : 'Keine Zutaten gewählt, nur Tomate.'}
          </p>
          {fehler && (
            <p className="feld-fehler" role="alert">
              {fehler}
            </p>
          )}

          <div className="pz-leiste">
            <p className="pz-preis" aria-live="polite">
              <span>Deine Pizza</span>
              <span>{eur(preis)}</span>
            </p>
            <button type="button" className="knopf" onClick={inDenWarenkorb}>
              In den Warenkorb
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
