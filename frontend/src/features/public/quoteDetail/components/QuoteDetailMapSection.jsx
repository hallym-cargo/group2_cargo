export default function QuoteDetailMapSection({ quote }) {
  return (
    <section className="quote-detail-card quote-detail-map-card">
      <div className="quote-detail-card__title-row">
        <h2 className="quote-detail-card__title">경로 정보</h2>
      </div>

      <div className="quote-detail-map-card__body">
        <div className="quote-detail-map-visual">
          <div className="quote-detail-map-visual__overlay quote-detail-map-visual__overlay--left">
            <span className="quote-detail-map-visual__meta-label">
              예상 거리
            </span>
            <strong className="quote-detail-map-visual__meta-value">
              추후 연동 예정
            </strong>
          </div>

          <div className="quote-detail-map-visual__overlay quote-detail-map-visual__overlay--right">
            <span className="quote-detail-map-visual__meta-label">
              예상 시간
            </span>
            <strong className="quote-detail-map-visual__meta-value">
              추후 연동 예정
            </strong>
          </div>

          <div className="quote-detail-map-visual__route">
            <div className="quote-detail-map-visual__point">
              <span className="quote-detail-map-visual__dot quote-detail-map-visual__dot--origin" />
              <div>
                <strong>출발지</strong>
                <p>{quote.originAddress || "-"}</p>
              </div>
            </div>

            <div className="quote-detail-map-visual__line" />

            <div className="quote-detail-map-visual__point">
              <span className="quote-detail-map-visual__dot quote-detail-map-visual__dot--destination" />
              <div>
                <strong>도착지</strong>
                <p>{quote.destinationAddress || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
