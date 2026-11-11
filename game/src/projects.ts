import type { Localized, TeamId } from "./monsters";

export type ProjectStatus = "active" | "blocked" | "done" | "idle";

export interface MockProject {
  id: string;
  name: Localized;
  summary: Localized;
  status: ProjectStatus;
  progress: number;
  team: Exclude<TeamId, "unassigned">;
  /** Prefer matching live monster codes; fallback to role-ish labels */
  assigneeHints: string[];
  logs: Localized[];
  artifacts: Localized[];
  leadNote: Localized;
}

/** Fake workstreams for the tool-flavored board — no LLM. */
export const MOCK_PROJECTS: MockProject[] = [
  {
    id: "proj-cave-nav",
    name: { ko: "동굴 내비 v0", en: "Cave nav v0" },
    summary: {
      ko: "맵 경로·책상 그리드 안정화. 에이전트가 막히지 않게.",
      en: "Stabilize map paths & desk grid so agents don't get stuck.",
    },
    status: "active",
    progress: 62,
    team: "dev",
    assigneeHints: ["DEV"],
    logs: [
      { ko: "경로 휴리스틱 패치 적용", en: "Path heuristic patch landed" },
      { ko: "책상 #3 충돌 박스 조정", en: "Desk #3 hitbox adjusted" },
      { ko: "대기: 종유석 타일 여백", en: "Waiting: stalactite tile padding" },
    ],
    artifacts: [
      { ko: "notes/pathing.md", en: "notes/pathing.md" },
      { ko: "PR #12 map bounds", en: "PR #12 map bounds" },
    ],
    leadNote: {
      ko: "Lead: 막히면 ! 올리고 경로 로그 첨부.",
      en: "Lead: escalate with ! and attach path logs.",
    },
  },
  {
    id: "proj-inspect-ux",
    name: { ko: "인스펙트 UX", en: "Inspect UX" },
    summary: {
      ko: "클릭→상태→명령 루프를 도구처럼 읽히게.",
      en: "Make click→status→command read like a tool, not a toy.",
    },
    status: "active",
    progress: 48,
    team: "design",
    assigneeHints: ["DES", "UX"],
    logs: [
      { ko: "선택 링 대비 강화 초안", en: "Draft stronger selection ring" },
      { ko: "패널 여백 토큰 정리", en: "Panel spacing tokens cleaned" },
    ],
    artifacts: [
      { ko: "figma/inspect-frame", en: "figma/inspect-frame" },
      { ko: "docs/private/ux-polish-refs.md", en: "docs/private/ux-polish-refs.md" },
    ],
    leadNote: {
      ko: "Lead: 픽셀 장식보다 가독성 우선.",
      en: "Lead: readability over pixel ornament.",
    },
  },
  {
    id: "proj-roster-sync",
    name: { ko: "로스터 동기", en: "Roster sync" },
    summary: {
      ko: "팀 드래그 배정이 사이드바·맵·터미널에 동시에 반영.",
      en: "Team drag assign mirrors in sidebar, map, and terminal.",
    },
    status: "blocked",
    progress: 35,
    team: "lead",
    assigneeHints: ["LEAD", "OPS"],
    logs: [
      { ko: "드롭 하이라이트 OK", en: "Drop highlight OK" },
      { ko: "차단: 미배정→팀 undo 없음", en: "Blocked: no unassign→team undo" },
    ],
    artifacts: [
      { ko: "issue/roster-undo", en: "issue/roster-undo" },
    ],
    leadNote: {
      ko: "Lead: undo 없으면 배정 실수 비용이 큼 — 다음 스프린트.",
      en: "Lead: without undo, mis-assign cost is high — next sprint.",
    },
  },
  {
    id: "proj-term-help",
    name: { ko: "터미널 help", en: "Terminal help" },
    summary: {
      ko: "help·spawn·select 카피 KR/EN 정리 완료(목).",
      en: "help/spawn/select copy KR/EN settled (mock).",
    },
    status: "done",
    progress: 100,
    team: "dev",
    assigneeHints: ["DEV"],
    logs: [
      { ko: "help 출력 포맷 고정", en: "help output format locked" },
      { ko: "완료 표시 !", en: "Marked done with !" },
    ],
    artifacts: [
      { ko: "src/commands.ts", en: "src/commands.ts" },
    ],
    leadNote: {
      ko: "Lead: 아카이브 OK — 회귀만 보면 됨.",
      en: "Lead: archive OK — watch for regressions only.",
    },
  },
];

export function statusLabel(status: ProjectStatus, lang: "ko" | "en"): string {
  const map: Record<ProjectStatus, Localized> = {
    active: { ko: "진행", en: "Active" },
    blocked: { ko: "차단", en: "Blocked" },
    done: { ko: "완료", en: "Done" },
    idle: { ko: "대기", en: "Idle" },
  };
  return map[status][lang];
}
