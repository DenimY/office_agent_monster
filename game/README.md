# Cave Office game (v0)

Playable browser prototype for **office_agent_monster** — pixel cave-office map, walking monsters, click-to-inspect. **No agents / LLM / API keys.**

## Run

```bash
cd game
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5188`).


Production build:

```bash
npm run build
npm run preview
```

## Interactions

- Monsters **idle / walk / work** between desks on a stone cave-office floor.
- **Click a monster** → side panel shows role code, name, role, fake current task, status.
- **KO / EN** toggle in the header switches UI + panel copy.
- Floating labels above heads (e.g. `DEV_01`).

## Stack

Vite + TypeScript + Canvas 2D (procedural tiles & placeholder sprites).
