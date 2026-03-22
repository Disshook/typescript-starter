import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'mysql' as const,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging:
    process.env.NODE_ENV === 'development'
      ? ['error', 'warn', 'query']
      : ['error'],
  poolSize: process.env.NODE_ENV === 'production' ? 20 : 5,
  connectTimeout: 10000,
  charset: 'utf8mb4',
  timezone: 'Z',
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
}));
