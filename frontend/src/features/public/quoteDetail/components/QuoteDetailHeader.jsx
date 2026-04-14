function getStatusLabel(status) {
  switch (status) {
    case "BIDDING":
      return "입찰 진행중";
    case "CONFIRMED":
      return "배차 완료";
    case "IN_TRANSIT":
      return "운송 중";
    case "COMPLETED":
      return "운송 완료";
    case "CANCELLED":
      return "취소됨";
    case "REQUESTED":
      return "요청됨";
    default:
      return status || "입찰 진행중";
  }
}

function getStatusClass(status) {
  switch (status) {
    case "BIDDING":
    case "입찰 진행중":
      return "is-bidding";

    case "CONFIRMED":
    case "배차 완료":
      return "is-matched";

    default:
      return "is-default";
  }
}

export default function QuoteDetailHeader({
  quote,
  onToggleBookmark,
  isShipper,
  isDriver,
  onClickDelete,
}) {
  const rawStatus = quote.status || "BIDDING";
  const statusText = getStatusLabel(rawStatus);
  const statusClass = getStatusClass(rawStatus);

  return (
    <section className="quote-detail-header">
      <div className="quote-detail-header__top-row">
        <div className="quote-detail-header__title-wrap">
          <div className="quote-detail-header__hero-badge-wrap">
            <div className="quote-detail-hero__badge">DETAIL PAGE</div>
          </div>

          <h1 className="quote-detail-header__title">
            {quote.estimateName || quote.title || "견적명"}
          </h1>

          <div className="quote-detail-header__badge-row">
            <span
              className={`quote-detail-header__status-badge ${statusClass}`}
            >
              {statusText}
            </span>

            {quote.priceProposalAllowed && (
              <span className="quote-detail-header__price-badge">
                가격 상담 가능
              </span>
            )}
          </div>
        </div>

        <div className="quote-detail-header__actions">
          {isDriver && (
            <button
              type="button"
              className={
                quote.bookmarked ? "bookmark-btn is-active" : "bookmark-btn"
              }
              onClick={() => onToggleBookmark?.(quote.id)}
              aria-label="북마크 토글"
            >
              ★
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
