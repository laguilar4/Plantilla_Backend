import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

declare module 'express' {
  interface Request {
    requestId?: string;
  }
}

/**
 * Attaches a unique request id to every incoming request (reused from the
 * `x-request-id` header when a gateway/proxy already sets one) and echoes
 * it back on the response so client and server logs can be correlated.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.header('x-request-id');
    const requestId = incoming && incoming.length > 0 ? incoming : randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  }
}
