import SimpleSelect from "./SimpleSelect";

export default function QuoteListSummaryBar({
  totalCount,
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
        {isShipper && (
          <button
            type="button"
            className="quote-list-register-button"
            onClick={onMoveToRegister}
          >
            견적 등록
          </button>
        )}

        <SimpleSelect
          value={`${pageSize}개씩 보기`}
          options={["10개씩 보기", "20개씩 보기", "30개씩 보기"]}
          onChange={(value) => onChangePageSize?.(Number(String(value).replace(/[^0-9]/g, "") || 10))}
          className="quote-list-size-select"
        />

        <SimpleSelect
          value={sortOrder}
          options={["최신 등록순", "마감 임박순", "높은 운임순"]}
          onChange={onChangeSortOrder}
          className="quote-list-sort-select"
        />
      </div>
    </section>
  );
}
