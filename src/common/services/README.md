# Common Services

This directory contains shared services used across the application.

## JWT Token Service

The `JwtTokenService` handles JWT token generation and verification for authentication.

### Features

- **Access Token Generation**: Short-lived tokens (1 hour) for API authentication
- **Refresh Token Generation**: Long-lived tokens (7 days) for obtaining new access tokens
- **Token Verification**: Validates token signature and expiration
- **Payload Extraction**: Decodes token payload with user information
- **Security Validation**: Ensures JWT secrets are at least 256 bits (32 characters)

### Usage

#### Injecting the Service

```typescript
import { JwtTokenService } from '@common/services/jwt.service';

@Injectable()
export class AuthService {
  constructor(private readonly jwtTokenService: JwtTokenService) {}
}
```

#### Generating Tokens

```typescript
// Generate both access and refresh tokens
const { accessToken, refreshToken } = await this.jwtTokenService.generateTokens(
  userId,
  email,
  roles,
);

// Or generate individually
const accessToken = await this.jwtTokenService.generateAccessToken({
  sub: userId,
  email,
  roles,
});

const refreshToken = await this.jwtTokenService.generateRefreshToken({
  sub: userId,
  email,
  roles,
});
```

#### Verifying Tokens

```typescript
// Verify access token
try {
  const payload = await this.jwtTokenService.verifyAccessToken(accessToken);
  console.log(payload.sub); // user ID
  console.log(payload.email); // user email
  console.log(payload.roles); // user roles
} catch (error) {
  // Token is invalid or expired
}

// Verify refresh token
try {
  const payload = await this.jwtTokenService.verifyRefreshToken(refreshToken);
  // Use payload to generate new access token
} catch (error) {
  // Refresh token is invalid or expired
}
```

#### Decoding Tokens (Without Verification)

```typescript
// Decode token without verifying signature
// WARNING: Only use when you don't need to validate the token
const payload = this.jwtTokenService.decodeToken(token);
if (payload) {
  console.log(payload.sub);
}
```

#### Getting Token Expiration Times

```typescript
const accessExpiration = this.jwtTokenService.getAccessTokenExpiresIn(); // 3600 seconds
const refreshExpiration = this.jwtTokenService.getRefreshTokenExpiresIn(); // 604800 seconds
```

### Configuration

The service requires the following environment variables:

```bash
# JWT Configuration
JWT_SECRET=your-secret-key-at-least-32-characters-long
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret-key-at-least-32-chars
JWT_REFRESH_EXPIRES_IN=7d
```

### Token Payload Structure

```typescript
interface JWTPayload {
  sub: string;        // User ID (UUID)
  email: string;      // User email
  roles: string[];    // User roles for authorization
  iat?: number;       // Issued at timestamp (auto-added)
  exp?: number;       // Expiration timestamp (auto-added)
}
```

### Security Considerations

1. **Secret Length**: Both `JWT_SECRET` and `JWT_REFRESH_SECRET` must be at least 256 bits (32 characters) for security
2. **Different Secrets**: Access and refresh tokens use different secrets to prevent token substitution attacks
3. **Token Expiration**: Access tokens expire after 1 hour, refresh tokens after 7 days
4. **Signature Verification**: Always verify tokens before trusting their contents
5. **HTTPS Only**: Tokens should only be transmitted over HTTPS in production

### Requirements Satisfied

- **2.5**: Generate JWT access token with 1-hour expiration
- **2.6**: Generate JWT refresh token with 7-day expiration
- **2.7**: Verify JWT signature using configured JWT_SECRET
- **2.8**: Check token has not expired
- **15.3**: Sign tokens with configured JWT_SECRET
- **15.4**: Validate JWT_SECRET is at least 256 bits

### Testing

The service includes comprehensive unit tests and integration tests:

```bash
# Run unit tests
npm test -- src/common/services/jwt.service.spec.ts

# Run integration tests
npm test -- src/common/services/jwt.service.integration.spec.ts
```

### Error Handling

The service throws `UnauthorizedException` when:
- Token signature is invalid
- Token has expired
- Token format is malformed

Always wrap token verification in try-catch blocks to handle these errors appropriately.
