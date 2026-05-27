import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { loadActiveDataset, type LoadedDataset } from './dataset'

interface State {
  dataset: LoadedDataset | null
  loading: boolean
  error: string | null
  lastLoadedAt: number | null
  reload: () => void
}

const DatasetContext = createContext<State | null>(null)

export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataset, setDataset] = useState<LoadedDataset | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null)

  const reload = useCallback(() => {
    let cancelled = false
    setLoading((prev) => (dataset == null ? true : prev))
    setError(null)
    loadActiveDataset()
      .then((d) => {
        if (cancelled) return
        setDataset(d)
        setLoading(false)
        setLastLoadedAt(Date.now())
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setLoading(false)
        setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [dataset])

  useEffect(() => {
    return reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value: State = { dataset, loading, error, lastLoadedAt, reload }
  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>
}

export const useDataset = (): State => {
  const ctx = useContext(DatasetContext)
  if (!ctx) {
    throw new Error('useDataset은 DatasetProvider 안에서만 사용해 주세요.')
  }
  return ctx
}
