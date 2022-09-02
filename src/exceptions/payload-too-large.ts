import { BaseException } from './base-exception.js';

export class PayloadTooLarge extends BaseException {
  constructor(message = 'Provided input is too large to process') {
    super(message, 'PAYLOAD_TOO_LARGE', 413);
  }
}
