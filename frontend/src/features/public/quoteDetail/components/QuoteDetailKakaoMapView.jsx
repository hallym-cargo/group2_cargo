import { useEffect, useMemo, useState } from "react";
import { Map, MapMarker, Polyline, useKakaoLoader } from "react-kakao-maps-sdk";
import { fetchDrivingRoute } from "../../../../api";

const DEFAULT_CENTER = { lat: 36.3504, lng: 127.3845 };
const MIN_VISIBLE_LEVEL = 5;

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

  const originFullAddress = useMemo(() => {
    return makeFullAddress(
      shipment?.originAddress,
      shipment?.originDetailAddress,
    );
  }, [shipment?.originAddress, shipment?.originDetailAddress]);

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
        if (!address) return reject();

        geocoder.addressSearch(address, (result, status) => {
          if (status === window.kakao.maps.services.Status.OK && result?.[0]) {
            resolve({
              lat: Number(result[0].y),
              lng: Number(result[0].x),
            });
            return;
          }
          reject();
        });
      });

    const loadPositions = async () => {
      try {
        const origin = isValidCoordinate(
          shipment?.originLat,
          shipment?.originLng,
        )
          ? { lat: Number(shipment.originLat), lng: Number(shipment.originLng) }
          : await searchAddress(originFullAddress);

        const destination = isValidCoordinate(
          shipment?.destinationLat,
          shipment?.destinationLng,
        )
          ? {
              lat: Number(shipment.destinationLat),
              lng: Number(shipment.destinationLng),
            }
          : await searchAddress(destinationFullAddress);

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

          const coords = route?.routeCoords?.map((c) => ({
            lat: Number(c.lat),
            lng: Number(c.lng),
          }));

          if (coords?.length >= 2) {
            setRoutePath(coords);
          } else {
            setRoutePath([origin, destination]);
          }
        } catch {
          setRoutePath([origin, destination]);
        }
      } catch {
        setMapError("주소 좌표 변환 실패");
      }
    };

    loadPositions();
  }, [loading, error, shipment, originFullAddress, destinationFullAddress]);

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
    points.forEach((p) =>
      bounds.extend(new window.kakao.maps.LatLng(p.lat, p.lng)),
    );

    map.setBounds(bounds);

    if (map.getLevel() < MIN_VISIBLE_LEVEL) {
      map.setLevel(MIN_VISIBLE_LEVEL);
    }
  }, [map, routePath, originPosition, destinationPosition]);

  if (loading) return <div>지도 로딩중</div>;
  if (error) return <div>지도 오류</div>;
  if (mapError) return <div>{mapError}</div>;

  return (
    <Map
      center={mapCenter}
      style={{ width: "100%", height: "100%" }}
      level={8}
      onCreate={setMap}
    >
      {originPosition && <MapMarker position={originPosition} />}
      {destinationPosition && <MapMarker position={destinationPosition} />}
      {routePath.length >= 2 && <Polyline path={routePath} />}
    </Map>
  );
}
