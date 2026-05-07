export const MAP_DECOR = {
  "sky-bridges": {
    title: "Sky Bridges",
    subtitle: "좌우 고지대와 중앙 교전 구역이 한 화면에 들어오는 기본형 맵",
    skyline: ["a", "b", "c", "d", "e", "f", "g"],
    clouds: ["one", "two", "three"],
    rocks: ["left", "right"],
    bushes: ["left", "center", "right"],
  },
  "split-core": {
    title: "Split Core",
    subtitle: "중앙 틈과 엄폐 벽을 활용하는 분리형 맵",
    skyline: ["a", "c", "e", "g"],
    clouds: ["one", "three"],
    rocks: ["left", "right"],
    bushes: ["left", "right"],
  },
  "tower-fall": {
    title: "Tower Fall",
    subtitle: "상단 발판을 먼저 잡는 세로 교전형 맵",
    skyline: ["b", "d", "f"],
    clouds: ["two", "three"],
    rocks: ["left"],
    bushes: ["center", "right"],
  }
}

export function getMapDecor(mapKey) {
  return MAP_DECOR[mapKey] || MAP_DECOR["sky-bridges"]
}
