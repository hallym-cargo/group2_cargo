import { useMemo, useState } from "react";
import ShipperHeader from "./components/ShipperHeader";
import "./quoteList/quoteList.css";
import QuoteListFilterBar from "./quoteList/components/QuoteListFilterBar";
import QuoteListSummaryBar from "./quoteList/components/QuoteListSummaryBar";
import QuoteCard from "./quoteList/components/QuoteCard";
import QuoteListPagination from "./quoteList/components/QuoteListPagination";
import { QUOTE_LIST_DUMMY_DATA } from "./quoteList/constants/quoteListDummyData";

export default function QuoteListPage({ controller }) {
  const [status, setStatus] = useState("전체");
  const [origin, setOrigin] = useState("전체");
  const [destination, setDestination] = useState("전체");

  const filteredQuotes = useMemo(() => {
    return QUOTE_LIST_DUMMY_DATA.filter((quote) => {
      const quoteStatus = quote.status || "입찰 진행중";
      const quoteOrigin = quote.originAddress || "";
      const quoteDestination = quote.destinationAddress || "";

      const matchStatus = status === "전체" || quoteStatus === status;
      const matchOrigin = origin === "전체" || quoteOrigin.includes(origin);
      const matchDestination =
        destination === "전체" || quoteDestination.includes(destination);

      return matchStatus && matchOrigin && matchDestination;
    });
  }, [status, origin, destination]);

  return (
    <div className="public-shell">
      <ShipperHeader controller={controller} />

      <div className="quote-list-page">
        <section className="quote-list-hero">
          <div className="quote-list-hero__badge">QUOTE LIST</div>
          <h1>견적 목록</h1>
          <p>
            등록된 견적을 확인하고 조건에 맞는 운송 요청을 비교할 수 있습니다.
          </p>
        </section>

        <QuoteListFilterBar
          status={status}
          origin={origin}
          destination={destination}
          onChangeStatus={setStatus}
          onChangeOrigin={setOrigin}
          onChangeDestination={setDestination}
        />

        <QuoteListSummaryBar
          totalCount={filteredQuotes.length}
          onMoveToRegister={() => controller.setRoutePage("register")}
        />

        <section className="quote-list-card-section">
          {filteredQuotes.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))}
        </section>

        <QuoteListPagination />
      </div>
    </div>
  );
}
