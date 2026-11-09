/** Cave-office tile map drawn procedurally (no external assets). */

export const TILE = 32;
export const COLS = 30;
export const ROWS = 20;
export const MAP_W = COLS * TILE;
export const MAP_H = ROWS * TILE;

const C = {
  void: "#060a0e",
  wallDeep: "#121a22",
  wall: "#243038",
  wallHi: "#3a4a52",
  wallEdge: "#5a6e78",
  floor: "#2c3a42",
  floorAlt: "#33444c",
  floorCrack: "#243238",
  moss: "#6f9b3c",
  mossDark: "#4a6e28",
  wood: "#8b5a2b",
  woodDark: "#5e3a18",
  woodHi: "#b07a42",
  chair: "#1c2228",
  chairSeat: "#2a323a",
  monitor: "#1a1f24",
  glow: "#4fd0c7",
  glowDim: "#2a8f88",
  cyanDoor: "#3ec4d0",
  cyanDoorDark: "#1e6e78",
};

type Desk = { col: number; row: number };

export const DESKS: Desk[] = [
  { col: 4, row: 5 },
  { col: 9, row: 5 },
  { col: 14, row: 5 },
  { col: 19, row: 5 },
  { col: 4, row: 10 },
  { col: 9, row: 10 },
  { col: 14, row: 10 },
  { col: 19, row: 10 },
];

function hash(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

export function drawMap(ctx: CanvasRenderingContext2D, time: number): void {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = C.void;
  ctx.fillRect(0, 0, MAP_W, MAP_H);

  drawFloor(ctx);
  drawCaveWalls(ctx);
  drawMoss(ctx);
  for (const d of DESKS) drawDesk(ctx, d.col, d.row, time);
  drawDoor(ctx);
  drawStalactites(ctx);
  drawVignette(ctx);
}

function drawFloor(ctx: CanvasRenderingContext2D): void {
  for (let r = 2; r < ROWS - 2; r++) {
    for (let c = 2; c < COLS - 2; c++) {
      const x = c * TILE;
      const y = r * TILE;
      const alt = (c + r) % 2 === 0;
      ctx.fillStyle = alt ? C.floor : C.floorAlt;
      ctx.fillRect(x, y, TILE, TILE);

      // stone tile edge
      ctx.fillStyle = "rgba(10, 16, 20, 0.35)";
      ctx.fillRect(x, y + TILE - 1, TILE, 1);
      ctx.fillRect(x + TILE - 1, y, 1, TILE);

      // occasional crack / pebble
      if (hash(c, r) > 0.82) {
        ctx.fillStyle = C.floorCrack;
        ctx.fillRect(x + 6, y + 10, 8, 2);
        ctx.fillRect(x + 10, y + 12, 4, 2);
      }
      if (hash(c + 3, r + 1) > 0.9) {
        ctx.fillStyle = C.mossDark;
        ctx.fillRect(x + 18, y + 20, 3, 3);
      }
    }
  }
}

function drawCaveWalls(ctx: CanvasRenderingContext2D): void {
  // Outer rock frame with irregular inner edge
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const border =
        c < 2 || c >= COLS - 2 || r < 2 || r >= ROWS - 2;
      if (!border) continue;

      const x = c * TILE;
      const y = r * TILE;
      const jagged = Math.floor(hash(c, r) * 6);
      ctx.fillStyle = r < 2 || c < 2 || c >= COLS - 2 ? C.wallDeep : C.wall;
      ctx.fillRect(x, y, TILE, TILE);

      // highlight speckles
      ctx.fillStyle = C.wallHi;
      ctx.fillRect(x + 4 + jagged, y + 8, 3, 3);
      if (hash(c * 2, r) > 0.5) {
        ctx.fillStyle = C.wallEdge;
        ctx.fillRect(x + 16, y + 18, 4, 2);
      }
    }
  }

  // Inner rock nibbles so the playable area feels carved
  const nibbles = [
    [2, 2],
    [3, 2],
    [2, 3],
    [COLS - 3, 2],
    [COLS - 4, 2],
    [COLS - 3, 3],
    [2, ROWS - 3],
    [3, ROWS - 3],
    [COLS - 3, ROWS - 3],
    [8, 2],
    [15, 2],
    [22, 2],
  ];
  for (const [c, r] of nibbles) {
    ctx.fillStyle = C.wall;
    ctx.fillRect(c! * TILE, r! * TILE, TILE, TILE);
    ctx.fillStyle = C.wallHi;
    ctx.fillRect(c! * TILE + 8, r! * TILE + 10, 6, 4);
  }
}

