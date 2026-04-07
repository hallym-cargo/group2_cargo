// 3단계 (최종 확인)
// 최종 확인 : 전체 데이터 보여주기, 제출 버튼
export default function QuoteStepReview({ formData }) {
  return (
    <div>
      <h3>최종 확인</h3>
      <p>배차명: {formData.estimateName}</p>
      <p>출발지: {formData.originAddress}</p>
      <p>도착지: {formData.destinationAddress}</p>
      <p>운송일자: {formData.transportDate}</p>
      <p>차량: {formData.vehicleType}</p>
      <p>화물 종류: {formData.cargoType}</p>
      <p>물품명: {formData.cargoName}</p>
      <p>중량: {formData.weight}</p>
      <p>요청사항: {formData.requestNote}</p>
      <p>희망 운임: {formData.desiredPrice}</p>
    </div>
  );
}
