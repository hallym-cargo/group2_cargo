import SectionTitle from '../../../components/common/SectionTitle'
import { formatDate } from '../../../utils/formatters'

function isFutureDateTime(value) {
  if (!value) return false
  const time = new Date(value).getTime()
  return !Number.isNaN(time) && time > Date.now()
}

function renderPenaltyStatus(profile) {
  if (!profile) return '정보 불러오는 중'

  const score = Number(profile.penaltyScore30d || 0)

  if (isFutureDateTime(profile.tradingBlockedUntil)) return '거래 금지 적용 중'
  if (score >= 20) return '관리자 검토 필요'
  if (score >= 15) return '중징계 대상'
  if (score >= 10) return '거래 금지 대상'
  if (score >= 8 || profile.highCancelBadge) return '고위험 주의 상태'
  if (score >= 5) return '주의 상태'
  if (score >= 3) return '경고 상태'

  return '정상'
}

function resolveActiveSanctions(profile) {
  if (!profile) {
    return [{ title: '정보 불러오는 중', desc: '패널티 정보를 확인하고 있습니다.' }]
  }

  const score = Number(profile.penaltyScore30d || 0)
  const sanctions = []

  if (isFutureDateTime(profile.tradingBlockedUntil)) {
    sanctions.push({
      title: '거래 금지 적용 중',
      desc: `${formatDate(profile.tradingBlockedUntil)}까지 입찰 제안 및 차주 확정이 제한됩니다.`,
    })
  }

  if (profile.highCancelBadge || score >= 8) {
    sanctions.push({
      title: '취소율 높음 주의 상태',
      desc: '반복 취소 위험 회원으로 분류되어 서비스 이용 시 주의 상태가 표시됩니다.',
    })
  }

  if (score >= 20) {
    sanctions.push({ title: '관리자 검토 단계', desc: '누적 점수가 높아 관리자 검토 대상입니다.' })
  } else if (score >= 15) {
    sanctions.push({ title: '중징계 단계', desc: '누적 점수가 높아 장기 거래 제한 대상입니다.' })
  } else if (score >= 10) {
    sanctions.push({ title: '거래 금지 단계', desc: '거래 금지 기준 점수에 도달했습니다.' })
  } else if (score >= 5) {
    sanctions.push({ title: '주의 단계', desc: '추가 취소 시 거래 제한으로 이어질 수 있습니다.' })
  } else if (score >= 3) {
    sanctions.push({ title: '경고 단계', desc: '취소 누적으로 경고 기준에 도달했습니다.' })
  }

  if (sanctions.length === 0) {
    sanctions.push({ title: '현재 적용 중인 제재 없음', desc: '현재 계정에 적용된 거래 제한이 없습니다.' })
  }

  return sanctions
}

function resolvePenaltyStage(score) {
  const value = Number(score || 0)
  if (value >= 20) return '관리자 검토 단계'
  if (value >= 15) return '중징계 단계'
  if (value >= 10) return '거래 금지 단계'
  if (value >= 8) return '고위험 단계'
  if (value >= 5) return '주의 단계'
  if (value >= 3) return '경고 단계'
  return '안정 단계'
}

const PENALTY_RULES = [
  ['48시간 이전 취소', '1점'],
  ['24시간 이전 취소', '2점'],
  ['3시간 이내 취소', '3점'],
  ['1시간 이내 취소', '4점'],
  ['운송 시작 이후 취소', '6점'],
]

const PENALTY_ACTIONS = [
  ['3점 이상', '경고 단계'],
  ['5점 이상', '주의 단계'],
  ['8점 이상', '고위험 단계 + 취소율 높음 주의 상태'],
  ['10점 이상', '거래 금지 단계'],
  ['15점 이상', '중징계 단계 + 평점 강등 가능'],
  ['20점 이상', '관리자 검토 단계'],
]

export default function UserPenaltyTab({ controller }) {
  // const { profile } = controller
  const { profile, auth } = controller;
  const role = auth?.role;  // 추가

  const penaltyScore = Number(profile?.penaltyScore30d || 0)
  const cancelRate = Number(profile?.cancelRate || 0)
  const penaltyStatus = renderPenaltyStatus(profile)
  const penaltyStage = resolvePenaltyStage(penaltyScore)
  const activeSanctions = resolveActiveSanctions(profile)

  return (
    // <div className="page-stack">
    <div className={`page-stack ${role === "DRIVER" ? "driver" : "shipper"}`}>
      <div className="surface">
        <SectionTitle
          title="패널티 현황"
          desc="취소로 인한 제재 상태와 누적 점수를 한눈에 확인할 수 있습니다."
        />

        <div className="penalty-kpi-wrap">
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
              <span>현재 단계</span>
              <strong>{penaltyStage}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="surface">
          <SectionTitle
            title="현재 적용 중인 제재"
            desc="현재 계정에 적용된 제한 상태를 확인할 수 있습니다."
          />

          <div className="list-stack">
            {activeSanctions.map(({ title, desc }) => (
              <div key={title} className="bookmark-item" as="div">
                <strong>{title}</strong><br />
                <small>{desc}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="surface">
          <SectionTitle
            title="취소 점수 기준"
            desc="취소 시점에 따라 누적되는 점수를 확인할 수 있습니다."
          />

          <div className="list-stack">
            {PENALTY_RULES.map(([title, score]) => (
              <div key={title} className="bookmark-item" as="div">
                <strong>{title}</strong><br />
                <small>{score}</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="surface">
        <SectionTitle
          title="점수별 제재 기준"
          desc="누적 점수에 따라 단계별로 이용 제한이 적용됩니다."
        />

        <div className="list-stack">
          {/* {PENALTY_ACTIONS.map(([title, desc]) => (
            <div key={title} className="bookmark-item" as="div">
              <strong>{title}</strong><br />
              <small>{desc}</small>
            </div>
          ))} */}

          {PENALTY_ACTIONS.map(([title, desc], idx) => (
            <div key={title} className={`bookmark-item penalty-item stage-${idx + 1}`}>
              <strong>{title}</strong><br />
              <small>{desc}</small>
            </div>
          ))}
        </div>
      </div>
    </div >
  )
}
