# Profile Module

## Overview

The Profile module manages extended user information including bio, avatar, website, location, and birth date. It provides a one-to-one relationship with the User entity.

## Entity: Profile

### Fields

- **id**: UUID primary key
- **bio**: Optional text field for user biography (max 1000 characters)
- **avatarUrl**: Optional HTTPS URL for user avatar image (max 255 characters)
- **website**: Optional URL for user's personal website (max 255 characters)
- **location**: Optional location string (max 100 characters)
- **birthDate**: Optional date of birth (user must be at least 13 years old)
- **createdAt**: Timestamp when profile was created
- **updatedAt**: Timestamp when profile was last updated
- **userId**: Foreign key to User entity (unique)

### Relations

- **user**: One-to-one relationship with User entity (cascade delete enabled)

### Indexes

- **userId**: Unique index for one-to-one relationship

### Validation Rules

- bio: Optional, maximum 1000 characters
- avatarUrl: Optional, valid URL format, HTTPS only, maximum 255 characters
- website: Optional, valid URL format, maximum 255 characters
- location: Optional, 1-100 characters
- birthDate: Optional, valid date, must be in the past, user must be at least 13 years old
- userId: Valid UUID, must reference existing user, unique

### GraphQL Schema

The Profile entity is exposed as a GraphQL ObjectType with all fields available for querying. The `user` field resolver allows fetching the associated User entity.

## Requirements

This module satisfies the following requirements:

- **Requirement 7.1**: Profile creation with userId link
- **Requirement 7.7**: Cascade deletion when user is deleted
