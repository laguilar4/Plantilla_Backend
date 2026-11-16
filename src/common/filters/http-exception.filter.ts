import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

const INTERNAL_SERVER_ERROR_STATUS: number = HttpStatus.INTERNAL_SERVER_ERROR;

interface ErrorResponseBody {
  success: false;
  statusCode: number;
  path: string;
  timestamp: string;
  message: string | string[];
  error?: string;
}

/**
 * Normalizes every thrown error (HttpException or unexpected) into a
 * consistent JSON error envelope so API consumers always get the same shape.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const statusCode: number = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException ? exception.getResponse() : null;
    const message = this.extractMessage(exceptionResponse, exception);

    const body: ErrorResponseBody = {
      success: false,
      statusCode,
      path: request.url,
      timestamp: new Date().toISOString(),
      message,
    };

    if (statusCode >= INTERNAL_SERVER_ERROR_STATUS) {
      this.logger.error(
        `${request.method} ${request.url} -> ${statusCode}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} -> ${statusCode}: ${JSON.stringify(message)}`,
      );
    }

    response.status(statusCode).json(body);
  }

  private extractMessage(exceptionResponse: unknown, exception: unknown): string | string[] {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }
    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      return (exceptionResponse as { message: string | string[] }).message;
    }
    if (exception instanceof Error && exception.message) {
      return exception.message;
    }
    return 'Internal server error';
  }
}
