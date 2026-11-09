import {
  commandBreak,
  commandCancel,
  commandGoDesk,
  commandStatus,
  commandWander,
  commandWork,
  dispatchTerminalLine,
  formatSituation,
  rosterStatusKey,
  type CommandContext,
  type CommandResult,
} from "./commands";
import { t, type Lang, type UiKey } from "./i18n";
import { drawMap, MAP_H, MAP_W } from "./map";
import {
  acknowledgeMonster,
  applyRoleChoice,
  assignTeam,
  createMonsters,
  drawMonster,
  hitTestMonster,
  spawnMonster,
  SPRITE_SCALE,
  TEAM_META,
  updateMonster,
  type Monster,
  type Species,
  type TeamId,
} from "./monsters";
import {
  addRoleChoice,
  loadRoleChoices,
  removeRoleChoice,
  resetRoleChoices,
  type RoleChoice,
} from "./roles";

const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
const ctx = canvas.getContext("2d")!;
const inspect = document.querySelector<HTMLElement>("#inspect")!;
const inspectClose = document.querySelector<HTMLButtonElement>("#inspect-close")!;
const langBtn = document.querySelector<HTMLButtonElement>("#lang-toggle")!;
const optionsBtn = document.querySelector<HTMLButtonElement>("#options-btn")!;
const rosterList = document.querySelector<HTMLUListElement>("#roster-list")!;
const spawnSpecies = document.querySelector<HTMLSelectElement>("#spawn-species")!;
const spawnRole = document.querySelector<HTMLSelectElement>("#spawn-role")!;
const spawnBtn = document.querySelector<HTMLButtonElement>("#spawn-btn")!;
const terminalLog = document.querySelector<HTMLElement>("#terminal-log")!;
const terminalForm = document.querySelector<HTMLFormElement>("#terminal-form")!;
const terminalInput = document.querySelector<HTMLInputElement>("#terminal-input")!;
const inspectCmdInput = document.querySelector<HTMLInputElement>("#inspect-cmd-input")!;
const inspectCmdSend = document.querySelector<HTMLButtonElement>("#inspect-cmd-send")!;
const taskDetailBtn = document.querySelector<HTMLButtonElement>("#task-detail-btn")!;
const taskDetailDialog = document.querySelector<HTMLDialogElement>("#task-detail-dialog")!;
const taskDetailBody = document.querySelector<HTMLElement>("#task-detail-body")!;
const rolePickDialog = document.querySelector<HTMLDialogElement>("#role-pick-dialog")!;
const rolePickList = document.querySelector<HTMLElement>("#role-pick-list")!;
const optionsDialog = document.querySelector<HTMLDialogElement>("#options-dialog")!;
const optionsRoleList = document.querySelector<HTMLUListElement>("#options-role-list")!;
const optRoleKo = document.querySelector<HTMLInputElement>("#opt-role-ko")!;
const optRoleEn = document.querySelector<HTMLInputElement>("#opt-role-en")!;
const optRoleAdd = document.querySelector<HTMLButtonElement>("#opt-role-add")!;
const optRoleReset = document.querySelector<HTMLButtonElement>("#opt-role-reset")!;
const optionsClose = document.querySelector<HTMLButtonElement>("#options-close")!;

canvas.width = MAP_W;
canvas.height = MAP_H;

let lang: Lang = "ko";
let roleChoices = loadRoleChoices();
const monsters = createMonsters();
let selected: Monster | null = null;
let last = performance.now();
let nowSec = 0;
let rosterDirty = true;

function applyUiLang(): void {
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n as UiKey;
    el.textContent = t(key, lang);
  });
  document.querySelectorAll<HTMLElement>("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder as UiKey;
    if (el instanceof HTMLInputElement) el.placeholder = t(key, lang);
  });
  langBtn.textContent = lang === "ko" ? "KO · EN" : "EN · KO";
  langBtn.setAttribute("aria-pressed", lang === "en" ? "true" : "false");
  fillSpawnRoleSelect();
  if (selected) fillInspect(selected);
  rosterDirty = true;
}

