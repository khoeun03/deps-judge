import type { FastifyInstance } from 'fastify';

import erratumRoute from './errata.js';
import infoRoute from './info.js';
import problemRotue from './problems.js';
import submissionRotue from './submissions.js';
import submitRoute from './submit.js';

export default async (app: FastifyInstance) => {
  app.register(infoRoute, { prefix: '/_deps/judge' });
  app.register(problemRotue, { prefix: '/_deps/judge' });
  app.register(submitRoute, { prefix: '/_deps/judge' });
  app.register(submissionRotue, { prefix: '/_deps/judge' });
  app.register(erratumRoute, { prefix: '/_deps/judge' });
};
