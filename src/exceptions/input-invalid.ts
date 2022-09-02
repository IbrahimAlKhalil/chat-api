import { BaseException } from './base-exception.js';

export class InputInvalid extends BaseException {
  constructor(
    message = 'Provided input is not valid',
    details?: Record<string, any>,
  ) {
    super(message, 'INPUT_INVALID', 400, details);
  }
}
