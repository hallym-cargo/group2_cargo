export const QUOTE_REGISTER_INITIAL_STATE = {
  // ===== 기본 정보 =====
  estimateName: "",
  originAddress: "",
  originDetailAddress: "",
  destinationAddress: "",
  destinationDetailAddress: "",
  transportDate: "",
  transportTime: "",

  // ===== 좌표 정보 =====
  originLat: null,
  originLng: null,
  destinationLat: null,
  destinationLng: null,

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
