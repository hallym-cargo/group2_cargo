import AdminConsolePage from './features/admin/AdminConsolePage';
import PublicHomePage from './features/public/PublicHomePage';
import UserConsolePage from './features/user/UserConsolePage';
import { useLogisticsController } from './hooks/useLogisticsController';
import QuoteListPage from './features/public/QuoteListPage';
import QuoteRegisterPage from './features/public/QuoteRegisterPage';
import PublicUserSearchPage from './features/public/users/PublicUserSearchPage';
import TransportStatus from './pages/TransportStatus';
import LoginPage from './pages/LoginPage';

export default function App() {
  const controller = useLogisticsController();

  if (controller.dashboardTab === 'quotes') {
    return <QuoteListPage controller={controller} />;
  }

  if (controller.dashboardTab === 'quoteRegister') {
    return <QuoteRegisterPage controller={controller} />;
  }

  if (controller.routePage === 'status') {
    return <TransportStatus onBack={() => controller.setRoutePage('main')} />;
  }

  if (controller.routePage === 'shippers') {
    return <PublicUserSearchPage controller={controller} role="SHIPPER" />;
  }

  if (controller.routePage === 'drivers') {
    return <PublicUserSearchPage controller={controller} role="DRIVER" />;
  }

  if (!controller.isLoggedIn) {
    if (controller.authMode === 'login') {
      return (
        <LoginPage
          controller={controller}
          setAuthMode={controller.setAuthMode}
        />
      );
    }

    return <PublicHomePage controller={controller} />;
  }

  if (controller.dashboardTab === 'home') {
    return <PublicHomePage controller={controller} />;
  }

  if (controller.isAdmin) {
    return <AdminConsolePage controller={controller} />;
  }

  return <UserConsolePage controller={controller} />;
}
