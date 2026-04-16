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

    reader.onload = () =>
      resolve({
        dataUrl: typeof reader.result === "string" ? reader.result : "",
        name: file.name,
      });

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function useQuoteRegisterForm(controller) {
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

  const setRouteAddress = ({
    type,
    address,
    detailAddress = "",
    lat = "",
    lng = "",
  }) => {
    const nextAddress = (address || "").trim();

    let isBlocked = false;

    setFormData((prev) => {
      const currentOrigin = (prev.originAddress || "").trim();
      const currentDestination = (prev.destinationAddress || "").trim();

      if (
        type === "destination" &&
        nextAddress &&
        currentOrigin &&
        nextAddress === currentOrigin
      ) {
        isBlocked = true;
        return prev;
      }

      if (
        type === "origin" &&
        nextAddress &&
        currentDestination &&
        nextAddress === currentDestination
      ) {
        isBlocked = true;
        return prev;
      }

      return {
        ...prev,
        ...(type === "origin"
          ? {
              originAddress: address,
              originDetailAddress: detailAddress,
              originLat: lat,
              originLng: lng,
            }
          : {
              destinationAddress: address,
              destinationDetailAddress: detailAddress,
              destinationLat: lat,
              destinationLng: lng,
            }),
      };
    });

    if (isBlocked) {
      setErrors((prev) => ({
        ...prev,
        ...(type === "origin"
          ? {
              originAddress: "출발지와 도착지는 서로 다른 주소여야 합니다.",
            }
          : {
              destinationAddress:
                "출발지와 도착지는 서로 다른 주소여야 합니다.",
            }),
      }));

      alert("출발지와 도착지는 같은 주소로 설정할 수 없습니다.");
      return false;
    }

    setErrors((prev) => ({
      ...prev,
      ...(type === "origin"
        ? { originAddress: "" }
        : { destinationAddress: "" }),
    }));

    return true;
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
      const files = Array.isArray(formData.cargoImages)
        ? formData.cargoImages.filter((file) => file instanceof File)
        : [];

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
    setRouteAddress,
    openPanel,
    closePanel,
    goPrevStep,
    goNextStep,
    submitForm,
    resetForm,
  };
}

export default useQuoteRegisterForm;
