import { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { attachments } from '../../../prisma/client';

export interface AttachmentWithMimeType extends Pick<attachments, 'id'> {
  mimeType: string;
  extension: string;
}

export interface GetObjectResult {
  attachment: AttachmentWithMimeType;
  object: GetObjectCommandOutput;
}
