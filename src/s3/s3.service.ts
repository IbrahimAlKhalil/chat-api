import { PayloadTooLarge } from '../exceptions/payload-too-large.js';
import { InputInvalid } from '../exceptions/input-invalid.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { attachments, Prisma } from '../../prisma/client';
import { SaveOptions } from './types/save-options';
import { Config } from '../config/config.js';
import { Injectable } from '@nestjs/common';
import { fileTypeStream } from 'file-type';
import { S3 } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class S3Service extends S3 {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly _config: Config,
  ) {
    super({
      endpoint: {
        hostname: _config.s3.host,
        port: _config.s3.port,
        protocol: _config.app.env === 'development' ? 'http:' : 'https:',
        path: '/',
      },
      region: _config.s3.region,
      credentials: {
        accessKeyId: _config.s3.username,
        secretAccessKey: _config.s3.password,
      },
    });
  }

  async save(
    file: Readable,
    messageId: number,
    options: SaveOptions = {},
  ): Promise<attachments> {
    const fileWithMime = await fileTypeStream(file);

    if (!fileWithMime.fileType) {
      fileWithMime.destroy();
      throw new InputInvalid(`Cannot determine file type from input`);
    }

    const mimeType = await this.prismaService.mime_types.findUnique({
      where: {
        extension: fileWithMime.fileType.ext,
      },
      select: {
        id: true,
      },
    });

    if (!mimeType) {
      fileWithMime.destroy();
      throw new InputInvalid(
        `File type "${fileWithMime.fileType.mime}" is not supported`,
      );
    }

    file = fileWithMime;

    return this.prismaService.$transaction(async (trx) => {
      if (typeof options.size === 'number') {
        const maxSize = options.size;
        let size = 0;

        file
          .on('data', (chunk) => {
            if ((size += chunk.length) > maxSize) {
              file.destroy(
                new PayloadTooLarge(
                  `File cannot be larger than ${maxSize} bytes`,
                ),
              );
            }
          })
          .pause();
      }

      let transformerOrFile = file;

      if (options.transformer) {
        transformerOrFile = file.pipe(options.transformer);
      }

      const fileWithMime = await fileTypeStream(transformerOrFile);

      const mimeType = await this.prismaService.mime_types.findUnique({
        where: {
          extension: fileWithMime.fileType?.ext,
        },
      });

      if (!mimeType) {
        throw new Error('Transformer returned unknown Mime-Type');
      }

      const attachmentData: Prisma.attachmentsUncheckedCreateInput = {
        mime_type_id: mimeType.id,
        message_id: messageId,
      };

      const attachment = await trx.attachments.create({
        data: attachmentData,
      });

      await this.putObject({
        Key: `${this._config.s3.prefix}${attachment.id}`,
        Bucket: this._config.s3.bucket,
        Body: fileWithMime,
      });

      if (typeof options.beforeTrxClose === 'function') {
        await options.beforeTrxClose(trx, attachment);
      }

      return attachment;
    });
  }
}
