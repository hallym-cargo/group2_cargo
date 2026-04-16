import SectionTitle from '../../../components/common/SectionTitle'
import { statusText, formatMinutesToHourMinute } from '../../../utils/formatters'

export default function UserBookmarksTab({ controller }) {
  const { bookmarks, setSelectedId, setDashboardTab } = controller
  return (
    <div className="surface table-surface">
      <SectionTitle title="관심 화물 목록" />
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
            {bookmarks.map(item =>
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
