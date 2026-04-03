import AdminConsolePage from "./features/admin/AdminConsolePage";
import PublicHomePage from "./features/public/PublicHomePage";
import UserConsolePage from "./features/user/UserConsolePage";
import { useLogisticsController } from "./hooks/useLogisticsController";
import QuoteListPage from "./features/public/QuoteListPage";
import QuoteRegisterPage from "./features/public/QuoteRegisterPage";

export default function App() {
  const controller = useLogisticsController();

  // "견적 목록 보기" 페이지
  if (controller.dashboardTab === "quotes") {
    return <QuoteListPage controller={controller} />;
  }

  // 견적 등록 페이지
  if (controller.dashboardTab === "quoteRegister") {
    return <QuoteRegisterPage controller={controller} />;
  }

  if (!controller.isLoggedIn || controller.dashboardTab === "home") {
    return <PublicHomePage controller={controller} />;
  }

  if (controller.isAdmin) {
    return <AdminConsolePage controller={controller} />;
  }

  return <UserConsolePage controller={controller} />;
}
