export class AuthError extends Error {
  constructor (message: string) {
    super(message)
    this.name = this.constructor.name
  }
}
export class NotFoundError extends Error {
  constructor (message: string) {
    super(message)
    this.name = this.constructor.name
  }
}
export class PermissionDeniedError extends Error {
  constructor (message: string) {
    super(message)
    this.name = this.constructor.name
  }
}
