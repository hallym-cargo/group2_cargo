export const MAP_DECOR = {
  "sky-bridges": {
    title: "Sky Bridges",
    subtitle: "양쪽 고지대와 중단 난전 구역이 섞인 기본형 맵",
    skyline: ["a", "b", "c", "d", "e", "f", "g"],
    clouds: ["one", "two", "three"],
    rocks: ["left", "right"],
    bushes: ["left", "center", "right"],
  },
  "dual-towers": {
    title: "Dual Towers",
    subtitle: "좌우 타워와 중앙 교전 포인트가 있는 견제형 맵",
    skyline: ["a", "c", "e", "g"],
    clouds: ["one", "three"],
    rocks: ["left", "right"],
    bushes: ["left", "right"],
  },
  "center-chaos": {
    title: "Center Chaos",
    subtitle: "중앙 기둥을 두고 난전이 강하게 나는 맵",
    skyline: ["b", "d", "f"],
    clouds: ["two", "three"],
    rocks: ["left"],
    bushes: ["center", "right"],
  },
  "crossfire-yard": {
    title: "Crossfire Yard",
    subtitle: "낮은 엄폐물과 좌우 사선 교차가 강한 맵",
    skyline: ["a", "b", "f", "g"],
    clouds: ["one", "two"],
    rocks: ["right"],
    bushes: ["left", "center"],
  },
}

export function getMapDecor(mapKey) {
  return MAP_DECOR[mapKey] || MAP_DECOR["sky-bridges"]
}
