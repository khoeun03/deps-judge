import type { FastifyInstance } from 'fastify';

import { db } from '../db/index.js';
import { submission, submissionFile } from '../db/schema.js';
import { sendError } from '../utils/errors.js';
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
        intent: string;
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

      const match = problemId.match(/^(\d+)::(.+)$/);
      if (!match) return reply.code(404).send({ error: 'Problem not found' });

      const [_, id, server] = match;
      if (server != process.env.DEPS_JUDGE_DOMAIN) return sendError(reply, 'WRONG_SERVER', 'Wrong server');

      if (!verifySignedData(request.body)) return sendError(reply, 'INVALID_SIGN', 'Invalid signature');
      const { key, data, sign } = request.body;

      if (data.intent !== 'deps/problemSubmit') return sendError(reply, 'INVALID_REQUEST', 'Invalid intent');

      const now = new Date();
      if (Math.abs(now.getTime() - data.signedAt.getTime()) > 180 * 1000)
        return sendError(reply, 'INVALID_REQUEST', 'signedAt is outdated');

      // TODO: POW 검증

      const existingSubmission = await db.query.submission.findFirst({
        where: (fields, { eq }) => eq(fields.signature, sign),
      });
      if (existingSubmission) return reply.code(429).send({ error: 'Duplicated submission' });

      const problem = await db.query.problem.findFirst({
        where: (fields, { eq }) => eq(fields.id, Number(id)),
      });
      if (!problem) return sendError(reply, 'NOT_FOUND', 'Problem not found');

      const meta = await loadProblemMeta(problem.problemPath);
      const format = meta.formats[data.format];
      if (!format) return sendError(reply, 'INVALID_REQUEST', `Invalid format type "${data.format}"`);

      if (Object.keys(data.files).length < (format.fileCount?.min ?? -Infinity))
        return sendError(reply, 'INVALID_REQUEST', 'Out of file count limit');
      if (Object.keys(data.files).length > (format.fileCount?.max ?? Infinity))
        return sendError(reply, 'INVALID_REQUEST', 'Out of file count limit');

      let totalBytes = 0;
      let hasInvalidFile = false;

      Object.entries(data.files).forEach(([filename, { language, content }]) => {
        totalBytes += Buffer.byteLength(content, 'utf-8');

        const file = format.files[filename];
        if (!file) return;
        if (!file.languages.includes(language)) {
          hasInvalidFile = true;
        }
      });

      if (hasInvalidFile) return sendError(reply, 'INVALID_REQUEST', 'Invalid format');
      if (totalBytes < (format.totalBytes?.min ?? -Infinity))
        return sendError(reply, 'INVALID_REQUEST', 'Out of total bytes limit');
      if (totalBytes > (format.totalBytes?.max ?? Infinity))
        return sendError(reply, 'INVALID_REQUEST', 'Out of total bytes limit');

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

      return { submissionId: submissionId.toString() };
    },
  );
};
