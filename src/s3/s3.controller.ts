import { PrismaService } from '../prisma/prisma.service.js';
import { GetObjectCommandInput } from '@aws-sdk/client-s3';
import { AuthService } from '../auth/auth.service.js';
import { NotFound } from '../exceptions/not-found.js';
import { HyperEx } from '../hyper-ex/hyper-ex.js';
import { Request, Response } from 'hyper-express';
import { Config } from '../config/config.js';
import { Injectable } from '@nestjs/common';
import { S3Service } from './s3.service.js';
import { Readable } from 'stream';

@Injectable()
export class S3Controller {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly authService: AuthService,
    private readonly s3Service: S3Service,
    private readonly hyperEx: HyperEx,
    private readonly config: Config,
  ) {
    hyperEx.get('/attachments/:id', this.get.bind(this));
  }

  async get(req: Request, res: Response) {
    const userId = await this.authService.authenticateReq(req);

    const attachment = await this.prismaService.attachments.findFirst({
      where: {
        id: req.params.id,
        message: {
          conversation: {
            members: {
              some: {
                user_id: userId,
              },
            },
          },
        },
      },
      select: {
        id: true,
        mime_type: {
          select: {
            mime_type: true,
            extension: true,
          },
        },
      },
    });

    if (!attachment) {
      throw new NotFound();
    }

    const getObjectInput: GetObjectCommandInput = {
      Key: `${this.config.s3.prefix}${req.params.id}`,
      Bucket: this.config.s3.bucket,
    };

    const object = await this.s3Service.getObject(getObjectInput);

    if (!object.Body) {
      return;
    }

    res.status(200).setHeaders({
      ETag: object.ETag,
      'Content-Disposition': `${
        'download' in req.query ? 'attachment' : 'inline'
      }; filename=${attachment.id}.${attachment.mime_type.extension}`,
      'Content-Type': attachment.mime_type.mime_type,
      'Last-Modified': `${object.LastModified?.toUTCString()}`,
      'Cache-Control': `private, max-age=2592000, immutable`,
    });

    // TODO: Support range header

    if (object.Body instanceof Blob) {
      return res.send(Buffer.from(await object.Body.arrayBuffer()));
    }

    res.stream(object.Body as Readable, object.ContentLength);
  }
}
