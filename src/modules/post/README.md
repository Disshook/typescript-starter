# Post Module

This module manages blog posts with status tracking, view counts, and relationships to users, comments, and tags.

## Entity: Post

The Post entity represents a blog post or article in the system.

### Fields

- **id**: UUID primary key
- **title**: Post title (1-255 characters)
- **content**: Post content (10-50000 characters)
- **slug**: URL-friendly unique identifier (lowercase, alphanumeric with hyphens)
- **status**: Post status (DRAFT, PUBLISHED, ARCHIVED)
- **viewCount**: Number of times the post has been viewed (default: 0)
- **publishedAt**: Timestamp when the post was published (nullable)
- **createdAt**: Timestamp when the post was created
- **updatedAt**: Timestamp when the post was last updated
- **authorId**: UUID of the user who created the post

### Relations

- **author**: Many-to-one relationship with User entity (cascade delete enabled)
- **comments**: One-to-many relationship with Comment entity
- **tags**: Many-to-many relationship with Tag entity (via post_tags junction table)

### Indexes

- **slug**: Unique index for fast lookups by slug
- **authorId**: Index for filtering posts by author
- **status**: Index for filtering posts by status
- **publishedAt**: Index for sorting by publication date

### PostStatus Enum

- **DRAFT**: Post is in draft state (default)
- **PUBLISHED**: Post is published and visible to users
- **ARCHIVED**: Post is archived and no longer active

## Validation Rules

- **title**: Required, 1-255 characters, non-empty after trim
- **content**: Required, minimum 10 characters, maximum 50000 characters
- **slug**: Required, unique, lowercase, alphanumeric with hyphens, 1-255 characters
- **status**: Must be valid PostStatus enum value
- **viewCount**: Non-negative integer
- **publishedAt**: Valid date, cannot be in the future
- **authorId**: Valid UUID, must reference existing user

## Requirements Satisfied

- 5.1: Generate unique UUID as post ID
- 5.2: Set status to DRAFT by default
- 5.3: Set viewCount to 0 by default
- 5.4: Set authorId to authenticated user's ID
