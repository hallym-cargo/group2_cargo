import AdminConsolePage from './features/admin/AdminConsolePage'
import PublicHomePage from './features/public/PublicHomePage'
import UserConsolePage from './features/user/UserConsolePage'
import { useLogisticsController } from './hooks/useLogisticsController'

export default function App() {
  const controller = useLogisticsController()

  if (!controller.isLoggedIn || controller.dashboardTab === 'home') {
    return <PublicHomePage controller={controller} />
  }

  if (controller.isAdmin) {
    return <AdminConsolePage controller={controller} />
  }

  return <UserConsolePage controller={controller} />
}
