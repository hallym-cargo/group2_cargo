import { useEffect, useMemo } from "react"
import { formatCurrency, formatDate, transactionTypeText } from "../../utils/formatters"
import "./ReceiptModal.css"

function ReceiptField({ label, value, strong = false }) {
  return (
    <div className="receipt-field">
      <span>{label}</span>
      <strong className={strong ? 'is-strong' : ''}>{value || '-'}</strong>
    </div>
  )
}

function SimpleBarcode({ value = '000000' }) {
  const bars = useMemo(() => {
    const safeValue = String(value || '000000')
    const patterns = {
      '0': '101001101101',
      '1': '110100101011',
      '2': '101100101011',
      '3': '110110010101',
      '4': '101001101011',
      '5': '110100110101',
      '6': '101100110101',
      '7': '101001011011',
      '8': '110100101101',
      '9': '101100101101',
      A: '110101001011',
      B: '101101001011',
      C: '110110100101',
      D: '101011001011',
      E: '110101100101',
      F: '101101100101',
      G: '101010011011',
      H: '110101001101',
      I: '101101001101',
      J: '101011001101',
      K: '110101010011',
      L: '101101010011',
      M: '110110101001',
      N: '101011010011',
      O: '110101101001',
      P: '101101101001',
      Q: '101010110011',
      R: '110101011001',
      S: '101101011001',
      T: '101011011001',
      U: '110010101011',
      V: '100110101011',
      W: '110011010101',
      X: '100101101011',
      Y: '110010110101',
      Z: '100110110101',
      '-': '100101011011',
      '.': '110010101101',
      ' ': '100110101101',
      '$': '100100100101',
      '/': '100100101001',
      '+': '100101001001',
      '%': '101001001001',
      '*': '100101101101',
    }

    const encoded = `*${safeValue.toUpperCase().replace(/[^0-9A-Z\-\.\ $\/\+%]/g, '')}*`
    return encoded
      .split('')
      .map((char) => patterns[char] || patterns['0'])
      .join('0')
      .split('')
      .map((bit, index) => ({
        key: `${charKey(encoded, index)}-${index}`,
        active: bit === '1',
      }))
  }, [value])

  return (
    <div className="receipt-barcode" aria-label="영수증 바코드">
      <svg width="100%" height="72" viewBox={`0 0 ${bars.length * 2} 72`} preserveAspectRatio="none" role="img">
        <rect x="0" y="0" width={bars.length * 2} height="72" fill="#fff" />
        {bars.map((bar, index) =>
          bar.active ? <rect key={bar.key} x={index * 2} y="0" width="2" height="58" fill="#111" /> : null,
        )}
      </svg>
      <p className="receipt-barcode__label">{value || '000000'}</p>
    </div>
  )
}

function charKey(text, index) {
  return text[Math.floor(index / 13)] || 'b'
}

export default function ReceiptModal({ open, data, isLoading, error, onClose, role = "SHIPPER" }) {
  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="receipt-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="영수증 상세"
      >
        <button type="button" className="receipt-modal__close" onClick={onClose} aria-label="닫기">
          ×
        </button>

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
            <div className={`receipt-summary-card receipt-summary-card--${role === 'DRIVER' ? 'driver' : 'shipper'}`}>
              <div>
                <span>영수증 번호</span>
                <strong>{data?.receiptNumber || '-'}</strong>
              </div>
              <div>
                <span>거래 일시</span>
                <strong>{formatDate(data?.createdAt)}</strong>
              </div>
            </div>

            <div className="receipt-grid">
              <ReceiptField label="화물명" value={data?.shipmentTitle} strong />
              <ReceiptField label="거래 유형" value={transactionTypeText(data?.transactionType)} />
              <ReceiptField label="출발지" value={data?.originAddress} />
              <ReceiptField label="도착지" value={data?.destinationAddress} />
              <ReceiptField label="화주" value={data?.shipperName} />
              <ReceiptField label="차주" value={data?.driverName} />
              <ReceiptField label="거래액" value={formatCurrency(data?.grossAmount)} />
              <ReceiptField label="수수료" value={formatCurrency(data?.feeAmount)} />
              <ReceiptField label="최종 반영액" value={formatCurrency(data?.netAmount)} strong />
              <ReceiptField label="설명" value={data?.description} />
            </div>

            <SimpleBarcode value={data?.receiptNumber || '000000'} />
          </>
        )}

        <div className="receipt-modal__footer">
          <button type="button" className="receipt-modal__button" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  )
}
