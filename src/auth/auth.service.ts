import { Unauthorized } from '../exceptions/unauthorized.js';
import { Config } from '../config/config.js';
import { Injectable } from '@nestjs/common';
import got from 'got';

@Injectable()
export class AuthService {
  constructor(private readonly config: Config) {}

  async authorize(token: string): Promise<number> {
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
      throw new Unauthorized('You are not authorized to make this request');
    }
  }
}
