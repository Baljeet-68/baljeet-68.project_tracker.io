const { z } = require('zod');

function normalizeBaseUrl(value) {
  if (!value) return '';
  if (value === '/') return '';
  let out = String(value).trim();
  if (!out.startsWith('/')) out = `/${out}`;
  if (out.endsWith('/')) out = out.slice(0, -1);
  return out;
}

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  MODE: z.string().trim().toLowerCase().default('local'),
  BASE_URL: z.string().optional().default(''),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  PUBLIC_APP_ORIGIN: z.string().url('PUBLIC_APP_ORIGIN must be a valid URL'),

  DB_HOST: z.string().optional(),
  DB_PORT: z.coerce.number().int().positive().optional(),
  DB_USER: z.string().optional(),
  DB_PASS: z.string().optional(),
  DB_NAME: z.string().optional()
});

function loadConfig(processEnv = process.env) {
  const parsed = envSchema.safeParse(processEnv);
  if (!parsed.success) {
    const message = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n');
    const err = new Error(`Invalid environment configuration:\n${message}`);
    err.name = 'ConfigError';
    throw err;
  }

  const env = parsed.data;
  const MODE = env.MODE;
  const USE_LIVE_DB = MODE === 'live';
  const BASE_URL = normalizeBaseUrl(env.BASE_URL);

  if (USE_LIVE_DB) {
    const missing = ['DB_HOST', 'DB_USER', 'DB_NAME'].filter(k => !env[k]);
    if (missing.length) {
      const err = new Error(`Missing required DB configuration for MODE=live: ${missing.join(', ')}`);
      err.name = 'ConfigError';
      throw err;
    }
  }

  return {
    PORT: env.PORT,
    MODE,
    USE_LIVE_DB,
    BASE_URL,
    JWT_SECRET: env.JWT_SECRET,
    PUBLIC_APP_ORIGIN: env.PUBLIC_APP_ORIGIN.replace(/\/+$/, ''),
    DB: {
      host: env.DB_HOST || 'localhost',
      port: env.DB_PORT || 3306,
      user: env.DB_USER || 'root',
      password: env.DB_PASS || '',
      database: env.DB_NAME || 'project_tracker'
    }
  };
}

module.exports = { loadConfig };

