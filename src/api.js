const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8090'

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    })
  } catch {
    throw new Error('Impossible de joindre le catalogue. Vérifiez que le serveur est démarré.')
  }

  const data = await response.json().catch(() => ({}))
  if (response.ok) return data

  if (response.status === 404) {
    throw new Error('Cette page n’existe pas.')
  }
  if (response.status === 429) {
    throw new Error('Trop de tentatives. Réessayez dans une minute.')
  }

  const fieldError = data.errors && Object.values(data.errors).flat()[0]
  throw new Error(fieldError || data.message || 'Une erreur est survenue.')
}

export function getCatalogue() {
  return request('/api/catalogue')
}

export function getSousRubriques(rubriqueId) {
  return request(`/api/rubriques/${rubriqueId}/sous-rubriques`)
}

export function getArticles(sousId) {
  return request(`/api/sous-rubriques/${sousId}/articles`)
}

// Renommer une rubrique : mot de passe général (0110 par défaut).
export function updateRubrique(id, code, name) {
  return request(`/api/rubriques/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, name }),
  })
}

export function updateSousRubrique(id, code, name, newCode) {
  return request(`/api/sous-rubriques/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, name, ...(newCode ? { new_code: newCode } : {}) }),
  })
}

export function updateArticle(id, { code, title, link, image, newCode }) {
  const body = new FormData()
  body.append('code', code)
  body.append('title', title)
  if (link !== undefined) body.append('link', link ?? '')
  if (image) body.append('image', image)
  if (newCode) body.append('new_code', newCode)
  return request(`/api/articles/${id}`, { method: 'POST', body })
}

// ---------- Mode administrateur (cadenas) : mot de passe général ----------
function adminRequest(method, path, body) {
  return request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function adminLogin(code) {
  return adminRequest('POST', '/api/admin/login', { code })
}

function toCodeMap(data) {
  return Object.fromEntries((data.codes || []).map((item) => [item.id, item.code]))
}

export async function getSousCodes(rubriqueId, code) {
  return toCodeMap(await adminRequest('POST', `/api/admin/rubriques/${rubriqueId}/codes`, { code }))
}

export async function getArticleCodes(sousId, code) {
  return toCodeMap(await adminRequest('POST', `/api/admin/sous-rubriques/${sousId}/codes`, { code }))
}

export function saveArticleCodes(sousId, code, codes) {
  return adminRequest('PUT', `/api/admin/sous-rubriques/${sousId}/codes`, { code, codes })
}
