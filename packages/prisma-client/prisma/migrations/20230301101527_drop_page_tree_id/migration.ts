import { PrismaClient } from "./client";

type TreeId = string;

type Page = {
  id: string;
  treeId?: TreeId;
};

type Pages = {
  homePage: Page;
  pages: Page[];
};

export default async () => {
  const client = new PrismaClient({
    // Uncomment to see the queries in console as the migration runs
    // log: ["query", "info", "warn", "error"],
  });

  await client.$transaction(
    async (prisma) => {
      const chunkSize = 1000;
      let cursor: undefined | { id: string; projectId: string } = undefined;
      let hasNext = true;
      while (hasNext) {
        const builds = await prisma.build.findMany({
          take: chunkSize,
          orderBy: {
            id: "asc",
          },
          ...(cursor
            ? {
                skip: 1, // Skip the cursor
                cursor: { id_projectId: cursor },
              }
            : null),
        });
        const lastBuild = builds.at(-1);
        if (lastBuild) {
          cursor = { id: lastBuild.id, projectId: lastBuild.projectId };
        }
        hasNext = builds.length === chunkSize;

        for (const build of builds) {
          const { homePage, pages }: Pages = JSON.parse(build.pages);
          delete homePage.treeId;
          for (const page of pages) {
            delete page.treeId;
          }
          build.pages = JSON.stringify({ homePage, pages });
        }

        await Promise.all(
          builds.map(({ id, projectId, pages }) =>
            prisma.build.update({
              where: { id_projectId: { id, projectId } },
              data: { pages },
            })
          )
        );
      }
    },
    { timeout: 1000 * 60 * 8 }
  );
};
