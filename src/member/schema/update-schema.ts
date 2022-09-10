import Joi from 'joi';

export interface UpdateSchema {
  lastActivitySeenId: number;
}

export const updateSchema = Joi.object<UpdateSchema>({
  lastActivitySeenId: Joi.number().required(),
});
