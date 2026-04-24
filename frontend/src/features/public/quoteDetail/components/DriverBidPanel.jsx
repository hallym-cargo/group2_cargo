import { useEffect, useState } from "react";
import { createOffer } from "../../../../api";

export default function DriverBidPanel({
  shipmentId,
  defaultBidPrice = "",
  onClose,
}) {
  const [bidPrice, setBidPrice] = useState("");
  const [bidMessage, setBidMessage] = useState("");

  const extractDigits = (value) => String(value ?? "").replace(/[^\d]/g, "");

  const formatNumberWithComma = (value) => {
    const digits = extractDigits(value);

    if (!digits) return "";

    return Number(digits).toLocaleString("ko-KR");
  };

  useEffect(() => {
    if (!defaultBidPrice) return;

    setBidPrice(formatNumberWithComma(defaultBidPrice));
  }, [defaultBidPrice]);

  const handleChangeBidPrice = (e) => {
    const rawValue = e.target.value;
    const formattedValue = formatNumberWithComma(rawValue);
    setBidPrice(formattedValue);
  };

  const handleSubmit = async () => {
    const numericBidPrice = Number(extractDigits(bidPrice));

    if (!shipmentId) {
      alert("견적 ID가 없습니다.");
      return;
    }

    if (!numericBidPrice) {
      alert("입찰 금액을 입력해 주세요.");
      return;
    }

    const payload = {
      price: numericBidPrice,
      message: bidMessage,
    };

    try {
      const res = await createOffer(shipmentId, payload);

      console.log("입찰 성공 응답:", res);

      alert("입찰이 완료되었습니다.");
      onClose?.();
    } catch (err) {
      console.log("입찰 실패:", err.response?.data || err);
      alert(err.response?.data?.message || "입찰 실패");
    }
  };

  return (
    <section className="driver-bid-panel">
      <div className="driver-bid-panel__header">
        <h2 className="driver-bid-panel__title">입찰 제안하기</h2>
        <p className="driver-bid-panel__desc">
          화주가 설정한 희망 운임을 기준으로 입찰 금액을 조정할 수 있습니다.
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
