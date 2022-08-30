import { getEnv, getEnvNum } from '../get-env.js';

export default function () {
  return {
    env: getEnv('NODE_ENV') as nodeEnv,
    host: getEnv('HOST', '127.0.0.1'),
    port: getEnvNum('PORT', 7000),
    origin: getEnv('ORIGIN', 'localhost'),
    authHook: getEnv('AUTH_HOOK'),
  };
}

type nodeEnv = 'development' | 'production' | 'test';
