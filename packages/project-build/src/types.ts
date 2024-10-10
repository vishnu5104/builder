import type {
  Pages,
  Breakpoint,
  StyleDecl,
  StyleDeclKey,
  StyleSource,
  Instance,
  Prop,
  StyleSourceSelection,
  Deployment,
  DataSource,
  Resource,
} from "@webstudio-is/sdk";
import type { MarketplaceProduct } from "./shared/marketplace";

export type Build = {
  id: string;
  projectId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  pages: Pages;
  breakpoints: [Breakpoint["id"], Breakpoint][];
  styles: [StyleDeclKey, StyleDecl][];
  styleSources: [StyleSource["id"], StyleSource][];
  styleSourceSelections: [Instance["id"], StyleSourceSelection][];
  props: [Prop["id"], Prop][];
  instances: [Instance["id"], Instance][];
  dataSources: [DataSource["id"], DataSource][];
  resources: [Resource["id"], Resource][];
  deployment?: Deployment | undefined;
  marketplaceProduct: MarketplaceProduct;
};

export type CompactBuild = {
  id: string;
  projectId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  pages: Pages;
  breakpoints: Breakpoint[];
  styles: StyleDecl[];
  styleSources: StyleSource[];
  styleSourceSelections: StyleSourceSelection[];
  props: Prop[];
  dataSources: DataSource[];
  resources: Resource[];
  instances: Instance[];
  deployment?: Deployment;
  marketplaceProduct: MarketplaceProduct;
};
