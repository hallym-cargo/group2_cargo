import ChatWindowModal from './components/common/ChatWindowModal';
import UserProfileModal from './components/common/UserProfileModal';
import AdminConsolePage from './features/admin/AdminConsolePage';
import QuoteListPage from './features/public/QuoteListPage';
import QuoteRegisterPage from './features/public/QuoteRegisterPage';
import PublicHomePage from './features/public/PublicHomePage';
import PublicUserSearchPage from './features/public/users/PublicUserSearchPage';
import UserConsolePage from './features/user/UserConsolePage';
import { useLogisticsController } from './hooks/useLogisticsController';
import TransportStatus from './pages/TransportStatus';
import LoginPage from './pages/LoginPage';

export default function App() {
  const controller = useLogisticsController();

  let page = null;

  if (controller.dashboardTab === 'quotes') {
    page = <QuoteListPage controller={controller} />;
  } else if (controller.dashboardTab === 'quoteRegister') {
    page = <QuoteRegisterPage controller={controller} />;
  } else if (controller.routePage === 'status') {
    page = <TransportStatus onBack={() => controller.setRoutePage('main')} />;
  } else if (controller.routePage === 'shippers') {
    page = <PublicUserSearchPage controller={controller} role="SHIPPER" />;
  } else if (controller.routePage === 'drivers') {
    page = <PublicUserSearchPage controller={controller} role="DRIVER" />;
  } else if (!controller.isLoggedIn) {
    page =
      controller.authMode === 'login' ? (
        <LoginPage
          controller={controller}
          setAuthMode={controller.setAuthMode}
        />
      ) : (
        <PublicHomePage controller={controller} />
      );
  } else if (controller.dashboardTab === 'home') {
    page = <PublicHomePage controller={controller} />;
  } else if (controller.isAdmin) {
    page = <AdminConsolePage controller={controller} />;
  } else {
    page = <UserConsolePage controller={controller} />;
  }

  return (
    <>
      {page}

      {controller.profileModalOpen && (
        <UserProfileModal
          profile={controller.activeProfile}
          isLoggedIn={controller.isLoggedIn}
          onClose={controller.closeUserProfile}
          onOpenChat={controller.openChatWithUser}
        />
      )}

      {controller.chatModalOpen && (
        <ChatWindowModal
          room={controller.chatRoom}
          draft={controller.chatDraft}
          setDraft={controller.setChatDraft}
          onSend={controller.handleSendChatMessage}
          onClose={controller.closeChatRoom}
          isSending={controller.chatSending}
        />
      )}
    </>
  );
}