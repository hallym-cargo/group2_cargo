// 화주용 견적 등록 페이지
import QuoteRegisterContainer from "../quoteRegister/QuoteRegisterContainer";
import QuotePageHeader from "./components/QuotePageHeader";

export default function QuoteRegisterPage({ controller }) {
  return (
    <div className="public-shell">
      <QuotePageHeader controller={controller} />
      <QuoteRegisterContainer
        controller={controller}
        onMoveToQuoteList={(created) => controller.setRoutePage("detail", { quoteId: created?.id })}
      />
    </div>
  );
}
