import { HTTP, type HttpStatus } from './http'

export interface HttpErrorOptions<Details = unknown> {
  message?: string
  statusCode?: HttpStatus
  code?: string
  details?: Details
  cause?: unknown
}

type FactoryParams<Details = unknown> =
  | Omit<HttpErrorOptions<Details>, 'statusCode'>
  | string

export class HttpError<Details = unknown> extends Error {
  readonly statusCode: HttpStatus
  readonly code: string
  readonly details?: Details
  readonly timestamp: Date

  constructor(options: HttpErrorOptions<Details> | string = {}) {
    const opts = typeof options === 'string' ? { message: options } : options

    const fallback = HTTP.INTERNAL_SERVER_ERROR
    const statusCode = opts.statusCode ?? fallback.status

    const preset =
      Object.values(HTTP).find(item => item.status === statusCode) ?? fallback

    super(
      opts.message ?? preset.message,
      opts.cause ? { cause: opts.cause } : undefined
    )

    this.name = 'HttpError'
    this.statusCode = statusCode
    this.code = opts.code ?? preset.code
    this.details = opts.details
    this.timestamp = new Date()

    Object.setPrototypeOf(this, new.target.prototype)
  }

  serialize() {
    return {
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp.toISOString()
    }
  }

  private static create<Details = unknown>(
    config: (typeof HTTP)[keyof typeof HTTP],
    params: FactoryParams<Details> = {}
  ) {
    const opts = typeof params === 'string' ? { message: params } : params

    return new HttpError<Details>({
      statusCode: config.status,
      code: opts.code ?? config.code,
      message: opts.message ?? config.message,
      details: opts.details,
      cause: opts.cause
    })
  }

  static badRequest<Details = unknown>(params: FactoryParams<Details> = {}) {
    return HttpError.create(HTTP.BAD_REQUEST, params)
  }

  static unauthorized<Details = unknown>(params: FactoryParams<Details> = {}) {
    return HttpError.create(HTTP.UNAUTHORIZED, params)
  }

  static forbidden<Details = unknown>(params: FactoryParams<Details> = {}) {
    return HttpError.create(HTTP.FORBIDDEN, params)
  }

  static notFound<Details = unknown>(params: FactoryParams<Details> = {}) {
    return HttpError.create(HTTP.NOT_FOUND, params)
  }

  static methodNotAllowed<Details = unknown>(
    params: FactoryParams<Details> = {}
  ) {
    return HttpError.create(HTTP.METHOD_NOT_ALLOWED, params)
  }

  static conflict<Details = unknown>(params: FactoryParams<Details> = {}) {
    return HttpError.create(HTTP.CONFLICT, params)
  }

  static gone<Details = unknown>(params: FactoryParams<Details> = {}) {
    return HttpError.create(HTTP.GONE, params)
  }

  static payloadTooLarge<Details = unknown>(
    params: FactoryParams<Details> = {}
  ) {
    return HttpError.create(HTTP.PAYLOAD_TOO_LARGE, params)
  }

  static unsupportedMediaType<Details = unknown>(
    params: FactoryParams<Details> = {}
  ) {
    return HttpError.create(HTTP.UNSUPPORTED_MEDIA_TYPE, params)
  }

  static unprocessable<Details = unknown>(params: FactoryParams<Details> = {}) {
    return HttpError.create(HTTP.UNPROCESSABLE_CONTENT, params)
  }

  static tooManyRequests<Details = unknown>(
    params: FactoryParams<Details> = {}
  ) {
    return HttpError.create(HTTP.TOO_MANY_REQUESTS, params)
  }

  static internal<Details = unknown>(params: FactoryParams<Details> = {}) {
    return HttpError.create(HTTP.INTERNAL_SERVER_ERROR, params)
  }

  static badGateway<Details = unknown>(params: FactoryParams<Details> = {}) {
    return HttpError.create(HTTP.BAD_GATEWAY, params)
  }

  static serviceUnavailable<Details = unknown>(
    params: FactoryParams<Details> = {}
  ) {
    return HttpError.create(HTTP.SERVICE_UNAVAILABLE, params)
  }

  static gatewayTimeout<Details = unknown>(
    params: FactoryParams<Details> = {}
  ) {
    return HttpError.create(HTTP.GATEWAY_TIMEOUT, params)
  }

  static isHttpError(error: unknown): error is HttpError {
    return error instanceof HttpError
  }
}
