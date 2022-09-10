import Joi from 'joi';

interface ReadSchema {
  type: 'active' | 'inactive' | 'all';
}

export const readSchema = Joi.object<ReadSchema>({
  type: Joi.array().allow('active', 'inactive', 'all').default('active'),
});
