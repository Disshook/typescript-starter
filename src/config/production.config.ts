export const productionConfig = {
  // GraphQL
  graphql: {
    playground: false,
    introspection: false,
    debug: false,
  },

  // Logging
  logging: {
    level: 'error',
    format: 'json',
  },

  // CORS
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || [],
    credentials: true,
  },

  // Rate Limiting
  rateLimit: {
    ttl: 900, // 15 minutes
    limit: 100, // 100 requests per 15 minutes
  },

  // Security
  security: {
    helmet: true,
    hsts: true,
    hstsMaxAge: 31536000, // 1 year
  },
};
