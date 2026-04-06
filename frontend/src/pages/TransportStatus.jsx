import { useState } from 'react'
import "./TransportStatus.css";
export default function TransportStatus({ onBack }) {
  const [rating, setRating] = useState(0)

  return (
    <div className="transport-status-page">
      <div className="transport-status-shell">

        {/* 헤더 */}
        <div className="transport-status-header">
          <h2>수도권-영남권 긴급 의약품 운송</h2>
          <button className="btn btn-ghost" onClick={() => onBack?.()}>
            ← 뒤로가기
          </button>
        </div>

        {/* 메인 영역 */}
        <div className="transport-status-grid">

          {/* 좌측 */}
          <section className="surface transport-status-main">

            {/* 지도 */}
            <div className="transport-status-map">
              📍 지도 영역 (카카오맵 예정)
            </div>

            {/* 진행 상태 */}
            <div className="transport-status-steps">
              <div className="transport-step is-done">✔ 배차 완료</div>
              <div className="transport-step is-active">🚚 운송 중</div>
              <div className="transport-step">📍 도착 예정</div>
              <div className="transport-step">✅ 배송 완료</div>
            </div>

          </section>

          {/* 우측 */}
          <aside className="transport-status-side">

            {/* 기사 카드 */}
            <div className="surface driver-card">
              <div className="driver-header">
                <div className="avatar" />
                <div>
                  <h3>김하늘 기사님</h3>
                  <p>5톤 냉장 트럭</p>
                </div>
              </div>

              <div className="driver-info">
                <p>📞 010-1234-5678</p>
              </div>
            </div>

            {/* ETA 카드 */}
            <div className="surface eta-card">
              <div className="eta-item">
                <p>도착 예정 시간</p>
                <h2>14:25</h2>
              </div>
              <div className="eta-item">
                <p>남은 거리</p>
                <h3>42.8 km</h3>
              </div>
            </div>

          </aside>
        </div>

        {/* 하단 */}
        <div className="transport-status-bottom">

          {/* 별점 */}
          <div className="surface transport-rating-box">
            <h3>운송 평가</h3>
            <div className="transport-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={star <= rating ? 'star active' : 'star'}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* 버튼 */}
          <div className="surface transport-action-box">
            <button className="btn btn-dark">정산하기</button>
            <button className="btn btn-primary">운행 완료</button>
          </div>

        </div>
      </div>
    </div>
  )
}