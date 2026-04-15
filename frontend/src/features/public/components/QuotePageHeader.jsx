import DriverHeader from "./DriverHeader";
import PublicHeader from "./PublicHeader";
import ShipperHeader from "./ShipperHeader";

export default function QuotePageHeader({ controller }) {
  const role = controller?.auth?.role;

  if (role === "SHIPPER") {
    return <ShipperHeader controller={controller} />;
  }

  if (role === "DRIVER") {
    return <DriverHeader controller={controller} />;
  }

  return (
    <PublicHeader
      isLoggedIn={controller?.isLoggedIn}
      authMode={controller?.authMode}
      setAuthMode={controller?.setAuthMode}
      setDashboardTab={controller?.setDashboardTab}
      logout={controller?.logout}
      controller={controller}
    />
  );
}
