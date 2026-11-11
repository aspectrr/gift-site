/** The chart's fixed categories — the rows of the sheet. Adding one is a code change, not a migration. */
/** Categories with `options` render as a picker instead of a free-text field. */
export const FAVORITE_COLORS = [
  { name: "red", hex: "#e2504c" },
  { name: "orange", hex: "#f28c38" },
  { name: "yellow", hex: "#f2c94c" },
  { name: "green", hex: "#4caf6e" },
  { name: "blue", hex: "#4a90d9" },
  { name: "purple", hex: "#8e6fc0" },
  { name: "pink", hex: "#ef8fb5" },
  { name: "black", hex: "#2b2b2b" },
  { name: "white", hex: "#ffffff" },
] as const;

export const FAVORITE_COLOR_HEX: Record<string, string> = Object.fromEntries(
  FAVORITE_COLORS.map((c) => [c.name, c.hex]),
);

/** Widened so `.includes()` and friends take plain strings, not literal unions. */
const FAVORITE_COLOR_NAMES: readonly string[] = FAVORITE_COLORS.map(
  (c) => c.name,
);

export const CATEGORIES = [
  {
    key: "favorite_color",
    label: "Favorite color",
    placeholder: "",
    options: FAVORITE_COLOR_NAMES,
  },
  {
    key: "flowers",
    label: "Favorite flowers",
    placeholder: "Peonies, tulips, sunflowers…",
  },
  {
    key: "snacks",
    label: "Favorite snacks",
    placeholder: "Sour Patch Kids, sharp cheddar, kettle corn…",
  },
  {
    key: "drinks",
    label: "Favorite drinks",
    placeholder: "Coke Zero, sweet tea, LaCroix…",
  },
  {
    key: "coffee_order",
    label: "Coffee order",
    placeholder: "Large iced oat latte, 2 pumps vanilla",
  },
  {
    key: "restaurants",
    label: "Restaurants",
    placeholder: "Local taqueria, Chick-fil-A, that Thai place on 5th",
  },
  {
    key: "gift_cards",
    label: "Gift cards",
    placeholder: "Amazon, Target, local bookstore",
  },
  {
    key: "sizes",
    label: "Clothing & shoe sizes",
    placeholder: "Tops M, pants 32×30, shoes 10.5, ring 7",
  },
  {
    key: "hobbies",
    label: "Hobbies",
    placeholder: "Gardening, pickleball, thrifting",
  },
  {
    key: "books",
    label: "Books & authors",
    placeholder: "Anything by Louise Penny, cozy mysteries",
  },
  {
    key: "collections",
    label: "Collections",
    placeholder: "Enamel pins, vintage Pyrex, vinyl",
  },
  {
    key: "experiences",
    label: "Experiences they'd love",
    placeholder: "Pottery class, axe throwing, botanical garden",
  },
  {
    key: "needs",
    label: "Things they need",
    placeholder: "New work gloves, car wash pass, sheets for a twin bed",
  },
  {
    key: "allergies",
    label: "Allergies & hard avoids",
    placeholder: "No tree nuts, including packaging",
  },
  {
    key: "avoid",
    label: "Please avoid",
    placeholder: "No scented candles, no more mugs",
  },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c.label]),
);

export const AVATAR_COLORS = [
  "mint",
  "sky",
  "bubblegum",
  "peach",
  "lavender",
  "butter",
  "coral",
  "teal",
] as const;

export function pickColor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function currentYear(): number {
  return new Date().getFullYear();
}
