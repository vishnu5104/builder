import { FONT_FORMATS } from "./constants";
import type { FontMeta, FontFormat, FontMetaStatic } from "./schema";

export type PartialFontAsset = {
  format: FontFormat;
  meta: FontMeta;
  name: string;
};

export type FontFace = {
  fontFamily: string;
  fontDisplay: "swap" | "auto" | "block" | "fallback" | "optional";
  src: string;
  fontStyle?: FontMetaStatic["style"];
  fontWeight?: number | string;
  fontStretch?: string;
};

// Use JSON.stringify to escape double quotes and backslashes in strings as it automatically replaces " with \" and \ with \\.
const sanitizeCssUrl = (str: string) => JSON.stringify(str);

const formatFace = (
  asset: PartialFontAsset,
  format: string,
  url: string
): FontFace => {
  if ("variationAxes" in asset.meta) {
    const { wght, wdth } = asset.meta?.variationAxes ?? {};
    return {
      fontFamily: asset.meta.family,
      fontStyle: "normal",
      fontDisplay: "swap",
      src: `url(${sanitizeCssUrl(url)}) format("${format}")`,
      fontStretch: wdth ? `${wdth.min}% ${wdth.max}%` : undefined,
      fontWeight: wght ? `${wght.min} ${wght.max}` : undefined,
    };
  }
  return {
    fontFamily: asset.meta.family,
    fontStyle: asset.meta.style,
    fontWeight: asset.meta.weight,
    fontDisplay: "swap",
    src: `url(${sanitizeCssUrl(url)}) format("${format}")`,
  };
};

const getKey = (asset: PartialFontAsset) => {
  if ("variationAxes" in asset.meta) {
    return asset.meta.family + Object.values(asset.meta.variationAxes).join("");
  }
  return asset.meta.family + asset.meta.style + asset.meta.weight;
};

export const getFontFaces = (
  assets: Array<PartialFontAsset>,
  options: {
    assetBaseUrl: string;
  }
): Array<FontFace> => {
  const { assetBaseUrl } = options;
  const faces = new Map();
  for (const asset of assets) {
    const url = `${assetBaseUrl}${asset.name}`;
    const assetKey = getKey(asset);
    const face = faces.get(assetKey);
    const format = FONT_FORMATS.get(asset.format);
    if (format === undefined) {
      // Should never happen since we allow only uploading formats we support
      continue;
    }

    if (face === undefined) {
      const face = formatFace(asset, format, url);
      faces.set(assetKey, face);
      continue;
    }

    // We already have that font face, so we need to add the new src
    face.src += `, url(${sanitizeCssUrl(url)}) format("${format}")`;
  }
  return Array.from(faces.values());
};
