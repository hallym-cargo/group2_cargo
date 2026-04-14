export default function QuoteDetailPhotoCard({
  quote,
  isShipper,
  onClickEdit,
}) {
  const images = quote.cargoImages || [];

  return (
    <section className="quote-detail-card quote-detail-photo-card">
      <div className="quote-detail-card__title-row">
        <div className="quote-detail-photo-card__title-group">
          <h2 className="quote-detail-card__title">첨부 사진</h2>
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

      {images.length > 0 ? (
        <div className="quote-detail-photo-card__grid">
          {images.map((image, index) => (
            <img
              key={`${image}-${index}`}
              src={image}
              alt={`화물 사진 ${index + 1}`}
              className="quote-detail-photo-card__image"
            />
          ))}
        </div>
      ) : (
        <div className="quote-detail-photo-card__empty">
          첨부된 사진이 없습니다.
        </div>
      )}
    </section>
  );
}
