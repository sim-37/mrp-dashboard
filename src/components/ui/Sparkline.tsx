import React, { useMemo } from 'react'

interface Props {
  /** 시간순 값 배열. null은 데이터 없음 → 라인 끊김. */
  values: (number | null | undefined)[]
  /** 안전재고선 (단일 값 또는 배열) */
  baseline?: number | (number | null | undefined)[]
  width?: number
  height?: number
  className?: string
  strokeColor?: string
  baselineColor?: string
  fillColor?: string
  /** 마지막 점 강조 */
  emphasizeLast?: boolean
}

const Sparkline: React.FC<Props> = ({
  values,
  baseline,
  width = 160,
  height = 44,
  className,
  strokeColor = '#0F172A',
  baselineColor = '#E11D48',
  fillColor = 'rgba(15,23,42,0.06)',
  emphasizeLast = true,
}) => {
  const { path, area, basePath, lastPoint, allMin, allMax } = useMemo(() => {
    const nums = values.map((v) => (v == null || !Number.isFinite(v) ? null : Number(v)))
    const baseArr: (number | null)[] = Array.isArray(baseline)
      ? baseline.map((v) => (v == null || !Number.isFinite(v) ? null : Number(v)))
      : nums.map(() => (typeof baseline === 'number' ? baseline : null))

    const compact = nums.filter((v): v is number => v != null)
    const baseCompact = baseArr.filter((v): v is number => v != null)
    const min = Math.min(...(compact.length ? compact : [0]), ...(baseCompact.length ? baseCompact : [0]))
    const max = Math.max(...(compact.length ? compact : [1]), ...(baseCompact.length ? baseCompact : [1]))
    const range = max - min || 1

    const n = Math.max(1, nums.length - 1)
    const xAt = (i: number) => (i / n) * (width - 2) + 1
    const yAt = (v: number) => height - 2 - ((v - min) / range) * (height - 4)

    let path = ''
    let area = ''
    let inSegment = false
    let firstX = 0
    let lastX = 0
    nums.forEach((v, i) => {
      if (v == null) {
        if (inSegment) {
          area += ` L ${lastX} ${height - 1} L ${firstX} ${height - 1} Z`
          inSegment = false
        }
        return
      }
      const x = xAt(i)
      const y = yAt(v)
      if (!inSegment) {
        path += `M ${x} ${y}`
        area += `M ${x} ${height - 1} L ${x} ${y}`
        firstX = x
        inSegment = true
      } else {
        path += ` L ${x} ${y}`
        area += ` L ${x} ${y}`
      }
      lastX = x
    })
    if (inSegment) {
      area += ` L ${lastX} ${height - 1} Z`
    }

    let basePath = ''
    baseArr.forEach((v, i) => {
      if (v == null) return
      const x = xAt(i)
      const y = yAt(v)
      basePath += basePath === '' ? `M ${x} ${y}` : ` L ${x} ${y}`
    })

    let lastPoint: { x: number; y: number } | null = null
    for (let i = nums.length - 1; i >= 0; i--) {
      const v = nums[i]
      if (v != null) {
        lastPoint = { x: xAt(i), y: yAt(v) }
        break
      }
    }

    return { path, area, basePath, lastPoint, allMin: min, allMax: max }
  }, [values, baseline, width, height])

  void allMin
  void allMax

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="재고 추이 스파크라인"
    >
      {area && <path d={area} fill={fillColor} stroke="none" />}
      {basePath && (
        <path
          d={basePath}
          fill="none"
          stroke={baselineColor}
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.85}
        />
      )}
      {path && <path d={path} fill="none" stroke={strokeColor} strokeWidth={1.5} />}
      {emphasizeLast && lastPoint && (
        <circle cx={lastPoint.x} cy={lastPoint.y} r={2.2} fill={strokeColor} />
      )}
    </svg>
  )
}

export default Sparkline
