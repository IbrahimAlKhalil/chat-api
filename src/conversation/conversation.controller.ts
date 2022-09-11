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
    router.get('/', this.read.bind(this));
    router.get('/:id', this.read.bind(this));
    router.put('/:id', this.update.bind(this));
    router.delete('/:id', this.delete.bind(this));
  }

  async create(req: Request, res: Response) {
    let input: CreateSchema;

    try {
      input = await createSchema.validateAsync(await req.json(), {
        stripUnknown: true,
        convert: true,
      });
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

      // Don't create new conversation if an old one can be used
      for (const member of existingMembers) {
        // For an old conversation to be usable, at least one user must be active
        const usable = member.active || member.conversation.members[0].active;

        if (usable) {
          // Found a usable conversation
          await this.prismaService.members.updateMany({
            where: {
              conversation_id: member.conversation.id,
            },
            data: {
              active: true,
            },
          });

          return res.json(member.conversation);
        }
      }

      input.members.push(uid);
    } else {
      // It's a group conversation
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
  }

  async read(req: Request, res: Response) {
    const uid = await this.authService.authenticateReq(req);

    // TODO: Check permissions

    if (req.params?.id) {
      const id = Number(req.params?.id);

      if (isNaN(id)) {
        throw new InputInvalid();
      }

      const conversation = await this.prismaService.conversations.findFirst({
        where: { id },
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

    const conversations = await this.prismaService.conversations.findMany({
      where: {
        type: {
          in: query.type,
        },
        members:
          query.scope === 'local'
            ? {
                some: {
                  user_id: uid,
                },
              }
            : undefined,
      },
      orderBy: {
        last_active_at: 'desc',
      },
      skip: query.page === 1 ? 0 : query.limit * query.page,
      take: query.limit,
    });

    res.json(conversations);
  }

  async update(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      throw new InputInvalid();
    }

    let input: UpdateSchema;

    try {
      input = await updateSchema.validateAsync(req.body);
    } catch (e) {
      throw new InputInvalid('Input validation failed', e.details);
    }

    const conversation = await this.prismaService.conversations.findFirst({
      where: {
        type: 'group',
        id,
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
  }

  async delete(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      throw new InputInvalid();
    }

    const conversation = await this.prismaService.conversations.findFirst({
      where: { id },
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

    res.send('');
  }
}
