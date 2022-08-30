import { Unauthorized } from '../exceptions/unauthorized.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Config } from '../config/config.js';
import { Injectable } from '@nestjs/common';
import { Websocket } from '../types/uws';
import { Request } from 'hyper-express';
import got from 'got';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly config: Config,
  ) {}

  async authenticate(token: string): Promise<number> {
    try {
      const res = await got
        .get(`${this.config.app.authCheckURL}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .json<{ id: number }>();

      return res.id;
    } catch (e) {
      throw new Unauthorized();
    }
  }

  async authorize(uid: number, conversationId: number): Promise<boolean> {
    return !!(await this.prismaService.members.findFirst({
      where: {
        conversation_id: conversationId,
        user_id: uid,
      },
    }));
  }

  async authenticateReq(req: Request): Promise<number> {
    const header = req.header('authorization');

    if (!header) {
      throw new Unauthorized();
    }

    const token = header.split(' ')[1];

    if (token) {
      throw new Unauthorized();
    }

    return this.authenticate(token);
  }
}
