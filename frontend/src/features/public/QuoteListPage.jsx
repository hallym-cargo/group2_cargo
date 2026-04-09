import ShipperHeader from "./components/ShipperHeader";
import "./quoteList/quoteList.css";
import QuoteListFilterBar from "./quoteList/components/QuoteListFilterBar";
import QuoteListSummaryBar from "./quoteList/components/QuoteListSummaryBar";
import QuoteQuoteCard from "./quoteList/components/QuoteQuoteCard";
import QuoteListPagination from "./quoteList/components/QuoteListPagination";
import { QUOTE_LIST_DUMMY_DATA } from "./quoteList/constants/quoteListDummyData";

export default function QuoteListPage({ controller }) {
  const quotes = QUOTE_LIST_DUMMY_DATA;

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

        <QuoteListFilterBar />
        <QuoteListSummaryBar
          totalCount={quotes.length}
          onMoveToRegister={() => controller.setRoutePage("register")}
        />

        <section className="quote-list-card-section">
          {quotes.map((quote) => (
            <QuoteQuoteCard key={quote.id} quote={quote} />
          ))}
        </section>

        <QuoteListPagination />
      </div>
    </div>
  );
}
