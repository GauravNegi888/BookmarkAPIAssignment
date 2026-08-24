import { prisma } from "../lib/prisma";
import { AppError } from "../lib/errors";

function encodeCursor(id: string) {
  return Buffer.from(id).toString("base64");
}

function decodeCursor(cursor: string) {
  return Buffer.from(cursor, "base64").toString("utf-8");
}

function validateText(value: string, field: string) {
  if (!value || !value.trim()) {
    throw new AppError(`${field} is required`, "BAD_USER_INPUT");
  }

  return value.trim();
}

function validateUrl(url: string) {
  try {
    new URL(url);
  } catch {
    throw new AppError("Invalid URL", "BAD_USER_INPUT");
  }

  return url;
}

export const resolvers = {
  Query: {
    folder: async (_: unknown, { id }: { id: string }) => {
  const folder = await prisma.folder.findUnique({
    where: { id },
  });

  if (!folder) {
    throw new AppError("Folder not found", "NOT_FOUND");
  }

  return folder;
},

    bookmarks: async (
      _: unknown,
      {
        first = 10,
        after,
        search,
        folderId,
      }: {
        first?: number;
        after?: string;
        search?: string;
        folderId?: string;
      },
    ) => {
      const limit = Math.min(Math.max(first, 1), 50);

      const bookmarks = await prisma.bookmark.findMany({
        where: {
          ...(folderId ? { folderId } : {}),
          ...(search
            ? {
                title: {
                  contains: search,
                  mode: "insensitive",
                },
              }
            : {}),
        },

        orderBy: {
          id: "asc",
        },

        take: limit + 1,

        ...(after
          ? {
              cursor: {
                id: decodeCursor(after),
              },
              skip: 1,
            }
          : {}),
      });

      const hasNextPage = bookmarks.length > limit;
      const page = bookmarks.slice(0, limit);

      return {
        edges: page.map((bookmark) => ({
          node: bookmark,
          cursor: encodeCursor(bookmark.id),
        })),

        pageInfo: {
          hasNextPage,
          endCursor:
            page.length > 0 ? encodeCursor(page[page.length - 1]!.id) : null,
        },
      };
    },
  },

  Folder: {
    bookmarks: async (
      folder: { id: string },
      args: {
        first?: number;
        after?: string;
        search?: string;
      },
    ) => {
      return resolvers.Query.bookmarks(null, {
        ...args,
        folderId: folder.id,
      });
    },
  },

  Mutation: {
    createFolder: async (
      _: unknown,
      { input }: { input: { name: string } },
    ) => {
      const name = validateText(input.name, "Folder name");

      return prisma.folder.create({
        data: {
          name,
        },
      });
    },

    updateFolder: async (
      _: unknown,
      { input }: { input: { id: string; name: string } },
    ) => {
      const name = validateText(input.name, "Folder name");

      const existing = await prisma.folder.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!existing) {
        throw new AppError("Folder not found", "NOT_FOUND");
      }

      return prisma.folder.update({
        where: {
          id: input.id,
        },
        data: {
          name,
        },
      });
    },

    deleteFolder: async (_: unknown, { id }: { id: string }) => {
      const existing = await prisma.folder.findUnique({
        where: {
          id,
        },
      });

      if (!existing) {
        throw new AppError("Folder not found", "NOT_FOUND");
      }

      await prisma.folder.delete({
        where: {
          id,
        },
      });

      return true;
    },

    createBookmark: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          title: string;
          url: string;
          folderId: string;
        };
      },
    ) => {
      const title = validateText(input.title, "Title");
      const url = validateUrl(input.url);

      const folder = await prisma.folder.findUnique({
        where: {
          id: input.folderId,
        },
      });

      if (!folder) {
        throw new AppError("Folder not found", "NOT_FOUND");
      }

      return prisma.bookmark.create({
        data: {
          title,
          url,
          folderId: input.folderId,
        },
      });
    },

    updateBookmark: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          id: string;
          title?: string;
          url?: string;
        };
      },
    ) => {
      const existing = await prisma.bookmark.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!existing) {
        throw new AppError("Bookmark not found", "NOT_FOUND");
      }

      return prisma.bookmark.update({
        where: {
          id: input.id,
        },

        data: {
          ...(input.title !== undefined
            ? {
                title: validateText(input.title, "Title"),
              }
            : {}),

          ...(input.url !== undefined
            ? {
                url: validateUrl(input.url),
              }
            : {}),
        },
      });
    },

    deleteBookmark: async (_: unknown, { id }: { id: string }) => {
      const existing = await prisma.bookmark.findUnique({
        where: {
          id,
        },
      });

      if (!existing) {
        throw new AppError("Bookmark not found", "NOT_FOUND");
      }

      await prisma.bookmark.delete({
        where: {
          id,
        },
      });

      return true;
    },

    moveBookmark: async (
      _: unknown,
      {
        bookmarkId,
        folderId,
      }: {
        bookmarkId: string;
        folderId: string;
      },
    ) => {
      const [bookmark, folder] = await Promise.all([
        prisma.bookmark.findUnique({
          where: {
            id: bookmarkId,
          },
        }),

        prisma.folder.findUnique({
          where: {
            id: folderId,
          },
        }),
      ]);

      if (!bookmark) {
        throw new AppError("Bookmark not found", "NOT_FOUND");
      }

      if (!folder) {
        throw new AppError("Folder not found", "NOT_FOUND");
      }

      return prisma.bookmark.update({
        where: {
          id: bookmarkId,
        },

        data: {
          folderId,
        },
      });
    },
  },
};
