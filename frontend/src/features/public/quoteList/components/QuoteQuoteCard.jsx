function getStatusClass(status) {
  switch (status) {
    case "입찰 진행중":
      return "is-bidding";
    case "배차 완료":
      return "is-matched";
    case "운송 진행중":
      return "is-transporting";
    case "운송 완료":
      return "is-completed";
    default:
      return "";
  }
}

export default function QuoteQuoteCard({ quote }) {
  return (
    <article className="quote-card">
      <div className={`quote-card-status ${getStatusClass(quote.status)}`}>
        <span className="quote-card-status__label">QUOTE STATUS</span>
        <strong>{quote.status}</strong>

        <div className="quote-card-status__meta">
          <span>등록일 {quote.createdAt}</span>
          <span>희망일 {quote.transportDate}</span>
          <span>D-{quote.dday}</span>
        </div>
      </div>

      <div className="quote-card-body">
        <div className="quote-card-body__top">
          <div>
            <h3>{quote.title}</h3>
            <p>{quote.subText}</p>
          </div>

          <button type="button" className="quote-card-detail-button">
            상세보기 →
          </button>
        </div>

        <div className="quote-card-info-grid">
          <div className="quote-card-info-item">
            <span>화물 종류</span>
            <strong>{quote.cargoType}</strong>
          </div>

          <div className="quote-card-info-item">
            <span>물량 정보</span>
            <strong>{quote.cargoVolume}</strong>
          </div>

          <div className="quote-card-info-item">
            <span>차량 조건</span>
            <strong>{quote.vehicleType}</strong>
          </div>

          <div className="quote-card-info-item">
            <span>출발지</span>
            <strong>{quote.origin}</strong>
          </div>

          <div className="quote-card-info-item">
            <span>도착지</span>
            <strong>{quote.destination}</strong>
          </div>

          <div className="quote-card-info-item">
            <span>희망 운임</span>
            <strong>{quote.desiredPrice}</strong>
          </div>
        </div>
      </div>
    </article>
  );
}
