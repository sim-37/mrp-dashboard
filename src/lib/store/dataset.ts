// 활성 데이터셋 — 메모리 + IndexedDB 영속.
// W4가 업로드한 CSV가 있으면 그걸 사용, 없으면 내장 sample CSV fetch.

import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import type { CsvParseResult, DatasetMeta } from '../../types/mrp'
import { parseCsv } from '../csv/parse'

const KEY_TEXT = 'mrp:active:csv'
const KEY_META = 'mrp:active:meta'
const KEY_TODAY_OVERRIDE = 'mrp:active:today_override'

export interface LoadedDataset extends CsvParseResult {
  meta: DatasetMeta
  rawText: string
}

const BUILTIN_FILENAME = 'mrp_sorted.csv (내장 샘플)'

const buildMeta = (
  result: CsvParseResult,
  filename: string,
  uploadedAt: string,
  todayOverride?: string | null,
): DatasetMeta => {
  const today = todayOverride && todayOverride !== '' ? todayOverride : result.today
  return {
    id: uploadedAt,
    uploadedAt,
    filename,
    partCount: result.parts.length,
    dateRange: {
      start: result.dates[0] ?? '',
      end: result.dates[result.dates.length - 1] ?? '',
    },
    today,
  }
}

const fetchBuiltin = async (): Promise<{ text: string; uploadedAt: string }> => {
  const res = await fetch('/mrp_sorted.csv', { cache: 'no-store' })
  if (!res.ok) throw new Error(`내장 CSV 로딩 실패: ${res.status}`)
  const text = await res.text()
  return { text, uploadedAt: '2026-05-27T00:00:00Z' }
}

export const loadActiveDataset = async (): Promise<LoadedDataset> => {
  const storedText = await idbGet<string>(KEY_TEXT)
  const storedMeta = await idbGet<DatasetMeta>(KEY_META)
  const todayOverride = await idbGet<string | null>(KEY_TODAY_OVERRIDE)

  if (storedText && storedMeta) {
    const parsed = parseCsv(storedText)
    const meta = buildMeta(parsed, storedMeta.filename, storedMeta.uploadedAt, todayOverride)
    return { ...parsed, meta, rawText: storedText }
  }

  const { text, uploadedAt } = await fetchBuiltin()
  const parsed = parseCsv(text)
  const meta = buildMeta(parsed, BUILTIN_FILENAME, uploadedAt, todayOverride)
  return { ...parsed, meta, rawText: text }
}

export const saveActiveDataset = async (text: string, filename: string): Promise<DatasetMeta> => {
  const parsed = parseCsv(text)
  const uploadedAt = new Date().toISOString()
  const meta = buildMeta(parsed, filename, uploadedAt)
  await idbSet(KEY_TEXT, text)
  await idbSet(KEY_META, meta)
  // 업로드 시점에는 override 초기화
  await idbDel(KEY_TODAY_OVERRIDE)
  return meta
}

export const clearActiveDataset = async (): Promise<void> => {
  await idbDel(KEY_TEXT)
  await idbDel(KEY_META)
  await idbDel(KEY_TODAY_OVERRIDE)
}

export const setTodayOverride = async (today: string | null): Promise<void> => {
  if (today == null) await idbDel(KEY_TODAY_OVERRIDE)
  else await idbSet(KEY_TODAY_OVERRIDE, today)
}

export const getTodayOverride = async (): Promise<string | null> => {
  return (await idbGet<string | null>(KEY_TODAY_OVERRIDE)) ?? null
}

/** 텍스트만 가져오기 (CSV raw — 보고서/다운로드용) */
export const getActiveCsvText = async (): Promise<string | null> => {
  const stored = await idbGet<string>(KEY_TEXT)
  if (stored) return stored
  try {
    const { text } = await fetchBuiltin()
    return text
  } catch {
    return null
  }
}
