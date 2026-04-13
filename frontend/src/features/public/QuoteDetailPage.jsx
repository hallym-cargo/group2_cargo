import ShipperHeader from "./components/ShipperHeader";
import { QUOTE_LIST_DUMMY_DATA } from "./quoteList/constants/quoteListDummyData";
import QuoteDetailHeader from "./quoteDetail/components/QuoteDetailHeader";
import QuoteDetailMapSection from "./quoteDetail/components/QuoteDetailMapSection";
import QuoteDetailActionPanel from "./quoteDetail/components/QuoteDetailActionPanel";
import QuoteDetailBasicInfoCard from "./quoteDetail/components/QuoteDetailBasicInfoCard";
import QuoteDetailCargoInfoCard from "./quoteDetail/components/QuoteDetailCargoInfoCard";
import QuoteDetailPhotoCard from "./quoteDetail/components/QuoteDetailPhotoCard";
import "./quoteDetail/quoteDetail.css";

export default function QuoteDetailPage({ controller, routeParams }) {
  const quoteId = Number(routeParams?.quoteId);
  const quote = QUOTE_LIST_DUMMY_DATA.find((item) => item.id === quoteId);

  if (!quote) {
    return (
      <div className="public-shell">
        <ShipperHeader controller={controller} />

        <div className="quote-detail-page">
          <div className="quote-detail-page__top">
            <button
              type="button"
              className="quote-detail-page__back-button"
              onClick={() => controller.setRoutePage("quotes")}
            >
              ← 목록으로
            </button>
          </div>

          <div className="quote-detail-empty">존재하지 않는 견적입니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-shell">
      <ShipperHeader controller={controller} />

      <div className="quote-detail-page">
        <div className="quote-detail-page__top">
          <button
            type="button"
            className="quote-detail-page__back-button"
            onClick={() => controller.setRoutePage("quotes")}
          >
            ← 목록으로
          </button>
        </div>

        <QuoteDetailHeader quote={quote} />

        <div className="quote-detail-top-grid">
          <div className="quote-detail-map-column">
            <QuoteDetailMapSection quote={quote} />
          </div>

          <div className="quote-detail-side-column">
            <QuoteDetailActionPanel quote={quote} controller={controller} />
            <QuoteDetailPhotoCard quote={quote} />
          </div>
        </div>

        <div className="quote-detail-bottom-grid">
          <QuoteDetailBasicInfoCard quote={quote} />
          <QuoteDetailCargoInfoCard quote={quote} />
        </div>
      </div>
    </div>
  );
}
