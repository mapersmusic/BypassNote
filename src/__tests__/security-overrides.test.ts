import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Versions minimales corrigeant les avis de sécurité npm connus.
 * Ces overrides empêchent aussi `npm audit fix --force` de rétrograder Expo,
 * Jest ou React Native Testing Library vers des versions incompatibles.
 */
const MINIMUM_FIXED_VERSIONS: Record<string, string> = {
  sharp: "0.35.5",
  tar: "7.5.21",
  uuid: "11.1.1",
  zod: "4.6.6",
};

type PackageJson = {
  overrides?: Record<string, string>;
};

function parseVersion(value: string): number[] {
  const match = value.match(/\d+\.\d+\.\d+/);
  if (!match) {
    return [];
  }

  return match[0].split(".").map(Number);
}

function compareVersions(left: number[], right: number[]): number {
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}

describe("overrides de sécurité npm", () => {
  const packageJson = JSON.parse(
    readFileSync(join(process.cwd(), "package.json"), "utf8"),
  ) as PackageJson;

  it.each(Object.entries(MINIMUM_FIXED_VERSIONS))(
    "épingle %s à une version corrigée (>= %s)",
    (name, minimum) => {
      const override = packageJson.overrides?.[name];
      const version = parseVersion(override ?? "");

      expect(override).toBeDefined();
      expect(version).toHaveLength(3);
      expect(compareVersions(version, parseVersion(minimum))).toBeGreaterThanOrEqual(0);
    },
  );
});
