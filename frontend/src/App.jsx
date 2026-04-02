import { useEffect, useMemo, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client/dist/sockjs'
import KakaoMapView from './components/KakaoMapView'
import ShipmentLocationPicker from './components/ShipmentLocationPicker'
import {
  API_BASE_URL,
  acceptOffer,
  answerAdminInquiry,
  completeTrip,
  createAdminFaq,
  createAdminNotice,
  createInquiry,
  createOffer,
  createShipment,
  deleteAdminFaq,
  deleteAdminNotice,
  fetchAdminActionLogs,
  fetchAdminDashboard,
  fetchAdminDisputes,
  fetchAdminFaqs,
  fetchAdminInquiries,
  fetchAdminMembers,
  fetchAdminNotices,
  fetchAdminReports,
  fetchAdminShipments,
  fetchBookmarks,
  fetchPublicOverview,
  fetchShipment,
  fetchShipments,
  forceShipmentStatus,
  fetchFinanceSummary,
  fetchFinanceTransactions,
  fetchRatingsDashboard,
  createRating,
  fetchAdminRecentRatings,
  fetchMyProfile,
  updateMyProfile,
  login,
  resolveAdminDispute,
  signup,
  startTrip,
  toggleBookmark,
  updateAdminFaq,
  updateAdminNotice,
  updateMemberRole,
  updateMemberStatus,
} from './api'

const emptyShipment = {
  title: '', cargoType: '', weightKg: '', description: '',
  originAddress: '', originLat: 37.5665, originLng: 126.978,
  destinationAddress: '', destinationLat: 37.4979, destinationLng: 127.0276,
  cargoImageDataUrls: [], cargoImageNames: [],
}
const emptySignup = { email: '', password: '', name: '', role: 'SHIPPER', companyName: '', vehicleType: '', phone: '' }
const emptyInquiry = { companyName: '', contactName: '', email: '', phone: '', inquiryType: '도입 문의', message: '' }
const emptyNotice = { category: '플랫폼 공지', title: '', summary: '', pinned: false }
const emptyFaq = { category: '이용 안내', question: '', answer: '', sortOrder: 1 }

const roleText = (role) => ({ SHIPPER: '화주', DRIVER: '차주', ADMIN: '관리자' }[role] || role)
const statusText = (status) => ({ REQUESTED: '요청', BIDDING: '입찰중', CONFIRMED: '확정', IN_TRANSIT: '운반중', COMPLETED: '완료', CANCELLED: '취소', DISPUTED: '분쟁' }[status] || status)
const memberStatusText = (status) => ({ ACTIVE: '정상', PENDING: '대기', SUSPENDED: '정지', DELETED: '삭제' }[status] || status)
const inquiryStatusText = (status) => ({ RECEIVED: '접수', ANSWERED: '답변완료', CLOSED: '종결' }[status] || status)
const formatCurrency = (value) => value == null ? '-' : `${Number(value).toLocaleString('ko-KR')}원`
const formatDate = (value) => value ? new Date(value).toLocaleString('ko-KR', { hour12: false }) : '-'
const transactionTypeText = (type) => ({ SPEND: '지출', EARN: '수익', FEE: '수수료' }[type] || type)
const renderStars = (score = 0) => '★'.repeat(score) + '☆'.repeat(Math.max(0, 5 - score))
const formatRatingSummary = (avg, count) => count ? `${Number(avg || 0).toFixed(1)}점 (${count}명)` : '평점 없음'

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve({ dataUrl: reader.result, name: file.name })
  reader.onerror = reject
  reader.readAsDataURL(file)
})

const roleThemeMeta = {
  SHIPPER: {
    label: '화주 워크스페이스',
    accent: 'shipper',
    tone: '신뢰감 있는 네이비와 코발트 계열',
    summary: '요청 생성, 입찰 비교, 확정 판단에 집중한 색감입니다.',
    bullets: ['등록 후 입찰이 몰린 배차를 빠르게 확인', '확정 전 가격 비교와 메시지 검토', '도착 예정과 완료 전환 시점을 안정적으로 확인'],
  },
  DRIVER: {
    label: '차주 워크스페이스',
    accent: 'driver',
    tone: '주행감이 느껴지는 틸과 그린 계열',
    summary: '이동 흐름, 진행률, 남은 시간을 바로 읽기 쉬운 색감입니다.',
    bullets: ['입찰 가능한 배차를 빠르게 확인', '운행중 건은 ETA와 자동 주행 상태 우선 표시', '완료 가능 시점을 시각적으로 강조'],
  },
  ADMIN: {
    label: '관리자 워크스페이스',
    accent: 'admin',
    tone: '운영 콘솔에 맞는 바이올렛과 슬레이트 계열',
    summary: '리스크, 문의, 분쟁, 전체 운영 상황을 빠르게 판별하는 색감입니다.',
    bullets: ['미답변 문의와 분쟁을 우선 큐로 분리', '운영 액션 로그와 실시간 운행을 동시에 확인', '회원과 화물을 한 화면에서 강제 조정'],
  },
}

function buildUserAlerts(role, shipments, selected) {
  const live = shipments.filter(item => item.status === 'IN_TRANSIT' || item.status === 'CONFIRMED')
  const bidding = shipments.filter(item => item.status === 'BIDDING')
  if (role === 'SHIPPER') {
    return [
      { title: '입찰 검토가 필요한 배차', value: `${bidding.length}건`, desc: '제안이 모이는 배차를 먼저 비교해 보세요.' },
      { title: '운행중 / 확정 건', value: `${live.length}건`, desc: '도착 예정이 가까운 순서로 확인하는 것이 좋습니다.' },
      { title: '현재 선택 배차', value: selected ? statusText(selected.status) : '선택 없음', desc: selected ? `${selected.title}` : '보드에서 배차를 선택하면 상세와 지도, 액션이 함께 열립니다.' },
    ]
  }
  const assigned = shipments.filter(item => item.assignedDriverName)
  const completable = shipments.filter(item => item.tracking?.completable)
  return [
    { title: '입찰 가능한 배차', value: `${bidding.length}건`, desc: '입찰중 상태의 공개 배차에 바로 제안할 수 있습니다.' },
    { title: '내가 맡은 운행', value: `${assigned.length}건`, desc: '확정된 건만 운반 시작과 완료 버튼이 열립니다.' },
    { title: '완료 가능 건', value: `${completable.length}건`, desc: '예상 도착 시간이 지난 건만 완료 처리됩니다.' },
  ]
}

function buildAdminAlerts(adminDashboard, reports, disputes, inquiries) {
  if (!adminDashboard) return []
  return [
    { title: '즉시 확인이 필요한 문의', value: `${adminDashboard.pendingInquiries}건`, desc: '미답변 문의는 운영 체감 품질에 바로 영향을 줍니다.' },
    { title: '오픈 신고 / 분쟁', value: `${adminDashboard.openReports + adminDashboard.openDisputes}건`, desc: '운영 리스크는 신고와 분쟁을 함께 보며 대응하는 편이 좋습니다.' },
    { title: '실시간 운행', value: `${adminDashboard.liveShipments}건`, desc: '운행중 건은 관리자 보드에서도 지도와 상태를 함께 확인하세요.' },
    { title: '최근 접수', value: `${(inquiries || []).slice(0, 3).length}건`, desc: (inquiries || [])[0]?.title || '신규 문의가 들어오면 이 영역에 우선 표시됩니다.' },
  ]
}


function ProfilePreviewCard({ title, profile }) {
  if (!profile) return null
  return (
    <div className="surface-sub"> 
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {profile.profileImageUrl ? <img src={profile.profileImageUrl} alt={title} className="image-preview-thumb" style={{ width: 64, height: 64, objectFit: 'cover' }} /> : <div className="identity-mark" style={{ width: 56, height: 56 }}>{(profile.name || '?').slice(0,1)}</div>}
        <div style={{ flex: 1 }}>
          <strong>{title}</strong>
          <div className="section-desc" style={{ marginTop: 4 }}>{profile.name} · {roleText(profile.role)}</div>
          <div className="section-desc" style={{ marginTop: 4 }}>평점 {formatRatingSummary(profile.averageRating, profile.ratingCount)} · 완료 거래 {profile.completedCount || 0}건</div>
          {profile.companyName && <div className="section-desc" style={{ marginTop: 4 }}>회사명: {profile.companyName}</div>}
          {profile.vehicleType && <div className="section-desc" style={{ marginTop: 4 }}>차량 정보: {profile.vehicleType}</div>}
          {profile.bio && <p className="section-desc" style={{ marginTop: 6 }}>{profile.bio}</p>}
          {(profile.contactEmail || profile.contactPhone) && <div className="section-desc" style={{ marginTop: 6 }}>{profile.contactEmail || ''}{profile.contactEmail && profile.contactPhone ? ' · ' : ''}{profile.contactPhone || ''}</div>}
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ eyebrow, title, desc, action }) {
  return (
    <div className="section-title-row">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
        {desc && <p className="section-desc">{desc}</p>}
      </div>
      {action}
    </div>
  )
}

