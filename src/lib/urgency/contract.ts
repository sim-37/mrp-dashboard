import type { Part, UrgencyResult } from '../../types/mrp'

export interface UrgencyOptions {
  /** 시뮬레이션 horizon. 기본 30일. */
  horizonDays?: number
}

/** 단일 부품의 긴급도를 계산한다. 구현은 ./compute.ts. */
export type ComputeUrgency = (
  part: Part,
  today: string,
  options?: UrgencyOptions,
) => UrgencyResult

/** 부품 배열을 받아 score 내림차순으로 정렬해 반환. */
export type RankParts = (
  parts: Part[],
  today: string,
  options?: UrgencyOptions,
) => UrgencyResult[]
