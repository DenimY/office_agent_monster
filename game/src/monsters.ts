export type Species = "dino" | "ghost" | "slime";
export type MonsterState = "idle" | "walk" | "work";

export interface Point {
  x: number;
  y: number;
}

export interface Monster {
  id: string;
  code: string;
  name: { ko: string; en: string };
  role: { ko: string; en: string };
  task: { ko: string; en: string };
  status: { ko: string; en: string };
  species: Species;
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
}

/** Desk seat centers in world pixels (map TILE*index + offset). */
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

export function createMonsters(): Monster[] {
  return [
    {
      id: "m1",
      code: "DEV_01",
      name: { ko: "턱시", en: "Jawzy" },
      role: { ko: "프론트엔드 공룡", en: "Frontend dino" },
      task: {
        ko: "모니터 글로우 CSS 다듬는 중…",
        en: "Tweaking monitor-glow CSS…",
      },
      status: { ko: "작업 중", en: "Working" },
      species: "dino",
      color: "#5ec46a",
      accent: "#2f6b38",
      x: DESK_POINTS[0].x,
      y: DESK_POINTS[0].y,
      target: null,
      state: "work",
      wait: 1.2,
      frame: 0,
      facing: 1,
      homeDesk: 0,
    },
    {
      id: "m2",
      code: "OPS_02",
      name: { ko: "유령봇", en: "Ghostbot" },
      role: { ko: "인프라 유령", en: "Infra ghost" },
      task: {
        ko: "동굴 서버 로그 순회 중…",
        en: "Drifting through cave server logs…",
      },
      status: { ko: "순찰", en: "Patrolling" },
      species: "ghost",
      color: "#c9d7ff",
      accent: "#7a8fbf",
      x: DESK_POINTS[3].x,
      y: DESK_POINTS[3].y,
      target: null,
      state: "idle",
      wait: 0.6,
      frame: 0,
      facing: -1,
      homeDesk: 3,
    },
    {
      id: "m3",
      code: "QA_03",
      name: { ko: "슬라임이", en: "Slimy" },
      role: { ko: "QA 슬라임", en: "QA slime" },
      task: {
        ko: "책상 클릭 히트박스 검사 중…",
        en: "Stress-testing desk click hitboxes…",
      },
      status: { ko: "대기", en: "Idle" },
      species: "slime",
      color: "#7be03a",
      accent: "#3f8f1c",
      x: DESK_POINTS[5].x,
      y: DESK_POINTS[5].y,
      target: null,
      state: "idle",
      wait: 2.0,
      frame: 0,
      facing: 1,
      homeDesk: 5,
    },
  ];
}

function pickDesk(exclude: Point): Point {
  const others = DESK_POINTS.filter((p) => p.x !== exclude.x || p.y !== exclude.y);
  return others[Math.floor(Math.random() * others.length)]!;
}

export function updateMonster(m: Monster, dt: number): void {
  m.frame += dt;
  m.wait -= dt;

  if (m.state === "walk" && m.target) {
    const dx = m.target.x - m.x;
    const dy = m.target.y - m.y;
    const dist = Math.hypot(dx, dy);
    const speed = 48;
    if (dist < 2) {
      m.x = m.target.x;
      m.y = m.target.y;
      m.target = null;
      m.state = Math.random() < 0.55 ? "work" : "idle";
      m.wait = 1.2 + Math.random() * 2.4;
    } else {
      const step = Math.min(speed * dt, dist);
      m.x += (dx / dist) * step;
      m.y += (dy / dist) * step;
      if (Math.abs(dx) > 0.4) m.facing = dx > 0 ? 1 : -1;
    }
    return;
  }

  if (m.wait > 0) return;

  // Start a walk to another desk
  const next = pickDesk({ x: m.x, y: m.y });
  m.target = next;
  m.state = "walk";
  m.wait = 0;
}

export function hitTestMonster(m: Monster, wx: number, wy: number): boolean {
  const half = 14;
  return wx >= m.x - half && wx <= m.x + half && wy >= m.y - 22 && wy <= m.y + 10;
}

/** Draw a tiny pixel sprite around (mx, my) feet/center. */
export function drawMonster(
  ctx: CanvasRenderingContext2D,
  m: Monster,
  selected: boolean,
): void {
  const bob =
    m.state === "walk"
      ? Math.sin(m.frame * 12) * 1.5
      : m.state === "idle"
        ? Math.sin(m.frame * 3) * 0.8
        : 0;
  const ox = Math.round(m.x);
  const oy = Math.round(m.y + bob);

  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(m.facing, 1);

  // Selection ring
  if (selected) {
    ctx.fillStyle = "rgba(79, 208, 199, 0.25)";
    ctx.fillRect(-14, 6, 28, 6);
    ctx.strokeStyle = "#4fd0c7";
    ctx.lineWidth = 1;
    ctx.strokeRect(-15, 5, 30, 8);
  }

  if (m.species === "dino") drawDino(ctx, m);
  else if (m.species === "ghost") drawGhost(ctx, m);
  else drawSlime(ctx, m);

  ctx.restore();

  // Role code above head (name is drawn by main with active lang)
  drawCodeLabel(ctx, m.code, ox, oy - 28);
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
  // body
  px(ctx, a, [
    [-8, -6, 14, 12],
    [4, -10, 8, 6],
  ]);
  px(ctx, c, [
    [-7, -5, 12, 10],
    [5, -9, 6, 5],
    [-10, -2, 3, 4], // arm
  ]);
  // eye + snout
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
  ctx.font = "bold 10px monospace";
  const tw = ctx.measureText(code).width;
  const padX = 4;
  const w = tw + padX * 2;
  const h = 12;
  ctx.fillStyle = "#f0b429";
  ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.fillStyle = "#1a1204";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(code, x, y - h / 2);
}
