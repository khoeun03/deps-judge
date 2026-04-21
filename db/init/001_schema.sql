CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Problem
-- ============================================================
CREATE TABLE problem (
    id              BIGINT PRIMARY KEY,
    title           TEXT        NOT NULL,
    problem_path    TEXT        NOT NULL
);

-- ============================================================
-- Submission
-- ============================================================
CREATE TYPE submission_status AS ENUM ('waiting', 'judging', 'finished');

CREATE TABLE submission (
    id              BIGSERIAL PRIMARY KEY,
    problem_id      BIGSERIAL   NOT NULL REFERENCES problem(id),
    user_public_key TEXT        NOT NULL,
    format          TEXT        NOT NULL,
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    signature       TEXT        NOT NULL,
    status          submission_status NOT NULL DEFAULT 'waiting'
);

CREATE INDEX idx_submission_problem   ON submission(problem_id);
CREATE INDEX idx_submission_user      ON submission(user_public_key);
CREATE INDEX idx_submission_submitted ON submission(submitted_at DESC);

-- ============================================================
-- Submission File
-- ============================================================
CREATE TABLE submission_file (
    id              BIGSERIAL PRIMARY KEY,
    submission_id   BIGSERIAL   NOT NULL REFERENCES submission(id) ON DELETE CASCADE,
    filename        TEXT        NOT NULL,
    language        TEXT,
    code            TEXT        NOT NULL,

    UNIQUE (submission_id, filename)
);

-- ============================================================
-- Verdict
-- ============================================================
CREATE TYPE verdict_result AS ENUM (
    'AC',   -- Accepted
    'WA',   -- Wrong Answer
    'TLE',  -- Time Limit Exceeded
    'MLE',  -- Memory Limit Exceeded
    'OLE',  -- Output Limit Exceeded
    'RE',   -- Runtime Error
    'CE',   -- Compilation Error
    'UE'    -- Internal Error
);

CREATE TABLE verdict (
    id                  BIGSERIAL PRIMARY KEY,
    submission_id       BIGSERIAL       NOT NULL REFERENCES submission(id),
    result              verdict_result  NOT NULL,
    time_ms             INT,
    memory_kb           INT,
    judged_at           TIMESTAMPTZ     NOT NULL DEFAULT now(),
    invalidated_at      TIMESTAMPTZ,
    invalidated_reason  TEXT
);

CREATE INDEX idx_verdict_submission ON verdict(submission_id);
CREATE INDEX idx_verdict_result     ON verdict(result);
CREATE INDEX idx_verdict_judged     ON verdict(judged_at DESC);
