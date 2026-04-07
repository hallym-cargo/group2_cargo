// 2단계 (화물 정보)
// 화물 정보: 차량, 화물 종류, 물품명+요청사항, 중량, 사진, 희망 운임
export default function QuoteStepCargo({ formData, errors, updateField }) {
  return (
    <div>
      <div>
        <label>차량</label>
        <input
          type="text"
          value={formData.vehicleType}
          onChange={(e) => updateField("vehicleType", e.target.value)}
        />
        {errors.vehicleType && <p>{errors.vehicleType}</p>}
      </div>

      <div>
        <label>화물 종류</label>
        <input
          type="text"
          value={formData.cargoType}
          onChange={(e) => updateField("cargoType", e.target.value)}
        />
        {errors.cargoType && <p>{errors.cargoType}</p>}
      </div>

      <div>
        <label>물품명</label>
        <input
          type="text"
          value={formData.cargoName}
          onChange={(e) => updateField("cargoName", e.target.value)}
        />
        {errors.cargoName && <p>{errors.cargoName}</p>}
      </div>

      <div>
        <label>중량</label>
        <input
          type="text"
          value={formData.weight}
          onChange={(e) => updateField("weight", e.target.value)}
        />
        {errors.weight && <p>{errors.weight}</p>}
      </div>

      <div>
        <label>요청사항</label>
        <textarea
          value={formData.requestNote}
          onChange={(e) => updateField("requestNote", e.target.value)}
        />
      </div>

      <div>
        <label>희망 운임</label>
        <input
          type="text"
          value={formData.desiredPrice}
          onChange={(e) => updateField("desiredPrice", e.target.value)}
        />
        {errors.desiredPrice && <p>{errors.desiredPrice}</p>}
      </div>
    </div>
  );
}
