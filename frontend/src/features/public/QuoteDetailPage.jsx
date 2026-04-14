import { useEffect, useMemo, useState } from "react";
import ShipperHeader from "./components/ShipperHeader";
import { QUOTE_LIST_DUMMY_DATA } from "./quoteList/constants/quoteListDummyData";
import QuoteDetailHeader from "./quoteDetail/components/QuoteDetailHeader";
import QuoteDetailMapSection from "./quoteDetail/components/QuoteDetailMapSection";
import QuoteDetailBasicInfoCard from "./quoteDetail/components/QuoteDetailBasicInfoCard";
import QuoteDetailCargoSection from "./quoteDetail/components/QuoteDetailCargoSection";
import QuoteEditModal from "./quoteDetail/components/QuoteEditModal";
import QuoteStepRoute from "../quoteRegister/steps/QuoteStepRoute";
import QuoteStepCargo from "../quoteRegister/steps/QuoteStepCargo";
import "./quoteDetail/quoteDetail.css";

export default function QuoteDetailPage({ controller, routeParams }) {
  const quoteId = Number(routeParams?.quoteId);
  const sourceQuote = QUOTE_LIST_DUMMY_DATA.find((item) => item.id === quoteId);

  const [bookmarked, setBookmarked] = useState(false);
  const [quoteState, setQuoteState] = useState(null);
  const [editStep, setEditStep] = useState(null);
  const [draftQuote, setDraftQuote] = useState(null);

  const isShipper = controller.auth?.role === "SHIPPER";

  useEffect(() => {
    if (sourceQuote) {
      setBookmarked(!!sourceQuote.bookmarked);
      setQuoteState(sourceQuote);
    }
  }, [sourceQuote]);

  const handleToggleBookmark = () => {
    setBookmarked((prev) => !prev);
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

  if (!quote) {
    return (
      <div className="public-shell">
        <ShipperHeader controller={controller} />
        <div className="quote-detail-page">
          <div className="quote-detail-empty">존재하지 않는 견적입니다.</div>
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
