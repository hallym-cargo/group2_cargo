취소 패널티 기능 적용본입니다.

포함된 파일
- backend: 취소 사유 enum, 취소 이력 엔티티/리포지토리, Shipment/User/DTO/Service/Controller 수정
- frontend: 취소 API, 등록 폼 scheduledStartAt 추가, 취소 모달, 보드 탭 취소 버튼, 훅 상태/로직 추가

중요
1) 이번 구현은 취소 타이밍 계산을 위해 Shipment.scheduledStartAt 을 새로 추가했습니다.
2) 기존 DB에 컬럼이 자동 추가되도록 JPA update 기준으로 작성했습니다.
3) 상대방 연락 두절 / 상대방 조건 변경은 분쟁성 취소로 저장되고 본인 패널티는 즉시 0점 처리됩니다.
4) 평점 강등은 기존 별점 평균에서 User.penaltyRatingDelta 값을 차감하는 방식으로 반영했습니다.
5) UserBoardTab 에서 본인 식별을 위해 localStorage userId 저장을 추가했습니다.

추천 추가 작업
- 관리자 분쟁 해결 시 상대방에게 패널티 이전하는 로직
- 프로필 모달/검색 카드에 highCancelBadge 표시
- 취소 이력 관리자 페이지 목록
