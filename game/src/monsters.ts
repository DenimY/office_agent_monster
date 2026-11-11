export type Species = "dino" | "ghost" | "slime";
export type MonsterState = "idle" | "walk" | "work" | "break";
export type ControlMode = "auto" | "manual";
export type HeadIcon = "none" | "busy" | "done";
export type TeamId = "unassigned" | "dev" | "design" | "lead";

export interface Point {
  x: number;
  y: number;
}

export interface Localized {
  ko: string;
  en: string;
}

export interface Monster {
  id: string;
  code: string;
  name: Localized;
  /** Job title (직책) — no species flavor in UI */
  title: Localized;
  /** Current role (현재 역할) */
  role: Localized;
  task: Localized;
  taskDetail: Localized;
  status: Localized;
  species: Species;
  team: TeamId;
  color: string;
  accent: string;
  x: number;
  y: number;
  target: Point | null;
  state: MonsterState;
  wait: number;
  frame: number;
  facing: 1 | -1;
  homeDesk: number;
  mode: ControlMode;
  arriveAction: "work" | "idle" | "break" | null;
  bubble: Localized | null;
  bubbleUntil: number;
  headIcon: HeadIcon;
}

/** Visual scale for pixel sprites (1 = original tiny art). */
export const SPRITE_SCALE = 2.2;

export const DESK_POINTS: Point[] = [
  { x: 176, y: 200 },
  { x: 336, y: 200 },
  { x: 496, y: 200 },
  { x: 656, y: 200 },
  { x: 176, y: 360 },
  { x: 336, y: 360 },
  { x: 496, y: 360 },
  { x: 656, y: 360 },
];

export const TEAM_META: Record<
  Exclude<TeamId, "unassigned">,
  { label: Localized; tint: string }
> = {
  dev: {
    label: { ko: "Dev", en: "Dev" },
    tint: "#3ec4d0",
  },
  design: {
    label: { ko: "Design", en: "Design" },
    tint: "#d08ad0",
  },
  lead: {
    label: { ko: "Lead", en: "Lead" },
    tint: "#f0b429",
  },
};

const SPECIES_LOOK: Record<
  Species,
  { color: string; accent: string; namePool: Localized[] }
> = {
  dino: {
    color: "#5ec46a",
    accent: "#2f6b38",
    namePool: [
      { ko: "턱시", en: "Jawzy" },
      { ko: "스냅", en: "Snap" },
      { ko: "렉스", en: "Rex" },
    ],
  },
  ghost: {
    color: "#c9d7ff",
    accent: "#7a8fbf",
    namePool: [
      { ko: "유령봇", en: "Ghostbot" },
      { ko: "헤이즈", en: "Haze" },
      { ko: "위습", en: "Wisp" },
    ],
  },
  slime: {
    color: "#7be03a",
    accent: "#3f8f1c",
    namePool: [
      { ko: "젤리", en: "Jelly" },
      { ko: "퐁", en: "Pong" },
      { ko: "블롭", en: "Blob" },
    ],
  },
};

