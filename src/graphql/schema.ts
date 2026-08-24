import { createSchema } from "graphql-yoga";
import { resolvers } from "./resolvers";

export const typeDefs = /* GraphQL */ `
  type Folder {
    id: ID!
    name: String!
    createdAt: String!
    updatedAt: String!
    bookmarks(
      first: Int = 10
      after: String
      search: String
    ): BookmarkConnection!
  }

  type Bookmark {
    id: ID!
    title: String!
    url: String!
    folderId: ID!
    createdAt: String!
    updatedAt: String!
  }

  type BookmarkEdge {
    node: Bookmark!
    cursor: String!
  }

  type BookmarkConnection {
    edges: [BookmarkEdge!]!
    pageInfo: PageInfo!
  }

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  type Query {
    folder(id: ID!): Folder
    bookmarks(
      first: Int = 10
      after: String
      search: String
      folderId: ID
    ): BookmarkConnection!
  }

  input CreateFolderInput {
    name: String!
  }

  input UpdateFolderInput {
    id: ID!
    name: String!
  }

  input CreateBookmarkInput {
    title: String!
    url: String!
    folderId: ID!
  }

  input UpdateBookmarkInput {
    id: ID!
    title: String
    url: String
  }

  type Mutation {
    createFolder(input: CreateFolderInput!): Folder!
    updateFolder(input: UpdateFolderInput!): Folder!
    deleteFolder(id: ID!): Boolean!

    createBookmark(input: CreateBookmarkInput!): Bookmark!
    updateBookmark(input: UpdateBookmarkInput!): Bookmark!
    deleteBookmark(id: ID!): Boolean!

    moveBookmark(
      bookmarkId: ID!
      folderId: ID!
    ): Bookmark!
  }
`;

export const schema = createSchema({
  typeDefs,
  resolvers,
});