import { BaseException } from './base-exception.js';

export class Unauthorized extends BaseException {
  constructor(message = 'You are not authorized to make this request') {
    super(message, 'UNAUTHORIZED', 401);
  }
}