export default function App() {
  const [auth, setAuth] = useState(() => ({
    token: localStorage.getItem('token') || '',
    email: localStorage.getItem('email') || '',
    name: localStorage.getItem('name') || '',
    role: localStorage.getItem('role') || '',
    profileCompleted: localStorage.getItem('profileCompleted') === 'true',
  }))
  const [message, setMessage] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [loginForm, setLoginForm] = useState({ email: 'shipper@test.com', password: '1111' })
  const [signupForm, setSignupForm] = useState(emptySignup)
  const [publicData, setPublicData] = useState({ liveBoard: [], notices: [], faqs: [] })
  const [publicSelectedId, setPublicSelectedId] = useState(null)
  const [publicStatusFilter, setPublicStatusFilter] = useState('ALL')
  const [inquiryForm, setInquiryForm] = useState(emptyInquiry)

  const [shipments, setShipments] = useState([])
  const [bookmarks, setBookmarks] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [dashboardTab, setDashboardTab] = useState('home')
  const [profile, setProfile] = useState(null)
  const [profileForm, setProfileForm] = useState({ bio: '', profileImageUrl: '', paymentMethod: '', contactEmail: '', contactPhone: '' })
  const [shipmentForm, setShipmentForm] = useState(emptyShipment)
  const [offerForm, setOfferForm] = useState({ price: '', message: '' })
  const [shipmentFilter, setShipmentFilter] = useState('ALL')
  const [driverBoardTag, setDriverBoardTag] = useState('ALL')
  const [shipmentKeyword, setShipmentKeyword] = useState('')

  const [adminDashboard, setAdminDashboard] = useState(null)
  const [adminMembers, setAdminMembers] = useState([])
  const [adminShipments, setAdminShipments] = useState([])
  const [adminNotices, setAdminNotices] = useState([])
  const [adminFaqs, setAdminFaqs] = useState([])
  const [adminInquiries, setAdminInquiries] = useState([])
  const [adminReports, setAdminReports] = useState([])
  const [adminDisputes, setAdminDisputes] = useState([])
  const [adminLogs, setAdminLogs] = useState([])
  const [financeSummary, setFinanceSummary] = useState(null)
  const [financeTransactions, setFinanceTransactions] = useState([])
  const [ratingsDashboard, setRatingsDashboard] = useState(null)
  const [adminRecentRatings, setAdminRecentRatings] = useState([])
  const [ratingDrafts, setRatingDrafts] = useState({})
  const [noticeForm, setNoticeForm] = useState(emptyNotice)
  const [faqForm, setFaqForm] = useState(emptyFaq)
  const [completionProof, setCompletionProof] = useState({ dataUrl: '', name: '' })
  const [editingNoticeId, setEditingNoticeId] = useState(null)
  const [editingFaqId, setEditingFaqId] = useState(null)
  const [inquiryAnswerDraft, setInquiryAnswerDraft] = useState({})

  const stompClientRef = useRef(null)
  const isLoggedIn = !!auth.token
  const isAdmin = auth.role === 'ADMIN'
  const roleTheme = useMemo(() => roleThemeMeta[auth.role] || null, [auth.role])

  const publicBoard = useMemo(() => (publicData.liveBoard || []).filter(item => publicStatusFilter === 'ALL' || item.status === publicStatusFilter), [publicData.liveBoard, publicStatusFilter])
  const selectedPublic = useMemo(() => publicData.liveBoard?.find(item => item.id === publicSelectedId) || publicBoard[0] || null, [publicData.liveBoard, publicSelectedId, publicBoard])
  const filteredShipments = useMemo(() => {
    return shipments.filter((item) => {
      const keyword = shipmentKeyword.trim().toLowerCase()
      const byStatus = shipmentFilter === 'ALL' || item.status === shipmentFilter
      let byTag = true

      if (auth.role === 'DRIVER') {
        if (driverBoardTag === 'BIDDING') byTag = item.status === 'BIDDING'
        if (driverBoardTag === 'MY_BIDS') byTag = !!item.hasMyOffer
        if (driverBoardTag === 'MY_ASSIGNED') byTag = !!item.assignedToMe && item.status === 'CONFIRMED'
        if (driverBoardTag === 'MY_TRANSIT') byTag = !!item.assignedToMe && item.status === 'IN_TRANSIT'
      }

      const byKeyword = !keyword || [item.title, item.cargoType, item.originAddress, item.destinationAddress, item.shipperName, item.assignedDriverName].filter(Boolean).some(v => String(v).toLowerCase().includes(keyword))
      return byStatus && byKeyword && byTag
    })
  }, [shipments, shipmentFilter, shipmentKeyword, auth.role, driverBoardTag])
  const summary = useMemo(() => ({
    total: shipments.length,
    bidding: shipments.filter(item => item.status === 'BIDDING').length,
    live: shipments.filter(item => item.status === 'CONFIRMED' || item.status === 'IN_TRANSIT').length,
    completed: shipments.filter(item => item.status === 'COMPLETED').length,
  }), [shipments])
  const userAlerts = useMemo(() => buildUserAlerts(auth.role, shipments, selected), [auth.role, shipments, selected])
  const adminAlerts = useMemo(() => buildAdminAlerts(adminDashboard, adminReports, adminDisputes, adminInquiries), [adminDashboard, adminReports, adminDisputes, adminInquiries])
  const roleQuickActions = useMemo(() => {
    if (auth.role === 'SHIPPER') {
      return [
        { title: '새 화물 등록', desc: '등록 즉시 공개 보드와 입찰 흐름에 반영됩니다.', action: () => setDashboardTab('register'), cta: '등록 이동' },
        { title: '입찰 비교', desc: '입찰중 배차를 모아서 가격과 메시지를 검토합니다.', action: () => { setShipmentFilter('BIDDING'); setDashboardTab('board') }, cta: '보드 보기' },
        { title: '운행 확인', desc: '확정 또는 운행중 상태만 필터링해 ETA 중심으로 봅니다.', action: () => { setShipmentFilter('IN_TRANSIT'); setDashboardTab('board') }, cta: '운행 보기' },
      ]
    }
    return [
      { title: '입찰 가능한 배차', desc: '입찰중 상태의 배차를 바로 찾을 수 있습니다.', action: () => { setShipmentFilter('BIDDING'); setDriverBoardTag('BIDDING'); setDashboardTab('board') }, cta: '입찰 보드' },
      { title: '확정된 운행', desc: '화주가 확정한 건만 운반 시작 버튼이 열립니다.', action: () => { setShipmentFilter('ALL'); setDriverBoardTag('MY_ASSIGNED'); setDashboardTab('board') }, cta: '확정 보기' },
      { title: '주행 가이드', desc: '자동 주행, ETA, 완료 전환 시점을 다시 확인합니다.', action: () => setDashboardTab('register'), cta: '가이드 열기' },
    ]
  }, [auth.role])

  const syncAuth = (data) => {
    localStorage.setItem('token', data.token)
    localStorage.setItem('email', data.email)
    localStorage.setItem('name', data.name)
    localStorage.setItem('role', data.role)
    localStorage.setItem('profileCompleted', String(!!data.profileCompleted))
    setAuth(data)
  }

  const logout = () => {
    localStorage.clear()
    stompClientRef.current?.deactivate()
    stompClientRef.current = null
    setAuth({ token: '', email: '', name: '', role: '', profileCompleted: false })
    setDashboardTab('overview')
    setSelectedId(null)
    setSelected(null)
    setDriverBoardTag('ALL')
    setShipments([])
    setBookmarks([])
    setAdminDashboard(null)
    setAdminMembers([])
    setAdminShipments([])
    setAdminNotices([])
    setAdminFaqs([])
    setAdminInquiries([])
    setAdminReports([])
    setAdminDisputes([])
    setAdminLogs([])
    setFinanceSummary(null)
    setFinanceTransactions([])
    setRatingsDashboard(null)
    setAdminRecentRatings([])
    setCompletionProof({ dataUrl: '', name: '' })
  }

  const loadPublic = async () => {
    const data = await fetchPublicOverview()
    setPublicData(data)
    if (!publicSelectedId && data.liveBoard?.length) setPublicSelectedId(data.liveBoard[0].id)
  }

  const loadShipments = async () => {
    if (!isLoggedIn || isAdmin) return
    const data = await fetchShipments()
    setShipments(data)
    if (!selectedId && data.length) setSelectedId(data[0].id)
  }

  const loadBookmarks = async () => {
    if (!isLoggedIn || isAdmin) return
    setBookmarks(await fetchBookmarks())
  }

  const loadDetail = async (id) => {
    if (!id || !isLoggedIn || isAdmin) return
    const data = await fetchShipment(id)
    setSelected(data)
  }

  const loadAdmin = async () => {
    if (!isLoggedIn || !isAdmin) return
    const [dashboard, members, shipmentsData, notices, faqs, inquiries, reports, disputes, logs] = await Promise.all([
      fetchAdminDashboard(), fetchAdminMembers(), fetchAdminShipments(), fetchAdminNotices(), fetchAdminFaqs(), fetchAdminInquiries(), fetchAdminReports(), fetchAdminDisputes(), fetchAdminActionLogs(),
    ])
    setAdminDashboard(dashboard)
    setAdminMembers(members)
    setAdminShipments(shipmentsData)
    setAdminNotices(notices)
    setAdminFaqs(faqs)
    setAdminInquiries(inquiries)
    setAdminReports(reports)
    setAdminDisputes(disputes)
    setAdminLogs(logs)
  }

  const loadFinance = async () => {
    if (!isLoggedIn) return
    const [summaryData, transactionsData] = await Promise.all([
      fetchFinanceSummary(),
      fetchFinanceTransactions(),
    ])
    setFinanceSummary(summaryData)
    setFinanceTransactions(transactionsData)
  }

  const loadRatings = async () => {
    if (!isLoggedIn) return
    if (isAdmin) {
      setAdminRecentRatings(await fetchAdminRecentRatings())
      return
    }
    setRatingsDashboard(await fetchRatingsDashboard())
  }
  const loadProfile = async () => {
    if (!isLoggedIn || isAdmin) return
    const data = await fetchMyProfile()
    setProfile(data)
    setProfileForm({
      bio: data.bio || '',
      profileImageUrl: data.profileImageUrl || '',
      paymentMethod: data.paymentMethod || '',
      contactEmail: data.contactEmail || '',
      contactPhone: data.contactPhone || '',
    })
  }


  const handleCreateRating = async (shipmentId, counterpartName) => {
    try {
      const draft = ratingDrafts[shipmentId] || { score: 5, comment: '' }
      const score = Number(draft.score || 0)

      if (score < 1 || score > 5) {
        setMessage('평점은 1점부터 5점까지 선택해 주세요.')
        return
      }

      await createRating(shipmentId, {
        score,
        comment: (draft.comment || '').trim(),
      })

      setMessage(`${counterpartName || '상대방'}에게 평점이 등록되었습니다.`)
      setRatingDrafts((prev) => ({
        ...prev,
        [shipmentId]: { score: 5, comment: '' },
      }))
      await loadRatings()
    } catch (err) {
      console.error(err)
      setMessage(err.response?.data?.message || '평가 등록 실패')
    }
  }


  const handleSaveProfile = async () => {
    try {
      const saved = await updateMyProfile(profileForm)
      setProfile(saved)
      const updatedAuth = { ...auth, profileCompleted: !!saved.profileCompleted }
      localStorage.setItem('profileCompleted', String(!!saved.profileCompleted))
      setAuth(updatedAuth)
      setMessage('회원정보가 저장되었습니다.')
      if (dashboardTab === 'overview') {
        // keep on my page after save
      }
    } catch (err) {
      console.error(err)
      setMessage(err.response?.data?.message || '회원정보 저장 실패')
    }
  }

  const handleShipmentImagesChange = async (event) => {
    try {
      const files = Array.from(event.target.files || []).slice(0, 5)
      const converted = await Promise.all(files.map(fileToDataUrl))
      setShipmentForm((prev) => ({
        ...prev,
        cargoImageDataUrls: converted.map((item) => item.dataUrl),
        cargoImageNames: converted.map((item) => item.name),
      }))
    } catch (err) {
      console.error(err)
      setMessage('화물 사진을 읽지 못했습니다.')
    }
  }

  const handleCompletionProofChange = async (event) => {
    try {
      const file = event.target.files?.[0]
      if (!file) {
        setCompletionProof({ dataUrl: '', name: '' })
        return
      }
      const converted = await fileToDataUrl(file)
      setCompletionProof(converted)
    } catch (err) {
      console.error(err)
      setMessage('완료 사진을 읽지 못했습니다.')
    }
  }

  useEffect(() => { loadPublic().catch(() => {}) }, [])
  useEffect(() => {
    const classes = ['theme-public', 'theme-shipper', 'theme-driver', 'theme-admin']
    document.body.classList.remove(...classes)
    document.body.classList.add(isLoggedIn ? `theme-${auth.role.toLowerCase()}` : 'theme-public')
    return () => document.body.classList.remove(...classes)
  }, [isLoggedIn, auth.role])
  useEffect(() => {
    if (!isLoggedIn) return
    if (isAdmin) {
      loadAdmin().catch(err => setMessage(err.response?.data?.message || '관리자 데이터 로드 실패'))
      loadFinance().catch(() => {})
      loadRatings().catch(() => {})
    } else {
      loadShipments().catch(err => setMessage(err.response?.data?.message || '목록 로드 실패'))
      loadBookmarks().catch(() => {})
      loadFinance().catch(() => {})
      loadRatings().catch(() => {})
      loadProfile().catch(() => {})
    }
  }, [isLoggedIn, isAdmin])
  useEffect(() => { if (selectedId && isLoggedIn && !isAdmin) loadDetail(selectedId).catch(err => setMessage(err.response?.data?.message || '상세 로드 실패')) }, [selectedId, isLoggedIn, isAdmin])

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
      reconnectDelay: 4000,
      onConnect: () => {
        client.subscribe('/topic/shipments', () => {
          loadPublic().catch(() => {})
          if (isAdmin) { loadAdmin().catch(() => {}); loadFinance().catch(() => {}); loadRatings().catch(() => {}) }
          else if (isLoggedIn) {
            loadShipments().catch(() => {})
            loadBookmarks().catch(() => {})
            loadFinance().catch(() => {})
            loadRatings().catch(() => {})
            if (selectedId) loadDetail(selectedId).catch(() => {})
          }
        })
        if (selectedId) {
          client.subscribe(`/topic/shipments/${selectedId}`, () => {
            if (!isAdmin && isLoggedIn && selectedId) loadDetail(selectedId).catch(() => {})
          })
        }
      },
    })
    client.activate()
    stompClientRef.current = client
    return () => client.deactivate()
  }, [isLoggedIn, isAdmin, selectedId])

  const handleLogin = async () => {
    try {
      const data = await login(loginForm)
      syncAuth(data)
      setDashboardTab(data.profileCompleted ? 'home' : 'overview')
      setMessage(data.profileCompleted ? '로그인되었습니다. 공개 메인 페이지에서도 역할별 기능으로 이동할 수 있습니다.' : '첫 로그인입니다. 선택 정보만 입력해도 되니 회원정보를 한 번 확인해 주세요.')
    } catch (err) {
      setMessage(err.response?.data?.message || '로그인 실패')
    }
  }
  const handleSignup = async () => {
    try {
      const data = await signup(signupForm)
      syncAuth(data)
      setSignupForm(emptySignup)
      setDashboardTab('overview')
      setMessage('회원가입이 완료되었습니다. 첫 로그인이라 회원정보 수정 페이지로 안내합니다.')
    } catch (err) {
      setMessage(err.response?.data?.message || '회원가입 실패')
    }
  }
  const handleInquiry = async () => {
    try {
      await createInquiry(inquiryForm)
      setInquiryForm(emptyInquiry)
      setMessage('문의가 접수되었습니다.')
      await loadPublic()
    } catch (err) {
      setMessage(err.response?.data?.message || '문의 접수 실패')
    }
  }
  const handleCreateShipment = async () => {
    try {
      const created = await createShipment({
        ...shipmentForm,
        weightKg: Number(shipmentForm.weightKg || 0),
        originLat: Number(shipmentForm.originLat),
        originLng: Number(shipmentForm.originLng),
        destinationLat: Number(shipmentForm.destinationLat),
        destinationLng: Number(shipmentForm.destinationLng),
        cargoImageDataUrls: shipmentForm.cargoImageDataUrls || [],
        cargoImageNames: shipmentForm.cargoImageNames || [],
      })
      setShipmentForm(emptyShipment)
      setDashboardTab('board')
      setSelectedId(created.id)
      setMessage('화물이 등록되었습니다.')
      await loadShipments()
    } catch (err) {
      setMessage(err.response?.data?.message || '화물 등록 실패')
    }
  }
  const handleCreateOffer = async () => {
    try {
      await createOffer(selectedId, { price: Number(offerForm.price), message: offerForm.message })
      setOfferForm({ price: '', message: '' })
      setMessage('입찰 제안이 등록되었습니다.')
      await Promise.all([loadShipments(), loadDetail(selectedId)])
    } catch (err) {
      setMessage(err.response?.data?.message || '입찰 제안 실패')
    }
  }
  const handleAcceptOffer = async (offerId) => {
    try {
      await acceptOffer(offerId)
      setMessage('차주가 확정되었습니다.')
      await Promise.all([loadShipments(), loadDetail(selectedId)])
    } catch (err) {
      setMessage(err.response?.data?.message || '차주 확정 실패')
    }
  }
  const handleStart = async () => {
    try {
      await startTrip(selectedId)
      setMessage('운반이 시작되었습니다.')
      await Promise.all([loadShipments(), loadDetail(selectedId)])
    } catch (err) {
      setMessage(err.response?.data?.message || '운반 시작 실패')
    }
  }
  const handleComplete = async () => {
    try {
      if (!completionProof.dataUrl) {
        setMessage('배송 완료 사진을 먼저 등록해 주세요.')
        return
      }
      await completeTrip(selectedId, {
        completionImageDataUrl: completionProof.dataUrl,
        completionImageName: completionProof.name,
      })
      setCompletionProof({ dataUrl: '', name: '' })
      setMessage('운반이 완료되었습니다.')
      await Promise.all([loadShipments(), loadDetail(selectedId)])
    } catch (err) {
      setMessage(err.response?.data?.message || '완료 처리 실패')
    }
  }
  const handleToggleBookmark = async (shipmentId) => {
    try {
      await toggleBookmark(shipmentId)
      await Promise.all([loadBookmarks(), loadShipments()])
      if (selectedId === shipmentId) await loadDetail(selectedId)
    } catch (err) {
      setMessage(err.response?.data?.message || '즐겨찾기 처리 실패')
    }
  }

  const handleUpdateMember = async (memberId, type, value) => {
    try {
      if (type === 'role') await updateMemberRole(memberId, value)
      else await updateMemberStatus(memberId, value)
      setMessage('회원 정보가 변경되었습니다.')
      await loadAdmin()
    } catch (err) {
      setMessage(err.response?.data?.message || '회원 변경 실패')
    }
  }
  const handleForceShipmentStatus = async (shipmentId, status) => {
    try {
      await forceShipmentStatus(shipmentId, status, '관리자 운영 조정')
      setMessage('화물 상태가 변경되었습니다.')
      await loadAdmin()
    } catch (err) {
      setMessage(err.response?.data?.message || '화물 상태 변경 실패')
    }
  }
  const submitNotice = async () => {
    try {
      if (editingNoticeId) await updateAdminNotice(editingNoticeId, noticeForm)
      else await createAdminNotice(noticeForm)
      setEditingNoticeId(null)
      setNoticeForm(emptyNotice)
      setMessage('공지사항이 저장되었습니다.')
      await Promise.all([loadAdmin(), loadPublic()])
    } catch (err) {
      setMessage(err.response?.data?.message || '공지 저장 실패')
    }
  }
  const submitFaq = async () => {
    try {
      if (editingFaqId) await updateAdminFaq(editingFaqId, { ...faqForm, sortOrder: Number(faqForm.sortOrder) })
      else await createAdminFaq({ ...faqForm, sortOrder: Number(faqForm.sortOrder) })
      setEditingFaqId(null)
      setFaqForm(emptyFaq)
      setMessage('FAQ가 저장되었습니다.')
      await Promise.all([loadAdmin(), loadPublic()])
    } catch (err) {
      setMessage(err.response?.data?.message || 'FAQ 저장 실패')
    }
  }
  const handleAnswerInquiry = async (id) => {
    try {
      await answerAdminInquiry(id, inquiryAnswerDraft[id] || '')
      setMessage('문의 답변이 저장되었습니다.')
      await loadAdmin()
    } catch (err) {
      setMessage(err.response?.data?.message || '문의 답변 실패')
    }
  }
  const handleResolveDispute = async (id, status) => {
    try {
      await resolveAdminDispute(id, status)
      setMessage('분쟁 상태가 변경되었습니다.')
      await loadAdmin()
    } catch (err) {
      setMessage(err.response?.data?.message || '분쟁 처리 실패')
    }
  }

  const renderPublicHome = () => (
      <div className="public-shell">
        <header className="public-header">
          <div className="identity-block">
            <div className="identity-mark">HC</div>
            <div>
              <div className="identity-title">hallym-cargo</div>
              <div className="identity-subtitle">운송 운영 관리 플랫폼</div>
            </div>
          </div>
          <nav className="header-actions">
            <button className="btn btn-ghost" onClick={() => document.getElementById('board')?.scrollIntoView({ behavior: 'smooth' })}>공개 배차</button>
            <button className="btn btn-ghost" onClick={() => document.getElementById('notice-faq')?.scrollIntoView({ behavior: 'smooth' })}>공지 / FAQ</button>
            {isLoggedIn ? <><button className="btn btn-primary" onClick={() => setDashboardTab('overview')}>마이페이지</button><button className="btn btn-secondary" onClick={logout}>로그아웃</button></> : <button className="btn btn-primary" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>{authMode === 'login' ? '회원가입' : '로그인'}</button>}
          </nav>
        </header>

        <section className="hero-grid">
          <div className="hero-panel hero-panel-dark">
            <div className="eyebrow">LOGISTICS OPERATIONS PLATFORM</div>
            <h1>공개 보드부터 화주 · 차주 · 관리자 운영까지 한 화면 흐름으로 연결되는 물류 서비스</h1>
            <p>카카오 개발자 콘솔처럼 단정한 여백, 선명한 두께, 게시판 중심 레이아웃을 적용했습니다. 공개 화면은 신뢰감을 주고, 로그인 이후는 실제 운영에 맞게 역할별로 분기됩니다.</p>
            <div className="hero-kpis">
              <div><span>등록 화주</span><strong>{publicData.totalShippers || 0}</strong></div>
              <div><span>등록 차주</span><strong>{publicData.totalDrivers || 0}</strong></div>
              <div><span>진행중</span><strong>{publicData.liveShipments || 0}</strong></div>
              <div><span>완료 누적</span><strong>{publicData.completedShipments || 0}</strong></div>
            </div>
          </div>
          <div className="hero-panel auth-card">
            {isLoggedIn ? (
              <>
                <SectionTitle eyebrow="ACCOUNT ACCESS" title={`${auth.name}님으로 로그인됨`} desc="로그인한 뒤에도 공개 메인 페이지에 머무를 수 있고, 필요한 순간에만 마이페이지로 이동할 수 있습니다." />
                <div className="list-stack">
                  <div className="list-row block">
                    <strong>{auth.name}</strong>
                    <span>{roleText(auth.role)} · {auth.email}</span>
                  </div>
                  <div className="table-actions">
                    <button className="btn btn-primary" onClick={() => setDashboardTab('overview')}>마이페이지</button>
                    <button className="btn btn-secondary" onClick={logout}>로그아웃</button>
                  </div>
                  {!!message && <div className="alert-info">{message}</div>}
                </div>
              </>
            ) : (
              <>
                <SectionTitle eyebrow="ACCOUNT ACCESS" title={authMode === 'login' ? '운영 계정 로그인' : '회원가입'} desc="샘플 계정: shipper@test.com / driver@test.com / admin@test.com 비밀번호는 모두 1111" />
                <div className="segmented">
                  <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>로그인</button>
                  <button className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>회원가입</button>
                </div>
                {authMode === 'login' ? (
                  <div className="form-stack compact-form">
                    <input placeholder="이메일" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
                    <input type="password" placeholder="비밀번호" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
                    <button className="btn btn-primary" onClick={handleLogin}>로그인</button>
                  </div>
                ) : (
                  <div className="form-stack compact-form">
                    <div className="split-2">
                      <input placeholder="이름" value={signupForm.name} onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })} />
                      <select value={signupForm.role} onChange={(e) => setSignupForm({ ...signupForm, role: e.target.value })}>
                        <option value="SHIPPER">화주</option>
                        <option value="DRIVER">차주</option>
                      </select>
                    </div>
                    <input placeholder="이메일" value={signupForm.email} onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} />
                    <input type="password" placeholder="비밀번호" value={signupForm.password} onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} />
                    <input placeholder="연락처" value={signupForm.phone} onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })} />
                    {signupForm.role === 'SHIPPER' ? <input placeholder="회사명" value={signupForm.companyName} onChange={(e) => setSignupForm({ ...signupForm, companyName: e.target.value })} /> : <input placeholder="차량 종류" value={signupForm.vehicleType} onChange={(e) => setSignupForm({ ...signupForm, vehicleType: e.target.value })} />}
                    <button className="btn btn-primary" onClick={handleSignup}>회원가입</button>
                  </div>
                )}
                {!!message && <div className="alert-info">{message}</div>}
              </>
            )}
          </div>
        </section>

        <section className="board-block" id="board">
          <SectionTitle eyebrow="PUBLIC BOARD" title="로그인 전 공개 배차 보드" desc="실제 서비스를 처음 보는 사용자도 한눈에 흐름을 파악할 수 있도록 게시판 중심으로 설계했습니다." action={<div className="chip-group">{['ALL', 'BIDDING', 'CONFIRMED', 'IN_TRANSIT', 'COMPLETED'].map((status) => <button key={status} className={publicStatusFilter === status ? 'chip active' : 'chip'} onClick={() => setPublicStatusFilter(status)}>{status === 'ALL' ? '전체' : statusText(status)}</button>)}</div>} />
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
                      <td>{item.originSummary}</td><td>{item.destinationSummary}</td><td>{item.currentLocationSummary}</td><td>{item.offerCount}건 / {formatCurrency(item.bestOfferPrice)}</td><td>{item.estimatedMinutes}분</td>
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

        <section className="info-grid" id="notice-faq">
          <div className="surface">
            <SectionTitle title="공지사항" desc="운영/정책/점검 공지를 카드형 게시판으로 배치했습니다." />
            <div className="list-stack">
              {(publicData.notices || []).map((notice) => (
                <div key={notice.id} className="news-card">
                  <div className="news-head"><span className="tag">{notice.category}</span>{notice.pinned && <span className="tag tag-dark">중요</span>}</div>
                  <strong>{notice.title}</strong>
                  <p>{notice.summary}</p>
                  <small>{formatDate(notice.publishedAt)}</small>
                </div>
              ))}
            </div>
          </div>
          <div className="surface">
            <SectionTitle title="FAQ" desc="회원가입 전 자주 확인하는 질문을 깔끔한 아코디언 구조로 제공합니다." />
            <div className="faq-stack">
              {(publicData.faqs || []).map((faq) => (
                <details key={faq.id} className="faq-card"><summary>{faq.question}</summary><p>{faq.answer}</p></details>
              ))}
            </div>
          </div>
          <div className="surface">
            <SectionTitle title="도입 문의" desc="기업 운영팀이 바로 남길 수 있도록 실제 입력 폼과 저장 구조를 유지했습니다." />
            <div className="form-stack">
              <input placeholder="회사명" value={inquiryForm.companyName} onChange={(e) => setInquiryForm({ ...inquiryForm, companyName: e.target.value })} />
              <div className="split-2">
                <input placeholder="담당자명" value={inquiryForm.contactName} onChange={(e) => setInquiryForm({ ...inquiryForm, contactName: e.target.value })} />
                <input placeholder="연락처" value={inquiryForm.phone} onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })} />
              </div>
              <input placeholder="이메일" value={inquiryForm.email} onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })} />
              <select value={inquiryForm.inquiryType} onChange={(e) => setInquiryForm({ ...inquiryForm, inquiryType: e.target.value })}><option>도입 문의</option><option>데모 요청</option><option>요금 상담</option><option>기술 협의</option></select>
              <textarea rows="5" placeholder="필요한 기능, 권한 구조, 운영 방식 등을 적어주세요." value={inquiryForm.message} onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })} />
              <button className="btn btn-primary" onClick={handleInquiry}>문의 접수</button>
            </div>
          </div>
        </section>
      </div>
  )

  if (!isLoggedIn || dashboardTab === 'home') {
    return renderPublicHome()
  }

  if (isAdmin) {
    const navItems = [
      ['overview', '마이페이지'], ['members', '회원 관리'], ['shipments', '화물 관리'], ['finance', '수익 관리'], ['ratings', '평점 관리'], ['notices', '공지 관리'], ['faqs', 'FAQ 관리'], ['inquiries', '문의 관리'], ['issues', '신고 / 분쟁'],
    ]
    return (
      <div className="console-shell">
        <aside className="console-sidebar">
          <div className="console-logo"><div className="identity-mark">HC</div><div><strong>hallym-cargo</strong><small>Administrator Console</small></div></div>
          <div className="sidebar-profile"><strong>{auth.name}</strong><span>{roleText(auth.role)}</span><small>{auth.email}</small></div>
          <nav className="sidebar-nav">
            <button className="btn btn-ghost block" onClick={() => setDashboardTab('home')}>메인 페이지로 이동</button>
            {navItems.map(([key, label]) => <button key={key} className={dashboardTab === key ? 'nav-link active' : 'nav-link'} onClick={() => setDashboardTab(key)}>{label}</button>)}
          </nav>
          <button className="btn btn-secondary block" onClick={logout}>로그아웃</button>
        </aside>
        <main className="console-main">
          <div className="console-topbar">
            <div>
              <div className="eyebrow">ADMIN CONTROL</div>
              <h1>{dashboardTab === 'overview' ? '마이페이지' : dashboardTab === 'members' ? '회원 관리' : dashboardTab === 'shipments' ? '화물 관리' : dashboardTab === 'finance' ? '수익 관리' : dashboardTab === 'ratings' ? '평점 관리' : dashboardTab === 'notices' ? '공지 관리' : dashboardTab === 'faqs' ? 'FAQ 관리' : dashboardTab === 'inquiries' ? '문의 관리' : '신고 / 분쟁'}</h1>
              <p className="section-desc">바이올렛 계열 테마로 리스크, 문의, 분쟁, 전체 운영 상황을 빠르게 구분하도록 조정했습니다.</p>
            </div>
            <div className="toolbar-inline">
              <span className="role-chip role-chip-admin">관리자 테마</span>
              {!!message && <div className="alert-info slim">{message}</div>}
            </div>
          </div>

          {dashboardTab === 'overview' && adminDashboard && (
            <div className="page-stack">
              <section className="role-banner role-banner-admin">
                <div>
                  <div className="eyebrow">ADMIN WORKSPACE</div>
                  <h2>{roleTheme?.label}</h2>
                  <p>{roleTheme?.summary}</p>
                </div>
                <div className="role-banner-notes">
                  {(roleTheme?.bullets || []).map((item) => <span key={item}>{item}</span>)}
                </div>
              </section>
              <div className="kpi-grid">
                <div className="kpi-card"><span>전체 회원</span><strong>{adminDashboard.totalMembers}</strong></div>
                <div className="kpi-card"><span>화주</span><strong>{adminDashboard.activeShippers}</strong></div>
                <div className="kpi-card"><span>차주</span><strong>{adminDashboard.activeDrivers}</strong></div>
                <div className="kpi-card"><span>실시간 운행</span><strong>{adminDashboard.liveShipments}</strong></div>
                <div className="kpi-card"><span>미답변 문의</span><strong>{adminDashboard.pendingInquiries}</strong></div>
                <div className="kpi-card"><span>오픈 신고</span><strong>{adminDashboard.openReports}</strong></div>
                <div className="kpi-card"><span>오픈 분쟁</span><strong>{adminDashboard.openDisputes}</strong></div>
              </div>
              <div className="admin-grid-2">
                <div className="surface">
                  <SectionTitle title="운영 우선 큐" desc="먼저 처리해야 할 항목을 역할 테마와 함께 묶어서 보여줍니다." />
                  <div className="signal-grid">{adminAlerts.map((item) => <div key={item.title} className="signal-card"><span>{item.title}</span><strong>{item.value}</strong><p>{item.desc}</p></div>)}</div>
                </div>
                <div className="surface">
                  <SectionTitle title="즉시 조치 단축" desc="관리자 운영에서 자주 보는 화면으로 바로 이동합니다." />
                  <div className="shortcut-grid">
                    <button className="shortcut-card" onClick={() => setDashboardTab('inquiries')}><strong>문의 관리</strong><small>미답변 문의와 답변 작성으로 이동</small></button>
                    <button className="shortcut-card" onClick={() => setDashboardTab('issues')}><strong>신고 / 분쟁</strong><small>리스크 항목만 모아서 확인</small></button>
                    <button className="shortcut-card" onClick={() => setDashboardTab('shipments')}><strong>화물 관리</strong><small>상태 강제 조정과 운행 현황 확인</small></button>
                    <button className="shortcut-card" onClick={() => setDashboardTab('members')}><strong>회원 관리</strong><small>권한 / 상태를 한 표에서 조정</small></button>
                  </div>
                </div>
              </div>
              <div className="admin-grid-2">
                <div className="surface"><SectionTitle title="최근 가입 회원" /><table className="board-table compact"><thead><tr><th>이름</th><th>역할</th><th>상태</th><th>등록일</th></tr></thead><tbody>{(adminDashboard.recentMembers || []).map(item => <tr key={item.id}><td>{item.name}<small>{item.email}</small></td><td>{roleText(item.role)}</td><td><span className="badge badge-neutral">{memberStatusText(item.status)}</span></td><td>{formatDate(item.createdAt)}</td></tr>)}</tbody></table></div>
                <div className="surface"><SectionTitle title="최근 운영 로그" /><div className="list-stack">{(adminDashboard.recentActions || []).map(log => <div key={log.id} className="list-row block"><strong>{log.actionType}</strong><span>{log.description}</span><small>{log.adminName} · {formatDate(log.createdAt)}</small></div>)}</div></div>
              </div>
            </div>
          )}

          {dashboardTab === 'members' && (
            <div className="surface">
              <SectionTitle title="회원 관리" desc="역할 변경과 계정 상태 관리를 한 표에서 처리합니다." />
              <table className="board-table compact"><thead><tr><th>회원</th><th>역할</th><th>상태</th><th>평점</th><th>연락처</th><th>관리</th></tr></thead><tbody>{adminMembers.map(member => <tr key={member.id}><td><strong>{member.name}</strong><small>{member.email}</small></td><td>{roleText(member.role)}</td><td>{memberStatusText(member.status)}</td><td>{formatRatingSummary(member.averageRating, member.ratingCount)}</td><td>{member.phone || '-'}</td><td><div className="table-actions"><select value={member.role} onChange={(e) => handleUpdateMember(member.id, 'role', e.target.value)}><option value="SHIPPER">화주</option><option value="DRIVER">차주</option><option value="ADMIN">관리자</option></select><select value={member.status} onChange={(e) => handleUpdateMember(member.id, 'status', e.target.value)}><option value="ACTIVE">정상</option><option value="PENDING">대기</option><option value="SUSPENDED">정지</option><option value="DELETED">삭제</option></select></div></td></tr>)}</tbody></table>
            </div>
          )}

          {dashboardTab === 'shipments' && (
            <div className="surface">
              <SectionTitle title="화물 관리" desc="운영자가 전체 화물을 조회하고 상태를 강제 조정할 수 있습니다." />
              <table className="board-table compact"><thead><tr><th>상태</th><th>배차명</th><th>화주 / 차주</th><th>구간</th><th>입찰</th><th>관리</th></tr></thead><tbody>{adminShipments.map(item => <tr key={item.id}><td><span className={`badge badge-${item.status.toLowerCase()}`}>{statusText(item.status)}</span></td><td>{item.title}</td><td><strong>{item.shipperName}</strong><small>{item.assignedDriverName || '미배정'}</small></td><td>{item.originAddress} → {item.destinationAddress}</td><td>{item.offerCount}건</td><td><div className="table-actions"><button className="btn btn-ghost small" onClick={() => handleForceShipmentStatus(item.id, 'CONFIRMED')}>확정</button><button className="btn btn-ghost small" onClick={() => handleForceShipmentStatus(item.id, 'IN_TRANSIT')}>운반중</button><button className="btn btn-ghost small" onClick={() => handleForceShipmentStatus(item.id, 'COMPLETED')}>완료</button></div></td></tr>)}</tbody></table>
            </div>
          )}


          {dashboardTab === 'finance' && (
            <div className="page-stack">
              <div className="kpi-grid">
                <div className="kpi-card"><span>플랫폼 수익</span><strong>{formatCurrency(financeSummary?.totalPlatformRevenue)}</strong><p>수수료율 {financeSummary?.serviceFeeRate ?? 3}% 기준</p></div>
                <div className="kpi-card"><span>총 거래 수</span><strong>{financeSummary?.transactionCount ?? 0}건</strong></div>
                <div className="kpi-card"><span>완료 화물</span><strong>{financeSummary?.completedShipmentCount ?? 0}건</strong></div>
                <div className="kpi-card"><span>총 정산 원금</span><strong>{formatCurrency(financeTransactions.filter(item => item.type === 'SPEND').reduce((sum, item) => sum + (item.grossAmount || 0), 0))}</strong></div>
              </div>
              <div className="surface"><SectionTitle title="플랫폼 수익 거래 내역" desc="화주 지출, 차주 정산, 관리자 수수료 수익이 같은 화물 단위로 묶여 기록됩니다." /><table className="board-table compact"><thead><tr><th>유형</th><th>화물</th><th>거래액</th><th>수수료</th><th>실수익</th><th>일시</th></tr></thead><tbody>{financeTransactions.map(item => <tr key={item.id}><td>{transactionTypeText(item.type)}</td><td>{item.shipmentTitle || '-'}<small>#{item.shipmentId || '-'}</small></td><td>{formatCurrency(item.grossAmount)}</td><td>{formatCurrency(item.feeAmount)}</td><td>{formatCurrency(item.netAmount)}</td><td>{formatDate(item.createdAt)}</td></tr>)}</tbody></table></div>
            </div>
          )}

          {dashboardTab === 'ratings' && (
            <div className="page-stack">
              <div className="kpi-grid">
                <div className="kpi-card"><span>최근 평점 수</span><strong>{adminRecentRatings.length}건</strong><p>최근 20개 평가를 확인합니다.</p></div>
                <div className="kpi-card"><span>평균 점수</span><strong>{adminRecentRatings.length ? (adminRecentRatings.reduce((sum, item) => sum + item.score, 0) / adminRecentRatings.length).toFixed(2) : '0.00'}</strong><p>전체 최근 등록 기준</p></div>
                <div className="kpi-card"><span>5점 비율</span><strong>{adminRecentRatings.length ? Math.round((adminRecentRatings.filter(item => item.score === 5).length / adminRecentRatings.length) * 100) : 0}%</strong></div>
                <div className="kpi-card"><span>운영 체크</span><strong>{adminRecentRatings.some(item => item.score <= 2) ? '주의 필요' : '양호'}</strong></div>
              </div>
              <div className="surface">
                <SectionTitle title="최근 등록 평점" desc="화주와 차주가 서로에게 남긴 최신 평가입니다." />
                <table className="board-table compact"><thead><tr><th>화물</th><th>평가자</th><th>대상</th><th>점수</th><th>코멘트</th><th>일시</th></tr></thead><tbody>{adminRecentRatings.map(item => <tr key={item.id}><td>{item.shipmentTitle}<small>#{item.shipmentId}</small></td><td>{item.fromUserName}</td><td>{item.toUserName}</td><td>{renderStars(item.score)} ({item.score})</td><td>{item.comment || '-'}</td><td>{formatDate(item.createdAt)}</td></tr>)}</tbody></table>
              </div>
            </div>
          )}

          {dashboardTab === 'notices' && (
            <div className="page-stack">
              <div className="surface form-surface">
                <SectionTitle title="공지 작성 / 수정" />
                <div className="form-stack"><input placeholder="카테고리" value={noticeForm.category} onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })} /><input placeholder="제목" value={noticeForm.title} onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })} /><textarea rows="4" placeholder="요약" value={noticeForm.summary} onChange={(e) => setNoticeForm({ ...noticeForm, summary: e.target.value })} /><label className="check-inline"><input type="checkbox" checked={noticeForm.pinned} onChange={(e) => setNoticeForm({ ...noticeForm, pinned: e.target.checked })} />중요 공지</label><div className="table-actions"><button className="btn btn-primary" onClick={submitNotice}>저장</button>{editingNoticeId && <button className="btn btn-ghost" onClick={() => { setEditingNoticeId(null); setNoticeForm(emptyNotice) }}>취소</button>}</div></div>
              </div>
              <div className="surface">
                <SectionTitle title="공지 목록" />
                <table className="board-table compact"><thead><tr><th>카테고리</th><th>제목</th><th>중요</th><th>관리</th></tr></thead><tbody>{adminNotices.map(item => <tr key={item.id}><td>{item.category}</td><td>{item.title}<small>{item.summary}</small></td><td>{item.pinned ? '예' : '아니오'}</td><td><div className="table-actions"><button className="btn btn-ghost small" onClick={() => { setEditingNoticeId(item.id); setNoticeForm({ category: item.category, title: item.title, summary: item.summary, pinned: item.pinned }) }}>수정</button><button className="btn btn-ghost small danger" onClick={async () => { await deleteAdminNotice(item.id); await Promise.all([loadAdmin(), loadPublic()]) }}>삭제</button></div></td></tr>)}</tbody></table>
              </div>
            </div>
          )}

          {dashboardTab === 'faqs' && (
            <div className="page-stack">
              <div className="surface form-surface">
                <SectionTitle title="FAQ 작성 / 수정" />
                <div className="form-stack"><input placeholder="카테고리" value={faqForm.category} onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })} /><input placeholder="질문" value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} /><textarea rows="5" placeholder="답변" value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} /><input placeholder="정렬 순서" value={faqForm.sortOrder} onChange={(e) => setFaqForm({ ...faqForm, sortOrder: e.target.value })} /><div className="table-actions"><button className="btn btn-primary" onClick={submitFaq}>저장</button>{editingFaqId && <button className="btn btn-ghost" onClick={() => { setEditingFaqId(null); setFaqForm(emptyFaq) }}>취소</button>}</div></div>
              </div>
              <div className="surface"><SectionTitle title="FAQ 목록" /><table className="board-table compact"><thead><tr><th>카테고리</th><th>질문</th><th>정렬</th><th>관리</th></tr></thead><tbody>{adminFaqs.map(item => <tr key={item.id}><td>{item.category}</td><td>{item.question}<small>{item.answer}</small></td><td>{item.sortOrder}</td><td><div className="table-actions"><button className="btn btn-ghost small" onClick={() => { setEditingFaqId(item.id); setFaqForm({ category: item.category, question: item.question, answer: item.answer, sortOrder: item.sortOrder }) }}>수정</button><button className="btn btn-ghost small danger" onClick={async () => { await deleteAdminFaq(item.id); await Promise.all([loadAdmin(), loadPublic()]) }}>삭제</button></div></td></tr>)}</tbody></table></div>
            </div>
          )}

          {dashboardTab === 'inquiries' && (
            <div className="surface"><SectionTitle title="문의 관리" desc="도입 문의를 읽고 바로 답변 상태를 관리할 수 있습니다." /><div className="inquiry-grid">{adminInquiries.map(item => <div className="inquiry-card" key={item.id}><div className="detail-head"><div><strong>{item.companyName}</strong><small>{item.contactName} · {item.email}</small></div><span className="badge badge-neutral">{inquiryStatusText(item.status)}</span></div><p className="inquiry-message">{item.message}</p><textarea rows="4" placeholder="답변 내용을 입력하세요." value={inquiryAnswerDraft[item.id] ?? item.answerContent ?? ''} onChange={(e) => setInquiryAnswerDraft({ ...inquiryAnswerDraft, [item.id]: e.target.value })} /><button className="btn btn-primary small" onClick={() => handleAnswerInquiry(item.id)}>답변 저장</button></div>)}</div></div>
          )}

          {dashboardTab === 'issues' && (
            <div className="admin-grid-2">
              <div className="surface"><SectionTitle title="신고 목록" /><table className="board-table compact"><thead><tr><th>신고자</th><th>대상</th><th>사유</th><th>상태</th></tr></thead><tbody>{adminReports.map(item => <tr key={item.id}><td>{item.reporterName}</td><td>{item.targetName || '-'}</td><td>{item.reason}<small>{item.description}</small></td><td>{item.status}</td></tr>)}</tbody></table></div>
              <div className="surface"><SectionTitle title="분쟁 처리" /><div className="list-stack">{adminDisputes.map(item => <div className="issue-card" key={item.id}><div className="detail-head"><strong>{item.shipmentTitle}</strong><span className="badge badge-neutral">{item.status}</span></div><small>{item.shipperName} ↔ {item.driverName}</small><p>{item.reason} · {item.detail}</p><div className="table-actions"><button className="btn btn-ghost small" onClick={() => handleResolveDispute(item.id, 'REVIEWING')}>검토중</button><button className="btn btn-primary small" onClick={() => handleResolveDispute(item.id, 'RESOLVED')}>해결</button></div></div>)}</div></div>
            </div>
          )}
        </main>
      </div>
    )
  }

  const navItems = [['overview', '마이페이지'], ['board', '배차 보드'], ['register', auth.role === 'SHIPPER' ? '화물 등록' : '입찰 가이드'], ['finance', '돈 관리'], ['ratings', '평점 관리'], ['bookmarks', '즐겨찾기']]
  return (
    <div className="console-shell user-console">
      <aside className="console-sidebar">
        <div className="console-logo"><div className="identity-mark">HC</div><div><strong>hallym-cargo</strong><small>Operations Dashboard</small></div></div>
        <div className="sidebar-profile"><strong>{auth.name}</strong><span>{roleText(auth.role)}</span><small>{auth.email}</small></div>
        <nav className="sidebar-nav">
          <button className="btn btn-ghost block" onClick={() => setDashboardTab('home')}>메인 페이지로 이동</button>
          {navItems.map(([key, label]) => <button key={key} className={dashboardTab === key ? 'nav-link active' : 'nav-link'} onClick={() => setDashboardTab(key)}>{label}</button>)}
        </nav>
        <div className="side-mini-kpis"><div><span>전체</span><strong>{summary.total}</strong></div><div><span>입찰중</span><strong>{summary.bidding}</strong></div><div><span>운행중</span><strong>{summary.live}</strong></div><div><span>완료</span><strong>{summary.completed}</strong></div></div>
        <button className="btn btn-secondary block" onClick={logout}>로그아웃</button>
      </aside>
      <main className="console-main">
        <div className="console-topbar">
          <div>
            <div className="eyebrow">USER OPERATIONS</div>
            <h1>{dashboardTab === 'overview' ? '마이페이지' : dashboardTab === 'board' ? '배차 보드' : dashboardTab === 'register' ? (auth.role === 'SHIPPER' ? '화물 등록' : '입찰 가이드') : dashboardTab === 'finance' ? '돈 관리' : dashboardTab === 'ratings' ? '평점 관리' : '즐겨찾기'}</h1>
            <p className="section-desc">{roleTheme?.tone}을 적용해 {auth.role === 'SHIPPER' ? '요청과 확정' : '주행과 ETA'}를 더 빠르게 읽을 수 있도록 조정했습니다.</p>
          </div>
          <div className="toolbar-inline"><span className={`role-chip role-chip-${roleTheme?.accent || 'shipper'}`}>{roleTheme?.label}</span><input className="toolbar-search" placeholder="제목, 지역, 화물 종류 검색" value={shipmentKeyword} onChange={(e) => setShipmentKeyword(e.target.value)} />{auth.role === 'DRIVER' && <div className="chip-group"><button className={driverBoardTag === 'ALL' ? 'chip active' : 'chip'} onClick={() => setDriverBoardTag('ALL')}>전체</button><button className={driverBoardTag === 'BIDDING' ? 'chip active' : 'chip'} onClick={() => setDriverBoardTag('BIDDING')}>입찰중</button><button className={driverBoardTag === 'MY_BIDS' ? 'chip active' : 'chip'} onClick={() => setDriverBoardTag('MY_BIDS')}>내 입찰</button><button className={driverBoardTag === 'MY_ASSIGNED' ? 'chip active' : 'chip'} onClick={() => setDriverBoardTag('MY_ASSIGNED')}>내 확정</button><button className={driverBoardTag === 'MY_TRANSIT' ? 'chip active' : 'chip'} onClick={() => setDriverBoardTag('MY_TRANSIT')}>내 운반중</button></div>}<select value={shipmentFilter} onChange={(e) => setShipmentFilter(e.target.value)}><option value="ALL">전체 상태</option><option value="BIDDING">입찰중</option><option value="CONFIRMED">확정</option><option value="IN_TRANSIT">운반중</option><option value="COMPLETED">완료</option></select></div>
        </div>
        {!!message && <div className="alert-info slim">{message}</div>}

        {dashboardTab === 'overview' && (
          <div className="page-stack">
            {!auth.profileCompleted && <div className="alert-info">첫 로그인입니다. 아래 선택 입력 정보를 저장하면 다음 로그인부터는 바로 메인 페이지로 이동합니다.</div>}
            <div className="admin-grid-2">
              <div className="surface">
                <SectionTitle title="회원정보 수정" desc="현재 회원가입 필수 정보는 유지하고, 아래 정보는 선택으로 추가할 수 있습니다." />
                <div className="form-stack">
                  <input placeholder="프로필 사진 URL" value={profileForm.profileImageUrl} onChange={(e) => setProfileForm({ ...profileForm, profileImageUrl: e.target.value })} />
                  <textarea rows="4" placeholder="자기소개" value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} />
                  <input placeholder="결제 수단 메모" value={profileForm.paymentMethod} onChange={(e) => setProfileForm({ ...profileForm, paymentMethod: e.target.value })} />
                  <div className="split-2">
                    <input placeholder="추가 이메일" value={profileForm.contactEmail} onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })} />
                    <input placeholder="추가 연락처" value={profileForm.contactPhone} onChange={(e) => setProfileForm({ ...profileForm, contactPhone: e.target.value })} />
                  </div>
                  <button className="btn btn-primary" onClick={handleSaveProfile}>회원정보 저장</button>
                </div>
              </div>
              <div className="surface">
                <SectionTitle title="내 공개 프로필 미리보기" desc="거래 상대가 거래 전에 볼 수 있는 정보입니다." />
                <ProfilePreviewCard title="내 프로필" profile={profile ? { ...profile, role: auth.role } : { ...profileForm, name: auth.name, role: auth.role, companyName: signupForm.companyName, vehicleType: signupForm.vehicleType, averageRating: profile?.averageRating, ratingCount: profile?.ratingCount, completedCount: profile?.completedCount }} />
              </div>
            </div>
            <section className={`role-banner role-banner-${roleTheme?.accent || 'shipper'}`}>
              <div>
                <div className="eyebrow">ROLE FOCUSED THEME</div>
                <h2>{roleTheme?.label}</h2>
                <p>{roleTheme?.summary}</p>
              </div>
              <div className="role-banner-notes">{(roleTheme?.bullets || []).map((item) => <span key={item}>{item}</span>)}</div>
            </section>
            <div className="kpi-grid"><div className="kpi-card"><span>전체 배차</span><strong>{summary.total}</strong></div><div className="kpi-card"><span>입찰중</span><strong>{summary.bidding}</strong></div><div className="kpi-card"><span>운행중</span><strong>{summary.live}</strong></div><div className="kpi-card"><span>완료</span><strong>{summary.completed}</strong></div></div>
            <div className="admin-grid-2">
              <div className="surface"><SectionTitle title="운영 알림" desc="역할에 따라 먼저 봐야 할 항목을 자동으로 묶었습니다." /><div className="signal-grid">{userAlerts.map(item => <div key={item.title} className="signal-card"><span>{item.title}</span><strong>{item.value}</strong><p>{item.desc}</p></div>)}</div></div>
              <div className="surface"><SectionTitle title="빠른 액션" desc="자주 쓰는 흐름으로 바로 이동합니다." /><div className="shortcut-grid">{roleQuickActions.map(item => <button key={item.title} className="shortcut-card" onClick={item.action}><strong>{item.title}</strong><small>{item.desc}</small><span>{item.cta}</span></button>)}</div></div>
            </div>
            <div className="admin-grid-2">
              <div className="surface"><SectionTitle title="최근 배차" /><table className="board-table compact"><thead><tr><th>상태</th><th>제목</th><th>구간</th><th>입찰</th></tr></thead><tbody>{filteredShipments.slice(0, 8).map(item => <tr key={item.id} onClick={() => { if (item.canAccessDetail !== false) { setSelectedId(item.id); setDashboardTab('board') } }}><td><span className={`badge badge-${item.status.toLowerCase()}`}>{statusText(item.status)}</span></td><td>{item.title}{auth.role === 'DRIVER' && <small>{item.assignedToMe ? '내 배차' : item.hasMyOffer ? '내 입찰' : '공개 배차'}</small>}</td><td>{item.originAddress} → {item.destinationAddress}</td><td>{item.offerCount}건 / {formatCurrency(item.bestOfferPrice)}</td></tr>)}</tbody></table></div>
              <div className="surface"><SectionTitle title="즐겨찾기" /><div className="list-stack">{bookmarks.length ? bookmarks.slice(0, 5).map(item => <button key={item.id} className="bookmark-item" onClick={() => { setSelectedId(item.id); setDashboardTab('board') }}><strong>{item.title}</strong><small>{item.originAddress} → {item.destinationAddress}</small><span>{statusText(item.status)}</span></button>) : <div className="empty-box small">즐겨찾기한 배차가 없습니다.</div>}</div></div>
            </div>
          </div>
        )}

        {dashboardTab === 'board' && (
          <div className="page-stack">
            <div className="surface table-surface"><SectionTitle title="배차 보드" desc="행을 클릭하면 상세와 지도, 역할별 액션이 함께 열립니다." /><table className="board-table"><thead><tr><th></th><th>상태</th><th>배차명</th><th>태그</th><th>구간</th><th>입찰</th><th>차주</th><th>예상</th></tr></thead><tbody>{filteredShipments.map(item => <tr key={item.id} className={selectedId === item.id ? 'is-selected' : ''} onClick={() => { if (item.canAccessDetail !== false) setSelectedId(item.id) }}><td><button className={item.bookmarked ? 'bookmark-toggle active' : 'bookmark-toggle'} onClick={(e) => { e.stopPropagation(); handleToggleBookmark(item.id) }}>★</button></td><td><span className={`badge badge-${item.status.toLowerCase()}`}>{statusText(item.status)}</span></td><td><strong>{item.title}</strong><small>{item.cargoType}</small></td><td>{auth.role === 'DRIVER' ? <div className="chip-group">{item.assignedToMe && <span className="tag tag-dark">내 배차</span>}{!item.assignedToMe && item.hasMyOffer && <span className="tag">내 입찰</span>}{!item.assignedToMe && !item.hasMyOffer && item.status === 'BIDDING' && <span className="tag">공개</span>}</div> : <span className="tag">{roleText(auth.role)}</span>}</td><td>{item.originAddress} → {item.destinationAddress}</td><td>{item.offerCount}건 / {formatCurrency(item.bestOfferPrice)}</td><td>{item.assignedDriverName || '-'}</td><td>{item.tracking?.remainingMinutes ?? item.estimatedMinutes}분</td></tr>)}</tbody></table></div>
            <div className="detail-layout">
              <div className="surface">
                {selected ? (<>
                  <div className="detail-head"><div><div className="eyebrow">SHIPMENT DETAIL</div><h3>{selected.title}</h3></div><div className="table-actions"><button className={selected.bookmarked ? 'bookmark-toggle active' : 'bookmark-toggle'} onClick={() => handleToggleBookmark(selected.id)}>★ 즐겨찾기</button><span className={`badge badge-${selected.status.toLowerCase()}`}>{statusText(selected.status)}</span></div></div>
                  <div className="detail-stat-grid"><div><span>출발지</span><strong>{selected.originAddress}</strong></div><div><span>도착지</span><strong>{selected.destinationAddress}</strong></div><div><span>입찰 현황</span><strong>{selected.offerCount}건 / {formatCurrency(selected.bestOfferPrice)}</strong></div><div><span>배정 차주</span><strong>{selected.assignedDriverName || '미확정'}</strong></div><div><span>현재 위치</span><strong>{selected.tracking?.roughLocation || '미등록'}</strong></div><div><span>남은 시간</span><strong>{selected.tracking?.remainingMinutes ?? selected.estimatedMinutes}분</strong></div></div>
                  {!!selected.cargoImageUrls?.length && <div className="surface-sub"><strong>등록 화물 사진</strong><div className="image-preview-row">{selected.cargoImageUrls.map((src, idx) => <img key={idx} src={src} alt={`cargo-detail-${idx}`} className="image-preview-thumb" />)}</div></div>}
                  {!!selected.completionImageUrl && <div className="surface-sub"><strong>배송 완료 사진</strong><div className="image-preview-row"><img src={selected.completionImageUrl} alt="completion" className="image-preview-thumb" /></div></div>}
                  <ProfilePreviewCard title={auth.role === 'DRIVER' ? '거래 전 확인할 화주 정보' : '거래 전 확인할 차주 정보'} profile={auth.role === 'DRIVER' ? { name: selected.shipperName, role: 'SHIPPER', companyName: selected.companyName, bio: selected.shipperBio, profileImageUrl: selected.shipperProfileImageUrl, contactEmail: selected.shipperContactEmail, contactPhone: selected.shipperContactPhone, averageRating: selected.shipperAverageRating, ratingCount: selected.shipperRatingCount, completedCount: undefined } : (selected.assignedDriverName ? { name: selected.assignedDriverName, role: 'DRIVER', bio: selected.assignedDriverBio, profileImageUrl: selected.assignedDriverProfileImageUrl, contactEmail: selected.assignedDriverContactEmail, contactPhone: selected.assignedDriverContactPhone, averageRating: selected.assignedDriverAverageRating, ratingCount: selected.assignedDriverRatingCount, completedCount: undefined } : null)} />
                  <KakaoMapView shipment={selected} />
                  <div className="surface-sub"><SectionTitle title="상태 타임라인" /><div className="list-stack">{(selected.histories || []).map(history => <div className="list-row block" key={history.id}><strong>{statusText(history.toStatus)}</strong><span>{history.note} · {history.actorEmail}</span><small>{formatDate(history.createdAt)}</small></div>)}</div></div>
                </>) : <div className="empty-box">배차를 선택해 주세요.</div>}
              </div>
              <div className="surface side-form">
                {selected ? (<>
                  <SectionTitle title="역할별 액션" desc={`${roleText(auth.role)} 기준으로 표시됩니다.`} />
                  <div className="surface-sub role-side-guide"><strong>{roleTheme?.label}</strong><p className="section-desc">{auth.role === 'SHIPPER' ? '화주는 입찰 비교와 차주 확정, 운행 확인이 핵심입니다.' : '차주는 입찰 등록, 운반 시작, ETA 기준 완료 전환이 핵심입니다.'}</p></div>
                  {auth.role === 'DRIVER' && selected.status === 'BIDDING' && !selected.hasMyOffer && <div className="form-stack"><div className="surface-sub"><strong>정산 안내</strong><p className="section-desc">차주는 확정 금액에서 3% 수수료를 제외한 나머지 금액을 받습니다. 예를 들어 100,000원 제안이 확정되면 97,000원이 정산됩니다.</p></div><input placeholder="제안 금액" value={offerForm.price} onChange={(e) => setOfferForm({ ...offerForm, price: e.target.value })} /><textarea rows="4" placeholder="제안 메시지" value={offerForm.message} onChange={(e) => setOfferForm({ ...offerForm, message: e.target.value })} /><button className="btn btn-primary" onClick={handleCreateOffer}>입찰 제안</button></div>}{auth.role === 'DRIVER' && selected.status === 'BIDDING' && selected.hasMyOffer && <div className="surface-sub"><strong>이미 이 배차에 입찰했습니다.</strong><p className="section-desc">내 입찰 태그가 붙은 배차는 화주 선택 결과를 기다리면 됩니다.</p></div>}
                  {auth.role === 'SHIPPER' && <div className="list-stack">{(selected.offers || []).length ? selected.offers.map(offer => <div key={offer.id} className="offer-card"><div className="detail-head"><strong>{offer.driverName}</strong><span className="badge badge-neutral">{offer.status}</span></div><div className="section-desc">평점 {formatRatingSummary(offer.driverAverageRating, offer.driverRatingCount)}</div>{offer.driverBio && <small>{offer.driverBio}</small>}<p>{formatCurrency(offer.price)}</p><small>{offer.message || '메시지 없음'}</small>{selected.status === 'BIDDING' && offer.status === 'PENDING' && <button className="btn btn-primary small" onClick={() => handleAcceptOffer(offer.id)}>이 차주 확정</button>}</div>) : <div className="empty-box small">등록된 제안이 없습니다.</div>}</div>}
                  {auth.role === 'DRIVER' && selected.assignedDriverName === auth.name && <div className="form-stack">{selected.status === 'CONFIRMED' && <button className="btn btn-primary" onClick={handleStart}>운반 시작</button>}{selected.status === 'IN_TRANSIT' && <><div className="surface-sub"><strong>자동 이동 시뮬레이션</strong><p className="section-desc">운반 시작 시 예상 시간에 맞춰 트럭이 출발지에서 도착지까지 자동으로 이동합니다. 위치 입력 없이 지도에서 진행률과 남은 시간을 바로 확인할 수 있습니다.</p></div><div className="surface-sub"><strong>배송 완료 사진 등록</strong><p className="section-desc">완료 처리 전에 현장 사진 1장을 반드시 등록해야 합니다.</p><input type="file" accept="image/*" onChange={handleCompletionProofChange} />{completionProof.dataUrl && <div className="image-preview-row"><img src={completionProof.dataUrl} alt="completion-proof" className="image-preview-thumb" /></div>}</div><button className="btn btn-primary" onClick={handleComplete} disabled={!selected.tracking?.completable || !completionProof.dataUrl}>운송 완료</button>{!selected.tracking?.completable && <small>예상 도착 시간이 지나야 완료 가능합니다.</small>}{selected.tracking?.completable && !completionProof.dataUrl && <small>완료 사진을 등록하면 완료 버튼이 활성화됩니다.</small>}</>}</div>}
                </>) : <div className="empty-box">상세를 선택하면 액션이 표시됩니다.</div>}
              </div>
            </div>
          </div>
        )}


        {dashboardTab === 'finance' && financeSummary && (
          <div className="page-stack">
            <div className="kpi-grid">
              {auth.role === 'SHIPPER' ? (
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
              <SectionTitle title={auth.role === 'SHIPPER' ? '지출 내역' : '정산 내역'} desc={auth.role === 'SHIPPER' ? '화주는 확정된 운임 총액만 결제하며, 플랫폼 수수료는 차주 정산 금액에서만 차감됩니다.' : '차주는 거래 원금, 수수료, 실제 정산 금액을 한 번에 확인합니다.'} />
              <table className="board-table compact"><thead><tr><th>유형</th><th>화물</th><th>거래액</th><th>수수료</th><th>최종 반영액</th><th>일시</th></tr></thead><tbody>{financeTransactions.map(item => <tr key={item.id}><td>{transactionTypeText(item.type)}</td><td>{item.shipmentTitle || '-'}<small>#{item.shipmentId || '-'}</small></td><td>{formatCurrency(item.grossAmount)}</td><td>{formatCurrency(item.feeAmount)}</td><td>{formatCurrency(item.netAmount)}</td><td>{formatDate(item.createdAt)}</td></tr>)}</tbody></table>
            </div>
          </div>
        )}

        {dashboardTab === 'register' && auth.role === 'SHIPPER' && (
          <div className="surface form-surface"><SectionTitle title="신규 화물 등록" desc="주소를 입력해 바로 지도에 찍고, 지도 클릭으로 좌표와 주소를 자동 입력할 수 있습니다." /><div className="form-stack"><div className="split-2"><input placeholder="배차명" value={shipmentForm.title} onChange={(e) => setShipmentForm({ ...shipmentForm, title: e.target.value })} /><input placeholder="화물 종류" value={shipmentForm.cargoType} onChange={(e) => setShipmentForm({ ...shipmentForm, cargoType: e.target.value })} /></div><div className="split-2"><input placeholder="중량(kg)" value={shipmentForm.weightKg} onChange={(e) => setShipmentForm({ ...shipmentForm, weightKg: e.target.value })} /><input placeholder="상세 설명" value={shipmentForm.description} onChange={(e) => setShipmentForm({ ...shipmentForm, description: e.target.value })} /></div><div className="surface-sub"><strong>화물 사진 등록</strong><p className="section-desc">출발 전 화물 상태 확인용 사진을 최대 5장까지 첨부할 수 있습니다.</p><input type="file" accept="image/*" multiple onChange={handleShipmentImagesChange} />{(shipmentForm.cargoImageDataUrls || []).length > 0 && <div className="image-preview-row">{shipmentForm.cargoImageDataUrls.map((src, idx) => <img key={idx} src={src} alt={`cargo-${idx}`} className="image-preview-thumb" />)}</div>}</div><ShipmentLocationPicker value={shipmentForm} onChange={setShipmentForm} /><button className="btn btn-primary" onClick={handleCreateShipment}>화물 등록</button></div></div>
        )}

        {dashboardTab === 'register' && auth.role !== 'SHIPPER' && (
          <div className="surface"><SectionTitle title="입찰 운영 가이드" desc="차주 기준 업무 흐름을 요약했습니다." /><div className="list-stack"><div className="list-row block"><strong>1. 입찰중 배차 선택</strong><span>구간, 화물 종류, 예상 시간 확인 후 제안을 등록합니다.</span></div><div className="list-row block"><strong>2. 화주 확정 이후 운반 시작</strong><span>확정된 건만 운반 시작 버튼이 열립니다.</span></div><div className="list-row block"><strong>3. 자동 주행 트래킹</strong><span>운반 시작과 동시에 귀여운 트럭 아이콘이 예상 시간에 맞춰 출발지에서 도착지까지 자동 이동합니다.</span></div></div></div>
        )}

        {dashboardTab === 'ratings' && ratingsDashboard && (
          <div className="page-stack">
            <div className="kpi-grid">
              <div className="kpi-card"><span>내 평균 평점</span><strong>{Number(ratingsDashboard.receivedSummary?.averageScore || 0).toFixed(2)}</strong><p>상대방이 남긴 평가 기준</p></div>
              <div className="kpi-card"><span>누적 평가 수</span><strong>{ratingsDashboard.receivedSummary?.totalCount || 0}건</strong></div>
              <div className="kpi-card"><span>평가 대기</span><strong>{ratingsDashboard.pendingRatings?.length || 0}건</strong><p>완료 화물 중 아직 작성하지 않은 평가</p></div>
              <div className="kpi-card"><span>내가 작성한 평가</span><strong>{ratingsDashboard.givenRatings?.length || 0}건</strong></div>
            </div>
            <div className="console-grid two">
              <div className="surface">
                <SectionTitle title="평가 대기 화물" desc="완료된 거래에 대해 상대방을 평가할 수 있습니다." />
                <div className="list-stack">
                  {(ratingsDashboard.pendingRatings || []).length ? ratingsDashboard.pendingRatings.map(item => {
                    const draft = ratingDrafts[item.shipmentId] || { score: 5, comment: '' }
                    return <div key={item.shipmentId} className="offer-card">
                      <div className="detail-head"><div><strong>{item.shipmentTitle}</strong><small>{item.counterpartName} · {roleText(item.counterpartRole)}</small></div><span className="badge badge-neutral">{formatDate(item.completedAt)}</span></div>
                      <div className="split-2">
                        <div>
                          <label>점수</label>
                          <select value={draft.score} onChange={(e) => setRatingDrafts({ ...ratingDrafts, [item.shipmentId]: { ...draft, score: e.target.value } })}>
                            {[5,4,3,2,1].map(score => <option key={score} value={score}>{score}점</option>)}
                          </select>
                        </div>
                        <div>
                          <label>미리보기</label>
                          <div className="surface-sub"><strong>{renderStars(Number(draft.score || 0))}</strong></div>
                        </div>
                      </div>
                      <textarea rows="3" placeholder="거래 경험을 남겨주세요" value={draft.comment} onChange={(e) => setRatingDrafts({ ...ratingDrafts, [item.shipmentId]: { ...draft, comment: e.target.value } })} />
                      <button className="btn btn-primary" onClick={() => handleCreateRating(item.shipmentId, item.counterpartName)}>평가 등록</button>
                    </div>
                  }) : <div className="empty-box small">평가 대기 중인 완료 화물이 없습니다.</div>}
                </div>
              </div>
              <div className="content-stack">
                <div className="surface">
                  <SectionTitle title="최근 받은 평점" desc="상대방이 남긴 최신 평가를 확인합니다." />
                  <div className="list-stack">
                    {(ratingsDashboard.receivedSummary?.recentRatings || []).length ? ratingsDashboard.receivedSummary.recentRatings.map(item => <div key={item.id} className="list-row block"><strong>{renderStars(item.score)} · {item.fromUserName}</strong><small>{item.shipmentTitle} · {formatDate(item.createdAt)}</small><div>{item.comment || '코멘트 없음'}</div></div>) : <div className="empty-box small">아직 받은 평점이 없습니다.</div>}
                  </div>
                </div>
                <div className="surface">
                  <SectionTitle title="내가 남긴 평가" desc="최근 작성한 평가 기록입니다." />
                  <div className="list-stack">
                    {(ratingsDashboard.givenRatings || []).length ? ratingsDashboard.givenRatings.slice(0, 8).map(item => <div key={item.id} className="list-row block"><strong>{renderStars(item.score)} · {item.toUserName}</strong><small>{item.shipmentTitle} · {formatDate(item.createdAt)}</small><div>{item.comment || '코멘트 없음'}</div></div>) : <div className="empty-box small">아직 등록한 평가가 없습니다.</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {dashboardTab === 'bookmarks' && (
          <div className="surface table-surface"><SectionTitle title="즐겨찾기" /><table className="board-table"><thead><tr><th>상태</th><th>배차명</th><th>구간</th><th>차주</th><th>예상</th></tr></thead><tbody>{bookmarks.map(item => <tr key={item.id} onClick={() => { setSelectedId(item.id); setDashboardTab('board') }}><td><span className={`badge badge-${item.status.toLowerCase()}`}>{statusText(item.status)}</span></td><td>{item.title}</td><td>{item.originAddress} → {item.destinationAddress}</td><td>{item.assignedDriverName || '-'}</td><td>{item.tracking?.remainingMinutes ?? item.estimatedMinutes}분</td></tr>)}</tbody></table></div>
        )}
      </main>
    </div>
  )
}
