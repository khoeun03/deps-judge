import 'dotenv/config';

import { execSync } from 'child_process';
import { eq } from 'drizzle-orm';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';

import { db } from './db/index.js';
import { submission, verdict } from './db/schema.js';
import { loadProblemMeta, loadTestCases } from './utils/problem.js';

type VerdictResult = 'AC' | 'WA' | 'TLE' | 'MLE' | 'OLE' | 'RE' | 'CE' | 'UE';

const pollAndJudge = async () => {
  const sub = await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(submission)
      .where(eq(submission.status, 'waiting'))
      .limit(1)
      .for('update', { skipLocked: true });
    if (!row) return null;

    const [sub] = await tx.update(submission).set({ status: 'judging' }).where(eq(submission.id, row.id)).returning();
    return sub;
  });
  if (!sub) return null;
  console.log(`Judging submission ${sub.id}`);

  const WORK_DIR = process.env.WORK_DIR || '/tmp/deps-judge';
  const tmpDir = `${WORK_DIR}/submission-${sub.id}`;
  mkdirSync(tmpDir, { recursive: true });

  try {
    const files = await db.query.submissionFile.findMany({
      where: (fields, { eq }) => eq(fields.submissionId, sub.id),
    });

    const problem = await db.query.problem.findFirst({
      where: (fields, { eq }) => eq(fields.id, sub.problemId),
    });
    if (!problem) throw new Error('Problem not found');

    files.forEach(({ filename, code }) => writeFileSync(`${tmpDir}/${filename}`, code));

    const meta = await loadProblemMeta(problem.problemPath);
    const testCases = await loadTestCases(problem.problemPath);

    const formatDir = `${problem.problemPath}/formats/${sub.format}`;
    cpSync(formatDir, `${tmpDir}/scripts`, { recursive: true });

    const format = meta.formats[sub.format];
    if (format.scripts['build']) {
      try {
        execSync(
          `docker run --rm --network=none -v ${tmpDir}:/sandbox deps-judge-sandbox sh /sandbox/scripts/${format.scripts['build']}`,
          { timeout: 30000, encoding: 'utf-8' },
        );
      } catch {
        const judged = await db.transaction(async (tx) => {
          await tx.update(submission).set({ status: 'finished' }).where(eq(submission.id, sub.id));
          const [judged] = await tx
            .insert(verdict)
            .values({
              submissionId: sub.id,
              result: 'CE',
              judgedAt: new Date(),
            })
            .returning();
          return judged;
        });
        rmSync(tmpDir, { recursive: true, force: true });
        return judged;
      }
    }

    let finalVerdict: VerdictResult = 'AC';
    let finalTimeMs = 0;
    let finalMemKb = 0;

    for (const testCase of testCases) {
      writeFileSync(`${tmpDir}/input.txt`, testCase.input);

      execSync(
        `docker run --rm --network=none --memory=${meta.memoryLimit}m --memory-swap=${meta.memoryLimit}m -e TIME_LIMIT=${meta.timeLimit / 1000} -v ${tmpDir}:/sandbox deps-judge-sandbox sh /sandbox/scripts/${format.scripts.run}`,
        { timeout: meta.timeLimit + 5000, encoding: 'utf-8' },
      );

      const stats = readFileSync(`${tmpDir}/stats.txt`, 'utf-8').trim();
      const [timeStr, memStr] = stats.split(' ');
      const timeMs = parseFloat(timeStr) * 1000;
      const memKb = parseInt(memStr);
      const exitCode = parseInt(readFileSync(`${tmpDir}/exitcode.txt`, 'utf-8').trim());

      if (exitCode === 124) {
        finalVerdict = 'TLE';
        break;
      } else if (memKb > meta.memoryLimit * 1024) {
        finalVerdict = 'MLE';
        break;
      } else if (exitCode !== 0) {
        finalVerdict = 'RE';
        break;
      }

      const result = readFileSync(`${tmpDir}/output.txt`, 'utf-8');
      if (Buffer.byteLength(result) > 64 * 1024 * 1024) {
        finalVerdict = 'OLE';
        break;
      }
      console.log(`Result: ${result}`);

      if (timeMs > finalTimeMs) finalTimeMs = timeMs;
      if (memKb > finalMemKb) finalMemKb = memKb;

      writeFileSync(`${tmpDir}/expected.txt`, testCase.output);

      if (format.scripts['verify']) {
        try {
          execSync(
            `docker run --rm --network=none -v ${tmpDir}:/sandbox:ro deps-judge-sandbox sh /sandbox/scripts/${format.scripts['verify']}`,
            { timeout: 10000 },
          );
        } catch {
          finalVerdict = 'WA';
          break;
        }
      } else {
        if (result.trim() !== testCase.output.trim()) {
          finalVerdict = 'WA';
          break;
        }
      }
    }

    const judged = await db.transaction(async (tx) => {
      await tx.update(submission).set({ status: 'finished' }).where(eq(submission.id, sub.id));
      const [judged] = await tx
        .insert(verdict)
        .values({
          submissionId: sub.id,
          result: finalVerdict,
          judgedAt: new Date(),
          timeMs: finalVerdict === 'AC' ? finalTimeMs : undefined,
          memoryKb: finalVerdict === 'AC' ? finalMemKb : undefined,
        })
        .returning();
      return judged;
    });

    rmSync(tmpDir, { recursive: true, force: true });
    return judged;
  } catch (err) {
    console.error(err);

    const judged = await db.transaction(async (tx) => {
      await tx.update(submission).set({ status: 'finished' }).where(eq(submission.id, sub.id));
      const [judged] = await tx
        .insert(verdict)
        .values({
          submissionId: sub.id,
          result: 'UE',
        })
        .returning();
      return judged;
    });

    rmSync(tmpDir, { recursive: true, force: true });
    return judged;
  }
};

export { pollAndJudge };