const JOB_PRESETS: Array<{
  codePrefix: string;
  title: Localized;
  role: Localized;
  task: Localized;
  taskDetail: Localized;
  defaultTeam: TeamId;
}> = [
  {
    codePrefix: "DEV",
    title: { ko: "프론트엔드", en: "Frontend" },
    role: { ko: "픽셀 UI 담당", en: "Pixel UI owner" },
    task: { ko: "모니터 글로우 CSS 다듬는 중…", en: "Tweaking monitor-glow CSS…" },
    taskDetail: {
      ko: "책상 모니터의 시안 글로우를 2px 단위로 맞추고, 야간 모드 대비를 점검합니다. 산출물: glow.css 패치.",
      en: "Align cyan monitor glow to 2px grid and check night-mode contrast. Deliverable: glow.css patch.",
    },
    defaultTeam: "dev",
  },
  {
    codePrefix: "OPS",
    title: { ko: "인프라", en: "Infra" },
    role: { ko: "동굴 서버 순찰", en: "Cave server patrol" },
    task: {
      ko: "동굴 서버 로그 순회 중…",
      en: "Drifting through cave server logs…",
    },
    taskDetail: {
      ko: "스테이징 로그에서 5xx 스파이크를 훑고, 캐시 워밍 스크립트 상태를 확인합니다. 이상 없으면 대기.",
      en: "Skim staging logs for 5xx spikes and check cache-warm script health. Idle if clean.",
    },
    defaultTeam: "dev",
  },
  {
    codePrefix: "QA",
    title: { ko: "QA", en: "QA" },
    role: { ko: "히트박스 검증", en: "Hitbox verification" },
    task: {
      ko: "책상 클릭 히트박스 검사 중…",
      en: "Stress-testing desk click hitboxes…",
    },
    taskDetail: {
      ko: "각 책상 좌석의 클릭 판정을 3회 반복 확인하고, 오탐 좌표를 메모합니다.",
      en: "Re-check each desk seat click hit three times and note false-positive coords.",
    },
    defaultTeam: "design",
  },
];

let spawnSeq = 0;

export function setLocalized(target: Localized, next: Localized): void {
  target.ko = next.ko;
  target.en = next.en;
}

export function setBubble(
  m: Monster,
  text: Localized | null,
  now: number,
  seconds = 2.5,
): void {
  m.bubble = text;
  m.bubbleUntil = text ? now + seconds : 0;
}

export function setBusy(m: Monster): void {
  m.headIcon = "busy";
}

export function setDone(m: Monster): void {
  m.headIcon = "done";
}

export function clearHeadIcon(m: Monster): void {
  m.headIcon = "none";
}

export function acknowledgeMonster(m: Monster): void {
  if (m.headIcon === "done") clearHeadIcon(m);
}

export function assignTeam(m: Monster, team: TeamId, now: number): void {
  m.team = team;
  if (team === "unassigned") {
    setBubble(m, { ko: "팀 미배정", en: "Unassigned" }, now, 2);
    return;
  }
  const label = TEAM_META[team].label;
  setBubble(
    m,
    { ko: `${label.ko} 팀 배정!`, en: `Joined ${label.en}!` },
    now,
    2.4,
  );
  setDone(m);
}

function makeMonster(
  species: Species,
  deskIndex: number,
  jobIndex: number,
  opts?: { state?: MonsterState; mode?: ControlMode; team?: TeamId },
): Monster {
  const look = SPECIES_LOOK[species];
  const job = JOB_PRESETS[jobIndex % JOB_PRESETS.length]!;
  spawnSeq += 1;
  const code = `${job.codePrefix}_${String(spawnSeq).padStart(2, "0")}`;
  const name = look.namePool[(spawnSeq - 1) % look.namePool.length]!;
  const desk = DESK_POINTS[deskIndex % DESK_POINTS.length]!;
  const state = opts?.state ?? "idle";
  return {
    id: `m${spawnSeq}`,
    code,
    name: { ...name },
    title: { ...job.title },
    role: { ...job.role },
    task: { ...job.task },
    taskDetail: { ...job.taskDetail },
    status:
      state === "work"
        ? { ko: "작업 중", en: "Working" }
        : { ko: "책상 대기", en: "At desk" },
    species,
    team: opts?.team ?? job.defaultTeam,
    color: look.color,
    accent: look.accent,
    x: desk.x,
    y: desk.y,
    target: null,
    state,
    wait: state === "work" ? 4 : 9999,
    frame: Math.random() * 3,
    facing: 1,
    homeDesk: deskIndex % DESK_POINTS.length,
    mode: opts?.mode ?? "manual",
    arriveAction: null,
    bubble: null,
    bubbleUntil: 0,
    headIcon: "none",
  };
}

