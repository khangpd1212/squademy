import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { ErrorCode, getErrorMessage } from "@squademy/shared";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let code: keyof typeof ErrorCode | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
        const obj = exceptionResponse as Record<string, unknown>;
        code = typeof obj.code === "string" ? (obj.code as keyof typeof ErrorCode) : undefined;

        if (code) {
          message = getErrorMessage(code);
        } else if (typeof obj.message === "string") {
          message = obj.message;
        } else if (Array.isArray(obj.message)) {
          message = (obj.message as string[]).join(", ");
        } else {
          message = exception.message;
        }
      }
    }

    response.status(status).json({
      ok: false,
      message,
      code,
    });
  }
}
