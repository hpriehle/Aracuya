import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";
import { metadata } from "./christmas/page";

describe("/christmas", () => {
  it("is in the sitemap", () => {
    expect(sitemap().map((e) => e.url)).toContain("https://aracuya.com/christmas");
  });

  it("has its own canonical and share card", () => {
    expect(metadata.alternates?.canonical).toBe("/christmas");
    expect(metadata.openGraph?.url).toBe("/christmas");
  });
});
