import Joi from 'joi';

export interface CreateSchema {
  userId: number;
}

export const createSchema = Joi.object<CreateSchema>({
  userId: Joi.number().positive().required(),
});
