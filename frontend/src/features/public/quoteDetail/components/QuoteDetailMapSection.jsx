import QuoteDetailKakaoMapView from "./QuoteDetailKakaoMapView";

function formatDistance(distanceKm) {
  if (distanceKm === null || distanceKm === undefined || distanceKm === "") {
    return "-";
  }

  const numericDistance = Number(distanceKm);
  if (Number.isNaN(numericDistance)) return "-";

  return `${numericDistance.toFixed(1)} km`;
}

function formatMinutes(minutes) {
  if (minutes === null || minutes === undefined || minutes === "") {
    return "-";
  }

  const numericMinutes = Number(minutes);
  if (Number.isNaN(numericMinutes)) return "-";

  if (numericMinutes < 60) return `${numericMinutes}분`;

  const hour = Math.floor(numericMinutes / 60);
  const minute = numericMinutes % 60;

  if (minute === 0) return `${hour}시간`;
  return `${hour}시간 ${minute}분`;
}

export default function QuoteDetailMapSection({ quote }) {
  const distanceText = formatDistance(
    quote?.tracking?.remainingDistanceKm ?? quote?.estimatedDistanceKm,
  );

  const timeText = formatMinutes(
    quote?.tracking?.remainingMinutes ?? quote?.estimatedMinutes,
  );

  return (
    <section className="quote-detail-card quote-detail-map-card">
      <div className="quote-detail-card__title-row">
        <h2 className="quote-detail-card__title">경로 정보</h2>
      </div>

      <div className="quote-detail-map-card__body">
        <div className="quote-detail-map-real">
          <QuoteDetailKakaoMapView shipment={quote} />

          <div className="quote-detail-map-real__meta-row">
            <div className="quote-detail-map-real__meta-card">
              <span>예상 거리</span>
              <strong>{distanceText}</strong>
            </div>

            <div className="quote-detail-map-real__meta-card">
              <span>예상 시간</span>
              <strong>{timeText}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
