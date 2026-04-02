import SectionTitle from '../../../components/common/SectionTitle'
import { roleText } from '../../../utils/formatters'

function LoggedInCard({ auth, message, setDashboardTab, logout }) {
  return (
    <>
      <SectionTitle eyebrow="ACCOUNT ACCESS" title={`${auth.name}님으로 로그인됨`} desc="로그인한 뒤에도 공개 메인 페이지에 머무를 수 있고, 필요한 순간에만 마이페이지로 이동할 수 있습니다." />
      <div className="list-stack">
        <div className="list-row block">
          <strong>{auth.name}</strong>
          <span>{roleText(auth.role)} · {auth.email}</span>
        </div>
        <div className="table-actions">
          <button className="btn btn-primary" onClick={() => setDashboardTab('overview')}>마이페이지</button>
          <button className="btn btn-secondary" onClick={logout}>로그아웃</button>
        </div>
        {!!message && <div className="alert-info">{message}</div>}
      </div>
    </>
  )
}

function LoginCard({ authMode, setAuthMode, loginForm, setLoginForm, signupForm, setSignupForm, handleLogin, handleSignup, message }) {
  return (
    <>
      <SectionTitle eyebrow="ACCOUNT ACCESS" title={authMode === 'login' ? '운영 계정 로그인' : '회원가입'} desc="샘플 계정: shipper@test.com / driver@test.com / admin@test.com 비밀번호는 모두 1111" />
      <div className="segmented">
        <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>로그인</button>
        <button className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>회원가입</button>
      </div>
      {authMode === 'login' ? (
        <div className="form-stack compact-form">
          <input placeholder="이메일" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
          <input type="password" placeholder="비밀번호" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
          <button className="btn btn-primary" onClick={handleLogin}>로그인</button>
        </div>
      ) : (
        <div className="form-stack compact-form">
          <div className="split-2">
            <input placeholder="이름" value={signupForm.name} onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })} />
            <select value={signupForm.role} onChange={(e) => setSignupForm({ ...signupForm, role: e.target.value })}>
              <option value="SHIPPER">화주</option>
              <option value="DRIVER">차주</option>
            </select>
          </div>
          <input placeholder="이메일" value={signupForm.email} onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} />
          <input type="password" placeholder="비밀번호" value={signupForm.password} onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} />
          <input placeholder="연락처" value={signupForm.phone} onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })} />
          {signupForm.role === 'SHIPPER' ? (
            <input placeholder="회사명" value={signupForm.companyName} onChange={(e) => setSignupForm({ ...signupForm, companyName: e.target.value })} />
          ) : (
            <input placeholder="차량 종류" value={signupForm.vehicleType} onChange={(e) => setSignupForm({ ...signupForm, vehicleType: e.target.value })} />
          )}
          <button className="btn btn-primary" onClick={handleSignup}>회원가입</button>
        </div>
      )}
      {!!message && <div className="alert-info">{message}</div>}
    </>
  )
}

export default function PublicHeroSection({ controller }) {
  const {
    isLoggedIn, auth, authMode, setAuthMode, setDashboardTab, logout, message,
    loginForm, setLoginForm, signupForm, setSignupForm, publicData, handleLogin, handleSignup,
  } = controller

  return (
    <section className="hero-grid">
      <div className="hero-panel hero-panel-dark">
        <div className="eyebrow">LOGISTICS OPERATIONS PLATFORM</div>
        <h1>공개 보드부터 화주 · 차주 · 관리자 운영까지 한 화면 흐름으로 연결되는 물류 서비스</h1>
        <p>카카오 개발자 콘솔처럼 단정한 여백, 선명한 두께, 게시판 중심 레이아웃을 적용했습니다. 공개 화면은 신뢰감을 주고, 로그인 이후는 실제 운영에 맞게 역할별로 분기됩니다.</p>
        <div className="hero-kpis">
          <div><span>등록 화주</span><strong>{publicData.totalShippers || 0}</strong></div>
          <div><span>등록 차주</span><strong>{publicData.totalDrivers || 0}</strong></div>
          <div><span>진행중</span><strong>{publicData.liveShipments || 0}</strong></div>
          <div><span>완료 누적</span><strong>{publicData.completedShipments || 0}</strong></div>
        </div>
      </div>
      <div className="hero-panel auth-card">
        {isLoggedIn ? (
          <LoggedInCard auth={auth} message={message} setDashboardTab={setDashboardTab} logout={logout} />
        ) : (
          <LoginCard
            authMode={authMode}
            setAuthMode={setAuthMode}
            loginForm={loginForm}
            setLoginForm={setLoginForm}
            signupForm={signupForm}
            setSignupForm={setSignupForm}
            handleLogin={handleLogin}
            handleSignup={handleSignup}
            message={message}
          />
        )}
      </div>
    </section>
  )
}
