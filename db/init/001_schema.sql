CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE problem (
    id              BIGINT PRIMARY KEY,
    title           TEXT        NOT NULL,
    problem_path    TEXT        NOT NULL
);


CREATE TYPE submission_status AS ENUM ('waiting', 'judging', 'finished');

CREATE TABLE submission (
    id              BIGSERIAL PRIMARY KEY,
    problem_id      BIGINT      NOT NULL REFERENCES problem(id),
    user_public_key TEXT        NOT NULL,
    format          TEXT        NOT NULL,
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    signature       TEXT        NOT NULL,
    status          submission_status NOT NULL DEFAULT 'waiting'
);

CREATE INDEX idx_submission_problem   ON submission(problem_id);
CREATE INDEX idx_submission_user      ON submission(user_public_key);
CREATE INDEX idx_submission_submitted ON submission(submitted_at DESC);

CREATE TABLE submission_file (
    id              BIGSERIAL PRIMARY KEY,
    submission_id   BIGINT      NOT NULL REFERENCES submission(id) ON DELETE CASCADE,
    filename        TEXT        NOT NULL,
    language        TEXT,
    code            TEXT        NOT NULL,

    UNIQUE (submission_id, filename)
);


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
    submission_id       BIGINT          UNIQUE NOT NULL REFERENCES submission(id),
    result              verdict_result  NOT NULL,
    time_ms             INT,
    memory_kb           INT,
    judged_at           TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_verdict_submission ON verdict(submission_id);
CREATE INDEX idx_verdict_result     ON verdict(result);
CREATE INDEX idx_verdict_judged     ON verdict(judged_at DESC);


CREATE TABLE erratum (
    id              BIGSERIAL PRIMARY KEY,
    problem_id      BIGINT  NOT NULL REFERENCES problem(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_erratum_created ON erratum(created_at DESC);
