import SimpleSelect from "./SimpleSelect";

export default function QuoteListSummaryBar({
  totalCount,
  ownerFilter,
  onChangeOwnerFilter,
  pageSize,
  onChangePageSize,
  sortOrder,
  onChangeSortOrder,
  onMoveToRegister,
  isShipper,
}) {
  return (
    <section className="quote-list-summary-bar">
      <div className="quote-list-summary-bar__left">
        <strong>
          전체 <span>{totalCount}건</span>
        </strong>
      </div>

      <div className="quote-list-summary-bar__right">
        <label>
          <span className="sr-only">작성자 필터</span>
          <select
            value={ownerFilter}
            onChange={(e) => onChangeOwnerFilter?.(e.target.value)}
          >
            <option value="전체">전체 보기</option>
            <option value="내 견적만">내 견적만</option>
          </select>
        </label>

        <label>
          <span className="sr-only">정렬</span>
          <select
            value={sortOrder}
            onChange={(e) => onChangeSortOrder(e.target.value)}
          >
            <option value="latest">최신 등록순</option>
            <option value="transportSoon">마감 임박순</option>
            <option value="priceHigh">높은 운임순</option>
          </select>
        </label>

        <label>
          <span className="sr-only">페이지 크기</span>
          <select
            value={pageSize}
            onChange={(e) => onChangePageSize(Number(e.target.value))}
          >
            <option value={10}>10개씩 보기</option>
            <option value={20}>20개씩 보기</option>
            <option value={30}>30개씩 보기</option>
          </select>
        </label>

        {isShipper && (
          <button
            type="button"
            className="primary-button"
            onClick={onMoveToRegister}
          >
            견적 등록하기
          </button>
        )}
      </div>
    </section>
  );
}
