import { Fragment, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { gsap } from 'gsap'
import {
  ANFANG,
  ANSATZ,
  BESCHLEUNIGUNG,
  BIS_ZEIT,
  ENDE,
  NACHLAUF,
  STRECKE,
  TEMPO_MAX,
  TEXT_WARTEN,
  VON_ZEIT,
  stationen,
  type Station,
} from '../data/fahrt'
import video from '../data/fahrt-video.json'
import { pfad } from '../lib/pfad'

// Der Pinsel schreibt von links nach rechts. Überstände der Schwünge bleiben sichtbar (negative Ränder).
const VERBORGEN = 'inset(-30% 100% -30% -10%)'
const SICHTBAR = 'inset(-30% -10% -30% -10%)'

// Text direkt auf dem Foto: große Pinselschrift, darunter ein Satz und die Gerichte in kleiner Schrift.
function Text({ s, erste }: { s: Station; erste: boolean }) {
  const Titel = erste ? 'h1' : 'h2'
  // Stationen ohne Text: nur ein leerer Platzhalter, damit Texte und Fotos gleich nummeriert bleiben.
  if (s.zeilen.length === 0) return <div className="fahrt-text" aria-hidden="true" />
  return (
    <div className={`fahrt-text platz-${s.platz}`}>
      <div className="text-block">
        <Titel
          className={s.istSatz ? 'titel titel--satz' : 'titel'}
          id={`t-${s.id}`}
          // Längste Zeile in Buchstaben: am Handy wird die Schrift so gewählt, dass sie ins Bild passt.
          style={
            s.istSatz
              ? undefined
              : ({
                  '--zl': Math.max(...s.zeilen.map((z) => z.length)),
                } as CSSProperties)
          }
        >
          {s.zeilen.map((z, i) => (
            <Fragment key={z}>
              <span className="zeile" data-zeile>
                {z}
              </span>
              {i < s.zeilen.length - 1 && ' '}
            </Fragment>
          ))}
        </Titel>
        {s.satz && (
          <p className="satz" data-rest>
            {s.satz}
          </p>
        )}
        {s.gerichte && (
          <p className="gerichte" data-rest>
            {s.gerichte.join(' / ')}
          </p>
        )}
        {s.mono && (
          <p className="gerichte" data-rest>
            {s.mono}
          </p>
        )}
      </div>
    </div>
  )
}

const N = video.bilder
const FPS = video.fps
// Ein Viertelbild hinter dem Bildanfang: Dort landet ein Sprung sicher auf dem richtigen Bild.
const VERSATZ = 0.25 / FPS
// Nummer des Bildes, das zur Zeit t zu sehen ist.
const bildNr = (t: number) => Math.min(Math.max(Math.floor(t * FPS + 1e-6), 0), N - 1)

// '45% 50%' wird zu [0.45, 0.5].
const fokusVon = (s: Station) => s.fokus.split(' ').map((w) => parseFloat(w) / 100) as [number, number]

// Bildausschnitt zur Videozeit t: zwischen den Standbildzeiten der Stationen linear übergeblendet.
function fokusBei(t: number): [number, number] {
  if (t <= stationen[0].zeit) return fokusVon(stationen[0])
  for (let i = 0; i < stationen.length - 1; i++) {
    const a = stationen[i]
    const b = stationen[i + 1]
    if (t <= b.zeit) {
      const fa = fokusVon(a)
      const fb = fokusVon(b)
      const p = (t - a.zeit) / (b.zeit - a.zeit)
      return [fa[0] + (fb[0] - fa[0]) * p, fa[1] + (fb[1] - fa[1]) * p]
    }
  }
  return fokusVon(stationen[stationen.length - 1])
}

const warte = (ms: number) => new Promise<void>((weiter) => setTimeout(weiter, ms))

// Springt im Video auf die Zeit t und wartet, bis das Bild da ist.
function suche(v: HTMLVideoElement, t: number) {
  return new Promise<void>((weiter) => {
    const fertig = () => {
      v.removeEventListener('seeked', fertig)
      weiter()
    }
    v.addEventListener('seeked', fertig)
    v.currentTime = t
  })
}

// Ladezustand des Videos für die Anzeige. `prozent` ist null, wenn die Größe unbekannt ist.
type Ladestand = { art: 'laedt'; prozent: number | null } | { art: 'bereit' } | { art: 'fehler' }

// Das Video wird nie abgespielt, nur geseekt: `setze(t)` nennt die Ziel-Videozeit, das gezeigte Bild folgt
// ihr weich. `bei(t)` bekommt die gerade gezeigte Zeit (für Text und Ausschnitt). Das Startbild hält,
// bis das Video geladen ist.
function starteFilm(
  video: HTMLVideoElement,
  startZeit: number,
  melde: (stand: Ladestand) => void,
  bei: (t: number, jetztMs: number) => boolean,
  nachBild: () => void,
) {
  const abbruch = new AbortController()
  const urls: string[] = []
  let aus = false
  let bereit = false
  let ziel = startZeit
  let aktuell = startZeit
  // Aktuelles Tempo in Videosekunden pro Sekunde (bleibt zwischen den Bildern erhalten).
  let v = 0
  let letzteMs = 0
  let angezeigt = -1
  let raf = 0

  const ausschnitt = (t: number) => {
    const [fx, fy] = fokusBei(t)
    video.style.objectPosition = `${(fx * 100).toFixed(2)}% ${(fy * 100).toFixed(2)}%`
  }

  const plane = () => {
    if (!raf && bereit && !aus) {
      raf = requestAnimationFrame(schritt)
    }
  }

  // Ein Bild der Folgeschleife. Läuft nur weiter, solange sich etwas bewegt oder noch etwas aussteht.
  function schritt(ms: number) {
    raf = 0
    if (aus) return
    // Echte Zeit seit dem letzten Bild (aus dem Zeitstempel), nach einer Pause im ersten Bild 0.
    const dt = letzteMs ? Math.min((ms - letzteMs) / 1000, 0.1) : 0
    letzteMs = ms
    const d = ziel - aktuell
    // Verfolgung mit Höchsttempo: Wunschtempo wächst mit dem Abstand, das Tempo selbst baut sich weich auf.
    const vSoll = Math.min(Math.max(d * ANSATZ, -TEMPO_MAX), TEMPO_MAX)
    v += (vSoll - v) * (1 - Math.exp(-dt / BESCHLEUNIGUNG))
    const schrittWeite = v * dt
    if (Math.abs(d) < 0.5 / FPS || Math.abs(schrittWeite) >= Math.abs(d)) {
      aktuell = ziel
      v = 0
    } else {
      aktuell += schrittWeite
    }
    // currentTime nur setzen, wenn das Video nicht seekt und sich das Bild geändert hat.
    const nr = bildNr(aktuell)
    if (nr !== angezeigt && !video.seeking) {
      angezeigt = nr
      video.currentTime = nr / FPS + VERSATZ
    }
    ausschnitt(aktuell)
    const offen = bei(aktuell, ms)
    nachBild()
    if (aktuell !== ziel || angezeigt !== nr || offen) plane()
    // Die Schleife endet: Beim nächsten Start gibt es keinen riesigen Zeitsprung.
    else letzteMs = 0
  }

  // Lädt die ganze Datei als Blob und meldet unterwegs den Fortschritt in Prozent.
  const holen = async (url: string, fortschritt?: (prozent: number | null) => void) => {
    const antwort = await fetch(url, { signal: abbruch.signal })
    if (!antwort.ok) throw new Error(`${url}: HTTP ${antwort.status}`)
    const typ = antwort.headers.get('content-type') ?? 'video/mp4'
    const gesamt = Number(antwort.headers.get('content-length')) || 0
    if (!antwort.body) return antwort.blob()
    const leser = antwort.body.getReader()
    const teile: Uint8Array<ArrayBuffer>[] = []
    let gelesen = 0
    let zuletzt = -1
    fortschritt?.(gesamt ? 0 : null)
    for (;;) {
      const { done, value } = await leser.read()
      if (done) break
      teile.push(value)
      gelesen += value.length
      // Nur bei jedem neuen ganzen Prozent melden, nicht bei jedem Datenpaket.
      if (!gesamt) continue
      const prozent = Math.min(99, Math.floor((gelesen / gesamt) * 100))
      if (prozent !== zuletzt) {
        zuletzt = prozent
        fortschritt?.(prozent)
      }
    }
    return new Blob(teile, { type: typ })
  }

  const laden = async (v: HTMLVideoElement, url: string, fortschritt?: (prozent: number | null) => void) => {
    const blob = await holen(url, fortschritt)
    if (aus) return
    const objekt = URL.createObjectURL(blob)
    urls.push(objekt)
    // Warten, bis das erste Bild da ist. Hängt es 15 Sekunden, reicht ein Video mit Bild (readyState 2).
    await new Promise<void>((weiter, fehler) => {
      const aufraeumen = () => {
        clearTimeout(uhr)
        v.removeEventListener('loadeddata', fertig)
        v.removeEventListener('canplaythrough', fertig)
        v.removeEventListener('error', kaputt)
      }
      const fertig = () => {
        aufraeumen()
        weiter()
      }
      const kaputt = () => {
        aufraeumen()
        fehler(new Error(`${url}: Video nicht abspielbar (Fehlercode ${v.error?.code ?? 'unbekannt'})`))
      }
      const uhr = setTimeout(() => {
        aufraeumen()
        if (v.readyState >= 2) weiter()
        else fehler(new Error(`${url}: nach 15 Sekunden noch kein Bild (readyState ${v.readyState})`))
      }, 15000)
      v.addEventListener('loadeddata', fertig)
      v.addEventListener('canplaythrough', fertig)
      v.addEventListener('error', kaputt)
      v.src = objekt
      v.preload = 'auto'
      v.load()
    })
  }

  // Ein Fehler darf einmal passieren: nach 2 Sekunden noch ein Versuch.
  const nochmal = async (versuch: () => Promise<void>) => {
    try {
      await versuch()
    } catch (fehler) {
      if (aus) throw fehler
      await warte(2000)
      if (aus) throw fehler
      await versuch()
    }
  }

  video.muted = true
  ;(async () => {
    await nochmal(() =>
      laden(video, pfad('/kamerafahrt/fahrt-scrub.mp4'), (prozent) => melde({ art: 'laedt', prozent })),
    )
    if (aus) return
    aktuell = ziel
    angezeigt = bildNr(aktuell)
    await suche(video, angezeigt / FPS + VERSATZ)
    if (aus) return
    ausschnitt(aktuell)
    video.style.opacity = '1'
    bereit = true
    bei(aktuell, performance.now())
    nachBild()
    melde({ art: 'bereit' })
    plane()
  })().catch((fehler) => {
    if (aus) return
    // Ohne Video bleibt das Startbild stehen, die Ursache steht in der Konsole.
    console.error('Kamerafahrt: Video konnte nicht geladen werden.', fehler)
    if (!bereit) melde({ art: 'fehler' })
  })

  return {
    // Läuft das Video (geladen, kein Fehler)? Nur dann kann die Seite am Ende der Strecke warten.
    get bereit() {
      return bereit
    },
    // Hat das gezeigte Bild das Ende (BIS_ZEIT) erreicht? Ohne geladenes Video nie, aber dann gibt es keine Sperre.
    angekommen() {
      return bereit && aktuell >= BIS_ZEIT - 0.5 / FPS
    },
    // Neue Ziel-Videozeit. Mit `sofort` springt das Bild ohne Gleiten dorthin (Resize, Rücksprung).
    setze(t: number, sofort = false) {
      ziel = t
      if (sofort) {
        aktuell = t
        v = 0
      }
      plane()
    },
    stop() {
      aus = true
      cancelAnimationFrame(raf)
      abbruch.abort()
      video.pause()
      video.removeAttribute('src')
      video.load()
      urls.forEach((u) => URL.revokeObjectURL(u))
    },
  }
}

// Rundgang durch Nonnas Haus als durchgehende Kamerafahrt. Sie steht fest im Bild (sticky), während man
// durch den hohen Abschnitt scrollt: Die Scrollposition bestimmt das Videobild, vorwärts wie rückwärts.
// Die Texte der Stationen erscheinen nach Videozeit in ihren Fenstern, immer nur einer. Danach scrollt
// die Seite ganz normal weiter, nachdem das Video am Ende angekommen ist (die Seite wartet am Ende der Strecke). Mit "reduzierte Bewegung" stehen die Stationen als Standbilder untereinander.
export default function Kamerafahrt() {
  const wurzel = useRef<HTMLElement>(null)
  const rahmenRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [reduziert] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [ladestand, setLadestand] = useState<Ladestand>({
    art: 'laedt',
    prozent: null,
  })

  useLayoutEffect(() => {
    if (reduziert || !wurzel.current || !rahmenRef.current || !videoRef.current) return
    const abschnitt = wurzel.current
    const rahmen = rahmenRef.current
    const texte = gsap.utils.toArray<HTMLElement>('.fahrt-text', abschnitt)

    // Aus der Scrollposition im Abschnitt (0 bis 1) die Ziel-Videozeit.
    const zielZeit = () => {
      const strecke = rahmen.offsetHeight * STRECKE
      const p = strecke > 0 ? Math.min(Math.max(-abschnitt.getBoundingClientRect().top / strecke, 0), 1) : 0
      return VON_ZEIT + p * (BIS_ZEIT - VON_ZEIT)
    }

    let sichtbar: number | null = 0
    let kandidat: number | null = 0
    let seit = 0

    // Texte ab der zweiten Station warten verborgen. Die erste behält ihre CSS-Intro-Animation.
    const ctx = gsap.context(() => {
      texte.forEach((text, i) => {
        if (i === 0) return
        gsap.set(text.querySelectorAll('[data-zeile]'), {
          clipPath: VERBORGEN,
        })
        gsap.set(text.querySelectorAll('[data-rest]'), { autoAlpha: 0, y: 14 })
      })
    }, abschnitt)

    const zeigeText = (i: number) => {
      sichtbar = i
      const text = texte[i]
      gsap.killTweensOf(text)
      if (i === 0) {
        gsap.to(text, {
          autoAlpha: 1,
          y: 0,
          duration: 0.4,
          ease: 'power2.out',
        })
        return
      }
      gsap.set(text, { autoAlpha: 1, y: 0 })
      gsap.fromTo(
        text.querySelectorAll('[data-zeile]'),
        { clipPath: VERBORGEN },
        {
          clipPath: SICHTBAR,
          duration: 0.55,
          stagger: 0.18,
          ease: 'power2.out',
        },
      )
      gsap.fromTo(
        text.querySelectorAll('[data-rest]'),
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.12,
          delay: 0.35,
          ease: 'power2.out',
        },
      )
    }

    // Der Text geht leise nach oben weg.
    const versteckeText = () => {
      if (sichtbar === null) return
      gsap.killTweensOf(texte[sichtbar])
      gsap.to(texte[sichtbar], {
        autoAlpha: 0,
        y: -18,
        duration: 0.35,
        ease: 'power2.in',
      })
      sichtbar = null
    }

    // Station, deren Textfenster die Videozeit t enthält (sonst null).
    const textFuer = (t: number) => {
      const i = stationen.findIndex((s) => s.text && t >= s.text[0] && t < s.text[1])
      return i < 0 ? null : i
    }

    // Wechselt den Text erst, wenn die Zeit TEXT_WARTEN lang im neuen Fenster war. Gibt true zurück,
    // solange ein Wechsel noch aussteht (dann läuft die Schleife weiter).
    const textBei = (t: number, ms: number) => {
      const soll = textFuer(t)
      if (soll !== kandidat) {
        kandidat = soll
        seit = ms
      }
      if (kandidat === sichtbar) return false
      if (ms - seit < TEXT_WARTEN * 1000) return true
      versteckeText()
      if (kandidat !== null) zeigeText(kandidat)
      return false
    }

    // Sperre: Solange das Video bereit, aber noch nicht am Ende ist, endet das Dokument am Ende des Abschnitts.
    // Das Attribut am html-Element wirkt über das CSS auf #root (siehe index.css).
    const wurzelEl = document.documentElement
    let gesetzt = false
    const setzeEnde = () =>
      wurzelEl.style.setProperty(
        '--fahrt-ende',
        `${Math.round(abschnitt.getBoundingClientRect().top + window.scrollY + abschnitt.offsetHeight)}px`,
      )
    const sperre = () => {
      const soll = gesperrt()
      if (soll === gesetzt) return
      gesetzt = soll
      if (soll) {
        setzeEnde()
        wurzelEl.setAttribute('data-fahrt-sperre', '')
      } else {
        wurzelEl.removeAttribute('data-fahrt-sperre')
      }
    }

    // Wird gesetzt, sobald das Video angekommen ist; gesperrt = bereit und nicht angekommen.
    // eslint-disable-next-line prefer-const
    let film: ReturnType<typeof starteFilm>
    const gesperrt = () => film.bereit && !film.angekommen()
    film = starteFilm(videoRef.current, zielZeit(), setLadestand, textBei, sperre)
    sperre()

    // Bewusstes Überspringen (Anker-Navigation): Das Ziel bleibt am Ende, bis die Seite zur Ruhe kommt,
    // sonst würde das Video beim weichen Scrollen durch die Strecke wieder zurücklaufen.
    let ueberspringen = false
    let ruhe = 0
    const beiScroll = () => {
      if (ueberspringen) {
        clearTimeout(ruhe)
        ruhe = window.setTimeout(() => {
          ueberspringen = false
          film.setze(zielZeit())
        }, 150)
        return
      }
      film.setze(zielZeit())
    }
    const beiEnde = () => {
      ueberspringen = true
      film.setze(BIS_ZEIT, true)
      sperre()
      clearTimeout(ruhe)
      ruhe = window.setTimeout(() => {
        ueberspringen = false
        film.setze(zielZeit())
      }, 400)
    }
    // Logo: Die Kopfzeile scrollt nach oben, das Video folgt der Scrollposition zurück an den Anfang.
    const beiAnfang = () => {
      ueberspringen = false
      film.setze(zielZeit())
    }

    // Nach Größenänderung oder Rücksprung (Neuladen, Zurück-Taste) sofort das richtige Bild.
    const sofort = () => {
      film.setze(zielZeit(), true)
      if (gesetzt) setzeEnde()
      sperre()
    }
    const beiSeite = (e: PageTransitionEvent) => {
      if (e.persisted) sofort()
    }

    window.addEventListener('scroll', beiScroll, { passive: true })
    window.addEventListener('resize', sofort)
    window.addEventListener('pageshow', beiSeite)
    window.addEventListener(ENDE, beiEnde)
    window.addEventListener(ANFANG, beiAnfang)

    return () => {
      window.removeEventListener('scroll', beiScroll)
      window.removeEventListener('resize', sofort)
      window.removeEventListener('pageshow', beiSeite)
      window.removeEventListener(ENDE, beiEnde)
      window.removeEventListener(ANFANG, beiAnfang)
      clearTimeout(ruhe)
      wurzelEl.removeAttribute('data-fahrt-sperre')
      wurzelEl.style.removeProperty('--fahrt-ende')
      gsap.killTweensOf(texte)
      texte.forEach((text) => gsap.killTweensOf(text.querySelectorAll('[data-zeile], [data-rest]')))
      ctx.revert()
      gsap.set(texte, { clearProps: 'all' })
      film.stop()
    }
  }, [reduziert])

  if (reduziert) {
    return (
      <section id="ingresso" data-kopf="hell" className="fahrt fahrt--statisch" aria-label="Rundgang durch Nonnas Haus">
        {stationen.map((s, i) => (
          <article
            key={s.id}
            className="station-statisch"
            aria-labelledby={s.zeilen.length ? `t-${s.id}` : undefined}
            aria-label={s.zeilen.length ? undefined : s.alt}
          >
            <img
              className="station-statisch-foto"
              src={s.foto}
              alt={s.alt}
              style={{ objectPosition: s.fokus }}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
            <Text s={s} erste={i === 0} />
          </article>
        ))}
      </section>
    )
  }

  return (
    <section
      id="ingresso"
      data-kopf="hell"
      ref={wurzel}
      className="fahrt"
      style={{ '--strecke': STRECKE + NACHLAUF } as CSSProperties}
      aria-label="Rundgang durch Nonnas Haus"
    >
      <div className="fahrt-rahmen" ref={rahmenRef}>
        <div className="fahrt-fotos">
          <div className="fahrt-foto">
            {/* Startbild, bis das Video geladen ist. */}
            <img
              src={stationen[0].foto}
              alt={stationen[0].alt}
              style={{ objectPosition: stationen[0].fokus }}
              decoding="async"
              fetchPriority="high"
            />
            <video ref={videoRef} className="fahrt-film" muted playsInline preload="none" aria-hidden="true" />
          </div>
        </div>
        <p className="fahrt-laden" data-bereit={ladestand.art === 'bereit'} role="status">
          {ladestand.art === 'fehler'
            ? 'Das Video konnte nicht geladen werden. Bitte die Seite neu laden.'
            : ladestand.art === 'laedt'
              ? `Kamerafahrt lädt …${ladestand.prozent === null ? '' : ` ${ladestand.prozent} %`}`
              : 'Kamerafahrt bereit'}
        </p>
        <div className="fahrt-texte">
          {stationen.map((s, i) => (
            <Text s={s} erste={i === 0} key={s.id} />
          ))}
        </div>
      </div>
    </section>
  )
}
