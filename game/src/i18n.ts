export type Lang = "ko" | "en";

export const uiCopy = {
  tagline: {
    ko: "동굴 속 픽셀 오피스 — 클릭·명령·팀 배정",
    en: "Pixel cave office — click, command, teams",
  },
  hint: {
    ko: "클릭 선택 · 로스터→팀 드래그 · 터미널/명령 · 머리 …/!",
    en: "Click select · drag roster→team · terminal/cmds · head …/!",
  },
  title: { ko: "직책", en: "Title" },
  role: { ko: "현재 역할", en: "Current role" },
  roleHint: {
    ko: "더블클릭으로 역할 변경",
    en: "Double-click to change role",
  },
  task: { ko: "현재 작업", en: "Current task" },
  status: { ko: "상태", en: "Status" },
  team: { ko: "팀", en: "Team" },
  commands: { ko: "명령", en: "Commands" },
  cmdDesk: { ko: "책상으로", en: "Go to desk" },
  cmdWander: { ko: "배회", en: "Wander" },
  cmdWork: { ko: "작업 시작", en: "Start work" },
  cmdBreak: { ko: "휴식", en: "Take a break" },
  cmdStatus: { ko: "상태 보고", en: "Report status" },
  cmdCancel: { ko: "선택 해제", en: "Clear selection" },
  cmdInput: { ko: "명령하기", en: "Command" },
  cmdPlaceholder: {
    ko: "예: work / desk / status",
    en: "e.g. work / desk / status",
  },
  cmdSend: { ko: "실행", en: "Run" },
  taskDetailBtn: { ko: "자세히 보기", en: "Details" },
  taskDetailTitle: { ko: "작업 상세", en: "Task detail" },
  taskDetailClose: { ko: "닫기", en: "Close" },
  sidebarTitle: { ko: "오피스 사이드바", en: "Office sidebar" },
  addMonster: { ko: "몬스터 추가", en: "Add monster" },
  spawnSprite: { ko: "스프라이트", en: "Sprite" },
  spawnRole: { ko: "역할 선택", en: "Pick role" },
  spawnBtn: { ko: "추가", en: "Add" },
  spawnDino: { ko: "공룡", en: "Dino" },
  spawnGhost: { ko: "유령", en: "Ghost" },
  spawnSlime: { ko: "슬라임", en: "Slime" },
  roster: { ko: "실시간 로스터", en: "Live roster" },
  teams: { ko: "팀 블록", en: "Team blocks" },
  teamsHint: {
    ko: "로스터 행을 팀 블록으로 드래그하세요",
    en: "Drag a roster row onto a team block",
  },
  teamDev: { ko: "Dev", en: "Dev" },
  teamDesign: { ko: "Design", en: "Design" },
  teamLead: { ko: "Lead", en: "Lead" },
  teamUnassigned: { ko: "미배정", en: "Unassigned" },
  terminalTitle: { ko: "터미널", en: "Terminal" },
  terminalHint: {
    ko: "help · clear · spawn · select",
    en: "help · clear · spawn · select",
  },
  terminalPrompt: { ko: "oam>", en: "oam>" },
  optionsBtn: { ko: "옵션", en: "Options" },
  optionsTitle: { ko: "역할 옵션", en: "Role options" },
  optionsIntro: {
    ko: "기본 역할 목록을 추가·삭제할 수 있습니다. (localStorage)",
    en: "Add or remove default role choices. (localStorage)",
  },
  optionsAdd: { ko: "역할 추가", en: "Add role" },
  optionsKo: { ko: "한국어", en: "Korean" },
  optionsEn: { ko: "English", en: "English" },
  optionsRemove: { ko: "삭제", en: "Remove" },
  optionsReset: { ko: "기본값 복원", en: "Reset defaults" },
  optionsClose: { ko: "닫기", en: "Close" },
  pickRoleTitle: { ko: "역할 선택", en: "Choose role" },
} as const;

export type UiKey = keyof typeof uiCopy;

export function t(key: UiKey, lang: Lang): string {
  return uiCopy[key][lang];
}
