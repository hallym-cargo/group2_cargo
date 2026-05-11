import { useEffect, useMemo, useState } from 'react'
import Pagination from '../../../components/common/Pagination'
import SectionTitle from '../../../components/common/SectionTitle'
import useClientPagination from '../../../hooks/useClientPagination'
import { formatDate, formatRatingSummary, memberStatusText, roleText } from '../../../utils/formatters'
import './AdminMembersTab.css'

function toDateTimeLocalValue(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

function normalizeDateTimeLocal(value) {
  if (!value) return null
  return value.length === 16 ? `${value}:00` : value
}

function createMemberDraft(member) {
  return {
    role: member.role || 'SHIPPER',
    status: member.status || 'ACTIVE',
    penaltyScore30d: String(member.penaltyScore30d ?? 0),
    tradingBlockedUntil: toDateTimeLocalValue(member.tradingBlockedUntil),
    note: '',
  }
}

function isDraftChanged(member, draft) {
  if (!draft) return false

  return (
    draft.role !== member.role ||
    draft.status !== member.status ||
    String(draft.penaltyScore30d ?? '0') !== String(member.penaltyScore30d ?? 0) ||
    draft.tradingBlockedUntil !== toDateTimeLocalValue(member.tradingBlockedUntil) ||
    Boolean(draft.note?.trim())
  )
}

export default function AdminMembersTab({ controller }) {
  const { adminMembers, handleSaveMemberManagementBatch } = controller
  const [drafts, setDrafts] = useState({})
  const { pagedItems, page, setPage, totalPages } = useClientPagination(adminMembers, 10)

  useEffect(() => {
    setDrafts(
      (adminMembers || []).reduce((acc, member) => {
        acc[member.id] = createMemberDraft(member)
        return acc
      }, {}),
    )
  }, [adminMembers])

  const updateDraft = (member, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [member.id]: {
        ...(prev[member.id] || createMemberDraft(member)),
        [field]: value,
      },
    }))
  }

  const changedMembers = useMemo(() => {
    return (adminMembers || []).filter((member) => isDraftChanged(member, drafts[member.id]))
  }, [adminMembers, drafts])

  const handleSaveAll = async () => {
    if (changedMembers.length === 0) return

    const payload = changedMembers.map((member) => {
      const draft = drafts[member.id] || createMemberDraft(member)
      const score = Number.parseInt(draft.penaltyScore30d, 10)

      return {
        id: member.id,
        role: draft.role,
        status: draft.status,
        penaltyScore30d: Number.isNaN(score) ? 0 : Math.max(0, score),
        matchingBlockedUntil: null,
        tradingBlockedUntil: normalizeDateTimeLocal(draft.tradingBlockedUntil),
        note: draft.note,
        original: {
          role: member.role,
          status: member.status,
          penaltyScore30d: member.penaltyScore30d ?? 0,
          tradingBlockedUntil: toDateTimeLocalValue(member.tradingBlockedUntil),
        },
      }
    })

    await handleSaveMemberManagementBatch(payload)
  }

  const resetDrafts = () => {
    setDrafts(
      (adminMembers || []).reduce((acc, member) => {
        acc[member.id] = createMemberDraft(member)
        return acc
      }, {}),
    )
  }

  return (
    <div className="page-stack admin-members-page">
      <div className="surface">
        <SectionTitle
          title="회원 관리"
          desc="역할, 계정 상태, 패널티 점수와 거래 금지 시각을 한 번에 수정합니다."
          action={
            <div className="admin-member-savebar">
              <span className="muted">변경 {changedMembers.length}건</span>
              <button className="btn btn-ghost" type="button" onClick={resetDrafts} disabled={changedMembers.length === 0}>
                되돌리기
              </button>
              <button className="btn btn-primary" type="button" onClick={handleSaveAll} disabled={changedMembers.length === 0}>
                변경사항 저장
              </button>
            </div>
          }
        />

        <div className="admin-member-table-wrap">
          <table className="board-table compact admin-member-table">
            <colgroup>
              <col className="admin-member-col" />
              <col className="admin-role-col" />
              <col className="admin-status-col" />
              <col className="admin-rating-col" />
              <col className="admin-contact-col" />
              <col className="admin-manage-col" />
            </colgroup>
            <thead>
              <tr>
                <th>회원</th>
                <th>역할</th>
                <th>상태</th>
                <th>평점</th>
                <th>연락처</th>
                <th>관리</th>
              </tr>
            </thead>

            <tbody>
              {pagedItems.map((member) => {
                const draft = drafts[member.id] || createMemberDraft(member)

                return (
                  <tr key={member.id}>
                    <td className="admin-member-info-cell">
                      <strong>{member.name}</strong>
                      <small>{member.email}</small>
                      <small>패널티 {member.penaltyScore30d ?? 0}점 · {member.tradingBlockedUntil ? formatDate(member.tradingBlockedUntil) : '거래 금지 없음'}</small>
                    </td>
                    <td>{roleText(member.role)}</td>
                    <td>{memberStatusText(member.status)}</td>
                    <td>{formatRatingSummary(member.averageRating, member.ratingCount)}</td>
                    <td>{member.phone || '-'}</td>
                    <td>
                      <div className="admin-member-controls">
                        <label>
                          <span>역할</span>
                          <select value={draft.role} onChange={(event) => updateDraft(member, 'role', event.target.value)}>
                            <option value="SHIPPER">화주</option>
                            <option value="DRIVER">차주</option>
                            <option value="ADMIN">관리자</option>
                          </select>
                        </label>

                        <label>
                          <span>상태</span>
                          <select value={draft.status} onChange={(event) => updateDraft(member, 'status', event.target.value)}>
                            <option value="ACTIVE">정상</option>
                            <option value="PENDING">대기</option>
                            <option value="SUSPENDED">정지</option>
                          </select>
                        </label>

                        <label>
                          <span>패널티 점수</span>
                          <input
                            type="number"
                            min="0"
                            value={draft.penaltyScore30d}
                            onChange={(event) => updateDraft(member, 'penaltyScore30d', event.target.value)}
                          />
                        </label>

                        <label>
                          <span>거래 금지 해제 시각</span>
                          <input
                            type="datetime-local"
                            value={draft.tradingBlockedUntil}
                            onChange={(event) => updateDraft(member, 'tradingBlockedUntil', event.target.value)}
                          />
                        </label>

                        <label className="admin-member-note-field">
                          <span>관리 메모</span>
                          <input
                            value={draft.note}
                            onChange={(event) => updateDraft(member, 'note', event.target.value)}
                            placeholder="관리 메모"
                          />
                        </label>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
