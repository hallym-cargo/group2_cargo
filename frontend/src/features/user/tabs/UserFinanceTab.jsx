import SectionTitle from '../../../components/common/SectionTitle'
import { formatCurrency, formatDate, transactionTypeText } from '../../../utils/formatters'

export default function UserFinanceTab({ controller }) {
  const { auth, financeSummary, financeTransactions } = controller
  if (!financeSummary) return null

  return (
    <div className="page-stack"><div className="kpi-grid">{auth.role === 'SHIPPER' ? <><div className="kpi-card"><span>총 사용 금액</span><strong>{formatCurrency(financeSummary.totalSpent)}</strong><p>완료 정산 기준 누적</p></div><div className="kpi-card"><span>지불 수수료</span><strong>{formatCurrency(0)}</strong><p>수수료는 차주 정산 금액에서만 차감됩니다.</p></div><div className="kpi-card"><span>완료 배차</span><strong>{financeSummary.completedShipmentCount}건</strong></div><div className="kpi-card"><span>거래 건수</span><strong>{financeSummary.transactionCount}건</strong></div></> : <><div className="kpi-card"><span>총 수익 원금</span><strong>{formatCurrency(financeSummary.totalGrossEarned)}</strong><p>수수료 차감 전</p></div><div className="kpi-card"><span>실수익</span><strong>{formatCurrency(financeSummary.totalNetEarned)}</strong><p>{financeSummary.serviceFeeRate}% 수수료 차감 후</p></div><div className="kpi-card"><span>차감 수수료</span><strong>{formatCurrency(financeSummary.totalFeePaid)}</strong></div><div className="kpi-card"><span>완료 운행</span><strong>{financeSummary.completedShipmentCount}건</strong></div></>}</div><div className="surface"><SectionTitle title={auth.role === 'SHIPPER' ? '지출 내역' : '정산 내역'} desc={auth.role === 'SHIPPER' ? '화주는 확정된 운임 총액만 결제하며, 플랫폼 수수료는 차주 정산 금액에서만 차감됩니다.' : '차주는 거래 원금, 수수료, 실제 정산 금액을 한 번에 확인합니다.'} /><table className="board-table compact"><thead><tr><th>유형</th><th>화물</th><th>거래액</th><th>수수료</th><th>최종 반영액</th><th>일시</th></tr></thead><tbody>{financeTransactions.map(item => <tr key={item.id}><td>{transactionTypeText(item.type)}</td><td>{item.shipmentTitle || '-'}<small>#{item.shipmentId || '-'}</small></td><td>{formatCurrency(item.grossAmount)}</td><td>{formatCurrency(item.feeAmount)}</td><td>{formatCurrency(item.netAmount)}</td><td>{formatDate(item.createdAt)}</td></tr>)}</tbody></table></div></div>
  )
}
