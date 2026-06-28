// Lightweight HTTP error for the service/route boundary. Routes catch this and
// map it to a status + JSON body; anything else becomes a 500.
//
// Note: explicit field assignment (not a constructor parameter property) so the
// module runs under Node's strip-only TypeScript mode as well as Next's SWC.

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export const notFound = (message: string): HttpError => new HttpError(404, message);
export const badRequest = (message: string): HttpError => new HttpError(400, message);
export const tooManyRequests = (message: string): HttpError => new HttpError(429, message);
