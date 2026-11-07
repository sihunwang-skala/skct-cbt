import { useEffect, useState, type ReactNode } from 'react'

// 공식 권장 해상도 1920×1080 기준의 고정 스테이지를 뷰포트에 맞게 비례 축소/확대.
// → 어떤 모니터에서도 문제 영역·글자·도구의 "상대 비율"이 1920×1080 실제 화면과 동일하게 유지됨.
export const STAGE_W = 1920
export const STAGE_H = 1080

export function useStageScale() {
  const calc = () => Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H)
  const [scale, setScale] = useState(calc)
  useEffect(() => {
    const on = () => setScale(calc())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return scale
}

export function Stage({ children }: { children: ReactNode }) {
  const scale = useStageScale()
  return (
    <div className="viewport">
      <div
        className="stage"
        data-scale={scale.toFixed(4)}
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `scale(${scale})`,
          left: (window.innerWidth - STAGE_W * scale) / 2,
          top: (window.innerHeight - STAGE_H * scale) / 2,
        }}
      >
        {children}
      </div>
    </div>
  )
}
