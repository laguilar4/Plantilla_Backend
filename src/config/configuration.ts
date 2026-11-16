export interface AppConfig {
  env: string;
  port: number;
  apiPrefix: string;
  apiVersion: string;
  corsOrigin: string;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  logging: boolean;
}

export interface ThrottleConfig {
  ttl: number;
  limit: number;
}

export interface SecurityConfig {
  apiKey: string;
}

export interface Configuration {
  app: AppConfig;
  database: DatabaseConfig;
  throttle: ThrottleConfig;
  security: SecurityConfig;
}

export default (): Configuration => ({
  app: {
    env: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    apiPrefix: process.env.API_PREFIX ?? 'api',
    apiVersion: process.env.API_VERSION ?? '1',
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
  },
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_DATABASE ?? 'api_base',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },
  security: {
    apiKey: process.env.API_KEY ?? '',
  },
});
