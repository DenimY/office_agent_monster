# Cave Office game (v0)

Playable browser prototype for **office_agent_monster** — pixel cave-office map, commandable monsters, terminal, teams. **No agents / LLM / API keys.**

## Run

```bash
cd game
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5188`).

## Interactions

- **Click a monster** → inspect panel (직책 / 현재 역할 / 팀 / 작업 / 상태)
- **Commands** (buttons + inline input + terminal): `desk`, `wander`, `work`, `break`, `status`, `clear`/`cancel`, `select`, `spawn`, `help`
- **Head icons**: `…` spinner while a command runs, `!` when done (clears on click / new command)
- **Sidebar**: add monster (sprite + role pick), live roster, **drag roster → team block** (Dev / Design / Lead)
- **Role UX**: pick role on spawn; double-click role in inspect to change; Options panel edits role list (`localStorage`)
- Defaults roles: 팀장 / 개발자 / 디자이너
- Idle monsters **sit at desks** (wander only when commanded)
- Larger sprites + hitboxes; KO / EN toggle

## Stack

Vite + TypeScript + Canvas 2D (procedural tiles & placeholder sprites).
