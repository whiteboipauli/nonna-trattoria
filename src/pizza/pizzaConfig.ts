// Alle Werte für den Pizza-Konfigurator an einer Stelle: Preise, Mengen, Größen, Fall-Gefühl.
// Pfade und Pixelgrößen der Bilder stehen im Manifest public/pizza/zutaten.json.

export type Gruppe = 'Käse' | 'Fleisch' | 'Gemüse' | 'Frisch'

export type ZutatConfig = {
  id: string
  name: string
  gruppe: Gruppe
  // 0 Käse, 1 gebackene Zutaten, 2 Öl, Prosciutto, Parmesan, 3 frische Kräuter (immer obenauf)
  ebene: 0 | 1 | 2 | 3
  // Größe eines Stücks als Faktor der Bildgröße (zufällig von bis)
  skala: [number, number]
  // Wie viel Überlappung innerhalb der Ebene erlaubt ist (0 = gar keine, 0.4 = viel)
  tol: number
  // Glänzende Zutaten werden nur leicht (±30°) gedreht und nicht gespiegelt
  glanz: boolean
  // Stücke pro Klick: eine Zahl oder von–bis
  stuecke: number | [number, number]
  // Aufpreis in Euro
  preis: number
  // Knoblauchöl wirft keinen Schatten
  schatten: boolean
}

export const PREIS_BASIS = 14
export const GRUPPEN: Gruppe[] = ['Käse', 'Fleisch', 'Gemüse', 'Frisch']

export const ZUTATEN: ZutatConfig[] = [
  { id: 'fior-di-latte', name: 'Fior di Latte', gruppe: 'Käse', ebene: 0, skala: [0.7, 0.9], tol: 0.06, glanz: false, stuecke: [5, 6], preis: 2, schatten: true },
  { id: 'buffelmozzarella', name: 'Büffelmozzarella', gruppe: 'Käse', ebene: 0, skala: [0.6, 0.76], tol: 0.18, glanz: false, stuecke: 4, preis: 2, schatten: true },
  { id: 'gorgonzola', name: 'Gorgonzola', gruppe: 'Käse', ebene: 0, skala: [0.6, 0.8], tol: 0.28, glanz: false, stuecke: 4, preis: 2, schatten: true },
  { id: 'parmesan', name: 'Parmesan', gruppe: 'Käse', ebene: 2, skala: [0.52, 0.64], tol: 0.1, glanz: false, stuecke: 5, preis: 2.5, schatten: true },
  { id: 'salami', name: 'Salami', gruppe: 'Fleisch', ebene: 1, skala: [0.8, 0.92], tol: 0.03, glanz: true, stuecke: 7, preis: 3, schatten: true },
  { id: 'prosciutto', name: 'Prosciutto', gruppe: 'Fleisch', ebene: 2, skala: [0.8, 0.95], tol: 0.14, glanz: false, stuecke: 3, preis: 3, schatten: true },
  { id: 'champignons', name: 'Champignons', gruppe: 'Gemüse', ebene: 1, skala: [0.62, 0.78], tol: 0.05, glanz: false, stuecke: 6, preis: 1.5, schatten: true },
  { id: 'zwiebeln', name: 'Rote Zwiebeln', gruppe: 'Gemüse', ebene: 1, skala: [0.58, 0.74], tol: 0.1, glanz: false, stuecke: 5, preis: 1.5, schatten: true },
  { id: 'oliven', name: 'Oliven', gruppe: 'Gemüse', ebene: 1, skala: [0.48, 0.58], tol: 0.02, glanz: true, stuecke: 6, preis: 1.5, schatten: true },
  { id: 'kirschtomaten', name: 'Kirschtomaten', gruppe: 'Gemüse', ebene: 1, skala: [0.52, 0.62], tol: 0.03, glanz: true, stuecke: 4, preis: 1.5, schatten: true },
  { id: 'peperoncino', name: 'Peperoncino', gruppe: 'Gemüse', ebene: 1, skala: [0.42, 0.56], tol: 0.1, glanz: true, stuecke: 4, preis: 1.5, schatten: true },
  { id: 'basilikum', name: 'Basilikum', gruppe: 'Frisch', ebene: 3, skala: [0.58, 0.72], tol: 0.18, glanz: false, stuecke: 3, preis: 1.5, schatten: true },
  { id: 'rucola', name: 'Rucola', gruppe: 'Frisch', ebene: 3, skala: [0.58, 0.72], tol: 0.22, glanz: false, stuecke: 4, preis: 1.5, schatten: true },
  { id: 'knoblauch-oel', name: 'Knoblauchöl', gruppe: 'Frisch', ebene: 2, skala: [0.42, 0.62], tol: 0.4, glanz: true, stuecke: 3, preis: 1.5, schatten: false },
]

// Fall-Animation. Alles in Pixeln der 1400er-Bühne bzw. Sekunden. Hier nachjustieren, wenn das Referenzvideo da ist.
export const FALL = {
  // Abstand zwischen zwei Stücken einer Portion (Millisekunden, zufällig von–bis)
  versatzMs: [60, 110] as [number, number],
  // Startlage über der Zielposition
  hoehe: [90, 140] as [number, number],
  startSkala: 1.18,
  startDrehung: 8, // ± Grad
  // Fall (beschleunigt) in Sekunden
  dauer: 0.38,
  // Nachfedern: tiefer (px) mit Stauchung, dann zurück (px), dann ruhig
  tiefer: 6,
  stauchung: 0.97,
  zurueck: 3,
  nachfedern: 0.3, // Sekunden für beide Bewegungen zusammen
  // Zutat wieder runternehmen
  raus: 0.25,
  rausSkala: 0.88,
}

// Platzierung (Best-Candidate-Verfahren), Maße im 1400er-System
export const PLATZIERUNG = {
  kandidaten: 60,
  zelle: 6, // Größe einer Zelle im Belegungsraster
  abstand: 19, // Mindestabstand zwischen Stücken einer Ebene
  alphaSchwelle: 0.43,
  rBacken: 0.78, // Ebene 0 und 1: Anteil des Pizza-Radius
  rFrisch: 0.8, // Ebene 2 und 3
  maskenGroesse: 64,
}

// Schatten: Manifest-Werte gelten für eine 1024er-Pizza, die Bühne ist 1400 breit.
export const SCHATTEN = { faktor: 1.37, versatzX: 1.2, versatzY: 2.0, farbe: '28, 6, 0' }
export const BASIS_SCHATTEN = 'drop-shadow(8px 16px 38px rgba(40, 25, 10, 0.28))'

// Dampf über der Pizza
export const DAMPF = { normal: 0.14, nachLandung: 0.22, nachLandungMs: 1200 }
