import { useState } from "react";

const REGION_DATA = {
  전체: ["전체"],
  강원특별자치도: [
    "강릉시",
    "고성군",
    "동해시",
    "삼척시",
    "속초시",
    "양구군",
    "양양군",
    "영월군",
    "원주시",
    "인제군",
    "정선군",
    "철원군",
    "춘천시",
    "태백시",
    "평창군",
    "홍천군",
    "화천군",
    "횡성군",
  ],
  경기도: [
    "가평군",
    "고양시",
    "과천시",
    "광명시",
    "광주시",
    "구리시",
    "군포시",
    "김포시",
    "남양주시",
    "동두천시",
    "부천시",
    "성남시",
    "수원시",
    "시흥시",
    "안산시",
    "안성시",
    "안양시",
    "양주시",
    "양평군",
    "여주시",
    "연천군",
    "오산시",
    "용인시",
    "의왕시",
    "의정부시",
    "이천시",
    "파주시",
    "평택시",
    "포천시",
    "하남시",
    "화성시",
  ],
  경상남도: [
    "거제시",
    "거창군",
    "고성군",
    "김해시",
    "남해군",
    "밀양시",
    "사천시",
    "산청군",
    "양산시",
    "의령군",
    "진주시",
    "창녕군",
    "창원시 마산합포구",
    "창원시 마산회원구",
    "창원시 성산구",
    "창원시 의창구",
    "창원시 진해구",
    "통영시",
    "하동군",
    "함안군",
    "함양군",
    "합천군",
  ],
  경상북도: [
    "경산시",
    "경주시",
    "고령군",
    "구미시",
    "김천시",
    "문경시",
    "봉화군",
    "상주시",
    "성주군",
    "안동시",
    "영덕군",
    "영양군",
    "영주시",
    "영천시",
    "예천군",
    "울릉군",
    "울진군",
    "의성군",
    "청도군",
    "청송군",
    "칠곡군",
    "포항시",
  ],
  //   광양항
  //   광주광역시: ["광산구","남구","동구","북구","서구"]
  //   대구광역시
  //   대전광역시
  //   부산광역시
  //   부산신항
  //   부산항
  //   서울특별시
  //   세종특별자치시
};

export default function RegionSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [selectedDo, setSelectedDo] = useState("전체");

  return (
    <div className="region-select">
      <div className="region-select-trigger" onClick={() => setOpen(!open)}>
        {value || "전체"}
      </div>

      {open && (
        <div className="region-select-dropdown">
          {/* 시/도 */}
          <div className="region-select-left">
            {Object.keys(REGION_DATA).map((doName) => (
              <div
                key={doName}
                className={`region-item ${
                  selectedDo === doName ? "active" : ""
                }`}
                onClick={() => setSelectedDo(doName)}
              >
                {doName}
              </div>
            ))}
          </div>

          {/* 시/군/구 */}
          <div className="region-select-right">
            {REGION_DATA[selectedDo].map((city) => (
              <div
                key={city}
                className="region-item"
                onClick={() => {
                  onChange(`${selectedDo} ${city}`);
                  setOpen(false);
                }}
              >
                {city}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
