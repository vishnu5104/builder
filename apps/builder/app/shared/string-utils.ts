import { noCase } from "change-case";
import { titleCase } from "title-case";

// Initialize the cache with abbreviations that don't follow the title case rules.
const cache: Map<string, string> = new Map([
  ["id", "ID"],
  ["url", "URL"],
]);

export const humanizeString = (string: string): string => {
  let result = cache.get(string);
  if (result === undefined) {
    result = titleCase(noCase(string));
    cache.set(string, result);
  }
  return result;
};
