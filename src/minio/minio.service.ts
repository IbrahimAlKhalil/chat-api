import { Config } from '../config/config.js';
import { Injectable } from '@nestjs/common';
import { S3 } from '@aws-sdk/client-s3';

@Injectable()
export class MinioService extends S3 {
  constructor(private readonly _config: Config) {
    super({
      endpoint: {
        hostname: _config.minio.host,
        port: _config.minio.port,
        protocol: _config.app.env === 'development' ? 'http:' : 'https:',
        path: '/',
      },
      region: _config.minio.region,
      credentials: {
        accessKeyId: _config.minio.username,
        secretAccessKey: _config.minio.password,
      },
    });
  }
}
