import 'dotenv/config';

import { db } from '../db/index.js';
import { erratum } from '../db/schema.js';

async function errata() {
  const [, , problemId] = process.argv;

  if (!problemId) {
    console.error('Usage: pnpm errata <problemId>');
    return 1;
  }

  const [id, domain] = problemId.split('::');
  if (domain != process.env.DEPS_JUDGE_DOMAIN) {
    console.error('Error: Domain unmatched');
    return 1;
  }

  if (Number.isNaN(Number(id))) {
    console.error('Error: Problem not found');
    return 1;
  }
  const problem = await db.query.problem.findFirst({
    where: (fields, { eq }) => eq(fields.id, Number(id)),
  });
  if (!problem) {
    console.error('Error: Problem not found');
    return 1;
  }

  await db.insert(erratum).values({ problemId: Number(id) });
  console.log(`Erratum created for problem ${problemId}`);
  return 0;
}

const code = await errata();
process.exit(code);
