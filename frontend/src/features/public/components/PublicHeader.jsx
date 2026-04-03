export default function PublicHeader({ isLoggedIn, authMode, setAuthMode, setDashboardTab, logout }) {
  return (
    <header className="landing-header">
      <div className="landing-header__inner">
        <button className="landing-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="landing-brand__mark">HC</span>
          <span className="landing-brand__text">
            <strong>hallym-cargo</strong>
            <small>운송 운영 플랫폼</small>
          </span>
        </button>

        <nav className="landing-nav">
          <button onClick={() => document.getElementById('landing-solution')?.scrollIntoView({ behavior: 'smooth' })}>서비스 소개</button>
          <button onClick={() => document.getElementById('board')?.scrollIntoView({ behavior: 'smooth' })}>실시간 배차</button>
          <button onClick={() => document.getElementById('notice-faq')?.scrollIntoView({ behavior: 'smooth' })}>공지 · 문의</button>
        </nav>

        <div className="landing-header__actions">
          {isLoggedIn ? (
            <>
              <button className="landing-btn landing-btn--light" onClick={() => setDashboardTab('overview')}>대시보드</button>
              <button className="landing-btn landing-btn--primary" onClick={logout}>로그아웃</button>
            </>
          ) : (
            <>
              <button className="landing-text-btn" onClick={() => setAuthMode('login')}>로그인</button>
              <button className="landing-btn landing-btn--primary" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
                {authMode === 'login' ? '회원가입' : '로그인'}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
