import canonicalize from 'canonicalize';
import { createHash, createPublicKey, verify } from 'crypto';

import { fromBase64UrlNoPad } from './encoding.js';

// Magic!
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

type SignedData = {
  data: Record<string, unknown>;
  key: string;
  sign: string;
};

const verifySignedData = (signed: SignedData, expectedKey?: string): boolean => {
  if (expectedKey && signed.key !== expectedKey) return false;

  const canonical = canonicalize(signed.data);
  if (!canonical) return false;

  const blake2bHash = createHash('blake2b512').update(canonical, 'utf-8').digest();

  const rawPublicKey = fromBase64UrlNoPad(signed.key);
  const spkiDer = Buffer.concat([ED25519_SPKI_PREFIX, rawPublicKey]);
  const keyObject = createPublicKey({ key: spkiDer, format: 'der', type: 'spki' });

  const signature = fromBase64UrlNoPad(signed.sign);

  return verify(null, blake2bHash, keyObject, signature);
};

export { verifySignedData };
