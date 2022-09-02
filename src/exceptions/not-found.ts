import { BaseException } from './base-exception.js';

export class NotFound extends BaseException {
  constructor(message = 'The resource you are looking for cannot be found') {
    super(message, 'NOT_FOUND', 404);
  }
}
