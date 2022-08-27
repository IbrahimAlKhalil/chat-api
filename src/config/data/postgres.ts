import { getEnv } from '../get-env.js';

export default function () {
  return {
    url: getEnv('POSTGRES_URL'),
    publications: getEnv('POSTGRES_PUBLICATIONS', 'all_tables'),
  };
}
