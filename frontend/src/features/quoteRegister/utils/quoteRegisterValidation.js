export const validateRouteStep = (formData) => {
  const errors = {};

  if (!formData.estimateName.trim()) {
    errors.estimateName = "배차명을 입력해주세요.";
  }

  if (!formData.originAddress.trim()) {
    errors.originAddress = "출발지를 입력해주세요.";
  }

  if (!formData.destinationAddress.trim()) {
    errors.destinationAddress = "도착지를 입력해주세요.";
  }

  if (!formData.transportDate.trim()) {
    errors.transportDate = "운송일자를 선택해주세요.";
  }

  if (!formData.transportTime.trim()) {
    errors.transportDate = "운송일자와 시간을 선택해주세요.";
  }

  return errors;
};

export const validateCargoStep = (formData) => {
  const errors = {};

  if (!formData.vehicleType.trim()) {
    errors.vehicleType = "차량을 입력해주세요.";
  }

  if (!formData.cargoType.trim()) {
    errors.cargoType = "화물 종류를 입력해주세요.";
  }

  if (!formData.cargoName.trim()) {
    errors.cargoName = "물품명을 입력해주세요.";
  }

  if (!formData.weight.trim()) {
    errors.weight = "중량을 입력해주세요.";
  }

  if (!formData.desiredPrice.trim()) {
    errors.desiredPrice = "희망 운임을 입력해주세요.";
  }

  return errors;
};

export const validateAllSteps = (formData) => {
  return {
    ...validateRouteStep(formData),
    ...validateCargoStep(formData),
  };
};
