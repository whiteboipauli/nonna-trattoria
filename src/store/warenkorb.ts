import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Position = {
  id: string
  name: string
  // Preis pro Stück in Euro.
  preis: number
  menge: number
  // Zweite Zeile, z. B. die Zutaten einer eigenen Pizza
  zusatz?: string
}

type Zustand = {
  positionen: Position[]
  hinzufuegen: (p: Omit<Position, 'menge'>) => void
  weniger: (id: string) => void
  entfernen: (id: string) => void
  leeren: () => void
}

// '9,5' wird 9.5, '14' wird 14. 'ab 14' ist nicht direkt bestellbar (null).
export function preisZahl(text: string): number | null {
  const t = text.trim().replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(t)) return null
  return Number(t)
}

const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
export const eur = (zahl: number) => euro.format(zahl)

export const gerichtId = (kategorie: string, name: string) => `${kategorie}:${name}`

export const summe = (positionen: Position[]) =>
  Math.round(positionen.reduce((s, p) => s + p.preis * p.menge, 0) * 100) / 100
export const anzahl = (positionen: Position[]) => positionen.reduce((s, p) => s + p.menge, 0)

export const useWarenkorb = create<Zustand>()(
  persist(
    (set) => ({
      positionen: [],
      hinzufuegen: (p) =>
        set((z) =>
          z.positionen.some((x) => x.id === p.id)
            ? { positionen: z.positionen.map((x) => (x.id === p.id ? { ...x, menge: x.menge + 1 } : x)) }
            : { positionen: [...z.positionen, { ...p, menge: 1 }] },
        ),
      weniger: (id) =>
        set((z) => ({
          positionen: z.positionen
            .map((x) => (x.id === id ? { ...x, menge: x.menge - 1 } : x))
            .filter((x) => x.menge > 0),
        })),
      entfernen: (id) => set((z) => ({ positionen: z.positionen.filter((x) => x.id !== id) })),
      leeren: () => set({ positionen: [] }),
    }),
    {
      name: 'nonna-warenkorb',
      // Zugriff auf localStorage darf scheitern (z. B. privater Modus), dann bleibt der Warenkorb im Speicher.
      storage: {
        getItem: (n) => {
          try {
            const s = localStorage.getItem(n)
            return s ? JSON.parse(s) : null
          } catch {
            return null
          }
        },
        setItem: (n, v) => {
          try {
            localStorage.setItem(n, JSON.stringify(v))
          } catch {
            /* egal */
          }
        },
        removeItem: (n) => {
          try {
            localStorage.removeItem(n)
          } catch {
            /* egal */
          }
        },
      },
    },
  ),
)
