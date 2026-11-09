import { t, type Lang } from "./i18n";
import { drawMap, MAP_H, MAP_W } from "./map";
import {
  createMonsters,
  drawMonster,
  hitTestMonster,
  updateMonster,
  type Monster,
} from "./monsters";

const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
const ctx = canvas.getContext("2d")!;
const inspect = document.querySelector<HTMLElement>("#inspect")!;
const inspectClose = document.querySelector<HTMLButtonElement>("#inspect-close")!;
const langBtn = document.querySelector<HTMLButtonElement>("#lang-toggle")!;

canvas.width = MAP_W;
canvas.height = MAP_H;

let lang: Lang = "ko";
const monsters = createMonsters();
let selected: Monster | null = null;
let last = performance.now();

function applyUiLang(): void {
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n as Parameters<typeof t>[0];
    el.textContent = t(key, lang);
  });
  langBtn.textContent = lang === "ko" ? "KO · EN" : "EN · KO";
  langBtn.setAttribute("aria-pressed", lang === "en" ? "true" : "false");
  if (selected) fillInspect(selected);
}

function fillInspect(m: Monster): void {
  inspect.hidden = false;
  document.querySelector("#inspect-code")!.textContent = m.code;
  document.querySelector("#inspect-name")!.textContent = m.name[lang];
  document.querySelector("#inspect-role")!.textContent = m.role[lang];
  document.querySelector("#inspect-task")!.textContent = m.task[lang];
  document.querySelector("#inspect-status")!.textContent = m.status[lang];
}

function closeInspect(): void {
  selected = null;
  inspect.hidden = true;
}

langBtn.addEventListener("click", () => {
  lang = lang === "ko" ? "en" : "ko";
  applyUiLang();
});

inspectClose.addEventListener("click", closeInspect);

canvas.addEventListener("click", (ev) => {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  const wx = (ev.clientX - rect.left) * sx;
  const wy = (ev.clientY - rect.top) * sy;

  // Prefer front-most (later in list / lower on screen)
  const hits = monsters
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => hitTestMonster(m, wx, wy))
    .sort((a, b) => b.m.y - a.m.y || b.i - a.i);

  if (hits.length === 0) {
    closeInspect();
    return;
  }

  selected = hits[0]!.m;
  fillInspect(selected);
});

function tick(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const time = now / 1000;

  for (const m of monsters) updateMonster(m, dt);

  ctx.clearRect(0, 0, MAP_W, MAP_H);
  drawMap(ctx, time);

  // Draw monsters sorted by y for simple depth
  const sorted = [...monsters].sort((a, b) => a.y - b.y);
  for (const m of sorted) {
    drawMonster(ctx, m, selected?.id === m.id);
    // Override name label language by redrawing name strip
    drawNameOnly(ctx, m);
  }

  requestAnimationFrame(tick);
}

function drawNameOnly(ctx: CanvasRenderingContext2D, m: Monster): void {
  const bob =
    m.state === "walk"
      ? Math.sin(m.frame * 12) * 1.5
      : m.state === "idle"
        ? Math.sin(m.frame * 3) * 0.8
        : 0;
  const x = Math.round(m.x);
  const y = Math.round(m.y + bob) - 28;
  const name = m.name[lang];
  ctx.font = "9px sans-serif";
  const nw = ctx.measureText(name).width + 6;
  ctx.fillStyle = "rgba(10, 15, 20, 0.85)";
  ctx.fillRect(x - nw / 2, y + 2, nw, 11);
  ctx.fillStyle = "#e8eef2";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, x, y + 7.5);
}

applyUiLang();
requestAnimationFrame(tick);
