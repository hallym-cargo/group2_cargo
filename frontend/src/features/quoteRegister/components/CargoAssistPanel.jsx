import { useMemo, useState } from "react";

/* 소형 차량 */
const SMALL_VEHICLES = [
  { id: "1ton", label: "1톤 트럭", icon: "🚚", desc: "소형 이사 / 소형 화물" },
  { id: "damas", label: "다마스", icon: "🚐", desc: "소량 화물 / 퀵 운송" },
  { id: "labo", label: "라보", icon: "🛻", desc: "근거리 소형 화물" },
];

/* 대형 차량 - 일반 목록 */
const LARGE_VEHICLES = [
  { id: "1.4t", label: "1.4톤 트럭", icon: "🚛", desc: "중형 화물" },
  { id: "2.5t", label: "2.5톤 트럭", icon: "🚛", desc: "중형 화물" },
  { id: "3.5t", label: "3.5톤 트럭", icon: "🚛", desc: "중형 화물" },
  { id: "5t", label: "5톤 트럭", icon: "🚛", desc: "대형 화물" },
  { id: "5t-plus", label: "5톤 플러스 트럭", icon: "🚛", desc: "확장 적재" },
  { id: "8t", label: "8톤 트럭", icon: "🚛", desc: "대형 화물" },
  { id: "11t", label: "11톤 트럭", icon: "🚛", desc: "장거리 운송" },
  { id: "11t-plus", label: "11톤 플러스 트럭", icon: "🚛", desc: "확장 적재" },
];

/* 대형 차량 - 비즈니스 전용 */
const BUSINESS_LARGE_VEHICLES = [
  { id: "3.5t-wide", label: "3.5톤 광폭", icon: "🚛", desc: "비즈니스 전용" },
  { id: "14t", label: "14톤 트럭", icon: "🚛", desc: "비즈니스 전용" },
  { id: "18t", label: "18톤 트럭", icon: "🚛", desc: "비즈니스 전용" },
  { id: "25t", label: "25톤 트럭", icon: "🚛", desc: "비즈니스 전용" },
];

/* 화물 종류 */
const CARGO_TYPES = [
  {
    id: "home-appliance",
    label: "가전",
    icon: "📺",
    desc: "냉장고, 세탁기, TV 등",
  },
  {
    id: "furniture",
    label: "가구",
    icon: "🛋️",
    desc: "침대, 책상, 의자, 장롱 등",
  },
  { id: "food", label: "식자재", icon: "🥬", desc: "신선식품, 냉장/냉동 식품" },
  { id: "box", label: "박스류", icon: "📦", desc: "택배 박스, 이삿짐 박스 등" },
  {
    id: "machinery",
    label: "기계/장비",
    icon: "⚙️",
    desc: "공구, 장비, 산업용 기기",
  },
  {
    id: "construction",
    label: "건축자재",
    icon: "🧱",
    desc: "목재, 철근, 자재류",
  },
  {
    id: "document",
    label: "서류/소형물품",
    icon: "📄",
    desc: "서류, 소형 포장 물품",
  },
  { id: "etc", label: "기타", icon: "🧩", desc: "직접 화물명에 자세히 작성" },
];

function VehicleItem({ item, selectedValue, onSelect }) {
  const isSelected = selectedValue === item.label;

  return (
    <button
      type="button"
      className={`vehicle-select-item ${isSelected ? "is-selected" : ""}`}
      onClick={() => onSelect(item.label)}
    >
      <div className="vehicle-select-item__icon" aria-hidden="true">
        {item.icon}
      </div>

      <div className="vehicle-select-item__content">
        <div className="vehicle-select-item__title-row">
          <span className="vehicle-select-item__title">{item.label}</span>
        </div>
        <span className="vehicle-select-item__desc">{item.desc}</span>
      </div>
    </button>
  );
}

