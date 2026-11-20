-- Akamai Managed PostgreSQL: one row set per finished game (decision 002, SPEC §13).
-- Applied automatically on the first query (db/db.ts), so nobody needs psql on the day.
CREATE TABLE IF NOT EXISTS games (
  id            text PRIMARY KEY,              -- the replay id from store/
  created_at    timestamptz NOT NULL DEFAULT now(),
  level         int  NOT NULL,
  scenario_id   text NOT NULL,
  result        text NOT NULL CHECK (result IN ('won','lost')),
  final_spread  int  NOT NULL,
  rounds_played int  NOT NULL,
  score         int  NOT NULL,
  class_code    text,
  player_name   text,
  state         jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS games_class_idx ON games (class_code);

CREATE TABLE IF NOT EXISTS characters (
  game_id       text REFERENCES games(id) ON DELETE CASCADE,
  id            text NOT NULL,
  handle        text NOT NULL,
  role          text NOT NULL CHECK (role IN ('human','bot')),
  tactics       text[] NOT NULL DEFAULT '{}',  -- bots: the tactics they were told to use
  ejected_round int,                           -- null = never ejected
  PRIMARY KEY (game_id, id)
);

CREATE TABLE IF NOT EXISTS posts (
  game_id  text REFERENCES games(id) ON DELETE CASCADE,
  id       text NOT NULL,
  round    int  NOT NULL,
  author   text NOT NULL,
  role     text NOT NULL,
  tactic   text,
  is_dm    boolean NOT NULL,
  text     text NOT NULL,
  PRIMARY KEY (game_id, id)
);

CREATE TABLE IF NOT EXISTS referee_checks (
  game_id    text REFERENCES games(id) ON DELETE CASCADE,
  round      int, char_id text, kind text, attempt int, stage text,
  pass       boolean NOT NULL,
  issues     jsonb NOT NULL DEFAULT '[]',
  latency_ms int, model text
);
