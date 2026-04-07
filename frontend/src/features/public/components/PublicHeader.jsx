import AppLogo from '../../../components/common/AppLogo';

function moveToMain(controller, targetId = null) {
  if (targetId) {
    controller.goToMainSection(targetId);
    return;
  }

  controller.setRoutePage('main');
  controller.setDashboardTab('home');
  if (!controller.isLoggedIn) {
    controller.setAuthMode('signup');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export default function PublicHeader({
  isLoggedIn,
  authMode,
  setAuthMode,
  setDashboardTab,
  logout,
  controller,
}) {
  const currentRoute = controller.routePage;
  const currentDashboard = controller.dashboardTab;

  const navButtonClass = (isActive) =>
    isActive ? 'is-active' : '';

  return (
    <header className="landing-header">
      <div className="landing-header__inner">
        <button
          type="button"
          className="landing-brand"
          onClick={() => moveToMain(controller)}
          aria-label="메인 페이지로 이동"
        >
          <AppLogo subtitle="운송 운영 플랫폼" hideTitle />
        </button>

        <nav className="landing-nav">
          <button
            type="button"
            onClick={() => moveToMain(controller, 'landing-solution')}
          >
            서비스 소개
          </button>

          <button
            type="button"
            onClick={() => moveToMain(controller, 'notice-faq')}
          >
            공지 · 문의
          </button>
          <button
            type="button"
            className={navButtonClass(currentDashboard === 'quotes')}
            onClick={() => setDashboardTab('quotes')}
          >
            견적 목록 보기
          </button>
          <button
            type="button"
            className={navButtonClass(currentRoute === 'status')}
            onClick={() => controller.setRoutePage('status')}
          >
            운송 현황
          </button>
          <button
            type="button"
            className={navButtonClass(currentRoute === 'shippers')}
            onClick={() => controller.openPublicUserPage('SHIPPER')}
          >
            화주 찾기
          </button>
          <button
            type="button"
            className={navButtonClass(currentRoute === 'drivers')}
            onClick={() => controller.openPublicUserPage('DRIVER')}
          >
            차주 찾기
          </button>
        </nav>

        <div className="landing-header__actions">
          {isLoggedIn ? (
            <>
              <button
                className="landing-btn landing-btn--light"
                onClick={() => setDashboardTab('overview')}
              >
                대시보드
              </button>
              <button
                className="landing-btn landing-btn--primary"
                onClick={logout}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button
                className="landing-btn landing-btn--primary"
                onClick={() => controller.setRoutePage('login')}
              >
                로그인
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
