import { ConversationManager } from './conversation-manager';
import { ConversationRaw } from './types/conversation-raw';

export class Conversation {
  constructor(
    public readonly raw: ConversationRaw,
    private readonly manager: ConversationManager,
  ) {
  }
}