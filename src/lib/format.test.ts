import { describe, expect, test } from "bun:test";
import { formatBirthday, formatPhone } from "./format";

describe("formatPhone", () => {
  test("types up progressively", () => {
    expect(formatPhone("5")).toBe("5");
    expect(formatPhone("555")).toBe("555");
    expect(formatPhone("5551")).toBe("(555) 1");
    expect(formatPhone("5551234")).toBe("(555) 123-4");
    expect(formatPhone("5551234567")).toBe("(555) 123-4567");
  });

  test("strips junk and pasted formatting", () => {
    expect(formatPhone("(555) 123-4567")).toBe("(555) 123-4567");
    expect(formatPhone("+1 (555) 123-4567")).toBe("(555) 123-4567");
    expect(formatPhone("555.123.4567")).toBe("(555) 123-4567");
    expect(formatPhone("")).toBe("");
  });

  test("caps at 10 digits", () => {
    expect(formatPhone("5551234567890")).toBe("(555) 123-4567");
  });
});

describe("formatBirthday", () => {
  test("types up progressively", () => {
    expect(formatBirthday("0")).toBe("0");
    expect(formatBirthday("04")).toBe("04");
    expect(formatBirthday("040")).toBe("04-0");
    expect(formatBirthday("0409")).toBe("04-09");
  });

  test("normalizes dashes and caps at 4 digits", () => {
    expect(formatBirthday("04-09")).toBe("04-09");
    expect(formatBirthday("04/09/1990")).toBe("04-09");
    expect(formatBirthday("")).toBe("");
  });
});
