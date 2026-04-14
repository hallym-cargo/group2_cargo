import { useMemo } from 'react'
import Pagination from '../../../components/common/Pagination'
import SectionTitle from '../../../components/common/SectionTitle'
import useClientPagination from '../../../hooks/useClientPagination'

const emptyGuideline = {
  title: '',
  instruction: '',
  active: true,
  sortOrder: 0,
}

export default function AdminAssistantTab({ controller }) {
  const {
    adminAssistantLogs,
    adminAssistantGuidelines,
    assistantGuidelineForm,
    setAssistantGuidelineForm,
    editingAssistantGuidelineId,
    setEditingAssistantGuidelineId,
    assistantLogReviewDrafts,
    setAssistantLogReviewDrafts,
    assistantLogSavingIds,
    assistantLogSaveMarks,
    submitAssistantGuideline,
    deleteAdminAssistantGuideline,
    saveAssistantLogReview,
    removeAssistantLog,
    loadAdmin,
  } = controller

  const { pagedItems, page, setPage, totalPages } = useClientPagination(adminAssistantLogs, 8)

  const reviewedCount = useMemo(
    () => adminAssistantLogs.filter((item) => item.reviewStatus && item.reviewStatus !== 'NEW').length,
    [adminAssistantLogs],
  )

  return (
    <div className="page-stack">
      <div className="surface form-surface">
        <SectionTitle
          title="AI 운영 가이드 등록"
          description="저장한 가이드는 항상 즉시 적용됩니다. 제목은 어떤 질문에 적용할지, 내용은 실제 답변 문장 기준으로 적어주세요."
        />

        <div className="form-stack">
          <input
            placeholder="가이드 제목"
            value={assistantGuidelineForm.title}
            onChange={(e) => setAssistantGuidelineForm((prev) => ({ ...prev, title: e.target.value }))}
          />

          <textarea
            rows="4"
            placeholder="예: 결제 오류 질문에는 먼저 현재 결제 상태 확인을 권하고, 확인 가능한 메뉴 경로를 단계별로 안내할 것"
            value={assistantGuidelineForm.instruction}
            onChange={(e) => setAssistantGuidelineForm((prev) => ({ ...prev, instruction: e.target.value }))}
          />

          <div className="form-grid two-col compact-grid">
            <label>
              <span>정렬 순서</span>
              <input
                value={assistantGuidelineForm.sortOrder}
                onChange={(e) => setAssistantGuidelineForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
              />
            </label>
          </div>

          <div className="table-actions">
            <button className="btn btn-primary" onClick={submitAssistantGuideline}>저장</button>
            {editingAssistantGuidelineId && (
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setEditingAssistantGuidelineId(null)
                  setAssistantGuidelineForm(emptyGuideline)
                }}
              >
                취소
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="surface">
        <SectionTitle
          title="AI 운영 가이드 목록"
          description={`총 ${adminAssistantGuidelines.length}개 · 검토 완료 대화 ${reviewedCount}건`}
        />

        <table className="board-table compact">
          <thead>
            <tr>
              <th>제목</th>
              <th>내용</th>
              <th>정렬</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {adminAssistantGuidelines.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td><small>{item.instruction}</small></td>
                <td>{item.sortOrder}</td>
                <td>{item.active ? '적용 중' : '비활성'}</td>
                <td>
                  <div className="table-actions">
                    <button
                      className="btn btn-ghost small"
                      onClick={() => {
                        setEditingAssistantGuidelineId(item.id)
                        setAssistantGuidelineForm({
                          title: item.title,
                          instruction: item.instruction,
                          active: item.active,
                          sortOrder: item.sortOrder,
                        })
                      }}
                    >
                      수정
                    </button>
                    <button
                      className="btn btn-ghost small danger"
                      onClick={async () => {
                        await deleteAdminAssistantGuideline(item.id)
                        await loadAdmin()
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="surface">
        <SectionTitle
          title="AI 질문 / 답변 기록"
          description="질문, 실제 답변, 참조 지식, 관리자 개선 메모를 저장합니다."
        />

        <div className="form-stack">
          {pagedItems.map((item) => {
            const draft = assistantLogReviewDrafts[item.id] || {
              reviewStatus: item.reviewStatus || 'NEW',
              adminMemo: item.adminMemo || '',
              recommendedAnswer: item.recommendedAnswer || '',
            }
            const hasSavedReview = Boolean(
              (item.reviewStatus && item.reviewStatus !== 'NEW')
              || (item.adminMemo && item.adminMemo.trim())
              || (item.recommendedAnswer && item.recommendedAnswer.trim())
              || assistantLogSaveMarks[item.id],
            )
            const isSaving = Boolean(assistantLogSavingIds[item.id])
            const savedAt = assistantLogSaveMarks[item.id] || item.updatedAt || item.createdAt

            return (
              <div key={item.id} className="surface" style={{ padding: '18px', background: '#fafafa' }}>
                <div className="detail-grid two-col">
                  <div>
                    <strong>질문자</strong>
                    <div>{item.userName || '-'} / {item.userEmail || '-'} / {item.userRole || '-'}</div>
                  </div>
                  <div>
                    <strong>응답 방식</strong>
                    <div>{item.mode} / {item.usedAi ? 'AI 생성' : '규칙 또는 보조 응답'}</div>
                  </div>
                </div>

                <div className="form-stack" style={{ marginTop: '12px' }}>
                  <label>
                    <span>질문</span>
                    <textarea rows="2" value={item.question || ''} readOnly />
                  </label>

                  <label>
                    <span>실제 답변</span>
                    <textarea rows="4" value={item.answer || ''} readOnly />
                  </label>

                  <label>
                    <span>참조된 정보</span>
                    <textarea rows="4" value={item.matchedKnowledge || ''} readOnly />
                  </label>

                  <div className="form-grid two-col compact-grid">
                    <label>
                      <span>검토 상태</span>
                      <select
                        value={draft.reviewStatus}
                        onChange={(e) => setAssistantLogReviewDrafts((prev) => ({
                          ...prev,
                          [item.id]: { ...draft, reviewStatus: e.target.value },
                        }))}
                      >
                        <option value="NEW">NEW</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="IMPROVE">IMPROVE</option>
                        <option value="BLOCKED">BLOCKED</option>
                      </select>
                    </label>

                    <label>
                      <span>생성 시각</span>
                      <input value={item.createdAt ? item.createdAt.replace('T', ' ') : '-'} readOnly />
                    </label>
                  </div>

                  <label>
                    <span>관리자 메모</span>
                    <textarea
                      rows="3"
                      placeholder="예: 정책성 질문은 먼저 현재 기준이라는 표현을 붙이고, 정확한 메뉴 경로를 함께 안내"
                      value={draft.adminMemo}
                      onChange={(e) => setAssistantLogReviewDrafts((prev) => ({
                        ...prev,
                        [item.id]: { ...draft, adminMemo: e.target.value },
                      }))}
                    />
                  </label>

                  <label>
                    <span>권장 답변 예시</span>
                    <textarea
                      rows="4"
                      placeholder="앞으로는 이런 식으로 답변하는 것이 좋습니다."
                      value={draft.recommendedAnswer}
                      onChange={(e) => setAssistantLogReviewDrafts((prev) => ({
                        ...prev,
                        [item.id]: { ...draft, recommendedAnswer: e.target.value },
                      }))}
                    />
                  </label>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '13px', color: hasSavedReview ? '#166534' : '#64748b', fontWeight: 600 }}>
                      {isSaving
                        ? '저장 중...'
                        : hasSavedReview
                          ? `검토 저장됨${savedAt ? ` · 마지막 수정 ${savedAt.replace('T', ' ')}` : ''}`
                          : '아직 검토 저장 전'}
                    </div>
                    <div className="table-actions">
                      <button className="btn btn-primary" onClick={() => saveAssistantLogReview(item.id)} disabled={isSaving}>
                        {hasSavedReview ? '검토 수정 저장' : '검토 저장'}
                      </button>
                      <button
                        className="btn btn-ghost small danger"
                        type="button"
                        onClick={() => {
                          if (window.confirm('이 AI 질문/답변 기록을 삭제할까요? 삭제 후 복구할 수 없습니다.')) {
                            removeAssistantLog(item.id)
                          }
                        }}
                        disabled={isSaving}
                      >
                        기록 삭제
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
