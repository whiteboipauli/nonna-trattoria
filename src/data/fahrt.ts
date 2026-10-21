import { pfad } from '../lib/pfad'

// Stationen des Rundgangs durch Nonnas Haus. Die Kamerafahrt ist ein durchgehendes Video
// (kamerafahrt-roh/kamerafahrt.mp4), aus dem npm run video eine Vorwärts- und eine Rückwärts-Datei
// macht. Die Fotos 01 bis 09 sind Standbilder daraus: Startbild und Ansicht bei "reduzierter Bewegung".
//
// SO ARBEITET DIE FAHRT: Die Seite scrollt nicht, solange die Kamerafahrt im Bild ist. Eine Scroll-
// Geste löst den Flug zum nächsten (oder vorigen) Haltepunkt aus, das Video läuft dann von selbst.
// Gehalten wird nur bei Stationen mit `halt`, alle anderen werden ohne Halt durchflogen.
// `ruhe: [ankunft, haltepunkt]` (Sekunden im Video, auf dem Bildraster): bei der Ankunft schreibt sich
// der Text, am Haltepunkt bleibt das Bild stehen. Die Haltepunkte stehen auch in HALTE in
// scripts/kamerafahrt-video.mjs (dort liegen Keyframes), beide Stellen müssen zusammenpassen.
// `zeit` = Sekunde des Standbilds, danach richtet sich der Bildausschnitt (`fokus`). Gleiche Werte
// wie STANDBILDER in scripts/kamerafahrt-video.mjs.

// Mindestausschlag von Mausrad oder Trackpad (Pixel), ab dem eine Geste zählt.
export const SCHWELLE = 24
// Mindestweg beim Wischen am Touchscreen (Pixel).
export const SCHWELLE_WISCHEN = 40
// Ausschläge unter diesem Wert (Pixel) gelten als Ruhe, zum Beispiel das Auslaufen eines Trackpads.
export const RAUSCHEN = 4
// So lange muss die Eingabe ruhen (Sekunden), bevor eine neue Geste zählt.
export const PAUSE = 0.15
// Nach der Ankunft am Haltepunkt zählt frühestens so spät (Sekunden) die nächste Geste.
export const SPERRE = 0.25
// Tempo der Flüge, 1 = Originalgeschwindigkeit. Ein Tempo ungleich 1 oder ein Tempowechsel mitten im
// Flug lässt den Browser Bilder auslassen und ruckeln, deshalb läuft die Fahrt immer mit 1.
export const TEMPO = 1
// Höchstens so lange (Sekunden) wartet ein Flug, bis das andere Video am richtigen Bild steht.
export const PARTNER_WARTEN = 0.3

// Signal der Kopfzeile (Logo, "Trattoria della Nonna"): Kamerafahrt direkt auf Station 1 stellen.
export const ANFANG = 'nonna:anfang'

export type Station = {
  id: string
  // Wo der Text steht: u = unten, o = oben, m = Mitte, l = links, r = rechts.
  platz: 'ul' | 'ur' | 'ol' | 'or' | 'ml' | 'mr'
  // Große Schrift, Zeile für Zeile.
  zeilen: string[]
  // Ganzer Satz, wenn die Zeilen ein Satz sind (Startseite), sonst nur der Titel.
  istSatz?: boolean
  satz?: string
  gerichte?: string[]
  mono?: string
  foto: string
  alt: string
  fokus: string
  // Sekunde des Standbilds im Video.
  zeit: number
  // Haltepunkt: Hier bleibt das Video stehen.
  halt?: true
  // Nur mit Halt: [ankunft, haltepunkt] in Sekunden.
  ruhe?: [number, number]
}

export const stationen: Station[] = [
  {
    id: 'tisch',
    platz: 'ul',
    zeilen: [],
    foto: pfad('/kamerafahrt/01.jpg'),
    alt: 'Mosaikboden am Eingang mit dem Schriftzug Trattoria Nonna',
    fokus: '50% 50%',
    zeit: 0.6,
    halt: true,
    ruhe: [1.25, 1.25],
  },
  {
    id: 'saal',
    platz: 'ul',
    zeilen: [],
    foto: pfad('/kamerafahrt/02.jpg'),
    alt: 'Gastraum mit blau-weißem Schachbrettboden und Blick in die Küche',
    fokus: '50% 50%',
    zeit: 3.35,
  },
  {
    id: 'antipasti',
    platz: 'ul',
    zeilen: ['Antipasti'],
    satz: 'Kleine Vorspeisen zum Teilen, jeden Tag frisch.',
    foto: pfad('/kamerafahrt/03.jpg'),
    alt: 'Gegrillter Oktopus auf einer Edelstahlplatte, Olivenöl wird darübergegossen',
    fokus: '50% 50%',
    zeit: 6.0,
    halt: true,
    ruhe: [5.25, 6.75],
  },
  {
    id: 'teig',
    platz: 'ul',
    zeilen: [],
    foto: pfad('/kamerafahrt/04.jpg'),
    alt: 'Hände pressen Pizzateig',
    fokus: '50% 50%',
    zeit: 8.4,
  },
  {
    id: 'pizza',
    platz: 'ul',
    zeilen: [],
    foto: pfad('/kamerafahrt/05.jpg'),
    alt: 'Pizza wird in den Holzofen geschoben',
    fokus: '45% 50%',
    zeit: 9.9,
  },
  {
    id: 'pizza-raus',
    platz: 'ul',
    zeilen: ['Pizze'],
    satz: 'Frische Pizza aus dem Holzofen.',
    foto: pfad('/kamerafahrt/06.jpg'),
    alt: 'Gebackene Pizza auf dem Holzschieber mit Dampf',
    fokus: '50% 50%',
    zeit: 12.0,
    halt: true,
    ruhe: [11.5, 12.25],
  },
  {
    id: 'pasta',
    platz: 'ul',
    zeilen: [],
    foto: pfad('/kamerafahrt/07.jpg'),
    alt: 'Koch schwenkt eine Pfanne mit Langustinen über der Flamme',
    fokus: '62% 50%',
    zeit: 14.1,
  },
  {
    id: 'pass',
    platz: 'ul',
    zeilen: ['Pasta Fresca'],
    satz: 'Täglich frisch von Hand gemacht.',
    foto: pfad('/kamerafahrt/08.jpg'),
    alt: 'Spaghetti mit Langustinen am Pass unter der Kupferlampe',
    fokus: '50% 50%',
    zeit: 16.1,
    halt: true,
    ruhe: [15.25, 16.5],
  },
  {
    id: 'vini',
    platz: 'ul',
    zeilen: ['Vino'],
    satz: 'Ausgesuchte Weine aus ganz Italien.',
    foto: pfad('/kamerafahrt/09.jpg'),
    alt: 'Kellner schenkt am Fenstertisch Rotwein neben dem Pastateller ein',
    fokus: '50% 55%',
    zeit: 20.5,
    halt: true,
    ruhe: [20.0, 21.0],
  },
]
