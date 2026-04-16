import { useState } from "react";

export default function DriverBidPanel({ onClose }) {
  const [bidPrice, setBidPrice] = useState("");
  const [bidMessage, setBidMessage] = useState("");

  const extractDigits = (value) => value.replace(/[^\d]/g, "");

  const formatNumberWithComma = (value) => {
    const digits = extractDigits(value);

    if (!digits) return "";

    return Number(digits).toLocaleString("ko-KR");
  };

  const handleChangeBidPrice = (e) => {
    const rawValue = e.target.value;
    const formattedValue = formatNumberWithComma(rawValue);
    setBidPrice(formattedValue);
  };

  const handleSubmit = () => {
    const numericBidPrice = Number(extractDigits(bidPrice));

    if (!numericBidPrice) {
      alert("입찰 금액을 입력해 주세요.");
      return;
    }

    const payload = {
      bidPrice: numericBidPrice,
      bidMessage,
    };

    console.log("백엔드 전송 payload:", payload);

    alert("입찰이 완료되었습니다.");
    onClose?.();
  };

  return (
    <section className="driver-bid-panel">
      <div className="driver-bid-panel__header">
        <h2 className="driver-bid-panel__title">입찰 제안하기</h2>
        <p className="driver-bid-panel__desc">
          해당 경로에 맞는 운송료를 제안해 주세요. 입력한 입찰가는 화주가 견적
          비교 과정에서 확인할 수 있습니다.
        </p>
      </div>

      <div className="driver-bid-panel__body">
        <div className="driver-bid-panel__group">
          <label className="driver-bid-panel__label">입찰 금액 (KRW)</label>
          <div className="driver-bid-panel__price-wrap">
            <span className="driver-bid-panel__price-unit">₩</span>
            <input
              type="text"
              inputMode="numeric"
              value={bidPrice}
              onChange={handleChangeBidPrice}
              placeholder="입찰 금액을 입력하세요"
              className="driver-bid-panel__input driver-bid-panel__input--price"
            />
          </div>
        </div>

        <div className="driver-bid-panel__group">
          <label className="driver-bid-panel__label">전달 메시지</label>
          <textarea
            value={bidMessage}
            onChange={(e) => setBidMessage(e.target.value)}
            placeholder="차량 조건, 운송 가능 시간, 전달사항 등을 입력하세요."
            className="driver-bid-panel__textarea"
            rows={5}
          />
        </div>

        <button
          type="button"
          className="driver-bid-panel__submit"
          onClick={handleSubmit}
        >
          입찰하기
        </button>
      </div>
    </section>
  );
}
