import { conversation_type } from '../../../prisma/client';
import Joi from 'joi';

export interface CreateSchema<
  Type extends conversation_type = conversation_type,
> {
  type: Type;
  name: Type extends 'dm' ? undefined : string;
  members: number[];
}

export const createSchema = Joi.object<CreateSchema>({
  type: Joi.string().allow('dm', 'group').required(),
  name: Joi.when('type', {
    is: 'dm',
    then: Joi.forbidden(),
    otherwise: Joi.string().required(),
  }),
  members: Joi.when('type', {
    is: 'dm',
    then: Joi.array().items(Joi.number()).max(1).required(),
    otherwise: Joi.array().items(Joi.number()).required(),
  }),
});
