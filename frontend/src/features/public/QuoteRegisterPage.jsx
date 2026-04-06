// 회원/비회원 모두 접근 가능한 견적 등록 페이지
export default function QuoteRegisterPage({ controller }) {
  return (
    <div className="public-shell">
      <button onClick={() => controller.setDashboardTab("quotes")}>
        견적 목록으로 돌아가기
      </button>

      <h1>견적 등록 페이지</h1>
    </div>
  );
}
