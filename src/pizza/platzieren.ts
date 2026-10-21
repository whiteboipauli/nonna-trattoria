// Platzierung der Zutaten: reine Funktionen ohne UI, mit Seed-Zufall (dieselbe Logik kann später die Karten-Pizzen
// mit festem Seed belegen). Ruhiges Best-Candidate-Verfahren: viele Kandidaten würfeln, die ungültigen verwerfen,
// von den gültigen den nehmen, der am weitesten von allem Bisherigen entfernt liegt.
import { PLATZIERUNG as P, type ZutatConfig } from './pizzaConfig'

export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type StueckInfo = { datei: string; breite: number; hoehe: number }
export type Manifest = {
  basis: { datei: string; breite: number; hoehe: number; mitteX: number; mitteY: number; radius: number }
  zutaten: Record<string, { schatten: { blur: number; versatz: number; deckkraft: number }; stuecke: StueckInfo[] }>
}

// Alpha-Maske eines Stücks (n×n, 1 = Fleisch). Wird einmal pro Stück berechnet.
export type Maske = { n: number; a: Uint8Array }

export type Platzierung = {
  zutat: string
  stueckDatei: string
  // Mittelpunkt in 1400er-Koordinaten
  x: number
  y: number
  drehung: number // Grad
  spiegeln: boolean
  skala: number
  ebene: number
  // Größe des Bildes ohne Skalierung (aus dem Manifest)
  breite: number
  hoehe: number
}

export type Umgebung = {
  manifest: Manifest
  config: Record<string, ZutatConfig>
  masken: Map<string, Maske>
}

const GRAD = Math.PI / 180
const ZELLEN = Math.ceil(1400 / P.zelle)
const PAD = Math.ceil(P.abstand / P.zelle)

const zufallVon = (rng: Rng, [a, b]: [number, number]) => a + (b - a) * rng()

