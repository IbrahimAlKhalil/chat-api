import { BaseException } from './base-exception.js';

export class InternalServerError extends BaseException {
  constructor(message: string) {
    super(message, 'INTERNAL_SERVER_ERROR', 500);
  }
}
