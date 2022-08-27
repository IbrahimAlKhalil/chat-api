export class BaseException extends Error {
  constructor(
    public message: string,
    public code: string,
    public readonly status: number,
    public readonly details?: Record<string, any>,
  ) {
    super(message);
  }
}
