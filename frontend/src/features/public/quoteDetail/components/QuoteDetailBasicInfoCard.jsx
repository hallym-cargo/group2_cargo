function formatDateTime(date, time) {
  if (!date && !time) return "-";
  return `${date || ""}${time ? ` ${time}` : ""}`.trim();
}

export default function QuoteDetailBasicInfoCard({
  quote,
  isShipper,
  onClickEdit,
}) {
  return (
    <section className="quote-detail-card quote-detail-info-card quote-detail-basic-card">
      <div className="quote-detail-card__title-row">
        <h2 className="quote-detail-card__title">기본 정보</h2>

        {isShipper && (
          <button
            type="button"
            className="quote-detail-section-edit-btn"
            onClick={onClickEdit}
          >
            수정
          </button>
        )}
      </div>

      <div className="quote-detail-info-table">
        <div className="quote-detail-info-table__row">
          <div className="quote-detail-info-table__label">게시명</div>
          <div className="quote-detail-info-table__content">
            <strong>{quote.estimateName || "-"}</strong>
          </div>
        </div>

        <div className="quote-detail-info-table__row">
          <div className="quote-detail-info-table__label">출발지</div>
          <div className="quote-detail-info-table__content">
            <strong>{quote.originAddress || "-"}</strong>
            <p>{quote.originDetailAddress || "-"}</p>
          </div>
        </div>

        <div className="quote-detail-info-table__row">
          <div className="quote-detail-info-table__label">도착지</div>
          <div className="quote-detail-info-table__content">
            <strong>{quote.destinationAddress || "-"}</strong>
            <p>{quote.destinationDetailAddress || "-"}</p>
          </div>
        </div>

        <div className="quote-detail-info-table__row">
          <div className="quote-detail-info-table__label">운송일시</div>
          <div className="quote-detail-info-table__content">
            <strong>
              {formatDateTime(quote.transportDate, quote.transportTime)}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}
