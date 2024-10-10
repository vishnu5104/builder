import { PrismaClient, Prisma } from "./client";
import { z } from "zod";

const TreeHistory = z.array(z.string());

const Page = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  title: z.string(),
  meta: z.record(z.string(), z.string()),
  treeId: z.string(),
});

const Pages = z.object({
  homePage: Page,
  pages: z.array(Page),
});

export default () => {
  const client = new PrismaClient({
    // Uncomment to see the queries in console as the migration runs
    // log: ["query", "info", "warn", "error"],
  });
  return client.$transaction(
    async (prisma) => {
      const trees = await prisma.tree.findMany();
      const projects = await prisma.project.findMany();

      const builds: Prisma.BuildCreateManyInput[] = [];

      for (const tree of trees) {
        const project = projects.find(
          (project) =>
            project.devTreeId === tree.id ||
            project.prodTreeId === tree.id ||
            TreeHistory.parse(JSON.parse(project.prodTreeIdHistory)).includes(
              tree.id
            )
        );

        if (project === undefined) {
          continue;
        }

        const pages = Pages.parse({
          homePage: {
            id: crypto.randomUUID(),
            name: "Home",
            path: "",
            title: "Home",
            meta: {},
            treeId: tree.id,
          },
          pages: [],
        });

        builds.push({
          pages: JSON.stringify(pages),
          isDev: project.devTreeId === tree.id,
          isProd: project.prodTreeId === tree.id,
          projectId: project.id,
        });
      }

      await prisma.build.createMany({ data: builds });
    },
    { timeout: 1000 * 60 }
  );
};
