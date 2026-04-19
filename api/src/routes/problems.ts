import 'dotenv/config';

import type { FastifyInstance } from 'fastify';

import { db } from '../db/index.js';
import { problem } from '../db/schema.js';
import { loadProblemMeta, loadProblemStatement } from '../utils/problem.js';

export default async (app: FastifyInstance) => {
  app.get<{
    Querystring: {
      offset?: number;
      limit?: number;
    };
  }>('/problems', async (request, _) => {
    const { offset, limit } = request.query;

    const problems = await db.query.problem.findMany({
      columns: {
        id: true,
        title: true,
      },
      offset,
      limit: limit ? Math.min(limit, 100) : undefined,
    });
    const totalCount = await db.$count(problem);

    return {
      data: problems.map(({ id, title }) => ({
        id: `${id}::${process.env.DEPS_JUDGE_DOMAIN}`,
        title,
      })),
      totalCount,
    };
  });

  app.get<{
    Params: { problemId: string };
  }>('/problems/:problemId', async (request, reply) => {
    const { problemId } = request.params;

    const match = problemId.match(/^(\d+)::.+$/);
    if (!match) return;

    const [_, id] = match;
    const problem = await db.query.problem.findFirst({
      where: (fields, { eq }) => eq(fields.id, Number(id)),
    });
    if (!problem) return reply.code(404).send({ error: 'Problem not found' });

    try {
      const meta = await loadProblemMeta(problem.problemPath);
      const statement = await loadProblemStatement(problem.problemPath);

      return {
        id: `#${problem.id}::${process.env.DEPS_JUDGE_DOMAIN}`,
        title: meta.title,
        content: statement,
        powFactor: 0,
        formats: Object.fromEntries(
          Object.entries(meta.formats).map(([formatName, format]) => {
            return [
              formatName,
              {
                totalBytes: format.totalBytes,
                fileCount: format.fileCount,
                files: format.files,
              },
            ];
          }),
        ),
      };
    } catch {
      return reply.status(500).send({ error: 'Failed to read problem data' });
    }
  });
};
