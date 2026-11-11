import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSousRubriques, updateSousRubrique } from '../api'
import { Loading, Modal, Screen } from '../ui'

export default function RubriquePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rubrique, setRubrique] = useState(null)
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    getSousRubriques(id)
      .then((data) => {
        if (!active) return
        setRubrique(data.rubrique)
        setItems(data.sous_rubriques)
      })
      .catch((reason) => {
        if (active) setError(reason.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  function openPin(item) {
    setEditing(item)
    setCode('')
    setName(item.name)
    setFormError('')
  }

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const result = await updateSousRubrique(editing.id, code.trim(), name.trim())
      setItems((current) => current.map((item) => (
        item.id === editing.id ? result.sous_rubrique : item
      )))
      setEditing(null)
    } catch (reason) {
      setFormError(reason.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen title={rubrique?.name || 'Rubrique'} showBack onBack={() => navigate('/catalogue')}>
      {loading ? <Loading label="Chargement des sous-rubriques…" /> : null}
      {error ? <div className="empty-state">{error}</div> : null}
      <div className="catalogue-grid">
        {items.map((item) => (
          <div className="card-row" key={item.id}>
            <div className="idx">{item.position}</div>
            <button className="label" type="button" onClick={() => navigate(`/rubrique/${id}/sous/${item.id}`)}>
              {item.name}
            </button>
            <button className="edit-pencil" type="button" aria-label={`Modifier ${item.name}`} onClick={() => openPin(item)}>✎</button>
            <button className="chev" type="button" aria-label="Ouvrir" onClick={() => navigate(`/rubrique/${id}/sous/${item.id}`)}>›</button>
          </div>
        ))}
      </div>

      {editing ? (
        <Modal
          title="Modifier la sous-rubrique"
          message="Entrez le mot de passe de cette sous-rubrique pour la renommer."
          onClose={() => setEditing(null)}
        >
          <form onSubmit={save}>
            <div className="field">
              <label htmlFor="sous-code">Mot de passe</label>
              <input id="sous-code" value={code} inputMode="numeric" maxLength={4} placeholder="0000" onChange={(event) => setCode(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="sous-name">Nom</label>
              <input id="sous-name" value={name} maxLength={40} onChange={(event) => setName(event.target.value)} />
            </div>
            {formError ? <div className="form-error">{formError}</div> : null}
            <div className="modal-actions">
              <button className="btn btn-ghost" type="button" onClick={() => setEditing(null)}>Annuler</button>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          </form>
        </Modal>
      ) : null}
    </Screen>
  )
}
