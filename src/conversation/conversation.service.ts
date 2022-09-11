import { ReplicationEvent, Sql, SubscriptionHandle } from 'postgres';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { conversations } from '../../prisma/client';
import { HyperEx } from '../hyper-ex/hyper-ex.js';

@Injectable()
export class ConversationService implements OnModuleDestroy {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly hyperEx: HyperEx,
  ) {
    prismaService.postgres
      .subscribe('insert:conversations', this.handleInsert.bind(this))
      .then((sub) => {
        this.subscriptions.push(sub);
      });
    prismaService.postgres
      .subscribe('update:conversations', this.handleUpdate.bind(this))
      .then((sub) => {
        this.subscriptions.push(sub);
      });
    prismaService.postgres
      .subscribe('delete:conversations', this.handleUpdate.bind(this))
      .then((sub) => this.subscriptions.push(sub));
  }

  private readonly subscriptions: SubscriptionHandle[] = [];

  onModuleDestroy(): any {
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
  }

  async handleInsert(data: conversations) {
    const members = await this.prismaService.members.findMany({
      where: {
        conversation_id: data.id,
        active: true,
      },
      select: {
        user_id: true,
      },
    });

    for (const member of members) {
      const channel = member.user_id * -1;

      this.hyperEx.uws_instance.publish(
        channel.toString(),
        JSON.stringify([
          channel,
          { type: 'conversation', action: 'create', data },
        ]),
      );
    }
  }

  async handleUpdate(data: conversations, info: ReplicationEvent) {
    this.hyperEx.uws_instance.publish(
      data.id.toString(),
      JSON.stringify([
        data.id,
        { type: 'conversation', action: info.command, data },
      ]),
    );
  }
}
