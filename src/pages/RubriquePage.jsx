import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSousCodes, getSousRubriques, updateSousRubrique } from '../api'
import { useCatalogue } from '../catalogue'
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
  const { adminCode } = useCatalogue()
  const [codes, setCodes] = useState({})
  const [newCode, setNewCode] = useState('')

  // Mode administrateur : on charge les mots de passe des sous-rubriques.
  useEffect(() => {
    setCodes({})
    if (!adminCode) return undefined
    let active = true
    getSousCodes(id, adminCode).then((map) => { if (active) setCodes(map) }).catch(() => {})
    return () => { active = false }
  }, [id, adminCode])

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
    setCode(adminCode || '')
    setNewCode(codes[item.id] || '')
    setName(item.name)
    setFormError('')
  }

  async function save(event) {
    event.preventDefault()
    const wanted = adminCode ? newCode.trim() : ''
    if (wanted && !/^\d{4}$/.test(wanted)) {
      setFormError('Le mot de passe doit contenir 4 chiffres.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const result = await updateSousRubrique(editing.id, (adminCode || code).trim(), name.trim(), wanted)
      if (wanted) setCodes((current) => ({ ...current, [editing.id]: wanted }))
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
          message={adminCode ? '' : 'Entrez le mot de passe de cette sous-rubrique pour la renommer.'}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={save}>
            {adminCode ? null : (
              <div className="field">
                <label htmlFor="sous-code">Mot de passe</label>
                <input id="sous-code" value={code} inputMode="numeric" maxLength={4} placeholder="0000" onChange={(event) => setCode(event.target.value)} />
              </div>
            )}
            <div className="field">
              <label htmlFor="sous-name">Nom</label>
              <input id="sous-name" value={name} maxLength={40} onChange={(event) => setName(event.target.value)} />
            </div>
            {adminCode ? (
              <div className="field">
                <label htmlFor="sous-new-code">Mot de passe (4 chiffres)</label>
                <input id="sous-new-code" value={newCode} inputMode="numeric" maxLength={4} placeholder="0000" onChange={(event) => setNewCode(event.target.value)} />
              </div>
            ) : null}
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
