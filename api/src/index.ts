import Fastify from 'fastify';
import 'dotenv/config';

const app = Fastify({ logger: true });

app.get('/', async () => {
  return 'Hello world!';
});

await app.listen({ port: Number(process.env.PORT), host: '0.0.0.0' });
