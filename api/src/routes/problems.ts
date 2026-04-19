import type { FastifyInstance } from 'fastify';

import { db } from '../db/index.js';
import { problem } from '../db/schema.js';

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
      data: problems,
      totalCount,
    };
  });

  app.get<{
    Params: { problemId: string };
  }>('/problems/:problemId', async (request, reply) => {
    const { problemId } = request.params;

    const problem = await db.query.problem.findFirst({
      columns: {
        id: true,
        title: true,
        statement: true,
      },
      where: (fields, { eq }) => eq(fields.id, BigInt(problemId)),
    });
    if (!problem) return reply.code(404);

    return problem;
  });
};
