import { useEffect, useMemo, useState } from "react";
import ShipperHeader from "./components/ShipperHeader";
import { fetchShipment, toggleBookmark } from "../../api";
import QuoteDetailHeader from "./quoteDetail/components/QuoteDetailHeader";
import QuoteDetailMapSection from "./quoteDetail/components/QuoteDetailMapSection";
import QuoteDetailBasicInfoCard from "./quoteDetail/components/QuoteDetailBasicInfoCard";
import QuoteDetailCargoSection from "./quoteDetail/components/QuoteDetailCargoSection";
import QuoteEditModal from "./quoteDetail/components/QuoteEditModal";
import QuoteStepRoute from "../quoteRegister/steps/QuoteStepRoute";
import QuoteStepCargo from "../quoteRegister/steps/QuoteStepCargo";
import "./quoteDetail/quoteDetail.css";

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

function mapShipmentToQuoteDetail(shipment) {
  return {
    id: shipment.id,
    status: shipment.status,
    bookmarked: shipment.bookmarked ?? false,

    // 헤더 / 기본 정보
    estimateName: shipment.title ?? "",
    title: shipment.title ?? "",
    originAddress: shipment.originAddress ?? "",
    originDetailAddress: "",
    destinationAddress: shipment.destinationAddress ?? "",
    destinationDetailAddress: "",
    transportDate: formatDate(shipment.scheduledStartAt),
    transportTime: formatTime(shipment.scheduledStartAt),

    // 화물 정보
    vehicleType: shipment.vehicleType ?? null,
    cargoType: shipment.cargoType ?? "",
    cargoName: shipment.cargoName ?? shipment.title ?? "",
    weight: shipment.weightKg ?? null,
    weightUnit: shipment.weightKg != null ? "kg" : "",
    requestNote: shipment.description ?? "",
    desiredPrice:
      shipment.desiredPrice ??
      shipment.agreedPrice ??
      shipment.bestOfferPrice ??
      null,
    priceProposalAllowed: shipment.priceProposalAllowed ?? false,

    // 지도 / 경로
    originLat: shipment.originLat ?? null,
    originLng: shipment.originLng ?? null,
    destinationLat: shipment.destinationLat ?? null,
    destinationLng: shipment.destinationLng ?? null,
    estimatedMinutes: shipment.estimatedMinutes ?? null,
    estimatedDistanceKm: shipment.estimatedDistanceKm ?? null,
    tracking: shipment.tracking ?? null,

    // 이미지
    cargoImages: shipment.cargoImageUrls ?? [],
  };
}

export default function QuoteDetailPage({ controller, routeParams }) {
  const quoteId = Number(routeParams?.quoteId);

  const [bookmarked, setBookmarked] = useState(false);
  const [quoteState, setQuoteState] = useState(null);
  const [editStep, setEditStep] = useState(null);
  const [draftQuote, setDraftQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isShipper = controller.auth?.role === "SHIPPER";
  const isDriver = controller.auth?.role === "DRIVER";

  useEffect(() => {
    async function loadQuote() {
      if (!quoteId) {
        setError("잘못된 견적 ID입니다.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await fetchShipment(quoteId);
        const shipment = data?.data ?? data;
        const mappedQuote = mapShipmentToQuoteDetail(shipment);

        setBookmarked(!!mappedQuote.bookmarked);
        setQuoteState(mappedQuote);
      } catch (err) {
        console.error("견적 상세 조회 실패:", err);
        setError("견적 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }

    loadQuote();
  }, [quoteId]);

  const handleToggleBookmark = async () => {
    if (!quote?.id) return;

    try {
      const result = await toggleBookmark(quote.id);

      if (typeof result?.bookmarked === "boolean") {
        setBookmarked(result.bookmarked);
        return;
      }

      setBookmarked((prev) => !prev);
    } catch (error) {
      console.error("북마크 토글 실패:", error);
      alert("북마크 반영에 실패했습니다.");
    }
  };

  const openEditStep = (step) => {
    if (!quoteState) return;
    setDraftQuote({ ...quoteState });
    setEditStep(step);
  };

  const closeEditModal = () => {
    setEditStep(null);
    setDraftQuote(null);
  };

  const handleSaveEdit = () => {
    if (!draftQuote) return;

    // 아직 서버 수정 API 연결 전
    setQuoteState(draftQuote);
    closeEditModal();
  };

  const handleDelete = () => {
    console.log("삭제", quoteState?.id);
  };

  const updateDraftField = (fieldName, value) => {
    setDraftQuote((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const quote = useMemo(() => {
    if (!quoteState) return null;

    return {
      ...quoteState,
      bookmarked,
    };
  }, [quoteState, bookmarked]);

  if (loading) {
    return (
      <div className="public-shell">
        <ShipperHeader controller={controller} />
        <div className="quote-detail-page">
          <div className="quote-detail-empty">
            견적 정보를 불러오는 중입니다.
          </div>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="public-shell">
        <ShipperHeader controller={controller} />
        <div className="quote-detail-page">
          <div className="quote-detail-empty">
            {error || "존재하지 않는 견적입니다."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-shell">
      <ShipperHeader controller={controller} />

      <div className="quote-detail-page">
        <QuoteDetailHeader
          quote={quote}
          onToggleBookmark={handleToggleBookmark}
          isShipper={isShipper}
          isDriver={isDriver}
          onClickDelete={handleDelete}
        />

        <div className="quote-detail-layout">
          <div className="quote-detail-left-column">
            <QuoteDetailMapSection quote={quote} />
            <QuoteDetailBasicInfoCard
              quote={quote}
              isShipper={isShipper}
              onClickEdit={() => openEditStep(1)}
            />
          </div>

          <div className="quote-detail-right-column">
            <QuoteDetailCargoSection
              quote={quote}
              isShipper={isShipper}
              onClickEdit={() => openEditStep(2)}
            />
          </div>
        </div>
      </div>

      <QuoteEditModal
        isOpen={editStep === 1}
        title="기본 정보 수정"
        onClose={closeEditModal}
      >
        {draftQuote && (
          <>
            <QuoteStepRoute
              formData={draftQuote}
              errors={{}}
              updateField={updateDraftField}
            />

            <div className="quote-edit-modal__footer">
              <button
                type="button"
                className="quote-edit-modal__cancel-btn"
                onClick={closeEditModal}
              >
                취소
              </button>
              <button
                type="button"
                className="quote-edit-modal__save-btn"
                onClick={handleSaveEdit}
              >
                저장
              </button>
            </div>
          </>
        )}
      </QuoteEditModal>

      <QuoteEditModal
        isOpen={editStep === 2}
        title="화물 정보 수정"
        onClose={closeEditModal}
      >
        {draftQuote && (
          <>
            <QuoteStepCargo
              formData={draftQuote}
              errors={{}}
              updateField={updateDraftField}
            />

            <div className="quote-edit-modal__footer">
              <button
                type="button"
                className="quote-edit-modal__cancel-btn"
                onClick={closeEditModal}
              >
                취소
              </button>
              <button
                type="button"
                className="quote-edit-modal__save-btn"
                onClick={handleSaveEdit}
              >
                저장
              </button>
            </div>
          </>
        )}
      </QuoteEditModal>
    </div>
  );
}
