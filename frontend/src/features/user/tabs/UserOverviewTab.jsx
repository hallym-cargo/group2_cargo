import ProfilePreviewCard from '../../../components/common/ProfilePreviewCard'
import SectionTitle from '../../../components/common/SectionTitle'
import { formatCurrency, formatDate, statusText } from '../../../utils/formatters'

function renderPenaltyStatus(profile) {
  if (!profile) return '정보 불러오는 중'
  if (profile.tradingBlockedUntil) return '거래 금지 적용 중'
  if (profile.matchingBlockedUntil) return '매칭 제한 적용 중'
  if (profile.highCancelBadge) return '취소율 높음 주의 상태'
  return '정상'
}

export default function UserOverviewTab({ controller }) {
  const {
    auth,
    profile,
    profileForm,
    setProfileForm,
    signupForm,
    handleSaveProfile,
    roleTheme,
    summary,
    userAlerts,
    roleQuickActions,
    filteredShipments,
    bookmarks,
    setSelectedId,
    setDashboardTab,
  } = controller

  const penaltyScore = Number(profile?.penaltyScore30d || 0)
  const cancelRate = Number(profile?.cancelRate || 0)
  const penaltyStatus = renderPenaltyStatus(profile)

  return (
    <div className="page-stack">
      {!auth.profileCompleted && (
        <div className="alert-info">
          첫 로그인입니다. 아래 선택 입력 정보를 저장하면 다음 로그인부터는 바로 메인 페이지로 이동합니다.
        </div>
      )}

      <div className="admin-grid-2">
        <div className="surface">
          <SectionTitle
            title="회원정보 수정"
            desc="현재 회원가입 필수 정보는 유지하고, 아래 정보는 선택으로 추가할 수 있습니다."
          />

          <div className="form-stack">
            <input
              placeholder="프로필 사진 URL"
              value={profileForm.profileImageUrl}
              onChange={(e) => setProfileForm({ ...profileForm, profileImageUrl: e.target.value })}
            />
            <textarea
              rows="4"
              placeholder="자기소개"
              value={profileForm.bio}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
            />
            <input
              placeholder="결제 수단 메모"
              value={profileForm.paymentMethod}
              onChange={(e) => setProfileForm({ ...profileForm, paymentMethod: e.target.value })}
            />
            <div className="split-2">
              <input
                placeholder="추가 이메일"
                value={profileForm.contactEmail}
                onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })}
              />
              <input
                placeholder="추가 연락처"
                value={profileForm.contactPhone}
                onChange={(e) => setProfileForm({ ...profileForm, contactPhone: e.target.value })}
              />
            </div>
            <button className="btn btn-primary" onClick={handleSaveProfile}>
              회원정보 저장
            </button>
          </div>
        </div>

        <div className="surface">
          <SectionTitle title="내 공개 프로필 미리보기" desc="거래 상대가 거래 전에 볼 수 있는 정보입니다." />
          <ProfilePreviewCard
            title="내 프로필"
            profile={
              profile
                ? { ...profile, role: auth.role }
                : {
                    ...profileForm,
                    name: auth.name,
                    role: auth.role,
                    companyName: signupForm.companyName,
                    vehicleType: signupForm.vehicleType,
                    averageRating: profile?.averageRating,
                    ratingCount: profile?.ratingCount,
                    completedCount: profile?.completedCount,
                  }
            }
          />
        </div>
      </div>

      <div className="surface">
        <SectionTitle
          title="패널티 상태"
          desc="취소 패널티는 마이페이지에서 항상 확인할 수 있고, 취소 직전 모달에서도 다시 안내됩니다."
        />

        <div className="kpi-grid">
          <div className="kpi-card">
            <span>현재 상태</span>
            <strong>{penaltyStatus}</strong>
          </div>
          <div className="kpi-card">
            <span>최근 30일 패널티 점수</span>
            <strong>{penaltyScore}점</strong>
          </div>
          <div className="kpi-card">
            <span>최근 취소율</span>
            <strong>{cancelRate.toFixed(1)}%</strong>
          </div>
          <div className="kpi-card">
            <span>취소율 높음 뱃지</span>
            <strong>{profile?.highCancelBadge ? '표시 중' : '없음'}</strong>
          </div>
        </div>

        <div className="admin-grid-2" style={{ marginTop: 16 }}>
          <div className="surface-sub">
            <strong>현재 제재 적용 내역</strong>
            <div className="form-stack" style={{ marginTop: 12 }}>
              <div>
                <span>매칭 제한 종료 시각</span>
                <div><strong>{formatDate(profile?.matchingBlockedUntil)}</strong></div>
              </div>
              <div>
                <span>거래 금지 종료 시각</span>
                <div><strong>{formatDate(profile?.tradingBlockedUntil)}</strong></div>
              </div>
              <div>
                <span>안내</span>
                <div>
                  <strong>
                    취소 직전에는 취소 모달에서 이번 취소로 몇 점이 추가되는지도 바로 확인할 수 있습니다.
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="surface-sub">
            <strong>패널티 기준 요약</strong>
            <div className="list-stack" style={{ marginTop: 12 }}>
              <div className="bookmark-item" as="div">
                <strong>3점 이상</strong>
                <small>2시간 매칭 제한</small>
              </div>
              <div className="bookmark-item" as="div">
                <strong>5점 이상</strong>
                <small>24시간 매칭 제한</small>
              </div>
              <div className="bookmark-item" as="div">
                <strong>8점 이상</strong>
                <small>72시간 매칭 제한 + 취소율 높음 뱃지 가능</small>
              </div>
              <div className="bookmark-item" as="div">
                <strong>10점 이상</strong>
                <small>3일 거래 금지</small>
              </div>
              <div className="bookmark-item" as="div">
                <strong>15점 이상</strong>
                <small>7일 거래 금지 + 평점 강등</small>
              </div>
              <div className="bookmark-item" as="div">
                <strong>20점 이상</strong>
                <small>14일 거래 금지 + 관리자 검토</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className={`role-banner role-banner-${roleTheme?.accent || 'shipper'}`}>
        <div>
          <div className="eyebrow">ROLE FOCUSED THEME</div>
          <h2>{roleTheme?.label}</h2>
          <p>{roleTheme?.summary}</p>
        </div>
        <div className="role-banner-notes">
          {(roleTheme?.bullets || []).map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <div className="kpi-grid">
        <div className="kpi-card"><span>전체 배차</span><strong>{summary.total}</strong></div>
        <div className="kpi-card"><span>입찰중</span><strong>{summary.bidding}</strong></div>
        <div className="kpi-card"><span>운행중</span><strong>{summary.live}</strong></div>
        <div className="kpi-card"><span>완료</span><strong>{summary.completed}</strong></div>
      </div>

      <div className="admin-grid-2">
        <div className="surface">
          <SectionTitle title="운영 알림" desc="역할에 따라 먼저 봐야 할 항목을 자동으로 묶었습니다." />
          <div className="signal-grid">
            {userAlerts.map((item) => (
              <div key={item.title} className="signal-card">
                <span>{item.title}</span>
                <strong>{item.value}</strong>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface">
          <SectionTitle title="빠른 액션" desc="자주 쓰는 흐름으로 바로 이동합니다." />
          <div className="shortcut-grid">
            {roleQuickActions.map((item) => (
              <button key={item.title} className="shortcut-card" onClick={item.action}>
                <strong>{item.title}</strong>
                <small>{item.desc}</small>
                <span>{item.cta}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="surface">
          <SectionTitle title="최근 배차" />
          <table className="board-table compact">
            <thead>
              <tr>
                <th>상태</th>
                <th>제목</th>
                <th>구간</th>
                <th>입찰</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.slice(0, 8).map((item) => (
                <tr
                  key={item.id}
                  onClick={() => {
                    if (item.canAccessDetail !== false) {
                      setSelectedId(item.id)
                      setDashboardTab('board')
                    }
                  }}
                >
                  <td><span className={`badge badge-${item.status.toLowerCase()}`}>{statusText(item.status)}</span></td>
                  <td>
                    {item.title}
                    {auth.role === 'DRIVER' && (
                      <small>{item.assignedToMe ? '내 배차' : item.hasMyOffer ? '내 입찰' : '공개 배차'}</small>
                    )}
                  </td>
                  <td>{item.originAddress} → {item.destinationAddress}</td>
                  <td>{item.offerCount}건 / {formatCurrency(item.bestOfferPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="surface">
          <SectionTitle title="즐겨찾기" />
          <div className="list-stack">
            {bookmarks.length ? (
              bookmarks.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  className="bookmark-item"
                  onClick={() => {
                    setSelectedId(item.id)
                    setDashboardTab('board')
                  }}
                >
                  <strong>{item.title}</strong>
                  <small>{item.originAddress} → {item.destinationAddress}</small>
                  <span>{statusText(item.status)}</span>
                </button>
              ))
            ) : (
              <div className="empty-box small">즐겨찾기한 배차가 없습니다.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
