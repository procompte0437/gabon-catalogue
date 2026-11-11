import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCatalogue } from '../catalogue'

export default function Splash() {
  const navigate = useNavigate()
  const { meta } = useCatalogue()
  const name = meta?.app_name || 'Gabon Catalogue'
  const phone = meta?.whatsapp_display || '062-70-47-45'

  useEffect(() => {
    const timer = window.setTimeout(() => navigate('/catalogue'), 3000)
    return () => window.clearTimeout(timer)
  }, [navigate])

  return (
    <button className="splash" type="button" onClick={() => navigate('/catalogue')}>
      <div className="splash-title">{name}</div>
      <div className="logo-circle"><span>lessy</span></div>
      <span className="whatsapp-pill">💬 {phone}</span>
      <span className="splash-tap">Touchez l'écran pour entrer</span>
    </button>
  )
}
