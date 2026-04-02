import SectionTitle from '../../../components/common/SectionTitle'
import { formatDate } from '../../../utils/formatters'

export default function PublicInfoSection({ controller }) {
  const { publicData, inquiryForm, setInquiryForm, handleInquiry } = controller

  return (
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
  )
}
