export default function QuoteListPagination() {
  return (
    <div className="quote-list-pagination">
      <button type="button" className="quote-list-page-button">
        ← 이전
      </button>

      <button type="button" className="quote-list-page-number is-active">
        1
      </button>
      <button type="button" className="quote-list-page-number">
        2
      </button>
      <button type="button" className="quote-list-page-number">
        3
      </button>
      <button type="button" className="quote-list-page-number">
        4
      </button>
      <button type="button" className="quote-list-page-number">
        5
      </button>

      <button type="button" className="quote-list-page-button">
        다음 →
      </button>
    </div>
  );
}
