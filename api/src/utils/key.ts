import 'dotenv/config';

import { createPublicKey, generateKeyPairSync } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

const KEY_DIR = process.env.KEY_DIR || './keys';
const PRIVATE_KEY_PATH = `${KEY_DIR}/home.key`;
const PUBLIC_KEY_PATH = `${KEY_DIR}/home.pub`;

const loadOrCreateKeyPair = () => {
  if (existsSync(PRIVATE_KEY_PATH) && existsSync(PUBLIC_KEY_PATH)) {
    return {
      privateKey: readFileSync(PRIVATE_KEY_PATH),
      publicKey: readFileSync(PUBLIC_KEY_PATH),
    };
  }

  mkdirSync(KEY_DIR, { recursive: true, mode: 0o700 });

  const { privateKey, publicKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' },
  });

  writeFileSync(PRIVATE_KEY_PATH, privateKey, { mode: 0o600 });
  writeFileSync(PUBLIC_KEY_PATH, privateKey, { mode: 0o644 });

  return { privateKey, publicKey };
};

const extractRawPublicKey = function (spkiDer: Buffer) {
  const key = createPublicKey({ key: spkiDer, format: 'der', type: 'spki' });
  return key.export({ type: 'spki', format: 'jwk' });
};

export { extractRawPublicKey, loadOrCreateKeyPair };
