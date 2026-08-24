# Bookmark Manager API

A small Bookmark Manager backend API built with Bun, TypeScript, GraphQL Yoga, PostgreSQL, Prisma, and Docker Compose.

The API allows users to organize bookmarks into folders, search bookmarks by title, move bookmarks between folders, and paginate bookmarks using cursor-based pagination.

## Tech Stack

- Bun
- TypeScript
- GraphQL
- GraphQL Yoga
- PostgreSQL
- Prisma
- Docker Compose
- Bun Test

## Features

- Create, update, and delete folders
- Create, update, and delete bookmarks
- Move bookmarks between folders
- Fetch a folder with its nested bookmarks
- Search bookmarks by title
- Cursor-based pagination
- Input validation
- Meaningful GraphQL errors
- Prisma migrations
- Automated tests
- PostgreSQL integration test
- Docker-based PostgreSQL setup

## Project Structure

```text
src/
├── graphql/
│   ├── resolvers.ts
│   └── schema.ts
├── lib/
│   ├── errors.ts
│   └── prisma.ts
└── server.ts

prisma/
├── migrations/
└── schema.prisma

tests/
├── integration/
│   └── bookmark.test.ts
└── unit/
    └── validation.test.ts

docker-compose.yml
prisma.config.ts
package.json