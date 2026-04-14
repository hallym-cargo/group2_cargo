import { useEffect, useMemo, useState } from "react";
import ShipperHeader from "./components/ShipperHeader";
import DriverHeader from "./components/DriverHeader";
import "./quoteList/quoteList.css";
import QuoteListFilterBar from "./quoteList/components/QuoteListFilterBar";
import QuoteListSummaryBar from "./quoteList/components/QuoteListSummaryBar";
import QuoteCard from "./quoteList/components/QuoteCard";
import QuoteListPagination from "./quoteList/components/QuoteListPagination";
import { fetchShipments } from "../../api";

function formatDate(dateTimeString) {
  if (!dateTimeString) return "";
  const date = new Date(dateTimeString);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(dateTimeString) {
  if (!dateTimeString) return "";
  const date = new Date(dateTimeString);
  if (Number.isNaN(date.getTime())) return "";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function mapShipmentToQuoteCard(shipment) {
  return {
    id: shipment.id,
    estimateName: shipment.title,
    originAddress: shipment.originAddress,
    destinationAddress: shipment.destinationAddress,
    transportDate: formatDate(shipment.scheduledStartAt),
    transportTime: formatTime(shipment.scheduledStartAt),

    desiredPrice: shipment.agreedPrice ?? shipment.bestOfferPrice ?? null,
    priceProposalAllowed: false,
    cargoType: shipment.cargoType,
    vehicleType: shipment.vehicleType ?? null,

    status: shipment.status,
    cargoImages: shipment.cargoImageUrls ?? [],
    createdAt: shipment.createdAt,
  };
}

export default function QuoteListPage({ controller }) {
  const [status, setStatus] = useState("전체");
  const [origin, setOrigin] = useState("전체");
  const [destination, setDestination] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);

  const [pageSize, setPageSize] = useState(10);
  const [sortOrder, setSortOrder] = useState("latest");

  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const role = controller.auth?.role;
  const isShipper = role === "SHIPPER";
  const isDriver = role === "DRIVER";

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const data = await fetchShipments(0, 100);
        const shipmentList = Array.isArray(data) ? data : (data?.content ?? []);

        const mappedQuotes = shipmentList.map(mapShipmentToQuoteCard);
        setQuotes(mappedQuotes);
      } catch (err) {
        console.error("견적 목록 조회 실패:", err);
        setError("견적 목록을 불러오지 못했습니다.");
        setQuotes([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const visibleQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      return quote.status === "BIDDING" || quote.status === "CONFIRMED";
    });
  }, [quotes]);

  const filteredQuotes = useMemo(() => {
    return visibleQuotes.filter((quote) => {
      const quoteStatus = quote.status || "BIDDING";
      const quoteOrigin = quote.originAddress || "";
      const quoteDestination = quote.destinationAddress || "";

      const matchStatus =
        status === "전체" ||
        (status === "입찰 진행중" && quoteStatus === "BIDDING") ||
        (status === "배차 완료" && quoteStatus === "CONFIRMED");

      const matchOrigin = origin === "전체" || quoteOrigin.includes(origin);
      const matchDestination =
        destination === "전체" || quoteDestination.includes(destination);

      return matchStatus && matchOrigin && matchDestination;
    });
  }, [visibleQuotes, status, origin, destination]);

  const sortedQuotes = useMemo(() => {
    const copiedQuotes = [...filteredQuotes];

    if (sortOrder === "latest") {
      return copiedQuotes.sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });
    }

    if (sortOrder === "transportSoon") {
      return copiedQuotes.sort((a, b) => {
        const aDate = new Date(
          `${a.transportDate}T${a.transportTime || "00:00"}`,
        );
        const bDate = new Date(
          `${b.transportDate}T${b.transportTime || "00:00"}`,
        );
        return aDate - bDate;
      });
    }

    if (sortOrder === "priceHigh") {
      return copiedQuotes.sort(
        (a, b) => Number(b.desiredPrice || 0) - Number(a.desiredPrice || 0),
      );
    }

    return copiedQuotes;
  }, [filteredQuotes, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [status, origin, destination, pageSize, sortOrder]);

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
      {isDriver ? (
        <DriverHeader controller={controller} />
      ) : (
        <ShipperHeader controller={controller} />
      )}

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
          totalCount={totalCount}
          pageSize={pageSize}
          sortOrder={sortOrder}
          onChangePageSize={setPageSize}
          onChangeSortOrder={setSortOrder}
          onMoveToRegister={
            isShipper ? () => controller.setRoutePage("register") : undefined
          }
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
