import { ConversationRaw } from './conversation-raw';

export type RawCudEventType = 'conversation' | 'activity' | 'member';

export interface RawCudEvent<Type extends RawCudEventType = RawCudEventType> {
  action: 'create' | 'delete' | 'update';
  type: Type;
  data: Type extends 'conversation' ? ConversationRaw : unknown;
}