/** The chart's fixed categories — the rows of the sheet. Adding one is a code change, not a migration. */
export const CATEGORIES = [
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