function drawMoss(ctx: CanvasRenderingContext2D): void {
  const patches: Array<[number, number]> = [
    [2, 4],
    [2, 8],
    [2, 12],
    [27, 5],
    [27, 11],
    [6, 17],
    [12, 17],
    [20, 17],
    [4, 2],
    [18, 2],
  ];
  for (const [c, r] of patches) {
    const x = c! * TILE;
    const y = r! * TILE;
    ctx.fillStyle = C.mossDark;
    ctx.fillRect(x + 4, y + 18, 10, 6);
    ctx.fillStyle = C.moss;
    ctx.fillRect(x + 6, y + 14, 8, 6);
    ctx.fillRect(x + 14, y + 20, 5, 4);
  }
}

function drawDesk(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  time: number,
): void {
  const x = col * TILE;
  const y = row * TILE;

  // desk top
  ctx.fillStyle = C.woodDark;
  ctx.fillRect(x, y + 10, TILE * 3, 28);
  ctx.fillStyle = C.wood;
  ctx.fillRect(x + 2, y + 8, TILE * 3 - 4, 22);
  ctx.fillStyle = C.woodHi;
  ctx.fillRect(x + 2, y + 8, TILE * 3 - 4, 3);

  // drawers
  ctx.fillStyle = C.woodDark;
  ctx.fillRect(x + 4, y + 14, 14, 16);
  ctx.fillStyle = C.woodHi;
  ctx.fillRect(x + 9, y + 20, 4, 2);

  // monitor
  const pulse = 0.55 + Math.sin(time * 2.2 + col) * 0.2;
  ctx.fillStyle = C.monitor;
  ctx.fillRect(x + 28, y - 10, 28, 22);
  ctx.fillStyle = `rgba(79, 208, 199, ${pulse})`;
  ctx.fillRect(x + 31, y - 7, 22, 14);
  ctx.fillStyle = C.glowDim;
  ctx.fillRect(x + 33, y - 5, 8, 2);
  ctx.fillRect(x + 33, y - 1, 14, 2);
  ctx.fillRect(x + 33, y + 3, 10, 2);
  // stand
  ctx.fillStyle = "#4a5560";
  ctx.fillRect(x + 39, y + 12, 6, 6);

  // keyboard + mouse
  ctx.fillStyle = "#9aa7b0";
  ctx.fillRect(x + 26, y + 18, 22, 6);
  ctx.fillStyle = "#c5ced4";
  ctx.fillRect(x + 50, y + 20, 4, 4);

  // chair below desk
  const cx = x + 36;
  const cy = y + 42;
  ctx.fillStyle = C.chair;
  ctx.fillRect(cx + 6, cy, 12, 10);
  ctx.fillStyle = C.chairSeat;
  ctx.fillRect(cx + 4, cy + 8, 16, 6);
  ctx.fillStyle = "#0e1216";
  ctx.fillRect(cx + 2, cy + 14, 4, 6);
  ctx.fillRect(cx + 18, cy + 14, 4, 6);
  ctx.fillRect(cx + 10, cy + 14, 4, 8);
}

function drawDoor(ctx: CanvasRenderingContext2D): void {
  const x = 24 * TILE;
  const y = 16 * TILE;
  ctx.fillStyle = C.woodDark;
  ctx.fillRect(x, y, TILE * 3, TILE * 2);
  ctx.fillStyle = C.cyanDoorDark;
  ctx.fillRect(x + 6, y + 6, 34, 48);
  ctx.fillRect(x + 46, y + 6, 34, 48);
  ctx.fillStyle = C.cyanDoor;
  ctx.fillRect(x + 10, y + 10, 26, 18);
  ctx.fillRect(x + 50, y + 10, 26, 18);
  ctx.fillStyle = "rgba(180, 255, 255, 0.35)";
  ctx.fillRect(x + 12, y + 12, 10, 8);
  ctx.fillRect(x + 52, y + 12, 10, 8);

  // coat rack
  ctx.fillStyle = C.wood;
  ctx.fillRect(x - 18, y + 8, 4, 50);
  ctx.fillRect(x - 26, y + 14, 20, 3);
}

function drawStalactites(ctx: CanvasRenderingContext2D): void {
  const tips = [3, 7, 11, 16, 21, 25];
  for (const c of tips) {
    const x = c * TILE + 8;
    ctx.fillStyle = C.wallDeep;
    ctx.beginPath();
    ctx.moveTo(x, 2 * TILE);
    ctx.lineTo(x + 10, 2 * TILE);
    ctx.lineTo(x + 5, 2 * TILE + 18 + (c % 3) * 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = C.wallHi;
    ctx.fillRect(x + 3, 2 * TILE + 2, 2, 6);
  }
}

function drawVignette(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createRadialGradient(
    MAP_W * 0.5,
    MAP_H * 0.45,
    MAP_H * 0.2,
    MAP_W * 0.5,
    MAP_H * 0.5,
    MAP_H * 0.75,
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(4, 8, 12, 0.55)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, MAP_W, MAP_H);
}
