import { CreateSchema, createSchema } from './schema/create-schema.js';
import { UpdateSchema, updateSchema } from './schema/update-schema.js';
import { InputInvalid } from '../exceptions/input-invalid.js';
import { Unauthorized } from '../exceptions/unauthorized.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { HelperService } from '../helper/helper.service.js';
import { Request, Response, Router } from 'hyper-express';
import { NotFound } from '../exceptions/not-found.js';
import { AuthService } from '../auth/auth.service.js';
import { readSchema } from './schema/read-schema.js';
import { HyperEx } from '../hyper-ex/hyper-ex.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConversationController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly helperService: HelperService,
    private readonly authService: AuthService,
    private readonly hyperEx: HyperEx,
  ) {
    const router = new Router();
    hyperEx.use('/conversations', router);

    router.post('/', this.create.bind(this));
    router.get('/:id?', this.read.bind(this));
    router.put('/:id', this.update.bind(this));
    router.delete('/:id', this.delete.bind(this));
  }

  async create(req: Request, res: Response) {
    let input: CreateSchema;

    try {
      input = await createSchema.validateAsync(await req.json());
    } catch (e) {
      throw new InputInvalid('Input validation failed', e.details);
    }

    const uid = await this.authService.authenticateReq(req);

    if (input.type === 'dm') {
      if (input.members.includes(uid)) {
        throw new Unauthorized(
          `Sorry, you can't start a conversation with yourself.`,
        );
      }

      // Fetch every conversation between both users
      const existingMembers = await this.prismaService.members.findMany({
        where: {
          user_id: uid,
          conversation: {
            type: 'dm',
            members: {
              every: {
                user_id: input.members[0],
              },
            },
          },
        },
        select: {
          user_id: true,
          active: true,
          conversation: {
            include: {
              members: {
                where: {
                  user_id: input.members[0],
                },
                select: {
                  user_id: true,
                  active: true,
                },
              },
            },
          },
        },
      });

      for (const member of existingMembers) {
        const usable = member.active || member.conversation.members[0].active;

        if (usable) {
          await this.prismaService.members.updateMany({
            where: {
              conversation_id: member.conversation.id,
            },
            data: {
              active: true,
            },
          });

          const inactiveMember = !member.active
            ? member
            : member.conversation.members[0];

          const topic = (inactiveMember.user_id * -1).toString();
          this.hyperEx.uws_instance.publish(
            topic,
            JSON.stringify([
              topic,
              { uid, type: 'conversation', data: member.conversation },
            ]),
          );

          return res.json(member.conversation);
        }
      }

      input.members.push(uid);
    } else {
      // TODO: Check permissions
    }

    const conversation = await this.prismaService.conversations.create({
      data: {
        type: input.type,
        name: input.name,
        members: {
          createMany: {
            data: input.members.map((member) => ({
              user_id: member,
            })),
            skipDuplicates: true,
          },
        },
      },
    });

    res.json(conversation);

    for (const member of input.members) {
      const topic = member * -1;
      this.hyperEx.uws_instance.publish(
        topic.toString(),
        JSON.stringify([
          topic,
          { uid, type: 'conversation', data: conversation },
        ]),
      );
    }
  }

  async read(req: Request, res: Response) {
    const uid = await this.authService.authenticateReq(req);

    // TODO: Check permissions

    if (req.params.id) {
      const conversation = await this.prismaService.conversations.findFirst({
        where: {
          id: Number(req.params.id),
        },
      });

      if (!conversation) {
        throw new NotFound();
      }

      return res.json(conversation);
    }

    const query = await this.helperService.validateReqWithPagination(
      req,
      readSchema,
    );

    const aggregateResult = await this.prismaService.conversations.aggregate({
      where: {
        members:
          query.scope === 'local'
            ? {
                some: {
                  user_id: uid,
                },
              }
            : undefined,
      },
      _count: true,
    });
    const activities = await this.prismaService.activities.findMany({
      where: {
        conversation: {
          type: {
            in: query.type,
          },
        },
        user_id: query.scope === 'local' ? uid : undefined,
      },
      select: {
        id: true,
        conversation: true,
      },
      distinct: ['conversation_id'],
      orderBy: {
        created_at: 'desc',
      },
      skip: query.page === 1 ? 0 : query.limit * query.page,
      take: query.limit,
    });

    res.json({
      count: aggregateResult._count,
      pages: Math.ceil(aggregateResult._count / query.limit),
      data: activities.map((activity) => activity.conversation),
    });
  }

  async update(req: Request, res: Response) {
    let input: UpdateSchema;

    try {
      input = await updateSchema.validateAsync(req.body);
    } catch (e) {
      throw new InputInvalid('Input validation failed', e.details);
    }

    const conversation = await this.prismaService.conversations.findFirst({
      where: {
        id: Number(req.params.id),
        type: 'group',
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      throw new NotFound();
    }

    const uid = await this.authService.authenticateReq(req);
    // TODO: Check permissions

    const conversationUpdated = await this.prismaService.conversations.update({
      where: {
        id: conversation.id,
      },
      data: input,
    });

    res.json(conversationUpdated);

    this.hyperEx.uws_instance.publish(
      conversationUpdated.id.toString(),
      JSON.stringify([
        conversationUpdated.id.toString(),
        {
          uid,
          type: 'conversation',
          data: conversationUpdated,
          action: 'update',
        },
      ]),
    );
  }

  async delete(req: Request, res: Response) {
    const conversation = await this.prismaService.conversations.findFirst({
      where: {
        id: Number(req.params.id),
      },
      select: {
        id: true,
        type: true,
        members: {
          select: {
            user_id: true,
            active: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFound();
    }

    const uid = await this.authService.authenticateReq(req);

    if (conversation.type === 'dm') {
      // It's a dm

      const member = conversation.members.find(
        (member) => member.user_id === uid && member.active,
      );

      if (!member) {
        throw new Unauthorized();
      }

      // User is in the conversation

      await this.prismaService.members.update({
        where: {
          conversation_id_user_id: {
            conversation_id: conversation.id,
            user_id: member.user_id,
          },
        },
        data: {
          active: false,
        },
      });

      // TODO: Create activity
      // TODO: Broadcast this event to the conversation members

      return res.send('');
    }

    // TODO: Check permissions

    // Deactivate everybody rather than deleting the conversation
    await this.prismaService.members.updateMany({
      where: {
        conversation_id: conversation.id,
      },
      data: {
        active: false,
      },
    });

    res.json('');
  }
}
