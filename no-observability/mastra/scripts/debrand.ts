/**
 * Remove recognizable brand names from inventory.ts
 * Run once: npx tsx scripts/debrand.ts
 */

import * as fs from "fs";
import * as path from "path";

const INVENTORY_PATH = path.resolve(__dirname, "../src/lib/inventory.ts");

let src = fs.readFileSync(INVENTORY_PATH, "utf-8");

// Each replacement: [pattern, replacement, flags]
const replacements: [string | RegExp, string][] = [
  // ── toy-015: Jellycat Bashful Bunny → Bashful Bunny ──
  [/name: "Jellycat Bashful Bunny"/, 'name: "Bashful Bunny"'],
  [/The Jellycat Bashful Bunny/, "The Bashful Bunny"],
  [/Jellycat's signature plush fabric, a proprietary polyester blend/, "our signature plush fabric, a proprietary polyester blend"],
  [/Jellycat has been crafting premium plush toys in London since 1999, and the Bashful Bunny is their most beloved creation\./, "Crafted by a premium London plush house, the Bashful Bunny is their most beloved creation."],
  [/reflecting Jellycat's commitment/, "reflecting a commitment"],
  [/"jellycat", /, ""],
  [/manufacturer: "Jellycat London"/, 'manufacturer: "London Plush Co."'],

  // ── toy-020: LEGO-Compatible Robot Builder → Robot Builder ──
  [/name: "LEGO-Compatible Robot Builder \(450 pieces\)"/, 'name: "Robot Builder (450 pieces)"'],
  [/LEGO-compatible bricks/, "interlocking bricks"],
  [/seamless compatibility with genuine LEGO elements and a tight/, "seamless compatibility with major brick brands and a tight"],

  // ── toy-023: Lincoln Logs → Frontier Cabin Log Set ──
  [/name: "Lincoln Logs – Frontier Cabin"/, 'name: "Frontier Cabin Log Set"'],
  [/Classic 150-piece Lincoln Logs set/, "Classic 150-piece log building set"],
  [/Real wood logs with plastic roof/, "Real wood logs with plastic roof"],
  [/An American classic since 1916, Lincoln Logs have been teaching/, "An American classic since 1916, log building sets have been teaching"],
  [/keywords: \["lincoln logs", "cabin", "wood", "classic", "building"\]/, 'keywords: ["log building", "cabin", "wood", "classic", "building"]'],

  // ── toy-024: K'NEX → Rod & Connector Roller Coaster ──
  [/name: "K'NEX Roller Coaster Building Set"/, 'name: "Rod & Connector Roller Coaster Building Set"'],
  [/500\+ K'NEX pieces/, "500+ rod-and-connector pieces"],
  [/our K'NEX Roller Coaster Building Set/, "our Roller Coaster Building Set"],
  [/The K'NEX rod-and-connector system/, "The rod-and-connector system"],
  [/K'NEX pieces are manufactured in the USA from glass-filled nylon rods/, "The pieces are manufactured in the USA from glass-filled nylon rods"],
  [/the broader K'NEX ecosystem/, "the broader rod-and-connector ecosystem"],
  [/keywords: \["knex", "roller coaster", "engineering", "motorized", "building"\]/, 'keywords: ["rod connector", "roller coaster", "engineering", "motorized", "building"]'],
  [/manufacturer: "K'NEX Industries"/, 'manufacturer: "ConnectBuild Inc."'],

  // ── toy-039: Play-Doh → Modeling Dough ──
  [/name: "Play-Doh Mega Pack \(24 colors\)"/, 'name: "Modeling Dough Mega Pack (24 colors)"'],
  [/24 cans of classic Play-Doh/, "24 cans of classic modeling dough"],
  [/Non-toxic modeling compound/, "Non-toxic modeling compound"],
  [/our Play-Doh Mega Pack/, "our Modeling Dough Mega Pack"],
  [/the signature Play-Doh squish, smell, and satisfying moldability that has made this compound a childhood staple for over 65 years/, "the signature squish, smell, and satisfying moldability that has made modeling dough a childhood staple for decades"],
  [/Play-Doh's unique wheat-based/, "This unique wheat-based"],
  [/Occupational therapists recommend Play-Doh as one of/, "Occupational therapists recommend modeling dough as one of"],
  [/keywords: \["playdoh", "clay", "modeling", "creative", "art", "colors"\]/, 'keywords: ["modeling dough", "clay", "modeling", "creative", "art", "colors"]'],
  [/manufacturer: "Hasbro Creative"/, 'manufacturer: "Creative Compound Co."'],

  // ── toy-071: Junior Scrabble → Junior Word Builder ──
  [/name: "Junior Scrabble"/, 'name: "Junior Word Builder"'],
  [/Words become an adventure with Junior Scrabble/, "Words become an adventure with Junior Word Builder"],
  [/the world's most beloved word game/, "the world's most beloved word-building format"],
  [/plays like classic Scrabble with a simplified/, "plays like a classic word game with a simplified"],
  [/Junior Scrabble sneaks this learning/, "Junior Word Builder sneaks this learning"],
  [/Children who start with Junior Scrabble/, "Children who start with Junior Word Builder"],
  [/to graduate to the full adult game/, "to graduate to the full adult word game"],
  [/keywords: \["scrabble", "word game", "letters", "spelling", "educational"\]/, 'keywords: ["word builder", "word game", "letters", "spelling", "educational"]'],
  [/manufacturer: "Mattel Games"/, 'manufacturer: "WonderPlay Games"'],

  // ── toy-073: Candy Land → Sweet Path ──
  [/name: "Candy Land Classic"/, 'name: "Sweet Path Classic"'],
  [/just match colors and race to the Candy Castle/, "just match colors and race to the Candy Castle"],
  [/For over 70 years, Candy Land has been the game/, "For decades, Sweet Path has been the game"],
  [/Candy Land is more than a game — it is a cultural rite of passage\. Generations of families share fond memories of their first Candy Land sessions, and the game continues/, "Sweet Path is more than a game — it is a family rite of passage. Generations of families share fond memories of their first sessions, and the game continues"],
  [/This classic edition features the traditional art style that parents and grandparents remember from their own childhoods/, "This classic edition features the traditional art style that parents and grandparents remember"],
  [/keywords: \["candy land", "classic", "colors", "first game", "simple"\]/, 'keywords: ["sweet path", "classic", "colors", "first game", "simple"]'],
  [/manufacturer: "Hasbro Gaming"/, 'manufacturer: "WonderPlay Games"'],

  // ── toy-074: Ticket to Ride → Train Routes ──
  [/name: "Ticket to Ride: First Journey"/, 'name: "Train Routes: First Journey"'],
  [/Simplified version of the hit train-route game/, "Simplified version of the popular train-route game"],
  [/Ticket to Ride: First Journey brings the beloved train-route strategy franchise/, "Train Routes: First Journey brings the beloved train-route strategy format"],
  [/the original Ticket to Ride:/, "the original game:"],
  [/Ticket to Ride: First Journey is widely regarded/, "Train Routes: First Journey is widely regarded"],
  [/keywords: \["ticket to ride", "trains", "routes", "strategy", "family"\]/, 'keywords: ["train routes", "trains", "routes", "strategy", "family"]'],
  [/manufacturer: "Days of Wonder"/, 'manufacturer: "RailQuest Games"'],

  // ── toy-075: Clue Junior → Mystery Mansion Junior ──
  [/name: "Clue Junior"/, 'name: "Mystery Mansion Junior"'],
  [/In Clue Junior, players don't solve a murder/, "In Mystery Mansion Junior, players don't solve a mystery crime"],
  [/keywords: \["clue", "mystery", "detective", "deduction", "junior"\]/, 'keywords: ["mystery", "mansion", "detective", "deduction", "junior"]'],

  // ── toy-076: Settlers of Catan → Island Settlers ──
  [/name: "Settlers of Catan: Family Edition"/, 'name: "Island Settlers: Family Edition"'],
  [/Family-friendly version of the beloved resource-trading game/, "Family-friendly version of the beloved resource-trading game"],
  [/Welcome to Catan — the island where/, "Welcome to the island where"],
  [/The Family Edition of the world's most popular strategy board game retains the core resource-trading, settlement-building, and road-expanding mechanics that have made Catan a phenomenon/, "The Family Edition of this beloved strategy board game retains the core resource-trading, settlement-building, and road-expanding mechanics that have made it a phenomenon"],
  [/The trading mechanic is Catan's secret weapon:/, "The trading mechanic is the game's secret weapon:"],
  [/Catan has sold over 40 million copies worldwide/, "This game has sold millions of copies worldwide"],
  [/Parents report that Catan becomes a weekly family tradition/, "Parents report that it becomes a weekly family tradition"],
  [/keywords: \["catan", "strategy", "trading", "settlers", "family"\]/, 'keywords: ["island", "strategy", "trading", "settlers", "family"]'],
  [/manufacturer: "Catan Studio"/, 'manufacturer: "Hexland Games"'],

  // ── toy-078: Guess Who? → Face Guesser ──
  [/name: "Guess Who\? Classic"/, 'name: "Face Guesser Classic"'],
  [/Guess Who\? is the brilliantly simple/, "Face Guesser is the brilliantly simple"],
  [/Children who play Guess Who\? regularly/, "Children who play Face Guesser regularly"],
  [/making Guess Who\? the perfect/, "making Face Guesser the perfect"],
  [/The original face-guessing game\. Ask yes-or-no questions/, "The classic face-guessing game. Ask yes-or-no questions"],
  [/that stretches back to 1979 and shows/, "that spans decades and shows"],
  [/keywords: \["guess who", "deduction", "faces", "two player", "classic"\]/, 'keywords: ["face guesser", "deduction", "faces", "two player", "classic"]'],

  // ── toy-080: Apples to Apples Junior → Comparisons Junior ──
  [/name: "Apples to Apples Junior"/, 'name: "Comparisons Junior"'],
  [/Apples to Apples Junior takes the wildly popular party game formula/, "Comparisons Junior takes the wildly popular party game formula"],
  [/The beauty of Apples to Apples is that/, "The beauty of the game is that"],
  [/Apples to Apples Junior is secretly one of/, "Comparisons Junior is secretly one of"],
  [/The hilarious comparisons game for kids\. Play a red card that best matches the green card/, "The hilarious comparisons game for kids. Play a red card that best matches the green card"],
  [/keywords: \["apples", "comparisons", "funny", "party", "junior"\]/, 'keywords: ["comparisons", "matching", "funny", "party", "junior"]'],

  // ── toy-081: Jenga → Tower Tumble ──
  [/name: "Jenga Classic"/, 'name: "Tower Tumble Classic"'],
  [/The exquisite tension of Jenga/, "The exquisite tension of Tower Tumble"],
  [/Jenga is the rare game that needs no opponent/, "Tower Tumble is the rare game that needs no opponent"],
  [/Jenga is not just a game/, "Tower Tumble is not just a game"],
  [/The original block-stacking, stack-crashing game/, "The classic block-stacking, stack-crashing game"],
  [/keywords: \["jenga", "stacking", "blocks", "dexterity", "classic"\]/, 'keywords: ["tower tumble", "stacking", "blocks", "dexterity", "classic"]'],

  // ── toy-088: Rubik's Cube → Twist Puzzle Cube ──
  [/name: "Rubik's Cube – Original 3x3"/, 'name: "Twist Puzzle Cube – 3x3"'],
  [/The Rubik's Cube is the best-selling puzzle in human history/, "The twist puzzle cube is the best-selling puzzle in human history"],
  [/the signature "Rubik's" logo on the white center square/, "a logo on the white center square"],
  [/The Rubik's Cube is experiencing a massive global renaissance/, "The twist puzzle cube is experiencing a massive global renaissance"],
  [/The classic brain-twisting puzzle\. Over 43 quintillion/, "The classic brain-twisting puzzle. Over 43 quintillion"],
  [/keywords: \["rubiks", "cube", "brain teaser", "classic", "logic"\]/, 'keywords: ["twist cube", "cube", "brain teaser", "classic", "logic"]'],
  [/manufacturer: "Rubik's Brand"/, 'manufacturer: "CubePuzzle Co."'],

  // ── toy-153: Uno → Color Match ──
  [/name: "Uno – Classic"/, 'name: "Color Match – Classic"'],
  [/The world's #1 card game\. Match colors and numbers, play action cards, and shout 'UNO!'/, "The world's #1 matching card game. Match colors and numbers, play action cards, and shout when you're down to one card!"],
  [/UNO! The single word that has launched a billion family arguments/, "One card left! The moment that has launched a billion family arguments"],
  [/shout "UNO!" when you're down to one card/, 'shout "One card!" when you\'re down to your last'],
  [/UNO has sold over 150 million copies worldwide/, "This game has sold over 150 million copies worldwide"],
  [/keywords: \["uno", "card game", "classic", "family", "matching"\]/, 'keywords: ["color match", "card game", "classic", "family", "matching"]'],

  // ── toy-154: Exploding Kittens → Exploding Cats ──
  [/name: "Exploding Kittens – Family Edition"/, 'name: "Exploding Cats – Family Edition"'],
  [/Exploding Kittens is the card game phenomenon that has sold over 10 million copies/, "Exploding Cats is the card game phenomenon that has sold millions of copies"],
  [/The brilliance of Exploding Kittens is in the escalating tension/, "The brilliance of Exploding Cats is in the escalating tension"],
  [/and Exploding Kittens become an increasingly large proportion/, "and Exploding Cat cards become an increasingly large proportion"],
  [/The hilarious artwork by The Oatmeal cartoonist Matthew Inman adds/, "The hilarious artwork adds"],
  [/Family-friendly version of the wildly popular card game\. Draw cards, avoid exploding kittens/, "Family-friendly version of the wildly popular card game. Draw cards, avoid exploding cats"],
  [/if you draw an Exploding Kitten card/, "if you draw an Exploding Cat card"],
  [/keywords: \["exploding kittens", "card game", "funny", "strategy", "family"\]/, 'keywords: ["exploding cats", "card game", "funny", "strategy", "family"]'],
  [/manufacturer: "Exploding Kittens LLC"/, 'manufacturer: "Boom Cat Games"'],

  // ── toy-156: Sushi Go! → Sushi Dash ──
  [/name: "Sushi Go! Card Game"/, 'name: "Sushi Dash Card Game"'],
  [/Sushi Go! is a lightning-fast/, "Sushi Dash is a lightning-fast"],
  [/Sushi Go! has won numerous gaming awards/, "Sushi Dash has won numerous gaming awards"],
  [/making Sushi Go! the perfect/, "making Sushi Dash the perfect"],
  [/keywords: \["sushi go", "drafting", "card game", "strategy", "cute"\]/, 'keywords: ["sushi dash", "drafting", "card game", "strategy", "cute"]'],

  // ── Remaining Hasbro/Mattel manufacturer references (toy-075, 078, 081 share "Hasbro Gaming") ──
  // These need to be handled carefully since multiple products share the same manufacturer string.
  // The first occurrence was already replaced above for toy-073. Let's handle the rest.
];

for (const [pattern, replacement] of replacements) {
  const before = src;
  if (typeof pattern === "string") {
    src = src.replace(pattern, replacement);
  } else {
    src = src.replace(pattern, replacement);
  }
  if (src === before) {
    console.warn(`⚠  No match for: ${pattern}`);
  }
}

// Handle remaining "Hasbro Gaming" manufacturer entries (toy-075 line 1530, toy-078 line 1590, toy-081 line 1650)
// and "Mattel Games" (toy-080 line 1630)
// Since replace only hits the first match by default, and toy-073 already replaced the first one,
// we need to replace all remaining occurrences.
src = src.replaceAll('manufacturer: "Hasbro Gaming"', 'manufacturer: "WonderPlay Games"');
src = src.replaceAll('manufacturer: "Mattel Games"', 'manufacturer: "WonderPlay Games"');

fs.writeFileSync(INVENTORY_PATH, src);
console.log("✅ Done — brand names removed from inventory.ts");
