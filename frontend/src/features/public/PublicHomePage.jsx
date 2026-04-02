import PublicBoardSection from './components/PublicBoardSection'
import PublicHeader from './components/PublicHeader'
import PublicHeroSection from './components/PublicHeroSection'
import PublicInfoSection from './components/PublicInfoSection'

export default function PublicHomePage({ controller }) {
  return (
    <div className="public-shell">
      <PublicHeader
        isLoggedIn={controller.isLoggedIn}
        authMode={controller.authMode}
        setAuthMode={controller.setAuthMode}
        setDashboardTab={controller.setDashboardTab}
        logout={controller.logout}
      />
      <PublicHeroSection controller={controller} />
      <PublicBoardSection controller={controller} />
      <PublicInfoSection controller={controller} />
    </div>
  )
}
