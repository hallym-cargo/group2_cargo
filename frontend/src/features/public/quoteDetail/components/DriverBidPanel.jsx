import { useState } from "react";

export default function DriverBidPanel() {
  const [bidPrice, setBidPrice] = useState("");
  const [bidMessage, setBidMessage] = useState("");

  const handleSubmit = () => {
    alert(
      `입찰 제출 예시\n입찰가: ${bidPrice || "-"}\n메시지: ${bidMessage || "-"}`,
    );
  };

  return (
    <section className="quote-detail-card quote-detail-action-card quote-detail-action-card--driver">
      <div className="quote-detail-card__title-row">
        <h2 className="quote-detail-card__title quote-detail-card__title--inverse">
          입찰 제안하기
        </h2>
      </div>

      <div className="quote-detail-action-card__body">
        <p className="quote-detail-action-card__desc quote-detail-action-card__desc--inverse">
          해당 경로에 대한 경쟁력 있는 운송료를 제안해 주세요. 모든 입찰가는
          화주화면에서만 확인됩니다.
        </p>

        <div className="quote-detail-form-group">
          <label className="quote-detail-form-group__label quote-detail-form-group__label--inverse">
            입찰 금액 (KRW)
          </label>
          <input
            type="text"
            value={bidPrice}
            onChange={(e) => setBidPrice(e.target.value)}
            placeholder="₩ 0"
            className="quote-detail-form-input quote-detail-form-input--dark"
          />
        </div>

        <div className="quote-detail-form-group">
          <label className="quote-detail-form-group__label quote-detail-form-group__label--inverse">
            전달 메시지
          </label>
          <textarea
            value={bidMessage}
            onChange={(e) => setBidMessage(e.target.value)}
            placeholder="전달할 내용을 입력하세요."
            className="quote-detail-form-textarea quote-detail-form-input--dark"
            rows={5}
          />
        </div>

        <button
          type="button"
          className="quote-detail-driver-submit-button"
          onClick={handleSubmit}
        >
          비밀 입찰 제출하기
        </button>
      </div>
    </section>
  );
}
