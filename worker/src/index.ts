import 'dotenv/config';

import { pollAndJudge } from './judge.js';

const POLL_INTERVAL = 2000;

const main = async () => {
  console.log('Worker started');

  while (true) {
    const judged = await pollAndJudge();
    if (!judged) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      continue;
    }

    console.log(`[${judged.judgedAt}] Submission ${judged.submissionId}: ${judged.result} (#${judged.id})`);
  }
};

main();
