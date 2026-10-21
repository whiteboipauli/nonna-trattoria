import { useEffect, useRef, type RefObject } from 'react'

// Gemeinsames Verhalten für Pop-ups und Blätter: Fokus hinein, beim Schließen zurück, Esc schließt,
// Tab bleibt im Fenster, die Seite dahinter scrollt nicht.
export function useDialog(offen: boolean, schliessen: () => void): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null)
  const zu = useRef(schliessen)
  zu.current = schliessen

  useEffect(() => {
    if (!offen) return
    const vorher = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.focus()

    const taste = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        zu.current()
        return
      }
      if (e.key !== 'Tab' || !ref.current) return
      const el = [
        ...ref.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex="0"]'),
      ]
      if (!el.length) return
      const erstes = el[0]
      const letztes = el[el.length - 1]
      const aktiv = document.activeElement
      if (e.shiftKey && (aktiv === erstes || aktiv === ref.current)) {
        e.preventDefault()
        letztes.focus()
      } else if (!e.shiftKey && aktiv === letztes) {
        e.preventDefault()
        erstes.focus()
      }
    }
    document.addEventListener('keydown', taste)
    return () => {
      document.removeEventListener('keydown', taste)
      document.body.style.overflow = overflow
      vorher?.focus?.()
    }
  }, [offen])

  return ref
}
