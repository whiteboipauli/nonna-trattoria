// Pfad zu einer Datei aus public. Auf GitHub Pages liegt die Seite unter einem Unterpfad, lokal unter /.
export const pfad = (p: string) => import.meta.env.BASE_URL.replace(/\/$/, '') + p
