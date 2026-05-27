/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'IBM Plex Sans KR', 'Noto Sans KR', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace']
      },
      colors: {
        // CSS variable bridge — Tailwind utility로도 토큰을 쓸 수 있게.
        surface: 'var(--color-surface)',
        'surface-muted': 'var(--color-surface-muted)',
        ink: 'var(--color-text-primary)',
        'ink-2': 'var(--color-text-secondary)',
        'ink-3': 'var(--color-text-tertiary)',
        line: 'var(--color-border)',
        'line-strong': 'var(--color-border-strong)',
        danger: 'var(--color-danger-500)',
        warn: 'var(--color-warn-500)',
        ok: 'var(--color-ok-500)'
      },
      boxShadow: {
        '1': 'var(--shadow-1)',
        '2': 'var(--shadow-2)'
      }
    }
  },
  plugins: []
}
