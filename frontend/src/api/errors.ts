export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  return 'Something went wrong while saving that note.'
}
