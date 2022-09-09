import { InputInvalid } from '../exceptions/input-invalid.js';
import { Injectable } from '@nestjs/common';
import Joi, { ValidationResult } from 'joi';
import { Request } from 'hyper-express';

import {
  paginationSchema,
  PaginationSchema,
} from './schema/pagination-schema.js';

@Injectable()
export class HelperService {
  async validateReqWithPagination<
    T extends Joi.ObjectSchema = Joi.ObjectSchema,
  >(
    req: Request,
    schema: T,
  ): Promise<ReturnType<T['validate']>['value'] & PaginationSchema> {
    let query: Exclude<ValidationResult<T>['value'], undefined>;
    let pagination: PaginationSchema;

    try {
      query = await schema.validateAsync(req.query, {
        stripUnknown: true,
      });
    } catch (e) {
      throw new InputInvalid(e.message, e.details);
    }

    try {
      pagination = await paginationSchema.validateAsync(req.query, {
        stripUnknown: true,
      });
    } catch (e) {
      throw new InputInvalid(e.message, e.details);
    }

    if (!pagination.page) {
      pagination.page = 1;
    }

    if (!pagination.limit) {
      pagination.limit = 10;
    }

    return {
      ...query,
      ...pagination,
    };
  }
}
