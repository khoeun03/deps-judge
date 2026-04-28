import {
  bigint,
  bigserial,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

export const submissionStatus = pgEnum('submission_status', ['waiting', 'judging', 'finished']);
export const verdictResult = pgEnum('verdict_result', ['AC', 'WA', 'TLE', 'MLE', 'OLE', 'RE', 'CE', 'UE']);

export const problem = pgTable('problem', {
  id: bigint({ mode: 'number' }).primaryKey().notNull(),
  title: text().notNull(),
  problemPath: text('problem_path').notNull(),
});

export const submission = pgTable(
  'submission',
  {
    id: bigserial({ mode: 'number' }).primaryKey().notNull(),
    problemId: bigserial('problem_id', { mode: 'number' }).notNull(),
    userPublicKey: text('user_public_key').notNull(),
    format: text().notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    signature: text().notNull(),
    status: submissionStatus().default('waiting').notNull(),
  },
  (table) => [
    index('idx_submission_problem').using('btree', table.problemId.asc().nullsLast().op('int8_ops')),
    index('idx_submission_submitted').using('btree', table.submittedAt.desc().nullsFirst().op('timestamptz_ops')),
    index('idx_submission_user').using('btree', table.userPublicKey.asc().nullsLast().op('text_ops')),
    foreignKey({
      columns: [table.problemId],
      foreignColumns: [problem.id],
      name: 'submission_problem_id_fkey',
    }),
  ],
);

export const submissionFile = pgTable(
  'submission_file',
  {
    id: bigserial({ mode: 'number' }).primaryKey().notNull(),
    submissionId: bigserial('submission_id', { mode: 'number' }).notNull(),
    filename: text().notNull(),
    language: text(),
    code: text().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.submissionId],
      foreignColumns: [submission.id],
      name: 'submission_file_submission_id_fkey',
    }).onDelete('cascade'),
    unique('submission_file_submission_id_filename_key').on(table.submissionId, table.filename),
  ],
);

export const verdict = pgTable(
  'verdict',
  {
    id: bigserial({ mode: 'number' }).primaryKey().notNull(),
    submissionId: bigserial('submission_id', { mode: 'number' }).notNull(),
    result: verdictResult().notNull(),
    timeMs: integer('time_ms'),
    memoryKb: integer('memory_kb'),
    judgedAt: timestamp('judged_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_verdict_judged').using('btree', table.judgedAt.desc().nullsFirst().op('timestamptz_ops')),
    index('idx_verdict_result').using('btree', table.result.asc().nullsLast().op('enum_ops')),
    index('idx_verdict_submission').using('btree', table.submissionId.asc().nullsLast().op('int8_ops')),
    foreignKey({
      columns: [table.submissionId],
      foreignColumns: [submission.id],
      name: 'verdict_submission_id_fkey',
    }),
  ],
);

export const erratum = pgTable(
  'erratum',
  {
    id: bigserial({ mode: 'number' }).primaryKey().notNull(),
    problemId: bigint('problem_id', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_erratum_created').using('btree', table.createdAt.desc().nullsFirst().op('timestamptz_ops')),
    foreignKey({
      columns: [table.problemId],
      foreignColumns: [problem.id],
      name: 'erratum_problem_id_fkey',
    }),
  ],
);
