import { getEnv, getEnvNum } from '../get-env.js';

export default function () {
  return {
    host: getEnv('MINIO_HOST'),
    port: getEnvNum('MINIO_PORT'),
    username: getEnv('MINIO_ROOT_USER'),
    password: getEnv('MINIO_ROOT_PASSWORD'),
    bucket: getEnv('MINIO_BUCKET'),
    region: getEnv('MINIO_REGION'),
    useSSL:
      process.env.MINIO_USE_SSL === 'false'
        ? false
        : !!process.env.MINIO_USE_SSL,
  };
}
