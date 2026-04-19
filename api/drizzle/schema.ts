import { pgTable, bigint, text, index, foreignKey, bigserial, timestamp, unique, integer, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const checkerType = pgEnum("checker_type", ['exact', 'epsilon', 'special_judge'])
export const verdictResult = pgEnum("verdict_result", ['AC', 'WA', 'TLE', 'MLE', 'RE', 'CE', 'IE'])


export const problem = pgTable("problem", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().notNull(),
	title: text().notNull(),
	problemPath: text("problem_path").notNull(),
});

export const submission = pgTable("submission", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	problemId: bigserial("problem_id", { mode: "bigint" }).notNull(),
	userPublicKey: text("user_public_key").notNull(),
	submittedAt: timestamp("submitted_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	signature: text().notNull(),
}, (table) => [
	index("idx_submission_problem").using("btree", table.problemId.asc().nullsLast().op("int8_ops")),
	index("idx_submission_submitted").using("btree", table.submittedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_submission_user").using("btree", table.userPublicKey.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.problemId],
			foreignColumns: [problem.id],
			name: "submission_problem_id_fkey"
		}),
]);

export const submissionFile = pgTable("submission_file", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	submissionId: bigserial("submission_id", { mode: "bigint" }).notNull(),
	filename: text().notNull(),
	language: text(),
	code: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.submissionId],
			foreignColumns: [submission.id],
			name: "submission_file_submission_id_fkey"
		}).onDelete("cascade"),
	unique("submission_file_submission_id_filename_key").on(table.submissionId, table.filename),
]);

export const verdict = pgTable("verdict", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	submissionId: bigserial("submission_id", { mode: "bigint" }).notNull(),
	result: verdictResult().notNull(),
	timeMs: integer("time_ms"),
	memoryKb: integer("memory_kb"),
	problemRevision: integer("problem_revision").notNull(),
	datasetHash: text("dataset_hash").notNull(),
	judgedAt: timestamp("judged_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	judgeSignature: text("judge_signature").notNull(),
	invalidatedAt: timestamp("invalidated_at", { withTimezone: true, mode: 'string' }),
	invalidatedReason: text("invalidated_reason"),
}, (table) => [
	index("idx_verdict_judged").using("btree", table.judgedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_verdict_result").using("btree", table.result.asc().nullsLast().op("enum_ops")),
	index("idx_verdict_submission").using("btree", table.submissionId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.submissionId],
			foreignColumns: [submission.id],
			name: "verdict_submission_id_fkey"
		}),
]);
