export interface ErrorShape<TDetails = unknown> {
  message: string
  code: string
  details?: TDetails
}

export class AppError<TDetails = unknown> extends Error {
  override readonly name = 'ApiError'
  readonly code: string
  readonly details?: TDetails

  constructor(error: ErrorShape<TDetails>, options?: { cause?: unknown }) {
    super(error.message, options)

    this.code = error.code
    this.details = error.details
  }

  serialize(): ErrorShape<TDetails> {
    return {
      message: this.message,
      code: this.code,
      details: this.details
    }
  }

  static fromUnknown<TDetails = unknown>(error: unknown): AppError<TDetails> {
    if (error instanceof AppError) {
      return error as AppError<TDetails>
    }

    if (error instanceof Error) {
      return new AppError<TDetails>(
        { message: error.message, code: 'UNKNOWN_ERROR' },
        { cause: error }
      )
    }

    return new AppError<TDetails>(
      { message: 'Unexpected error', code: 'UNKNOWN_ERROR' },
      { cause: error }
    )
  }
}
