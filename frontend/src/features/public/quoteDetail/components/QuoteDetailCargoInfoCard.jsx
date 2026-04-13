function formatPrice(desiredPrice) {
  if (!desiredPrice && desiredPrice !== 0) return "희망 운임 미정";

  const numericPrice = Number(desiredPrice);

  if (Number.isNaN(numericPrice)) return `${desiredPrice}`;
  return `${numericPrice.toLocaleString()}원`;
}

function formatWeight(weight, weightUnit) {
  if (!weight && weight !== 0) return "-";

  const numericWeight = Number(weight);
  const weightText = Number.isNaN(numericWeight)
    ? `${weight}`
    : `${numericWeight.toLocaleString()}`;

  return `${weightText}${weightUnit || ""}`;
}

export default function QuoteDetailCargoInfoCard({ quote }) {
  const priceText = formatPrice(quote.desiredPrice);
  const weightText = formatWeight(quote.weight, quote.weightUnit);

  return (
    <section className="quote-detail-card quote-detail-info-card">
      <div className="quote-detail-card__title-row">
        <h2 className="quote-detail-card__title">화물 정보</h2>
      </div>

      <div className="quote-detail-info-table">
        <div className="quote-detail-info-table__row">
          <span className="quote-detail-info-table__label">희망 차량</span>
          <div className="quote-detail-info-table__content">
            <strong>{quote.vehicleType || "-"}</strong>
            {quote.vehicleNeedConsult && <p>차량 상담 가능</p>}
          </div>
        </div>

        <div className="quote-detail-info-table__row">
          <span className="quote-detail-info-table__label">화물 종류</span>
          <div className="quote-detail-info-table__content">
            <strong>{quote.cargoType || "-"}</strong>
          </div>
        </div>

        <div className="quote-detail-info-table__row">
          <span className="quote-detail-info-table__label">화물명</span>
          <div className="quote-detail-info-table__content">
            <strong>{quote.cargoName || "-"}</strong>
          </div>
        </div>

        <div className="quote-detail-info-table__row">
          <span className="quote-detail-info-table__label">중량</span>
          <div className="quote-detail-info-table__content">
            <strong>{weightText}</strong>
            {quote.weightNeedConsult && <p>중량 상담 가능</p>}
          </div>
        </div>

        <div className="quote-detail-info-table__row">
          <span className="quote-detail-info-table__label">요청사항</span>
          <div className="quote-detail-info-table__content">
            <strong>{quote.requestNote || "-"}</strong>
          </div>
        </div>

        <div className="quote-detail-info-table__row">
          <span className="quote-detail-info-table__label">희망 운임</span>
          <div className="quote-detail-info-table__content">
            <strong>{priceText}</strong>
            {quote.priceProposalAllowed && (
              <span className="quote-detail-info-card__price-badge">
                가격 상담 가능
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
