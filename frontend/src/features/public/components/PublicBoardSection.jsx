import SectionTitle from '../../../components/common/SectionTitle'
import { formatCurrency, formatDate, statusText } from '../../../utils/formatters'

export default function PublicBoardSection({ controller }) {
  const { publicStatusFilter, setPublicStatusFilter, publicBoard, publicSelectedId, setPublicSelectedId, selectedPublic } = controller

  return (
    <section className="board-block" id="board">
      <SectionTitle
        eyebrow="PUBLIC BOARD"
        title="로그인 전 공개 배차 보드"
        desc="실제 서비스를 처음 보는 사용자도 한눈에 흐름을 파악할 수 있도록 게시판 중심으로 설계했습니다."
        action={<div className="chip-group">{['ALL', 'BIDDING', 'CONFIRMED', 'IN_TRANSIT', 'COMPLETED'].map((status) => <button key={status} className={publicStatusFilter === status ? 'chip active' : 'chip'} onClick={() => setPublicStatusFilter(status)}>{status === 'ALL' ? '전체' : statusText(status)}</button>)}</div>}
      />
      <div className="public-board-grid">
        <div className="surface table-surface">
          <table className="board-table">
            <thead>
              <tr><th>상태</th><th>배차명</th><th>출발지</th><th>도착지</th><th>현재 위치</th><th>입찰 / 최저가</th><th>남은 시간</th></tr>
            </thead>
            <tbody>
              {publicBoard.map((item) => (
                <tr key={item.id} className={publicSelectedId === item.id ? 'is-selected' : ''} onClick={() => setPublicSelectedId(item.id)}>
                  <td><span className={`badge badge-${item.status.toLowerCase()}`}>{statusText(item.status)}</span></td>
                  <td><strong>{item.title}</strong><small>{item.cargoType} · {item.weightKg || 0}kg</small></td>
                  <td>{item.originSummary}</td>
                  <td>{item.destinationSummary}</td>
                  <td>{item.currentLocationSummary}</td>
                  <td>{item.offerCount}건 / {formatCurrency(item.bestOfferPrice)}</td>
                  <td>{item.estimatedMinutes}분</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="surface detail-surface">
          {selectedPublic ? (
            <>
              <div className="detail-head">
                <div><div className="eyebrow">LIVE SNAPSHOT</div><h3>{selectedPublic.title}</h3></div>
                <span className={`badge badge-${selectedPublic.status.toLowerCase()}`}>{statusText(selectedPublic.status)}</span>
              </div>
              <div className="detail-stat-grid">
                <div><span>출발지</span><strong>{selectedPublic.originSummary}</strong></div>
                <div><span>도착지</span><strong>{selectedPublic.destinationSummary}</strong></div>
                <div><span>현재 위치</span><strong>{selectedPublic.currentLocationSummary}</strong></div>
                <div><span>최저 제안가</span><strong>{formatCurrency(selectedPublic.bestOfferPrice)}</strong></div>
              </div>
              <div className="list-stack tight">
                <div className="list-row"><span>예상 거리 / 시간</span><strong>{selectedPublic.estimatedDistanceKm}km · {selectedPublic.estimatedMinutes}분</strong></div>
                <div className="list-row"><span>배정 차주</span><strong>{selectedPublic.assignedDriverName || '미확정'}</strong></div>
                <div className="list-row"><span>최근 갱신</span><strong>{formatDate(selectedPublic.updatedAt)}</strong></div>
              </div>
            </>
          ) : <div className="empty-box">표시할 배차가 없습니다.</div>}
        </div>
      </div>
    </section>
  )
}
