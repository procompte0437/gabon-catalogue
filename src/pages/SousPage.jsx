import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getArticleCodes, getArticles, saveArticleCodes, updateArticle } from '../api'
import { useCatalogue } from '../catalogue'
import { compressImage } from '../image'
import { ImageViewer, Loading, Modal, Screen } from '../ui'

export default function SousPage() {
  const { rid, sid } = useParams()
  const navigate = useNavigate()
  const [payload, setPayload] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [viewer, setViewer] = useState('')
  const { adminCode } = useCatalogue()
  const [codes, setCodes] = useState({})
  const [bulk, setBulk] = useState(false)

  // Mode administrateur : on charge les mots de passe des articles.
  useEffect(() => {
    setCodes({})
    if (!adminCode) return undefined
    let active = true
    getArticleCodes(sid, adminCode).then((map) => { if (active) setCodes(map) }).catch(() => {})
    return () => { active = false }
  }, [sid, adminCode])

  useEffect(() => {
    let active = true
    setLoading(true)
    getArticles(sid)
      .then((data) => {
        if (active) setPayload(data)
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
  }, [sid])

  function openArticle(article) {
    const link = (article.link || '').trim()
    if (payload?.rubrique.is_linked && link) {
      window.open(link, '_blank', 'noopener')
      return
    }
    if (article.image_url) setViewer(article.image_url)
  }

  function replaceArticle(updated) {
    setPayload((current) => ({
      ...current,
      articles: current.articles.map((item) => (item.id === updated.id ? updated : item)),
    }))
  }

  return (
    <Screen
      title={payload?.sous_rubrique.name || 'Sous-rubrique'}
      showBack
      onBack={() => navigate(`/rubrique/${rid}`)}
    >
      {loading ? <Loading label="Chargement des articles…" /> : null}
      {error ? <div className="empty-state">{error}</div> : null}
      {adminCode && payload?.articles.length ? (
        <button className="file-btn admin-manage" type="button" onClick={() => setBulk(true)}>
          🔑 Gérer les mots de passe des {payload.articles.length} articles
        </button>
      ) : null}
      <div className="img-grid">
        {payload?.articles.map((article) => {
          const link = (article.link || '').trim()
          return (
            <div className="img-card" key={article.id}>
              <button className="img-thumb" type="button" onClick={() => openArticle(article)}>
                {article.image_url ? <img src={article.image_url} alt="" /> : '📷'}
                {payload.rubrique.is_linked && link ? <span className="link-badge" title="Lien vers un site">🔗</span> : null}
              </button>
              <div className="img-caption">
                <div className="title">{article.title}</div>
                <button className="edit-pencil" type="button" aria-label={`Modifier ${article.title}`} onClick={() => setEditing(article)}>✎</button>
              </div>
            </div>
          )
        })}
      </div>

      {editing ? (
        <ArticleEditor
          article={editing}
          isLinked={Boolean(payload?.rubrique.is_linked)}
          adminCode={adminCode}
          currentCode={codes[editing.id] || ''}
          onClose={() => setEditing(null)}
          onSaved={(article, newCode) => {
            replaceArticle(article)
            if (newCode) setCodes((current) => ({ ...current, [article.id]: newCode }))
            setEditing(null)
          }}
        />
      ) : null}
      {bulk ? (
        <BulkCodes
          sousId={sid}
          adminCode={adminCode}
          articles={payload.articles}
          codes={codes}
          onClose={() => setBulk(false)}
          onSaved={(next, message) => {
            setCodes(next)
            setBulk(false)
            if (message) window.setTimeout(() => window.alert(message), 200)
          }}
        />
      ) : null}
      {viewer ? <ImageViewer url={viewer} onClose={() => setViewer('')} /> : null}
    </Screen>
  )
}

function ArticleEditor({ article, isLinked, adminCode, currentCode, onClose, onSaved }) {
  const [code, setCode] = useState(adminCode || '')
  const [newCode, setNewCode] = useState(currentCode || '')
  const [title, setTitle] = useState(article.title)
  const [link, setLink] = useState(article.link || '')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(article.image_url || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function onFile(event) {
    const picked = event.target.files?.[0]
    if (!picked) return
    try {
      const compressed = await compressImage(picked)
      setFile(compressed)
      setPreview((current) => {
        if (current.startsWith('blob:')) URL.revokeObjectURL(current)
        return URL.createObjectURL(compressed)
      })
      setError('')
    } catch (reason) {
      setError(reason.message)
    }
  }

  async function save(event) {
    event.preventDefault()
    if (!title.trim() || title.trim().length > 20) {
      setError('Le titre est obligatoire (20 caractères maximum).')
      return
    }
    const wanted = adminCode ? newCode.trim() : ''
    if (wanted && !/^\d{4}$/.test(wanted)) {
      setError('Le mot de passe doit contenir 4 chiffres.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const result = await updateArticle(article.id, {
        newCode: wanted,
        code: (adminCode || code).trim(),
        title: title.trim(),
        link: isLinked ? link.trim() : undefined,
        image: file,
      })
      onSaved(result.article, wanted)
    } catch (reason) {
      setError(reason.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Modifier l’article"
      message={adminCode ? '' : 'Entrez le mot de passe de cet article pour modifier sa photo et son titre.'}
      onClose={onClose}
    >
      <form onSubmit={save}>
        {adminCode ? null : (
          <div className="field">
            <label htmlFor="article-code">Mot de passe</label>
            <input id="article-code" value={code} inputMode="numeric" maxLength={4} placeholder="0000" onChange={(event) => setCode(event.target.value)} />
          </div>
        )}
        <div className="field">
          <label htmlFor="article-title">Titre (20 lettres max)</label>
          <input id="article-title" value={title} maxLength={20} onChange={(event) => setTitle(event.target.value)} />
          <div className="char-count">{title.length}/20</div>
        </div>
        <div className="field">
          <label>Photo</label>
          <label className="file-btn" htmlFor="article-file">📷 Importer une photo depuis le téléphone</label>
          <input id="article-file" type="file" accept="image/*" hidden onChange={onFile} />
          {preview ? <img className="edit-preview" src={preview} alt="" /> : null}
        </div>
        {isLinked ? (
          <div className="field">
            <label htmlFor="article-link">Lien du site</label>
            <input id="article-link" value={link} placeholder="https://..." onChange={(event) => setLink(event.target.value)} />
          </div>
        ) : null}
        {adminCode ? (
          <div className="field">
            <label htmlFor="article-new-code">Mot de passe client (4 chiffres)</label>
            <input id="article-new-code" value={newCode} inputMode="numeric" maxLength={4} placeholder="0000" onChange={(event) => setNewCode(event.target.value)} />
          </div>
        ) : null}
        {error ? <div className="form-error">{error}</div> : null}
        <div className="modal-actions">
          <button className="btn btn-ghost" type="button" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </form>
    </Modal>
  )
}

// « Mots de passe clients » : un mot de passe par article (administrateur).
function BulkCodes({ sousId, adminCode, articles, codes, onClose, onSaved }) {
  const [values, setValues] = useState(() => Object.fromEntries(articles.map((a) => [a.id, codes[a.id] || ''])))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const result = await saveArticleCodes(sousId, adminCode, values)
      const next = { ...codes }
      for (const [id, value] of Object.entries(values)) if (/^\d{4}$/.test(value.trim())) next[id] = value.trim()
      onSaved(next, result.invalid ? result.message : '')
    } catch (reason) {
      setError(reason.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Mots de passe clients"
      message="Un mot de passe par article. Partage-le au client concerné pour qu’il puisse changer sa photo et son titre."
      onClose={onClose}
    >
      <form onSubmit={save}>
        <div className="bulk-codes">
          {articles.map((article) => (
            <div className="field bulk-row" key={article.id}>
              <div className="bulk-input">
                <label htmlFor={`bulk-${article.id}`}>{article.title}</label>
                <input id={`bulk-${article.id}`} value={values[article.id]} inputMode="numeric" maxLength={4} onChange={(event) => setValues((current) => ({ ...current, [article.id]: event.target.value }))} />
              </div>
              <button className="btn btn-ghost bulk-reset" type="button" onClick={() => setValues((current) => ({ ...current, [article.id]: '0000' }))}>↺ 0000</button>
            </div>
          ))}
        </div>
        {error ? <div className="form-error">{error}</div> : null}
        <div className="modal-actions">
          <button className="btn btn-ghost" type="button" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer tout'}</button>
        </div>
      </form>
    </Modal>
  )
}
