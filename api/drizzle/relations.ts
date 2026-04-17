import { relations } from "drizzle-orm/relations";
import { problem, submission, submissionFile, verdict } from "./schema";

export const submissionRelations = relations(submission, ({one, many}) => ({
	problem: one(problem, {
		fields: [submission.problemId],
		references: [problem.id]
	}),
	submissionFiles: many(submissionFile),
	verdicts: many(verdict),
}));

export const problemRelations = relations(problem, ({many}) => ({
	submissions: many(submission),
}));

export const submissionFileRelations = relations(submissionFile, ({one}) => ({
	submission: one(submission, {
		fields: [submissionFile.submissionId],
		references: [submission.id]
	}),
}));

export const verdictRelations = relations(verdict, ({one}) => ({
	submission: one(submission, {
		fields: [verdict.submissionId],
		references: [submission.id]
	}),
}));