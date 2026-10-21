import { pfad } from '../lib/pfad'

// Kartenentwurf: klein, kuratiert, italienische Klassiker. Preise und Gerichte sind Demo-Inhalt.
// Allergene (A Gluten, C Ei, D Fisch, F Soja, G Milch, H Schalenfrüchte, R Krebstiere, O Sulfite)
// bleiben hier gepflegt, werden auf der Karte aber nicht angezeigt.

export type Gericht = {
  name: string
  // Was drin ist, eine Zeile.
  text: string
  // Nur die Zahl, ohne Eurozeichen.
  preis: string
  allergene: string
  // Eigene Pizza: wird im Bestellbereich zusammengestellt.
  eigen?: boolean
}

export type Kategorie = {
  id: string
  name: string
  // Ein kleiner Satz unter dem Namen der Seite.
  hinweis: string
  // Kleine Zeichnung unten rechts auf der Seite, z. B. '/karte/pizze.webp'. Ohne Eintrag bleibt die Stelle leer.
  zeichnung?: string
  // Kleiner Satz am Ende der Seite.
  fuss?: string
  gerichte: Gericht[]
}

// Immer zwei Kategorien bilden eine Doppelseite: Antipasti + Pasta Fresca, Pizze + Secondi, Dolci + Vino e Cocktail.
export const kategorien: Kategorie[] = [
  {
    id: 'antipasti',
    name: 'Antipasti',
    hinweis: 'kleine Vorspeisen zum Teilen',
    zeichnung: pfad('/karte/antipasti.webp'),
    gerichte: [
      { name: 'Vitello tonnato', text: 'Kalbsrücken, Thunfischcreme, Kapern', preis: '18', allergene: 'D, F' },
      { name: 'Burrata', text: 'Ofentomaten, Basilikum, Olivenöl', preis: '17', allergene: 'G' },
      { name: 'Frittura di calamari', text: 'Zitrone, Petersilie, Knoblauchmayo', preis: '19', allergene: 'A, C, R' },
      { name: 'Bruschetta al pomodoro', text: 'Geröstetes Brot, Tomate, Knoblauch', preis: '11', allergene: 'A' },
    ],
  },
  {
    id: 'pasta',
    name: 'Pasta Fresca',
    hinweis: 'täglich frisch von Hand gemacht',
    zeichnung: pfad('/karte/pasta.webp'),
    gerichte: [
      { name: 'Spaghetti alla carbonara', text: 'Guanciale, Eigelb, Pecorino', preis: '19', allergene: 'A, C, G' },
      { name: 'Cacio e pepe', text: 'Tonnarelli, Pecorino, schwarzer Pfeffer', preis: '18', allergene: 'A, G' },
      { name: 'Tagliatelle al ragù', text: 'Rindfleisch, Tomate, Rotwein', preis: '21', allergene: 'A, C, O' },
      { name: 'Gnocchi alla sorrentina', text: 'Tomate, Mozzarella, Basilikum', preis: '19', allergene: 'A, G' },
    ],
  },
  {
    id: 'pizze',
    name: 'Pizze',
    hinweis: 'neapolitanisch, aus dem Holzofen',
    zeichnung: pfad('/karte/pizze.webp'),
    gerichte: [
      { name: 'Margherita', text: 'Tomate, Fior di Latte, Basilikum', preis: '14', allergene: 'A, G' },
      { name: 'Diavola', text: 'Salami piccante, Tomate, Fior di Latte', preis: '17', allergene: 'A, G' },
      { name: 'Bufala', text: 'Büffelmozzarella, Tomate, Basilikum', preis: '18,5', allergene: 'A, G' },
      { name: 'Quattro Formaggi', text: 'Gorgonzola, Fontina, Parmesan, Fior di Latte', preis: '17,5', allergene: 'A, G' },
      {
        name: 'Eigene Pizza',
        text: 'Du wählst die Zutaten, wir backen sie.',
        preis: 'ab 14',
        allergene: 'A, G',
        eigen: true,
      },
    ],
  },
  {
    id: 'secondi',
    name: 'Secondi',
    hinweis: 'Fleisch und Fisch',
    zeichnung: pfad('/karte/secondi.webp'),
    gerichte: [
      { name: 'Saltimbocca alla romana', text: 'Kalbsschnitzel, Salbei, Prosciutto, Weißwein', preis: '32', allergene: 'A, O' },
      { name: 'Branzino al forno', text: 'Wolfsbarsch, Zitrone, Kartoffeln', preis: '34', allergene: 'D' },
      { name: 'Cotoletta alla milanese', text: 'Kalbskotelett, Zitrone, Rucola', preis: '36', allergene: 'A, C' },
      { name: 'Tagliata di manzo', text: 'Rinderrücken, Rucola, Parmesan, Balsamico', preis: '38', allergene: 'G, O' },
      { name: 'Melanzane alla parmigiana', text: 'Aubergine, Tomate, Parmesan', preis: '22', allergene: 'G' },
    ],
  },
  {
    id: 'dolci',
    name: 'Dolci',
    hinweis: 'Süßes zum Schluss',
    zeichnung: pfad('/karte/dolci.webp'),
    gerichte: [
      { name: 'Tiramisù', text: 'Mascarpone, Espresso, Kakao', preis: '10', allergene: 'A, C, G' },
      { name: 'Profiteroles', text: 'Brandteig, Vanillecreme, warme Schokolade', preis: '11', allergene: 'A, C, G' },
      { name: 'Panna cotta', text: 'Vanille, Beerensauce', preis: '10', allergene: 'G' },
      { name: 'Affogato', text: 'Vanilleeis, Espresso, Amaretto', preis: '9', allergene: 'G' },
    ],
  },
  {
    id: 'vino',
    name: 'Vino e Cocktail',
    hinweis: 'Wein, Cocktails und Espresso',
    zeichnung: pfad('/karte/vino.webp'),
    fuss: 'Weitere Weine und erlesene Flaschen findest du auf unserer Weinkarte im Restaurant.',
    gerichte: [
      { name: 'Negroni', text: 'Gin, Campari, roter Wermut', preis: '12', allergene: 'O' },
      { name: 'Aperol Spritz', text: 'Aperol, Prosecco, Orange', preis: '10', allergene: 'O' },
      { name: 'Vino della casa', text: 'Rot oder weiß, 0,2 Liter', preis: '8', allergene: 'O' },
      { name: 'Espresso', text: 'Aus der Siebträgermaschine', preis: '3,5', allergene: '' },
    ],
  },
]

export const tagesmenue = {
  titel: 'Heute bei Nonna',
  hinweis: 'das Tagesmenü in drei Gängen',
  gaenge: ['Insalata di finocchi e arance', 'Tagliatelle al ragù della domenica', 'Tiramisù'],
  preis: '36',
}