function fillSpawnRoleSelect(): void {
  const prev = spawnRole.value;
  spawnRole.innerHTML = "";
  for (const r of roleChoices) {
    const opt = document.createElement("option");
    opt.value = r.id;
    opt.textContent = r.label[lang];
    spawnRole.append(opt);
  }
  if (prev && roleChoices.some((r) => r.id === prev)) spawnRole.value = prev;
}

function makeCtx(): CommandContext {
  return {
    monsters,
    selected,
    setSelected: (m) => {
      selected = m;
      if (!m) inspect.hidden = true;
    },
    lang,
    now: nowSec,
    spawnMonster: (species, role) => {
      const choice = role ?? roleChoices[0];
      const m = spawnMonster(monsters, species, choice?.label);
      monsters.push(m);
      rosterDirty = true;
      return m;
    },
  };
}

function appendLog(text: string, kind: "ok" | "err" | "cmd" | "sit" = "ok"): void {
  const line = document.createElement("div");
  line.className =
    kind === "err"
      ? "line-err"
      : kind === "cmd"
        ? "line-cmd"
        : kind === "sit"
          ? "line-sit"
          : "";
  line.textContent = text;
  terminalLog.append(line);
  terminalLog.scrollTop = terminalLog.scrollHeight;
}

function applyResult(result: CommandResult, echo?: string): void {
  if (echo) appendLog(`${t("terminalPrompt", lang)} ${echo}`, "cmd");
  if (result.message.ko === "__CLEAR_LOG__") {
    terminalLog.innerHTML = "";
    appendLog(lang === "ko" ? "(로그 지움)" : "(log cleared)");
    return;
  }
  appendLog(result.message[lang], result.ok ? "ok" : "err");
  if (result.clearSelection) {
    selected = null;
    inspect.hidden = true;
  } else if (result.refresh && selected) {
    fillInspect(selected);
  }
  const sit = formatSituation(makeCtx());
  appendLog(sit[lang], "sit");
  rosterDirty = true;
}

function runCommandLine(raw: string): void {
  const result = dispatchTerminalLine(raw, makeCtx());
  applyResult(result, raw);
}

function fillInspect(m: Monster): void {
  inspect.hidden = false;
  document.querySelector("#inspect-code")!.textContent = m.code;
  document.querySelector("#inspect-name")!.textContent = m.name[lang];
  document.querySelector("#inspect-title")!.textContent = m.title[lang];
  document.querySelector("#inspect-role")!.textContent = m.role[lang];
  document.querySelector("#inspect-task")!.textContent = m.task[lang];
  document.querySelector("#inspect-status")!.textContent = m.status[lang];
  const teamLabel =
    m.team === "unassigned"
      ? t("teamUnassigned", lang)
      : TEAM_META[m.team].label[lang];
  document.querySelector("#inspect-team")!.textContent = teamLabel;
}

function closeInspect(): void {
  selected = null;
  inspect.hidden = true;
  rosterDirty = true;
}

function selectMonster(m: Monster, acknowledge = true): void {
  selected = m;
  if (acknowledge) acknowledgeMonster(m);
  fillInspect(m);
  rosterDirty = true;
}

function renderRoster(): void {
  rosterList.innerHTML = "";
  for (const m of monsters) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "roster-item" + (selected?.id === m.id ? " selected" : "");
    btn.draggable = true;
    btn.dataset.id = m.id;

    const st = rosterStatusKey(m);
    const team =
      m.team === "unassigned"
        ? t("teamUnassigned", lang)
        : TEAM_META[m.team].label[lang];
    const icon = m.headIcon === "busy" ? "…" : m.headIcon === "done" ? "!" : "";
    btn.innerHTML = `
      <span class="code">${m.code} ${icon}</span>
      <span class="meta">${m.name[lang]} · ${m.role[lang]} · ${team}</span>
      <span class="stat ${m.headIcon}">${st[lang]} · ${m.title[lang]}</span>
    `;
    btn.addEventListener("click", () => selectMonster(m));
    btn.addEventListener("dragstart", (ev) => {
      ev.dataTransfer?.setData("text/oam-monster", m.id);
      ev.dataTransfer?.setData("text/plain", m.id);
    });
    li.append(btn);
    rosterList.append(li);
  }
  rosterDirty = false;
}

