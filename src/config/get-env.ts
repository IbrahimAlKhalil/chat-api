export function getEnv<T = string>(name: string, _default?: T): T {
  const value = process.env[name];

  if (!value) {
    if (_default === undefined) {
      throw new Error(`Environment variable "${name}" is required`);
    }

    return _default;
  }

  return value as unknown as T;
}

export function getEnvNum<T = number>(name: string, _default?: T): T {
  const value = process.env[name];

  if (!value) {
    if (_default === undefined) {
      throw new Error(`Environment variable "${name}" is required`);
    }

    return _default;
  }

  const coerced = Number(value);

  if (isNaN(coerced)) {
    throw new Error(
      `Value "${value}" in environment variable "${name}" cannot be coerced to a number`,
    );
  }

  return coerced as unknown as T;
}
