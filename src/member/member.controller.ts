import { CreateSchema, createSchema } from './schema/create-schema.js';
import { UpdateSchema, updateSchema } from './schema/update-schema.js';
import { InputInvalid } from '../exceptions/input-invalid.js';
import { Unauthorized } from '../exceptions/unauthorized.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { HelperService } from '../helper/helper.service.js';
import { Request, Response, Router } from 'hyper-express';
import { BadRequest } from '../exceptions/bad-request.js';
import { NotFound } from '../exceptions/not-found.js';
import { AuthService } from '../auth/auth.service.js';
import { readSchema } from './schema/read-schema.js';
import { HyperEx } from '../hyper-ex/hyper-ex.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MemberController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly helperService: HelperService,
    private readonly authService: AuthService,
    private readonly hyperEx: HyperEx,
  ) {
    const router = new Router();
    hyperEx.use('/members', router);

    router.post('/:conversationId', this.create.bind(this));
    router.get('/:conversationId/:userId?', this.read.bind(this));
    router.put('/:conversationId/:userId', this.update.bind(this));
    router.delete('/:conversationId/:userId', this.delete.bind(this));
  }

  private readonly MAX_MEMBERS_PER_CONVERSATION = 200;

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

    const conversation = await this.prismaService.conversations.findFirst({
      where: {
        id: Number(req.params.conversationId),
        type: 'group',
      },
      select: {
        _count: {
          select: {
            members: true,
          },
        },
        members: {
          where: {
            user_id: input.userId,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFound();
    }

    if (conversation._count.members >= this.MAX_MEMBERS_PER_CONVERSATION) {
      throw new BadRequest(
        `The server does not support more than ${this.MAX_MEMBERS_PER_CONVERSATION} members per conversation`,
      );
    }

    if (conversation.members[0]?.active) {
      throw new BadRequest('User is already a member of this conversation');
    }

    // TODO: Check permissions

    const member = await this.prismaService.members.upsert({
      where: {
        conversation_id_user_id: {
          conversation_id: Number(req.params.conversationId),
          user_id: input.userId,
        },
      },
      create: {
        conversation_id: Number(req.params.conversationId),
        user_id: input.userId,
        active: true,
      },
      update: {
        active: true,
      },
    });

    // TODO: Create activity

    res.json(member);
  }

  async read(req: Request, res: Response) {
    const conversationId = Number(req.params.conversationId);
    const memberId = Number(req.params.userId);

    if (isNaN(conversationId) || isNaN(memberId)) {
      throw new InputInvalid();
    }

    const uid = await this.authService.authenticateReq(req);

    if (memberId) {
      const member = await this.prismaService.members.findFirst({
        where: {
          conversation_id: Number(req.params.conversationId),
          user_id: Number(req.params.user_id),
        },
      });

      if (!member) {
        throw new NotFound();
      }

      return res.json(member);
    }

    // TODO: Check permissions

    const query = await this.helperService.validateReqWithPagination(
      req,
      readSchema,
    );

    const aggregateResult = await this.prismaService.members.aggregate({
      where: {
        conversation_id: Number(req.params.conversationId),
        active:
          query.type === 'active'
            ? true
            : query.type === 'inactive'
            ? false
            : undefined,
      },
      _count: true,
    });
    const members = await this.prismaService.members.findMany({
      where: {
        conversation_id: Number(req.params.conversationId),
        active:
          query.type === 'active'
            ? true
            : query.type === 'inactive'
            ? false
            : undefined,
      },
      orderBy: {
        last_activity_seen_id: 'desc',
      },
      skip: query.page === 1 ? 0 : query.limit * query.page,
      take: query.limit,
    });

    res.json({
      count: aggregateResult._count,
      pages: Math.ceil(aggregateResult._count / query.limit),
      data: members,
    });
  }

  async update(req: Request, res: Response) {
    const conversationId = Number(req.params.conversationId);
    const memberId = Number(req.params.userId);

    if (isNaN(conversationId) || isNaN(memberId)) {
      throw new InputInvalid();
    }

    let input: UpdateSchema;

    try {
      input = await updateSchema.validateAsync(req.body, {
        stripUnknown: true,
        convert: true,
      });
    } catch (e) {
      throw new InputInvalid('Input validation failed', e.details);
    }

    const uid = await this.authService.authenticateReq(req);

    const member = await this.prismaService.members.findFirst({
      where: {
        conversation_id: conversationId,
        active: true,
        user_id: memberId,
      },
      select: {
        active: true,
      },
    });
    const activity = await this.prismaService.activities.findFirst({
      where: {
        conversation_id: conversationId,
        id: input.lastActivitySeenId,
      },
      select: {
        id: true,
      },
    });

    if (!member || !activity) {
      throw new NotFound();
    }

    if (uid === memberId) {
      await this.prismaService.members.update({
        where: {
          conversation_id_user_id: {
            user_id: uid,
            conversation_id: conversationId,
          },
        },
        data: {
          last_activity_seen_id: input.lastActivitySeenId,
        },
      });

      return res.send('');
    }

    // TODO: Check permissions
    // TODO: Broadcast this event
  }

  async delete(req: Request, res: Response) {
    const conversationId = Number(req.params.conversationId);
    const memberId = Number(req.params.userId);

    if (isNaN(conversationId) || isNaN(memberId)) {
      throw new InputInvalid();
    }

    const uid = await this.authService.authenticateReq(req);

    const member = await this.prismaService.members.findFirst({
      where: {
        conversation_id: conversationId,
        user_id: memberId,
      },
      select: {
        active: true,
        conversation: true,
      },
    });

    if (!member) {
      throw new NotFound();
    }

    if (member.conversation.type === 'dm' && uid !== memberId) {
      throw new Unauthorized();
    }

    if (uid === memberId) {
      await this.prismaService.members.update({
        where: {
          conversation_id_user_id: {
            conversation_id: conversationId,
            user_id: memberId,
          },
        },
        data: {
          active: false,
        },
      });
      return res.send('');
    }

    // TODO: Check permissions
  }
}
