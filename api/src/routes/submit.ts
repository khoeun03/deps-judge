import type { FastifyInstance } from 'fastify';

import { db } from '../db/index.js';
import { submission, submissionFile } from '../db/schema.js';
import { loadProblemMeta } from '../utils/problem.js';
import { verifySignedData } from '../utils/verify.js';

type SubmissionFile = {
  language: string;
  name?: string;
  content: string;
};

export default async (app: FastifyInstance) => {
  app.post<{
    Params: { problemId: string };
    Body: {
      key: string;
      data: {
        files: SubmissionFile[];
        signedAt: Date;
      };
      sign: string;
    };
  }>(
    '/problems/:problemId/submit',
    {
      schema: {
        body: {
          type: 'object',
          required: ['key', 'data', 'sign'],
        },
      },
    },
    async (request, reply) => {
      const { problemId } = request.params;

      const match = problemId.match(/^(\d+)::.+$/);
      if (!match) return reply.code(404).send({ error: 'Problem not found' });

      const [_, id] = match;

      if (!verifySignedData(request.body)) return reply.code(400).send({ error: 'Invalid signature' });
      const { key, data, sign } = request.body;

      const existingSubmission = await db.query.submission.findFirst({
        where: (fields, { eq }) => eq(fields.signature, sign),
      });
      if (existingSubmission) return reply.code(429).send({ error: 'Duplicated submission' });

      const problem = await db.query.problem.findFirst({
        where: (fields, { eq }) => eq(fields.id, Number(id)),
      });
      if (!problem) return reply.code(404).send({ error: 'Problem not found' });

      const meta = await loadProblemMeta(problem.problemPath);
      if (data.files.some((file) => !meta.languages.includes(file.language)))
        return reply.code(400).send({ error: 'Invalid language' });

      const submissionId = await db.transaction(async (tx) => {
        const [newSubmission] = await tx
          .insert(submission)
          .values({
            problemId: Number(id),
            userPublicKey: key,
            submittedAt: new Date(),
            signature: sign,
          })
          .returning();

        await tx.insert(submissionFile).values(
          data.files.map(({ language, name = '', content }) => ({
            submissionId: newSubmission.id,
            filename: name,
            language,
            code: content,
          })),
        );

        return newSubmission.id;
      });

      return { submissionId };
    },
  );
};
