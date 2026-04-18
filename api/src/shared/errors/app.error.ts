interface AppErrorOptions {
  message?: string
  statusCode?: number
  code?: string
  details?: unknown
}

type FactoryParams = Omit<AppErrorOptions, 'statusCode'> | string

const DEFAULT_MESSAGES: Record<number, string> = {
  400: 'Solicitud inválida.',
  401: 'No autorizado.',
  403: 'Acceso denegado.',
  404: 'Recurso no encontrado.',
  409: 'Conflicto con el estado actual.',
  500: 'Error interno del servidor. Por favor, inténtalo más tarde.'
}

const DEFAULT_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  500: 'INTERNAL_SERVER_ERROR'
}

export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details?: unknown
  public readonly timestamp: Date

  constructor(options: AppErrorOptions | string = {}) {
    const opts = typeof options === 'string' ? { message: options } : options
    const message = opts.message ?? DEFAULT_MESSAGES[500]

    super(message)

    this.name = this.constructor.name
    this.statusCode = opts.statusCode ?? 500
    this.code = opts.code ?? DEFAULT_CODES[500]
    this.details = opts.details
    this.timestamp = new Date()

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }

    Object.setPrototypeOf(this, new.target.prototype)
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp.toISOString()
    }
  }

  private static create(statusCode: number, params: FactoryParams): AppError {
    const opts = typeof params === 'string' ? { message: params } : params

    return new AppError({
      message: opts.message ?? DEFAULT_MESSAGES[statusCode],
      statusCode,
      code: opts.code ?? DEFAULT_CODES[statusCode],
      details: opts.details
    })
  }

  static badRequest(params: FactoryParams = {}): AppError {
    return AppError.create(400, params)
  }

  static unauthorized(params: FactoryParams = {}): AppError {
    return AppError.create(401, params)
  }

  static forbidden(params: FactoryParams = {}): AppError {
    return AppError.create(403, params)
  }

  static notFound(params: FactoryParams = {}): AppError {
    return AppError.create(404, params)
  }

  static conflict(params: FactoryParams = {}): AppError {
    return AppError.create(409, params)
  }

  static internal(params: FactoryParams = {}): AppError {
    return AppError.create(500, params)
  }

  static isAppError(err: unknown): err is AppError {
    return err instanceof AppError
  }
}
