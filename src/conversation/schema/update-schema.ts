import Joi from 'joi';

export interface UpdateSchema {
  name?: string;
}

export const updateSchema = Joi.object<UpdateSchema>({
  name: Joi.string(),
});
