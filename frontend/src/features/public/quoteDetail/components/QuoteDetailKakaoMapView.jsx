import { useEffect, useMemo, useState } from "react";
import { Map, MapMarker, Polyline, useKakaoLoader } from "react-kakao-maps-sdk";

const DEFAULT_CENTER = { lat: 36.3504, lng: 127.3845 };

function makeFullAddress(baseAddress, detailAddress) {
  return [baseAddress, detailAddress].filter(Boolean).join(" ").trim();
}

export default function QuoteDetailKakaoMapView({ shipment }) {
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_MAP_APP_KEY,
    libraries: ["services"],
  });

  const [originPosition, setOriginPosition] = useState(null);
  const [destinationPosition, setDestinationPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapError, setMapError] = useState("");

  const originBaseAddress = shipment?.originAddress || "";
  const originFullAddress = useMemo(() => {
    return makeFullAddress(
      shipment?.originAddress,
      shipment?.originDetailAddress,
    );
  }, [shipment?.originAddress, shipment?.originDetailAddress]);

  const destinationBaseAddress = shipment?.destinationAddress || "";
  const destinationFullAddress = useMemo(() => {
    return makeFullAddress(
      shipment?.destinationAddress,
      shipment?.destinationDetailAddress,
    );
  }, [shipment?.destinationAddress, shipment?.destinationDetailAddress]);

  useEffect(() => {
    if (loading || error) return;
    if (!window.kakao?.maps?.services) return;

    const geocoder = new window.kakao.maps.services.Geocoder();

    const searchAddress = (address) =>
      new Promise((resolve, reject) => {
        if (!address) {
          reject(new Error("주소가 없습니다."));
          return;
        }

        geocoder.addressSearch(address, (result, status) => {
          if (status === window.kakao.maps.services.Status.OK && result?.[0]) {
            resolve({
              lat: Number(result[0].y),
              lng: Number(result[0].x),
            });
            return;
          }

          reject(new Error(`주소 좌표 변환 실패: ${address}`));
        });
      });

    const geocodeWithFallback = async (fullAddress, baseAddress) => {
      try {
        return await searchAddress(fullAddress);
      } catch (firstError) {
        if (baseAddress && baseAddress !== fullAddress) {
          return await searchAddress(baseAddress);
        }
        throw firstError;
      }
    };

    const loadPositions = async () => {
      try {
        setMapError("");

        const [origin, destination] = await Promise.all([
          geocodeWithFallback(originFullAddress, originBaseAddress),
          geocodeWithFallback(destinationFullAddress, destinationBaseAddress),
        ]);

        setOriginPosition(origin);
        setDestinationPosition(destination);

        setMapCenter({
          lat: origin.lat,
          lng: origin.lng,
        });
      } catch (e) {
        console.error(e);
        setMapError("주소를 좌표로 변환하지 못했습니다.");
      }
    };

    loadPositions();
  }, [
    loading,
    error,
    originFullAddress,
    originBaseAddress,
    destinationFullAddress,
    destinationBaseAddress,
  ]);

  if (loading) {
    return (
      <div className="quote-detail-map-real__fallback">
        지도를 불러오는 중입니다.
      </div>
    );
  }

  if (error) {
    return (
      <div className="quote-detail-map-real__fallback">
        지도 SDK 로드에 실패했습니다.
      </div>
    );
  }

  if (mapError) {
    return <div className="quote-detail-map-real__fallback">{mapError}</div>;
  }

  return (
    <div className="quote-detail-kakao-map">
      <Map
        center={mapCenter}
        style={{ width: "100%", height: "100%" }}
        level={12}
      >
        {originPosition && (
          <MapMarker position={originPosition}>
            <div className="quote-detail-map-marker-label">출발</div>
          </MapMarker>
        )}

        {destinationPosition && (
          <MapMarker position={destinationPosition}>
            <div className="quote-detail-map-marker-label">도착</div>
          </MapMarker>
        )}

        {originPosition && destinationPosition && (
          <Polyline
            path={[originPosition, destinationPosition]}
            strokeWeight={4}
            strokeColor="#3d63f2"
            strokeOpacity={0.85}
            strokeStyle="solid"
          />
        )}
      </Map>
    </div>
  );
}
