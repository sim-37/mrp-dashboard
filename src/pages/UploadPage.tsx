import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Dropzone from '../components/upload/Dropzone'
import ErrorReport from '../components/upload/ErrorReport'
import { parseCsv } from '../lib/csv/parse'
import { validateCsv } from '../lib/csv/validate'
import {
  clearActiveDataset,
  getTodayOverride,
  loadActiveDataset,
  saveActiveDataset,
  setTodayOverride,
} from '../lib/store/dataset'
import { formatInt, formatKrDate } from '../lib/format'
import type { CsvParseResult, DatasetMeta, ValidationError } from '../types/mrp'

interface PreviewState {
  filename: string
  text: string
  parsed: CsvParseResult
  errors: ValidationError[]
  ok: boolean
}

const UploadPage: React.FC = () => {
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const [activeMeta, setActiveMeta] = useState<DatasetMeta | null>(null)
  const [todayInput, setTodayInput] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const navigate = useNavigate()

  const refresh = useCallback(async () => {
    const ds = await loadActiveDataset()
    setActiveMeta(ds.meta)
    const override = await getTodayOverride()
    setTodayInput(override ?? ds.meta.today)
  }, [])

  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh])

  const handleFile = useCallback(async (file: File) => {
    setMessage(null)
    const text = await file.text()
    const parsed = parseCsv(text)
    const v = validateCsv(parsed)
    setPreview({ filename: file.name, text, parsed, errors: v.errors, ok: v.ok })
  }, [])

  const confirmSave = useCallback(async () => {
    if (!preview) return
    setSaving(true)
    try {
      const meta = await saveActiveDataset(preview.text, preview.filename)
      setActiveMeta(meta)
      setMessage(`업로드 완료. 부품 ${meta.partCount.toLocaleString('ko-KR')}건이 적용됐습니다.`)
      setPreview(null)
      setTimeout(() => navigate('/'), 600)
    } catch (e) {
      setMessage(`저장 실패: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setSaving(false)
    }
  }, [preview, navigate])

  const cancelPreview = () => setPreview(null)

  const applyTodayOverride = async () => {
    await setTodayOverride(todayInput || null)
    setMessage(`기준일이 ${todayInput || '자동 추론'}으로 설정됐습니다.`)
    await refresh()
  }

  const restoreBuiltin = async () => {
    setSaving(true)
    await clearActiveDataset()
    await refresh()
    setMessage('내장 샘플 CSV로 되돌렸습니다.')
    setSaving(false)
  }

  return (
    <main className="mx-auto max-w-[1100px] space-y-5 px-6 py-5">
      <header>
        <h1 className="text-[18px] font-semibold tracking-tight text-ink">CSV 업로드</h1>
        <p className="mt-1 text-[12px] text-ink-2">
          월별 계획 CSV를 올리면 같은 보고가 자동으로 다시 만들어집니다. 검증을 통과해야 활성 데이터셋으로
          저장됩니다.
        </p>
      </header>

      {message && (
        <div className="rounded-md border border-line bg-surface px-3 py-2 text-[12px] text-ink-2 shadow-1">
          {message}
        </div>
      )}

      {activeMeta && (
        <section
          className="rounded-md bg-surface p-4 shadow-1"
          style={{ boxShadow: 'inset 0 0 0 1px var(--color-border), var(--shadow-1)' }}
        >
          <h2 className="text-[13px] font-semibold tracking-tight text-ink">현재 활성 데이터셋</h2>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] sm:grid-cols-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-3">파일</div>
              <div className="truncate text-ink">{activeMeta.filename}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-3">부품 수</div>
              <div className="num text-ink">{formatInt(activeMeta.partCount)}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-3">기간</div>
              <div className="num text-ink">
                {activeMeta.dateRange.start} ~ {activeMeta.dateRange.end}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-3">기준일</div>
              <div className="num text-ink">{formatKrDate(activeMeta.today)}</div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-line pt-3">
            <label className="text-[11px] uppercase tracking-wider text-ink-3">
              기준일 override
              <input
                type="date"
                value={todayInput}
                onChange={(e) => setTodayInput(e.target.value)}
                className="ml-2 rounded-sm border border-line bg-surface px-2 py-0.5 text-[12px] text-ink"
              />
            </label>
            <button
              type="button"
              onClick={applyTodayOverride}
              className="rounded-sm bg-[color:var(--color-accent)] px-2 py-1 text-[11px] font-semibold text-white"
            >
              적용
            </button>
            <button
              type="button"
              onClick={restoreBuiltin}
              disabled={saving}
              className="rounded-sm border border-line bg-surface px-2 py-1 text-[11px] text-ink-2 hover:bg-surface-muted"
            >
              내장 샘플로 되돌리기
            </button>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <Dropzone onFile={handleFile} disabled={saving} />
        {preview && (
          <div className="space-y-3">
            <div
              className="rounded-md bg-surface p-4 shadow-1"
              style={{ boxShadow: 'inset 0 0 0 1px var(--color-border), var(--shadow-1)' }}
            >
              <h3 className="text-[13px] font-semibold tracking-tight text-ink">미리보기</h3>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] sm:grid-cols-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-ink-3">파일</div>
                  <div className="truncate text-ink">{preview.filename}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-ink-3">부품 수</div>
                  <div className="num text-ink">{formatInt(preview.parsed.parts.length)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-ink-3">날짜 컬럼</div>
                  <div className="num text-ink">{formatInt(preview.parsed.dates.length)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-ink-3">자동 추론 기준일</div>
                  <div className="num text-ink">{preview.parsed.today || '-'}</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                <button
                  type="button"
                  onClick={confirmSave}
                  disabled={!preview.ok || saving}
                  className={`rounded-sm px-3 py-1.5 text-[12px] font-semibold ${
                    preview.ok
                      ? 'bg-[color:var(--color-accent)] text-white'
                      : 'cursor-not-allowed bg-surface-muted text-ink-3'
                  }`}
                >
                  {saving ? '저장 중…' : preview.ok ? '활성 데이터셋으로 적용' : '오류가 있어 적용 불가'}
                </button>
                <button
                  type="button"
                  onClick={cancelPreview}
                  className="rounded-sm border border-line bg-surface px-3 py-1.5 text-[12px] text-ink-2 hover:bg-surface-muted"
                >
                  취소
                </button>
              </div>
            </div>
            <ErrorReport errors={preview.errors} />
          </div>
        )}
      </section>
    </main>
  )
}

export default UploadPage
