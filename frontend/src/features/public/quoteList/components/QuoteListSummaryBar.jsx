import SimpleSelect from "./SimpleSelect";

export default function QuoteListSummaryBar({
  totalCount,
  pageSize,
<<<<<<< HEAD
  sortOrder,
  onChangePageSize,
  onChangeSortOrder,
=======
  onChangePageSize,
  sortOrder,
  onChangeSortOrder,
  onMoveToRegister,
  isShipper,
>>>>>>> main
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
<<<<<<< HEAD
          value={pageSize}
          options={[
            { label: "10개씩 보기", value: 10 },
            { label: "20개씩 보기", value: 20 },
            { label: "30개씩 보기", value: 30 },
          ]}
          onChange={onChangePageSize}
=======
          value={`${pageSize}개씩 보기`}
          options={["10개씩 보기", "20개씩 보기", "30개씩 보기"]}
          onChange={(value) => onChangePageSize?.(Number(String(value).replace(/[^0-9]/g, "") || 10))}
>>>>>>> main
          className="quote-list-size-select"
        />

        <SimpleSelect
          value={sortOrder}
<<<<<<< HEAD
          options={[
            { label: "최신 등록순", value: "latest" },
            { label: "운송일 빠른순", value: "transportSoon" },
            { label: "높은 운임순", value: "priceHigh" },
          ]}
=======
          options={["최신 등록순", "마감 임박순", "높은 운임순"]}
>>>>>>> main
          onChange={onChangeSortOrder}
          className="quote-list-sort-select"
        />
      </div>
    </section>
  );
}
