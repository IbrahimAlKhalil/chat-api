import { attachments, Prisma } from '../../../prisma/client';
import { Duplex } from 'stream';

export interface SaveOptions {
  transformer?: Duplex;
  size?: number;
  beforeTrxClose?: (trx: Prisma.TransactionClient, file: attachments) => any;
}
