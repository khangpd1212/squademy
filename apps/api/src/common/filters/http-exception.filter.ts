import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === "string"
          ? exceptionResponse
          : (exceptionResponse as { message?: string | string[] }).message
            ? Array.isArray(
                (exceptionResponse as { message: string | string[] }).message,
              )
              ? (
                  exceptionResponse as { message: string[] }
                ).message.join(", ")
              : ((exceptionResponse as { message: string }).message)
            : exception.message;
    }

    response.status(status).json({
      ok: false,
      message,
      error: message,
    });
  }
}
