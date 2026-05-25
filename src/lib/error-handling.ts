/**
 * DocuGob — Error handling.
 *
 * AUDIT §6.1 — every server-bound mutation returns a `{ status, message }`
 * envelope so the hook layer can `if (result.status === 200) toast(...)`
 * uniformly. We extend this with an `AppError` class + `ErrorType` enum
 * and a `handleApiError()` helper that converts any thrown value
 * (AppError, ApiError from the fetch client, ZodError, plain Error) into
 * that envelope shape.
 *
 * Use `ApiResponse<T>` as the return type of any action/mutation handler
 * that the UI consumes — the toast/error wiring works the same regardless
 * of whether the underlying call hits FastAPI or stays in-process.
 */

import { ZodError } from "zod";
import { ApiError } from "./api/client";
import { logger } from "./logger";

export enum ErrorType {
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  RATE_LIMITED = "RATE_LIMITED",
  NETWORK = "NETWORK",
  UNKNOWN = "UNKNOWN",
}

export class AppError extends Error {
  readonly type: ErrorType;
  readonly status: number;
  readonly details?: string[];

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    status = 500,
    details?: string[]
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.status = status;
    this.details = details;
  }
}

export type ApiResponse<T = unknown> = {
  status: number;
  message: string;
  data?: T;
  errors?: string[];
};

/**
 * Convert any thrown value into the standard `ApiResponse` envelope.
 *
 * The helper never re-throws. UI hooks should always be able to
 * `const result = await tryAction()` and switch on `result.status`.
 */
export function handleApiError(error: unknown): ApiResponse {
  if (error instanceof AppError) {
    logger.warn(`[${error.type}] ${error.message}`, error.details);
    return {
      status: error.status,
      message: error.message,
      errors: error.details,
    };
  }

  if (error instanceof ApiError) {
    return {
      status: error.status,
      message: error.message,
      errors: error.errors,
    };
  }

  if (error instanceof ZodError) {
    const first = error.issues[0];
    return {
      status: 400,
      message: first?.message ?? "Datos inválidos",
      errors: error.issues.map((i) => i.message),
    };
  }

  if (error instanceof Error) {
    logger.error("Unhandled error", error);
    return { status: 500, message: error.message || "Error inesperado" };
  }

  logger.error("Unhandled non-Error throwable", error);
  return { status: 500, message: "Error inesperado" };
}

/**
 * Type guard that pairs nicely with `handleApiError`'s output.
 */
export function isSuccess<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { status: 200 | 201; data: T } {
  return response.status >= 200 && response.status < 300;
}
