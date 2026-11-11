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

export function updateSousRubrique(id, code, name) {
  return request(`/api/sous-rubriques/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, name }),
  })
}

export function updateArticle(id, { code, title, link, image }) {
  const body = new FormData()
  body.append('code', code)
  body.append('title', title)
  if (link !== undefined) body.append('link', link ?? '')
  if (image) body.append('image', image)
  return request(`/api/articles/${id}`, { method: 'POST', body })
}
