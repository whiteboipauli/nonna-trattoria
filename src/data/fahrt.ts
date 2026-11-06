import { pfad } from '../lib/pfad'

// Stationen des Rundgangs durch Nonnas Haus. Die Kamerafahrt ist ein durchgehendes Video
// (kamerafahrt-roh/kamerafahrt.mp4), aus dem npm run video eine Vorwärts- und eine Rückwärts-Datei
// macht. Die Fotos 01 bis 09 sind Standbilder daraus: Startbild und Ansicht bei "reduzierter Bewegung".
//
// SO ARBEITET DIE FAHRT: Scrollposition = Videobild. Die Kamerafahrt steht fest im Bild (sticky), der
// Abschnitt ist STRECKE Bildschirmlängen höher als das Bild. Wie weit man darin gescrollt hat, bestimmt
// die Videozeit (VON_ZEIT bis BIS_ZEIT). Das Video wird nie abgespielt, nur geseekt, und folgt dem Ziel
// mit Höchsttempo TEMPO_MAX. Danach scrollt die Seite normal weiter, und beim Hochscrollen spult das Video von selbst zurück.
// `text: [von, bis]` (Sekunden im Video): In diesem Fenster ist der Text der Station zu sehen, immer nur
// einer. `zeit` = Sekunde des Standbilds, danach richtet sich der Bildausschnitt (`fokus`). Gleiche
// Werte wie STANDBILDER in scripts/kamerafahrt-video.mjs.

// Wie viele weitere Bildschirmlängen die Zielzeit von VON_ZEIT bis BIS_ZEIT läuft.
export const STRECKE = 4
// Videozeit (Sekunden) am Anfang und am Ende der Strecke.
export const VON_ZEIT = 1.25
export const BIS_ZEIT = 21.0
// Höchsttempo des Videos in Videosekunden pro echter Sekunde, vorwärts wie rückwärts. 1 = Normaltempo.
export const TEMPO_MAX = 1
// Je näher am Ziel, desto langsamer: Wunschtempo = Abstand (Sekunden) mal ANSATZ, höchstens TEMPO_MAX.
export const ANSATZ = 3
// Zeitkonstante (Sekunden), mit der das Tempo selbst auf- und abgebaut wird. Größer = träger.
export const BESCHLEUNIGUNG = 0.25
// Weitere Bildschirmlängen am Ende, in denen das Bild fest auf dem letzten Bild (Vino) steht, damit ein
// hinterherhinkendes Video nicht weggescrollt wird.
export const NACHLAUF = 0.5
// So lange (Sekunden) muss die Zeit im neuen Textfenster sein, bevor der Text wechselt.
export const TEXT_WARTEN = 0.15

// Signal der Kopfzeile (Logo, "Trattoria della Nonna"): Kamerafahrt direkt auf Station 1 stellen.
export const ANFANG = 'nonna:anfang'
// Signal bei Anker-Navigation (zum Beispiel "La Carta"): Die Kamerafahrt darf bewusst übersprungen werden.
export const ENDE = 'nonna:ende'

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
  // Fenster [von, bis] in Videosekunden, in dem der Text zu sehen ist.
  text?: [number, number]
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
    text: [0, 2.6],
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
    text: [4.8, 7.0],
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
    text: [10.8, 13.0],
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
    text: [14.8, 17.0],
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
    text: [20.0, Infinity],
  },
]
