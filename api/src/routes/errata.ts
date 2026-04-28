import 'dotenv/config';

import { asc, inArray } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';

import { db } from '../db/index.js';
import { erratum } from '../db/schema.js';

export default async (app: FastifyInstance) => {
  app.get<{
    Querystring: {
      offset?: number;
      limit?: number;
    };
  }>('/errata', async (request, _) => {
    const { offset, limit } = request.query;

    const errata = await db.query.erratum.findMany({
      offset,
      limit: limit ? Math.min(limit, 100) : undefined,
    });
    const totalCount = await db.$count(erratum);

    return {
      data: errata.map(({ problemId, createdAt }) => ({
        problem: `${problemId}::${process.env.DEPS_JUDGE_DOMAIN}`,
        at: createdAt,
      })),
      totalCount,
    };
  });

  app.post<{
    Body: {
      query: string[];
    };
  }>('/errata/query', async (request, _) => {
    const query = request.body.query.slice(100);
    const problemIds = query
      .filter((q) => q.endsWith(`::${process.env.DEPS_JUDGE_DOMAIN}`))
      .map((q) => Number(q.split('::')[0]));

    const errata = await db
      .select()
      .from(erratum)
      .where(inArray(erratum.problemId, problemIds))
      .orderBy(asc(erratum.createdAt));

    const result: Record<string, Date | null> = {};
    problemIds.forEach((problemId) => {
      result[`${problemId}::${process.env.DEPS_JUDGE_DOMAIN}`] = null;
    });

    errata.forEach(({ problemId, createdAt }) => {
      result[`${problemId}::${process.env.DEPS_JUDGE_DOMAIN}`] = createdAt;
    });

    return result;
  });
};
