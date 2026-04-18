const fromBase64UrlNoPad = (str: string): Buffer => {
  return Buffer.from(str, 'base64url');
};

const toBase64UrlNoPad = (buf: Buffer): string => {
  return buf.toString('base64url').replace(/=+$/, '');
};

export { fromBase64UrlNoPad, toBase64UrlNoPad };
