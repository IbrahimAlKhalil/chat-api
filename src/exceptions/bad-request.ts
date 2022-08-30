import { BaseException } from './base-exception.js';

export class BadRequest extends BaseException {
  constructor(message: string) {
    super(message, 'BAD_REQUEST', 400);
  }
}
