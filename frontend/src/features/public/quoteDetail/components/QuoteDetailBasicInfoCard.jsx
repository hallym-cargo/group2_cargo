function formatDateTime(date, time) {
  if (!date && !time) return "-";
  if (date && time) return `${date} ${time}`;
  return date || time || "-";
}

export default function QuoteDetailBasicInfoCard({ quote }) {
  const dateTimeText = formatDateTime(quote.transportDate, quote.transportTime);

  return (
    <section className="quote-detail-card quote-detail-info-card">
      <div className="quote-detail-card__title-row">
        <h2 className="quote-detail-card__title">기본 정보</h2>
      </div>

      <div className="quote-detail-info-table">
        <div className="quote-detail-info-table__row">
          <span className="quote-detail-info-table__label">게시명</span>
          <div className="quote-detail-info-table__content">
            <strong>{quote.estimateName || "-"}</strong>
          </div>
        </div>

        <div className="quote-detail-info-table__row">
          <span className="quote-detail-info-table__label">출발지</span>
          <div className="quote-detail-info-table__content">
            <strong>{quote.originAddress || "-"}</strong>
            <p>{quote.originDetailAddress || "-"}</p>
          </div>
        </div>

        <div className="quote-detail-info-table__row">
          <span className="quote-detail-info-table__label">도착지</span>
          <div className="quote-detail-info-table__content">
            <strong>{quote.destinationAddress || "-"}</strong>
            <p>{quote.destinationDetailAddress || "-"}</p>
          </div>
        </div>

        <div className="quote-detail-info-table__row">
          <span className="quote-detail-info-table__label">운송일시</span>
          <div className="quote-detail-info-table__content">
            <strong>{dateTimeText}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
