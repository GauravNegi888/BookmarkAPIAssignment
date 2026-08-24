import { afterAll, describe, expect, test } from "bun:test";
import { graphql } from "graphql";
import { schema } from "../../src/graphql/schema";
import { prisma } from "../../src/lib/prisma";

type Folder = {
  id: string;
  name: string;
};

type Bookmark = {
  id: string;
  title: string;
  url: string;
  folderId: string;
};

const execute = (
  source: string,
  variableValues?: Record<string, unknown>
) =>
  graphql({
    schema,
    source,
    variableValues,
  });

describe("Bookmark Manager integration", () => {
  let folderId: string;
  let secondFolderId: string;
  let bookmarkId: string;

  test("supports folder and bookmark management", async () => {
    // --------------------------------------------------
    // 1. Create folder
    // --------------------------------------------------

    const createFolderResult = await execute(
      `
        mutation CreateFolder($name: String!) {
          createFolder(input: { name: $name }) {
            id
            name
          }
        }
      `,
      {
        name: `Integration Folder ${Date.now()}`,
      }
    );

    expect(createFolderResult.errors).toBeUndefined();
    expect(createFolderResult.data).toBeDefined();

    const folderData = createFolderResult.data as {
      createFolder: Folder;
    };

    folderId = folderData.createFolder.id;

    expect(folderData.createFolder.name).toContain(
      "Integration Folder"
    );

    // --------------------------------------------------
    // 2. Create second folder
    // --------------------------------------------------

    const secondFolderResult = await execute(
      `
        mutation CreateFolder($name: String!) {
          createFolder(input: { name: $name }) {
            id
            name
          }
        }
      `,
      {
        name: `Second Folder ${Date.now()}`,
      }
    );

    expect(secondFolderResult.errors).toBeUndefined();
    expect(secondFolderResult.data).toBeDefined();

    const secondFolderData = secondFolderResult.data as {
      createFolder: Folder;
    };

    secondFolderId = secondFolderData.createFolder.id;

    // --------------------------------------------------
    // 3. Create bookmarks
    // --------------------------------------------------

    const createBookmark = async (
      title: string,
      url: string
    ) => {
      const result = await execute(
        `
          mutation CreateBookmark(
            $title: String!
            $url: String!
            $folderId: ID!
          ) {
            createBookmark(
              input: {
                title: $title
                url: $url
                folderId: $folderId
              }
            ) {
              id
              title
              url
              folderId
            }
          }
        `,
        {
          title,
          url,
          folderId,
        }
      );

      expect(result.errors).toBeUndefined();
      expect(result.data).toBeDefined();

      const data = result.data as {
        createBookmark: Bookmark;
      };

      return data.createBookmark;
    };

    const bookmark1 = await createBookmark(
      "React Documentation",
      "https://react.dev"
    );

    bookmarkId = bookmark1.id;

    const bookmark2 = await createBookmark(
      "Prisma Documentation",
      "https://www.prisma.io/docs"
    );

    await createBookmark(
      "GraphQL Documentation",
      "https://graphql.org"
    );

    expect(bookmark1.folderId).toBe(folderId);
    expect(bookmark2.title).toBe("Prisma Documentation");

    // --------------------------------------------------
    // 4. Fetch folder with nested bookmarks
    // --------------------------------------------------

    const folderResult = await execute(
      `
        query GetFolder($id: ID!) {
          folder(id: $id) {
            id
            name

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
      `,
      {
        id: folderId,
      }
    );

    expect(folderResult.errors).toBeUndefined();
    expect(folderResult.data).toBeDefined();

    const folderQueryData = folderResult.data as {
      folder: {
        id: string;
        name: string;
        bookmarks: {
          edges: Array<{
            node: Bookmark;
            cursor: string;
          }>;
          pageInfo: {
            hasNextPage: boolean;
            endCursor: string | null;
          };
        };
      };
    };

    expect(folderQueryData.folder.id).toBe(folderId);
    expect(
      folderQueryData.folder.bookmarks.edges.length
    ).toBe(3);

    // --------------------------------------------------
    // 5. Search bookmarks by title
    // --------------------------------------------------

    const searchResult = await execute(
      `
        query SearchBookmarks($folderId: ID!) {
          bookmarks(
            search: "React"
            folderId: $folderId
          ) {
            edges {
              node {
                id
                title
              }
            }

            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `,
      {
        folderId,
      }
    );

    expect(searchResult.errors).toBeUndefined();
    expect(searchResult.data).toBeDefined();

    const searchData = searchResult.data as {
      bookmarks: {
        edges: Array<{
          node: {
            id: string;
            title: string;
          };
        }>;
      };
    };

    expect(searchData.bookmarks.edges.length).toBe(1);

    expect(
      searchData.bookmarks.edges[0]!.node.title
    ).toBe("React Documentation");

    // --------------------------------------------------
    // 6. Cursor pagination
    // --------------------------------------------------

    const firstPageResult = await execute(
      `
        query GetFirstPage($folderId: ID!) {
          bookmarks(
            first: 2
            folderId: $folderId
          ) {
            edges {
              node {
                id
                title
              }

              cursor
            }

            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `,
      {
        folderId,
      }
    );

    expect(firstPageResult.errors).toBeUndefined();
    expect(firstPageResult.data).toBeDefined();

    const firstPageData = firstPageResult.data as {
      bookmarks: {
        edges: Array<{
          node: Bookmark;
          cursor: string;
        }>;
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
      };
    };

    expect(
      firstPageData.bookmarks.edges.length
    ).toBe(2);

    expect(
      firstPageData.bookmarks.pageInfo.hasNextPage
    ).toBe(true);

    expect(
      firstPageData.bookmarks.pageInfo.endCursor
    ).toBeDefined();

    const cursor =
      firstPageData.bookmarks.pageInfo.endCursor;

    expect(cursor).not.toBeNull();

    // --------------------------------------------------
    // Second page
    // --------------------------------------------------

    const secondPageResult = await execute(
      `
        query GetNextPage(
          $after: String!
          $folderId: ID!
        ) {
          bookmarks(
            first: 2
            after: $after
            folderId: $folderId
          ) {
            edges {
              node {
                id
                title
              }

              cursor
            }

            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `,
      {
        after: cursor,
        folderId,
      }
    );

    expect(secondPageResult.errors).toBeUndefined();
    expect(secondPageResult.data).toBeDefined();

    const secondPageData = secondPageResult.data as {
      bookmarks: {
        edges: Array<{
          node: Bookmark;
          cursor: string;
        }>;
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
      };
    };

    expect(
      secondPageData.bookmarks.edges.length
    ).toBe(1);

    expect(
      secondPageData.bookmarks.pageInfo.hasNextPage
    ).toBe(false);

    // --------------------------------------------------
    // 7. Update bookmark
    // --------------------------------------------------

    const updateResult = await execute(
      `
        mutation UpdateBookmark(
          $id: ID!
          $title: String
        ) {
          updateBookmark(
            input: {
              id: $id
              title: $title
            }
          ) {
            id
            title
          }
        }
      `,
      {
        id: bookmarkId,
        title: "Updated React Documentation",
      }
    );

    expect(updateResult.errors).toBeUndefined();
    expect(updateResult.data).toBeDefined();

    const updateData = updateResult.data as {
      updateBookmark: {
        id: string;
        title: string;
      };
    };

    expect(
      updateData.updateBookmark.title
    ).toBe("Updated React Documentation");

    // --------------------------------------------------
    // 8. Move bookmark
    // --------------------------------------------------

    const moveResult = await execute(
      `
        mutation MoveBookmark(
          $bookmarkId: ID!
          $folderId: ID!
        ) {
          moveBookmark(
            bookmarkId: $bookmarkId
            folderId: $folderId
          ) {
            id
            folderId
          }
        }
      `,
      {
        bookmarkId,
        folderId: secondFolderId,
      }
    );

    expect(moveResult.errors).toBeUndefined();
    expect(moveResult.data).toBeDefined();

    const moveData = moveResult.data as {
      moveBookmark: {
        id: string;
        folderId: string;
      };
    };

    expect(
      moveData.moveBookmark.folderId
    ).toBe(secondFolderId);

    // --------------------------------------------------
    // 9. Delete bookmark
    // --------------------------------------------------

    const deleteResult = await execute(
      `
        mutation DeleteBookmark($id: ID!) {
          deleteBookmark(id: $id)
        }
      `,
      {
        id: bookmarkId,
      }
    );

    expect(deleteResult.errors).toBeUndefined();
    expect(deleteResult.data).toBeDefined();

    const deleteData = deleteResult.data as {
      deleteBookmark: boolean;
    };

    expect(deleteData.deleteBookmark).toBe(true);

    // --------------------------------------------------
    // 10. Validation error
    // --------------------------------------------------

    const validationResult = await execute(`
      mutation {
        createFolder(input: { name: "" }) {
          id
          name
        }
      }
    `);

    expect(validationResult.errors).toBeDefined();

    expect(
      validationResult.errors?.[0]?.message
    ).toBe("Folder name is required");

    expect(
      validationResult.errors?.[0]?.extensions?.code
    ).toBe("BAD_USER_INPUT");

    // --------------------------------------------------
    // 11. Not found error
    // --------------------------------------------------

    const notFoundResult = await execute(`
      query {
        folder(id: "does-not-exist") {
          id
          name
        }
      }
    `);

    expect(notFoundResult.errors).toBeDefined();

    expect(
      notFoundResult.errors?.[0]?.message
    ).toBe("Folder not found");

    expect(
      notFoundResult.errors?.[0]?.extensions?.code
    ).toBe("NOT_FOUND");
  });

  afterAll(async () => {
    if (folderId) {
      await prisma.folder.delete({
        where: {
          id: folderId,
        },
      });
    }

    if (secondFolderId) {
      await prisma.folder.delete({
        where: {
          id: secondFolderId,
        },
      });
    }

    await prisma.$disconnect();
  });
});