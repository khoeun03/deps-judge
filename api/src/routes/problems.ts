import 'dotenv/config';

import { readFileSync } from 'node:fs';

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
      data: problems.map(({ id, title }) => ({
        id: `#${id}::${process.env.DEPS_JUDGE_DOMAIN}`,
        title,
      })),
      totalCount,
    };
  });

  app.get<{
    Params: { problemId: string };
  }>('/problems/:problemId', async (request, reply) => {
    const { problemId } = request.params;

    const problem = await db.query.problem.findFirst({
      where: (fields, { eq }) => eq(fields.id, Number(problemId)),
    });
    if (!problem) return reply.code(404).send({ error: 'Problem not found' });

    try {
      const meta = JSON.parse(readFileSync(`${problem.problemPath}/problem.json`, 'utf-8'));
      const statement = readFileSync(`${problem.problemPath}/statement.md`, 'utf-8');

      return {
        id: `#${problem.id}::${process.env.DEPS_JUDGE_DOMAIN}`,
        title: meta.title,
        statement,
      };
    } catch {
      return reply.status(500).send({ error: 'Failed to read problem data' });
    }
  });
};
