import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
// The plugin's own switch, so this test fails if the plugin changes how it reads it.
import { shouldEnableSkewProtection } from "@netlify/plugin-nextjs/dist/build/skew-protection.js";

// Values set in netlify.toml's [build.environment] (plain `KEY = "value"` lines).
function buildEnvironment(): Record<string, string> {
  const toml = readFileSync(new URL("../netlify.toml", import.meta.url), "utf8");
  const section = toml.split(/^\[build\.environment\]\s*$/m)[1]?.split(/^\[/m)[0] ?? "";
  const env: Record<string, string> = {};
  for (const m of section.matchAll(/^\s*([A-Z0-9_]+)\s*=\s*"([^"]*)"/gm)) env[m[1]] = m[2];
  return env;
}

describe("Netlify skew protection (old pages keep their CSS/JS after a deploy)", () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it("is switched on in netlify.toml", () => {
    expect(buildEnvironment().NETLIFY_NEXT_SKEW_PROTECTION).toBe("true");
  });

  it("makes the plugin enable it on a Netlify build (which has a DEPLOY_ID)", () => {
    delete process.env.NETLIFY_SKEW_PROTECTION_TOKEN;
    Object.assign(process.env, buildEnvironment(), { DEPLOY_ID: "6afc710a0000000000000000" });
    const result = shouldEnableSkewProtection({ featureFlags: {}, constants: { IS_LOCAL: false } } as never);
    expect(result).toMatchObject({ enabled: true, token: "6afc710a0000000000000000" });
  });
});
