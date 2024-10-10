import { z } from "zod";

export const MarketplaceProduct = z.object({
  category: z.union([
    z.literal("sectionTemplates"),
    z.literal("pageTemplates"),
    z.literal("integrationTemplates"),
  ]),
  name: z.string().min(2).max(200).trim(),
  thumbnailAssetId: z.string(),
  author: z.string().min(2).max(200).trim(),
  email: z.string().email().max(200).trim(),
  website: z.union([
    z.string().max(200).url().trim().optional(),
    z.literal(""),
  ]),
  issues: z.union([z.string().max(200).url().trim().optional(), z.literal("")]),
  description: z.string().trim().min(10).max(1000),
});
export type MarketplaceProduct = z.infer<typeof MarketplaceProduct>;

export const marketplaceCategories = new Map<
  MarketplaceProduct["category"],
  { label: string; description: string }
>([
  [
    "sectionTemplates",
    {
      label: "Sections",
      description:
        "Section templates are pre-designed layouts for quickly creating pages using sections.",
    },
  ],
  [
    "pageTemplates",
    {
      label: "Pages",
      description:
        "Page templates are pre-designed single or multi-page layouts for entire pages.",
    },
  ],
  [
    "integrationTemplates",
    {
      label: "Integrations",
      description:
        "Integration templates demonstrate how to integrate external services.",
    },
  ],
]);
