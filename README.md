# Chore Stars ⭐

A self-hosted kids chore tracker with a weekly prize spin wheel. Built with React + Express + PostgreSQL.

## Quick Start (Docker)

**Requirements:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)

```bash
git clone <your-repo-url>
cd chore-chart
docker compose up --build
```

Open **http://localhost:3013** in your browser.

That's it. No Node, no PostgreSQL needed on your machine — Docker handles everything.

## Default Setup

- **Kids:** Peyton & Jude (edit in Parent Settings)
- **Chores:** 6 default chores (edit in Parent Settings)
- **Parent password:** `stars123` — change this after first login!

## Parent Settings

Tap the 🔒 lock icon at the top right of the chore screen to open Parent Settings.

From there you can:
- Add / rename / remove kids
- Upload kid profile photos
- Change chore names, emoji, and colours
- Set the wheel prize labels
- Change the parent password

## Development (without Docker)

You need Node 18+ and a PostgreSQL database.

```bash
# 1. Copy env and fill in your DB details
cp .env.example .env

# 2. Install dependencies
npm install

# 3. Start the dev server (Vite + Express run together)
npm run dev
```

Vite runs on http://localhost:5173 and proxies `/api` to Express on port 3001.

## How the weekly system works

1. Each weekday, both kids complete all their chores.
2. When the last chore is ticked, the team earns a checkmark for that day.
3. After all 5 weekdays are complete, the 🎰 SPIN THE WHEEL button unlocks.
4. Spin for a random prize from the wheel — labels are set in Parent Settings.

Chore checks reset automatically each new day. The week resets on Monday.

## Tech stack

- **Frontend:** React 18, Vite 4, Tailwind CSS v3, Framer Motion, canvas-confetti
- **Backend:** Express 4, express-session, bcryptjs, multer
- **Database:** PostgreSQL 16
- **Fonts:** Fredoka One, Nunito (Google Fonts)
