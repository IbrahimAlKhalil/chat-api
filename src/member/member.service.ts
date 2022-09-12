import { HyperEx } from '../hyper-ex/hyper-ex.js';
import { members } from '../../prisma/client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MemberService {
  constructor(private readonly hyperEx: HyperEx) {}

  emitEvent(
    conversationId: number,
    member: members,
    action: 'create' | 'update' | 'delete',
  ) {
    this.hyperEx.uws_instance.publish(
      conversationId.toString(),
      JSON.stringify([
        conversationId,
        {
          type: 'member',
          action,
          data: member,
        },
      ]),
    );
  }
}
