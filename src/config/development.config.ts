export const developmentConfig = {
  // GraphQL
  graphql: {
    playground: true,
    introspection: true,
    debug: true,
  },

  // Logging
  logging: {
    level: 'debug',
    format: 'pretty',
  },

  // CORS
  cors: {
    origins: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },

  // Rate Limiting
  rateLimit: {
    ttl: 900, // 15 minutes
    limit: 1000, // 1000 requests per 15 minutes
  },

  // Security
  security: {
    helmet: false, // Disabled in development for easier debugging
    hsts: false,
  },
};
