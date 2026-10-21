// Kleine Helfer für Kasse und Reservierung. Alles bleibt im Browser, es wird nichts versendet.

export function speichern(schluessel: string, wert: unknown) {
  try {
    sessionStorage.setItem(schluessel, JSON.stringify(wert))
  } catch {
    /* egal */
  }
}

export function lesen<T>(schluessel: string): T | null {
  try {
    const s = sessionStorage.getItem(schluessel)
    return s ? (JSON.parse(s) as T) : null
  } catch {
    return null
  }
}

export const nummer = (praefix: string) => `${praefix}-${1000 + Math.floor(Math.random() * 9000)}`

export const pruefeEmail = (t: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t.trim())
export const pruefeTelefon = (t: string) => /^[+()\d\s/-]{6,}$/.test(t.trim()) && t.replace(/\D/g, '').length >= 6

export const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
export const istRuhetag = (d: Date) => d.getDay() === 1

export const tagLang = (d: Date) =>
  new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }).format(d)

export const gleicherTag = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export const hhmm = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

export type Feld = 'name' | 'telefon' | 'email'

// Fehlertext auf Deutsch, leer wenn alles passt.
export function feldFehler(f: Feld, wert: string): string {
  if (!wert.trim())
    return { name: 'Bitte gib deinen Namen an.', telefon: 'Bitte gib deine Telefonnummer an.', email: 'Bitte gib deine E-Mail an.' }[f]
  if (f === 'telefon' && !pruefeTelefon(wert)) return 'Das sieht noch nicht nach einer Telefonnummer aus.'
  if (f === 'email' && !pruefeEmail(wert)) return 'Das sieht noch nicht nach einer E-Mail-Adresse aus.'
  return ''
}
