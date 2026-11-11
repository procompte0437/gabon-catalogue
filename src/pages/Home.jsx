import { useNavigate } from 'react-router-dom'
import { useCatalogue } from '../catalogue'
import { Screen } from '../ui'

export default function Home() {
  const navigate = useNavigate()
  const { meta, error } = useCatalogue()

  return (
    <Screen title={meta?.app_name || 'Gabon Catalogue'}>
      {error ? <div className="empty-state">{error}</div> : null}
      {!error && !meta ? <div className="loading">Chargement des rubriques…</div> : null}
      {meta && meta.rubriques.length === 0 ? <div className="empty-state">Aucune rubrique pour le moment.</div> : null}
      {meta?.rubriques.map((rubrique) => (
        <div className="card-row" key={rubrique.id}>
          <div className="idx display">{rubrique.position}</div>
          <button className="label" type="button" onClick={() => navigate(`/rubrique/${rubrique.id}`)}>
            {rubrique.name}
          </button>
          <button className="chev" type="button" aria-label="Ouvrir" onClick={() => navigate(`/rubrique/${rubrique.id}`)}>›</button>
        </div>
      ))}
    </Screen>
  )
}
