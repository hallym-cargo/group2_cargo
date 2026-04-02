export const roleText = (role) => ({ SHIPPER: '화주', DRIVER: '차주', ADMIN: '관리자' }[role] || role)
export const statusText = (status) => ({ REQUESTED: '요청', BIDDING: '입찰중', CONFIRMED: '확정', IN_TRANSIT: '운반중', COMPLETED: '완료', CANCELLED: '취소', DISPUTED: '분쟁' }[status] || status)
export const memberStatusText = (status) => ({ ACTIVE: '정상', PENDING: '대기', SUSPENDED: '정지', DELETED: '삭제' }[status] || status)
export const inquiryStatusText = (status) => ({ RECEIVED: '접수', ANSWERED: '답변완료', CLOSED: '종결' }[status] || status)
export const formatCurrency = (value) => value == null ? '-' : `${Number(value).toLocaleString('ko-KR')}원`
export const formatDate = (value) => value ? new Date(value).toLocaleString('ko-KR', { hour12: false }) : '-'
export const transactionTypeText = (type) => ({ SPEND: '지출', EARN: '수익', FEE: '수수료' }[type] || type)
export const renderStars = (score = 0) => '★'.repeat(score) + '☆'.repeat(Math.max(0, 5 - score))
export const formatRatingSummary = (avg, count) => count ? `${Number(avg || 0).toFixed(1)}점 (${count}명)` : '평점 없음'

export const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve({ dataUrl: reader.result, name: file.name })
  reader.onerror = reject
  reader.readAsDataURL(file)
})
