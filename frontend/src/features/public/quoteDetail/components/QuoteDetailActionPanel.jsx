import DriverBidPanel from "./DriverBidPanel";
import ShipperManagePanel from "./ShipperManagePanel";

export default function QuoteDetailActionPanel({ quote, controller }) {
  const role = controller?.auth?.role;

  if (role === "DRIVER") {
    return <DriverBidPanel quote={quote} controller={controller} />;
  }

  if (role === "SHIPPER") {
    return <ShipperManagePanel quote={quote} controller={controller} />;
  }

  return (
    <div className="quote-detail-card quote-detail-action-card">
      <div className="quote-detail-card__title-row">
        <h2 className="quote-detail-card__title">안내</h2>
      </div>

      <div className="quote-detail-action-card__body">
        <p className="quote-detail-action-card__desc">
          로그인한 사용자 역할에 따라 사용할 수 있는 기능이 표시됩니다.
        </p>
      </div>
    </div>
  );
}
