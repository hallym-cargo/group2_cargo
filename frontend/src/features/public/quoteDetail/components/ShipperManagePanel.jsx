import { useEffect, useState } from "react";

export default function ShipperManagePanel({ quote }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    estimateName: "",
    transportDate: "",
    transportTime: "",
    vehicleType: "",
    cargoType: "",
    cargoName: "",
    weight: "",
    weightUnit: "kg",
    requestNote: "",
    desiredPrice: "",
    priceProposalAllowed: false,
  });

  useEffect(() => {
    setEditForm({
      estimateName: quote.estimateName || "",
      transportDate: quote.transportDate || "",
      transportTime: quote.transportTime || "",
      vehicleType: quote.vehicleType || "",
      cargoType: quote.cargoType || "",
      cargoName: quote.cargoName || "",
      weight: quote.weight || "",
      weightUnit: quote.weightUnit || "kg",
      requestNote: quote.requestNote || "",
      desiredPrice: quote.desiredPrice || "",
      priceProposalAllowed: !!quote.priceProposalAllowed,
    });
  }, [quote]);

  const handleChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    alert("현재는 더미데이터 단계라 수정 저장은 예시 처리입니다.");
    setIsEditMode(false);
  };

  const handleDelete = () => {
    const isConfirmed = window.confirm("이 견적을 삭제하시겠습니까?");
    if (isConfirmed) {
      alert("현재는 더미데이터 단계라 삭제는 예시 처리입니다.");
    }
  };

  const handleCancel = () => {
    setEditForm({
      estimateName: quote.estimateName || "",
      transportDate: quote.transportDate || "",
      transportTime: quote.transportTime || "",
      vehicleType: quote.vehicleType || "",
      cargoType: quote.cargoType || "",
      cargoName: quote.cargoName || "",
      weight: quote.weight || "",
      weightUnit: quote.weightUnit || "kg",
      requestNote: quote.requestNote || "",
      desiredPrice: quote.desiredPrice || "",
      priceProposalAllowed: !!quote.priceProposalAllowed,
    });
    setIsEditMode(false);
  };

  if (!isEditMode) {
    return (
      <section className="quote-detail-card quote-detail-action-card">
        <div className="quote-detail-card__title-row">
          <h2 className="quote-detail-card__title">견적 관리</h2>
        </div>

        <div className="quote-detail-action-card__body quote-detail-action-card__body--shipper">
          <div className="quote-detail-shipper-actions">
            <button
              type="button"
              className="quote-detail-shipper-button quote-detail-shipper-button--primary"
              onClick={() => setIsEditMode(true)}
            >
              수정하기
            </button>

            <button
              type="button"
              className="quote-detail-shipper-button quote-detail-shipper-button--danger"
              onClick={handleDelete}
            >
              삭제하기
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="quote-detail-card quote-detail-action-card">
      <div className="quote-detail-card__title-row">
        <h2 className="quote-detail-card__title">견적 수정</h2>
      </div>

      <div className="quote-detail-action-card__body">
        <div className="quote-detail-form-group">
          <label className="quote-detail-form-group__label">견적명</label>
          <input
            type="text"
            value={editForm.estimateName}
            onChange={(e) => handleChange("estimateName", e.target.value)}
            className="quote-detail-form-input"
          />
        </div>

        <div className="quote-detail-form-group">
          <label className="quote-detail-form-group__label">운송일</label>
          <input
            type="date"
            value={editForm.transportDate}
            onChange={(e) => handleChange("transportDate", e.target.value)}
            className="quote-detail-form-input"
          />
        </div>

        <div className="quote-detail-form-group">
          <label className="quote-detail-form-group__label">운송 시간</label>
          <input
            type="time"
            value={editForm.transportTime}
            onChange={(e) => handleChange("transportTime", e.target.value)}
            className="quote-detail-form-input"
          />
        </div>

        <div className="quote-detail-form-group">
          <label className="quote-detail-form-group__label">희망 차량</label>
          <input
            type="text"
            value={editForm.vehicleType}
            onChange={(e) => handleChange("vehicleType", e.target.value)}
            className="quote-detail-form-input"
          />
        </div>

        <div className="quote-detail-form-group">
          <label className="quote-detail-form-group__label">화물 종류</label>
          <input
            type="text"
            value={editForm.cargoType}
            onChange={(e) => handleChange("cargoType", e.target.value)}
            className="quote-detail-form-input"
          />
        </div>

        <div className="quote-detail-form-group">
          <label className="quote-detail-form-group__label">화물명</label>
          <input
            type="text"
            value={editForm.cargoName}
            onChange={(e) => handleChange("cargoName", e.target.value)}
            className="quote-detail-form-input"
          />
        </div>

        <div className="quote-detail-form-row">
          <div className="quote-detail-form-group">
            <label className="quote-detail-form-group__label">중량</label>
            <input
              type="text"
              value={editForm.weight}
              onChange={(e) => handleChange("weight", e.target.value)}
              className="quote-detail-form-input"
            />
          </div>

          <div className="quote-detail-form-group">
            <label className="quote-detail-form-group__label">단위</label>
            <select
              value={editForm.weightUnit}
              onChange={(e) => handleChange("weightUnit", e.target.value)}
              className="quote-detail-form-select"
            >
              <option value="kg">kg</option>
              <option value="t">t</option>
            </select>
          </div>
        </div>

        <div className="quote-detail-form-group">
          <label className="quote-detail-form-group__label">희망 운임</label>
          <input
            type="text"
            value={editForm.desiredPrice}
            onChange={(e) => handleChange("desiredPrice", e.target.value)}
            className="quote-detail-form-input"
          />
        </div>

        <div className="quote-detail-form-group quote-detail-form-group--checkbox">
          <label className="quote-detail-checkbox-label">
            <input
              type="checkbox"
              checked={editForm.priceProposalAllowed}
              onChange={(e) =>
                handleChange("priceProposalAllowed", e.target.checked)
              }
            />
            <span>가격 상담 가능</span>
          </label>
        </div>

        <div className="quote-detail-form-group">
          <label className="quote-detail-form-group__label">요청사항</label>
          <textarea
            value={editForm.requestNote}
            onChange={(e) => handleChange("requestNote", e.target.value)}
            className="quote-detail-form-textarea"
            rows={5}
          />
        </div>

        <div className="quote-detail-action-card__button-group">
          <button
            type="button"
            className="quote-detail-primary-button"
            onClick={handleSave}
          >
            저장하기
          </button>

          <button
            type="button"
            className="quote-detail-secondary-button"
            onClick={handleCancel}
          >
            취소
          </button>
        </div>
      </div>
    </section>
  );
}
