// Bild k der Vorwärts-Datei (Startzeit k/fps) ist Bild N-1-k der Rückwärts-Datei. Die Funktion rechnet
// eine Zeit in die jeweils andere Datei um, in beide Richtungen gleich. Zwischenzeiten zählen zum Bild,
// das gerade zu sehen ist, Ergebnis ist immer die Startzeit des gespiegelten Bildes.
export function spiegeln(t: number, bilder: number, fps: number) {
  const k = Math.min(Math.max(Math.floor(t * fps + 1e-6), 0), bilder - 1)
  return (bilder - 1 - k) / fps
}
