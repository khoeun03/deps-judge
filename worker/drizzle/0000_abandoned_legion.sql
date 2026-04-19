-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."submission_status" AS ENUM('waiting', 'judging', 'finished');--> statement-breakpoint
CREATE TYPE "public"."verdict_result" AS ENUM('AC', 'WA', 'TLE', 'MLE', 'RE', 'CE', 'IE');--> statement-breakpoint
CREATE TABLE "problem" (
	"id" bigint PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"problem_path" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"problem_id" bigserial NOT NULL,
	"user_public_key" text NOT NULL,
	"format" text NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"signature" text NOT NULL,
	"status" "submission_status" DEFAULT 'waiting' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_file" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"submission_id" bigserial NOT NULL,
	"filename" text NOT NULL,
	"language" text,
	"code" text NOT NULL,
	CONSTRAINT "submission_file_submission_id_filename_key" UNIQUE("submission_id","filename")
);
--> statement-breakpoint
CREATE TABLE "verdict" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"submission_id" bigserial NOT NULL,
	"result" "verdict_result" NOT NULL,
	"time_ms" integer,
	"memory_kb" integer,
	"judged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"invalidated_at" timestamp with time zone,
	"invalidated_reason" text
);
--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "public"."problem"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_file" ADD CONSTRAINT "submission_file_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verdict" ADD CONSTRAINT "verdict_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_submission_problem" ON "submission" USING btree ("problem_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_submission_submitted" ON "submission" USING btree ("submitted_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_submission_user" ON "submission" USING btree ("user_public_key" text_ops);--> statement-breakpoint
CREATE INDEX "idx_verdict_judged" ON "verdict" USING btree ("judged_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_verdict_result" ON "verdict" USING btree ("result" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_verdict_submission" ON "verdict" USING btree ("submission_id" int8_ops);
*/