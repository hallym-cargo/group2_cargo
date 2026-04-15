import { useState } from "react";
import { createShipment } from "../../../api";
import { QUOTE_REGISTER_INITIAL_STATE } from "../constants/quoteRegisterInitialState";
import {
  validateQuoteStepRoute,
  validateQuoteStepCargo,
  validateAllSteps,
} from "../utils/quoteRegisterValidation";
import { quoteFormToShipmentPayload } from "../../public/quoteUtils";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      dataUrl: typeof reader.result === "string" ? reader.result : "",
      name: file.name,
    });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function useQuoteRegisterForm(controller) {
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
      nextErrors = validateQuoteStepRoute(formData);
    }

    if (currentStep === 2) {
      nextErrors = validateQuoteStepCargo(formData);
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return false;
    }

    setCurrentStep((prev) => Math.min(prev + 1, 3));
    setActivePanel(null);
    return true;
  };

  const submitForm = async () => {
    const finalErrors = validateAllSteps(formData);
    setErrors(finalErrors);

    if (Object.keys(finalErrors).length > 0) {
      return false;
    }

    try {
      const files = Array.isArray(formData.cargoImages) ? formData.cargoImages : [];
      const converted = await Promise.all(files.map(fileToDataUrl));
      const payload = quoteFormToShipmentPayload(
        formData,
        converted.map((item) => item.dataUrl),
        converted.map((item) => item.name),
      );

      const created = await createShipment(payload);
      controller?.setMessage?.("견적이 등록되었습니다.");
      setFormData(QUOTE_REGISTER_INITIAL_STATE);
      setErrors({});
      setCurrentStep(1);
      setActivePanel(null);
      return created;
    } catch (err) {
      controller?.setMessage?.(err.response?.data?.message || "견적 등록 실패");
      return false;
    }
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
