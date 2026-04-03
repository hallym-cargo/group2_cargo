import { useState } from "react";

export default function TransportStatus() {
  const [rating, setRating] = useState(0);

  return (
    <div className="status-page">
      <div className="status-container">

        {/* 좌측: 지도 + 진행상태 */}
        <div className="status-left">
          <h2>수도권-영남권 긴급 의약품 운송</h2>

          {/* 지도 영역 */}
          <div className="map-box">
            <p>지도 영역 (카카오맵 / 구글맵 들어갈 자리)</p>
          </div>

          {/* 진행 상태 */}
          <div className="progress">
            <div>✔ 배차 완료</div>
            <div>🚚 운송 중</div>
            <div>📍 도착 예정</div>
            <div>✅ 배송 완료</div>
          </div>
        </div>

        {/* 우측: 기사 정보 */}
        <div className="status-right">
          <h3>운송 기사 정보</h3>
          <div className="driver-card">
            <p><strong>이름:</strong> 김하늘 기사님</p>
            <p><strong>차량:</strong> 5톤 냉장 트럭</p>
            <p><strong>전화:</strong> 010-1234-5678</p>
          </div>

          <div className="eta-box">
            <p>도착 예정 시간: <strong>14:25</strong></p>
            <p>남은 거리: <strong>42.8km</strong></p>
          </div>
        </div>

      </div>

      {/* 하단 영역 */}
      <div className="status-bottom">

        {/* 별점 */}
        <div className="rating-box">
          <h3>운송 평가</h3>
          <div className="stars">
            {[1,2,3,4,5].map((star) => (
              <span
                key={star}
                onClick={() => setRating(star)}
                style={{
                  cursor: "pointer",
                  color: star <= rating ? "#ffd700" : "#ccc",
                  fontSize: "24px"
                }}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        {/* 버튼 */}
        <div className="action-buttons">
          <button className="btn settle">정산하기</button>
          <button className="btn complete">운행 완료</button>
        </div>

      </div>
    </div>
  );
}