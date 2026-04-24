export const QUOTE_REGISTER_INITIAL_STATE = {
  // ===== 기본 정보 =====
  estimateName: "", // 게시글 제목 (견적 제목)
  originAddress: "", // 출발지 주소 (메인 주소)
  originDetailAddress: "", // 출발지 상세 주소 (층수, 엘리베이터 여부 등 포함 가능)
  originLat: "", // 출발지 위도
  originLng: "", // 출발지 경도
  destinationAddress: "", // 도착지 주소 (메인 주소)
  destinationDetailAddress: "", // 도착지 상세 주소
  destinationLat: "", // 도착지 위도
  destinationLng: "", // 도착지 경도
  transportDate: "", // 운송 날짜 (YYYY-MM-DD)
  transportTime: "", // 운송 시간 (HH:mm)

  // ===== 차량 정보 =====
  vehicleType: "",
  vehicleNeedConsult: false,

  // ===== 화물 정보 =====
  cargoType: "",
  cargoName: "",

  // ===== 중량 정보 =====
  weight: "",
  weightUnit: "kg",
  weightNeedConsult: false,

  // ===== 추가 요청 =====
  requestNote: "",

  // ===== 가격 정보 =====
  desiredPrice: "",
  priceProposalAllowed: false,

  // ===== 첨부 파일 =====
  cargoImages: [],
};
