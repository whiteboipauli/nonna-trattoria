// Prüft die Umrechnung zwischen Vorwärts- und Rückwärts-Video. Aufruf: node --test scripts/
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spiegeln } from '../src/lib/spiegeln.ts'

const N = 505
const FPS = 24
const nah = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`)

test('Bildanfänge: Rückwärtszeit = (N-1)/fps minus Vorwärtszeit', () => {
  for (let k = 0; k < N; k++) nah(spiegeln(k / FPS, N, FPS), (N - 1) / FPS - k / FPS)
})

test('erstes und letztes Bild tauschen', () => {
  nah(spiegeln(0, N, FPS), 504 / 24)
  nah(spiegeln(504 / 24, N, FPS), 0)
})

test('Zwischenzeiten zählen zum gerade sichtbaren Bild', () => {
  // 1.2 s liegt in Bild 28 (28.8 / 24), 30/24 + ein Hauch in Bild 30.
  nah(spiegeln(1.2, N, FPS), (N - 1 - 28) / FPS)
  nah(spiegeln(30 / FPS + 0.01, N, FPS), (N - 1 - 30) / FPS)
})

test('hin und zurück ergibt den Bildanfang', () => {
  for (const t of [0, 1.2, 5.25, 9.9, 14.75, 21.0]) nah(spiegeln(spiegeln(t, N, FPS), N, FPS), Math.floor(t * FPS + 1e-6) / FPS)
})

test('über das Ende hinaus bleibt es beim letzten Bild', () => {
  nah(spiegeln(21.0417, N, FPS), 0)
  nah(spiegeln(-1, N, FPS), 504 / 24)
})
