import SimpleSelect from "./SimpleSelect";

const PAGE_SIZE_OPTIONS = [
  { value: 10, label: "10개씩 보기" },
  { value: 20, label: "20개씩 보기" },
  { value: 30, label: "30개씩 보기" },
];

const SORT_OPTIONS = [
  { value: "최신 등록순", label: "최신 등록순" },
  { value: "마감 임박순", label: "마감 임박순" },
  { value: "높은 운임순", label: "높은 운임순" },
];

export default function QuoteListSummaryBar({
  totalCount,
  ownerFilter,
  onChangeOwnerFilter,
  pageSize,
  onChangePageSize,
  sortOrder,
  onChangeSortOrder,
  isLoggedIn,
  isShipper,
}) {
  return (
    <section className="quote-list-summary-bar">
      <div className="quote-list-summary-bar__left">
        <strong>
          전체 <span>{totalCount}건</span>
        </strong>

        {isLoggedIn && isShipper && (
          <div className="quote-list-owner-toggle">
            <button
              type="button"
              className={ownerFilter === "전체" ? "is-active" : ""}
              onClick={() => onChangeOwnerFilter?.("전체")}
            >
              전체
            </button>
            <button
              type="button"
              className={ownerFilter === "내 견적만" ? "is-active" : ""}
              onClick={() => onChangeOwnerFilter?.("내 견적만")}
            >
              내 견적만
            </button>
          </div>
        )}
      </div>

      <div className="quote-list-summary-bar__right">
        <div className="quote-list-size-select">
          <SimpleSelect
            value={pageSize}
            options={PAGE_SIZE_OPTIONS}
            onChange={(value) => onChangePageSize?.(Number(value))}
          />
        </div>

        <div className="quote-list-sort-select">
          <SimpleSelect
            value={sortOrder}
            options={SORT_OPTIONS}
            onChange={onChangeSortOrder}
          />
        </div>
      </div>
    </section>
  );
}
