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
  ▲
  │
Docker Compose
```

### Request Flow

For example, when creating a bookmark:

```text
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
```

---

# Project Structure

```text
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
```

---

# Database Design

The application uses two main models:

```text
Folder
  │
  ├── Bookmark
  ├── Bookmark
  └── Bookmark
```

A folder can contain multiple bookmarks.

Each bookmark belongs to exactly one folder.

## Folder

```text
Folder
├── id
├── name
├── createdAt
└── updatedAt
```

## Bookmark

```text
Bookmark
├── id
├── title
├── url
├── folderId
├── createdAt
└── updatedAt
```

The relationship is:

```text
Folder 1 ──────────── * Bookmark
```

Deleting a folder also deletes its associated bookmarks using the configured database relationship behavior.

---

# Prerequisites

Before running the project, make sure you have:

- Bun
- Docker Desktop
- Git

You do not need PostgreSQL installed directly on your machine because PostgreSQL runs through Docker Compose.

---

# Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/GauravNegi888/BookmarkAPIAssignment.git
cd BookmarkAPIAssignment
```

## 2. Install Dependencies

```bash
bun install
```

---

# Environment Variables

Create a `.env` file in the project root.

Use the values from `.env.example`:

```env
DATABASE_URL="postgresql://bookmark_user:bookmark_password@localhost:5432/bookmark_manager"
```

The `.env` file is intentionally excluded from Git.

The repository contains `.env.example` so that the required environment variable is documented without exposing local configuration.

---

# Start PostgreSQL

Start the PostgreSQL container:

```bash
docker compose up -d
```

Check the container:

```bash
docker compose ps
```

You should see the PostgreSQL container running.

Example:

```text
NAME                IMAGE         STATUS
bookmark-postgres   postgres:17   Up
```

---

# Database Setup

The project uses Prisma migrations to manage the database schema.

For an existing database with committed migrations:

```bash
bun run prisma:deploy
```

Generate the Prisma Client:

```bash
bun run prisma:generate
```

For local development, a new migration can be created with:

```bash
bun run prisma:migrate --name <migration-name>
```

---

# Run the API

Start the server:

```bash
bun run dev
```

The GraphQL API will be available at:

```text
http://localhost:4000/graphql
```

You can open this endpoint in a browser and use the GraphQL interface to execute queries and mutations.

---

# GraphQL API

## Create a Folder

```graphql
mutation {
  createFolder(input: { name: "Development" }) {
    id
    name
    createdAt
  }
}
```

---

## Update a Folder

```graphql
mutation {
  updateFolder(
    input: {
      id: "FOLDER_ID"
      name: "Frontend Development"
    }
  ) {
    id
    name
  }
}
```

---

## Delete a Folder

```graphql
mutation {
  deleteFolder(id: "FOLDER_ID")
}
```

---

## Create a Bookmark

```graphql
mutation {
  createBookmark(
    input: {
      title: "Prisma Documentation"
      url: "https://www.prisma.io/docs"
      folderId: "FOLDER_ID"
    }
  ) {
    id
    title
    url
    folderId
  }
}
```

---

## Update a Bookmark

```graphql
mutation {
  updateBookmark(
    input: {
      id: "BOOKMARK_ID"
      title: "Updated Prisma Documentation"
      url: "https://www.prisma.io/docs"
    }
  ) {
    id
    title
    url
  }
}
```

---

## Delete a Bookmark

```graphql
mutation {
  deleteBookmark(id: "BOOKMARK_ID")
}
```

---

# Fetch a Folder with Nested Bookmarks

A folder can be fetched together with its bookmarks.

```graphql
query {
  folder(id: "FOLDER_ID") {
    id
    name
    createdAt
    updatedAt

    bookmarks(first: 10) {
      edges {
        node {
          id
          title
          url
          folderId
        }
        cursor
      }

      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
```

---

# Search Bookmarks

Bookmarks can be searched by title.

