import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateRubrique } from '../api'
import { useCatalogue } from '../catalogue'
import { Loading, Modal, Screen } from '../ui'

export default function Home() {
  const navigate = useNavigate()
  const { meta, error, replaceRubrique, adminCode } = useCatalogue()
  const name = meta?.app_name || 'Gabon Catalogue'
  const [editing, setEditing] = useState(null)

  return (
    <Screen title={name}>
      {error ? <div className="empty-state">{error}</div> : null}
      {!error && !meta ? <Loading label="Chargement des rubriques…" /> : null}
      {meta && meta.rubriques.length === 0 ? <div className="empty-state">Aucune rubrique pour le moment.</div> : null}
      {meta?.rubriques.map((rubrique) => (
        <div className="card-row" key={rubrique.id}>
          <div className="idx">{rubrique.position}</div>
          <button className="label" type="button" onClick={() => navigate(`/rubrique/${rubrique.id}`)}>
            {rubrique.name}
          </button>
          <button className="edit-pencil" type="button" aria-label={`Modifier ${rubrique.name}`} onClick={() => setEditing(rubrique)}>✎</button>
          <button className="chev" type="button" aria-label="Ouvrir" onClick={() => navigate(`/rubrique/${rubrique.id}`)}>›</button>
        </div>
      ))}

      {editing ? (
        <RubriqueEditor
          rubrique={editing}
          adminCode={adminCode}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            replaceRubrique(updated)
            setEditing(null)
          }}
        />
      ) : null}
    </Screen>
  )
}

function RubriqueEditor({ rubrique, adminCode, onClose, onSaved }) {
  const [code, setCode] = useState(adminCode || '')
  const [name, setName] = useState(rubrique.name)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function save(event) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Le nom est obligatoire.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const result = await updateRubrique(rubrique.id, code.trim(), name.trim())
      onSaved(result.rubrique)
    } catch (reason) {
      setError(reason.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Modifier la rubrique"
      message={adminCode ? '' : 'Entrez le mot de passe administrateur pour renommer cette rubrique.'}
      onClose={onClose}
    >
      <form onSubmit={save}>
        {adminCode ? null : (
          <div className="field">
            <label htmlFor="rubrique-code">Mot de passe</label>
            <input id="rubrique-code" type="password" value={code} inputMode="numeric" maxLength={4} placeholder="••••" onChange={(event) => setCode(event.target.value)} />
          </div>
        )}
        <div className="field">
          <label htmlFor="rubrique-name">Nom de la rubrique</label>
          <input id="rubrique-name" value={name} maxLength={40} onChange={(event) => setName(event.target.value)} />
        </div>
        {error ? <div className="form-error">{error}</div> : null}
        <div className="modal-actions">
          <button className="btn btn-ghost" type="button" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </form>
    </Modal>
  )
}
