import type { FastifyInstance } from 'fastify';

import infoRoute from './info.js';
import problemRotue from './problems.js';

export default async (app: FastifyInstance) => {
  app.register(infoRoute, { prefix: '/_deps/judge' });
  app.register(problemRotue, { prefix: '/_deps/judge' });
};
