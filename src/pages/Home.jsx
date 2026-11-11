import { useNavigate } from 'react-router-dom'
import { useCatalogue } from '../catalogue'
import { Loading, Screen } from '../ui'

export default function Home() {
  const navigate = useNavigate()
  const { meta, error } = useCatalogue()
  const name = meta?.app_name || 'Gabon Catalogue'

  return (
    <Screen title="Catalogue">
      <section className="hero">
        <p className="eyebrow">Libreville · Gabon</p>
        <h1>{name}</h1>
        <p className="lede">Une maison de sélection. Ouvrez une rubrique, puis l’article qui vous attire.</p>
        {meta ? <p className="hero-count">{String(meta.rubriques.length).padStart(2, '0')} rubriques</p> : null}
      </section>

      {error ? <div className="empty-state">{error}</div> : null}
      {!error && !meta ? <Loading label="Chargement des rubriques…" /> : null}
      {meta && meta.rubriques.length === 0 ? <div className="empty-state">Aucune rubrique pour le moment.</div> : null}

      <div className="rubrique-grid">
        {meta?.rubriques.map((rubrique) => (
          <button
            className="rubrique-card"
            type="button"
            key={rubrique.id}
            onClick={() => navigate(`/rubrique/${rubrique.id}`)}
          >
            <span className="rubrique-index">{String(rubrique.position).padStart(2, '0')}</span>
            <span className="rubrique-name">{rubrique.name}</span>
            <span className="rubrique-foot">
              {rubrique.is_linked ? <span className="rubrique-tag">Liens</span> : <span>Entrer</span>}
              <span className="rubrique-arrow" aria-hidden="true">→</span>
            </span>
          </button>
        ))}
      </div>
    </Screen>
  )
}