function openRolePicker(onPick: (choice: RoleChoice) => void): void {
  rolePickList.innerHTML = "";
  for (const choice of roleChoices) {
    const b = document.createElement("button");
    b.type = "submit";
    b.value = choice.id;
    b.textContent = choice.label[lang];
    b.addEventListener("click", (ev) => {
      ev.preventDefault();
      onPick(choice);
      rolePickDialog.close();
    });
    rolePickList.append(b);
  }
  rolePickDialog.showModal();
}

function renderOptionsRoles(): void {
  optionsRoleList.innerHTML = "";
  for (const choice of roleChoices) {
    const li = document.createElement("li");
    li.innerHTML = `<span>${choice.label.ko} / ${choice.label.en}</span>`;
    const rm = document.createElement("button");
    rm.type = "button";
    rm.className = "mini-btn";
    rm.textContent = t("optionsRemove", lang);
    rm.addEventListener("click", () => {
      roleChoices = removeRoleChoice(roleChoices, choice.id);
      fillSpawnRoleSelect();
      renderOptionsRoles();
    });
    li.append(rm);
    optionsRoleList.append(li);
  }
}

langBtn.addEventListener("click", () => {
  lang = lang === "ko" ? "en" : "ko";
  applyUiLang();
});

inspectClose.addEventListener("click", closeInspect);

document.querySelector("#cmd-buttons")!.addEventListener("click", (ev) => {
  const btn = (ev.target as HTMLElement).closest<HTMLButtonElement>("button[data-cmd]");
  if (!btn) return;
  const cmd = btn.dataset.cmd!;
  const ctx = makeCtx();
  let result: CommandResult;
  switch (cmd) {
    case "desk":
      result = commandGoDesk(ctx);
      break;
    case "wander":
      result = commandWander(ctx);
      break;
    case "work":
      result = commandWork(ctx);
      break;
    case "break":
      result = commandBreak(ctx);
      break;
    case "status":
      result = commandStatus(ctx);
      break;
    case "cancel":
      result = commandCancel(ctx);
      break;
    default:
      return;
  }
  applyResult(result, cmd);
});

inspectCmdSend.addEventListener("click", () => {
  const raw = inspectCmdInput.value;
  if (!raw.trim()) return;
  runCommandLine(raw);
  inspectCmdInput.value = "";
});

inspectCmdInput.addEventListener("keydown", (ev) => {
  if (ev.key === "Enter") {
    ev.preventDefault();
    inspectCmdSend.click();
  }
});

document.querySelector("#inspect-role")!.addEventListener("dblclick", () => {
  if (!selected) return;
  openRolePicker((choice) => {
    applyRoleChoice(selected!, choice.label);
    fillInspect(selected!);
    appendLog(
      lang === "ko"
        ? `${selected!.code} 역할 → ${choice.label.ko}`
        : `${selected!.code} role → ${choice.label.en}`,
    );
    rosterDirty = true;
  });
});

taskDetailBtn.addEventListener("click", () => {
  if (!selected) return;
  taskDetailBody.textContent = selected.taskDetail[lang];
  taskDetailDialog.showModal();
});

terminalForm.addEventListener("submit", (ev) => {
  ev.preventDefault();
  const raw = terminalInput.value;
  terminalInput.value = "";
  if (!raw.trim()) return;
  runCommandLine(raw);
});

spawnBtn.addEventListener("click", () => {
  const species = spawnSpecies.value as Species;
  const choice = roleChoices.find((r) => r.id === spawnRole.value) ?? roleChoices[0];
  const m = spawnMonster(monsters, species, choice?.label);
  monsters.push(m);
  selectMonster(m, false);
  appendLog(
    lang === "ko"
      ? `추가: ${m.code} ${m.name.ko} · ${m.role.ko}`
      : `Added: ${m.code} ${m.name.en} · ${m.role.en}`,
  );
  rosterDirty = true;
});

