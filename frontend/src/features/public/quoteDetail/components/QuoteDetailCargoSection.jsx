function formatWeight(weight, unit) {
  if (!weight) return "-";
  return `${weight}${unit || ""}`;
}

function formatPrice(price) {
  if (!price) return "-";
  return `${Number(price).toLocaleString()}원`;
}

function getImageSrc(image) {
  if (!image) return "";
  if (typeof image === "string") return image;
  if (image instanceof File) return URL.createObjectURL(image);
  return "";
}

export default function QuoteDetailCargoSection({
  quote,
  isShipper,
  onClickEdit,
}) {
  const images = Array.isArray(quote.cargoImages) ? quote.cargoImages : [];
  const hasImages = images.length > 0;

  return (
    <section className="quote-detail-card quote-detail-cargo-section">
      <div className="quote-detail-card__title-row">
        <div className="quote-detail-cargo-section__title-group">
          <h2 className="quote-detail-card__title">화물 정보</h2>
          <span className="quote-detail-photo-card__count">
            {images.length}장
          </span>
        </div>

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

      <div className="quote-detail-cargo-section__body">
        <div className="quote-detail-info-table quote-detail-cargo-section__table">
          <div className="quote-detail-info-table__row">
            <div className="quote-detail-info-table__label">희망 차량</div>
            <div className="quote-detail-info-table__content">
              <strong>{quote.vehicleType || "-"}</strong>
            </div>
          </div>

          <div className="quote-detail-info-table__row">
            <div className="quote-detail-info-table__label">화물 종류</div>
            <div className="quote-detail-info-table__content">
              <strong>{quote.cargoType || "-"}</strong>
            </div>
          </div>

          <div className="quote-detail-info-table__row">
            <div className="quote-detail-info-table__label">화물명</div>
            <div className="quote-detail-info-table__content">
              <strong>{quote.cargoName || "-"}</strong>
            </div>
          </div>

          <div className="quote-detail-info-table__row">
            <div className="quote-detail-info-table__label">중량</div>
            <div className="quote-detail-info-table__content">
              <strong>{formatWeight(quote.weight, quote.weightUnit)}</strong>
            </div>
          </div>

          <div className="quote-detail-info-table__row">
            <div className="quote-detail-info-table__label">요청사항</div>
            <div className="quote-detail-info-table__content">
              <strong>{quote.requestNote || "-"}</strong>
            </div>
          </div>

          <div className="quote-detail-info-table__row">
            <div className="quote-detail-info-table__label">희망 운임</div>
            <div className="quote-detail-info-table__content">
              <strong>{formatPrice(quote.desiredPrice)}</strong>

              {quote.priceProposalAllowed && (
                <span className="quote-detail-info-card__price-badge">
                  가격 상담 가능
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="quote-detail-cargo-section__photos">
          {hasImages ? (
            <div className="quote-detail-photo-card__grid quote-detail-photo-card__grid--in-section">
              {images.map((image, index) => {
                const src = getImageSrc(image);

                return (
                  <img
                    key={`${index}-${typeof image === "string" ? image : image?.name || "image"}`}
                    src={src}
                    alt={`화물 사진 ${index + 1}`}
                    className="quote-detail-photo-card__image"
                  />
                );
              })}
            </div>
          ) : (
            <div className="quote-detail-photo-card__placeholder">
              첨부된 사진이 없습니다.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