export default function CargoAssistPanel({
  panelMode = "guide", // guide | vehicle | cargoType
  selectedVehicle = "",
  selectedCargoType = "",
  onSelectVehicle,
  onSelectCargoType,
  onCloseVehiclePanel,
}) {
  const [tab, setTab] = useState("small");
  const isLargeTab = useMemo(() => tab === "large", [tab]);

  if (panelMode === "vehicle") {
    return (
      <div className="quote-assist-panel">
        <div className="quote-assist-panel__header">
          <h3 className="quote-assist-panel__title">차량 선택</h3>
          <button
            type="button"
            className="quote-assist-panel__close-button"
            onClick={onCloseVehiclePanel}
            aria-label="차량 선택 패널 닫기"
          >
            ×
          </button>
        </div>

        <div className="vehicle-tab-group">
          <button
            type="button"
            className={`vehicle-tab-button ${tab === "small" ? "is-active" : ""}`}
            onClick={() => setTab("small")}
          >
            소형차량
          </button>

          <button
            type="button"
            className={`vehicle-tab-button ${tab === "large" ? "is-active" : ""}`}
            onClick={() => setTab("large")}
          >
            대형차량
          </button>
        </div>

        <div className="vehicle-select-list">
          {!isLargeTab &&
            SMALL_VEHICLES.map((vehicle) => (
              <VehicleItem
                key={vehicle.id}
                item={vehicle}
                selectedValue={selectedVehicle}
                onSelect={onSelectVehicle}
              />
            ))}

          {isLargeTab && (
            <>
              {LARGE_VEHICLES.map((vehicle) => (
                <VehicleItem
                  key={vehicle.id}
                  item={vehicle}
                  selectedValue={selectedVehicle}
                  onSelect={onSelectVehicle}
                />
              ))}

              <div className="vehicle-section-header">
                <span className="vehicle-section-header__title">
                  비즈니스 전용 트럭
                </span>
                <span className="vehicle-section-header__badge">비즈니스</span>
              </div>

              {BUSINESS_LARGE_VEHICLES.map((vehicle) => (
                <VehicleItem
                  key={vehicle.id}
                  item={vehicle}
                  selectedValue={selectedVehicle}
                  onSelect={onSelectVehicle}
                />
              ))}
            </>
          )}
        </div>
      </div>
    );
  }

  if (panelMode === "cargoType") {
    return (
      <div className="quote-assist-panel">
        <div className="quote-assist-panel__header">
          <h3 className="quote-assist-panel__title">화물 종류 선택</h3>
          <button
            type="button"
            className="quote-assist-panel__close-button"
            onClick={onCloseVehiclePanel}
            aria-label="화물 종류 선택 패널 닫기"
          >
            ×
          </button>
        </div>

        <div className="vehicle-select-list">
          {CARGO_TYPES.map((cargoType) => (
            <VehicleItem
              key={cargoType.id}
              item={cargoType}
              selectedValue={selectedCargoType}
              onSelect={onSelectCargoType}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="quote-assist-panel">
      <h3 className="quote-assist-panel__title">입력 보조 패널</h3>

      <div className="quote-assist-panel__section">
        <p className="quote-assist-panel__text">
          차량, 화물 종류, 화물명, 중량, 요청사항, 희망 운임을 입력하는
          단계입니다.
        </p>
      </div>

      <div className="quote-assist-panel__section">
        <p className="quote-assist-panel__label">작성 가이드</p>
        <ul className="quote-assist-panel__list">
          <li>차량은 왼쪽 입력 칸을 눌러 선택하세요.</li>
          <li>화물 종류도 왼쪽 입력 칸을 눌러 카테고리에서 선택하세요.</li>
          <li>화물명은 기사님이 이해하기 쉽게 구체적으로 적으세요.</li>
          <li>중량은 숫자 기준으로 입력하고 단위를 함께 선택하세요.</li>
          <li>희망 운임은 협의 가능한 기준 금액으로 입력하세요.</li>
        </ul>
      </div>
    </div>
  );
}
