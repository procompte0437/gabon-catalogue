import { useEffect, useState } from 'react'
import { useCatalogue } from './catalogue'

const INSTALL_KEY = 'gc_install_dismissed_at'
const DISMISS_DAYS = 14

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

function wasDismissed() {
  const stored = localStorage.getItem(INSTALL_KEY)
  if (!stored) return false
  const days = (Date.now() - Number(stored)) / (1000 * 60 * 60 * 24)
  return days < DISMISS_DAYS
}

export function Topbar({ title, showBack, onBack }) {
  const boUrl = import.meta.env.VITE_BO_URL || 'http://127.0.0.1:8090/connexion'
  return (
    <div className="topbar">
      {showBack ? (
        <button className="icon-btn" type="button" onClick={onBack} aria-label="Retour">‹</button>
      ) : (
        <span style={{ width: 6 }} />
      )}
      <h2>{title}</h2>
      <a className="icon-btn" href={boUrl} title="Administration" aria-label="Administration">🔒</a>
    </div>
  )
}

export function WhatsappFab() {
  const { meta } = useCatalogue()
  if (!meta?.whatsapp_link) return null
  return (
    <a className="fab-whatsapp" href={meta.whatsapp_link} target="_blank" rel="noopener noreferrer">
      💬 WhatsApp
    </a>
  )
}

export function Modal({ title, message, children, onClose }) {
  return (
    <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal-sheet" role="dialog" aria-modal="true">
        <h3>{title}</h3>
        {message ? <p className="modal-msg">{message}</p> : null}
        {children}
      </div>
    </div>
  )
}

export function ImageViewer({ url, onClose }) {
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]')
    const previous = viewport?.getAttribute('content')
    if (viewport) viewport.setAttribute('content', 'width=device-width, initial-scale=1.0')
    return () => {
      if (viewport && previous) viewport.setAttribute('content', previous)
    }
  }, [])

  return (
    <>
      <div className="image-viewer-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
        <img src={url} alt="" />
      </div>
      <button className="image-viewer-close" type="button" onClick={onClose} aria-label="Fermer">✕</button>
    </>
  )
}

export function InstallBanner() {
  const [kind, setKind] = useState(null)
  const [promptEvent, setPromptEvent] = useState(null)

  useEffect(() => {
    if (isStandalone() || wasDismissed()) return undefined
    const onPrompt = (event) => {
      event.preventDefault()
      setPromptEvent(event)
      setKind('android')
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    const ios = /iPad|iPhone|iPod/.test(window.navigator.userAgent) && !window.MSStream
    const timer = ios ? window.setTimeout(() => setKind('ios'), 1500) : null
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      if (timer) window.clearTimeout(timer)
    }
  }, [])

  if (!kind) return null

  function dismiss() {
    localStorage.setItem(INSTALL_KEY, String(Date.now()))
    setKind(null)
  }

  async function install() {
    setKind(null)
    if (!promptEvent) return
    promptEvent.prompt()
    try {
      await promptEvent.userChoice
    } catch {
      /* le navigateur peut fermer l'invite sans réponse */
    }
  }

  return (
    <div className="install-banner">
      <div className="install-icon">📲</div>
      {kind === 'ios' ? (
        <>
          <div className="install-text">
            <b>Installer Gabon Catalogue</b>
            Appuie sur le bouton Partager de Safari, puis « Sur l’écran d’accueil »
          </div>
          <button className="btn-install-no" type="button" onClick={dismiss}>✕</button>
        </>
      ) : (
        <>
          <div className="install-text">
            <b>Installer Gabon Catalogue</b>
            Accède au catalogue en un tap depuis ton écran d’accueil
          </div>
          <button className="btn-install-no" type="button" onClick={dismiss}>Plus tard</button>
          <button className="btn-install-yes" type="button" onClick={install}>Installer</button>
        </>
      )}
    </div>
  )
}

export function Screen({ title, showBack, onBack, children }) {
  return (
    <>
      <Topbar title={title} showBack={showBack} onBack={onBack} />
      <div className="content">{children}</div>
      <WhatsappFab />
      <InstallBanner />
    </>
  )
}
