import type { FastifyReply } from 'fastify';

const DepsError = {
  NOT_FOUND: { status: 404, error: 'E_NOT_FOUND' },
  WRONG_SERVER: { status: 400, error: 'E_WRONG_SERVER' },
  INVALID_SIGN: { status: 403, error: 'E_INVALID_SIGN' },
  OUTDATED_SIGN: { status: 409, error: 'E_OUTDATED_SIGN' },
  INVALID_REQUEST: { status: 400, error: 'E_INVALID_REQUEST' },
  INSUFFICIENT_POW: { status: 403, error: 'E_INSUFFICIENT_POW' },
  RATE_LIMITED: { status: 429, error: 'E_RATE_LIMITED' },
} as const;

type DepsErrorKey = keyof typeof DepsError;

const sendError = (reply: FastifyReply, key: DepsErrorKey, reason: string, extra?: Record<string, unknown>) => {
  const { status, error } = DepsError[key];
  return reply.status(status).send({ error, reason, ...extra });
};

export { DepsError, sendError };
