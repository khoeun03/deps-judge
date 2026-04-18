import canonicalize from 'canonicalize';
import { createHash, createPrivateKey, sign } from 'crypto';

import { toBase64UrlNoPad } from './encoding.js';

// Magic! PKCS#8 DER Header
const ED25519_PKCS8_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');

const rawPrivateKeyToKeyObject = (raw: Buffer) => {
  const pkcs8Der = Buffer.concat([ED25519_PKCS8_PREFIX, raw]);
  return createPrivateKey({ key: pkcs8Der, format: 'der', type: 'pkcs8' });
};

type SignableData = { signedAt: Date } & Record<string, unknown>;

const signData = (data: SignableData, privateKey: Buffer, publicKey: Buffer) => {
  const canonical = canonicalize(data);
  if (!canonical) throw new Error('Failed to canonicalize data');

  const blake2bHash = createHash('blake2b512').update(canonical, 'utf8').digest();
  const keyObject = rawPrivateKeyToKeyObject(privateKey);
  const signature = sign(null, blake2bHash, keyObject);

  return {
    data,
    key: toBase64UrlNoPad(publicKey),
    sign: toBase64UrlNoPad(signature),
  };
};

export { signData };
