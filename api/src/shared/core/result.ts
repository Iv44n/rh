import { AppError, type AppErrorParams } from './app.error'
/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/**
 * Successful result.
 *
 * @example
 * const result = Result.ok(123)
 * // { ok: true, value: 123 }
 */
export type Ok<T> = {
  readonly ok: true
  readonly value: T
}

/**
 * Failed result.
 *
 * @example
 * const result = Result.err({ code: 'USER_NOT_FOUND', message: 'User not found' })
 * // { ok: false, error: AppError }
 */
export type Err<E extends AppError = AppError> = {
  readonly ok: false
  readonly error: E
}

/**
 * Represents either success or failure.
 *
 * Exported internally as Result to avoid name collision with the Result const.
 * Consumers should use the `Result` type re-exported from `result.ts`.
 */
export type Result<T, E extends AppError = AppError> = Ok<T> | Err<E>

/**
 * Allows passing an AppError instance or plain params.
 *
 * @example
 * Result.err(new UserNotFoundError())     // instanceof AppError
 * Result.err({ code: 'USER_NOT_FOUND', message: 'User not found' })
 */
export type ErrorInput<E extends AppError = AppError> = E | AppErrorParams

/* -------------------------------------------------------------------------- */
/*                              Internal Helpers                              */
/* -------------------------------------------------------------------------- */

/**
 * Ensures every error becomes an AppError instance.
 */
function toAppError<E extends AppError>(input: ErrorInput<E>): E {
  if (AppError.isAppError(input)) {
    return input as E
  }

  return AppError.create(input) as E
}

/* -------------------------------------------------------------------------- */
/*                                   Result                                   */
/* -------------------------------------------------------------------------- */

