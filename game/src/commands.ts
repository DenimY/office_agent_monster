import type { Lang } from "./i18n";
import {
  DESK_POINTS,
  setBubble,
  setBusy,
  setDone,
  setLocalized,
  type Localized,
  type Monster,
  type Species,
} from "./monsters";
import type { RoleChoice } from "./roles";

export type CommandResult = {
  ok: boolean;
  message: Localized;
  refresh: boolean;
  clearSelection?: boolean;
};

export type CommandContext = {
  monsters: Monster[];
  selected: Monster | null;
  setSelected: (m: Monster | null) => void;
  lang: Lang;
  now: number;
  spawnMonster?: (species: Species, role?: RoleChoice) => Monster;
};

const WORK_TASKS: Localized[] = [
  { ko: "티켓 #42 픽셀 정렬 중…", en: "Pixel-aligning ticket #42…" },
  { ko: "동굴 CDN 캐시 워밍업…", en: "Warming cave CDN cache…" },
  { ko: "모니터 글로우 셰이더 튜닝…", en: "Tuning monitor-glow shader…" },
  { ko: "책상 히트박스 재검증…", en: "Re-checking desk hitboxes…" },
];

function pickWorkTask(): Localized {
  return WORK_TASKS[Math.floor(Math.random() * WORK_TASKS.length)]!;
}

function needSelected(ctx: CommandContext): CommandResult | null {
  if (ctx.selected) return null;
  return {
    ok: false,
    message: {
      ko: "먼저 몬스터를 클릭하거나 `select <코드>`로 선택하세요.",
      en: "Click a monster first, or `select <code>`.",
    },
    refresh: false,
  };
}

function beginCommand(m: Monster): void {
  setBusy(m);
}

function goToPoint(
  m: Monster,
  point: { x: number; y: number },
  arrive: Monster["arriveAction"],
): void {
  m.mode = "manual";
  m.target = { x: point.x, y: point.y };
  m.state = "walk";
  m.wait = 0;
  m.arriveAction = arrive;
  beginCommand(m);
}

export function commandGoDesk(ctx: CommandContext): CommandResult {
  const miss = needSelected(ctx);
  if (miss) return miss;
  const m = ctx.selected!;
  const desk = DESK_POINTS[m.homeDesk] ?? DESK_POINTS[0]!;
  goToPoint(m, desk, "idle");
  setLocalized(m.status, { ko: "책상으로 이동", en: "Going to desk" });
  setLocalized(m.task, { ko: "자기 책상으로 돌아가는 중", en: "Heading to assigned desk" });
  setBubble(m, { ko: "책상으로!", en: "To my desk!" }, ctx.now, 2.5);
  return {
    ok: true,
    message: { ko: `${m.code} → 책상으로 이동`, en: `${m.code} → walking to desk` },
    refresh: true,
  };
}

export function commandWander(ctx: CommandContext): CommandResult {
  const miss = needSelected(ctx);
  if (miss) return miss;
  const m = ctx.selected!;
  m.mode = "auto";
  m.arriveAction = null;
  m.target = null;
  m.state = "idle";
  m.wait = 0.2;
  beginCommand(m);
  setLocalized(m.status, { ko: "배회", en: "Wandering" });
  setLocalized(m.task, {
    ko: "책상 사이를 느긋하게 돌아다니는 중",
    en: "Idly wandering between desks",
  });
  setBubble(m, { ko: "슬슬 돌아볼까…", en: "I'll wander a bit…" }, ctx.now, 2.2);
  setDone(m);
  return {
    ok: true,
    message: { ko: `${m.code} → 자동 배회 시작`, en: `${m.code} → idle wander enabled` },
    refresh: true,
  };
}

