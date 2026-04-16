import { useEffect, useMemo, useState } from "react";
import PublicHeader from "./components/PublicHeader";
import ShipperHeader from "./components/ShipperHeader";
import DriverHeader from "./components/DriverHeader";
import QuoteDetailHeader from "./quoteDetail/components/QuoteDetailHeader";
import QuoteDetailMapSection from "./quoteDetail/components/QuoteDetailMapSection";
import QuoteDetailBasicInfoCard from "./quoteDetail/components/QuoteDetailBasicInfoCard";
import QuoteDetailCargoSection from "./quoteDetail/components/QuoteDetailCargoSection";
import QuoteEditModal from "./quoteDetail/components/QuoteEditModal";
import QuoteStepRoute from "../quoteRegister/steps/QuoteStepRoute";
import QuoteStepCargo from "../quoteRegister/steps/QuoteStepCargo";
import "./quoteDetail/quoteDetail.css";
import { fetchShipment, toggleBookmark, updateShipment } from "../../api";
import { quoteFormToShipmentPayload, shipmentToQuote } from "./quoteUtils";
import DriverBidPanel from "./quoteDetail/components/DriverBidPanel";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        dataUrl: typeof reader.result === "string" ? reader.result : "",
        name: file.name,
      });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function QuoteDetailPage({ controller, routeParams }) {
  const quoteId = Number(routeParams?.quoteId);

  const [bookmarked, setBookmarked] = useState(false);
  const [quoteState, setQuoteState] = useState(null);
  const [editStep, setEditStep] = useState(null);
  const [draftQuote, setDraftQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);

  const isDriver = controller.auth?.role === "DRIVER";

  const isOwner =
    controller.auth?.role === "SHIPPER" &&
    controller.profile?.id &&
    controller.profile.id === quoteState?.shipperId;

  const canBid =
    isDriver &&
    (quoteState?.status === "BIDDING" || quoteState?.status === "입찰 진행중");

  const openBidModal = () => {
    if (!canBid) return;
    setIsBidModalOpen(true);
  };

  const closeBidModal = () => {
    setIsBidModalOpen(false);
  };

  const loadQuote = async () => {
    if (!quoteId) {
      setError("잘못된 견적 ID입니다.");
      setQuoteState(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await fetchShipment(quoteId);
      const shipment = data?.data ?? data;
      const mapped = shipmentToQuote(shipment);

      setBookmarked(!!mapped.bookmarked);
      setQuoteState(mapped);
    } catch (err) {
      const message =
        err.response?.data?.message || "견적을 불러오지 못했습니다.";
      setError(message);
      setQuoteState(null);
      controller.setMessage?.(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuote();
  }, [quoteId]);

  const handleToggleBookmark = async () => {
    if (!quoteId) return;

    try {
      const result = await toggleBookmark(quoteId);
      const nextBookmarked = !!result?.bookmarked;

      setBookmarked(nextBookmarked);
      setQuoteState((prev) =>
        prev ? { ...prev, bookmarked: nextBookmarked } : prev,
      );
    } catch (err) {
      controller.setMessage?.(
        err.response?.data?.message || "북마크 처리 실패",
      );
    }
  };

  const openEditStep = (step) => {
    if (!quoteState || !isOwner) return;
    setDraftQuote({ ...quoteState });
    setEditStep(step);
  };

  const closeEditModal = () => {
    if (saving) return;
    setEditStep(null);
    setDraftQuote(null);
  };

  const updateDraftField = (fieldName, value) => {
    setDraftQuote((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSaveEdit = async () => {
    if (!draftQuote) return;

    try {
      setSaving(true);

      const mixedImages = Array.isArray(draftQuote.cargoImages)
        ? draftQuote.cargoImages
        : [];

      const existingUrls = mixedImages.filter(
        (item) => typeof item === "string",
      );
      const newFiles = mixedImages.filter((item) => item instanceof File);

      const converted = await Promise.all(newFiles.map(fileToDataUrl));

      const payload = quoteFormToShipmentPayload(
        draftQuote,
        [...existingUrls, ...converted.map((item) => item.dataUrl)],
        [
          ...existingUrls.map((_, index) => `existing-image-${index + 1}`),
          ...converted.map((item) => item.name),
        ],
      );

      const updated = await updateShipment(quoteId, payload);
      const shipment = updated?.data ?? updated;
      const mapped = shipmentToQuote(shipment);

      setQuoteState(mapped);
      setBookmarked(!!mapped.bookmarked);
      closeEditModal();
      controller.setMessage?.("견적이 수정되었습니다.");
    } catch (err) {
      controller.setMessage?.(err.response?.data?.message || "견적 수정 실패");
    } finally {
      setSaving(false);
    }
  };

  const quote = useMemo(() => {
    if (!quoteState) return null;

    return {
      ...quoteState,
      bookmarked,
    };
  }, [quoteState, bookmarked]);

  const headerContent = controller.isLoggedIn ? (
    controller.auth?.role === "DRIVER" ? (
      <DriverHeader controller={controller} />
    ) : controller.auth?.role === "SHIPPER" ? (
      <ShipperHeader controller={controller} />
    ) : (
      <PublicHeader
        isLoggedIn={controller.isLoggedIn}
        authMode={controller.authMode}
        setAuthMode={controller.setAuthMode}
        setDashboardTab={controller.setDashboardTab}
        logout={controller.logout}
        controller={controller}
      />
    )
  ) : (
    <PublicHeader
      isLoggedIn={controller.isLoggedIn}
      authMode={controller.authMode}
      setAuthMode={controller.setAuthMode}
      setDashboardTab={controller.setDashboardTab}
      logout={controller.logout}
      controller={controller}
    />
  );

  if (loading) {
    return (
      <div className="public-shell landing-shell">
        {headerContent}

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
      <div className="public-shell landing-shell">
        {headerContent}

        <div className="quote-detail-page">
          <div className="quote-detail-empty">
            {error || "존재하지 않는 견적입니다."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-shell landing-shell">
      {headerContent}

      <div className="quote-detail-page">
        <QuoteDetailHeader
          quote={quote}
          onToggleBookmark={handleToggleBookmark}
          isShipper={isOwner}
          isDriver={isDriver}
          onClickBid={openBidModal}
        />

        <div className="quote-detail-layout">
          <div className="quote-detail-left-column">
            <QuoteDetailMapSection quote={quote} />
            <QuoteDetailBasicInfoCard
              quote={quote}
              canEdit={isOwner}
              onClickEdit={() => openEditStep(1)}
            />
          </div>

          <div className="quote-detail-right-column">
            <QuoteDetailCargoSection
              quote={quote}
              canEdit={isOwner}
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
                disabled={saving}
              >
                취소
              </button>
              <button
                type="button"
                className="quote-edit-modal__save-btn"
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? "저장 중..." : "저장"}
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
                disabled={saving}
              >
                취소
              </button>
              <button
                type="button"
                className="quote-edit-modal__save-btn"
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </>
        )}
      </QuoteEditModal>

      <QuoteEditModal
        isOpen={isBidModalOpen}
        title="입찰 제안하기"
        onClose={closeBidModal}
      >
        <DriverBidPanel onClose={closeBidModal} />
      </QuoteEditModal>
    </div>
  );
}
