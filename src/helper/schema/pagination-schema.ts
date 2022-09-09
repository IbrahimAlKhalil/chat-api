import Joi from 'joi';

export interface PaginationSchema {
  page: number;
  limit: number;
}

export const paginationSchema = Joi.object<PaginationSchema>({
  page: Joi.number().positive().min(1),
  limit: Joi.number().positive().min(1),
});
