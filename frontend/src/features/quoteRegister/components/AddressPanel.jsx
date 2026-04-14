import { useEffect, useMemo, useRef, useState } from "react";
import DaumPostcode from "react-daum-postcode";

export default function AddressPanel({
  title,
  fieldName,
  currentValue,
  currentDetailValue,
  updateField,
  closePanel,
}) {
  const [panelStep, setPanelStep] = useState("search");
  const [selectedBaseAddress, setSelectedBaseAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [floor, setFloor] = useState("");
  const [hasElevator, setHasElevator] = useState("");
  const [isClient, setIsClient] = useState(false);

  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    setIsClient(true);

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (currentValue) {
      setSelectedBaseAddress(currentValue);
      setPanelStep("detail");
    } else {
      setSelectedBaseAddress("");
      setPanelStep("search");
    }

    if (!currentDetailValue) {
      setDetailAddress("");
      setFloor("");
      setHasElevator("");
      return;
    }

    const detailText = currentDetailValue;

    const floorMatch = detailText.match(/(\d+)\s*층/);
    const elevatorMatch = detailText.match(/엘리베이터\s*(있음|없음)/);

    setFloor(floorMatch ? floorMatch[1] : "");

    const cleanedDetail = detailText
      .replace(/(\d+)\s*층/g, "")
      .replace(/엘리베이터\s*(있음|없음)/g, "")
      .trim();

    setDetailAddress(cleanedDetail);
    setHasElevator(elevatorMatch ? elevatorMatch[1] : "");
  }, [currentValue, currentDetailValue]);

  const getDetailFieldName = () => {
    if (fieldName === "originAddress") return "originDetailAddress";
    if (fieldName === "destinationAddress") return "destinationDetailAddress";
    return "";
  };

  const getLatFieldName = () => {
    if (fieldName === "originAddress") return "originLat";
    if (fieldName === "destinationAddress") return "destinationLat";
    return "";
  };

  const getLngFieldName = () => {
    if (fieldName === "originAddress") return "originLng";
    if (fieldName === "destinationAddress") return "destinationLng";
    return "";
  };

  const geocodeAddress = (address) => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("브라우저 환경이 아닙니다."));
        return;
      }

      if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
        reject(
          new Error("카카오 지도 services 라이브러리가 로드되지 않았습니다."),
        );
        return;
      }

      if (!address || !address.trim()) {
        reject(new Error("좌표 변환에 사용할 주소가 비어 있습니다."));
        return;
      }

      const geocoder = new window.kakao.maps.services.Geocoder();

      geocoder.addressSearch(address, (result, status) => {
        if (
          status !== window.kakao.maps.services.Status.OK ||
          !result ||
          result.length === 0
        ) {
          reject(new Error("주소를 좌표로 변환하지 못했습니다."));
          return;
        }

        resolve({
          lat: Number(result[0].y),
          lng: Number(result[0].x),
        });
      });
    });
  };

  const handleComplete = async (data) => {
    if (!mountedRef.current) return;

    console.log("주소 선택 결과:", data);

    let fullAddress = data.address;
    let extraAddress = "";

    if (data.addressType === "R") {
      if (data.bname) {
        extraAddress += data.bname;
      }

      if (data.buildingName) {
        extraAddress += extraAddress
          ? `, ${data.buildingName}`
          : data.buildingName;
      }

      if (extraAddress) {
        fullAddress += ` (${extraAddress})`;
      }
    }

    updateField(fieldName, fullAddress);

    const latFieldName = getLatFieldName();
    const lngFieldName = getLngFieldName();

    try {
      const addressForGeocoding = data.roadAddress || data.address;
      const { lat, lng } = await geocodeAddress(addressForGeocoding);

      if (!mountedRef.current) return;

      if (latFieldName) {
        updateField(latFieldName, lat);
      }

      if (lngFieldName) {
        updateField(lngFieldName, lng);
      }

      setSelectedBaseAddress(fullAddress);
      setPanelStep("detail");
    } catch (error) {
      console.error("좌표 변환 실패:", error);

      if (!mountedRef.current) return;

      if (latFieldName) {
        updateField(latFieldName, null);
      }

      if (lngFieldName) {
        updateField(lngFieldName, null);
      }

      alert("주소 좌표를 가져오지 못했습니다. 다시 검색해주세요.");
    }
  };

  const isValidFloor = useMemo(() => {
    return /^\d+$/.test(floor) && Number(floor) >= 1;
  }, [floor]);

  const isValidElevator = useMemo(() => {
    return hasElevator === "있음" || hasElevator === "없음";
  }, [hasElevator]);

  const isDetailFormValid = isValidFloor && isValidElevator;

  const handleSubmitDetail = () => {
    const detailFieldName = getDetailFieldName();

    if (!detailFieldName) {
      closePanel();
      return;
    }

    if (!isValidFloor || !isValidElevator) {
      return;
    }

    const detailParts = [];

    if (detailAddress.trim()) {
      detailParts.push(detailAddress.trim());
    }

    if (floor.trim()) {
      detailParts.push(`${floor.trim()}층`);
    }

    if (hasElevator) {
      detailParts.push(`엘리베이터 ${hasElevator}`);
    }

    updateField(detailFieldName, detailParts.join(" "));
    closePanel();
  };

  const handleBackToSearch = () => {
    if (!mountedRef.current) return;
    setPanelStep("search");
  };

  const baseAddressText = selectedBaseAddress || currentValue || "";

  return (
    <div className="side-panel-content">
      <div className="side-panel-header">
        <h3>{panelStep === "search" ? title : "상세주소 입력"}</h3>

        <button
          type="button"
          className="panel-close-button"
          onClick={closePanel}
        >
          ×
        </button>
      </div>

      {panelStep === "search" && (
        <div className="address-panel-body">
          {currentValue && (
            <div className="selected-preview">
              <strong>현재 선택된 주소</strong>
              <p>{currentValue}</p>
            </div>
          )}

          <div className="daum-postcode-wrapper">
            {isClient ? (
              <DaumPostcode
                key={`${fieldName}-postcode`}
                onComplete={handleComplete}
                autoClose={false}
                style={{ width: "100%", height: "100%" }}
              />
            ) : null}
          </div>
        </div>
      )}

      {panelStep === "detail" && (
        <div className="detail-address-panel">
          <div className="selected-preview">
            <div className="selected-preview-header">
              <strong>선택한 주소</strong>

              <button
                type="button"
                className="address-research-button"
                onClick={handleBackToSearch}
              >
                주소 다시 검색
              </button>
            </div>

            <p>{baseAddressText}</p>
          </div>

          <div className="form-group">
            <label>상세 주소</label>
            <input
              type="text"
              value={detailAddress}
              onChange={(e) => setDetailAddress(e.target.value)}
              placeholder="상세 주소를 입력해주세요."
            />
          </div>

          <div className="form-group">
            <label>
              층수 <span className="required-mark">*</span>
            </label>

            <div className="floor-input-wrapper">
              <input
                type="text"
                className="floor-input"
                placeholder="층수 입력"
                value={floor}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  setFloor(value);
                }}
              />
              <span className="floor-unit">층</span>
            </div>

            {!floor && <p className="error-text">층수를 입력해주세요.</p>}

            {floor && !isValidFloor && (
              <p className="error-text">층수는 1 이상의 숫자로 입력해주세요.</p>
            )}
          </div>

          <div className="form-group">
            <label>
              건물 내 엘리베이터 <span className="required-mark">*</span>
            </label>

            <div className="elevator-toggle-group">
              <button
                type="button"
                className={`elevator-toggle-button ${
                  hasElevator === "있음" ? "selected" : ""
                }`}
                onClick={() => setHasElevator("있음")}
              >
                있음
              </button>

              <button
                type="button"
                className={`elevator-toggle-button ${
                  hasElevator === "없음" ? "selected" : ""
                }`}
                onClick={() => setHasElevator("없음")}
              >
                없음
              </button>
            </div>

            {!isValidElevator && (
              <p className="error-text">엘리베이터 유무를 선택해주세요.</p>
            )}
          </div>

          <button
            type="button"
            className="primary-button detail-submit-button"
            onClick={handleSubmitDetail}
            disabled={!isDetailFormValid}
          >
            적용하기
          </button>
        </div>
      )}
    </div>
  );
}