```graphql
query {
  bookmarks(search: "Prisma") {
    edges {
      node {
        id
        title
        url
      }
    }

    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

Search is case-insensitive.

---

# Move a Bookmark

A bookmark can be moved from one folder to another.

```graphql
mutation {
  moveBookmark(
    bookmarkId: "BOOKMARK_ID"
    folderId: "NEW_FOLDER_ID"
  ) {
    id
    title
    folderId
  }
}
```

---

# Cursor-Based Pagination

The bookmark list supports cursor-based pagination.

For example, the first request:

```graphql
query {
  bookmarks(first: 2) {
    edges {
      node {
        id
        title
        url
      }
      cursor
    }

    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

If `hasNextPage` is `true`, use `endCursor` as the `after` cursor for the next request:

```graphql
query {
  bookmarks(
    first: 2
    after: "END_CURSOR_FROM_PREVIOUS_REQUEST"
  ) {
    edges {
      node {
        id
        title
        url
      }
      cursor
    }

    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

The implementation fetches one additional record internally to determine whether another page exists.

---

# Validation

The API performs validation before writing data to PostgreSQL.

## Required Text Fields

Folder names and bookmark titles cannot be empty.

Example:

```graphql
mutation {
  createFolder(input: { name: "" }) {
    id
    name
  }
}
```

Returns an error similar to:

```json
{
  "errors": [
    {
      "message": "Folder name is required",
      "extensions": {
        "code": "BAD_USER_INPUT"
      }
    }
  ]
}
```

## URL Validation

Bookmark URLs are validated before creation or update.

Invalid URLs result in:

```text
BAD_USER_INPUT
```

---

# GraphQL Errors

Application errors use structured GraphQL error codes.

## Validation Error

```json
{
  "message": "Folder name is required",
  "extensions": {
    "code": "BAD_USER_INPUT"
  }
}
```

## Resource Not Found

```json
{
  "message": "Folder not found",
  "extensions": {
    "code": "NOT_FOUND"
  }
}
```

This allows clients to distinguish validation errors from missing resources.

---

# Testing

The project uses Bun's built-in test runner.

Run all tests:

```bash
bun test
```

Run TypeScript type checking:

```bash
bun run typecheck
```

The test suite covers the main application behavior, including:

- Folder creation
- Bookmark creation
- Nested folder/bookmark fetching
- Bookmark search
- Cursor pagination
- Bookmark updates
- Moving bookmarks
- Bookmark deletion
- Validation errors
- Not-found errors

The integration test executes GraphQL operations against the actual Prisma layer and a real PostgreSQL database.

---

# Development Commands

### Start PostgreSQL

```bash
docker compose up -d
```

### Stop PostgreSQL

```bash
docker compose down
```

### Start the API

```bash
bun run dev
```

### Run the API

```bash
bun run start
```

### Run Tests

```bash
bun run test
```

### Type Check

```bash
bun run typecheck
```

### Generate Prisma Client

```bash
bun run prisma:generate
```

### Apply Existing Migrations

```bash
bun run prisma:deploy
```

### Create a Development Migration

```bash
bun run prisma:migrate --name <migration-name>
```

---

# Production-Minded Decisions

The implementation intentionally focuses on the requirements of the assignment without adding unnecessary complexity.

## TypeScript

TypeScript provides compile-time checking for the API implementation and helps catch incorrect data handling before runtime.

## Prisma

Prisma provides type-safe database access and manages database schema changes through migrations.

## GraphQL Yoga

GraphQL Yoga provides the HTTP GraphQL server while keeping the API schema and resolver logic separate.

## PostgreSQL

PostgreSQL provides relational data modeling and is well suited for the folder-to-bookmark relationship.

## Docker Compose

PostgreSQL is containerized so the development database can be started consistently across environments.

## Cursor Pagination

Cursor-based pagination avoids relying on page numbers and allows the API to request the next set of records using a stable cursor.

## Validation

Validation is performed before database operations to prevent invalid application data from reaching PostgreSQL.

## Testing

The project includes an integration test against a real PostgreSQL database rather than relying entirely on mocks. This verifies that the GraphQL, resolver, Prisma, and database layers work together.

---

# Running the Project from Scratch

A new developer can set up the project using:

```bash
git clone https://github.com/GauravNegi888/BookmarkAPIAssignment.git
cd BookmarkAPIAssignment
bun install
```

Create `.env`:

```env
DATABASE_URL="postgresql://bookmark_user:bookmark_password@localhost:5432/bookmark_manager"
```

Start PostgreSQL:

```bash
docker compose up -d
```

Apply migrations:

```bash
bun run prisma:deploy
```

Generate Prisma Client:

```bash
bun run prisma:generate
```

Run type checking:

```bash
bun run typecheck
```

Run tests:

```bash
bun test
```

Start the API:

```bash
bun run dev
```

The API is then available at:

```text
http://localhost:4000/graphql
```

---

# Repository

GitHub:

https://github.com/GauravNegi888/BookmarkAPIAssignment

---

# Assignment

This project was implemented as a take-home assignment for a **Product Engineering Intern — Full Stack** position.

The implementation focuses on the requested functionality, maintainability, validation, testing, database migrations, documentation, and reproducible local development setup.
