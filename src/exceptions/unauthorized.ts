import { BaseException } from './base-exception.js';

export class Unauthorized extends BaseException {
  constructor(message: string) {
    super(message, 'UNAUTHORIZED', 401);
  }
}
