import { useRevealOnScroll } from '../../hooks/useRevealOnScroll'
import PublicBoardSection from './components/PublicBoardSection'
import PublicHeader from './components/PublicHeader'
import PublicHeroSection from './components/PublicHeroSection'
import PublicInfoSection from './components/PublicInfoSection'
import LoginPage from "../../pages/LoginPage";

import { useEffect } from 'react'

export default function PublicHomePage({ controller }) {
  useRevealOnScroll()

  useEffect(() => {
    controller.loadPublic()
  }, [])

  if (!controller) return null;

  return (
    <div className="public-shell landing-shell">

      {/* 헤더는 항상 */}
      <PublicHeader
        isLoggedIn={controller.isLoggedIn}
        authMode={controller.authMode}
        setAuthMode={controller.setAuthMode}
        setDashboardTab={controller.setDashboardTab}
        logout={controller.logout}
        controller={controller}
      />

      {/* Hero (배경 역할) 항상 깔기 */}
      <div style={{ position: "relative" }}>
        <PublicHeroSection controller={controller} />
      </div>

      {/* 로그인 아닐 때만 아래 섹션 */}
      <>
        <PublicBoardSection controller={controller} />
        <PublicInfoSection controller={controller} />
      </>

    </div>
  )
}