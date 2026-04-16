import { useEffect, useMemo, useState } from "react";
import QuotePageHeader from "./components/QuotePageHeader";
import "./quoteList/quoteList.css";
import QuoteListFilterBar from "./quoteList/components/QuoteListFilterBar";
import QuoteListSummaryBar from "./quoteList/components/QuoteListSummaryBar";
import QuoteCard from "./quoteList/components/QuoteCard";
import QuoteListPagination from "./quoteList/components/QuoteListPagination";
import { shipmentToQuote } from "./quoteUtils";

export default function QuoteListPage({ controller }) {
  const [status, setStatus] = useState("전체");
  const [origin, setOrigin] = useState("전체");
  const [destination, setDestination] = useState("전체");
  const [ownerFilter, setOwnerFilter] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortOrder, setSortOrder] = useState("최신 등록순");

  // 기존 JSX에서 loading / error를 쓰고 있으므로 선언 필요
  const [loading] = useState(false);
  const [error] = useState("");

  const profileId = controller.profile?.id;

  const mappedQuotes = useMemo(
    () => (controller.shipments || []).map(shipmentToQuote),
    [controller.shipments],
  );

  const filteredQuotes = useMemo(() => {
    return mappedQuotes.filter((quote) => {
      const quoteStatus = quote.status || "입찰 진행중";
      const quoteOrigin = quote.originAddress || "";
      const quoteDestination = quote.destinationAddress || "";
      const isMine = profileId && quote.shipperId === profileId;

      const matchStatus = status === "전체" || quoteStatus === status;
      const matchOrigin = origin === "전체" || quoteOrigin.includes(origin);
      const matchDestination =
        destination === "전체" || quoteDestination.includes(destination);
      const matchOwner =
        ownerFilter === "전체" || (ownerFilter === "내 견적만" && isMine);

      return matchStatus && matchOrigin && matchDestination && matchOwner;
    });
  }, [mappedQuotes, status, origin, destination, ownerFilter, profileId]);

  const sortedQuotes = useMemo(() => {
    const copiedQuotes = [...filteredQuotes];

    return copiedQuotes.sort((a, b) => {
      if (sortOrder === "높은 운임순") {
        return Number(b.desiredPrice || 0) - Number(a.desiredPrice || 0);
      }

      if (sortOrder === "마감 임박순") {
        return (
          new Date(a.scheduledStartAt || a.transportDate || 0) -
          new Date(b.scheduledStartAt || b.transportDate || 0)
        );
      }

      return (
        new Date(b.createdAt || b.updatedAt || 0) -
        new Date(a.createdAt || a.updatedAt || 0)
      );
    });
  }, [filteredQuotes, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [status, origin, destination, ownerFilter, pageSize, sortOrder]);

  const totalCount = sortedQuotes.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  const paginatedQuotes = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedQuotes.slice(startIndex, endIndex);
  }, [sortedQuotes, currentPage, pageSize]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="public-shell">
      <QuotePageHeader controller={controller} />

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
          ownerFilter={ownerFilter}
          onChangeStatus={setStatus}
          onChangeOrigin={setOrigin}
          onChangeDestination={setDestination}
          onChangeOwnerFilter={setOwnerFilter}
          isLoggedIn={controller.isLoggedIn}
          isShipper={controller.auth?.role === "SHIPPER"}
        />

        <QuoteListSummaryBar
          totalCount={totalCount}
          ownerFilter={ownerFilter}
          onChangeOwnerFilter={setOwnerFilter}
          pageSize={pageSize}
          onChangePageSize={setPageSize}
          sortOrder={sortOrder}
          onChangeSortOrder={setSortOrder}
          onMoveToRegister={() => controller.setRoutePage("register")}
          isShipper={controller.auth?.role === "SHIPPER"}
        />

        <section className="quote-list-card-section">
          {loading ? (
            <p className="quote-list-empty">견적 목록을 불러오는 중입니다.</p>
          ) : error ? (
            <p className="quote-list-empty">{error}</p>
          ) : paginatedQuotes.length > 0 ? (
            paginatedQuotes.map((quote) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                onClickDetail={(quoteId) =>
                  controller.setRoutePage("detail", { quoteId })
                }
              />
            ))
          ) : (
            <p className="quote-list-empty">조건에 맞는 견적이 없습니다.</p>
          )}
        </section>

        <QuoteListPagination
          totalCount={totalCount}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