export function createMonsters(): Monster[] {
  spawnSeq = 0;
  const a = makeMonster("dino", 0, 0, {
    state: "work",
    mode: "manual",
    team: "dev",
  });
  setLocalized(a.role, { ko: "개발자", en: "Developer" });
  const b = makeMonster("ghost", 3, 1, {
    state: "idle",
    mode: "manual",
    team: "lead",
  });
  setLocalized(b.role, { ko: "팀장", en: "Team lead" });
  const c = makeMonster("slime", 5, 2, {
    state: "idle",
    mode: "manual",
    team: "design",
  });
  setLocalized(c.role, { ko: "디자이너", en: "Designer" });
  return [a, b, c];
}

export function spawnMonster(
  existing: Monster[],
  species: Species,
  roleChoice?: Localized,
): Monster {
  const used = new Set(existing.map((m) => m.homeDesk));
  let desk = 0;
  for (let i = 0; i < DESK_POINTS.length; i++) {
    if (!used.has(i)) {
      desk = i;
      break;
    }
    desk = i;
  }
  const jobIndex = species === "dino" ? 0 : species === "ghost" ? 1 : 2;
  const m = makeMonster(species, desk, jobIndex, {
    state: "idle",
    mode: "manual",
    team: "unassigned",
  });
  if (roleChoice) {
    setLocalized(m.role, roleChoice);
  }
  if (used.has(desk)) {
    m.x += 22;
    m.y += 12;
  }
  return m;
}

export function applyRoleChoice(m: Monster, role: Localized): void {
  setLocalized(m.role, role);
}

function pickDesk(exclude: Point): Point {
  const others = DESK_POINTS.filter((p) => p.x !== exclude.x || p.y !== exclude.y);
  return others[Math.floor(Math.random() * others.length)]!;
}

function finishArrival(m: Monster): void {
  const action = m.arriveAction;
  m.target = null;
  m.arriveAction = null;

  if (action === "work") {
    m.state = "work";
    m.wait = 8 + Math.random() * 6;
    setLocalized(m.status, { ko: "작업 중", en: "Working" });
    return;
  }
  if (action === "break") {
    m.state = "break";
    m.wait = 5 + Math.random() * 4;
    setLocalized(m.status, { ko: "휴식", en: "On break" });
    return;
  }
  m.state = "idle";
  m.wait = m.mode === "auto" ? 1.2 + Math.random() * 2.4 : 9999;
  setLocalized(m.status, {
    ko: m.mode === "auto" ? "대기" : "책상 대기",
    en: m.mode === "auto" ? "Idle" : "At desk",
  });
  setLocalized(m.task, {
    ko: "책상에 앉아 대기 중",
    en: "Sitting at desk",
  });
  if (m.mode === "manual") setDone(m);
}

export function updateMonster(m: Monster, dt: number, now: number): void {
  m.frame += dt;
  m.wait -= dt;

  if (m.bubble && now >= m.bubbleUntil) {
    m.bubble = null;
  }

  if (m.state === "walk" && m.target) {
    const dx = m.target.x - m.x;
    const dy = m.target.y - m.y;
    const dist = Math.hypot(dx, dy);
    const speed = 48;
    if (dist < 2) {
      m.x = m.target.x;
      m.y = m.target.y;
      finishArrival(m);
    } else {
      const step = Math.min(speed * dt, dist);
      m.x += (dx / dist) * step;
      m.y += (dy / dist) * step;
      if (Math.abs(dx) > 0.4) m.facing = dx > 0 ? 1 : -1;
    }
    return;
  }

  if (m.wait > 0) return;

  if (m.mode === "manual" && (m.state === "work" || m.state === "break")) {
    const wasBreak = m.state === "break";
    m.state = "idle";
    m.wait = 9999;
    setLocalized(m.status, {
      ko: wasBreak ? "휴식 끝" : "작업 완료",
      en: wasBreak ? "Break over" : "Work done",
    });
    setLocalized(m.task, {
      ko: wasBreak ? "휴식 완료 · 책상 대기" : "작업 완료 · 책상 대기",
      en: wasBreak ? "Break finished · at desk" : "Work finished · at desk",
    });
    setDone(m);
    return;
  }

  if (m.mode !== "auto") return;

  const next = pickDesk({ x: m.x, y: m.y });
  m.target = next;
  m.state = "walk";
  m.wait = 0;
  m.arriveAction = Math.random() < 0.4 ? "work" : "idle";
}

