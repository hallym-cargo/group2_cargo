import "./quoteRegister.css";

export default function QuoteRegisterStepper({ steps, currentStep }) {
  return (
    <div className="quote-stepper-wrap">
      <h2 className="quote-stepper-title">견적등록</h2>

      <ol className="quote-stepper">
        {steps.map((step) => {
          let stepClassName = "";

          if (step.id < currentStep) {
            stepClassName = "done";
          } else if (step.id === currentStep) {
            stepClassName = "active";
          }

          return (
            <li key={step.id} className={stepClassName}>
              <span className="step-inner">
                {step.id === currentStep && (
                  <em className="sr-only">현재단계</em>
                )}
                <i className="step">{step.id}단계</i>
                <span className="step-tit">{step.label}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
