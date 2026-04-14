// 화주용 견적 등록 페이지
import QuoteRegisterContainer from "../quoteRegister/QuoteRegisterContainer";
import ShipperHeader from "./components/ShipperHeader";

export default function QuoteRegisterPage({ controller }) {
  return (
    <div className="public-shell">
      <ShipperHeader controller={controller} />
      <QuoteRegisterContainer
        onMoveToQuoteList={() => controller.setRoutePage("quotes")}
      />
    </div>
  );
}
