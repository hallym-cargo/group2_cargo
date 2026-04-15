import { useState } from "react";
import { QUOTE_REGISTER_INITIAL_STATE } from "../constants/quoteRegisterInitialState";
import {
  validateQuoteStepRoute,
  validateQuoteStepCargo,
  validateAllSteps,
} from "../utils/quoteRegisterValidation";
import { createShipment } from "../../../api";

function convertFileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!(file instanceof File)) {
      resolve(null);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

function useQuoteRegisterForm() {
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

  const convertWeightToKg = (weight, unit, needConsult) => {
    if (needConsult) return null;
    if (weight === "" || weight === null || weight === undefined) return null;

    const numericWeight = Number(weight);

    if (Number.isNaN(numericWeight)) return null;

    if (unit === "t") {
      return numericWeight * 1000;
    }

    return numericWeight;
  };

  const buildScheduledStartAt = () => {
    if (!formData.transportDate || !formData.transportTime) {
      return null;
    }

    return `${formData.transportDate}T${formData.transportTime}:00`;
  };

  const buildImagePayload = async () => {
    const cargoImages = Array.isArray(formData.cargoImages)
      ? formData.cargoImages
      : [];

    const files = cargoImages.filter((image) => image instanceof File);

    if (files.length === 0) {
      return {
        cargoImageDataUrls: [],
        cargoImageNames: [],
      };
    }

    const cargoImageDataUrls = await Promise.all(
      files.map((file) => convertFileToDataUrl(file)),
    );

    const cargoImageNames = files.map((file) => file.name);

    return {
      cargoImageDataUrls,
      cargoImageNames,
    };
  };

  const buildSubmitPayload = async () => {
    const convertedWeight = convertWeightToKg(
      formData.weight,
      formData.weightUnit,
      formData.weightNeedConsult,
    );

    const { cargoImageDataUrls, cargoImageNames } = await buildImagePayload();

    return {
      title: formData.estimateName || "",
      cargoType: formData.cargoType || "",
      weightKg: convertedWeight,
      description: formData.requestNote || "",
      originAddress: formData.originAddress || "",
      originLat:
        formData.originLat === "" ||
        formData.originLat === undefined ||
        formData.originLat === null
          ? null
          : Number(formData.originLat),
      originLng:
        formData.originLng === "" ||
        formData.originLng === undefined ||
        formData.originLng === null
          ? null
          : Number(formData.originLng),
      destinationAddress: formData.destinationAddress || "",
      destinationLat:
        formData.destinationLat === "" ||
        formData.destinationLat === undefined ||
        formData.destinationLat === null
          ? null
          : Number(formData.destinationLat),
      destinationLng:
        formData.destinationLng === "" ||
        formData.destinationLng === undefined ||
        formData.destinationLng === null
          ? null
          : Number(formData.destinationLng),
      scheduledStartAt: buildScheduledStartAt(),
      cargoImageDataUrls,
      cargoImageNames,
    };
  };

  const submitForm = async () => {
    const finalErrors = validateAllSteps(formData);
    setErrors(finalErrors);

    if (Object.keys(finalErrors).length > 0) {
      return false;
    }

    try {
      const payload = await buildSubmitPayload();

      console.log("입력용 formData:", formData);
      console.log("서버 전송 payload:", payload);

      await createShipment(payload);

      return true;
    } catch (error) {
      console.error("견적 등록 실패:", error);
      console.error("응답 데이터:", error.response?.data);
      console.error("응답 상태:", error.response?.status);
      console.error("전송 payload:", await buildSubmitPayload());
      alert("견적 등록에 실패했습니다.");
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
