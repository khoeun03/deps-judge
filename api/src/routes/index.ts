import type { FastifyInstance } from 'fastify';

import infoRoute from './info.js';

export default async (app: FastifyInstance) => {
  app.register(infoRoute, { prefix: '/_deps/judge' });
};
