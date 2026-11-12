import { createContext, useContext, useEffect, useState } from 'react'
import { getCatalogue } from './api'

const CatalogueContext = createContext(null)

export function CatalogueProvider({ children }) {
  const [meta, setMeta] = useState(null)
  const [error, setError] = useState('')
  // Mot de passe général saisi via le cadenas (null = pas en mode administrateur).
  const [adminCode, setAdminCode] = useState(null)

  useEffect(() => {
    let active = true
    getCatalogue()
      .then((data) => {
        if (active) setMeta(data)
      })
      .catch((reason) => {
        if (active) setError(reason.message)
      })
    return () => {
      active = false
    }
  }, [])

  // Remplace une rubrique après son renommage, sans recharger tout le catalogue.
  function replaceRubrique(updated) {
    setMeta((current) => current && {
      ...current,
      rubriques: current.rubriques.map((item) => (item.id === updated.id ? updated : item)),
    })
  }

  return (
    <CatalogueContext.Provider value={{ meta, error, replaceRubrique, adminCode, setAdminCode }}>
      {children}
    </CatalogueContext.Provider>
  )
}

export function useCatalogue() {
  return useContext(CatalogueContext)
}
