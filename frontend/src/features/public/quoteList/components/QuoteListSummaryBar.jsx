import SimpleSelect from "./SimpleSelect";

export default function QuoteListSummaryBar({
  totalCount,
  pageSize,
  sortOrder,
  onChangePageSize,
  onChangeSortOrder,
}) {
  return (
    <section className="quote-list-summary-bar">
      <div className="quote-list-summary-bar__left">
        <strong>
          전체 <span>{totalCount}건</span>
        </strong>
      </div>

      <div className="quote-list-summary-bar__right">
        <SimpleSelect
          value={pageSize}
          options={[
            { label: "10개씩 보기", value: 10 },
            { label: "20개씩 보기", value: 20 },
            { label: "30개씩 보기", value: 30 },
          ]}
          onChange={onChangePageSize}
          className="quote-list-size-select"
        />

        <SimpleSelect
          value={sortOrder}
          options={[
            { label: "최신 등록순", value: "latest" },
            { label: "운송일 빠른순", value: "transportSoon" },
            { label: "높은 운임순", value: "priceHigh" },
          ]}
          onChange={onChangeSortOrder}
          className="quote-list-sort-select"
        />
      </div>
    </section>
  );
}
