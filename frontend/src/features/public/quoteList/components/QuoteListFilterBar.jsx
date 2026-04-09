import { useState } from "react";
import RegionSelect from "./RegionSelect";
import StatusSelect from "./StatusSelect";

export default function QuoteListFilterBar() {
  const [status, setStatus] = useState("전체");
  const [origin, setOrigin] = useState("전체");
  const [destination, setDestination] = useState("전체");

  return (
    <section className="quote-list-filter-bar">
      <div className="quote-list-filter-grid">
        <div className="quote-list-filter-item">
          <label>진행상태</label>
          <StatusSelect value={status} onChange={setStatus} />
        </div>

        <div className="quote-list-filter-item">
          <label>출발지</label>
          <RegionSelect value={origin} onChange={setOrigin} />
        </div>

        <div className="quote-list-filter-item">
          <label>도착지</label>
          <RegionSelect value={destination} onChange={setDestination} />
        </div>
      </div>
    </section>
  );
}
