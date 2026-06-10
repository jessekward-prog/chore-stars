# Chore Stars — AI Setup Guide

This file tells AI assistants (Claude, Copilot, etc.) how to set up and work with this project.

## To set up and run this project

1. **Install Docker Desktop** if not already installed: https://www.docker.com/products/docker-desktop/
2. In a terminal at this project folder, run:
   ```
   docker compose up --build
   ```
3. Open http://localhost:3001 in a browser.

That's the entire setup. Docker installs PostgreSQL and the Node server automatically.

## Project structure

```
chore-chart/
├── server/
│   ├── index.js        Express API server (port 3001)
│   └── schema.sql      PostgreSQL schema + seed data
├── src/
│   ├── api.js          fetch wrappers for all API endpoints
│   ├── hooks/
│   │   └── useAppState.js   loads state from API, provides toggle/markDay/markWheelSpun
│   ├── Root.jsx        top-level screen router (welcome / app / parent)
│   ├── WelcomeScreen.jsx
│   ├── App.jsx         main chore tracker (receives state + action props from Root)
│   ├── ParentSettings.jsx   password-protected admin panel
│   └── components/
│       ├── ChoreItem.jsx    single chore row (uses inline styles — no Tailwind dynamic classes)
│       ├── SpinWheel.jsx    prize wheel (accepts sections prop from DB)
│       ├── AllDoneModal.jsx weekly prize celebration (accepts sections + kids props)
│       ├── DayCompleteModal.jsx
│       └── WeekTracker.jsx
└── utils/
    ├── sounds.js       Web Audio API sound effects
    └── confetti.js     canvas-confetti helpers
```

## Key rules

- **No Tailwind dynamic class strings from data.** ChoreItem and the wheel use inline `style` props with hex colors from the DB. Tailwind JIT purges unknown class strings at build time.
- **Chore/kid colours come from the database.** DB columns: `color_from`, `color_to`, `checked_from`, `checked_to`, `check_color` (chores); `color_from`, `color_to`, `tab_from`, `tab_to` (kids).
- **state.checked is a `Map<kidId (number), Set<choreId (number)>>`** inside the React app. The API returns plain JSON `{ "1": [2, 5] }` which useAppState converts.
- **Weekly reset is implicit.** `completed_days` and `wheel_spins` are filtered by `week_start` (Monday ISO date). No cron job needed.
- **Parent auth is session-based.** `express-session` in-memory store. `req.session.isParent = true` after correct password. No user table.

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/state | — | Full app state (kids, chores, prizes, checked, completedDays, wheelSpun) |
| POST | /api/toggle | — | Toggle a chore check for a kid today |
| POST | /api/day-complete | — | Mark a weekday as team-completed |
| POST | /api/wheel-spun | — | Record wheel spin for this week |
| POST | /api/day-reset | — | Delete all chore checks for today |
| GET | /api/auth/status | — | `{ isParent: bool }` |
| POST | /api/auth/login | — | `{ password }` → sets session |
| POST | /api/auth/logout | — | Destroys session |
| POST | /api/auth/change-password | parent | `{ newPassword }` |
| GET/POST/PUT/DELETE | /api/kids | parent for write | CRUD for kids |
| POST | /api/kids/:id/avatar | parent | multipart avatar upload |
| GET/POST/PUT/DELETE | /api/chores | parent for write | CRUD for chores |
| GET/PUT | /api/prizes | parent for write | List / update wheel prize sections |

## Development

```bash
npm install
cp .env.example .env   # fill in your local Postgres details
npm run dev            # starts Vite (5173) + Express (3001) together via concurrently
```

Vite proxies `/api` and `/uploads` to `http://localhost:3001` in dev.
