import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Bestellung from './pages/Bestellung'
import Kasse from './pages/Kasse'
import BestellungDanke from './pages/BestellungDanke'
import Reservierung from './pages/Reservierung'
import ReservierungDanke from './pages/ReservierungDanke'
import Impressum from './pages/Impressum'
import Datenschutz from './pages/Datenschutz'
import Struktur from './pages/Struktur'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="bestellen" element={<Bestellung />} />
        <Route path="bestellen/kasse" element={<Kasse />} />
        <Route path="bestellen/danke" element={<BestellungDanke />} />
        <Route path="reservieren" element={<Reservierung />} />
        <Route path="reservieren/danke" element={<ReservierungDanke />} />
        <Route path="impressum" element={<Impressum />} />
        <Route path="datenschutz" element={<Datenschutz />} />
        <Route path="seitenplan" element={<Struktur />} />
      </Route>
    </Routes>
  )
}
