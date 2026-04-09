import { useState } from "react";
import SimpleSelect from "./SimpleSelect";

export default function QuoteListSummaryBar({ totalCount }) {
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [pageSize, setPageSize] = useState("10개씩 보기");
  const [sortOrder, setSortOrder] = useState("최신 등록순");

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
          options={["10개씩 보기", "20개씩 보기", "30개씩 보기"]}
          onChange={setPageSize}
          className="quote-list-size-select"
        />

        <SimpleSelect
          value={sortOrder}
          options={["최신 등록순", "마감 임박순", "높은 운임순"]}
          onChange={setSortOrder}
          className="quote-list-sort-select"
        />
      </div>
    </section>
  );
}