function mischen<T>(liste: T[], rng: Rng): T[] {
  const a = liste.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Zellen (Indizes im Belegungsraster), die ein Stück belegt. Pro Stück gemerkt, damit das Raster schnell wieder aufgebaut wird.
const zellenCache = new WeakMap<Platzierung, Int32Array>()

function zellenVon(maske: Maske, w: number, h: number, x: number, y: number, deg: number, spiegeln: boolean): Int32Array {
  const rad = deg * GRAD
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  const hx = (Math.abs(w * c) + Math.abs(h * s)) / 2
  const hy = (Math.abs(w * s) + Math.abs(h * c)) / 2
  const i0 = Math.max(0, Math.floor((x - hx) / P.zelle))
  const i1 = Math.min(ZELLEN - 1, Math.floor((x + hx) / P.zelle))
  const j0 = Math.max(0, Math.floor((y - hy) / P.zelle))
  const j1 = Math.min(ZELLEN - 1, Math.floor((y + hy) / P.zelle))
  const aus: number[] = []
  const n = maske.n
  for (let j = j0; j <= j1; j++) {
    const dy = (j + 0.5) * P.zelle - y
    for (let i = i0; i <= i1; i++) {
      const dx = (i + 0.5) * P.zelle - x
      let lx = dx * c + dy * s
      const ly = -dx * s + dy * c
      if (spiegeln) lx = -lx
      if (lx < -w / 2 || lx >= w / 2 || ly < -h / 2 || ly >= h / 2) continue
      const u = Math.floor((lx / w + 0.5) * n)
      const v = Math.floor((ly / h + 0.5) * n)
      if (maske.a[v * n + u]) aus.push(j * ZELLEN + i)
    }
  }
  return Int32Array.from(aus)
}

function zellenDer(p: Platzierung, masken: Map<string, Maske>): Int32Array {
  let z = zellenCache.get(p)
  if (!z) {
    const m = masken.get(p.stueckDatei)
    z = m ? zellenVon(m, p.breite * p.skala, p.hoehe * p.skala, p.x, p.y, p.drehung, p.spiegeln) : new Int32Array(0)
    zellenCache.set(p, z)
  }
  return z
}

// Aufgeweitetes Raster (Mindestabstand): jede belegte Zelle macht ihre Nachbarn im Abstand PAD ebenfalls "belegt".
function aufweiten(roh: Uint8Array): Uint8Array {
  const zwischen = new Uint8Array(roh.length)
  for (let j = 0; j < ZELLEN; j++) {
    const z = j * ZELLEN
    for (let i = 0; i < ZELLEN; i++) {
      if (!roh[z + i]) continue
      const a = Math.max(0, i - PAD)
      const b = Math.min(ZELLEN - 1, i + PAD)
      for (let k = a; k <= b; k++) zwischen[z + k] = 1
    }
  }
  const aus = new Uint8Array(roh.length)
  for (let j = 0; j < ZELLEN; j++) {
    for (let i = 0; i < ZELLEN; i++) {
      if (!zwischen[j * ZELLEN + i]) continue
      const a = Math.max(0, j - PAD)
      const b = Math.min(ZELLEN - 1, j + PAD)
      for (let k = a; k <= b; k++) aus[k * ZELLEN + i] = 1
    }
  }
  return aus
}

function aufweitenEinzeln(aus: Uint8Array, zellen: Int32Array) {
  for (const idx of zellen) {
    const i = idx % ZELLEN
    const j = (idx - i) / ZELLEN
    for (let b = Math.max(0, j - PAD); b <= Math.min(ZELLEN - 1, j + PAD); b++) {
      for (let a = Math.max(0, i - PAD); a <= Math.min(ZELLEN - 1, i + PAD); a++) aus[b * ZELLEN + a] = 1
    }
  }
}

type Kandidat = { stueck: StueckInfo; x: number; y: number; drehung: number; spiegeln: boolean; skala: number; w: number; h: number; wert: number }

// Eine Portion einer Zutat berechnen. `bestehende` sind alle Stücke, die schon auf der Pizza liegen.
export function composePortion(zutatId: string, bestehende: Platzierung[], rng: Rng, umg: Umgebung): Platzierung[] {
  const cfg = umg.config[zutatId]
  const pool = umg.manifest.zutaten[zutatId]?.stuecke.filter((s) => umg.masken.has(s.datei)) ?? []
  if (!cfg || pool.length === 0) return []

  const { mitteX, mitteY, radius } = umg.manifest.basis
  const rPlatz = radius * (cfg.ebene <= 1 ? P.rBacken : P.rFrisch)
  const anzahl = Array.isArray(cfg.stuecke) ? cfg.stuecke[0] + Math.floor(rng() * (cfg.stuecke[1] - cfg.stuecke[0] + 1)) : cfg.stuecke
  const reihenfolge = mischen(pool, rng)

  // Raster der Ebene aus den bestehenden Stücken (einmal, dann pro Versuch kopieren)
  const roh = new Uint8Array(ZELLEN * ZELLEN)
  for (const b of bestehende) if (b.ebene === cfg.ebene) for (const z of zellenDer(b, umg.masken)) roh[z] = 1
  const grundRaster = aufweiten(roh)
  const mittelpunkte = bestehende.map((b) => ({ x: b.x, y: b.y }))

  const versuch = (tolFaktor: number, maxStuecke: number): Platzierung[] => {
    const raster = grundRaster.slice()
    const punkte = mittelpunkte.slice()
    const tol = Math.min(0.9, cfg.tol * tolFaktor)
    const ergebnis: Platzierung[] = []

    for (let k = 0; k < Math.min(anzahl, maxStuecke); k++) {
      const stueck = reihenfolge[k % reihenfolge.length]
      const maske = umg.masken.get(stueck.datei)!
      const kandidaten: Kandidat[] = []

      for (let q = 0; q < P.kandidaten; q++) {
        const skala = zufallVon(rng, cfg.skala)
        const drehung = cfg.glanz ? (rng() * 2 - 1) * 30 : rng() * 360
        const spiegeln = cfg.glanz ? false : rng() < 0.5
        const w = stueck.breite * skala
        const h = stueck.hoehe * skala
        const rad = drehung * GRAD
        const bw = Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad))
        const bh = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad))
        const rp = 0.5 * Math.max(bw, bh) * 0.78
        const rMax = rPlatz - rp * 0.85
        if (rMax < 10) continue
        const r = rMax * Math.sqrt(rng())
        const phi = rng() * Math.PI * 2
        const x = mitteX + r * Math.cos(phi)
        const y = mitteY + r * Math.sin(phi)
        let wert = Infinity
        for (const m of punkte) {
          const d = Math.hypot(x - m.x, y - m.y) - rp
          if (d < wert) wert = d
        }
        if (cfg.ebene >= 2) wert *= 0.8
        kandidaten.push({ stueck, x, y, drehung, spiegeln, skala, w, h, wert })
      }

      // Bester Abstand zuerst. Der erste Kandidat, der nicht zu stark überlappt, gewinnt.
      kandidaten.sort((a, b) => b.wert - a.wert)
      for (const c of kandidaten) {
        const zellen = zellenVon(maske, c.w, c.h, c.x, c.y, c.drehung, c.spiegeln)
        if (zellen.length === 0) continue
        let belegt = 0
        for (const z of zellen) if (raster[z]) belegt++
        if (belegt / zellen.length > tol) continue
        const p: Platzierung = {
          zutat: zutatId,
          stueckDatei: stueck.datei,
          x: c.x,
          y: c.y,
          drehung: c.drehung,
          spiegeln: c.spiegeln,
          skala: c.skala,
          ebene: cfg.ebene,
          breite: stueck.breite,
          hoehe: stueck.hoehe,
        }
        zellenCache.set(p, zellen)
        aufweitenEinzeln(raster, zellen)
        punkte.push({ x: c.x, y: c.y })
        ergebnis.push(p)
        break
      }
    }
    return ergebnis
  }

  let ergebnis = versuch(1, anzahl)
  if (ergebnis.length < Math.ceil(anzahl / 2)) {
    const nochmal = versuch(2, anzahl)
    if (nochmal.length > ergebnis.length) ergebnis = nochmal
  }
  // Mindestens ein Stück pro Klick, solange die Pizza nicht wirklich voll ist
  if (ergebnis.length === 0) ergebnis = versuch(4, 1)
  if (ergebnis.length === 0) ergebnis = versuch(8, 1)
  return ergebnis
}
