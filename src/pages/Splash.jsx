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
    <div className="splash" onClick={() => navigate('/catalogue')}>
      <div className="splash-title display">{name}</div>
      <div className="logo-circle"><span>lessy</span></div>
      <div className="whatsapp-pill">💬 {phone}</div>
      <div className="splash-tap">Touchez l’écran pour entrer</div>
    </div>
  )
}
