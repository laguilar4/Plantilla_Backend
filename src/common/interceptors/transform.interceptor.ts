import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SuccessResponse<T> {
  success: true;
  statusCode: number;
  data: T;
}

/**
 * Wraps every successful controller response in a consistent envelope:
 * { success, statusCode, data }. Errors are handled separately by
 * AllExceptionsFilter so their shape stays distinct.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, SuccessResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<SuccessResponse<T>> {
    const response = context.switchToHttp().getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      map((data: T) => ({
        success: true as const,
        statusCode: response.statusCode,
        data,
      })),
    );
  }
}
