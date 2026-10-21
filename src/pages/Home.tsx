import Kamerafahrt from '../components/Kamerafahrt'
import Karte from '../components/Karte'
import Abschluss from '../components/Abschluss'

export default function Home() {
  return (
    <>
      <h1 className="sr-only">Trattoria della Nonna, Düsseldorf</h1>
      <Kamerafahrt />
      <Karte />
      <Abschluss />
    </>
  )
}
