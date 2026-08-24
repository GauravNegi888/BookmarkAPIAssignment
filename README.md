# Bookmark Manager API

A production-minded Bookmark Manager backend API built as a take-home assignment using **Bun, TypeScript, GraphQL Yoga, PostgreSQL, Prisma, and Docker Compose**.

The API allows users to organize bookmarks into folders, manage bookmarks, move bookmarks between folders, search bookmarks by title, and paginate results using cursor-based pagination.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Bun | JavaScript runtime, package manager, and test runner |
| TypeScript | Type-safe application development |
| GraphQL | API query and mutation layer |
| GraphQL Yoga | GraphQL server |
| PostgreSQL | Relational database |
| Prisma | ORM and database migrations |
| Docker Compose | Local PostgreSQL environment |
| Bun Test | Automated testing |

---

## Features

### Folders

- Create folders
- Update folders
- Delete folders
- Fetch a folder with its nested bookmarks

### Bookmarks

- Create bookmarks
- Update bookmarks
- Delete bookmarks
- Move bookmarks between folders
- Search bookmarks by title

### Pagination

- Cursor-based pagination
- `first` parameter for page size
- `after` cursor for fetching subsequent pages
- `hasNextPage` and `endCursor` page information

### Validation & Errors

- Required text field validation
- URL validation
- Resource existence validation
- Structured GraphQL error codes
- `BAD_USER_INPUT` validation errors
- `NOT_FOUND` resource errors

### Database & Infrastructure

- PostgreSQL
- Prisma ORM
- Prisma migrations
- Docker Compose PostgreSQL setup

### Testing

- Unit tests
- Integration tests
- Integration test against real PostgreSQL
- GraphQL operations tested through the actual schema and resolvers

---

# Architecture

The application follows a simple layered architecture:

```text
Client
  │
  │ GraphQL Query / Mutation
  ▼
GraphQL Yoga
  │
  ▼
GraphQL Schema
  │
  ▼
Resolvers
  │
  ▼
Prisma Client
  │
  ▼
PostgreSQL

GraphQL Mutation
      │
      ▼
createBookmark Resolver
      │
      ├── Validate title
      ├── Validate URL
      ├── Check folder exists
      │
      ▼
Prisma Client
      │
      ▼
PostgreSQL
      │
      ▼
Created Bookmark
  │
  ▲
Docker Compose

BookmarkAPIAssignment/
│
├── prisma/
│   ├── migrations/
│   │   ├── 20260824153158_init/
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   │
│   └── schema.prisma
│
├── src/
│   ├── graphql/
│   │   ├── resolvers.ts
│   │   └── schema.ts
│   │
│   ├── lib/
│   │   ├── errors.ts
│   │   └── prisma.ts
│   │
│   └── server.ts
│
├── tests/
│   ├── integration/
│   │   └── bookmark.test.ts
│   │
│   └── unit/
│       └── validation.test.ts
│
├── .env.example
├── .gitignore
├── bun.lock
├── docker-compose.yml
├── package.json
├── prisma.config.ts
├── README.md
└── tsconfig.json