for (const drop of document.querySelectorAll<HTMLElement>(".team-drop")) {
  drop.addEventListener("dragover", (ev) => {
    ev.preventDefault();
    drop.classList.add("drag-over");
  });
  drop.addEventListener("dragleave", () => drop.classList.remove("drag-over"));
  drop.addEventListener("drop", (ev) => {
    ev.preventDefault();
    drop.classList.remove("drag-over");
    const id =
      ev.dataTransfer?.getData("text/oam-monster") ||
      ev.dataTransfer?.getData("text/plain");
    if (!id) return;
    const m = monsters.find((x) => x.id === id);
    if (!m) return;
    const team = drop.dataset.team as TeamId;
    assignTeam(m, team, nowSec);
    if (selected?.id === m.id) fillInspect(m);
    appendLog(
      lang === "ko"
        ? `${m.code} → ${TEAM_META[team as Exclude<TeamId, "unassigned">].label.ko} 팀`
        : `${m.code} → ${TEAM_META[team as Exclude<TeamId, "unassigned">].label.en} team`,
    );
    rosterDirty = true;
  });
}

optionsBtn.addEventListener("click", () => {
  renderOptionsRoles();
  optionsDialog.showModal();
});
optionsClose.addEventListener("click", () => optionsDialog.close());
optRoleAdd.addEventListener("click", () => {
  roleChoices = addRoleChoice(roleChoices, optRoleKo.value, optRoleEn.value);
  optRoleKo.value = "";
  optRoleEn.value = "";
  fillSpawnRoleSelect();
  renderOptionsRoles();
});
optRoleReset.addEventListener("click", () => {
  roleChoices = resetRoleChoices();
  fillSpawnRoleSelect();
  renderOptionsRoles();
});

canvas.addEventListener("click", (ev) => {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  const wx = (ev.clientX - rect.left) * sx;
  const wy = (ev.clientY - rect.top) * sy;

  const hits = monsters
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => hitTestMonster(m, wx, wy))
    .sort((a, b) => b.m.y - a.m.y || b.i - a.i);

  if (hits.length === 0) {
    closeInspect();
    return;
  }
  selectMonster(hits[0]!.m);
});

function tick(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  nowSec = now / 1000;

  for (const m of monsters) updateMonster(m, dt, nowSec);

  ctx.clearRect(0, 0, MAP_W, MAP_H);
  drawMap(ctx, nowSec);

  const sorted = [...monsters].sort((a, b) => a.y - b.y);
  for (const m of sorted) {
    drawMonster(ctx, m, selected?.id === m.id, lang);
    drawNameOnly(ctx, m);
  }

  if (rosterDirty) renderRoster();
  else if (selected && !inspect.hidden) {
    // keep status live while selected
    document.querySelector("#inspect-status")!.textContent = selected.status[lang];
    document.querySelector("#inspect-task")!.textContent = selected.task[lang];
  }

  requestAnimationFrame(tick);
}

function drawNameOnly(ctx2: CanvasRenderingContext2D, m: Monster): void {
  const bob =
    m.state === "walk"
      ? Math.sin(m.frame * 12) * 1.5
      : m.state === "idle" || m.state === "break"
        ? Math.sin(m.frame * 3) * 0.8
        : 0;
  const x = Math.round(m.x);
  const y = Math.round(m.y + bob) - 28 * SPRITE_SCALE - 4;
  const name = m.name[lang];
  ctx2.font = "10px sans-serif";
  const nw = ctx2.measureText(name).width + 8;
  ctx2.fillStyle = "rgba(10, 15, 20, 0.85)";
  ctx2.fillRect(x - nw / 2, y + 2, nw, 12);
  ctx2.fillStyle = "#e8eef2";
  ctx2.textAlign = "center";
  ctx2.textBaseline = "middle";
  ctx2.fillText(name, x, y + 8);
}

applyUiLang();
appendLog(
  lang === "ko"
    ? "동굴 오피스 터미널 준비됨. help 입력."
    : "Cave office terminal ready. type help.",
);
appendLog(formatSituation(makeCtx())[lang], "sit");
renderRoster();
requestAnimationFrame(tick);
