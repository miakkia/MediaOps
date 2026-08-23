export type RequestProviderErrorCode =
  | 'configuration'
  | 'authentication'
  | 'forbidden'
  | 'not_found'
  | 'rate_limited'
  | 'timeout'
  | 'unavailable'
  | 'invalid_response'
  | 'request_failed';

export class RequestProviderError extends Error {
  readonly code: RequestProviderErrorCode;
  readonly status: number | undefined;

  constructor(
    message: string,
    code: RequestProviderErrorCode,
    status?: number,
  ) {
    super(message);
    this.name = 'RequestProviderError';
    this.code = code;
    this.status = status;
  }
}
