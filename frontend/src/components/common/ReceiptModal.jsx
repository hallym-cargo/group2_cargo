import { useEffect } from "react"
import Barcode from "react-barcode"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { QRCodeCanvas } from "qrcode.react"
import { formatCurrency, formatDate, transactionTypeText } from "../../utils/formatters"
import { getReceiptPdfUrl } from "../../api"
import "./ReceiptModal.css"

function ReceiptField({ label, value, strong = false }) {
  return (
    <div className="receipt-field">
      <span>{label}</span>
      <strong className={strong ? "is-strong" : ""}>{value || "-"}</strong>
    </div>
  )
}

export default function ReceiptModal({
  open,
  data,
  isLoading,
  error,
  onClose,
  role = "SHIPPER",
}) {
  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleEscape)
    }
  }, [open, onClose])

  const handlePrint = async () => {
    if (!data) return

    const element = document.getElementById("receipt-content")
    if (!element) return

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      const imgWidth = pageWidth - margin * 2
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      if (imgHeight <= pageHeight - margin * 2) {
        pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight)
      } else {
        let heightLeft = imgHeight
        let position = margin

        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight)
        heightLeft -= pageHeight - margin * 2

        while (heightLeft > 0) {
          position = heightLeft - imgHeight + margin
          pdf.addPage()
          pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight)
          heightLeft -= pageHeight - margin * 2
        }
      }

      pdf.save(`receipt-${data.receiptNumber || "download"}.pdf`)
    } catch (err) {
      console.error("인쇄용 PDF 생성 실패:", err)
      alert("PDF 생성에 실패했습니다.")
    }
  }

  if (!open) return null

  const shipmentId = data?.shipmentId
  const pdfDownloadUrl = shipmentId ? getReceiptPdfUrl(shipmentId) : ""
  const isDriver = role === "DRIVER"

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="receipt-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="영수증 상세"
      >
        <button
          type="button"
          className="receipt-modal__close"
          onClick={onClose}
          aria-label="닫기"
        >
          ×
        </button>

        <div id="receipt-content" className="receipt-modal__content">
          <div className="receipt-modal__header">
            <p className="receipt-modal__eyebrow">TRANSACTION RECEIPT</p>
            <h2>영수증</h2>
            <p className="receipt-modal__sub">거래 상세 내역을 확인하세요.</p>
          </div>

          {isLoading ? (
            <div className="receipt-modal__state">
              <div className="receipt-spinner" />
              <p>영수증을 불러오는 중입니다...</p>
            </div>
          ) : error ? (
            <div className="receipt-modal__state is-error">
              <p>{error}</p>
            </div>
          ) : (
            <>
              <div
                className={`receipt-summary-card receipt-summary-card--${
                  isDriver ? "driver" : "shipper"
                }`}
              >
                <div>
                  <span>영수증 번호</span>
                  <strong>{data?.receiptNumber || "-"}</strong>
                </div>
                <div>
                  <span>거래 일시</span>
                  <strong>{formatDate(data?.createdAt)}</strong>
                </div>
              </div>

              <div className="receipt-actions">
                <button
                  type="button"
                  className={`receipt-print-btn receipt-print-btn--${
                    isDriver ? "driver" : "shipper"
                  }`}
                  onClick={handlePrint}
                >
                  인쇄하기
                </button>
              </div>

              <div className="receipt-grid">
                <ReceiptField label="화물명" value={data?.shipmentTitle} strong />
                <ReceiptField
                  label="거래 유형"
                  value={transactionTypeText(data?.transactionType)}
                />
                <ReceiptField label="출발지" value={data?.originAddress} />
                <ReceiptField label="도착지" value={data?.destinationAddress} />
                <ReceiptField label="화주" value={data?.shipperName} />
                <ReceiptField label="차주" value={data?.driverName} />
                <ReceiptField label="거래액" value={formatCurrency(data?.grossAmount)} />
                <ReceiptField label="수수료" value={formatCurrency(data?.feeAmount)} />
                <ReceiptField label="최종 반영액" value={formatCurrency(data?.netAmount)} strong />
                <ReceiptField label="설명" value={data?.description} />
              </div>

              <div className="receipt-code-section">
                <div className="receipt-qr-box">
                  <p className="receipt-code-title">QR 스캔으로 PDF 다운로드</p>
                  {pdfDownloadUrl ? (
                    <QRCodeCanvas
                      value={pdfDownloadUrl}
                      size={112}
                      includeMargin={true}
                    />
                  ) : (
                    <p className="receipt-code-empty">QR을 생성할 수 없습니다.</p>
                  )}
                </div>

                <div className="receipt-barcode-box">
                  <p className="receipt-code-title">영수증 식별 바코드</p>
                  <div className="receipt-barcode">
                    <Barcode
                      value={data?.receiptNumber || "000000"}
                      format="CODE128"
                      width={1.5}
                      height={52}
                      fontSize={12}
                      displayValue={false}
                      margin={0}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}