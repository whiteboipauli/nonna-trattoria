// Macht aus dem Rohvideo die beiden Videos der Kamerafahrt (vorwärts und rückwärts) und die Standbilder.
// Aufruf: npm run video (liest kamerafahrt-roh/kamerafahrt.mp4)
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import ffmpegStatic from 'ffmpeg-static'

const QUELLE = 'kamerafahrt-roh/kamerafahrt.mp4'
const ZIEL = 'public/kamerafahrt'
const VOR = join(ZIEL, 'fahrt.mp4')
const RUECK = join(ZIEL, 'fahrt-rueck.mp4')

// Standbilder je Station (Sekunden im Video), gleiche Werte wie `zeit` in src/data/fahrt.ts.
const STANDBILDER = [0.6, 3.35, 6.0, 8.4, 9.9, 12.0, 14.1, 16.1, 20.5]

if (!existsSync(QUELLE)) {
  console.error(`Video fehlt: ${QUELLE}`)
  process.exit(1)
}

const ffmpeg = (() => {
  try {
    return execFileSync('which', ['ffmpeg']).toString().trim()
  } catch {
    return ffmpegStatic
  }
})()
const lauf = (args) => execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })

// Haltepunkte [ankunft, haltepunkt] in Sekunden. MUSS zu `ruhe` in src/data/fahrt.ts passen:
// An den Haltepunkten liegen erzwungene Keyframes, damit die stehenden Bilder volle Qualität haben.
const HALTE = [
  [1.25, 1.25], // tisch
  [5.25, 6.75], // antipasti
  [11.5, 12.25], // pizza-raus
  [15.25, 16.5], // pass
  [20.0, 21.0], // vini (letztes Bild)
]
// Größte erlaubte Dateigröße. Ist eine Datei größer, wird mit dem nächsten CRF neu kodiert.
const MAX_MB = 40
const CRF_STUFEN = [17, 18, 19, 20, 21]

// Zeit des letzten Bildes im Rohvideo, daran werden die Haltepunkte für die Rückwärts-Datei gespiegelt.
const zaehlen = (datei) => {
  const info = spawnSync(ffmpeg, ['-hide_banner', '-i', datei, '-map', '0:v', '-c', 'copy', '-f', 'null', '-']).stderr.toString()
  return {
    bilder: Number([...info.matchAll(/frame=\s*(\d+)/g)].at(-1)?.[1]),
    fps: Number(info.match(/([\d.]+) fps/)?.[1]),
  }
}
const roh = zaehlen(QUELLE)
const letztes = (roh.bilder - 1) / roh.fps
const keyVor = HALTE.map(([, h]) => h)
const keyRueck = keyVor.map((h) => Math.max(0, Math.round((letztes - h) * 1000) / 1000))

// H.264 fast verlustfrei in der Originalauflösung (nichts skaliert) mit erhaltenem Filmkorn, ohne Ton.
// Keyframe alle 12 Bilder, damit Springen und Anhalten genau klappen, dazu Keyframes an den Haltepunkten.
// Keine Farbmarkierung: absichtlich wie die Quelle, damit die Farben genauso wirken wie im Original.
const kodierung = (crf, keyframes) => [
  '-an',
  '-c:v', 'libx264',
  '-profile:v', 'high',
  '-pix_fmt', 'yuv420p',
  '-preset', 'slow',
  '-tune', 'grain',
  '-crf', String(crf),
  '-g', '12',
  '-force_key_frames', keyframes.join(','),
  '-movflags', '+faststart',
]

const groesse = (datei) => statSync(datei).size / 1024 / 1024
// Kodiert mit der ersten CRF-Stufe, die unter MAX_MB bleibt.
const kodiere = (filter, keyframes, ziel) => {
  for (const crf of CRF_STUFEN) {
    lauf(['-i', QUELLE, '-vf', filter, ...kodierung(crf, keyframes), ziel])
    if (groesse(ziel) <= MAX_MB) return crf
    console.log(`${ziel}: ${groesse(ziel).toFixed(1)} MB bei CRF ${crf}, zu groß`)
  }
  return CRF_STUFEN.at(-1)
}

// a) Vorwärts.
const crfVor = kodiere('null', keyVor, VOR)
// b) Rückwärts. Der Filter reverse hält alle Bilder im Speicher (etwa 1,5 GB), das schafft der Mac.
const crfRueck = kodiere('reverse', keyRueck, RUECK)

// c) Eckdaten aus der fertigen Datei: Bilder zählen, Bildrate lesen.
const { bilder, fps } = zaehlen(VOR)
if (!bilder || !fps) {
  console.error('Bildanzahl oder Bildrate nicht lesbar')
  process.exit(1)
}
const daten = { bilder, fps, dauer: Math.round((bilder / fps) * 10000) / 10000 }
writeFileSync('src/data/fahrt-video.json', JSON.stringify(daten, null, 2) + '\n')

// d) Standbilder als JPG in Originalgröße (1920 px breit).
STANDBILDER.forEach((t, i) => {
  const ziel = join(ZIEL, `${String(i + 1).padStart(2, '0')}.jpg`)
  lauf(['-ss', String(t), '-i', QUELLE, '-an', '-frames:v', '1', '-q:v', '3', ziel])
})

const mb = (datei) => groesse(datei).toFixed(1)
console.log(`${bilder} Bilder, ${fps} fps, ${daten.dauer} s`)
console.log(`fahrt.mp4 ${mb(VOR)} MB (CRF ${crfVor}), Keyframes ${keyVor.join(', ')}`)
console.log(`fahrt-rueck.mp4 ${mb(RUECK)} MB (CRF ${crfRueck}), Keyframes ${keyRueck.join(', ')}`)

// e) Kontrolle: Auflösung der fertigen Datei und Ähnlichkeit (SSIM) zur Quelle, 1 = identisch.
const kopf = spawnSync(ffmpeg, ['-hide_banner', '-i', VOR]).stderr.toString()
const aufloesung = kopf.match(/Video:.*?, (\d+x\d+)/)?.[1]
const vergleich = spawnSync(ffmpeg, ['-hide_banner', '-i', VOR, '-i', QUELLE, '-lavfi', '[0:v][1:v]ssim', '-f', 'null', '-'])
const ssim = vergleich.stderr.toString().match(/All:([\d.]+)/)?.[1]
console.log(`fahrt.mp4: Auflösung ${aufloesung}, SSIM ${ssim}`)
