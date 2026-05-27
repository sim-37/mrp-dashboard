import React, { useCallback, useRef, useState } from 'react'

interface Props {
  onFile: (file: File) => void
  accept?: string
  disabled?: boolean
}

const Dropzone: React.FC<Props> = ({ onFile, accept = '.csv,text/csv', disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const handlePick = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      const f = files[0]
      onFile(f)
    },
    [onFile],
  )

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        if (!drag) setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        if (disabled) return
        handlePick(e.dataTransfer.files)
      }}
      className={`relative flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed py-10 text-center transition ${
        disabled ? 'opacity-50' : ''
      }`}
      style={{
        background: drag ? 'var(--color-info-50)' : 'var(--color-surface)',
        borderColor: drag ? 'var(--color-info-500)' : 'var(--color-border-strong)',
      }}
    >
      <div className="text-[14px] font-semibold text-ink">
        {drag ? '여기에 놓으세요' : 'CSV 파일을 드래그하거나 클릭해 선택'}
      </div>
      <div className="mt-1 text-[12px] text-ink-3">
        한 부품당 8행(입고/생산/결품/불량/발주예측/재고계획/재고/안전재고) 구조
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="absolute h-0 w-0 opacity-0"
        onChange={(e) => handlePick(e.target.files)}
        disabled={disabled}
      />
    </div>
  )
}

export default Dropzone
