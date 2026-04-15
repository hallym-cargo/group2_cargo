export function mapShipmentStatusToQuoteStatus(status) {
  switch (status) {
    case 'BIDDING':
    case 'REQUESTED':
      return '입찰 진행중';
    case 'CONFIRMED':
    case 'IN_TRANSIT':
    case 'COMPLETED':
      return '입찰 완료';
    case 'CANCELLED':
      return '취소됨';
    default:
      return '입찰 진행중';
  }
}

export function formatTransportDate(dateTime) {
  if (!dateTime) return '';
  const value = String(dateTime);
  if (value.length >= 10) return value.slice(0, 10);
  return value;
}

export function formatTransportTime(dateTime) {
  if (!dateTime || !String(dateTime).includes('T')) return '';
  return String(dateTime).slice(11, 16);
}

export function normalizeWeight(weightKg, weightUnit, weightNeedConsult) {
  if (weightNeedConsult || weightKg === null || weightKg === undefined || weightKg === '') {
    return { weight: '', weightUnit: weightUnit || 'kg' };
  }

  const numeric = Number(weightKg);
  if (Number.isNaN(numeric)) {
    return { weight: '', weightUnit: weightUnit || 'kg' };
  }

  if ((weightUnit || 'kg') === 't') {
    return { weight: String(Number((numeric / 1000).toFixed(1))), weightUnit: 't' };
  }

  return { weight: String(Number(numeric.toFixed(2))), weightUnit: 'kg' };
}

export function shipmentToQuote(shipment) {
  const weightInfo = normalizeWeight(
    shipment?.weightKg,
    shipment?.weightUnit,
    shipment?.weightNeedConsult,
  );

  return {
    id: shipment?.id,
    estimateName: shipment?.title || '',
    title: shipment?.title || '',
    originAddress: shipment?.originAddress || '',
    originDetailAddress: shipment?.originDetailAddress || '',
    originLat: shipment?.originLat ?? '',
    originLng: shipment?.originLng ?? '',
    destinationAddress: shipment?.destinationAddress || '',
    destinationDetailAddress: shipment?.destinationDetailAddress || '',
    destinationLat: shipment?.destinationLat ?? '',
    destinationLng: shipment?.destinationLng ?? '',
    transportDate: formatTransportDate(shipment?.scheduledStartAt),
    transportTime: formatTransportTime(shipment?.scheduledStartAt),
    scheduledStartAt: shipment?.scheduledStartAt || '',
    vehicleType: shipment?.vehicleType || '',
    vehicleNeedConsult: !!shipment?.vehicleNeedConsult,
    cargoType: shipment?.cargoType || '',
    cargoName: shipment?.cargoName || '',
    weight: weightInfo.weight,
    weightKg: shipment?.weightKg,
    weightUnit: weightInfo.weightUnit,
    weightNeedConsult: !!shipment?.weightNeedConsult,
    requestNote: shipment?.requestNote || '',
    description: shipment?.description || '',
    desiredPrice:
      shipment?.desiredPrice === null || shipment?.desiredPrice === undefined
        ? ''
        : String(shipment.desiredPrice),
    priceProposalAllowed: !!shipment?.priceProposalAllowed,
    cargoImages: shipment?.cargoImageUrls || [],
    cargoImageUrls: shipment?.cargoImageUrls || [],
    estimatedMinutes: shipment?.estimatedMinutes ?? null,
    estimatedDistanceKm: shipment?.estimatedDistanceKm ?? null,
    tracking: shipment?.tracking || null,
    status: mapShipmentStatusToQuoteStatus(shipment?.status),
    rawStatus: shipment?.status || 'BIDDING',
    shipperId: shipment?.shipperId,
    shipperName: shipment?.shipperName || '',
    bookmarked: !!shipment?.bookmarked,
    offerCount: shipment?.offerCount || 0,
    createdAt: shipment?.createdAt || '',
    updatedAt: shipment?.updatedAt || '',
  };
}

export function quoteFormToShipmentPayload(formData, imageDataUrls = [], imageNames = []) {
  const date = (formData?.transportDate || '').trim();
  const time = (formData?.transportTime || '').trim() || '09:00';

  let scheduledStartAt = '';
  if (date) {
    scheduledStartAt = `${date}T${time}:00`;
  }

  let weightKg = null;
  if (!formData?.weightNeedConsult && formData?.weight !== '' && formData?.weight !== null && formData?.weight !== undefined) {
    const numericWeight = Number(formData.weight);
    if (!Number.isNaN(numericWeight)) {
      weightKg = formData?.weightUnit === 't' ? numericWeight * 1000 : numericWeight;
    }
  }

  return {
    title: (formData?.estimateName || '').trim(),
    cargoType: (formData?.cargoType || '').trim(),
    cargoName: (formData?.cargoName || '').trim(),
    vehicleType: formData?.vehicleNeedConsult ? '' : (formData?.vehicleType || '').trim(),
    vehicleNeedConsult: !!formData?.vehicleNeedConsult,
    weightKg,
    weightUnit: formData?.weightNeedConsult ? null : (formData?.weightUnit || 'kg'),
    weightNeedConsult: !!formData?.weightNeedConsult,
    description: [formData?.requestNote, formData?.cargoName].filter(Boolean).join('\n').trim(),
    requestNote: (formData?.requestNote || '').trim(),
    desiredPrice:
      formData?.desiredPrice === '' || formData?.desiredPrice === null || formData?.desiredPrice === undefined
        ? null
        : Number(formData.desiredPrice),
    priceProposalAllowed: !!formData?.priceProposalAllowed,
    originAddress: (formData?.originAddress || '').trim(),
    originDetailAddress: (formData?.originDetailAddress || '').trim(),
    originLat: Number(formData?.originLat),
    originLng: Number(formData?.originLng),
    destinationAddress: (formData?.destinationAddress || '').trim(),
    destinationDetailAddress: (formData?.destinationDetailAddress || '').trim(),
    destinationLat: Number(formData?.destinationLat),
    destinationLng: Number(formData?.destinationLng),
    scheduledStartAt,
    cargoImageDataUrls: imageDataUrls,
    cargoImageNames: imageNames,
  };
}
