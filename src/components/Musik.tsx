import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react'
import { pfad } from '../lib/pfad'

// Gemeinfreie Aufnahmen, Quellen und Lizenzen in public/musik/QUELLEN.txt. Sie laufen der Reihe nach im Kreis.
const STUECKE = [pfad('/musik/01.mp3'), pfad('/musik/02.mp3'), pfad('/musik/03.mp3')]
const LAUTSTAERKE = 0.35
// Ein- und Ausblenden in Sekunden.
const EINBLENDEN = 1.2
const AUSBLENDEN = 0.6

type Ton = 'hell' | 'dunkel'

// Kleiner Schalter unten rechts. Standard ist aus: Ton startet nur nach einem Klick, die Wahl wird nicht
// gespeichert. Die Musik wird erst beim ersten Einschalten geladen, damit die Kamerafahrt Vorrang hat.
export default function Musik() {
  const { pathname } = useLocation()
  const [an, setAn] = useState(false)
  // Wie die Kopfzeile: weiße Schrift auf Fotos, blaue auf hellem Papier.
  const [ton, setTon] = useState<Ton>('hell')
  const knopf = useRef<HTMLButtonElement>(null)
  const audio = useRef<HTMLAudioElement | null>(null)
  const stueck = useRef(0)
  const blende = useRef(0)
  const anRef = useRef(false)

  // Lautstärke weich auf `ziel` bringen, danach `danach` ausführen.
  const blenden = (ziel: number, dauer: number, danach?: () => void) => {
    const a = audio.current
    if (!a) return
    cancelAnimationFrame(blende.current)
    const von = a.volume
    const start = performance.now()
    const schritt = (nun: number) => {
      const p = Math.min(1, (nun - start) / (dauer * 1000))
      a.volume = von + (ziel - von) * p
      if (p < 1) blende.current = requestAnimationFrame(schritt)
      else danach?.()
    }
    blende.current = requestAnimationFrame(schritt)
  }

  const holeAudio = () => {
    if (!audio.current) {
      const a = new Audio()
      a.preload = 'auto'
      a.volume = 0
      a.src = STUECKE[0]
      // Nach dem letzten Stück beginnt es wieder von vorn.
      a.addEventListener('ended', () => {
        stueck.current = (stueck.current + 1) % STUECKE.length
        a.src = STUECKE[stueck.current]
        a.play().catch(() => undefined)
      })
      audio.current = a
    }
    return audio.current
  }

  const abspielen = () => {
    const a = holeAudio()
    a.play()
      .then(() => blenden(LAUTSTAERKE, EINBLENDEN))
      .catch(() => {
        anRef.current = false
        setAn(false)
      })
  }

  const umschalten = () => {
    const neu = !anRef.current
    anRef.current = neu
    setAn(neu)
    if (neu) abspielen()
    else blenden(0, AUSBLENDEN, () => audio.current?.pause())
  }

  // Unsichtbarer Tab: Pause. Wieder sichtbar und die Musik war an: weiter.
  useEffect(() => {
    const sicht = () => {
      const a = audio.current
      if (!a || !anRef.current) return
      if (document.hidden) {
        cancelAnimationFrame(blende.current)
        a.pause()
      } else {
        abspielen()
      }
    }
    document.addEventListener('visibilitychange', sicht)
    return () => document.removeEventListener('visibilitychange', sicht)
    // abspielen nutzt nur Refs und den stabilen Setter, ein Anmelden beim Start reicht.
  }, [])

  useEffect(
    () => () => {
      cancelAnimationFrame(blende.current)
      audio.current?.pause()
    },
    [],
  )

  // Was liegt gerade unter dem Schalter? Abschnitte mit data-kopf sagen, ob Foto (hell) oder Papier (dunkel).
  useEffect(() => {
    let raf = 0
    const pruefen = () => {
      raf = 0
      const k = knopf.current
      if (!k) return
      const r = k.getBoundingClientRect()
      const unter = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2).find((el) => !k.contains(el))
      const bereich = unter?.closest<HTMLElement>('[data-kopf]')
      setTon((bereich?.dataset.kopf as Ton | undefined) ?? 'dunkel')
    }
    const planen = () => {
      if (!raf) raf = requestAnimationFrame(pruefen)
    }
    planen()
    window.addEventListener('scroll', planen, { passive: true })
    window.addEventListener('resize', planen)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', planen)
      window.removeEventListener('resize', planen)
    }
  }, [pathname])

  return (
    <button
      ref={knopf}
      type="button"
      className="musik"
      data-ton={ton}
      aria-pressed={an}
      aria-label={an ? 'Musik ausschalten' : 'Musik einschalten'}
      onClick={umschalten}
    >
      {an ? <SpeakerHigh weight="light" aria-hidden="true" /> : <SpeakerSlash weight="light" aria-hidden="true" />}
      <span>{an ? 'Musik an' : 'Musik aus'}</span>
    </button>
  )
}
