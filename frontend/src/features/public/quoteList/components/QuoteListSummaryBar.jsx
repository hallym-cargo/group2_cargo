export default function QuoteListSummaryBar({ totalCount }) {
  return (
    <section className="quote-list-summary-bar">
      <div className="quote-list-summary-bar__left">
        <strong>
          전체 <span>{totalCount}건</span>
        </strong>
      </div>

      <div className="quote-list-summary-bar__right">
        <label className="quote-list-checkbox">
          <input type="checkbox" />
          <span>진행중인 공고만 보기</span>
        </label>

        <select className="quote-list-control-select quote-list-size-select">
          <option>10개씩 보기</option>
          <option>20개씩 보기</option>
          <option>30개씩 보기</option>
        </select>

        <select className="quote-list-control-select quote-list-sort-select">
          <option>최신 등록순</option>
          <option>마감 임박순</option>
          <option>희망 운임순</option>
        </select>
      </div>
    </section>
  );
}
