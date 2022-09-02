import { getEnv, getEnvNum } from '../get-env.js';

export default function () {
  return {
    host: getEnv('S3_HOST'),
    port: getEnvNum('S3_PORT'),
    username: getEnv('S3_ROOT_USER'),
    password: getEnv('S3_ROOT_PASSWORD'),
    bucket: getEnv('S3_BUCKET'),
    prefix: getEnv('S3_PREFIX', ''),
    region: getEnv('S3_REGION'),
    useSSL:
      process.env.S3_USE_SSL === 'false' ? false : !!process.env.S3_USE_SSL,
  };
}
