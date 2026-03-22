import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
config({ path: join(__dirname, '../../', envFile) });

// TypeORM DataSource configuration
export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, './migrations/*{.ts,.js}')],
  synchronize: false,
  logging:
    process.env.NODE_ENV === 'development'
      ? ['error', 'warn', 'query']
      : ['error'],
  charset: 'utf8mb4',
  timezone: 'Z',
  extra: {
    connectionLimit: process.env.NODE_ENV === 'production' ? 20 : 5,
    connectTimeout: 10000,
    waitForConnections: true,
    queueLimit: 0,
  },
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
};

// Create and export DataSource instance for migrations
const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
