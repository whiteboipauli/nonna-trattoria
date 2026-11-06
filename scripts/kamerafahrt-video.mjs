// Macht aus dem Rohvideo das Scrub-Video der Kamerafahrt (nur geseekt, nie abgespielt) und die Standbilder.
// Aufruf: npm run video (liest kamerafahrt-roh/kamerafahrt.mp4)
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import ffmpegStatic from 'ffmpeg-static'

const QUELLE = 'kamerafahrt-roh/kamerafahrt.mp4'
const ZIEL = 'public/kamerafahrt'
const SCRUB = join(ZIEL, 'fahrt-scrub.mp4')

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

// Größte erlaubte Dateigröße. Ist die Datei größer, wird mit dem nächsten CRF neu kodiert.
const MAX_MB = 90
const CRF_STUFEN = [18, 19, 20, 21, 22, 23, 24]

// Bilder und Bildrate einer Videodatei.
const zaehlen = (datei) => {
  const info = spawnSync(ffmpeg, ['-hide_banner', '-i', datei, '-map', '0:v', '-c', 'copy', '-f', 'null', '-']).stderr.toString()
  return {
    bilder: Number([...info.matchAll(/frame=\s*(\d+)/g)].at(-1)?.[1]),
    fps: Number(info.match(/([\d.]+) fps/)?.[1]),
  }
}

// H.264 fast verlustfrei in der Originalauflösung (nichts skaliert) mit erhaltenem Filmkorn, ohne Ton.
// Keyframe alle 4 Bilder und keine B-Bilder, damit Springen (Scrubben) schnell und bildgenau klappt.
// Keine Farbmarkierung: absichtlich wie die Quelle, damit die Farben genauso wirken wie im Original.
const kodierung = (crf) => [
  '-an',
  '-c:v', 'libx264',
  '-profile:v', 'high',
  '-pix_fmt', 'yuv420p',
  '-preset', 'slow',
  '-tune', 'grain',
  '-crf', String(crf),
  '-g', '4',
  '-keyint_min', '4',
  '-bf', '0',
  '-sc_threshold', '0',
  '-movflags', '+faststart',
]

const groesse = (datei) => statSync(datei).size / 1024 / 1024
// Kodiert mit der ersten CRF-Stufe, die unter MAX_MB bleibt.
const kodiere = (ziel) => {
  for (const crf of CRF_STUFEN) {
    lauf(['-i', QUELLE, '-vf', 'null', ...kodierung(crf), ziel])
    if (groesse(ziel) <= MAX_MB) return crf
    console.log(`${ziel}: ${groesse(ziel).toFixed(1)} MB bei CRF ${crf}, zu groß`)
  }
  return CRF_STUFEN.at(-1)
}

const crf = kodiere(SCRUB)

// c) Eckdaten aus der fertigen Datei: Bilder zählen, Bildrate lesen.
const { bilder, fps } = zaehlen(SCRUB)
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
console.log(`fahrt-scrub.mp4 ${mb(SCRUB)} MB (CRF ${crf})`)

// e) Kontrolle: Auflösung der fertigen Datei und Ähnlichkeit (SSIM) zur Quelle, 1 = identisch.
const kopf = spawnSync(ffmpeg, ['-hide_banner', '-i', SCRUB]).stderr.toString()
const aufloesung = kopf.match(/Video:.*?, (\d+x\d+)/)?.[1]
const vergleich = spawnSync(ffmpeg, ['-hide_banner', '-i', SCRUB, '-i', QUELLE, '-lavfi', '[0:v][1:v]ssim', '-f', 'null', '-'])
const ssim = vergleich.stderr.toString().match(/All:([\d.]+)/)?.[1]
console.log(`fahrt-scrub.mp4: Auflösung ${aufloesung}, SSIM ${ssim}`)
