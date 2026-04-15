import { useEffect, useMemo, useRef, useState } from "react";
import { Map, MapMarker, Polyline, useKakaoLoader } from "react-kakao-maps-sdk";

const DEFAULT_CENTER = { lat: 36.3504, lng: 127.3845 };
const MIN_VISIBLE_LEVEL = 5; // 너무 과확대되지 않도록 제한

function makeFullAddress(baseAddress, detailAddress) {
  return [baseAddress, detailAddress].filter(Boolean).join(" ").trim();
}

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function QuoteDetailKakaoMapView({ shipment }) {
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_MAP_APP_KEY,
    libraries: ["services"],
  });

  const mapRef = useRef(null);

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
          lat: (origin.lat + destination.lat) / 2,
          lng: (origin.lng + destination.lng) / 2,
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

  useEffect(() => {
    if (!mapRef.current) return;
    if (!window.kakao?.maps) return;

    const map = mapRef.current;

    // 출발/도착 둘 다 있는 경우
    if (originPosition && destinationPosition) {
      const bounds = new window.kakao.maps.LatLngBounds();

      bounds.extend(
        new window.kakao.maps.LatLng(originPosition.lat, originPosition.lng),
      );
      bounds.extend(
        new window.kakao.maps.LatLng(
          destinationPosition.lat,
          destinationPosition.lng,
        ),
      );

      map.setBounds(bounds);

      const distanceKm = getDistanceKm(
        originPosition.lat,
        originPosition.lng,
        destinationPosition.lat,
        destinationPosition.lng,
      );

      // setBounds 적용 후 레벨 보정
      window.kakao.maps.event.addListener(
        map,
        "bounds_changed",
        function once() {
          const currentLevel = map.getLevel();

          // 가까운 거리일 때 너무 과확대되면 조금 넓게 보정
          if (distanceKm < 3 && currentLevel < 5) {
            map.setLevel(5);
          } else if (distanceKm < 10 && currentLevel < 6) {
            map.setLevel(6);
          } else if (currentLevel < MIN_VISIBLE_LEVEL) {
            map.setLevel(MIN_VISIBLE_LEVEL);
          }

          window.kakao.maps.event.removeListener(map, "bounds_changed", once);
        },
      );

      return;
    }

    // 출발지만 있는 경우
    if (originPosition) {
      map.setCenter(
        new window.kakao.maps.LatLng(originPosition.lat, originPosition.lng),
      );
      map.setLevel(5);
      return;
    }

    // 도착지만 있는 경우
    if (destinationPosition) {
      map.setCenter(
        new window.kakao.maps.LatLng(
          destinationPosition.lat,
          destinationPosition.lng,
        ),
      );
      map.setLevel(5);
    }
  }, [originPosition, destinationPosition]);

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
        level={7}
        onCreate={(map) => {
          mapRef.current = map;
        }}
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
