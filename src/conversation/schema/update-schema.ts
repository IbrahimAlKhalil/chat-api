import { conversation_type } from '../../../prisma/client';
import Joi from 'joi';

export interface UpdateSchema<
  Type extends conversation_type = conversation_type,
> {
  name?: string;
}

export const updateSchema = Joi.object<UpdateSchema>({
  name: Joi.string(),
});
