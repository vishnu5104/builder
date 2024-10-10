import * as flags from "./flags";

let env = "";

type Name = keyof typeof flags;

export const parse = (flags?: string | null): Array<Name> =>
  // Supports both, space and comma separated items
  (flags ?? "").split(/\s|,/).filter(Boolean) as Array<Name>;

export const setLocal = (features: string) => {
  if (flags) {
    const parsed = parse(features).filter(
      (flag) => flag in flags
    ) as Array<Name>;
    localStorage.setItem("features", parsed.join(","));
  }
};

export const readLocal = (): Array<Name> => {
  try {
    const flags = localStorage.getItem("features");
    return parse(flags);
  } catch {
    // Not having feature in localStorage or not having localStorage implemented, both should not throw.
  }
  return [];
};

export const setEnv = (features: string) => {
  env = features;
};

/**
 * Returns true/false if the feature is turned on.
 * A feature can be turned on:
 * - by default directly in ./flags
 * - by providing an environment variable server-side (locally or on the server): FEATURES="something1, something2" pnpm dev
 * - by setting it in the browser console: localStorage.features = 'something1, something2', browser defined flag will override server-side flag
 */
export const isFeatureEnabled = (name: Name): boolean => {
  if (env === "*") {
    return true;
  }
  const defaultValue = flags[name];
  const envValue = parse(env).includes(name);
  const localValue = readLocal().includes(name);
  // Any source can enable feature, first `true` value will result in enabling a feature.
  // This also means you can't disable a feature if its already enabled in default value.
  return localValue || envValue || defaultValue;
};
