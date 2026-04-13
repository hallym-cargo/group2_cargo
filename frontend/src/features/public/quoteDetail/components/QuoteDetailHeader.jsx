function getStatusClass(status) {
  switch (status) {
    case "입찰 진행중":
      return "is-bidding";
    case "배차 완료":
      return "is-matched";
    default:
      return "is-default";
  }
}

export default function QuoteDetailHeader({ quote }) {
  const statusText = quote.status || "입찰 진행중";
  const statusClass = getStatusClass(statusText);

  return (
    <section className="quote-detail-header">
      <div className="quote-detail-header__badge-row">
        <span className={`quote-detail-header__status-badge ${statusClass}`}>
          {statusText}
        </span>

        {quote.priceProposalAllowed && (
          <span className="quote-detail-header__price-badge">
            가격 상담 가능
          </span>
        )}
      </div>

      <h1 className="quote-detail-header__title">
        {quote.estimateName || "견적명"}
      </h1>
    </section>
  );
}
