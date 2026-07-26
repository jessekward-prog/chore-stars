CREATE TABLE IF NOT EXISTS kids (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  color_from TEXT NOT NULL DEFAULT '#f472b6',
  color_to TEXT NOT NULL DEFAULT '#a855f7',
  tab_from TEXT NOT NULL DEFAULT '#e879f9',
  tab_to TEXT NOT NULL DEFAULT '#9333ea',
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS chores (
  id SERIAL PRIMARY KEY,
  emoji TEXT NOT NULL DEFAULT '⭐',
  label TEXT NOT NULL,
  color_from TEXT NOT NULL DEFAULT '#facc15',
  color_to TEXT NOT NULL DEFAULT '#f97316',
  checked_from TEXT NOT NULL DEFAULT '#b45309',
  checked_to TEXT NOT NULL DEFAULT '#c2410c',
  check_color TEXT NOT NULL DEFAULT '#ea580c',
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS prizes (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL DEFAULT '???',
  color TEXT NOT NULL DEFAULT '#FF6B6B',
  dark_color TEXT NOT NULL DEFAULT '#c0392b',
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_checks (
  id SERIAL PRIMARY KEY,
  kid_id INT REFERENCES kids(id) ON DELETE CASCADE,
  chore_id INT REFERENCES chores(id) ON DELETE CASCADE,
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(kid_id, chore_id, check_date)
);

CREATE TABLE IF NOT EXISTS completed_days (
  id SERIAL PRIMARY KEY,
  day_key TEXT NOT NULL,
  week_start DATE NOT NULL,
  UNIQUE(day_key, week_start)
);

CREATE TABLE IF NOT EXISTS wheel_spins (
  id SERIAL PRIMARY KEY,
  week_start DATE NOT NULL UNIQUE,
  spun_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE kids ADD COLUMN IF NOT EXISTS bg_color TEXT NOT NULL DEFAULT '#0f0524';
ALTER TABLE kids ADD COLUMN IF NOT EXISTS pin TEXT;
ALTER TABLE chores ADD COLUMN IF NOT EXISTS time_of_day TEXT NOT NULL DEFAULT 'both';
ALTER TABLE daily_checks ADD COLUMN IF NOT EXISTS check_slot TEXT NOT NULL DEFAULT 'both';
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_checks_kid_id_chore_id_check_date_key' AND conrelid = 'daily_checks'::regclass) THEN
    ALTER TABLE daily_checks DROP CONSTRAINT daily_checks_kid_id_chore_id_check_date_key;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_checks_slot_unique' AND conrelid = 'daily_checks'::regclass) THEN
    ALTER TABLE daily_checks ADD CONSTRAINT daily_checks_slot_unique UNIQUE(kid_id, chore_id, check_date, check_slot);
  END IF;
END $$;
