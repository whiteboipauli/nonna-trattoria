type Props = {
  titel: string
  phase: string
  hinweis?: string
}

export default function PagePlaceholder({ titel, phase, hinweis }: Props) {
  return (
    <section data-kopf="dunkel" className="mx-auto max-w-3xl px-6 py-24">
      <p className="text-sm uppercase tracking-widest opacity-60">{phase}</p>
      <h1 className="papier-titel mt-2">{titel}</h1>
      <p className="mt-6 opacity-70">{hinweis ?? 'Platzhalter. Wird in der genannten Phase gebaut.'}</p>
    </section>
  )
}
