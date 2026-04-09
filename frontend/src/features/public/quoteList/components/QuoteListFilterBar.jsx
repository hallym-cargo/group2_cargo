export default function QuoteListFilterBar() {
  return (
    <section className="quote-list-filter-bar">
      <div className="quote-list-filter-grid">
        <div className="quote-list-filter-item">
          <label>진행상태</label>
          <select>
            <option>전체</option>
            <option>입찰 진행중</option>
            <option>배차 완료</option>
          </select>
        </div>

        <div className="quote-list-filter-item">
          <label>출발지</label>
          <select>
            <option>전체</option>
          </select>
        </div>

        <div className="quote-list-filter-item">
          <label>도착지</label>
          <select>
            <option>전체</option>
          </select>
        </div>
      </div>
    </section>
  );
}
