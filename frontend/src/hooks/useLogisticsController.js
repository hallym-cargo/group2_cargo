import { useEffect, useMemo, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client/dist/sockjs'
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
  fetchAdminRecentRatings,
  fetchAdminReports,
  fetchAdminShipments,
  fetchBookmarks,
  fetchFinanceSummary,
  fetchFinanceTransactions,
  fetchMyProfile,
  fetchPublicOverview,
  fetchRatingsDashboard,
  fetchShipment,
  fetchShipments,
  forceShipmentStatus,
  login,
  resolveAdminDispute,
  signup,
  startTrip,
  toggleBookmark,
  updateAdminFaq,
  updateAdminNotice,
  updateMemberRole,
  updateMemberStatus,
  updateMyProfile,
  createRating,
} from '../api'
import { emptyFaq, emptyInquiry, emptyNotice, emptyShipment, emptySignup } from '../constants/forms'
import { roleThemeMeta } from '../constants/theme'
import { buildAdminAlerts, buildUserAlerts } from '../utils/dashboard'
import { fileToDataUrl } from '../utils/formatters'

export function useLogisticsController() {
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
  const [page, setPage] = useState('main');

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
    const [summaryData, transactionsData] = await Promise.all([fetchFinanceSummary(), fetchFinanceTransactions()])
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
      await createRating(shipmentId, { score, comment: (draft.comment || '').trim() })
      setMessage(`${counterpartName || '상대방'}에게 평점이 등록되었습니다.`)
      setRatingDrafts((prev) => ({ ...prev, [shipmentId]: { score: 5, comment: '' } }))
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
    } catch (err) {
      console.error(err)
      setMessage(err.response?.data?.message || '회원정보 저장 실패')
    }
  }

  const handleShipmentImagesChange = async (event) => {
    try {
      const files = Array.from(event.target.files || []).slice(0, 5)
      const converted = await Promise.all(files.map(fileToDataUrl))
      setShipmentForm((prev) => ({ ...prev, cargoImageDataUrls: converted.map((item) => item.dataUrl), cargoImageNames: converted.map((item) => item.name) }))
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

  useEffect(() => {
    if (selectedId && isLoggedIn && !isAdmin) loadDetail(selectedId).catch(err => setMessage(err.response?.data?.message || '상세 로드 실패'))
  }, [selectedId, isLoggedIn, isAdmin])

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
      await completeTrip(selectedId, { completionImageDataUrl: completionProof.dataUrl, completionImageName: completionProof.name })
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

  return {
    API_BASE_URL,
    auth, setAuth, message, setMessage, authMode, setAuthMode, loginForm, setLoginForm, signupForm, setSignupForm,
    publicData, publicSelectedId, setPublicSelectedId, publicStatusFilter, setPublicStatusFilter, inquiryForm, setInquiryForm,
    shipments, bookmarks, selectedId, setSelectedId, selected, dashboardTab, setDashboardTab, profile, profileForm, setProfileForm,
    shipmentForm, setShipmentForm, offerForm, setOfferForm, shipmentFilter, setShipmentFilter, driverBoardTag, setDriverBoardTag,
    shipmentKeyword, setShipmentKeyword, adminDashboard, adminMembers, adminShipments, adminNotices, adminFaqs, adminInquiries,
    adminReports, adminDisputes, adminLogs, financeSummary, financeTransactions, ratingsDashboard, adminRecentRatings,
    ratingDrafts, setRatingDrafts, noticeForm, setNoticeForm, faqForm, setFaqForm, completionProof, editingNoticeId, setEditingNoticeId,
    editingFaqId, setEditingFaqId, inquiryAnswerDraft, setInquiryAnswerDraft, isLoggedIn, isAdmin, roleTheme, publicBoard,
    selectedPublic, filteredShipments, summary, userAlerts, adminAlerts, roleQuickActions, logout, handleLogin, handleSignup,
    handleInquiry, handleCreateShipment, handleCreateOffer, handleAcceptOffer, handleStart, handleComplete, handleToggleBookmark,
    handleUpdateMember, handleForceShipmentStatus, submitNotice, submitFaq, handleAnswerInquiry, handleResolveDispute,
    handleSaveProfile, handleShipmentImagesChange, handleCompletionProofChange, loadAdmin, loadPublic, deleteAdminFaq, deleteAdminNotice,
    page,
  setPage,
  }
}
