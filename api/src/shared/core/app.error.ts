export interface AppErrorParams<
  Code extends string = string,
  Details = unknown
> {
  code: Code
  message: string
  details?: Details
  cause?: unknown
}

export class AppError<
  Code extends string = string,
  Details = unknown
> extends Error {
  readonly code: Code
  readonly details?: Details

  constructor(params: AppErrorParams<Code, Details>) {
    super(params.message, params.cause ? { cause: params.cause } : undefined)

    this.name = 'AppError'
    this.code = params.code
    this.details = params.details

    Object.setPrototypeOf(this, new.target.prototype)
  }

  static create<Code extends string, Details = unknown>(
    params: AppErrorParams<Code, Details>
  ): AppError<Code, Details> {
    return new AppError(params)
  }

  serialize() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details
    }
  }

  static isAppError(error: unknown): error is AppError {
    return error instanceof AppError
  }
}
