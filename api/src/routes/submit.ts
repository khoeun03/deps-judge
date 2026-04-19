import type { FastifyInstance } from 'fastify';

import { db } from '../db/index.js';
import { submission, submissionFile } from '../db/schema.js';
import { loadProblemMeta } from '../utils/problem.js';
import { verifySignedData } from '../utils/verify.js';

type SubmissionFile = {
  language: string;
  content: string;
};

export default async (app: FastifyInstance) => {
  app.post<{
    Params: { problemId: string };
    Body: {
      key: string;
      data: {
        format: string;
        files: Record<string, SubmissionFile>;
        signedAt: Date;
      };
      sign: string;
      pow: string;
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

      // TODO: POW 검증
      console.log(data);

      const existingSubmission = await db.query.submission.findFirst({
        where: (fields, { eq }) => eq(fields.signature, sign),
      });
      if (existingSubmission) return reply.code(429).send({ error: 'Duplicated submission' });

      const problem = await db.query.problem.findFirst({
        where: (fields, { eq }) => eq(fields.id, Number(id)),
      });
      if (!problem) return reply.code(404).send({ error: 'Problem not found' });

      const meta = await loadProblemMeta(problem.problemPath);
      const format = meta.formats[data.format];
      if (!format) return reply.code(400).send({ error: 'Invalid format' });

      if (Object.keys(data.files).length < (format.fileCount?.min ?? -Infinity))
        return reply.code(400).send({ error: 'Out of file count limit' });
      if (Object.keys(data.files).length > (format.fileCount?.max ?? Infinity))
        return reply.code(400).send({ error: 'Out of file count limit' });

      let totalBytes = 0;
      let hasInvalidFile = false;

      Object.entries(data.files).forEach(([filename, { language, content }]) => {
        totalBytes += Buffer.byteLength(content, 'utf-8');

        const file = format.files[filename];
        if (!file) return;
        if (!file.languages.includes(language)) {
          hasInvalidFile = true;
          return;
        }
      });

      if (hasInvalidFile) return reply.code(400).send({ error: 'Invalid format' });
      if (totalBytes < (format.totalBytes?.min ?? -Infinity))
        return reply.code(400).send({ error: 'Out of total bytes limit' });
      if (totalBytes > (format.totalBytes?.max ?? Infinity))
        return reply.code(400).send({ error: 'Out of total bytes limit' });

      const submissionId = await db.transaction(async (tx) => {
        const [newSubmission] = await tx
          .insert(submission)
          .values({
            problemId: Number(id),
            userPublicKey: key,
            format: data.format,
            submittedAt: new Date(),
            signature: sign,
          })
          .returning();

        await tx.insert(submissionFile).values(
          Object.entries(data.files).map(([filename, { language, content }]) => ({
            submissionId: newSubmission.id,
            filename,
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