export function commandWork(ctx: CommandContext): CommandResult {
  const miss = needSelected(ctx);
  if (miss) return miss;
  const m = ctx.selected!;
  const desk = DESK_POINTS[m.homeDesk] ?? DESK_POINTS[0]!;
  const task = pickWorkTask();
  const near = Math.hypot(m.x - desk.x, m.y - desk.y) < 4;

  setLocalized(m.task, task);
  setLocalized(m.taskDetail, {
    ko: `${task.ko}\n\n가짜 로컬 작업입니다. 에이전트/LLM 없음.`,
    en: `${task.en}\n\nFake local work only. No agents/LLM.`,
  });
  if (near) {
    m.mode = "manual";
    m.target = null;
    m.arriveAction = null;
    m.state = "work";
    m.wait = 8 + Math.random() * 6;
    beginCommand(m);
    setLocalized(m.status, { ko: "작업 중", en: "Working" });
    setBubble(m, { ko: "집중…!", en: "Focus…!" }, ctx.now, 2.4);
  } else {
    goToPoint(m, desk, "work");
    setLocalized(m.status, { ko: "출근 중", en: "Heading to work" });
    setBubble(m, { ko: "일하러 가요!", en: "Off to work!" }, ctx.now, 2.4);
  }

  return {
    ok: true,
    message: {
      ko: `${m.code} → 작업 시작 (${task.ko})`,
      en: `${m.code} → start work (${task.en})`,
    },
    refresh: true,
  };
}

export function commandBreak(ctx: CommandContext): CommandResult {
  const miss = needSelected(ctx);
  if (miss) return miss;
  const m = ctx.selected!;
  m.mode = "manual";
  m.target = null;
  m.arriveAction = null;
  m.state = "break";
  m.wait = 5 + Math.random() * 4;
  beginCommand(m);
  setLocalized(m.status, { ko: "휴식", en: "On break" });
  setLocalized(m.task, {
    ko: "이끼 앞에서 스트레칭 중",
    en: "Stretching by the moss",
  });
  setBubble(m, { ko: "잠깐 쉴게요~", en: "Taking a break~" }, ctx.now, 2.8);
  return {
    ok: true,
    message: { ko: `${m.code} → 휴식`, en: `${m.code} → on break` },
    refresh: true,
  };
}

export function commandStatus(ctx: CommandContext): CommandResult {
  const miss = needSelected(ctx);
  if (miss) return miss;
  const m = ctx.selected!;
  const line: Localized = {
    ko: `${m.code} ${m.name.ko} | ${m.role.ko} | ${m.status.ko} | ${m.task.ko}`,
    en: `${m.code} ${m.name.en} | ${m.role.en} | ${m.status.en} | ${m.task.en}`,
  };
  setBubble(
    m,
    { ko: `상태: ${m.status.ko}`, en: `Status: ${m.status.en}` },
    ctx.now,
    3.2,
  );
  return { ok: true, message: line, refresh: true };
}

export function commandCancel(ctx: CommandContext): CommandResult {
  if (ctx.selected) {
    const m = ctx.selected;
    m.mode = "manual";
    m.target = null;
    m.arriveAction = null;
    m.state = "idle";
    m.wait = 9999;
    setLocalized(m.status, { ko: "대기", en: "Idle" });
    setLocalized(m.task, { ko: "명령 대기 중", en: "Awaiting orders" });
    setBubble(m, { ko: "알겠어요.", en: "Got it." }, ctx.now, 1.8);
    m.headIcon = "none";
  }
  ctx.setSelected(null);
  return {
    ok: true,
    message: {
      ko: "선택 해제 · 명령 취소",
      en: "Selection cleared · command cancelled",
    },
    refresh: false,
    clearSelection: true,
  };
}

export function commandHelp(_ctx: CommandContext): CommandResult {
  return {
    ok: true,
    message: {
      ko: "명령: desk | wander | work | break | status | select <코드> | spawn <dino|ghost|slime> | clear | help",
      en: "cmds: desk | wander | work | break | status | select <code> | spawn <dino|ghost|slime> | clear | help",
    },
    refresh: false,
  };
}

export function commandSelect(ctx: CommandContext, code: string): CommandResult {
  const needle = code.trim().toUpperCase();
  const found = ctx.monsters.find(
    (m) => m.code.toUpperCase() === needle || m.id.toUpperCase() === needle,
  );
  if (!found) {
    return {
      ok: false,
      message: {
        ko: `몬스터를 찾을 수 없음: ${code}`,
        en: `Monster not found: ${code}`,
      },
      refresh: false,
    };
  }
  ctx.setSelected(found);
  setBubble(found, { ko: "네, 듣고 있어요!", en: "Yes, listening!" }, ctx.now, 2);
  return {
    ok: true,
    message: {
      ko: `선택됨: ${found.code} ${found.name.ko}`,
      en: `Selected: ${found.code} ${found.name.en}`,
    },
    refresh: true,
  };
}

