import type { FastifyInstance } from 'fastify';

import { db } from '../db/index.js';
import { sendError } from '../utils/errors.js';
import { signData } from '../utils/sign.js';

export default async (app: FastifyInstance) => {
  app.get<{
    Params: {
      submissionId: string;
    };
  }>('/submissions/:submissionId', async (request, reply) => {
    const { submissionId } = request.params;
    if (!submissionId.match(/^\d+/)) return sendError(reply, 'NOT_FOUND', 'Submission not found');

    const submission = await db.query.submission.findFirst({
      where: (fields, { eq }) => eq(fields.id, Number(submissionId)),
    });
    if (!submission) return sendError(reply, 'NOT_FOUND', 'Submission not found');

    if (submission.status === 'waiting' || submission.status === 'judging') return { status: submission.status };

    const verdict = await db.query.verdict.findFirst({
      where: (fields, { eq }) => eq(fields.submissionId, submission.id),
    });

    const certificate =
      verdict?.result === 'AC'
        ? signData(
            {
              identity: `::${submission.userPublicKey}`,
              problemId: submission.problemId,
              score: 1.0,
              signedAt: submission.submittedAt,
            },
            app.serverKey.privateKey,
            app.serverKey.publicKey,
          )
        : undefined;

    return {
      status: 'finished',
      verdict: verdict?.result,
      certificate,
    };
  });
};
