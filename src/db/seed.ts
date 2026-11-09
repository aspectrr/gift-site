import { eq } from "drizzle-orm";
import { db } from ".";
import { people, favorites, interests, giftIdeas } from "./schema";
import { pickColor, currentYear } from "~/lib/categories";

// A fake family of 10 so the UI has something real to show.
const FAMILY = [
  {
    name: "Deb",
    email: "deb@example.com",
    phone: "555-201-4417",
    birthday: "03-22",
    isKid: false,
    favorites: {
      snacks: "Dark chocolate almonds, David's jumbo sunflower seeds",
      drinks: "Sweet tea, half-and-half",
      coffee_order: "Dunkin medium iced, cream only",
      restaurants: "Olive Garden, the diner on Route 9",
      sizes: "Tops L, shoes 8",
      hobbies: "Scrapbooking, her garden",
      collections: "Salt & pepper shakers",
    },
    interests: { [currentYear()]: "Watercolor painting, grandkids' sports schedules", [currentYear() - 1]: "Puzzles, The Chosen" },
    ideas: [
      { size: "small", title: "Winsor & Newton watercolor set", url: "https://www.dickblick.com", note: "She mentioned the travel one" },
      { size: "big", title: "Garden kneeler + seat", url: null, note: "" },
      { size: "small", title: "Salt & pepper shaker from Frankenmuth", url: null, note: "For her collection" },
    ],
  },
  {
    name: "Matt",
    email: "matt@example.com",
    phone: "555-881-0932",
    birthday: "09-07",
    isKid: false,
    favorites: {
      coffee_order: "Black, always",
      restaurants: "Five Guys, Gus's Good Times Deli",
      gift_cards: "Home Depot, Lowe's",
      hobbies: "Golf, smoking meat",
    },
    interests: { [currentYear()]: "Trying to break 90", [currentYear() - 1]: "Disc golf" },
    ideas: [
      { size: "small", title: "Golf gloves, size L", url: null, note: "" },
      { size: "big", title: "Meat grinder attachment", url: "https://www.kitchenaid.com", note: "" },
    ],
  },
  {
    name: "Ava",
    email: "ava@example.com",
    phone: null,
    birthday: "12-02",
    isKid: true,
    favorites: {
      snacks: "Sour Patch Kids, Goldfish",
      sizes: "Youth 10/12, shoes 4",
      collections: "Squishmallows (has: Wendy the frog)",
    },
    interests: { [currentYear()]: "Art supplies, Bluey, making bracelets", [currentYear() - 1]: "Dinosaurs, magnatiles" },
    ideas: [
      { size: "small", title: "Perler beads mega set", url: "https://www.michaels.com", note: "" },
      { size: "big", title: "Kinetic sand castle playset", url: null, note: "" },
    ],
  },
  {
    name: "Cole",
    email: null,
    phone: null,
    birthday: "07-19",
    isKid: true,
    favorites: {
      snacks: "Slim Jims, apples",
      sizes: "Youth 14, shoes 6",
    },
    interests: { [currentYear()]: "Fishing, Zelda", [currentYear() - 1]: "Pokemon cards" },
    ideas: [{ size: "small", title: "Zelda TOTK guide book", url: null, note: "" }],
  },
  {
    name: "Jessica",
    email: "jessica@example.com",
    phone: "555-640-7723",
    birthday: "05-30",
    isKid: false,
    favorites: {
      coffee_order: "Oat milk latte, 1 pump hazelnut",
      restaurants: "Local taqueria, Panera",
      gift_cards: "Amazon, Target",
      sizes: "Tops S, shoes 7.5",
      hobbies: "Reading, running",
      books: "Anything Louise Penny, Winternight trilogy",
      allergies: "No tree nuts",
      avoid: "No scented candles",
    },
    interests: { [currentYear()]: "Cozy mysteries, half marathon training", [currentYear() - 1]: "Cricut projects" },
    ideas: [
      { size: "small", title: "Kindle paperwhite", url: "https://www.amazon.com/kindle", note: "" },
      { size: "small", title: "Goodr sunglasses", url: null, note: "" },
    ],
  },
  {
    name: "Ryan",
    email: "ryan@example.com",
    phone: null,
    birthday: "02-29",
    isKid: false,
    favorites: {
      coffee_order: "Cold brew, extra shot",
      hobbies: "Woodworking, fantasy football",
    },
    interests: { [currentYear()]: "Building a workbench" },
    ideas: [],
  },
  {
    name: "Grandpa Joe",
    email: null,
    phone: null,
    birthday: "11-21",
    isKid: false,
    favorites: {
      snacks: "Peanut brittle, black licorice",
      restaurants: "Cracker Barrel",
      hobbies: "Westerns, crosswords",
      needs: "New reading lamp, heavy-duty zipper bags",
    },
    interests: { [currentYear()]: "" },
    ideas: [],
  },
  {
    name: "Nana",
    email: "nana@example.com",
    phone: null,
    birthday: "04-14",
    isKid: false,
    favorites: {
      coffee_order: "Tea, Constant Comment",
      restaurants: "Anywhere with early-bird specials",
      collections: "Blue willow china",
    },
    interests: { [currentYear()]: "Jigsaw puzzles, 500 pieces" },
    ideas: [],
  },
  {
    name: "Tyler",
    email: "tyler@example.com",
    phone: null,
    birthday: "10-01",
    isKid: false,
    favorites: {
      restaurants: "Chipotle",
      gift_cards: "Xbox, GameStop",
    },
    interests: { [currentYear()]: "EA FC, lifting" },
    ideas: [{ size: "small", title: "Xbox gift card $25", url: null, note: "" }],
  },
  {
    name: "Sophie",
    email: "sophie@example.com",
    phone: null,
    birthday: "06-08",
    isKid: true,
    favorites: {
      snacks: "Fruit snacks, strawberries",
      sizes: "Youth 6, shoes 12.5 (kids)",
    },
    interests: { [currentYear()]: "Gymnastics, dresses with pockets" },
    ideas: [],
  },
];

console.log("seeding…");
let creatorId: number | null = null;
for (const member of FAMILY) {
  const [person] = await db
    .insert(people)
    .values({
      name: member.name,
      email: member.email,
      phone: member.phone ?? null,
      birthday: member.birthday,
      isKid: member.isKid,
      color: pickColor(member.name),
    })
    .onConflictDoNothing()
    .returning();

  if (!person) {
    console.log(`  skip ${member.name} (exists)`);
    const [existing] = await db.select().from(people).where(eq(people.name, member.name)).limit(1);
    creatorId = existing?.id ?? creatorId;
    continue;
  }
  creatorId ??= person.id;

  for (const [category, value] of Object.entries(member.favorites)) {
    await db.insert(favorites).values({ personId: person.id, category, value }).onConflictDoNothing();
  }
  for (const [year, value] of Object.entries(member.interests)) {
    if (value) {
      await db
        .insert(interests)
        .values({ personId: person.id, year: Number(year), value })
        .onConflictDoNothing();
    }
  }
  for (const idea of member.ideas) {
    await db.insert(giftIdeas).values({
      personId: person.id,
      year: currentYear(),
      size: idea.size,
      title: idea.title,
      url: idea.url,
      note: idea.note || null,
      createdById: creatorId,
    });
  }
  console.log(`  added ${member.name}`);
}
console.log("done.");
