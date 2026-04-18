import fp from 'fastify-plugin';

import { loadOrCreateKeyPair } from '../utils/key.js';

declare module 'fastify' {
  interface FastifyInstance {
    serverKey: {
      publicKey: Buffer;
      privateKey: Buffer;
    };
  }
}

export default fp(async (app) => {
  const keyPair = loadOrCreateKeyPair();
  app.decorate('serverKey', keyPair);
});
