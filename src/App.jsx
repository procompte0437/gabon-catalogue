import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { CatalogueProvider } from './catalogue'
import Home from './pages/Home'
import RubriquePage from './pages/RubriquePage'
import SousPage from './pages/SousPage'
import Splash from './pages/Splash'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <CatalogueProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/catalogue" element={<Home />} />
          <Route path="/rubrique/:id" element={<RubriquePage />} />
          <Route path="/rubrique/:rid/sous/:sid" element={<SousPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </CatalogueProvider>
  )
}
