// Bilder erst laden, wenn sie gebraucht werden. Pro Stück einmalig eine kleine Alpha-Maske berechnen.
import { PLATZIERUNG as P } from './pizzaConfig'
import type { Manifest, Maske } from './platzieren'
import { pfad } from '../lib/pfad'

export const PIZZA_URL = pfad('/pizza/')

let manifestPromise: Promise<Manifest> | null = null
export function ladeManifest(): Promise<Manifest> {
  manifestPromise ??= fetch(`${PIZZA_URL}zutaten.json`).then((r) => {
    if (!r.ok) throw new Error('Manifest nicht gefunden')
    return r.json() as Promise<Manifest>
  })
  manifestPromise.catch(() => (manifestPromise = null))
  return manifestPromise
}

// Geladene Bilder festhalten, damit der Browser sie nicht wieder aus dem Speicher wirft.
const bilder = new Map<string, HTMLImageElement>()
const masken = new Map<string, Maske>()
const laufend = new Map<string, Promise<void>>()

export const maskenKarte = masken

async function ladeStueck(datei: string): Promise<void> {
  const img = new Image()
  img.src = PIZZA_URL + datei
  await img.decode()
  bilder.set(datei, img)
  const n = P.maskenGroesse
  const canvas = document.createElement('canvas')
  canvas.width = n
  canvas.height = n
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, n, n)
  const daten = ctx.getImageData(0, 0, n, n).data
  const a = new Uint8Array(n * n)
  for (let i = 0; i < n * n; i++) a[i] = daten[i * 4 + 3] > P.alphaSchwelle * 255 ? 1 : 0
  masken.set(datei, { n, a })
}

// Alle Stücke einer Zutat laden (einmalig). Mehrfache Aufrufe teilen sich dieselbe Arbeit.
export function ladeZutat(id: string, manifest: Manifest): Promise<void> {
  const stuecke = manifest.zutaten[id]?.stuecke ?? []
  let p = laufend.get(id)
  if (!p) {
    p = Promise.all(stuecke.map((s) => ladeStueck(s.datei))).then(() => undefined)
    p.catch(() => laufend.delete(id))
    laufend.set(id, p)
  }
  return p
}
