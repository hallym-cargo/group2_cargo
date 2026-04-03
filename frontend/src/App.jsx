import AdminConsolePage from './features/admin/AdminConsolePage'
import PublicHomePage from './features/public/PublicHomePage'
import UserConsolePage from './features/user/UserConsolePage'
import { useLogisticsController } from './hooks/useLogisticsController'
import TransportStatus from './pages/TransportStatus'  // ✅ 이거 추가

export default function App() {
  const controller = useLogisticsController()

  // ✅ status 페이지 분기
  if (controller.page === 'status') {
    return <TransportStatus />
  }

  if (
    !controller.isLoggedIn || 
    (controller.dashboardTab === 'home' && controller.page !== 'status')
  ) {
    return <PublicHomePage controller={controller} />
  }

  if (controller.isAdmin) {
    return <AdminConsolePage controller={controller} />
  }

  return <UserConsolePage controller={controller} />
}