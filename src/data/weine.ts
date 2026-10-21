// Weinkarte: nur zum Ansehen. Preise in Euro, Glas = 0,15 Liter, Flasche = 0,75 Liter. Demo-Inhalt.

export type Wein = {
  name: string
  herkunft: string
  rebsorte: string
  jahrgang: string
  glas?: number
  flasche?: number
}

export type Weingruppe = {
  id: string
  name: string
  hinweis: string
  weine: Wein[]
}

export const weingruppen: Weingruppe[] = [
  {
    id: 'schaumwein',
    name: 'Schaumwein',
    hinweis: 'zum Anstoßen',
    weine: [
      { name: 'Franciacorta Brut DOCG', herkunft: 'Lombardei', rebsorte: 'Chardonnay, Pinot Nero', jahrgang: 'ohne Jahrgang', glas: 12, flasche: 68 },
      { name: 'Prosecco Superiore Valdobbiadene DOCG', herkunft: 'Venetien', rebsorte: 'Glera', jahrgang: '2023', glas: 9, flasche: 46 },
    ],
  },
  {
    id: 'weisswein',
    name: 'Weißwein',
    hinweis: 'frisch und mineralisch',
    weine: [
      { name: 'Gavi di Gavi DOCG', herkunft: 'Piemont', rebsorte: 'Cortese', jahrgang: '2023', glas: 11, flasche: 58 },
      { name: 'Vermentino di Gallura DOCG', herkunft: 'Sardinien', rebsorte: 'Vermentino', jahrgang: '2023', glas: 10, flasche: 52 },
      { name: 'Greco di Tufo DOCG', herkunft: 'Kampanien', rebsorte: 'Greco', jahrgang: '2022', glas: 12, flasche: 62 },
      { name: 'Verdicchio dei Castelli di Jesi Riserva DOCG', herkunft: 'Marken', rebsorte: 'Verdicchio', jahrgang: '2021', flasche: 66 },
      { name: 'Etna Bianco DOC', herkunft: 'Sizilien', rebsorte: 'Carricante', jahrgang: '2022', flasche: 74 },
    ],
  },
  {
    id: 'rotwein',
    name: 'Rotwein',
    hinweis: 'Klassiker Italiens',
    weine: [
      { name: 'Chianti Classico Riserva DOCG', herkunft: 'Toskana', rebsorte: 'Sangiovese', jahrgang: '2020', glas: 13, flasche: 72 },
      { name: 'Etna Rosso DOC', herkunft: 'Sizilien', rebsorte: 'Nerello Mascalese', jahrgang: '2021', glas: 12, flasche: 66 },
      { name: 'Barbaresco DOCG', herkunft: 'Piemont', rebsorte: 'Nebbiolo', jahrgang: '2020', glas: 16, flasche: 98 },
      { name: 'Taurasi DOCG', herkunft: 'Kampanien', rebsorte: 'Aglianico', jahrgang: '2017', flasche: 96 },
      { name: 'Amarone della Valpolicella Classico DOCG', herkunft: 'Venetien', rebsorte: 'Corvina, Rondinella', jahrgang: '2018', glas: 18, flasche: 118 },
      { name: 'Barolo DOCG', herkunft: 'Piemont', rebsorte: 'Nebbiolo', jahrgang: '2019', flasche: 128 },
      { name: 'Brunello di Montalcino DOCG', herkunft: 'Toskana', rebsorte: 'Sangiovese', jahrgang: '2018', flasche: 138 },
      { name: 'Bolgheri Superiore DOC', herkunft: 'Toskana', rebsorte: 'Cabernet Sauvignon, Merlot', jahrgang: '2019', flasche: 240 },
    ],
  },
  {
    id: 'dessertwein',
    name: 'Dessertwein',
    hinweis: 'zum Dolce',
    weine: [
      { name: 'Vin Santo del Chianti Classico DOC', herkunft: 'Toskana', rebsorte: 'Trebbiano, Malvasia', jahrgang: '2015', glas: 9 },
      { name: 'Passito di Pantelleria DOC', herkunft: 'Sizilien', rebsorte: 'Zibibbo', jahrgang: '2019', glas: 10 },
    ],
  },
]
