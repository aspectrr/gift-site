import { describe, expect, test } from "bun:test";
import { CATEGORIES, FAVORITE_COLORS } from "./categories";

describe("FAVORITE_COLORS", () => {
  test("names are unique", () => {
    const names = FAVORITE_COLORS.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  test("hexes are valid #rrggbb", () => {
    for (const c of FAVORITE_COLORS) {
      expect(c.hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  test("the favorite_color category offers exactly these options", () => {
    const cat = CATEGORIES.find((c) => c.key === "favorite_color");
    expect(cat && "options" in cat && cat.options).toEqual(
      FAVORITE_COLORS.map((c) => c.name),
    );
  });
});
