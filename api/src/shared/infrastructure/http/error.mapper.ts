import type { AppError } from '@shared/core/app.error'
import { ErrorRegistry } from './error.registry'
import { HttpError } from './http.error'

function toHttp(error: AppError): HttpError {
  const http = ErrorRegistry.get(error.code) ?? HttpError.internal()

  return new HttpError({
    statusCode: http.statusCode,
    code: http.code,
    message: http.message,
    details: error.details,
    cause: error
  })
}

export const ErrorMapper = {
  toHttp
}
