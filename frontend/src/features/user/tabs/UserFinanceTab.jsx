import { useState } from "react"
import SectionTitle from "../../../components/common/SectionTitle"
import { formatCurrency, formatDate, transactionTypeText } from "../../../utils/formatters"
import ReceiptModal from "../../../components/common/ReceiptModal"
import { fetchReceipt } from "../../../api"

export default function UserFinanceTab({ controller }) {
  const { auth, financeSummary, financeTransactions } = controller

  const [receiptOpen, setReceiptOpen] = useState(false)
  const [receiptLoading, setReceiptLoading] = useState(false)
  const [receiptError, setReceiptError] = useState("")
  const [selectedReceipt, setSelectedReceipt] = useState(null)

  const handleRowClick = async (shipmentId) => {
    if (!shipmentId) return

    setReceiptOpen(true)
    setReceiptLoading(true)
    setReceiptError("")
    setSelectedReceipt(null)

    try {
      const data = await fetchReceipt(shipmentId)
      setSelectedReceipt(data)
    } catch (e) {
      console.error("영수증 조회 실패", e)
      setReceiptError("영수증을 불러오지 못했습니다.")
    } finally {
      setReceiptLoading(false)
    }
  }

  const handleClose = () => {
    setReceiptOpen(false)
    setReceiptLoading(false)
    setReceiptError("")
    setSelectedReceipt(null)
  }

  if (!financeSummary) return null

  return (
    <div className="page-stack">
      <div className="kpi-grid">
        {auth.role === "SHIPPER" ? (
          <>
            <div className="kpi-card"><span>총 사용 금액</span><strong>{formatCurrency(financeSummary.totalSpent)}</strong><p>완료 정산 기준 누적</p></div>
            <div className="kpi-card"><span>지불 수수료</span><strong>{formatCurrency(0)}</strong><p>수수료는 차주 정산 금액에서만 차감됩니다.</p></div>
            <div className="kpi-card"><span>완료 배차</span><strong>{financeSummary.completedShipmentCount}건</strong></div>
            <div className="kpi-card"><span>거래 건수</span><strong>{financeSummary.transactionCount}건</strong></div>
          </>
        ) : (
          <>
            <div className="kpi-card"><span>총 수익 원금</span><strong>{formatCurrency(financeSummary.totalGrossEarned)}</strong><p>수수료 차감 전</p></div>
            <div className="kpi-card"><span>실수익</span><strong>{formatCurrency(financeSummary.totalNetEarned)}</strong><p>{financeSummary.serviceFeeRate}% 수수료 차감 후</p></div>
            <div className="kpi-card"><span>차감 수수료</span><strong>{formatCurrency(financeSummary.totalFeePaid)}</strong></div>
            <div className="kpi-card"><span>완료 운행</span><strong>{financeSummary.completedShipmentCount}건</strong></div>
          </>
        )}
      </div>

      <div className="surface">
        <SectionTitle
          title={auth.role === "SHIPPER" ? "지출 내역" : "정산 내역"}
          desc={
            auth.role === "SHIPPER"
              ? "화주는 확정된 운임 총액만 결제하며, 플랫폼 수수료는 차주 정산 금액에서만 차감됩니다."
              : "차주는 거래 원금, 수수료, 실제 정산 금액을 한 번에 확인합니다."
          }
        />

        <table className="board-table compact">
          <thead>
            <tr>
              <th>유형</th>
              <th>화물</th>
              <th>거래액</th>
              <th>수수료</th>
              <th>최종 반영액</th>
              <th>일시</th>
            </tr>
          </thead>

          <tbody>
            {financeTransactions.map((item) => (
              <tr
                key={item.id}
                className={item.shipmentId ? "receipt-row" : ""}
                onClick={() => handleRowClick(item.shipmentId)}
                style={{ cursor: item.shipmentId ? "pointer" : "default" }}
              >
                <td>{transactionTypeText(item.type)}</td>
                <td>
                  {item.shipmentTitle || "-"}
                  <small>#{item.shipmentId || "-"}</small>
                </td>
                <td>{formatCurrency(item.grossAmount)}</td>
                <td>{formatCurrency(item.feeAmount)}</td>
                <td>{formatCurrency(item.netAmount)}</td>
                <td>{formatDate(item.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ReceiptModal
        open={receiptOpen}
        data={selectedReceipt}
        isLoading={receiptLoading}
        error={receiptError}
        onClose={handleClose}
        role={auth?.role}
      />
    </div>
  )
}