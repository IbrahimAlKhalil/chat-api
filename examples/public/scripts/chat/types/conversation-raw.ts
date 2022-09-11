import { ConversationType } from './conversation-type';

export interface ConversationRaw<Type extends ConversationType = ConversationType> {
  id: number;
  type: ConversationType;
  name: Type extends 'dm' ? null : string;
  last_active_at: string;
  created_at: string;
}