import 'dotenv/config';

import { existsSync, readdirSync, readFileSync } from 'node:fs';

import { db } from '../db/index.js';
import { problem } from '../db/schema.js';

const PROBLEMS_PATH = process.env.PROBLEMS_PATH!;

async function syncProblems() {
  const dirs = readdirSync(PROBLEMS_PATH, { withFileTypes: true });

  let synced = 0;
  let skipped = 0;

  for (const dir of dirs) {
    if (!dir.isDirectory()) {
      console.warn(`Skipping non-directory: ${dir.name}`);
      skipped++;
      continue;
    }

    if (!dir.name.match(/^\d+$/)) {
      console.warn(`Skipping invalid ID: ${dir.name}`);
      skipped++;
      continue;
    }

    const metaPath = `${PROBLEMS_PATH}/${dir.name}/problem.json`;
    if (!existsSync(metaPath)) {
      console.warn(`Skipping ${dir.name}: problem.json not found`);
      skipped++;
      continue;
    }

    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
    await db
      .insert(problem)
      .values({
        id: Number(dir.name),
        title: meta.title,
        problemPath: `${PROBLEMS_PATH}/${dir.name}`,
      })
      .onConflictDoUpdate({
        target: problem.id,
        set: {
          title: meta.title,
        },
      });

    synced++;
  }

  console.log(`Done: ${synced} synced, ${skipped} skipped`);
  process.exit(0);
}

await syncProblems();
