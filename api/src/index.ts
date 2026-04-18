import 'dotenv/config';

import Fastify from 'fastify';

import serverKeyPlugin from './plugins/server-key.js';
import routes from './routes/index.js';

const app = Fastify({ logger: true });

await app.register(serverKeyPlugin);
await app.register(routes);

await app.listen({ port: Number(process.env.PORT), host: '0.0.0.0' });
