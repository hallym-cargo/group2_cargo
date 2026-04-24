import RegionSelect from "./RegionSelect";
import StatusSelect from "./StatusSelect";

export default function QuoteListFilterBar({
  status,
  origin,
  destination,
  ownerFilter,
  onChangeStatus,
  onChangeOrigin,
  onChangeDestination,
  onChangeOwnerFilter,
  isLoggedIn,
  isShipper,
}) {
  return (
    <section className="quote-list-filter-bar">
      <div className="quote-list-filter-grid">
        <div className="quote-list-filter-item">
          <label>진행상태</label>
          <StatusSelect value={status} onChange={onChangeStatus} />
        </div>

        <div className="quote-list-filter-item">
          <label>출발지</label>
          <RegionSelect value={origin} onChange={onChangeOrigin} />
        </div>

        <div className="quote-list-filter-item">
          <label>도착지</label>
          <RegionSelect value={destination} onChange={onChangeDestination} />
        </div>
      </div>
    </section>
  );
}
