import React from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import AppHeader from './components/headline/AppHeader'
import DashboardPage from './pages/DashboardPage'
import UploadPage from './pages/UploadPage'
import ReportPage from './pages/ReportPage'
import StyleguidePage from './pages/StyleguidePage'
import { DatasetProvider, useDataset } from './lib/store/useDataset'

const REFRESH_MS = 15_000

const HeaderBound: React.FC = () => {
  const { dataset, lastLoadedAt } = useDataset()
  const location = useLocation()
  // 보고서 페이지에선 헤더 인쇄 X (페이지 안에서 자체 헤더 사용)
  if (location.pathname === '/report') return null
  return <AppHeader meta={dataset?.meta ?? null} refreshIntervalMs={REFRESH_MS} lastUpdatedAt={lastLoadedAt} />
}

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <DatasetProvider>
        <div className="min-h-screen bg-[color:var(--color-bg)] text-ink">
          <HeaderBound />
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/styleguide" element={<StyleguidePage />} />
            <Route
              path="*"
              element={
                <main className="mx-auto max-w-[700px] px-6 py-12 text-center text-ink-2">
                  페이지를 찾지 못했습니다.
                </main>
              }
            />
          </Routes>
        </div>
      </DatasetProvider>
    </BrowserRouter>
  )
}

export default App
