// Pauls Pinselschrift: Einfach eine Schriftdatei in src/assets/fonts/ legen, dann wird sie automatisch
// für Logo, Menü und Überschriften benutzt. Ohne Datei steht die Platzhalter-Schrift "Mr Dafoe" da.
const dateien = import.meta.glob('./assets/fonts/*.{woff2,woff,otf,ttf}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export function schriftLaden() {
  const url = Object.values(dateien)[0]
  if (!url) return
  new FontFace('Nonna Pinsel', `url(${url})`, { display: 'swap' })
    .load()
    .then((schrift) => document.fonts.add(schrift))
    .catch(() => {})
}
