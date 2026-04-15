import { useEffect, useMemo, useState } from "react";
import { Map, MapMarker, Polyline, useKakaoLoader } from "react-kakao-maps-sdk";
import { fetchDrivingRoute } from "../../../../api";

const DEFAULT_CENTER = { lat: 36.3504, lng: 127.3845 };

function makeFullAddress(baseAddress, detailAddress) {
  return [baseAddress, detailAddress].filter(Boolean).join(" ").trim();
}

function isValidCoordinate(lat, lng) {
  return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
}

export default function QuoteDetailKakaoMapView({ shipment }) {
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_MAP_APP_KEY,
    libraries: ["services"],
  });

  const [map, setMap] = useState(null);
  const [originPosition, setOriginPosition] = useState(null);
  const [destinationPosition, setDestinationPosition] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapError, setMapError] = useState("");
  const [routeNotice, setRouteNotice] = useState("");

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
        setRouteNotice("");

        const origin = isValidCoordinate(shipment?.originLat, shipment?.originLng)
          ? {
              lat: Number(shipment.originLat),
              lng: Number(shipment.originLng),
            }
          : await geocodeWithFallback(originFullAddress, originBaseAddress);

        const destination = isValidCoordinate(
          shipment?.destinationLat,
          shipment?.destinationLng,
        )
          ? {
              lat: Number(shipment.destinationLat),
              lng: Number(shipment.destinationLng),
            }
          : await geocodeWithFallback(
              destinationFullAddress,
              destinationBaseAddress,
            );

        setOriginPosition(origin);
        setDestinationPosition(destination);
        setMapCenter(origin);

        try {
          const route = await fetchDrivingRoute({
            startLat: origin.lat,
            startLng: origin.lng,
            endLat: destination.lat,
            endLng: destination.lng,
          });

          const coords = Array.isArray(route?.routeCoords)
            ? route.routeCoords
                .filter((coord) => isValidCoordinate(coord?.lat, coord?.lng))
                .map((coord) => ({
                  lat: Number(coord.lat),
                  lng: Number(coord.lng),
                }))
            : [];

          if (coords.length >= 2) {
            setRoutePath(coords);
            return;
          }

          setRoutePath([origin, destination]);
          setRouteNotice("실제 경로 좌표가 없어 직선 경로로 표시했습니다.");
        } catch (routeError) {
          console.error(routeError);
          setRoutePath([origin, destination]);
          setRouteNotice("Tmap 경로를 불러오지 못해 직선으로 표시했습니다.");
        }
      } catch (e) {
        console.error(e);
        setMapError("주소를 좌표로 변환하지 못했습니다.");
      }
    };

    loadPositions();
  }, [
    loading,
    error,
    shipment?.originLat,
    shipment?.originLng,
    shipment?.destinationLat,
    shipment?.destinationLng,
    originFullAddress,
    originBaseAddress,
    destinationFullAddress,
    destinationBaseAddress,
  ]);

  useEffect(() => {
    if (!map || !window.kakao?.maps) return;

    const points = routePath.length
      ? routePath
      : [originPosition, destinationPosition].filter(Boolean);

    if (!points.length) return;

    if (points.length === 1) {
      map.setCenter(new window.kakao.maps.LatLng(points[0].lat, points[0].lng));
      return;
    }

    const bounds = new window.kakao.maps.LatLngBounds();
    points.forEach((point) => {
      bounds.extend(new window.kakao.maps.LatLng(point.lat, point.lng));
    });
    map.setBounds(bounds, 60, 60, 60, 60);
  }, [map, routePath, originPosition, destinationPosition]);

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
        onCreate={setMap}
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

        {routePath.length >= 2 && (
          <Polyline
            path={routePath}
            strokeWeight={5}
            strokeColor="#3d63f2"
            strokeOpacity={0.9}
            strokeStyle="solid"
          />
        )}
      </Map>

      {routeNotice ? (
        <div className="quote-detail-map-real__route-notice">{routeNotice}</div>
      ) : null}
    </div>
  );
}
