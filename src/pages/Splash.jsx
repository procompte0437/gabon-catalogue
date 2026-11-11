import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCatalogue } from '../catalogue'

export default function Splash() {
  const navigate = useNavigate()
  const { meta } = useCatalogue()
  const name = meta?.app_name || 'Gabon Catalogue'
  const phone = meta?.whatsapp_display || '062-70-47-45'

  useEffect(() => {
    const timer = window.setTimeout(() => navigate('/catalogue'), 3200)
    return () => window.clearTimeout(timer)
  }, [navigate])

  return (
    <button className="splash" type="button" onClick={() => navigate('/catalogue')}>
      <p className="eyebrow">Maison de sélection</p>
      <div className="logo-circle"><span>lessy</span></div>
      <h1 className="splash-title">{name}</h1>
      <p className="splash-phone">{phone}</p>
      <span className="splash-tap">Entrer</span>
    </button>
  )
}
