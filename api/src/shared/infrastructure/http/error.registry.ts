import type { HttpError } from './http.error'

class Registry {
  private readonly map = new Map<string, () => HttpError>()

  register(code: string, status: () => HttpError) {
    if (this.map.has(code)) {
      throw new Error(
        `[ErrorRegistry] Collision detected: Code "${code}" is already registered.`
      )
    }
    this.map.set(code, status)
  }

  registerMany(entries: Record<string, () => HttpError>) {
    for (const [code, status] of Object.entries(entries)) {
      this.register(code, status)
    }
  }

  get(code: string): HttpError | undefined {
    const factory = this.map.get(code)
    return factory?.()
  }

  has(code: string): boolean {
    return this.map.has(code)
  }
}

export const ErrorRegistry = new Registry()
