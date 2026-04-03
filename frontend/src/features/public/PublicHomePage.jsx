import { useRevealOnScroll } from '../../hooks/useRevealOnScroll'
import PublicBoardSection from './components/PublicBoardSection'
import PublicHeader from './components/PublicHeader'
import PublicHeroSection from './components/PublicHeroSection'
import PublicInfoSection from './components/PublicInfoSection'

export default function PublicHomePage({ controller }) {
  useRevealOnScroll()

  return (
    <div className="public-shell landing-shell">
      <PublicHeader
        isLoggedIn={controller.isLoggedIn}
        authMode={controller.authMode}
        setAuthMode={controller.setAuthMode}
        setDashboardTab={controller.setDashboardTab}
        logout={controller.logout}
        controller={controller}
      />
      <PublicHeroSection controller={controller} />
      <PublicBoardSection controller={controller} />
      <PublicInfoSection controller={controller} />
    </div>
  )
}
