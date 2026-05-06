export class HttpError extends Error {
  status: number;
  details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

export function badRequest(message: string, details?: unknown) {
  return new HttpError(400, message, details);
}

export function unauthorized(message = "Authentication is required.") {
  return new HttpError(401, message);
}

export function forbidden(message = "You do not have access to this resource.") {
  return new HttpError(403, message);
}

export function notFound(message = "Resource was not found.") {
  return new HttpError(404, message);
}

export function conflict(message: string) {
  return new HttpError(409, message);
}
