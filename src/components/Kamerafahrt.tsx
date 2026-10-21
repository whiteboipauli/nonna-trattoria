import { Fragment, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { gsap } from 'gsap'
import {
  ANFANG,
  PARTNER_WARTEN,
  PAUSE,
  RAUSCHEN,
  SCHWELLE,
  SCHWELLE_WISCHEN,
  SPERRE,
  TEMPO,
  stationen,
  type Station,
} from '../data/fahrt'
import video from '../data/fahrt-video.json'
import { spiegeln } from '../lib/spiegeln'
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
          style={s.istSatz ? undefined : ({ '--zl': Math.max(...s.zeilen.map((z) => z.length)) } as CSSProperties)}
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
const spiegel = (t: number) => spiegeln(t, N, FPS)
// Anfang des Bildes, das zur Zeit t zu sehen ist.
const bildAnfang = (t: number) => Math.min(Math.max(Math.floor(t * FPS + 1e-6), 0), N - 1) / FPS

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

// Spielt die Kamerafahrt mit zwei Videos ab: eines vorwärts, eines rückwärts. Sichtbar ist immer nur
// eines, das andere wartet nach jeder Ankunft schon auf dem gespiegelten Bild, damit ein
// Richtungswechsel ohne Ruckeln startet.
// Ladezustand des Vorwärtsvideos für die Anzeige. `prozent` ist null, wenn die Größe unbekannt ist.
type Ladestand = { art: 'laedt'; prozent: number | null } | { art: 'bereit' } | { art: 'fehler' }

function starteFilm(
  vor: HTMLVideoElement,
  rueck: HTMLVideoElement,
  startZeit: number,
  melde: (stand: Ladestand) => void,
) {
  const abbruch = new AbortController()
  const urls: string[] = []
  let aus = false
  let vorBereit = false
  let rueckGeladen = false
  let rueckBereit = false
  let fliegt = false
  let flugNr = 0
  let sichtbar = vor
  let partner: Promise<void> = Promise.resolve()
  let rvfc = 0
  let raf = 0

  // Zeit im Vorwärts-Zeitstrahl, egal welches Video gerade läuft.
  const zeitAus = (v: HTMLVideoElement, t: number) => (v === vor ? t : spiegel(t))
  const zeit = () => zeitAus(sichtbar, sichtbar.currentTime)

  const ausschnitt = (t: number) => {
    const [fx, fy] = fokusBei(t)
    const pos = `${(fx * 100).toFixed(2)}% ${(fy * 100).toFixed(2)}%`
    vor.style.objectPosition = pos
    rueck.style.objectPosition = pos
  }

  const zeige = (v: HTMLVideoElement) => {
    sichtbar = v
    v.style.opacity = '1'
    ;(v === vor ? rueck : vor).style.opacity = '0'
  }

  // Das unsichtbare Video auf das gespiegelte Bild der aktuellen Zeit setzen.
  const abgleichen = () => {
    const andere = sichtbar === vor ? rueck : vor
    if (andere === rueck && !rueckGeladen) return
    partner = suche(andere, spiegel(sichtbar.currentTime) + VERSATZ)
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

  const stoppeSchleife = (v: HTMLVideoElement) => {
    if (rvfc && 'cancelVideoFrameCallback' in v) v.cancelVideoFrameCallback(rvfc)
    cancelAnimationFrame(raf)
    rvfc = 0
    raf = 0
  }

  // Erst vorwärts laden, das Startbild hält so lange. Dann rückwärts im Hintergrund.
  ;(async () => {
    vor.muted = true
    rueck.muted = true
    await nochmal(() => laden(vor, pfad('/kamerafahrt/fahrt.mp4'), (prozent) => melde({ art: 'laedt', prozent })))
    if (aus) return
    await suche(vor, startZeit)
    ausschnitt(startZeit)
    zeige(vor)
    vorBereit = true
    melde({ art: 'bereit' })
    // Die Rückwärts-Datei lädt still im Hintergrund, bis dahin geht es nur vorwärts.
    await nochmal(() => laden(rueck, pfad('/kamerafahrt/fahrt-rueck.mp4')))
    if (aus) return
    rueckGeladen = true
    if (!fliegt) abgleichen()
    await partner
    rueckBereit = true
  })().catch((fehler) => {
    if (aus) return
    // Ohne Video bleibt das Startbild stehen, die Ursache steht in der Konsole.
    console.error('Kamerafahrt: Video konnte nicht geladen werden.', fehler)
    if (!vorBereit) melde({ art: 'fehler' })
  })

  return {
    get vorBereit() {
      return vorBereit
    },
    get rueckBereit() {
      return rueckBereit
    },
    zeit,

    // Fliegt mit gleichbleibendem Tempo zur Vorwärts-Zeit ziel. `unterwegs` bekommt bei jedem Bild die
    // Vorwärts-Zeit, `angekommen` meldet den Halt.
    async fliege(ziel: number, unterwegs: (t: number) => void, angekommen: () => void) {
      const nr = ++flugNr
      const vorwaerts = ziel > zeit()
      const v = vorwaerts ? vor : rueck
      const zielMedia = vorwaerts ? bildAnfang(ziel) : spiegel(ziel)
      fliegt = true
      if (v !== sichtbar) {
        // Das andere Video sollte schon am gespiegelten Bild stehen, höchstens kurz darauf warten.
        await Promise.race([partner, warte(PARTNER_WARTEN * 1000)])
        if (aus || nr !== flugNr) return
        zeige(v)
      }
      // Das Tempo steht vor dem Start fest und ändert sich im Flug nie, sonst ruckelt es.
      v.playbackRate = TEMPO

      const ende = () => {
        stoppeSchleife(v)
        v.removeEventListener('ended', ende)
        v.pause()
        fliegt = false
        // Nach dem Anhalten nicht neu positionieren, damit das Bild nicht springt.
        const t = zeit()
        ausschnitt(t)
        unterwegs(t)
        abgleichen()
        angekommen()
      }

      // Angehalten wird beim ersten angezeigten Bild, das höchstens ein halbes Bild vor dem Haltepunkt liegt.
      const schritt = (media?: number) => {
        if (aus || nr !== flugNr) return
        const m = media ?? v.currentTime
        if (m >= zielMedia - 0.5 / FPS || v.ended) return ende()
        const t = zeitAus(v, m)
        ausschnitt(t)
        unterwegs(t)
        plane()
      }

      // Bildgenau mit requestVideoFrameCallback, sonst mit requestAnimationFrame.
      const plane = () => {
        if ('requestVideoFrameCallback' in v) rvfc = v.requestVideoFrameCallback((_, meta) => schritt(meta.mediaTime))
        else raf = requestAnimationFrame(() => schritt())
      }

      v.addEventListener('ended', ende)
      await v.play().catch(() => undefined)
      if (aus || nr !== flugNr) return
      plane()
    },

    // Ohne Flug direkt auf die Vorwärts-Zeit t stellen (Logo-Klick).
    springe(t: number) {
      flugNr++
      fliegt = false
      stoppeSchleife(vor)
      stoppeSchleife(rueck)
      vor.pause()
      rueck.pause()
      if (!vorBereit) return
      zeige(vor)
      ausschnitt(t)
      partner = suche(vor, t).then(() => {
        if (rueckGeladen) return suche(rueck, spiegel(t) + VERSATZ)
      })
    },

    stop() {
      aus = true
      flugNr++
      abbruch.abort()
      stoppeSchleife(vor)
      stoppeSchleife(rueck)
      for (const v of [vor, rueck]) {
        v.pause()
        v.removeAttribute('src')
        v.load()
      }
      urls.forEach((u) => URL.revokeObjectURL(u))
    },
  }
}

const jetzt = () => performance.now() / 1000
// Liegt gerade ein Dialog (Pizza, Weinkarte, Warenkorb) über der Seite? Dann nichts abfangen.
const dialogOffen = (ziel: EventTarget | null) =>
  document.body.style.overflow === 'hidden' ||
  (ziel instanceof Element && !!ziel.closest('[role="dialog"], [aria-modal="true"]'))

// Rundgang durch Nonnas Haus als durchgehende Kamerafahrt. Solange sie ganz im Bild ist, scrollt die
// Seite nicht: Eine Geste löst den Flug zum nächsten oder vorigen Haltepunkt aus, das Video läuft dann
// von selbst. Der Text jeder Haltestation schreibt sich beim Ankommen wie mit dem Pinsel.
// Nach dem letzten Haltepunkt gibt die nächste Geste die Seite frei, sie scrollt weich zur Karte.
// Mit "reduzierte Bewegung" stehen die Stationen als Standbilder untereinander.
export default function Kamerafahrt() {
  const wurzel = useRef<HTMLElement>(null)
  const vorRef = useRef<HTMLVideoElement>(null)
  const rueckRef = useRef<HTMLVideoElement>(null)
  const [reduziert] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [ladestand, setLadestand] = useState<Ladestand>({ art: 'laedt', prozent: null })

  useLayoutEffect(() => {
    if (reduziert || !wurzel.current || !vorRef.current || !rueckRef.current) return
    const abschnitt = wurzel.current
    // Nur die Stationen mit Halt, als Nummern in `stationen`.
    const halte = stationen.flatMap((s, i) => (s.halt && s.ruhe ? [i] : []))
    const ruhe = (h: number) => stationen[halte[h]].ruhe ?? [0, 0]
    const film = starteFilm(vorRef.current, rueckRef.current, ruhe(0)[1], setLadestand)
    const texte = gsap.utils.toArray<HTMLElement>('.fahrt-text', abschnitt)

    // Aktueller Haltepunkt (Nummer in `halte`).
    let halt = 0
    let angekommen = true
    let ankunftZeit = -Infinity
    let flugNr = 0
    let sichtbar: number | null = 0
    let aktiv = false
    // Nach der letzten Station: frei, bis die Kamerafahrt das Bild einmal verlassen hat.
    let freigegeben = false

    // Texte ab der zweiten Station warten verborgen. Die erste behält ihre CSS-Intro-Animation.
    const ctx = gsap.context(() => {
      texte.forEach((text, i) => {
        if (i === 0) return
        gsap.set(text.querySelectorAll('[data-zeile]'), { clipPath: VERBORGEN })
        gsap.set(text.querySelectorAll('[data-rest]'), { autoAlpha: 0, y: 14 })
      })
    }, abschnitt)

    const zeigeText = (i: number) => {
      sichtbar = i
      const text = texte[i]
      gsap.killTweensOf(text)
      if (i === 0) {
        gsap.to(text, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' })
        return
      }
      gsap.set(text, { autoAlpha: 1, y: 0 })
      gsap.fromTo(
        text.querySelectorAll('[data-zeile]'),
        { clipPath: VERBORGEN },
        { clipPath: SICHTBAR, duration: 0.7, stagger: 0.18, ease: 'power2.out' },
      )
      gsap.fromTo(
        text.querySelectorAll('[data-rest]'),
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.12, delay: 0.35, ease: 'power2.out' },
      )
    }

    // Beim Abflug geht der Text leise nach oben weg.
    const versteckeText = () => {
      if (sichtbar === null) return
      gsap.killTweensOf(texte[sichtbar])
      gsap.to(texte[sichtbar], { autoAlpha: 0, y: -18, duration: 0.35, ease: 'power2.in' })
      sichtbar = null
    }

    const fliegeZu = (ziel: number) => {
      const nr = ++flugNr
      const vorwaerts = ziel > halt
      const [ankunftVor, zielZeit] = ruhe(ziel)
      // Vorwärts schreibt sich der Text bei der Ankunft, rückwärts erst am Haltepunkt.
      const ankunft = vorwaerts ? ankunftVor : zielZeit
      let textDa = false
      const textZeigen = () => {
        if (textDa || nr !== flugNr) return
        textDa = true
        zeigeText(halte[ziel])
      }
      versteckeText()
      halt = ziel
      angekommen = false
      film.fliege(
        zielZeit,
        (t) => {
          if (vorwaerts && t >= ankunft) textZeigen()
        },
        () => {
          if (nr !== flugNr) return
          textZeigen()
          angekommen = true
          ankunftZeit = jetzt()
        },
      )
    }

    const freigeben = () => {
      freigegeben = true
      aktiv = false
      document.getElementById('carta')?.scrollIntoView({ behavior: 'smooth' })
    }

    // Eine Geste: ein Haltepunkt vor (1) oder zurück (-1). Während eines Flugs zählt nichts.
    // Bis das Vorwärtsvideo geladen ist, geht gar nichts, bis das Rückwärtsvideo da ist, nur vorwärts.
    const geste = (r: 1 | -1) => {
      if (!film.vorBereit || !angekommen || jetzt() - ankunftZeit < SPERRE) return
      if (r > 0) {
        if (halt < halte.length - 1) fliegeZu(halt + 1)
        else freigeben()
      } else if (halt > 0 && film.rueckBereit) {
        fliegeZu(halt - 1)
      }
    }

    // Aktiv, solange die Kamerafahrt genau im Bild steht.
    const pruefeAktiv = () => {
      const oben = abschnitt.getBoundingClientRect().top
      if (freigegeben && oben < -4) freigegeben = false
      aktiv = !freigegeben && Math.abs(oben) <= 2
    }

    // Mausrad und Trackpad: Eine Geste zählt erst nach einer kurzen Ruhe, so löst der Nachlauf
    // eines Trackpads keine zweite Station aus.
    let letzteEingabe = -Infinity
    let summe = 0
    let neueGeste = false
    const rad = (e: WheelEvent) => {
      if (e.ctrlKey || dialogOffen(e.target)) return
      pruefeAktiv()
      const d = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1)
      if (!aktiv) {
        // Scrollt die Seite gerade normal, zählt der Rest dieser Bewegung nicht als neue Geste.
        if (Math.abs(d) >= RAUSCHEN) letzteEingabe = jetzt()
        neueGeste = false
        return
      }
      e.preventDefault()
      if (Math.abs(d) < RAUSCHEN) return
      const t = jetzt()
      if (t - letzteEingabe >= PAUSE) {
        neueGeste = true
        summe = 0
      }
      letzteEingabe = t
      if (!neueGeste) return
      summe += d
      if (Math.abs(summe) >= SCHWELLE) {
        neueGeste = false
        geste(summe > 0 ? 1 : -1)
      }
    }

    // Wischen am Touchscreen.
    let wischStart: number | null = null
    const beruehrt = (e: TouchEvent) => {
      pruefeAktiv()
      wischStart = e.touches.length === 1 && !dialogOffen(e.target) ? e.touches[0].clientY : null
    }
    const wischt = (e: TouchEvent) => {
      if (!aktiv || wischStart === null) return
      e.preventDefault()
      const dy = wischStart - e.touches[0].clientY
      if (Math.abs(dy) < SCHWELLE_WISCHEN) return
      wischStart = null
      geste(dy > 0 ? 1 : -1)
    }

    // Tastatur: Pfeile, Bild auf und ab, Leertaste. Tab und Eingaben in Feldern bleiben unberührt.
    const taste = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || dialogOffen(e.target)) return
      const ziel = e.target instanceof Element ? e.target : null
      if (ziel?.closest('input, textarea, select, [contenteditable="true"]')) return
      // Leertaste auf einem Link oder Knopf löst diesen aus.
      if (e.key === ' ' && ziel?.closest('a, button, summary, [role="button"]')) return
      let r: 0 | 1 | -1 = 0
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) r = 1
      else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) r = -1
      if (!r) return
      pruefeAktiv()
      if (!aktiv) return
      e.preventDefault()
      if (!e.repeat) geste(r)
    }

    // Logo oder "Trattoria della Nonna": direkt zurück auf den Anfang, ohne langen Rückflug.
    const anfang = () => {
      flugNr++
      halt = 0
      angekommen = true
      ankunftZeit = -Infinity
      freigegeben = false
      film.springe(ruhe(0)[1])
      texte.forEach((text, i) => {
        gsap.killTweensOf(text)
        if (i > 0) gsap.set(text, { autoAlpha: 0 })
      })
      gsap.set(texte[0], { autoAlpha: 1, y: 0 })
      sichtbar = 0
    }

    pruefeAktiv()
    window.addEventListener('wheel', rad, { passive: false })
    window.addEventListener('touchstart', beruehrt, { passive: true })
    window.addEventListener('touchmove', wischt, { passive: false })
    window.addEventListener('keydown', taste)
    window.addEventListener('scroll', pruefeAktiv, { passive: true })
    window.addEventListener(ANFANG, anfang)

    return () => {
      window.removeEventListener('wheel', rad)
      window.removeEventListener('touchstart', beruehrt)
      window.removeEventListener('touchmove', wischt)
      window.removeEventListener('keydown', taste)
      window.removeEventListener('scroll', pruefeAktiv)
      window.removeEventListener(ANFANG, anfang)
      flugNr++
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
          <article key={s.id} className="station-statisch" aria-labelledby={s.zeilen.length ? `t-${s.id}` : undefined}
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
    <section id="ingresso" data-kopf="hell" ref={wurzel} className="fahrt" aria-label="Rundgang durch Nonnas Haus">
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
          <video ref={vorRef} className="fahrt-film" muted playsInline preload="none" aria-hidden="true" />
          <video ref={rueckRef} className="fahrt-film" muted playsInline preload="none" aria-hidden="true" />
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
    </section>
  )
}