export function commandSpawn(ctx: CommandContext, kind: string): CommandResult {
  if (!ctx.spawnMonster) {
    return {
      ok: false,
      message: { ko: "스폰 불가", en: "Spawn unavailable" },
      refresh: false,
    };
  }
  const map: Record<string, Species> = {
    dino: "dino",
    dinosaur: "dino",
    ghost: "ghost",
    slime: "slime",
  };
  const species = map[kind.trim().toLowerCase()] ?? "slime";
  const m = ctx.spawnMonster(species);
  ctx.setSelected(m);
  setBubble(m, { ko: "출근했어요!", en: "Reporting for duty!" }, ctx.now, 2.5);
  setDone(m);
  return {
    ok: true,
    message: {
      ko: `스폰: ${m.code} ${m.name.ko} · 역할 ${m.role.ko}`,
      en: `Spawned: ${m.code} ${m.name.en} · role ${m.role.en}`,
    },
    refresh: true,
  };
}

export function commandClearLog(): CommandResult {
  return {
    ok: true,
    message: { ko: "__CLEAR_LOG__", en: "__CLEAR_LOG__" },
    refresh: false,
  };
}

export function dispatchTerminalLine(
  raw: string,
  ctx: CommandContext,
): CommandResult {
  const line = raw.trim();
  if (!line) {
    return {
      ok: false,
      message: { ko: "(빈 명령)", en: "(empty)" },
      refresh: false,
    };
  }

  const parts = line.split(/\s+/);
  const cmd = parts[0]!.toLowerCase();
  const arg = parts.slice(1).join(" ");

  switch (cmd) {
    case "desk":
    case "go":
    case "home":
      return commandGoDesk(ctx);
    case "wander":
    case "idle":
      return commandWander(ctx);
    case "work":
    case "busy":
      return commandWork(ctx);
    case "break":
    case "rest":
      return commandBreak(ctx);
    case "status":
    case "st":
      return commandStatus(ctx);
    case "cancel":
    case "deselect":
      return commandCancel(ctx);
    case "clear":
      if (arg.toLowerCase() === "selection" || arg.toLowerCase() === "sel") {
        return commandCancel(ctx);
      }
      return commandClearLog();
    case "help":
    case "?":
      return commandHelp(ctx);
    case "select":
    case "sel":
      if (!arg) {
        return {
          ok: false,
          message: {
            ko: "사용법: select <코드> 예) select DEV_01",
            en: "usage: select <code> e.g. select DEV_01",
          },
          refresh: false,
        };
      }
      return commandSelect(ctx, arg);
    case "spawn":
    case "add":
      return commandSpawn(ctx, arg || "slime");
    default:
      return {
        ok: false,
        message: {
          ko: `알 수 없는 명령: ${cmd} · help 입력`,
          en: `Unknown command: ${cmd} · type help`,
        },
        refresh: false,
      };
  }
}

export function formatSituation(ctx: CommandContext): Localized {
  if (!ctx.selected) {
    return {
      ko: "선택 없음 · 몬스터를 클릭하거나 select <코드>",
      en: "No selection · click a monster or select <code>",
    };
  }
  const m = ctx.selected;
  const icon = m.headIcon === "busy" ? "…" : m.headIcon === "done" ? "!" : "-";
  return {
    ko: `[상황] ${m.code} ${m.name.ko} · ${m.role.ko} · ${m.status.ko} · icon=${icon}`,
    en: `[sitrep] ${m.code} ${m.name.en} · ${m.role.en} · ${m.status.en} · icon=${icon}`,
  };
}

export function rosterStatusKey(m: Monster): Localized {
  if (m.headIcon === "busy") {
    return { ko: "명령 진행 중…", en: "Command in progress…" };
  }
  if (m.headIcon === "done") {
    return { ko: "완료!", en: "Done!" };
  }
  if (m.state === "walk") return { ko: "이동", en: "Walking" };
  if (m.state === "work") return { ko: "작업", en: "Working" };
  if (m.state === "break") return { ko: "휴식", en: "Break" };
  return { ko: "대기", en: "Idle" };
}