export const Result = {
  /* ---------------------------------------------------------------------- */
  /* Constructors                                                           */
  /* ---------------------------------------------------------------------- */

  /**
   * Creates a successful result.
   *
   * @example
   * return Result.ok(user)
   */
  ok<T>(value: T): Ok<T> {
    return Object.freeze({ ok: true, value })
  },

  /**
   * Creates a failed result.
   *
   * @example
   * return Result.err({ code: 'EMAIL_ALREADY_USED', message: 'Email already used' })
   */
  err<E extends AppError = AppError>(input: ErrorInput<E>): Err<E> {
    return Object.freeze({ ok: false, error: toAppError(input) })
  },

  /**
   * Safely executes a sync or async function, converting thrown exceptions
   * into a Result.
   *
   * Philosophy:
   * - Promise handles time / asynchrony.
   * - Result handles success / failure.
   * - This method is the async boundary of the Result API.
   *
   * Use `Result.try()` whenever calling code that may throw or reject
   * (database, HTTP, filesystem, parsing, third-party libraries, etc.).
   *
   * After awaiting the result, continue using the synchronous Result helpers
   * (`map`, `andThen`, `tap`, `match`, etc.).
   *
   * This keeps the API small and predictable: one async primitive,
   * everything else remains synchronous.
   *
   * @example
   * // Database call
   * const result = await Result.try(() =>
   *   prisma.user.findUnique({ where: { id } })
   * )
   *
   * @example
   * // JSON parse
   * const result = await Result.try(() => JSON.parse(raw))
   *
   * @example
   * // Multiple awaits inside
   * const result = await Result.try(async () => {
   *   const raw = await fetch('/api/users').then(r => r.json())
   *   return raw.data
   * })
   *
   * @example
   * // Continue with sync helpers after await
   * const user = await Result.try(() => repo.findById(id))
   *
   * return Result.andThen(user, validateUser)
   */
  async try<T>(fn: () => Promise<T> | T): Promise<Result<T>> {
    try {
      return Result.ok(await fn())
    } catch (error) {
      if (AppError.isAppError(error)) {
        return Result.err(error)
      }

      return Result.err({
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'Unexpected error',
        cause: error instanceof Error ? error.cause : undefined,
        stack: error instanceof Error ? error.stack : undefined
      })
    }
  },

  /* ---------------------------------------------------------------------- */
  /* Type Guards                                                            */
  /* ---------------------------------------------------------------------- */

  /**
   * Narrows result to Ok.
   *
   * @example
   * if (Result.isOk(result)) {
   *   console.log(result.value)
   * }
   */
  isOk<T, E extends AppError>(result: Result<T, E>): result is Ok<T> {
    return result.ok
  },

  /**
   * Narrows result to Err.
   *
   * @example
   * if (Result.isErr(result)) {
   *   console.log(result.error.code)
   * }
   */
  isErr<T, E extends AppError>(result: Result<T, E>): result is Err<E> {
    return !result.ok
  },

  /* ---------------------------------------------------------------------- */
  /* Success Transformations                                                */
  /* ---------------------------------------------------------------------- */

  /**
   * Transforms the success value. Errors pass through untouched.
   *
   * @example
   * Result.map(result, user => user.name)
   */
  map<T, E extends AppError, U>(
    result: Result<T, E>,
    fn: (value: T) => U
  ): Result<U, E> {
    return result.ok ? Result.ok(fn(result.value)) : result
  },

  /* ---------------------------------------------------------------------- */
  /* Error Transformations                                                  */
  /* ---------------------------------------------------------------------- */

  /**
   * Transforms the error. Success values pass through untouched.
   *
   * @example
   * Result.mapErr(result, err => ({
   *   code: 'WRAPPED',
   *   message: 'Wrapped error',
   *   cause: err
   * }))
   */
  mapErr<T, E extends AppError, F extends AppError>(
    result: Result<T, E>,
    fn: (error: E) => ErrorInput<F>
  ): Result<T, F> {
    if (result.ok) return result as Result<T, F>
    return Result.err(fn(result.error))
  },

  /* ---------------------------------------------------------------------- */
  /* Chaining                                                               */
  /* ---------------------------------------------------------------------- */

  /**
   * Chains a Result-producing operation. Short-circuits on error.
   *
   * @example
   * Result.andThen(findUser(id), user => validateUser(user))
   */
  andThen<T, E extends AppError, U, F extends AppError>(
    result: Result<T, E>,
    fn: (value: T) => Result<U, F>
  ): Result<U, E | F> {
    return result.ok ? fn(result.value) : (result as Err<E> as Result<U, E | F>)
  },

  /**
   * Chains an async Result-producing operation.
   * If the current result is Err, short-circuits immediately.
   *
   * Useful when the next step requires await
   * (database call, HTTP request, repository save, etc.)
   *
   * @example
   * const user = await Result.andThenAsync(
   *   findUser(id),
   *   user => repo.save(user)
   * )
   */
  async andThenAsync<T, E extends AppError, U, F extends AppError>(
    result: Result<T, E>,
    fn: (value: T) => Promise<Result<U, F>>
  ): Promise<Result<U, E | F>> {
    if (!result.ok) {
      return result as Result<U, E | F>
    }

    return await fn(result.value)
  },

  /* ---------------------------------------------------------------------- */
  /* Side Effects                                                           */
  /* ---------------------------------------------------------------------- */

  /**
   * Runs a side effect only on success. Returns the result unchanged.
   *
   * @example
   * Result.tap(result, user => logger.log(user.id))
   */
  tap<T, E extends AppError>(
    result: Result<T, E>,
    fn: (value: T) => void
  ): Result<T, E> {
    if (result.ok) fn(result.value)
    return result
  },

  /**
   * Runs a side effect only on error. Returns the result unchanged.
   *
   * @example
   * Result.tapErr(result, err => logger.error(err))
   */
  tapErr<T, E extends AppError>(
    result: Result<T, E>,
    fn: (error: E) => void
  ): Result<T, E> {
    if (!result.ok) fn(result.error)
    return result
  },

  /* ---------------------------------------------------------------------- */
  /* Utility                                                                */
  /* ---------------------------------------------------------------------- */

  /**
   * Wraps a nullable value into a Result.
   *
   * @example
   * Result.fromNullable(user, {
   *   code: 'USER_NOT_FOUND',
   *   message: 'User not found'
   * })
   */
  fromNullable<T, E extends AppError = AppError>(
    value: T | null | undefined,
    error: ErrorInput<E>
  ): Result<NonNullable<T>, E> {
    if (value === null || value === undefined) return Result.err(error)
    return Result.ok(value as NonNullable<T>)
  },

  /**
   * Combines many results into one. Returns the first error found.
   *
   * @example
   * Result.combine([Result.ok(1), Result.ok(2), Result.ok(3)])
   * // Ok([1, 2, 3])
   *
   * // Works with async too — resolve with Promise.all first:
   * const results = await Promise.all([
   *   Result.try(() => fetchA()),
   *   Result.try(() => fetchB()),
   * ])
   * Result.combine(results)
   */
  combine<T, E extends AppError>(results: Result<T, E>[]): Result<T[], E> {
    const values: T[] = []

    for (const result of results) {
      if (!result.ok) return result
      values.push(result.value)
    }

    return Result.ok(values)
  },

  /* ---------------------------------------------------------------------- */
  /* Final Handling                                                         */
  /* ---------------------------------------------------------------------- */

  /**
   * Pattern matching — ideal for controllers and presenters.
   *
   * @example
   * return Result.match(result, {
   *   ok: value => ({ data: value }),
   *   err: error => ({ error })
   * })
   */
  match<T, E extends AppError, R>(
    result: Result<T, E>,
    handlers: {
      ok(value: T): R
      err(error: E): R
    }
  ): R {
    return result.ok ? handlers.ok(result.value) : handlers.err(result.error)
  },

  /**
   * Returns the success value or a fallback.
   *
   * @example
   * Result.unwrapOr(result, [])
   */
  unwrapOr<T, E extends AppError>(result: Result<T, E>, fallback: T): T {
    return result.ok ? result.value : fallback
  }
}
