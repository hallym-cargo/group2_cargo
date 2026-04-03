import { useState } from 'react'

export default function TransportStatus({ onBack }) {
  const [rating, setRating] = useState(0)

  return (
    <div className="transport-status-page">
      <div className="transport-status-shell">
        <div className="transport-status-header">
          <div>
            <div className="eyebrow">TRANSPORT STATUS</div>
            <h1>수도권-영남권 긴급 의약품 운송</h1>
            <p>기사 정보, 도착 예정 시간, 진행 단계를 한 화면에서 확인할 수 있는 상태 페이지입니다.</p>
          </div>
          <button className="btn btn-ghost" onClick={() => onBack?.()}>이전으로</button>
        </div>

        <div className="transport-status-grid">
          <section className="surface transport-status-main">
            <div className="transport-status-map">
              지도 영역 (카카오맵 / 구글맵 연결 예정)
            </div>

            <div className="transport-status-steps">
              <div className="transport-step is-done">배차 완료</div>
              <div className="transport-step is-active">운송 중</div>
              <div className="transport-step">도착 예정</div>
              <div className="transport-step">배송 완료</div>
            </div>
          </section>

          <aside className="surface transport-status-side">
            <Section title="운송 기사 정보">
              <InfoRow label="이름" value="김하늘 기사님" />
              <InfoRow label="차량" value="5톤 냉장 트럭" />
              <InfoRow label="전화" value="010-1234-5678" />
            </Section>

            <Section title="실시간 정보">
              <InfoRow label="도착 예정 시간" value="14:25" />
              <InfoRow label="남은 거리" value="42.8km" />
            </Section>
          </aside>
        </div>

        <div className="transport-status-bottom">
          <section className="surface transport-rating-box">
            <Section title="운송 평가">
              <div className="transport-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={star <= rating ? 'transport-star is-active' : 'transport-star'}
                    onClick={() => setRating(star)}
                    aria-label={`${star}점`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </Section>
          </section>

          <section className="surface transport-action-box">
            <Section title="운행 처리">
              <div className="transport-actions">
                <button className="btn btn-ghost">정산하기</button>
                <button className="btn btn-primary">운행 완료</button>
              </div>
            </Section>
          </section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="transport-section">
      <h3>{title}</h3>
      {children}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="transport-info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
