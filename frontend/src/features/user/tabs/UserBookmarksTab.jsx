import SectionTitle from '../../../components/common/SectionTitle'
import { statusText, formatMinutesToHourMinute } from '../../../utils/formatters'
import { useState, useMemo } from 'react'

export default function UserBookmarksTab({ controller }) {
  const { bookmarks, setSelectedId, setDashboardTab } = controller

  const [statusFilter, setStatusFilter] = useState('ALL')

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(item => {
      if (statusFilter === 'ALL') return true
      return item.status === statusFilter
    })
  }, [bookmarks, statusFilter])

  return (
    <div className="surface table-surface">
      <div className="table-head">
        <div className="table-head-row">
          <SectionTitle title="관심 화물 목록" />

          <div className="board-filter driver">
            <button
              className={statusFilter === 'ALL' ? 'active' : ''}
              onClick={() => setStatusFilter('ALL')}
            >
              전체
            </button>

            <button
              className={statusFilter === 'BIDDING' ? 'active' : ''}
              onClick={() => setStatusFilter('BIDDING')}
            >
              입찰중
            </button>

            <button
              className={statusFilter === 'IN_TRANSIT' ? 'active' : ''}
              onClick={() => setStatusFilter('IN_TRANSIT')}
            >
              운반중
            </button>

            <button
              className={statusFilter === 'CONFIRMED' ? 'active' : ''}
              onClick={() => setStatusFilter('CONFIRMED')}
            >
              확정
            </button>

            <button
              className={statusFilter === 'COMPLETED' ? 'active' : ''}
              onClick={() => setStatusFilter('COMPLETED')}
            >
              완료
            </button>
          </div>
        </div>
      </div>
      <div className="bookmark-table-wrap">
        <table className="board-table">
          <thead>
            <tr>
              <th>상태</th>
              <th>배차명</th>
              <th>구간</th>
              <th>차주</th>
              <th>예상</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookmarks.map(item =>
              <tr key={item.id} onClick={() => { setSelectedId(item.id); setDashboardTab('board') }}>
                <td>
                  <span className={`badge badge-${item.status.toLowerCase()}`}>
                    {statusText(item.status)}
                  </span>
                </td>
                <td>{item.title}</td>
                <td>{item.originAddress} → {item.destinationAddress}</td>
                <td>{item.assignedDriverName || '-'}</td>
                {/* <td>{item.tracking?.remainingMinutes ?? item.estimatedMinutes}분</td> */}
                <td>
                  {formatMinutesToHourMinute(
                    item.tracking?.remainingMinutes ?? item.estimatedMinutes
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
