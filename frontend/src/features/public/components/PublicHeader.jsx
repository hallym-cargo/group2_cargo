export default function PublicHeader({ isLoggedIn, authMode, setAuthMode, setDashboardTab, logout }) {
  return (
    <header className="public-header">
      <div className="identity-block">
        <div className="identity-mark">HC</div>
        <div>
          <div className="identity-title">hallym-cargo</div>
          <div className="identity-subtitle">운송 운영 관리 플랫폼</div>
        </div>
      </div>
      <nav className="header-actions">
        <button className="btn btn-ghost" onClick={() => document.getElementById('board')?.scrollIntoView({ behavior: 'smooth' })}>공개 배차</button>
        <button className="btn btn-ghost" onClick={() => document.getElementById('notice-faq')?.scrollIntoView({ behavior: 'smooth' })}>공지 / FAQ</button>
        {isLoggedIn ? (
          <>
            <button className="btn btn-primary" onClick={() => setDashboardTab('overview')}>마이페이지</button>
            <button className="btn btn-secondary" onClick={logout}>로그아웃</button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
            {authMode === 'login' ? '회원가입' : '로그인'}
          </button>
        )}
      </nav>
    </header>
  )
}
