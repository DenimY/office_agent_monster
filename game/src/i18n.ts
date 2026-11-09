export type Lang = "ko" | "en";

export const uiCopy = {
  tagline: {
    ko: "동굴 속 픽셀 오피스 — 몬스터를 클릭하세요",
    en: "Pixel office inside a cave — click a monster",
  },
  hint: {
    ko: "클릭: 몬스터 선택 · 몬스터는 책상 사이를 돌아다닙니다",
    en: "Click: select a monster · they walk between desks",
  },
  role: { ko: "역할", en: "Role" },
  task: { ko: "현재 작업", en: "Current task" },
  status: { ko: "상태", en: "Status" },
} as const;

export type UiKey = keyof typeof uiCopy;

export function t(key: UiKey, lang: Lang): string {
  return uiCopy[key][lang];
}
