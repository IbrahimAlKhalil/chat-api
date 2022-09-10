import { conversation_type } from '../../../prisma/client';
import Joi from 'joi';

interface ReadSchema {
  scope: 'global' | 'local';
  type: conversation_type[];
}

export const readSchema = Joi.object<ReadSchema>({
  scope: Joi.string().allow('global', 'local').default('local'),
  type: Joi.array().allow('dm', 'group').max(2).default(['dm', 'group']),
});
