import { useEffect, useState } from 'react'

export default function ScrollTopFloatingButton({ compact = false }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const nextVisible = window.scrollY > 140
      setVisible((prev) => (prev === nextVisible ? prev : nextVisible))
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      type="button"
      className={`scroll-top-floating-button ${compact ? 'scroll-top-floating-button--compact' : ''} ${visible ? 'is-visible' : 'is-hidden'}`}
      onClick={handleClick}
      aria-label="맨 위로 이동"
      tabIndex={visible ? 0 : -1}
    >
      <span className="scroll-top-floating-button__arrow">↑</span>
      <span className="scroll-top-floating-button__label">TOP</span>
    </button>
  )
}
