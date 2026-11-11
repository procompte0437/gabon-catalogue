import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getArticles, updateArticle } from '../api'
import { compressImage } from '../image'
import { ImageViewer, Modal, Screen } from '../ui'

export default function SousPage() {
  const { rid, sid } = useParams()
  const navigate = useNavigate()
  const [payload, setPayload] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [viewer, setViewer] = useState('')

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
      {loading ? <div className="loading">Chargement des articles…</div> : null}
      {error ? <div className="empty-state">{error}</div> : null}
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
          onClose={() => setEditing(null)}
          onSaved={(article) => {
            replaceArticle(article)
            setEditing(null)
          }}
        />
      ) : null}
      {viewer ? <ImageViewer url={viewer} onClose={() => setViewer('')} /> : null}
    </Screen>
  )
}

function ArticleEditor({ article, isLinked, onClose, onSaved }) {
  const [code, setCode] = useState('')
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
    setSaving(true)
    setError('')
    try {
      const result = await updateArticle(article.id, {
        code: code.trim(),
        title: title.trim(),
        link: isLinked ? link.trim() : undefined,
        image: file,
      })
      onSaved(result.article)
    } catch (reason) {
      setError(reason.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Modifier l’article"
      message="Entrez le mot de passe de cet article pour modifier sa photo et son titre."
      onClose={onClose}
    >
      <form onSubmit={save}>
        <div className="field">
          <label htmlFor="article-code">Mot de passe</label>
          <input id="article-code" value={code} inputMode="numeric" maxLength={4} placeholder="0000" onChange={(event) => setCode(event.target.value)} />
        </div>
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
        {error ? <div className="form-error">{error}</div> : null}
        <div className="modal-actions">
          <button className="btn btn-ghost" type="button" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </form>
    </Modal>
  )
}
