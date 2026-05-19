import React from 'react'
import { formatNumber, formatCurrency } from '../utils/formatters.js'

const Section = ({ index, title, children }) => (
  <div className="rounded-md border border-slate-200 bg-white p-4">
    <div className="mb-2 flex items-center gap-2">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
        {index}
      </span>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
    </div>
    <div className="ml-8 space-y-1.5 text-sm leading-relaxed text-slate-600">
      {children}
    </div>
  </div>
)

const ReportSummary = ({ kpi, dateColumns }) => {
  const period =
    dateColumns && dateColumns.length > 0
      ? `${dateColumns[0]} ~ ${dateColumns[dateColumns.length - 1]} (${dateColumns.length}일)`
      : '-'

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50/60 p-5 shadow-sm">
      <div className="mb-4 flex items-end justify-between border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800">
            보고서용 분석 요약
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            발표·보고서 캡처용 요약 섹션 · 데이터 기간: {period}
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>
            전체 부품:{' '}
            <span className="font-semibold text-slate-700">
              {formatNumber(kpi.totalParts)}
            </span>
            건
          </div>
          <div>
            위험 부품:{' '}
            <span className="font-semibold text-rose-600">
              {formatNumber(kpi.riskParts)}
            </span>
            건 (A등급 {formatNumber(kpi.riskAParts)}건)
          </div>
          <div>
            예상 발주금액 합계:{' '}
            <span className="font-semibold text-emerald-700">
              {formatCurrency(kpi.expectedOrderAmount)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Section index="1" title="기존 반응형 발주 방식의 문제점">
          <p>
            기존에는 결품이 실제로 발생한 뒤에야 발주가 들어가는 <b>반응형(reactive)</b>{' '}
            구조였습니다. 결품 행을 신호로 삼다 보니, 라인 정지·긴급 항공 운송 같은
            사후 비용이 반복되었고, 부품별로 “언제 부족해질지”를 사전에 가늠하기 어려웠습니다.
          </p>
          <p>
            결품 데이터는 사실상 <b>지나간 사건의 기록</b>이라 의사결정 리드타임을
            확보해 주지 못한다는 한계가 명확했습니다.
          </p>
        </Section>

        <Section index="2" title="MRP 계획형 방식으로 개선한 이유">
          <p>
            본 대시보드는 <b>재고계획(없을 경우 재고)</b>과 <b>안전재고</b>를 매일
            비교하는 MRP 계획형 관점으로 전환했습니다. 결품 컬럼은 참고용으로만 표시하고,
            위험 판단의 메인 신호로는 사용하지 않습니다.
          </p>
          <p>
            이렇게 하면 결품이 일어나기 <b>이전 시점에</b> 부족 가능성을 포착할 수 있고,
            구매·생산이 대응할 수 있는 리드타임이 확보됩니다.
          </p>
        </Section>

        <Section index="3" title="이 대시보드가 위험 부품을 식별하는 방식">
          <p>
            매일 단위로 <b>기준 재고 vs 안전재고</b>를 비교합니다.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <b>위험</b>: 기준 재고 &lt; 안전재고 — 즉시 발주 검토 대상
            </li>
            <li>
              <b>주의</b>: 안전재고 ≤ 기준 재고 ≤ 안전재고 × 1.2 — 모니터링 강화 대상
            </li>
            <li>
              <b>정상</b>: 그 외
            </li>
          </ul>
          <p>
            부품별로 첫 위험 발생일·최소 재고·최대 부족수량을 자동 산출하고,
            <b> 최대 부족수량 × 단가</b>로 예상 발주금액을 추정합니다.
          </p>
        </Section>

        <Section index="4" title="ABC 등급 기반 우선순위 정렬의 의미">
          <p>
            모든 위험 부품을 동시에 대응할 수는 없으므로, <b>부품등급_금액(A/B/C)</b>을
            1차 정렬 키로 사용합니다. 금액 영향이 큰 A등급 위험 부품이 항상 테이블 상단에
            오도록 하여, 한정된 구매/생산 리소스를 비용 영향이 큰 부품에 먼저 배분할 수
            있게 합니다.
          </p>
          <p>
            동일 등급 내에서는 <b>최대 부족수량 → 예상 발주금액 → 4개월 금액</b> 순으로
            세부 정렬하여, 같은 등급 안에서도 시급도와 금액 영향이 큰 순으로 자연스럽게
            드러나도록 했습니다.
          </p>
        </Section>

        <Section index="5" title="드릴다운 상세 조회의 효과">
          <p>
            테이블 행 또는 Top 10 차트의 막대를 클릭하면, 해당 부품의 <b>날짜별 추이 차트</b>와{' '}
            <b>일자별 상세 표</b>가 동시에 열립니다. 추이 차트에서는 기준 재고가 안전재고를
            언제 하회하는지, 입고·생산이 어느 시점에 회복을 만들어 주는지를 한눈에 확인할
            수 있습니다.
          </p>
          <p>
            이 드릴다운 흐름 덕분에 “이 부품은 며칠에 얼마나 부족하니, 언제까지 얼마를
            발주해야 한다”는 <b>구체적인 액션 단위</b>까지 한 화면에서 도출할 수 있습니다.
          </p>
        </Section>
      </div>
    </section>
  )
}

export default ReportSummary
