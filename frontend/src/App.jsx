import ChatFloatingButton from "./components/common/ChatFloatingButton";
import ChatInboxPanel from "./components/common/ChatInboxPanel";
import ChatWindowModal from "./components/common/ChatWindowModal";
import UserProfileModal from "./components/common/UserProfileModal";
import AdminConsolePage from "./features/admin/AdminConsolePage";
import MessagesPage from "./features/chat/MessagesPage";
import QuoteListPage from "./features/public/QuoteListPage";
import QuoteRegisterPage from "./features/public/QuoteRegisterPage";
import PublicHomePage from "./features/public/PublicHomePage";
import PublicUserSearchPage from "./features/public/users/PublicUserSearchPage";
import UserConsolePage from "./features/user/UserConsolePage";
import { useLogisticsController } from "./hooks/useLogisticsController";
import TransportStatus from "./pages/TransportStatus";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ShipperSignupPage from "./pages/ShipperSignupPage";
import DriverSignupPage from "./pages/DriverSignupPage";

export default function App() {
  const controller = useLogisticsController();

  let page = null;

  if (controller.dashboardTab === "quotes") {
    page = <QuoteListPage controller={controller} />;
  } else if (controller.dashboardTab === "quoteRegister") {
    page = <QuoteRegisterPage controller={controller} />;
  } else if (controller.routePage === "status") {
    page = <TransportStatus controller={controller} />;
  } else if (controller.routePage === "messages") {
    page = <MessagesPage controller={controller} />;
  } else if (controller.routePage === "shippers") {
    page = <PublicUserSearchPage controller={controller} role="SHIPPER" />;
  } else if (controller.routePage === "drivers") {
    page = <PublicUserSearchPage controller={controller} role="DRIVER" />;
  } else if (controller.routePage === "main") {
    page = <PublicHomePage controller={controller} />;
  } else if (controller.routePage === "login") {
    page = <LoginPage controller={controller} />;
  } else if (controller.routePage === "signup") {
    page = <SignupPage controller={controller} />;
  } else if (controller.routePage === "signup-shipper") {
    page = <ShipperSignupPage controller={controller} />;
  } else if (controller.routePage === "signup-driver") {
    page = <DriverSignupPage controller={controller} />;
  } else if (controller.routePage === "dashboard") {
    page = controller.isAdmin
      ? <AdminConsolePage controller={controller} />
      : <UserConsolePage controller={controller} />;
  } else if (controller.dashboardTab === "home") {
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

      {controller.chatModalOpen && controller.routePage !== "messages" && (
        <ChatWindowModal
          room={controller.chatRoom}
          draft={controller.chatDraft}
          setDraft={controller.setChatDraft}
          onSend={controller.handleSendChatMessage}
          onClose={controller.closeChatRoom}
          isSending={controller.chatSending}
        />
      )}

      {controller.isLoggedIn && !controller.isAdmin && (
        <>
          <ChatFloatingButton
            unreadCount={controller.unreadChatCount}
            onChatClick={controller.openChatInbox}
          />

          <ChatInboxPanel
            open={controller.chatInboxOpen}
            rooms={controller.chatRooms}
            onClose={controller.closeChatInbox}
            onOpenRoom={controller.openChatRoomFromSummary}
            onOpenMessagesPage={() => {
              controller.closeChatInbox();
              controller.setChatModalOpen(false);
              controller.setRoutePage("messages");
            }}
          />
        </>
      )}
    </>
  );
}
