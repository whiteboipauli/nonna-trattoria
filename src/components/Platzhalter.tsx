import type { ReactNode } from 'react'

type BoxProps = {
  titel: string
  text?: string
  className?: string
  children?: ReactNode
}

// Gestrichelter Kasten: zeigt, was an dieser Stelle später hinkommt.
export function Platzhalter({ titel, text, className = '', children }: BoxProps) {
  return (
    <div className={`rounded-xl border-2 border-dashed border-holz/25 p-6 ${className}`}>
      <p className="font-bold">{titel}</p>
      {text && <p className="mt-1 text-sm opacity-70">{text}</p>}
      {children}
    </div>
  )
}

type KopfProps = {
  titel: string
  phase: string
  text?: string
}

export function AbschnittKopf({ titel, phase, text }: KopfProps) {
  return (
    <header className="mb-8">
      <p className="text-xs uppercase tracking-widest opacity-60">{phase}</p>
      <h2 className="papier-titel mt-1">{titel}</h2>
      {text && <p className="mt-3 max-w-2xl opacity-70">{text}</p>}
    </header>
  )
}

export function Seite({ children }: { children: ReactNode }) {
  return <section data-kopf="dunkel" className="mx-auto w-full max-w-5xl px-6 py-16">{children}</section>
}

type BildProps = {
  label: string
  className?: string
  // Auf welcher Hälfte der Platzhalter-Text stehen soll, damit er nicht unter einer Überschrift liegt.
  labelSeite?: 'mitte' | 'links' | 'rechts'
  children?: ReactNode
}

const labelLage = {
  mitte: 'inset-0',
  links: 'inset-y-0 left-0 w-1/2',
  rechts: 'inset-y-0 right-0 w-1/2',
}

// Fläche für ein Foto oder Video, das Paul später liefert.
export function BildPlatzhalter({ label, className = '', labelSeite = 'mitte', children }: BildProps) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-holz/25 bg-holz/5 ${className}`}
    >
      <p className={`absolute flex items-center justify-center px-6 text-center text-sm opacity-60 ${labelLage[labelSeite]}`}>
        {label}
      </p>
      {children}
    </div>
  )
}
