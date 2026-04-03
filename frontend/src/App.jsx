import AdminConsolePage from "./features/admin/AdminConsolePage";
import PublicHomePage from "./features/public/PublicHomePage";
import PublicUserSearchPage from "./features/public/users/PublicUserSearchPage";
import UserConsolePage from "./features/user/UserConsolePage";
import { useLogisticsController } from "./hooks/useLogisticsController";

import TransportStatus from "./pages/TransportStatus";

import LoginPage from "./pages/LoginPage";

export default function App() {
  const controller = useLogisticsController();

  if (controller.routePage === "status") {
    return <TransportStatus onBack={() => controller.setRoutePage("main")} />;
  }

  if (controller.routePage === "shippers") {
    return <PublicUserSearchPage controller={controller} role="SHIPPER" />;
  }

  if (controller.routePage === "drivers") {
    return <PublicUserSearchPage controller={controller} role="DRIVER" />;
  }

  if (!controller.isLoggedIn || controller.dashboardTab === "home") {
    // 로그인 안 했을 때
    if (!controller.isLoggedIn) {
      if (controller.authMode === "login") {
        return (
          <LoginPage
            controller={controller}
            setAuthMode={controller.setAuthMode}
          />
        );
      }
      return <PublicHomePage controller={controller} />;
    }

    // 로그인 했을 때도 메인 페이지 유지
    if (controller.dashboardTab === "home") {
      return <PublicHomePage controller={controller} />;
    }

    if (controller.isAdmin) {
      return <AdminConsolePage controller={controller} />;
    }

    return <UserConsolePage controller={controller} />;
  }
}
