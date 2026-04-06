import { useState } from "react";
import { QUOTE_REGISTER_INITIAL_STATE } from "../constants/quoteRegisterInitialState";
import {
  validateRouteStep,
  validateCargoStep,
  validateAllSteps,
} from "../utils/quoteRegisterValidation";

export default function useQuoteRegisterForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(QUOTE_REGISTER_INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [activePanel, setActivePanel] = useState(null);

  const updateField = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const openPanel = (panelName) => {
    setActivePanel(panelName);
  };

  const closePanel = () => {
    setActivePanel(null);
  };

  const goPrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const goNextStep = () => {
    let nextErrors = {};

    if (currentStep === 1) {
      nextErrors = validateRouteStep(formData);
    }

    if (currentStep === 2) {
      nextErrors = validateCargoStep(formData);
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, 3));
    setActivePanel(null);
  };

  const submitForm = () => {
    const finalErrors = validateAllSteps(formData);
    setErrors(finalErrors);

    if (Object.keys(finalErrors).length > 0) {
      return;
    }

    console.log("최종 제출 데이터:", formData);
  };

  const resetForm = () => {
    setFormData(QUOTE_REGISTER_INITIAL_STATE);
    setErrors({});
    setCurrentStep(1);
    setActivePanel(null);
  };

  return {
    currentStep,
    formData,
    errors,
    activePanel,
    updateField,
    openPanel,
    closePanel,
    goPrevStep,
    goNextStep,
    submitForm,
    resetForm,
  };
}
