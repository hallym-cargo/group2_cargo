import QuoteRegisterContainer from "../quoteRegister/QuoteRegisterContainer";
import PublicHeader from "./components/PublicHeader";
import ShipperHeader from "./components/ShipperHeader";
import DriverHeader from "./components/DriverHeader";

export default function QuoteRegisterPage({ controller }) {
  const headerContent = controller.isLoggedIn ? (
    controller.auth?.role === "DRIVER" ? (
      <DriverHeader controller={controller} />
    ) : controller.auth?.role === "SHIPPER" ? (
      <ShipperHeader controller={controller} />
    ) : (
      <PublicHeader
        isLoggedIn={controller.isLoggedIn}
        authMode={controller.authMode}
        setAuthMode={controller.setAuthMode}
        setDashboardTab={controller.setDashboardTab}
        logout={controller.logout}
        controller={controller}
      />
    )
  ) : (
    <PublicHeader
      isLoggedIn={controller.isLoggedIn}
      authMode={controller.authMode}
      setAuthMode={controller.setAuthMode}
      setDashboardTab={controller.setDashboardTab}
      logout={controller.logout}
      controller={controller}
    />
  );

  return (
    <div className="public-shell landing-shell">
      {headerContent}

      <QuoteRegisterContainer
        controller={controller}
        onMoveToQuoteList={(created) =>
          controller.setRoutePage("detail", { quoteId: created?.id })
        }
      />
    </div>
  );
}
