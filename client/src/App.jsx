import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import ConsolePage from './pages/ConsolePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/console" element={<ConsolePage />} />
    </Routes>
  )
}