export function hitTestMonster(m: Monster, wx: number, wy: number): boolean {
  const halfW = 16 * SPRITE_SCALE;
  const top = 22 * SPRITE_SCALE;
  const bottom = 12 * SPRITE_SCALE;
  return wx >= m.x - halfW && wx <= m.x + halfW && wy >= m.y - top && wy <= m.y + bottom;
}

export function drawMonster(
  ctx: CanvasRenderingContext2D,
  m: Monster,
  selected: boolean,
  lang: "ko" | "en",
): void {
  const bob =
    m.state === "walk"
      ? Math.sin(m.frame * 12) * 1.5
      : m.state === "idle" || m.state === "break"
        ? Math.sin(m.frame * 3) * 0.8
        : 0;
  const ox = Math.round(m.x);
  const oy = Math.round(m.y + bob);
  const s = SPRITE_SCALE;

  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(m.facing * s, s);

  if (selected) {
    const pulse = 0.55 + Math.sin(m.frame * 5) * 0.2;
    ctx.fillStyle = `rgba(79, 208, 199, ${0.22 + pulse * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(0, 8, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#4fd0c7";
    ctx.lineWidth = 1.6 / s;
    ctx.strokeRect(-17, -19, 34, 32);
    ctx.strokeStyle = `rgba(240, 180, 41, ${pulse})`;
    ctx.lineWidth = 1 / s;
    ctx.strokeRect(-19, -21, 38, 36);
    ctx.fillStyle = "rgba(79, 208, 199, 0.1)";
    ctx.fillRect(-17, -19, 34, 32);
  }

  if (m.species === "dino") drawDino(ctx, m);
  else if (m.species === "ghost") drawGhost(ctx, m);
  else drawSlime(ctx, m);

  ctx.restore();

  const labelY = oy - 28 * s;
  drawCodeLabel(ctx, m.code, ox, labelY);
  drawHeadIcon(ctx, m, ox, labelY - 16);
  if (m.bubble) drawBubble(ctx, m.bubble[lang], ox, labelY - 30);
  if (m.team !== "unassigned") {
    drawTeamChip(ctx, TEAM_META[m.team].label[lang], TEAM_META[m.team].tint, ox, oy + 14 * s);
  }
}

function drawTeamChip(
  ctx: CanvasRenderingContext2D,
  label: string,
  tint: string,
  x: number,
  y: number,
): void {
  ctx.font = "bold 9px monospace";
  const tw = ctx.measureText(label).width + 8;
  ctx.fillStyle = tint;
  ctx.fillRect(x - tw / 2, y, tw, 12);
  ctx.fillStyle = "#0a0f14";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y + 6);
}

function drawHeadIcon(
  ctx: CanvasRenderingContext2D,
  m: Monster,
  x: number,
  y: number,
): void {
  if (m.headIcon === "none") return;

  const size = 14;
  ctx.fillStyle = "rgba(10, 15, 20, 0.92)";
  ctx.fillRect(x - size / 2, y - size / 2, size, size);

  if (m.headIcon === "busy") {
    const ang = m.frame * 8;
    ctx.strokeStyle = "#4fd0c7";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 4, ang, ang + Math.PI * 1.3);
    ctx.stroke();
    ctx.fillStyle = "#9aadb8";
    const phase = Math.floor(m.frame * 4) % 3;
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = i <= phase ? 1 : 0.25;
      ctx.fillRect(x - 5 + i * 3.5, y + 6, 2, 2);
    }
    ctx.globalAlpha = 1;
    return;
  }

  ctx.fillStyle = "#f0b429";
  ctx.fillRect(x - 1.5, y - 5, 3, 6);
  ctx.fillRect(x - 1.5, y + 3, 3, 3);
}

function drawBubble(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
): void {
  ctx.font = "10px sans-serif";
  const tw = ctx.measureText(text).width;
  const padX = 6;
  const w = Math.min(160, tw + padX * 2);
  const h = 16;
  ctx.fillStyle = "rgba(232, 238, 242, 0.95)";
  ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.beginPath();
  ctx.moveTo(x - 3, y);
  ctx.lineTo(x + 3, y);
  ctx.lineTo(x, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#0a0f14";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y - h / 2, w - 4);
}

function px(
  ctx: CanvasRenderingContext2D,
  color: string,
  cells: Array<[number, number, number?, number?]>,
): void {
  ctx.fillStyle = color;
  for (const [x, y, w = 1, h = 1] of cells) {
    ctx.fillRect(x, y, w, h);
  }
}

function drawDino(ctx: CanvasRenderingContext2D, m: Monster): void {
  const c = m.color;
  const a = m.accent;
  px(ctx, a, [
    [-8, -6, 14, 12],
    [4, -10, 8, 6],
  ]);
  px(ctx, c, [
    [-7, -5, 12, 10],
    [5, -9, 6, 5],
    [-10, -2, 3, 4],
  ]);
  px(ctx, "#0a0f14", [[8, -8, 2, 2]]);
  px(ctx, "#fff6a8", [[8, -8, 1, 1]]);
  px(ctx, a, [
    [-4, 6, 3, 4],
    [2, 6, 3, 4],
  ]);
  if (m.state === "walk") {
    const swing = Math.sin(m.frame * 12) > 0 ? 1 : -1;
    px(ctx, a, [
      [-4 + swing, 8, 3, 3],
      [2 - swing, 8, 3, 3],
    ]);
  }
}

function drawGhost(ctx: CanvasRenderingContext2D, m: Monster): void {
  const c = m.color;
  const a = m.accent;
  const flap = Math.sin(m.frame * 5) > 0 ? 0 : 1;
  px(ctx, a, [[-8, -14, 16, 18]]);
  px(ctx, c, [[-7, -13, 14, 16]]);
  px(ctx, c, [
    [-7, 2, 3, 3 + flap],
    [-2, 2, 3, 2 + (1 - flap)],
    [3, 2, 3, 3 + flap],
  ]);
  px(ctx, "#2a3550", [
    [-3, -8, 2, 3],
    [2, -8, 2, 3],
  ]);
  px(ctx, "#fff", [
    [-3, -8, 1, 1],
    [2, -8, 1, 1],
  ]);
  px(ctx, "#d56b8f", [[-1, -3, 3, 2]]);
}

function drawSlime(ctx: CanvasRenderingContext2D, m: Monster): void {
  const c = m.color;
  const a = m.accent;
  const squash = m.state === "walk" ? Math.sin(m.frame * 10) * 1.5 : 0;
  px(ctx, a, [[-9, -2 + squash, 18, 10 - squash]]);
  px(ctx, c, [[-8, -6 + squash, 16, 12 - squash]]);
  px(ctx, "#dfffb0", [[-5, -5 + squash, 6, 3]]);
  px(ctx, "#0a0f14", [
    [-4, -1, 2, 2],
    [2, -1, 2, 2],
  ]);
  px(ctx, "#fff", [
    [-4, -1, 1, 1],
    [2, -1, 1, 1],
  ]);
}

function drawCodeLabel(
  ctx: CanvasRenderingContext2D,
  code: string,
  x: number,
  y: number,
): void {
  ctx.font = "bold 11px monospace";
  const tw = ctx.measureText(code).width;
  const padX = 5;
  const w = tw + padX * 2;
  const h = 14;
  ctx.fillStyle = "#f0b429";
  ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.fillStyle = "#1a1204";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(code, x, y - h / 2);
}
