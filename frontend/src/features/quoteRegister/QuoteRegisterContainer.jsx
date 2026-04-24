import "./quoteRegister.css";
import QuoteRegisterStepper from "./QuoteRegisterStepper";
import QuoteRegisterActions from "./QuoteRegisterActions";
import QuoteStepRoute from "./steps/QuoteStepRoute";
import QuoteStepCargo from "./steps/QuoteStepCargo";
import QuoteStepReview from "./steps/QuoteStepReview";
import useQuoteRegisterForm from "./hooks/useQuoteRegisterForm";
import { QUOTE_REGISTER_STEPS } from "./constants/quoteRegisterSteps";

export default function QuoteRegisterContainer({ controller, onMoveToQuoteList }) {
  const {
    currentStep,
    formData,
    errors,
    activePanel,
    updateField,
    setRouteAddress,
    openPanel,
    closePanel,
    goPrevStep,
    goNextStep,
    submitForm,
  } = useQuoteRegisterForm(controller);

  const isRouteStepValid =
    !!(formData.estimateName || "").trim() &&
    !!(formData.originAddress || "").trim() &&
    !!(formData.originDetailAddress || "").trim() &&
    !!(formData.destinationAddress || "").trim() &&
    !!(formData.destinationDetailAddress || "").trim() &&
    !!(formData.transportDate || "").trim() &&
    !!(formData.transportTime || "").trim() &&
    (formData.originAddress || "").trim() !==
      (formData.destinationAddress || "").trim();

  const isCargoStepValid =
    (formData.vehicleNeedConsult || !!(formData.vehicleType || "").trim()) &&
    !!(formData.cargoType || "").trim() &&
    !!(formData.cargoName || "").trim() &&
    (formData.weightNeedConsult || !!(formData.weight || "").trim()) &&
    !!(formData.desiredPrice || "").trim();

  const handleSubmit = async () => {
    const created = await submitForm();

    if (!created) return;

    if (typeof onMoveToQuoteList === "function") {
      onMoveToQuoteList(created);
    }
  };

  let stepContent = null;
  let isCurrentStepValid = true;

  if (currentStep === 1) {
    stepContent = (
      <QuoteStepRoute
        formData={formData}
        errors={errors}
        activePanel={activePanel}
        updateField={updateField}
        setRouteAddress={setRouteAddress}
        openPanel={openPanel}
        closePanel={closePanel}
      />
    );

    isCurrentStepValid = isRouteStepValid;
  }

  if (currentStep === 2) {
    stepContent = (
      <QuoteStepCargo
        formData={formData}
        errors={errors}
        updateField={updateField}
      />
    );

    isCurrentStepValid = isCargoStepValid;
  }

  if (currentStep === 3) {
    stepContent = <QuoteStepReview formData={formData} />;
    isCurrentStepValid = true;
  }

  return (
    <div className="quote-register-page">
      <div className="quote-register-shell">
        <QuoteRegisterStepper
          steps={QUOTE_REGISTER_STEPS}
          currentStep={currentStep}
        />

        <div className="quote-register-body">{stepContent}</div>

        <QuoteRegisterActions
          currentStep={currentStep}
          totalSteps={QUOTE_REGISTER_STEPS.length}
          onPrev={goPrevStep}
          onNext={goNextStep}
          onSubmit={handleSubmit}
          isCurrentStepValid={isCurrentStepValid}
        />
      </div>
    </div>
  );
}
