-- Bandy Manager Data Warehouse
-- Schema v1
-- Taktiska fält är normaliserade till kolumner (inte JSON) för att möjliggöra direkta SQL-analyser.
-- match_profile exkluderas medvetet — tolkningar hör hemma i vyer, inte rådata.

CREATE TABLE IF NOT EXISTS matches (
  match_id              TEXT PRIMARY KEY,
  engine_version        TEXT NOT NULL,
  seed                  INTEGER NOT NULL,
  run_timestamp         TEXT NOT NULL,
  sampling_bucket       TEXT NOT NULL CHECK(sampling_bucket IN ('realistic','varied','edge','control','limits')),

  home_team_id          TEXT NOT NULL,
  away_team_id          TEXT NOT NULL,
  home_ca               INTEGER NOT NULL,
  away_ca               INTEGER NOT NULL,

  home_formation        TEXT NOT NULL,
  away_formation        TEXT NOT NULL,

  -- Taktik hemmalag (8 dimensioner)
  home_mentality        TEXT NOT NULL,
  home_tempo            TEXT NOT NULL,
  home_press            TEXT NOT NULL,
  home_passing_risk     TEXT NOT NULL,
  home_play_width       TEXT NOT NULL,
  home_attack_focus     TEXT NOT NULL,
  home_corner_strategy  TEXT NOT NULL,
  home_pp_strategy      TEXT NOT NULL,

  -- Taktik bortalag (8 dimensioner)
  away_mentality        TEXT NOT NULL,
  away_tempo            TEXT NOT NULL,
  away_press            TEXT NOT NULL,
  away_passing_risk     TEXT NOT NULL,
  away_play_width       TEXT NOT NULL,
  away_attack_focus     TEXT NOT NULL,
  away_corner_strategy  TEXT NOT NULL,
  away_pp_strategy      TEXT NOT NULL,

  -- Väder (normaliserat)
  weather_condition     TEXT,
  weather_temperature   INTEGER,
  weather_ice_quality   TEXT,

  -- Resultat
  home_goals            INTEGER NOT NULL,
  away_goals            INTEGER NOT NULL,
  home_corners          INTEGER NOT NULL,
  away_corners          INTEGER NOT NULL,
  home_shots            INTEGER NOT NULL,
  away_shots            INTEGER NOT NULL,
  home_on_target        INTEGER NOT NULL,
  away_on_target        INTEGER NOT NULL,
  home_penalties        INTEGER NOT NULL,
  away_penalties        INTEGER NOT NULL,
  home_expulsions       INTEGER NOT NULL,  -- RedCard events (utvisning i bandy, inte rött kort)
  away_expulsions       INTEGER NOT NULL,
  home_possession       REAL NOT NULL,
  away_possession       REAL NOT NULL,
  result_outcome        TEXT NOT NULL CHECK(result_outcome IN ('home_win','draw','away_win'))
);

-- Period-stats deriveras från events i generate.ts.
-- Sanity check i validate.ts: period_goals_h1 + period_goals_h2 MUST = matches.home_goals.
CREATE TABLE IF NOT EXISTS match_periods (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id              TEXT NOT NULL REFERENCES matches(match_id),
  period                INTEGER NOT NULL CHECK(period IN (1, 2)),
  home_goals            INTEGER NOT NULL,
  away_goals            INTEGER NOT NULL,
  home_corners          INTEGER NOT NULL,
  away_corners          INTEGER NOT NULL,
  home_expulsions       INTEGER NOT NULL,
  away_expulsions       INTEGER NOT NULL
);

-- Events: en rad per signifikant händelse
CREATE TABLE IF NOT EXISTS match_events (
  event_id              INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id              TEXT NOT NULL REFERENCES matches(match_id),
  event_type            TEXT NOT NULL,
  minute                INTEGER NOT NULL,
  team                  TEXT NOT NULL CHECK(team IN ('home','away')),
  player_id             TEXT,
  is_corner_goal        INTEGER DEFAULT 0,
  is_penalty_goal       INTEGER DEFAULT 0,
  score_home_at_event   INTEGER NOT NULL,
  score_away_at_event   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_match    ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_periods_match   ON match_periods(match_id);
CREATE INDEX IF NOT EXISTS idx_matches_bucket  ON matches(sampling_bucket);
CREATE INDEX IF NOT EXISTS idx_matches_outcome ON matches(result_outcome);
CREATE INDEX IF NOT EXISTS idx_matches_version ON matches(engine_version);
