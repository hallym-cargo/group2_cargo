import { useEffect, useRef, useState } from 'react'

export default function ChatFloatingButton({ unreadCount, onChatClick, onPlaceholderClick }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMenuToggle = () => {
    setOpen((prev) => !prev)
  }

  const handleChatClick = () => {
    if (onChatClick) onChatClick()
    setOpen(false)
  }

  const handleEmptyButtonClick = (type) => {
    if (onPlaceholderClick) onPlaceholderClick(type)
    setOpen(false)
  }

  return (
    <div className={`floating-quick-menu ${open ? 'is-open' : ''}`} ref={rootRef}>
      <div className="floating-quick-menu__actions">
        <button
          className="floating-quick-menu__action floating-quick-menu__action--placeholder"
          type="button"
          onClick={() => handleEmptyButtonClick('placeholder-1')}
          aria-label="추가 메뉴 1"
        >
          <span className="floating-quick-menu__action-label">준비중</span>
        </button>

        <button
          className="floating-quick-menu__action floating-quick-menu__action--placeholder"
          type="button"
          onClick={() => handleEmptyButtonClick('placeholder-2')}
          aria-label="추가 메뉴 2"
        >
          <span className="floating-quick-menu__action-label">준비중</span>
        </button>

        <button
          className="floating-quick-menu__action floating-quick-menu__action--chat"
          type="button"
          onClick={handleChatClick}
          aria-label="채팅 열기"
        >
          <span className="floating-quick-menu__action-label">채팅</span>
          {unreadCount > 0 && (
            <span className="floating-quick-menu__badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      <button
        className="floating-quick-menu__trigger"
        type="button"
        onClick={handleMenuToggle}
        aria-label={open ? '메뉴 닫기' : '빠른 메뉴 열기'}
      >
        <span className="floating-quick-menu__trigger-line floating-quick-menu__trigger-line--top" />
        <span className="floating-quick-menu__trigger-line floating-quick-menu__trigger-line--middle" />
        <span className="floating-quick-menu__trigger-line floating-quick-menu__trigger-line--bottom" />
      </button>
    </div>
  )
}
