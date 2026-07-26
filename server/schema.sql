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

-- ── Multi-tenant accounts ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  pin_hash TEXT NOT NULL,
  setup_complete BOOLEAN NOT NULL DEFAULT TRUE,
  intro_seen BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE kids ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE chores ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE prizes ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE daily_checks ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE completed_days ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE wheel_spins ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE;

-- bg_color (full background picker) replaced by a single accent_color
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kids' AND column_name = 'bg_color')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kids' AND column_name = 'accent_color') THEN
    ALTER TABLE kids RENAME COLUMN bg_color TO accent_color;
  END IF;
END $$;
ALTER TABLE kids ADD COLUMN IF NOT EXISTS accent_color TEXT NOT NULL DEFAULT '#8b5cf6';

-- completed_days / wheel_spins uniqueness must be per-account now, not global
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'completed_days_day_key_week_start_key' AND conrelid = 'completed_days'::regclass) THEN
    ALTER TABLE completed_days DROP CONSTRAINT completed_days_day_key_week_start_key;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'completed_days_user_unique' AND conrelid = 'completed_days'::regclass) THEN
    ALTER TABLE completed_days ADD CONSTRAINT completed_days_user_unique UNIQUE(day_key, week_start, user_id);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wheel_spins_week_start_key' AND conrelid = 'wheel_spins'::regclass) THEN
    ALTER TABLE wheel_spins DROP CONSTRAINT wheel_spins_week_start_key;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wheel_spins_user_unique' AND conrelid = 'wheel_spins'::regclass) THEN
    ALTER TABLE wheel_spins ADD CONSTRAINT wheel_spins_user_unique UNIQUE(week_start, user_id);
  END IF;
END $$;
