import React from 'react'
import DDayBadge from '../components/ui/DDayBadge'
import GradeBadge from '../components/ui/GradeBadge'
import Card from '../components/ui/Card'
import Sparkline from '../components/ui/Sparkline'

const block = (title: string, children: React.ReactNode) => (
  <section className="space-y-2">
    <h3 className="text-[11px] uppercase tracking-wider text-ink-3">{title}</h3>
    <div className="flex flex-wrap items-start gap-3">{children}</div>
  </section>
)

const sample = (n: number, base: number, jitter: number) =>
  Array.from({ length: n }, (_, i) => base + Math.sin(i / 3) * jitter + Math.cos(i / 7) * (jitter / 2))

const StyleguidePage: React.FC = () => {
  return (
    <main className="mx-auto max-w-[1100px] space-y-6 px-6 py-6">
      <header>
        <h1 className="text-[18px] font-semibold tracking-tight text-ink">스타일 시연</h1>
        <p className="mt-1 text-[12px] text-ink-2">디자인 토큰 / Badge / Sparkline / Card</p>
      </header>

      {block(
        'DDayBadge',
        <>
          <DDayBadge days={0} />
          <DDayBadge days={2} />
          <DDayBadge days={5} />
          <DDayBadge days={10} />
          <DDayBadge days={25} />
          <DDayBadge days={null} />
        </>,
      )}

      {block(
        'GradeBadge',
        <>
          <GradeBadge grade="A" kind="금액" />
          <GradeBadge grade="B" kind="단가" />
          <GradeBadge grade="C" kind="수량" />
          <GradeBadge grade={null} />
        </>,
      )}

      {block(
        'Sparkline',
        <>
          <Sparkline values={sample(30, 200, 30)} baseline={180} />
          <Sparkline values={sample(30, 120, 20)} baseline={150} width={240} height={64} />
        </>,
      )}

      {block(
        'Card tones',
        <>
          <Card tone="plain"><div className="num text-sm">plain</div></Card>
          <Card tone="danger"><div className="num text-sm">danger</div></Card>
          <Card tone="warn"><div className="num text-sm">warn</div></Card>
          <Card tone="amber"><div className="num text-sm">amber</div></Card>
          <Card tone="ok"><div className="num text-sm">ok</div></Card>
          <Card tone="accent"><div className="num text-sm">accent</div></Card>
        </>,
      )}
    </main>
  )
}

export default StyleguidePage
