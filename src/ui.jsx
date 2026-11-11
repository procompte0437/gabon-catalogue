import { useEffect, useState } from 'react'
import { useCatalogue } from './catalogue'

const LOADER_RADIUS = 28
const LOADER_CIRCUMFERENCE = 2 * Math.PI * LOADER_RADIUS

function useLoadProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const started = performance.now()
    let frame = 0
    let shown = -1

    const tick = (now) => {
      const elapsed = now - started
      const next = Math.min(99, Math.round(99 * (1 - Math.exp(-elapsed / 1700))))
      if (next !== shown) {
        shown = next
        setProgress(next)
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  return progress
}

export function Loading({ label }) {
  const progress = useLoadProgress()
  const visual = Math.max(progress, 14)
  const offset = LOADER_CIRCUMFERENCE * (1 - visual / 100)

  return (
    <div
      className="loading"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      aria-label={label}
    >
      <div className="loader">
        <svg className="loader-spin" viewBox="0 0 72 72" aria-hidden="true">
          <circle className="loader-track" cx="36" cy="36" r={LOADER_RADIUS} />
          <circle
            className="loader-arc"
            cx="36"
            cy="36"
            r={LOADER_RADIUS}
            transform="rotate(-90 36 36)"
            style={{
              strokeDasharray: `${LOADER_CIRCUMFERENCE} ${LOADER_CIRCUMFERENCE}`,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        <span className="loader-percent">{progress}%</span>
      </div>
      <p className="loader-label">{label}</p>
    </div>
  )
}

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
    <header className="topbar">
      {showBack ? (
        <button className="icon-btn" type="button" onClick={onBack} aria-label="Retour">‹</button>
      ) : (
        <span className="topbar-spacer" />
      )}
      <h2>{title}</h2>
      <a className="connexion-link" href={boUrl}>Connexion</a>
    </header>
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
      <main className="content">{children}</main>
      <WhatsappFab />
      <InstallBanner />
    </>
  )
}
