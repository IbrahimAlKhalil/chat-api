import { conversations } from '../../prisma/client';
import { HyperEx } from '../hyper-ex/hyper-ex.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConversationService {
  constructor(private readonly hyperEx: HyperEx) {}

  emitCreateEvent(members: number | number[], conversation: conversations) {
    if (typeof members === 'number') {
      members = [members];
    }

    for (const id of members) {
      this.hyperEx.uws_instance.publish(
        id.toString(),
        JSON.stringify([
          id,
          {
            type: 'conversation',
            action: 'create',
            data: conversation,
          },
        ]),
      );
    }
  }

  emitDeleteEvent(members: number | number[], conversation: conversations) {
    if (typeof members === 'number') {
      members = [members];
    }

    for (const id of members) {
      this.hyperEx.uws_instance.publish(
        id.toString(),
        JSON.stringify([
          id,
          {
            type: 'conversation',
            action: 'delete',
            data: conversation,
          },
        ]),
      );
    }
  }

  emitUpdateEvent(conversation: conversations) {
    this.hyperEx.uws_instance.publish(
      conversation.id.toString(),
      JSON.stringify([
        conversation.id,
        {
          type: 'conversation',
          action: 'update',
          data: conversation,
        },
      ]),
    );
  }
}
