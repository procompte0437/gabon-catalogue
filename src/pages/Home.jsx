import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addRubrique, deleteRubrique, updateRubrique } from '../api'
import { useCatalogue } from '../catalogue'
import { Loading, Modal, PasswordInput, Screen } from '../ui'

export default function Home() {
  const navigate = useNavigate()
  const { meta, error, replaceRubrique, appendRubrique, setRubriques, adminCode } = useCatalogue()
  const name = meta?.app_name || 'Gabon Catalogue'
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)

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

      {adminCode && meta ? (
        <button className="file-btn admin-manage" type="button" onClick={() => setAdding(true)}>
          ＋ Ajouter une rubrique
        </button>
      ) : null}

      {adding ? (
        <RubriqueAdder
          adminCode={adminCode}
          onClose={() => setAdding(false)}
          onSaved={(created) => {
            appendRubrique(created)
            setAdding(false)
          }}
        />
      ) : null}

      {editing ? (
        <RubriqueEditor
          rubrique={editing}
          adminCode={adminCode}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            replaceRubrique(updated)
            setEditing(null)
          }}
          onDeleted={(rubriques) => {
            setRubriques(rubriques)
            setEditing(null)
          }}
        />
      ) : null}
    </Screen>
  )
}

function RubriqueEditor({ rubrique, adminCode, onClose, onSaved, onDeleted }) {
  const [code, setCode] = useState(adminCode || '')
  const [name, setName] = useState(rubrique.name)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function remove() {
    setSaving(true)
    setError('')
    try {
      const result = await deleteRubrique(rubrique.id, adminCode)
      onDeleted(result.rubriques)
    } catch (reason) {
      setError(reason.message)
      setSaving(false)
    }
  }

  if (confirming) {
    return (
      <Modal
        title="Supprimer la rubrique ?"
        message={`« ${rubrique.name} » sera supprimée avec toutes ses sous-rubriques, ses articles et leurs photos. C’est définitif.`}
        onClose={onClose}
      >
        {error ? <div className="form-error">{error}</div> : null}
        <div className="modal-actions">
          <button className="btn btn-ghost" type="button" onClick={() => setConfirming(false)}>Retour</button>
          <button className="btn btn-danger" type="button" disabled={saving} onClick={remove}>{saving ? 'Suppression…' : 'Supprimer'}</button>
        </div>
      </Modal>
    )
  }

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
            <PasswordInput id="rubrique-code" value={code} onChange={(event) => setCode(event.target.value)} />
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
        {adminCode ? (
          <button className="btn-delete-link" type="button" onClick={() => { setError(''); setConfirming(true) }}>
            🗑 Supprimer cette rubrique
          </button>
        ) : null}
      </form>
    </Modal>
  )
}

function RubriqueAdder({ adminCode, onClose, onSaved }) {
  const [name, setName] = useState('')
  const [count, setCount] = useState('4')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function save(event) {
    event.preventDefault()
    const sousCount = Number.parseInt(count, 10)
    if (!name.trim()) {
      setError('Le nom est obligatoire.')
      return
    }
    if (!Number.isInteger(sousCount) || sousCount < 1 || sousCount > 30) {
      setError('Le nombre de sous-rubriques doit être entre 1 et 30.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const result = await addRubrique(adminCode, name.trim(), sousCount)
      onSaved(result.rubrique)
    } catch (reason) {
      setError(reason.message)
      setSaving(false)
    }
  }

  return (
    <Modal title="Nouvelle rubrique" onClose={onClose}>
      <form onSubmit={save}>
        <div className="field">
          <label htmlFor="new-rubrique-name">Nom de la rubrique</label>
          <input id="new-rubrique-name" autoFocus value={name} maxLength={40} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="new-rubrique-count">Nombre de sous-rubriques (1 à 30)</label>
          <input id="new-rubrique-count" value={count} inputMode="numeric" maxLength={2} onChange={(event) => setCount(event.target.value.replace(/\D/g, ''))} />
        </div>
        {error ? <div className="form-error">{error}</div> : null}
        <div className="modal-actions">
          <button className="btn btn-ghost" type="button" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Ajout…' : 'Ajouter'}</button>
        </div>
      </form>
    </Modal>
  )
}
