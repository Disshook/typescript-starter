# Comment Module

This module handles comment functionality for the NestJS GraphQL API, including nested replies support.

## Entity: Comment

The Comment entity represents user comments on posts with support for nested replies (threaded comments).

### Fields

- **id**: UUID primary key
- **content**: Text content of the comment (1-5000 characters)
- **isEdited**: Boolean flag indicating if the comment has been edited
- **createdAt**: Timestamp when the comment was created
- **updatedAt**: Timestamp when the comment was last updated
- **authorId**: UUID foreign key referencing the User who created the comment
- **postId**: UUID foreign key referencing the Post being commented on
- **parentId**: Optional UUID foreign key for nested replies (references another Comment)

### Relations

- **author**: Many-to-one relationship with User entity (cascade delete enabled)
- **post**: Many-to-one relationship with Post entity (cascade delete enabled)
- **parent**: Self-referencing many-to-one relationship for nested replies (cascade delete enabled)
- **replies**: Self-referencing one-to-many relationship for child comments

### Indexes

- **authorId**: Indexed for efficient author-based queries
- **postId**: Indexed for efficient post-based queries
- **parentId**: Indexed for efficient nested reply queries

### Cascade Deletion

- When a User is deleted, all their comments are automatically deleted
- When a Post is deleted, all comments on that post are automatically deleted
- When a parent Comment is deleted, all reply comments are automatically deleted

### Self-Referencing Relations

The Comment entity uses self-referencing relations to support nested replies:

```typescript
// Parent comment
@ManyToOne(() => Comment, (comment) => comment.replies, {
  nullable: true,
  onDelete: 'CASCADE',
})
parent?: Comment;

// Child comments (replies)
@OneToMany(() => Comment, (comment) => comment.parent)
replies: Comment[];
```

This allows for threaded discussions where comments can have replies, and those replies can have their own replies, creating a tree structure.

### Validation Rules

- **content**: Required, 1-5000 characters, non-empty after trim
- **isEdited**: Automatically set to true when content is updated
- **authorId**: Must reference an existing user
- **postId**: Must reference an existing post
- **parentId**: Optional, must reference an existing comment, cannot create circular references

### GraphQL Schema

The entity is decorated with `@ObjectType()` and `@Field()` decorators to automatically generate the GraphQL schema using the code-first approach.

## Requirements Satisfied

- **6.1**: Comment entity with UUID primary key
- **6.2**: authorId set to authenticated user
- **6.5**: Self-referencing relation with parentId
- **6.6**: Nested replies support with parent/replies relations
- **6.9**: Cascade delete for reply comments
