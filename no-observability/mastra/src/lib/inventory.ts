export interface Product {
  id: string;
  name: string;
  description: string;
  marketingCopy: string;
  keywords: string[];
  ageRange: { min: number; max: number };
  price: number;
  inventory: number;
  category: string;
  dimensions: {
    lengthInches: number;
    widthInches: number;
    heightInches: number;
    weightLbs: number;
  };
  manufacturer: string;
  bestSellersRank: number;
  rating: {
    stars: number;
    numberOfRatings: number;
  };
  image: string;
}

export const products: Product[] = [
  // ── DEVELOPMENTAL (Baby & Toddler) ────────────────────────────────────
  {
    id: "toy-001",
    name: "Rainbow Stacking Rings",
    image: "/product-images/toy-001.png",
    description: "Colorful wooden stacking rings that help develop hand-eye coordination and color recognition. Features 8 vibrant rings in graduated sizes.",
    marketingCopy: `Introduce your little one to a world of color, shape, and discovery with our Rainbow Stacking Rings — a timeless developmental toy handcrafted from sustainably sourced hardwood. Each of the eight rings is finished with water-based, non-toxic paint in a vibrant spectrum that naturally draws curious eyes and eager hands. The graduated sizing encourages babies and toddlers to experiment with order and sequence, building foundational problem-solving skills one ring at a time.

Designed by early-childhood educators, the smooth, splinter-free rings are perfectly weighted so they slide satisfyingly onto the solid wooden post. The widest ring at the base features a gentle wobble action that rewards even imprecise placement, keeping frustration low and confidence high. As your child grows, the rings become props for imaginative play — bangles, steering wheels, pretend cookies, and more.

Safety is built into every detail: rounded edges, a tip-resistant base, and finishes that exceed ASTM F963 and EN-71 standards. The compact footprint means it fits on a highchair tray or in a diaper bag, making it an ideal travel companion. Parents love that there are zero batteries, zero screens, and zero tiny parts to worry about — just pure, open-ended play that grows with your child from six months through toddlerhood.`,
    keywords: ["stacking", "wooden", "colors", "motor skills", "rings"],
    ageRange: { min: 0, max: 2 },
    price: 14.99,
    inventory: 45,
    category: "developmental",
    dimensions: { lengthInches: 5.5, widthInches: 5.5, heightInches: 8.0, weightLbs: 0.9 },
    manufacturer: "TinyTree Toys",
    bestSellersRank: 12,
    rating: { stars: 4.7, numberOfRatings: 2834 },
  },
  {
    id: "toy-002",
    name: "Musical Activity Cube",
    image: "/product-images/toy-002.png",
    description: "Five-sided activity cube with spinning gears, bead maze, shape sorter, xylophone, and peek-a-boo doors. Encourages exploration and discovery.",
    marketingCopy: `Five sides of wonder await in our Musical Activity Cube — a sensory playground that keeps little explorers engaged for hours. Each face of this sturdy wooden cube offers a completely different activity: a bead maze that twists and turns across the top, interlocking gears that spin in satisfying synchrony, a shape-sorting challenge with four chunky blocks, a five-key xylophone that plays real musical notes, and peek-a-boo doors that reveal friendly animal illustrations underneath.

Crafted from solid rubberwood with water-based lacquer finishes, the cube stands up to the enthusiastic play of toddlers without tipping, thanks to its weighted base. Every component is permanently attached — no small pieces to lose or swallow — and the rounded corners meet the strictest international safety standards. The xylophone keys are individually tuned so children begin developing an ear for pitch and rhythm during their earliest musical experiments.

Pediatric occupational therapists recommend the Musical Activity Cube for its ability to engage multiple developmental domains simultaneously: fine motor control, cause-and-effect reasoning, auditory processing, and spatial awareness. It is an heirloom-quality piece that parents proudly display in living rooms and playrooms, often passed from one sibling to the next. The cheerful color palette — sunshine yellow, ocean blue, grass green, and cherry red — complements any nursery décor while igniting a child's natural curiosity about the world around them.`,
    keywords: ["activity", "music", "cube", "shapes", "gears", "interactive"],
    ageRange: { min: 1, max: 3 },
    price: 34.99,
    inventory: 28,
    category: "developmental",
    dimensions: { lengthInches: 7.5, widthInches: 7.5, heightInches: 7.5, weightLbs: 2.8 },
    manufacturer: "TinyTree Toys",
    bestSellersRank: 34,
    rating: { stars: 4.6, numberOfRatings: 1956 },
  },
  {
    id: "toy-003",
    name: "Baby's First Books (Set of 6)",
    image: "/product-images/toy-003.png",
    description: "Soft fabric books with crinkle pages, bright patterns, and teething-safe corners. Topics include animals, colors, numbers, shapes, food, and vehicles.",
    marketingCopy: `Open the door to a lifelong love of reading with Baby's First Books — a curated set of six cloth books designed specifically for the youngest bookworms. Each soft, squeezable book explores a different foundational theme: friendly farm animals, bold primary colors, first numbers 1 through 5, basic shapes, yummy foods, and things that go. The pages crinkle enticingly when touched, rewarding tiny hands with instant sensory feedback that encourages repeated page-turning.

Every book is constructed from double-layered, machine-washable fabric with reinforced stitching that withstands aggressive chewing, drooling, and tossing. The corners are padded with food-grade silicone teething nubs — a parent-favorite feature that transforms story time into soothing relief during teething episodes. High-contrast black-and-white patterns on the back covers are optimized for newborn visual development, while the front covers burst with saturated hues that captivate older babies.

Compact enough to toss in a diaper bag or clip to a stroller with the built-in fabric loop, these books travel everywhere your family goes. Reading specialists note that early tactile interaction with books — turning pages, pointing at pictures, hearing a caregiver's voice — builds neural pathways essential for language acquisition. This set makes an unforgettable baby shower gift, arriving in a ribbon-tied keepsake box with a milestone bookplate inside each cover where parents can record the date of their baby's first "reading."`,
    keywords: ["books", "baby", "fabric", "soft", "learning", "reading"],
    ageRange: { min: 0, max: 2 },
    price: 24.99,
    inventory: 55,
    category: "developmental",
    dimensions: { lengthInches: 5.0, widthInches: 5.0, heightInches: 3.5, weightLbs: 0.6 },
    manufacturer: "LittlePage Co.",
    bestSellersRank: 8,
    rating: { stars: 4.8, numberOfRatings: 4102 },
  },
  {
    id: "toy-004",
    name: "Sensory Ball Set (10 pack)",
    image: "/product-images/toy-004.png",
    description: "Ten uniquely textured balls in different sizes, shapes, and colors. BPA-free, easy to grip, perfect for tummy time and tactile exploration.",
    marketingCopy: `Unleash a rainbow of tactile adventure with our Sensory Ball Set — ten irresistibly squeezable balls, each boasting a completely unique texture, size, and color. From nubby spikes to smooth ridges, gentle bumps to honeycomb dimples, every ball delivers a distinct sensory experience that captivates developing minds. The soft, pliable BPA-free material makes them easy for even the tiniest fingers to grasp, squeeze, and roll.

Designed in collaboration with pediatric therapists, these balls are more than just fun — they are tools for development. During tummy time, the balls encourage reaching and batting; during seated play, they promote bilateral coordination as babies transfer balls from hand to hand. Older toddlers enjoy sorting them by color, size, or texture, laying the groundwork for early math concepts like categorization and comparison. The varied diameters (from 2 to 4 inches) are intentionally sized above choking thresholds while remaining manageable for small hands.

The entire set is made from medical-grade silicone that withstands boiling, dishwasher cycles, and enthusiastic teething without degrading. Parents appreciate the included mesh drawstring bag that keeps all ten balls corralled in the toy bin or diaper bag. Whether deployed in the bathtub, on a playmat, or across the kitchen floor, these vibrant balls deliver hours of screen-free, imagination-driven sensory play that pediatricians and parents alike endorse wholeheartedly.`,
    keywords: ["sensory", "balls", "textures", "baby", "grip", "tactile"],
    ageRange: { min: 0, max: 2 },
    price: 16.99,
    inventory: 60,
    category: "developmental",
    dimensions: { lengthInches: 8.0, widthInches: 6.0, heightInches: 6.0, weightLbs: 0.7 },
    manufacturer: "SensorySprout",
    bestSellersRank: 22,
    rating: { stars: 4.5, numberOfRatings: 3211 },
  },
  {
    id: "toy-005",
    name: "Shape Sorting Barn",
    image: "/product-images/toy-005.png",
    description: "Red barn with chunky animal-shaped pieces that fit through matching doors. Teaches shapes, animals, and problem-solving. Solid hardwood construction.",
    marketingCopy: `Welcome to the friendliest farm in toyland! Our Shape Sorting Barn reimagines the classic shape sorter by replacing abstract geometric blocks with adorable, chunky animal silhouettes — a cow, pig, chicken, horse, sheep, and more — each one cut from solid hardwood and painted in cheerful, farm-authentic colors. Little farmers must match each animal to its uniquely shaped barn door, twisting and turning until the piece drops inside with a satisfying clunk.

The barn itself is a showpiece: hand-painted glossy red with white trim, a hinged roof that lifts open for easy piece retrieval, and a swinging main door that lets toddlers "free" the animals for imaginative barnyard play. Every edge is radiused, every surface sanded silk-smooth, and every paint layer is plant-based, non-toxic, and saliva-resistant. The chunky pieces are deliberately oversized to prevent any choking risk while giving small hands maximum gripping surface.

Beyond shape recognition, this toy quietly teaches persistence, spatial reasoning, and fine-motor planning — cognitive skills that early-childhood researchers link to later academic success. Parents and grandparents love the nostalgic charm and heirloom durability; many of our five-star reviews mention that this barn has survived multiple children and still looks nearly new. The Shape Sorting Barn arrives ready to play in a sturdy gift box, making it the perfect present for first and second birthdays.`,
    keywords: ["shapes", "sorting", "barn", "animals", "wooden", "problem-solving"],
    ageRange: { min: 1, max: 3 },
    price: 22.99,
    inventory: 38,
    category: "developmental",
    dimensions: { lengthInches: 8.0, widthInches: 6.5, heightInches: 7.0, weightLbs: 1.6 },
    manufacturer: "TinyTree Toys",
    bestSellersRank: 41,
    rating: { stars: 4.6, numberOfRatings: 1745 },
  },
  {
    id: "toy-006",
    name: "Wobble Penguin Toy",
    image: "/product-images/toy-006.png",
    description: "Weighted roly-poly penguin that wobbles, chimes, and always rights itself. Encourages reaching and batting. Smooth, baby-safe finish.",
    marketingCopy: `Meet Pippin the Wobble Penguin — a roly-poly pal whose cheerful chime and endless wobbling captivate babies from their very first swipe. Weighted at the base with a sealed steel ball bearing, Pippin sways dramatically when batted, nudged, or gently pushed, but always rights himself with a gentle, bell-like ring. The motion is mesmerizing for infants during tummy time, providing irresistible motivation to reach, bat, and eventually crawl toward their wobbly friend.

Pippin is carved from a single piece of European beechwood and finished with a hand-rubbed, food-grade beeswax and jojoba oil blend — no paint, no lacquer, no synthetic anything. The grain of the wood glows warmly through the finish, making each penguin subtly one-of-a-kind. At just 4.5 inches tall and perfectly contoured, Pippin fits naturally in a baby's palm, encouraging a pincer-like grip that therapists associate with pre-writing readiness.

This is the toy that grandparents remember from their own childhoods, updated with modern safety testing (CPSIA, ASTM F963, EN-71) and sustainable forestry certification. The minimalist, Scandinavian-inspired design looks beautiful on a nursery shelf, and the absence of batteries, buttons, or electronic components means there is truly nothing to break, charge, or replace. Pippin wobbles on and on — through babyhood, toddlerhood, and eventually into the cherished keepsake box.`,
    keywords: ["wobble", "penguin", "roly-poly", "chime", "baby"],
    ageRange: { min: 0, max: 1 },
    price: 12.99,
    inventory: 50,
    category: "developmental",
    dimensions: { lengthInches: 3.0, widthInches: 3.0, heightInches: 4.5, weightLbs: 0.5 },
    manufacturer: "Nordic Playthings",
    bestSellersRank: 67,
    rating: { stars: 4.9, numberOfRatings: 1203 },
  },
  {
    id: "toy-007",
    name: "Nesting & Stacking Cups (12 pack)",
    image: "/product-images/toy-007.png",
    description: "Twelve brightly colored cups that nest inside each other or stack into a tall tower. Numbers and drainage holes for bath play.",
    marketingCopy: `Twelve cups, infinite possibilities. Our Nesting & Stacking Cups are the Swiss Army knife of baby toys — equally at home on the living room floor, in the bathtub, or at the beach sandbox. Each cup is a different size and color, printed with a large numeral (1–12) on one side and a matching quantity of stars on the other, turning every play session into a stealth counting lesson.

The cups nest snugly for compact storage and stack into an impressively tall, 26-inch tower that toddlers delight in building — and demolishing. Fine drainage holes in the bottom of each cup transform them into shower toys, watering cans, and sand sifters, multiplying their play value across environments. Made from thick, BPA-free polypropylene with a matte finish that resists water spots and staining, these cups survive years of daily use without cracking, fading, or developing mildew.

Developmental scientists call nesting cups one of the most versatile learning toys ever designed, and our version delivers on that promise. Babies explore cause and effect by dropping objects inside; toddlers experiment with size seriation and spatial nesting; preschoolers practice numeral recognition and one-to-one counting. At under nine dollars, this set punches far above its price point — it is routinely cited in parenting forums as the single best-value toy on the market.`,
    keywords: ["nesting", "stacking", "cups", "bath", "counting"],
    ageRange: { min: 0, max: 3 },
    price: 8.99,
    inventory: 80,
    category: "developmental",
    dimensions: { lengthInches: 4.5, widthInches: 4.5, heightInches: 5.5, weightLbs: 0.4 },
    manufacturer: "SensorySprout",
    bestSellersRank: 5,
    rating: { stars: 4.7, numberOfRatings: 5840 },
  },
  {
    id: "toy-008",
    name: "Peek-a-Boo Bear",
    image: "/product-images/toy-008.png",
    description: "Interactive plush bear that plays peek-a-boo with a soft blanket. Giggles and talks in a friendly voice. Requires 2 AA batteries.",
    marketingCopy: `Get ready for giggles galore with our Peek-a-Boo Bear — an irresistibly cuddly companion who plays the world's most beloved baby game all by himself. Press his left paw and he lifts his velvety-soft blanket over his eyes, saying "Where's the bear?" in a gentle, warm voice. Press his right paw and he drops the blanket with a delighted "Peek-a-boo! I see you!" followed by an infectious giggle that makes babies — and adults — laugh every single time.

Beneath his butterscotch-brown plush exterior lies a thoughtfully engineered mechanism: a whisper-quiet motor drives the arm movement, and a premium speaker delivers crystal-clear audio at a volume calibrated by audiologists to be engaging yet safe for developing ears. The blanket is double-layered flannel, securely stitched to both paws so it can never be pulled off, lost, or become a suffocation hazard. Two AA batteries (included) power approximately 2,000 rounds of peek-a-boo — roughly three months of enthusiastic daily play.

Parents regularly tell us that Peek-a-Boo Bear is the one toy that reliably stops fussing in the car seat, soothes separation anxiety at daycare drop-off, and keeps babies entertained during diaper changes. The surface-washable plush and the ability to switch off the sound mechanism when Bear is serving cuddle-only duty make this a practical favorite as well as an emotional one. It arrives in a window gift box and is perennially one of our top baby-shower registry items.`,
    keywords: ["peek-a-boo", "bear", "interactive", "plush", "talking"],
    ageRange: { min: 0, max: 2 },
    price: 29.99,
    inventory: 32,
    category: "developmental",
    dimensions: { lengthInches: 10.0, widthInches: 8.0, heightInches: 12.0, weightLbs: 1.1 },
    manufacturer: "CuddleTech",
    bestSellersRank: 15,
    rating: { stars: 4.4, numberOfRatings: 3567 },
  },
  {
    id: "toy-009",
    name: "First Words Learning Tablet",
    image: "/product-images/toy-009.png",
    description: "Toy tablet with big colorful buttons for letters, numbers, and animals. Plays songs, sounds, and phrases. Volume control and auto-off.",
    marketingCopy: `Give your toddler their own screen-free "tablet" that actually teaches. Our First Words Learning Tablet features 30 oversized, brightly colored buttons — each one triggering a letter name, phonetic sound, animal name, or counting phrase spoken in a clear, friendly voice. Three learning modes (Explore, Quiz, and Music) keep the content fresh as your child grows, transitioning from simple sound exploration to interactive question-and-answer games that reinforce letter and number recognition.

The ergonomic, lightweight design is shaped to fit toddler hands and laps, with a gentle curve on the back that props it at a comfortable viewing angle. A two-position volume switch lets parents choose between full volume for active play and a quieter setting for car trips and restaurants. The intelligent auto-off timer preserves battery life (3 AAA batteries included) by shutting down after two minutes of inactivity — then greeting your child with a cheerful "Let's play!" when they pick it back up.

Early-literacy researchers contributed to the content design, ensuring that letter sounds follow systematic phonics progression and that the vocabulary exposure aligns with preschool readiness benchmarks. The sturdy ABS construction has passed repeated 4-foot drop tests, and the smooth, rounded casing wipes clean with a damp cloth. Parents describe it as "the toy that finally replaced my phone at the restaurant table" — high praise in any household with a toddler.`,
    keywords: ["tablet", "learning", "letters", "numbers", "electronic", "songs"],
    ageRange: { min: 1, max: 3 },
    price: 19.99,
    inventory: 44,
    category: "developmental",
    dimensions: { lengthInches: 9.5, widthInches: 7.0, heightInches: 1.2, weightLbs: 0.6 },
    manufacturer: "BrightMinds Electronics",
    bestSellersRank: 29,
    rating: { stars: 4.3, numberOfRatings: 2190 },
  },
  {
    id: "toy-010",
    name: "Wooden Peg Puzzle – Animals",
    image: "/product-images/toy-010.png",
    description: "Chunky wooden puzzle with 8 animal pieces and easy-grip pegs. Full-color pictures underneath each piece. Durable and splinter-free.",
    marketingCopy: `Our Wooden Peg Puzzle is the gateway puzzle — the very first jigsaw experience that builds the spatial confidence toddlers need for increasingly complex puzzles down the road. Eight friendly animal shapes (dog, cat, fish, bird, horse, frog, turtle, and butterfly) sit in precision-routed recesses on a sturdy plywood board. Each piece sports a chunky, lacquered wooden peg that tiny fingers can grip, twist, and lift with ease, eliminating the frustration that thinner puzzles often cause.

Beneath every piece hides a full-color illustration of the same animal in its natural habitat — a delightful "reveal" moment that turns the puzzle into a naming and storytelling game. The artwork is printed directly onto the wood with UV-cured ink that won't peel, scratch, or fade with repeated play. The board itself is finished with a satin, water-resistant coating that survives juice spills, drool, and enthusiastic table-banging.

Crafted in a family-owned European workshop with FSC-certified birch plywood, this puzzle reflects three generations of woodworking expertise. Every edge is CNC-rounded and hand-inspected; every peg is press-fitted and glue-reinforced for wobble-free durability. Montessori educators recommend peg puzzles like this one as among the first "work" a toddler can complete independently, building a sense of accomplishment that fuels intrinsic motivation for years to come.`,
    keywords: ["puzzle", "wooden", "pegs", "animals", "toddler"],
    ageRange: { min: 1, max: 3 },
    price: 11.99,
    inventory: 65,
    category: "developmental",
    dimensions: { lengthInches: 11.5, widthInches: 8.5, heightInches: 1.0, weightLbs: 0.7 },
    manufacturer: "TinyTree Toys",
    bestSellersRank: 19,
    rating: { stars: 4.8, numberOfRatings: 2475 },
  },
  // ── PLUSH & STUFFED ANIMALS ────────────────────────────────────────────
  {
    id: "toy-011",
    name: "Soft Plush Elephant",
    image: "/product-images/toy-011.png",
    description: "Ultra-soft cuddly elephant plush toy with crinkle ears and a squeaker. Machine washable and made with baby-safe materials.",
    marketingCopy: `There is something magical about the moment a baby wraps their arms around our Soft Plush Elephant for the first time — and refuses to let go. Crafted from premium microfiber plush that is impossibly soft to the touch, this 12-inch elephant features oversized floppy ears lined with crinkle fabric that rustles enticingly with every squeeze, and a hidden squeaker in the tummy that rewards curious presses with a cheerful chirp.

Every material in this elephant has been selected with newborn safety as the top priority. The embroidered eyes eliminate any choking hazard from buttons or plastic parts. The polyester fill is hypoallergenic and maintains its loft wash after wash — and yes, the entire elephant is fully machine washable and dryer safe, because we know that a beloved lovey needs frequent trips through the laundry. Reinforced double stitching at every seam ensures ears, trunk, and tail stay firmly attached through years of enthusiastic love.

Our Soft Plush Elephant has become a social-media favorite, with thousands of parents sharing photos of their little ones snuggling, sleeping, and adventuring with their elephant companion. Available in classic grey, blush pink, and sky blue, this plush makes an ideal first gift — one that often becomes the most treasured possession in a child's early years. Each elephant arrives in a reusable cotton drawstring bag printed with a sweet "My First Friend" message.`,
    keywords: ["plush", "stuffed animal", "elephant", "soft", "cuddly"],
    ageRange: { min: 0, max: 3 },
    price: 19.99,
    inventory: 62,
    category: "plush",
    dimensions: { lengthInches: 12.0, widthInches: 7.0, heightInches: 10.0, weightLbs: 0.5 },
    manufacturer: "CuddleTech",
    bestSellersRank: 3,
    rating: { stars: 4.8, numberOfRatings: 6721 },
  },
  {
    id: "toy-012",
    name: "Giant Teddy Bear (36 inch)",
    image: "/product-images/toy-012.png",
    description: "Three-foot-tall ultra-plush teddy bear with velvety-soft fur and a big satin bow. Premium polyester fill. A classic cuddle companion.",
    marketingCopy: `Go big or go home — our Giant Teddy Bear stands a full three feet tall and delivers hugs on an epic scale. Covered in velvety-soft, dense-pile plush fabric in a warm honey-brown, this bear features a classic stitched nose, warm amber safety eyes, and a luxurious satin bow tied at the neck. The premium virgin polyester fill is distributed to create a satisfyingly squishy body, supportive arms perfect for leaning against, and a lap-sized tummy that doubles as a pillow.

This is the bear that makes birthdays and holidays unforgettable — the one that gets a gasp and a squeal when the wrapping paper comes off. Children use it as a reading buddy, a movie-watching companion, a fort wall, and an impromptu chair. The generous size means it grows with your child, transitioning from nursery sentinel to bedroom confidant to dorm-room nostalgia piece. Despite its impressive stature, the bear weighs only about four pounds, so even young children can drag it from room to room.

Quality is sewn into every seam. The outer fabric passes 100,000-cycle Martindale abrasion testing, meaning it resists pilling and matting even after years of daily cuddling. The fill is flame-retardant without chemical additives, meeting California TB-117 standards naturally. Spot cleaning is recommended for the surface, but the removable bow can be machine washed separately. From our family to yours, this Giant Teddy Bear is a lifetime friend waiting to happen.`,
    keywords: ["teddy bear", "giant", "plush", "cuddly", "oversized"],
    ageRange: { min: 2, max: 10 },
    price: 49.99,
    inventory: 18,
    category: "plush",
    dimensions: { lengthInches: 20.0, widthInches: 16.0, heightInches: 36.0, weightLbs: 4.0 },
    manufacturer: "HugFactory",
    bestSellersRank: 48,
    rating: { stars: 4.5, numberOfRatings: 2103 },
  },
  {
    id: "toy-013",
    name: "Plush Unicorn with Rainbow Mane",
    image: "/product-images/toy-013.png",
    description: "Sparkly unicorn with a flowing rainbow mane and tail. Shimmery horn and wings. 14 inches tall, surface washable.",
    marketingCopy: `Dreams really do come true with our Plush Unicorn — a dazzling, 14-inch companion whose flowing rainbow mane, shimmery golden horn, and iridescent wings make every child feel like they have their very own magical best friend. The body is crafted from cloud-soft white plush, while the mane and tail cascade in vibrant strands of red, orange, yellow, green, blue, and violet that children love to brush, braid, and style.

The wings are reinforced with a flexible internal wire that lets kids pose them in flight position or fold them flat for snuggling. Subtle glitter threads are woven throughout the fabric — enough sparkle to catch the light beautifully without shedding onto furniture or clothing. The embroidered eyes have long, sweeping lashes and a sweet expression that children find instantly endearing, and the soft pink hooves are detailed with a sculpted horseshoe pattern.

Our unicorn has become the go-to gift for unicorn-obsessed kids aged three and up, with thousands of glowing reviews praising its softness, durability, and "wow factor." Unlike cheaper alternatives that flatten after a few weeks, our premium polyfill maintains the unicorn's shape and fluffiness month after month. Surface washable with a damp cloth and mild soap, this mythical friend is ready for tea parties, bedtime stories, and every adventure in between.`,
    keywords: ["unicorn", "rainbow", "sparkly", "plush", "fantasy"],
    ageRange: { min: 3, max: 8 },
    price: 24.99,
    inventory: 40,
    category: "plush",
    dimensions: { lengthInches: 14.0, widthInches: 6.0, heightInches: 14.0, weightLbs: 0.7 },
    manufacturer: "Sparkle Kingdom",
    bestSellersRank: 27,
    rating: { stars: 4.7, numberOfRatings: 3450 },
  },
  {
    id: "toy-014",
    name: "Weighted Anxiety Buddy – Dinosaur",
    image: "/product-images/toy-014.png",
    description: "2-lb weighted plush dinosaur designed to provide calming pressure. Lavender-scented insert. Removable weight for machine washing.",
    marketingCopy: `Meet Rex, the dinosaur who makes big feelings feel smaller. Our Weighted Anxiety Buddy is a huggable, 2-pound plush T-Rex designed with input from child psychologists to provide the deep-pressure sensory input that helps anxious, overstimulated, or restless children self-regulate. The evenly distributed weight — achieved through food-grade glass microbeads sealed in an inner pouch — mimics the comforting sensation of a warm hug, activating the parasympathetic nervous system to promote calm.

Tucked inside Rex's belly is a removable sachet filled with dried French lavender buds, adding a gentle, naturally soothing aromatherapy element. When the lavender fades, simply replace the sachet (refills available separately) or add a drop of essential oil. The outer plush shell is made from Minky dot fabric — the same ultra-soft material used in premium baby blankets — in a friendly green with embroidered eyes and a stitched smile that radiates reassurance.

Practical design details make Rex a daily-use companion: the inner weight pod velcros out so the outer shell can be machine washed and tumble dried, and the compact 11-inch size fits easily into a backpack, making Rex a discreet comfort object for school, travel, or doctor visits. Therapists, teachers, and parents report that children who use weighted companions like Rex show measurable reductions in fidgeting, bedtime resistance, and meltdown duration. Rex isn't just a toy — he's a coping tool wrapped in a hug.`,
    keywords: ["weighted", "calming", "anxiety", "dinosaur", "sensory"],
    ageRange: { min: 3, max: 10 },
    price: 34.99,
    inventory: 25,
    category: "plush",
    dimensions: { lengthInches: 11.0, widthInches: 7.0, heightInches: 9.0, weightLbs: 2.0 },
    manufacturer: "CalmCritters",
    bestSellersRank: 56,
    rating: { stars: 4.8, numberOfRatings: 1876 },
  },
  {
    id: "toy-015",
    name: "Bashful Bunny",
    image: "/product-images/toy-015.png",
    description: "Irresistibly soft bunny with long floppy ears and a bobble tail. Suede-soft fabric in a warm beige. 12 inches from ear to toe.",
    marketingCopy: `The Bashful Bunny is, quite simply, the gold standard of cuddly companions — and one touch of its legendarily soft fur tells you exactly why. This 12-inch bunny is crafted from our signature plush fabric, a proprietary polyester blend so velvety that adults find themselves absent-mindedly stroking it during conversation. The long, floppy ears are perfectly weighted to drape over a child's arm, and the round bobble tail adds a playful finishing touch.

In a warm, neutral beige that complements any nursery aesthetic, Bashful Bunny has a gently understated expression — two small brown eyes and a barely-there pink nose — that invites children to project their own emotions onto their friend. Psychologists note that this intentional design choice makes Bashful an ideal transitional object, helping children process feelings and develop empathy through imaginative dialogue with their bunny.

Crafted by a premium London plush house, the Bashful Bunny is their most beloved creation. Each bunny passes rigorous quality checks and meets EN-71, ASTM, and CPSIA safety standards. The polyester fill is 100% recycled, reflecting a commitment to sustainability. Machine washable on a gentle cycle (air dry recommended to maintain maximum softness), this bunny is ready to be the constant companion through naps, road trips, first days of school, and every moment in between.`,
    keywords: ["bunny", "rabbit", "soft", "plush"],
    ageRange: { min: 0, max: 6 },
    price: 22.99,
    inventory: 55,
    category: "plush",
    dimensions: { lengthInches: 12.0, widthInches: 5.0, heightInches: 5.0, weightLbs: 0.3 },
    manufacturer: "London Plush Co.",
    bestSellersRank: 7,
    rating: { stars: 4.9, numberOfRatings: 8934 },
  },
  {
    id: "toy-016",
    name: "Ocean Friends Plush Set (5 pack)",
    image: "/product-images/toy-016.png",
    description: "Five sea creature plushies: whale, octopus, sea turtle, dolphin, and clownfish. Each 8 inches, bright colors, and embroidered details.",
    marketingCopy: `Dive into cuddly undersea adventures with our Ocean Friends Plush Set — five irresistible sea creatures that bring the magic of the ocean to bedrooms, bathtubs, and backyard pretend play. The collection includes a cobalt-blue whale with a spout of white plush, a coral-pink octopus with eight dangling tentacles, a sage-green sea turtle with a patterned shell, a silver-grey dolphin frozen mid-leap, and a bright orange-and-white clownfish with flowing fabric fins.

Each plush is 8 inches long, stuffed with resilient polyester fill, and detailed with precision embroidery — no glued-on parts that could come loose. The fabrics were chosen for tactile variety: the whale is smooth and silky, the octopus is nubby velour, the turtle has a textured shell panel, the dolphin is sleek microfiber, and the clownfish has crinkly fins. This deliberate sensory variation enriches play and gives children who are sensitive to textures a range of comforting options.

Marine biologists consulted on anatomical accuracy, so while these plushies are adorably stylized, their proportions and markings are true enough to spark real conversations about ocean life. Hang tags include fun facts about each species and a QR code linking to a kid-friendly ocean conservation video. The set arrives in a reusable zippered pouch printed with a coral reef scene — perfect for travel, sleepovers, or keeping the ocean crew together in the toy bin.`,
    keywords: ["ocean", "sea", "whale", "octopus", "dolphin", "set"],
    ageRange: { min: 2, max: 7 },
    price: 29.99,
    inventory: 30,
    category: "plush",
    dimensions: { lengthInches: 10.0, widthInches: 8.0, heightInches: 4.0, weightLbs: 0.8 },
    manufacturer: "DeepBlue Plush",
    bestSellersRank: 62,
    rating: { stars: 4.6, numberOfRatings: 1534 },
  },
  {
    id: "toy-017",
    name: "Puppets – Woodland Animals (4 pack)",
    image: "/product-images/toy-017.png",
    description: "Four hand puppets: fox, owl, bear, and raccoon. Detailed stitching, movable mouths, and perfect sizing for kids' and adults' hands.",
    marketingCopy: `Bring the forest to life with our Woodland Animals Hand Puppets — four beautifully crafted characters that turn any couch, table, or doorway into a stage. The cast includes a clever russet fox, a wise tawny owl, a friendly brown bear, and a mischievous grey raccoon, each one featuring a fully movable mouth, expressive embroidered eyes, and detailed touches like the fox's white-tipped tail and the raccoon's signature mask.

Sized to fit both children's and adults' hands (the opening stretches from about 4 to 8 inches), these puppets encourage multi-generational storytelling. Slip one on, open and close the mouth, and watch a child's eyes light up as the character "speaks." Speech therapists frequently recommend hand puppets as tools for language development, as children who are shy about speaking aloud will often talk freely through a puppet persona, building vocabulary, narrative skills, and social confidence.

The puppets are constructed from high-quality plush and faux-fur fabrics with triple-stitched seams at all stress points. Each puppet is approximately 10 inches from head to wrist hem, with enough body length to cover an adult forearm. Machine washable on a gentle cycle, they stand up to the rigors of daily puppet shows, classroom circle time, and bedtime storytelling marathons. The set arrives in a drawstring "forest bag" printed with pine trees and toadstools, ready for gifting.`,
    keywords: ["puppets", "hand puppet", "fox", "owl", "woodland", "storytelling"],
    ageRange: { min: 2, max: 8 },
    price: 26.99,
    inventory: 35,
    category: "plush",
    dimensions: { lengthInches: 10.0, widthInches: 6.0, heightInches: 3.0, weightLbs: 0.6 },
    manufacturer: "StageWhiskers",
    bestSellersRank: 73,
    rating: { stars: 4.7, numberOfRatings: 1102 },
  },
  {
    id: "toy-018",
    name: "Plush Dragon – Glow-in-the-Dark",
    image: "/product-images/toy-018.png",
    description: "Fierce yet huggable dragon plush with glow-in-the-dark wings and belly scales. Charges in light, glows for up to 20 minutes. 16 inches.",
    marketingCopy: `Guard your dreams with our Glow-in-the-Dark Dragon — a 16-inch plush beast that is fearsome by name but cuddly by nature, and whose wings and belly scales emit an ethereal green glow when the lights go out. The photoluminescent fabric charges under any light source (sunlight, lamp, or overhead) and glows for up to 20 minutes, providing just enough nighttime magic to ease children through the transition from wakefulness to sleep.

The dragon's body is crafted from plush emerald-green fabric with an intricately embroidered chest of overlapping scales, while the wings spread wide in a translucent mesh-over-plush construction that maximizes the glow effect. A curling tail, ridged spine, and tiny felt horns complete the look, striking the perfect balance between "cool dragon" and "snuggly friend." The amber safety eyes have a reflective quality that catches the glow beautifully, giving the dragon an almost alive presence in a dim room.

Parents of children with mild nyctophobia (fear of the dark) report that this dragon has been genuinely transformative — providing a comforting, child-controlled light source that avoids the stimulation of electronic night lights. The glow fabric is non-toxic and contains no batteries, LEDs, or electronics whatsoever; it works purely through phosphorescent pigment bonded to the textile fibers. Machine washable and built to withstand nightly duty as a pillow, headboard guardian, and adventure companion, this dragon earns its place in the plush hall of fame.`,
    keywords: ["dragon", "glow", "plush", "fantasy", "night"],
    ageRange: { min: 3, max: 10 },
    price: 27.99,
    inventory: 28,
    category: "plush",
    dimensions: { lengthInches: 16.0, widthInches: 18.0, heightInches: 8.0, weightLbs: 0.9 },
    manufacturer: "Sparkle Kingdom",
    bestSellersRank: 45,
    rating: { stars: 4.6, numberOfRatings: 2267 },
  },
  // ── BUILDING & CONSTRUCTION ────────────────────────────────────────────
  {
    id: "toy-019",
    name: "Mega Block Builder Set (80 pieces)",
    image: "/product-images/toy-019.png",
    description: "Large, chunky building blocks perfect for small hands. Includes 80 colorful interlocking pieces in a storage bag. Compatible with major brands.",
    marketingCopy: `Big ideas start with big blocks. Our Mega Block Builder Set puts 80 chunky, vibrantly colored interlocking blocks into the hands of toddlers and preschoolers, inviting them to build towers, houses, animals, vehicles, and anything else their imaginations can dream up. Each block is generously sized — the smallest piece is 3 inches long — making them perfectly graspable for little fingers that lack the dexterity for smaller construction systems.

The blocks connect with a satisfying snap and pull apart with just the right amount of resistance, building fine motor strength without causing frustration. Primary colors dominate the palette (red, blue, yellow, green), supplemented by orange, purple, and white specialty pieces. The set is fully compatible with all major large-block construction brands, so it integrates seamlessly into any existing collection. The included zippered canvas storage bag encourages cleanup routines and makes the set portable for grandparents' houses, playdates, and road trips.

Manufactured from premium ABS plastic that exceeds phthalate-free and heavy-metal-free standards, these blocks are built to survive years of creative construction and enthusiastic demolition. Parents appreciate the rounded corners, the absence of any stickers or decals that could peel off, and the dishwasher-safe durability that makes sanitizing a breeze. Construction play at this age lays the groundwork for spatial reasoning, planning, and collaborative problem-solving — foundational STEM skills wrapped in pure, joyful play.`,
    keywords: ["blocks", "building", "construction", "creative", "mega"],
    ageRange: { min: 1, max: 5 },
    price: 24.99,
    inventory: 55,
    category: "building",
    dimensions: { lengthInches: 15.0, widthInches: 10.0, heightInches: 10.0, weightLbs: 2.5 },
    manufacturer: "BlockStorm",
    bestSellersRank: 16,
    rating: { stars: 4.6, numberOfRatings: 4230 },
  },
  {
    id: "toy-020",
    name: "Robot Builder (450 pieces)",
    image: "/product-images/toy-020.png",
    description: "Build your own motorized robot with this 450-piece construction set. Includes motor, LED lights, and step-by-step instructions for 3 different robot designs.",
    marketingCopy: `Future engineers, meet your first real challenge. Our Robot Builder set packs 450 precision-molded, interlocking bricks, a battery-powered motor, red and blue LED light modules, and a detailed instruction booklet with step-by-step guides for three distinct robot designs: a walking biped, a rolling tank-bot, and a crab-like scuttler. But the real magic happens when builders go off-script, combining pieces in unexpected ways to create their own original robotic inventions.

The motor unit features a geared output shaft that provides enough torque to animate legs, wheels, arms, and rotating turrets. The LED modules snap into standard brick studs and cast a satisfying glow through translucent elements, giving finished robots an authentic sci-fi presence. All electronic components run on 2 AA batteries (included) with a clearly accessible on/off switch, and every wire connection is snap-fit — no soldering, no tools, no adult intervention required.

Each brick is manufactured to tolerances within 0.005mm, ensuring seamless compatibility with major brick brands and a tight, wobble-free fit that keeps even complex models structurally sound. The set arrives in a compartmentalized storage case with labeled bags for each build, an element inventory checklist, and a poster-sized inspiration sheet showing 20 additional models designed by our fan community. This is the set that turns a child's bedroom floor into a robotics lab — and might just spark a lifelong passion for engineering.`,
    keywords: ["robot", "building", "construction", "STEM", "motor", "LED"],
    ageRange: { min: 7, max: 14 },
    price: 49.99,
    inventory: 18,
    category: "building",
    dimensions: { lengthInches: 15.0, widthInches: 10.0, heightInches: 3.5, weightLbs: 2.2 },
    manufacturer: "BrickForge",
    bestSellersRank: 38,
    rating: { stars: 4.7, numberOfRatings: 1890 },
  },
  {
    id: "toy-021",
    name: "Marble Run Deluxe (120 pieces)",
    image: "/product-images/toy-021.png",
    description: "Build incredible marble runs with 120 translucent pieces including funnels, spinners, and chutes. Includes 30 glass marbles.",
    marketingCopy: `Physics has never been this much fun. Our Marble Run Deluxe set contains 120 translucent, jewel-toned pieces — straight chutes, curved ramps, spiral funnels, paddle wheels, see-saw tippers, and multi-exit splitters — that snap together vertically to create gravity-powered marble highways limited only by a builder's imagination. Thirty brilliant glass marbles are included, each one catching and refracting light as it races through the translucent track, creating a mesmerizing visual spectacle.

The pieces are engineered with interlocking columns and notched connectors that hold firm during play yet disassemble easily for rebuilding. A double-thick base plate provides a stable foundation for towers that can reach over three feet tall, and included support columns prevent mid-run wobble. The set comes with 10 challenge cards showing tested designs of increasing complexity — from a simple three-piece slide for beginners to an elaborate, multi-path masterpiece that uses every single piece in the box.

Beyond the sheer entertainment value, marble runs are one of the most effective toys for teaching physics concepts intuitively: gravity, momentum, velocity, potential and kinetic energy, and cause-and-effect relationships all come alive with every marble drop. The translucent construction adds a bonus engineering lesson as children can see exactly where a marble slows, accelerates, or gets stuck, then iterate on their design. Cleanup is simplified by the included drawstring marble bag and the flat-packing capability of the disassembled pieces.`,
    keywords: ["marble", "run", "building", "gravity", "construction"],
    ageRange: { min: 4, max: 10 },
    price: 38.99,
    inventory: 24,
    category: "building",
    dimensions: { lengthInches: 14.0, widthInches: 10.0, heightInches: 5.0, weightLbs: 3.1 },
    manufacturer: "GravityWorks",
    bestSellersRank: 31,
    rating: { stars: 4.5, numberOfRatings: 2678 },
  },
  {
    id: "toy-022",
    name: "Magnetic Tile Set (100 pieces)",
    image: "/product-images/toy-022.png",
    description: "Translucent magnetic tiles in squares, triangles, and hexagons. Snap together to build 3D structures, castles, and vehicles. Strong magnets, beveled edges.",
    marketingCopy: `Click. Stack. Create. Our 100-piece Magnetic Tile Set has become the must-have construction toy in classrooms and playrooms across the country — and for good reason. Each translucent tile contains securely riveted neodymium magnets along every edge, allowing pieces to snap together with a deeply satisfying click that children find almost addictive. The set includes 40 squares, 30 equilateral triangles, 10 right triangles, 10 hexagons, and 10 specialty shapes (arches, doors, and windows), providing enormous creative versatility.

The translucent, jewel-toned ABS plastic catches and filters light beautifully, turning ordinary structures into stained-glass masterpieces when placed near a window or lamp. Children naturally progress from flat patterns and simple cubes to elaborate 3D castles, bridges, vehicles, and geometric sculptures — internalizing concepts like symmetry, surface area, and structural integrity through hands-on experimentation. The magnetic attraction works through all edges in any orientation, so there are no wrong connections, making this set extraordinarily accessible even for three-year-olds.

Every tile features ultrasonically welded seams and beveled edges that protect both small fingers and hardwood floors. The magnets are fully enclosed with no risk of exposure, and the entire set passes CPSIA and ASTM F963 testing with wide margins. An included idea booklet showcases 30 builds with step-by-step instructions, but the open-ended nature of the set means most children quickly abandon the booklet in favor of their own architectural visions. This set is compatible with all major magnetic tile brands, making it a perfect starter or expansion set.`,
    keywords: ["magnetic", "tiles", "construction", "STEM", "3D", "geometry"],
    ageRange: { min: 3, max: 10 },
    price: 54.99,
    inventory: 30,
    category: "building",
    dimensions: { lengthInches: 13.0, widthInches: 11.0, heightInches: 3.0, weightLbs: 4.2 },
    manufacturer: "MagnaBuild",
    bestSellersRank: 9,
    rating: { stars: 4.8, numberOfRatings: 7215 },
  },
  {
    id: "toy-023",
    name: "Frontier Cabin Log Set",
    image: "/product-images/toy-023.png",
    description: "Classic 150-piece log building set to build a frontier cabin, lookout tower, and more. Real wood logs with plastic roof and figures.",
    marketingCopy: `An American classic since 1916, log building sets have been teaching children the fundamentals of architecture and construction for over a century — and our Frontier Cabin set carries that proud tradition forward with 150 pieces of genuine maple-stained hardwood logs, green plastic roof slabs, a chimney, a swinging door, and two frontier settler figures. The notched ends interlock precisely, allowing children to build walls that stand straight and true without glue or fasteners.

This set includes instructions for three distinct builds — a cozy frontier cabin with a working door, a tall lookout tower with a wraparound observation deck, and a stable with corral fence — but experienced builders will quickly move on to their own architectural designs. The logs come in four lengths (1.5, 3, 4.5, and 6 inches), enabling surprisingly sophisticated construction with windows, doorways, multi-room layouts, and even second stories.

There is a tactile warmth to real wood that plastic can never replicate, and children respond to it instinctively — the smooth, rounded logs feel alive in their hands, smell faintly of natural wood, and produce a satisfying clack when stacked. Every piece is sanded, sealed, and inspected to be splinter-free, and the wood is sourced from sustainably managed North American forests. The set arrives in a classic cylindrical canister with a carrying handle that doubles as long-term storage, just like the original packaging that delighted children a century ago.`,
    keywords: ["log building", "cabin", "wood", "classic", "building"],
    ageRange: { min: 3, max: 8 },
    price: 34.99,
    inventory: 22,
    category: "building",
    dimensions: { lengthInches: 12.0, widthInches: 6.0, heightInches: 6.0, weightLbs: 2.8 },
    manufacturer: "Heritage Playthings",
    bestSellersRank: 52,
    rating: { stars: 4.4, numberOfRatings: 1890 },
  },
  {
    id: "toy-024",
    name: "Rod & Connector Roller Coaster Building Set",
    image: "/product-images/toy-024.png",
    description: "Build a working roller coaster over 3 feet tall with 500+ rod-and-connector pieces. Motorized chain lift and looping track. Engineering fun.",
    marketingCopy: `Thrill-seekers, start your engines — our Roller Coaster Building Set lets you construct a fully operational amusement park ride right on your bedroom floor. With over 500 rods, connectors, track pieces, and specialty elements, this set builds into a roller coaster that stands over three feet tall and features a motorized chain lift, a stomach-dropping first hill, a full vertical loop, and a banking turn that sends the included coaster car racing along the track at breathtaking speed.

The battery-powered motor (2 AA batteries included) drives the chain lift with enough torque to haul the coaster car to the summit repeatedly, creating a mesmerizing cycle of climb, drop, loop, and return. The rod-and-connector system teaches structural engineering principles organically: children quickly discover why triangular bracing prevents wobble, how counterweights stabilize tall structures, and what track angles produce the most thrilling rides. The 84-page instruction booklet includes diagrams for two additional ride designs — a pendulum swing and a Ferris wheel — using the same piece set.

The pieces are manufactured in the USA from glass-filled nylon rods and ABS connectors, delivering a snap-fit connection that is both secure and easily reversible. The color-coded pieces simplify assembly, and every element is compatible with the broader rod-and-connector ecosystem for limitless expansion. This set consistently ranks among the top STEM toys for kids aged 7-14, earning praise from parents, educators, and engineering professionals alike for making complex physics concepts accessible and wildly entertaining.`,
    keywords: ["rod connector", "roller coaster", "engineering", "motorized", "building"],
    ageRange: { min: 7, max: 14 },
    price: 44.99,
    inventory: 15,
    category: "building",
    dimensions: { lengthInches: 20.0, widthInches: 14.0, heightInches: 5.0, weightLbs: 3.5 },
    manufacturer: "ConnectBuild Inc.",
    bestSellersRank: 44,
    rating: { stars: 4.5, numberOfRatings: 1645 },
  },
  {
    id: "toy-025",
    name: "Wooden Block Set (100 pieces)",
    image: "/product-images/toy-025.png",
    description: "Classic hardwood blocks in natural and primary colors. Arches, cylinders, rectangles, triangles, and columns. Sanded smooth, non-toxic finish.",
    marketingCopy: `Some toys are timeless because they are perfect — and our 100-Piece Wooden Block Set is exactly that. One hundred solid hardwood blocks in a rainbow of shapes — rectangles, squares, triangles, arches, cylinders, columns, half-circles, and bridges — arrive ready to become towers, cities, bridges, castles, zoos, and anything else a child's boundless imagination can conceive. Half the blocks are finished in rich primary colors (red, blue, yellow, green) while the other half showcase the natural grain of sustainably harvested beechwood, creating a warm, aesthetically pleasing palette.

Each block is precision-cut on CNC routers to exact dimensional standards, ensuring that towers built 20 blocks high remain stable and that same-shaped blocks are truly interchangeable. Every surface is sanded to a 320-grit smoothness and sealed with a plant-based, non-toxic finish that is safe for mouthing, resistant to moisture, and easy to wipe clean. The weight and density of real hardwood gives these blocks a satisfying heft that lightweight plastic alternatives simply cannot match — a quality that children perceive intuitively and that keeps them engaged in construction play far longer.

Educators from Montessori, Waldorf, and Reggio Emilia traditions all place unit blocks at the center of their curricula, citing decades of research linking block play to spatial reasoning, mathematical thinking, collaborative problem-solving, and narrative development. This set arrives in a sturdy wooden crate with rope handles that doubles as a pull wagon and a storage bin, teaching organization and cleanup habits alongside creativity. It is the set that grandparents give knowing it will be played with for a decade and treasured for a lifetime.`,
    keywords: ["wooden", "blocks", "classic", "shapes", "building"],
    ageRange: { min: 2, max: 6 },
    price: 29.99,
    inventory: 40,
    category: "building",
    dimensions: { lengthInches: 14.0, widthInches: 10.0, heightInches: 5.0, weightLbs: 5.5 },
    manufacturer: "TinyTree Toys",
    bestSellersRank: 14,
    rating: { stars: 4.8, numberOfRatings: 3567 },
  },
  {
    id: "toy-026",
    name: "Fort Building Kit (85 pieces)",
    image: "/product-images/toy-026.png",
    description: "Snap-together rods and connectors to build indoor forts, tunnels, and castles. Drape blankets over the frame. Stores flat in a carry bag.",
    marketingCopy: `Every child deserves a secret hideout, and our Fort Building Kit makes it possible in minutes — no engineering degree required. Eighty-five lightweight but sturdy fiberglass rods and multi-angle ABS connectors snap together to create a skeletal framework that, once draped with bedsheets, blankets, or towels, transforms into a fort, castle, tunnel, tent, or spaceship large enough for two to three children to sit inside comfortably.

The connector hubs accept rods at multiple angles — 90°, 120°, and 135° — enabling flat-roofed bunkers, peaked tents, domed igloos, and curved tunnels. Children naturally experiment with structural stability, learning which configurations stand strong and which collapse, iterating until they achieve the fortress of their dreams. The rods are 2 feet long, lightweight enough for a four-year-old to handle solo, yet rigid enough to support a heavy fleece blanket without sagging.

When playtime ends, the entire kit disassembles in minutes and packs flat into the included carry bag, taking up no more closet space than a folded umbrella. Parents adore the screen-free, imagination-driven play this kit inspires — rainy-day forts, reading nooks, sleepover tents, and dramatic-play hideaways. The kit is BPA-free, phthalate-free, and built to withstand the repeated assembly-disassembly cycles of daily use. Compatible with our separately sold fort fabric covers, clip lights, and expansion rod packs for even more creative possibilities.`,
    keywords: ["fort", "building", "indoor", "construction", "rods"],
    ageRange: { min: 4, max: 10 },
    price: 39.99,
    inventory: 20,
    category: "building",
    dimensions: { lengthInches: 24.0, widthInches: 6.0, heightInches: 6.0, weightLbs: 3.0 },
    manufacturer: "FortCraft",
    bestSellersRank: 36,
    rating: { stars: 4.4, numberOfRatings: 2890 },
  },
  {
    id: "toy-027",
    name: "Architecture Brick Set – City Skyline",
    image: "/product-images/toy-027.png",
    description: "850-piece micro-brick set to build iconic city landmarks. Includes display base and nameplate. Detailed instructions for 5 buildings.",
    marketingCopy: `For builders who crave detail, precision, and display-worthy results, our Architecture Brick Set – City Skyline delivers a sophisticated building experience that bridges the gap between toy and art. Eight hundred and fifty micro-bricks — each one roughly half the size of standard construction bricks — assemble into five iconic urban landmarks: a soaring glass skyscraper, an art-deco theater, a modern museum, a brick-and-ivy townhouse, and a steel-arched bridge, all mounted on a shared display base with an engraved city nameplate.

The micro scale demands focus and patience that older children and teens find deeply satisfying — a meditative, almost zen-like building experience that produces a finished model with astonishing architectural detail. Tiny windows, rooftop antennas, awnings, balconies, and interior lighting channels (LED strip sold separately) bring the skyline to life. The instruction booklet includes historical notes on the architectural styles represented, connecting the build to real-world design principles.

Every micro-brick is injection-molded to precision tolerances from ABS plastic, ensuring a friction-fit connection that holds without glue yet can be gently disassembled for modifications. The completed skyline model measures approximately 16 inches wide, making a striking shelf or desk display. This set appeals to the same audience that gravitates toward architectural model kits and scale models — detail-oriented builders ages 10 and up who appreciate the intersection of art, engineering, and craftsmanship.`,
    keywords: ["architecture", "micro", "bricks", "city", "display", "detailed"],
    ageRange: { min: 10, max: 14 },
    price: 39.99,
    inventory: 16,
    category: "building",
    dimensions: { lengthInches: 16.0, widthInches: 4.0, heightInches: 6.0, weightLbs: 1.8 },
    manufacturer: "BrickForge",
    bestSellersRank: 87,
    rating: { stars: 4.6, numberOfRatings: 978 },
  },
  {
    id: "toy-028",
    name: "Gear & Chain Reaction Set",
    image: "/product-images/toy-028.png",
    description: "Build chain-reaction machines with 60+ gears, levers, pulleys, and dominoes. Includes 10 challenge cards. STEM learning through play.",
    marketingCopy: `Cause meets effect in spectacular fashion with our Gear & Chain Reaction Set — a STEM toy that teaches mechanical engineering by letting kids build Rube Goldberg-style machines that are as hilarious as they are educational. The set includes over 60 components: interlocking gears in five sizes, lever arms, pulley wheels with string, ramps, chutes, a spring launcher, a pendulum, 20 wooden dominoes, and a bell that rings triumphantly at the end of a successful chain reaction.

The modular base plates snap together in any configuration, allowing children to design chain reactions that span an entire tabletop or zigzag across the floor. Each of the 10 included challenge cards presents a starting configuration and an end goal — ring the bell, launch the ball, raise the flag — challenging builders to fill in the missing mechanical steps. The difficulty ramps from simple two-step sequences for beginners to elaborate eight-step Goldbergian contraptions that require every component in the box.

This is engineering at its most joyful: the trial-and-error process of getting a chain reaction to work from start to finish teaches iterative design, mechanical advantage, energy transfer, and the patience to debug a system one link at a time. The pieces are compatible with standard construction bricks, opening the door to even more elaborate creations. Teachers and homeschool parents report that this set is the single most engaging STEM activity they have ever introduced, with children voluntarily spending hours designing, testing, failing, and ultimately succeeding.`,
    keywords: ["gears", "chain reaction", "STEM", "engineering", "machines"],
    ageRange: { min: 5, max: 12 },
    price: 32.99,
    inventory: 26,
    category: "building",
    dimensions: { lengthInches: 14.0, widthInches: 10.0, heightInches: 4.0, weightLbs: 2.4 },
    manufacturer: "GravityWorks",
    bestSellersRank: 55,
    rating: { stars: 4.5, numberOfRatings: 1567 },
  },
  // ── VEHICLES ───────────────────────────────────────────────────────────
  {
    id: "toy-029",
    name: "Wooden Train Set",
    image: "/product-images/toy-029.png",
    description: "32-piece wooden train set with tracks, bridges, trees, and two magnetic trains. Compatible with all major wooden railway systems.",
    marketingCopy: `All aboard for imagination! Our 32-Piece Wooden Train Set lays the foundation for countless hours of open-ended railway adventures. The set includes 20 track pieces (straights, curves, and a Y-switch), a graceful arched bridge, two magnetic-coupling train cars with rolling wheels, and scenic accessories — three evergreen trees, a station platform, and a crossing sign — all crafted from sustainably harvested beechwood with smooth, splinter-free finishes.

The track pieces connect via the universal tongue-and-groove system, making them fully compatible with Thomas & Friends, Brio, Melissa & Doug, and all other major wooden railway brands. This interoperability means the set works as a perfect starter kit or a meaningful expansion to an existing collection. The magnetic train couplings are strong enough to pull a chain of cars around curves without disconnecting, yet gentle enough for toddler fingers to separate and reattach.

Wooden train play is a cornerstone of early-childhood education programs worldwide, praised for developing spatial planning, narrative storytelling, cooperative play, and fine motor coordination. Children learn to design layouts that actually work — connecting curves into circles, integrating bridges into elevation changes, and troubleshooting dead-end configurations. The natural wood material adds a warmth and beauty that plastic sets lack, and the durability ensures that this train set will chug along happily through multiple generations of young conductors.`,
    keywords: ["train", "wooden", "tracks", "railroad", "vehicles"],
    ageRange: { min: 2, max: 6 },
    price: 39.99,
    inventory: 33,
    category: "vehicles",
    dimensions: { lengthInches: 14.0, widthInches: 10.0, heightInches: 4.0, weightLbs: 2.5 },
    manufacturer: "TinyTree Toys",
    bestSellersRank: 25,
    rating: { stars: 4.7, numberOfRatings: 3120 },
  },
  {
    id: "toy-030",
    name: "Remote Control Racing Car",
    image: "/product-images/toy-030.png",
    description: "Sleek RC racing car with 2.4GHz remote control for interference-free racing. Reaches speeds up to 15mph with responsive steering.",
    marketingCopy: `Ready, set, go! Our Remote Control Racing Car delivers the adrenaline rush of high-speed racing in a package that is durable, intuitive, and interference-free. The sleek, low-profile body is aerodynamically designed with front and rear spoilers that provide genuine downforce at speed, while the 2.4GHz digital radio system ensures that up to six cars can race simultaneously without signal crosstalk — perfect for neighborhood competitions and birthday party showdowns.

Under the glossy polycarbonate shell lies a powerful brushed motor driving the rear wheels through a precision differential, giving the car a top speed of approximately 15 mph and responsive proportional steering that lets drivers feather turns rather than simply jerking left or right. The independent front suspension absorbs bumps on pavement, sidewalks, and short grass, and the rubber tires provide excellent grip on smooth surfaces. A rechargeable NiMH battery pack delivers 20 minutes of run time per charge, with a USB charger included.

The ergonomic pistol-grip controller fits comfortably in children's hands with a trigger-style throttle and a wheel-style steering input, mimicking real racing controls. Parents appreciate the included speed limiter that caps velocity at 7 mph for beginners, removable once drivers develop confidence and skill. The car's body panels are designed to flex on impact rather than crack, and replacement parts are readily available, ensuring that this racer stays on the track for years of competitive fun.`,
    keywords: ["RC", "remote control", "car", "racing", "vehicle", "speed"],
    ageRange: { min: 5, max: 12 },
    price: 32.99,
    inventory: 29,
    category: "vehicles",
    dimensions: { lengthInches: 14.0, widthInches: 7.0, heightInches: 5.0, weightLbs: 1.8 },
    manufacturer: "SpeedDemon RC",
    bestSellersRank: 33,
    rating: { stars: 4.4, numberOfRatings: 2456 },
  },
  {
    id: "toy-031",
    name: "Dump Truck Sandbox Toy",
    image: "/product-images/toy-031.png",
    description: "Oversized dump truck with a working tilting bed. Tough enough for sand, dirt, and outdoor play. BPA-free, UV-resistant plastic.",
    marketingCopy: `Built like the real thing — just a whole lot more fun. Our Dump Truck Sandbox Toy is an oversized, indestructible workhorse designed to haul sand, gravel, dirt, and whatever else young construction crews can load into its generous tilting bed. The hydraulic-style hinge lets children raise the bed with one hand and watch their payload cascade out the tailgate, mimicking the satisfying dump action of real construction vehicles.

The truck is molded from thick-wall, UV-stabilized polyethylene that resists cracking, fading, and brittleness even after seasons of outdoor exposure. The oversized wheels roll smoothly through sand, grass, and dirt, and the wide axle spacing prevents tipping even when fully loaded. At 15 inches long, the truck is big enough to be impressive yet light enough for a two-year-old to push, pull, and carry. There are absolutely no small parts, screws, or stickers — the entire vehicle is built from three molded pieces that snap together permanently.

Sandbox play is a multisensory developmental powerhouse, and having the right tools amplifies the experience enormously. Our dump truck encourages heavy-work proprioceptive input (loading and hauling), bilateral coordination (steering while pushing), and collaborative play (one child loads while another drives). The truck cleans up with a garden hose in seconds and stores outdoors year-round without deterioration. Available in classic construction yellow with black accents, this is the sandbox toy that every playground needs.`,
    keywords: ["dump truck", "sandbox", "outdoor", "construction", "vehicle"],
    ageRange: { min: 2, max: 6 },
    price: 18.99,
    inventory: 48,
    category: "vehicles",
    dimensions: { lengthInches: 15.0, widthInches: 7.5, heightInches: 8.0, weightLbs: 1.2 },
    manufacturer: "ToughTruck Toys",
    bestSellersRank: 20,
    rating: { stars: 4.6, numberOfRatings: 2890 },
  },
  {
    id: "toy-032",
    name: "Die-Cast Emergency Vehicles (5 pack)",
    image: "/product-images/toy-032.png",
    description: "Five metal emergency vehicles: fire truck, ambulance, police car, helicopter, and rescue boat. Opening doors and rolling wheels.",
    marketingCopy: `When duty calls, this fleet answers. Our Die-Cast Emergency Vehicles set puts five authentically detailed first-responder vehicles into the hands of young heroes: a ladder fire truck with an extendable boom, an ambulance with opening rear doors, a police cruiser with a working light bar (press-activated LED), a rescue helicopter with spinning rotors, and a coast guard boat with a removable stretcher. Each vehicle is die-cast zinc alloy with plastic accents, delivering the satisfying weight and metallic sheen that makes die-cast vehicles a perennial collector favorite.

The attention to detail is remarkable for this price point — the fire truck features tiny painted gauges, the ambulance interior shows a molded gurney, and the police car has a detailed dashboard visible through the windshield. Doors, hoods, and tailgates open and close with spring-loaded precision, and the free-rolling metal axles let vehicles zoom across hard floors with impressive momentum. Each vehicle is approximately 5 inches long, sized perfectly for small hands and compatible with most standard playmat roads and parking garages.

Emergency vehicle play is one of the most enduring forms of imaginative play, and this set provides the full roster for elaborate rescue scenarios. Children develop narrative skills, cooperative play strategies, and community awareness as they dispatch their fleet to imagined emergencies. The vehicles arrive in a window display box that doubles as a garage, and each one includes a fun-fact card about the real-world role of that emergency service. Built to survive years of high-speed rescues and dramatic crashes.`,
    keywords: ["die-cast", "emergency", "fire truck", "police", "ambulance"],
    ageRange: { min: 3, max: 8 },
    price: 21.99,
    inventory: 42,
    category: "vehicles",
    dimensions: { lengthInches: 10.0, widthInches: 6.0, heightInches: 3.0, weightLbs: 1.5 },
    manufacturer: "MetalMotors",
    bestSellersRank: 28,
    rating: { stars: 4.5, numberOfRatings: 3102 },
  },
  {
    id: "toy-033",
    name: "Monster Truck Rally Set",
    image: "/product-images/toy-033.png",
    description: "Two friction-powered monster trucks with a crush-car ramp and jump. Oversized tires and detailed suspension. No batteries needed.",
    marketingCopy: `Sunday! Sunday! Sunday! Bring the monster truck rally home with our two-truck set that includes everything needed for backyard (or bedroom floor) demolition derbies. Two beefy, friction-powered monster trucks — "Bonecrusher" in flame red and "Thunder Beast" in electric blue — feature oversized knobby rubber tires, detailed independent suspension that actually flexes over obstacles, and aggressive body kits with roll cages, headlight decals, and sponsor graphics.

The included stunt arena kit contains a crush-car ramp (three flattened cardboard "junk cars" to drive over), a tabletop jump ramp with adjustable angle, and a landing zone with distance markers. Simply push each truck forward to wind the friction motor, release, and watch it tear across the floor with surprising speed and torque. No batteries, no remote controls, no charging cables — just pure mechanical power that children control entirely with their own hands and timing.

Monster truck play taps into a visceral thrill that kids of all ages find irresistible — the combination of speed, power, and controlled destruction. The trucks are built from impact-resistant ABS with metal axles that survive spectacular crashes and rollovers. The rubber tires grip smooth floors, carpet, and outdoor pavement equally well, and the wide wheelbase prevents most tip-overs during hard turns. Replacement crush-car kits are available, but many families report that their kids prefer to build their own obstacles from cardboard boxes, creating an evolving, increasingly elaborate rally course.`,
    keywords: ["monster truck", "rally", "ramp", "jump", "friction"],
    ageRange: { min: 3, max: 8 },
    price: 24.99,
    inventory: 35,
    category: "vehicles",
    dimensions: { lengthInches: 12.0, widthInches: 8.0, heightInches: 6.0, weightLbs: 1.6 },
    manufacturer: "SpeedDemon RC",
    bestSellersRank: 40,
    rating: { stars: 4.4, numberOfRatings: 1987 },
  },
  {
    id: "toy-034",
    name: "RC Helicopter",
    image: "/product-images/toy-034.png",
    description: "Indoor/outdoor RC helicopter with gyro stabilization and LED lights. 3-channel control for up/down, left/right, forward/back. USB charging.",
    marketingCopy: `Take to the skies with our RC Helicopter — a gyro-stabilized indoor/outdoor flyer that turns beginners into confident pilots in minutes. The built-in 6-axis gyroscope continuously corrects for drift, tilt, and rotation, making this helicopter dramatically easier to fly than older RC designs. Three channels of control (throttle for altitude, rudder for rotation, and cyclic for forward/backward movement) provide genuine flight dynamics without overwhelming new pilots.

The helicopter features a durable alloy frame that absorbs crashes without bending, flexible composite rotor blades that flex on impact rather than snapping, and bright LED running lights (red port, green starboard) that make the aircraft easy to track in flight and spectacular to fly at dusk. The rechargeable lithium-polymer battery provides approximately 8 minutes of flight time per 40-minute USB charge, and a low-battery indicator on the controller alerts pilots to land before power cuts out unexpectedly.

The 2.4GHz digital radio system supports up to four helicopters flying simultaneously, enabling head-to-head races and formation flying. The infrared-assisted controller displays a real-time signal strength meter and features a one-touch auto-hover button that freezes altitude, letting beginners focus on directional control. The included landing pad and instruction manual with illustrated flight school lessons take pilots from hover practice through figure-eights to confident outdoor flying in a structured, confidence-building progression.`,
    keywords: ["helicopter", "RC", "flying", "indoor", "LED"],
    ageRange: { min: 8, max: 14 },
    price: 29.99,
    inventory: 20,
    category: "vehicles",
    dimensions: { lengthInches: 10.5, widthInches: 3.0, heightInches: 5.0, weightLbs: 0.8 },
    manufacturer: "SkyBound Toys",
    bestSellersRank: 71,
    rating: { stars: 4.2, numberOfRatings: 1345 },
  },
  {
    id: "toy-035",
    name: "Slot Car Racing Track",
    image: "/product-images/toy-035.png",
    description: "Two-lane electric slot car racing set with 16 feet of track, two cars, and lap counter. Includes loops and crossover sections.",
    marketingCopy: `Experience the golden age of racing with our Slot Car Racing Track — a two-lane electric circuit that brings the roar of motorsport to your living room floor. Sixteen feet of precision-molded track snaps together in minutes, forming a figure-eight layout with a dramatic loop-the-loop, a crossover intersection where cars thread past each other at speed, and banked curves that let drivers carry maximum velocity through the turns.

Two officially scaled 1:43 race cars — a Ferrari-red GT and a Gulf-blue Le Mans prototype — sit in the guide slots with spring-loaded braids that draw current from the track's electrified rails. The handheld speed controllers feature a progressive trigger that teaches throttle management: squeeze too hard and the car flies off the track on curves; feather the trigger perfectly and you shave tenths off your lap time. A digital lap counter tracks up to 99 laps per lane, settling arguments about who crossed the finish line first with electronic certainty.

Slot car racing is a tactile, analog thrill that screens simply cannot replicate — the buzz of the motor, the smell of the carbon braids, the kinesthetic feedback of managing speed through corners, and the social energy of side-by-side racing. The track is expandable with additional straight, curve, chicane, and bridge sections (sold separately), allowing racers to design their own Grand Prix circuits. The transformer operates on a safe 12V DC supply with thermal overload protection, and the entire set stores flat in its original box for space-efficient storage.`,
    keywords: ["slot car", "racing", "electric", "track", "speed"],
    ageRange: { min: 6, max: 14 },
    price: 59.99,
    inventory: 14,
    category: "vehicles",
    dimensions: { lengthInches: 24.0, widthInches: 16.0, heightInches: 4.0, weightLbs: 4.5 },
    manufacturer: "CircuitSpeed",
    bestSellersRank: 65,
    rating: { stars: 4.5, numberOfRatings: 1120 },
  },
  {
    id: "toy-036",
    name: "Wooden Fire Engine Push Toy",
    image: "/product-images/toy-036.png",
    description: "Solid wood fire engine with a working ladder, spinning wheels, and two firefighter peg people. Non-toxic water-based paint.",
    marketingCopy: `Nee-naw, nee-naw! Our Wooden Fire Engine Push Toy races to the rescue with classic charm and heirloom-quality construction. Carved from solid European beechwood, this fire engine features a rotating ladder that extends and retracts, four free-spinning wheels with rubber treads for smooth rolling, and two removable firefighter peg people who ride in the open cab, ready to respond to imaginary emergencies anywhere in the house.

Every detail is designed to invite storytelling: the ladder pivots 360 degrees and telescopes from 4 to 7 inches, the side panels display a painted hose reel and shield emblem, and the peg firefighters are shaped to stand independently for off-truck play. The bright red paint is water-based, non-toxic, and meets all European and American safety standards. The wood is left unfinished on the underside so you can see — and smell — the quality of the timber. Children love the substantial weight and satisfying rolling momentum that only solid wood can deliver.

Push-along vehicle play is a critical developmental milestone that bridges gross motor activity (pushing while walking or crawling) with imaginative narrative play (creating emergency scenarios). Our fire engine is sized to be graspable by a one-year-old yet visually compelling enough for a four-year-old's elaborate fire station setup. It makes a beautiful nursery-shelf display between play sessions and an unforgettable gift that parents genuinely appreciate for its craftsmanship and durability.`,
    keywords: ["fire engine", "wooden", "push toy", "firefighter"],
    ageRange: { min: 1, max: 4 },
    price: 19.99,
    inventory: 36,
    category: "vehicles",
    dimensions: { lengthInches: 9.0, widthInches: 4.0, heightInches: 5.5, weightLbs: 1.0 },
    manufacturer: "TinyTree Toys",
    bestSellersRank: 43,
    rating: { stars: 4.7, numberOfRatings: 1678 },
  },
  {
    id: "toy-037",
    name: "Build-Your-Own Car Kit (3 pack)",
    image: "/product-images/toy-037.png",
    description: "Three take-apart vehicles with a kid-safe electric drill. 50+ interchangeable parts let kids customize each car, truck, and racer.",
    marketingCopy: `Vroom goes the drill! Our Build-Your-Own Car Kit gives young mechanics three take-apart vehicles — a sedan, a pickup truck, and a race car — along with a kid-safe battery-powered electric drill that lets them disassemble and reassemble each vehicle with realistic, hands-on satisfaction. Over 50 interchangeable parts (wheels, bumpers, spoilers, exhaust pipes, toolboxes, and light bars) snap on and off with the included drill bits, encouraging children to customize their rides in endless configurations.

The electric drill operates at a safe, slow RPM with a soft-start motor and a rubberized grip sized for children's hands. The drill bits (Phillips and flathead) engage with toy-safe oversized screws that thread smoothly into each vehicle's chassis. Children quickly learn the mechanical logic of assembly — wheels before bumpers, frame before body — developing sequential planning and fine motor skills while having an absolute blast pretending to be real auto engineers.

The vehicles are made from rounded, impact-resistant ABS plastic in bright primary colors, and the screws are large enough to eliminate any choking hazard. Parents love the low-mess, screen-free engagement this kit delivers — children routinely spend 45-60 minutes designing and redesigning their fleet. The kit includes a parts tray that organizes components during builds, reducing frustration and post-play cleanup. Replacement part packs and expansion vehicles are available separately, fueling an ever-growing garage for your budding mechanic.`,
    keywords: ["build", "take-apart", "drill", "customize", "cars"],
    ageRange: { min: 3, max: 7 },
    price: 27.99,
    inventory: 30,
    category: "vehicles",
    dimensions: { lengthInches: 14.0, widthInches: 10.0, heightInches: 5.0, weightLbs: 1.8 },
    manufacturer: "WrenchWorks",
    bestSellersRank: 35,
    rating: { stars: 4.6, numberOfRatings: 2234 },
  },
  {
    id: "toy-038",
    name: "RC Submarine – Explorer",
    image: "/product-images/toy-038.png",
    description: "Waterproof radio-controlled submarine that dives and surfaces in pools, tubs, and ponds. 6-channel control with LED headlights.",
    marketingCopy: `Dive deep with our RC Submarine Explorer — a fully waterproof, radio-controlled submersible that brings underwater adventures to swimming pools, bathtubs, and calm ponds. The six-channel controller manages forward, reverse, left turn, right turn, dive, and surface commands, giving pilots complete three-dimensional control of their vessel. Twin propellers provide forward thrust while a ballast-trim motor adjusts buoyancy, allowing the sub to cruise at any depth from surface to pool floor.

Bright LED headlights illuminate the underwater world ahead, creating a stunning visual effect in darkened pools and nighttime tub sessions. The submarine's hull is transparent on the upper half, revealing the internal motor and control mechanisms — an unexpected engineering lesson that children find fascinating. The waterproof seal is pressure-tested to depths of 6 feet, far exceeding the depth of any residential pool or tub, and the rechargeable lithium battery provides approximately 15 minutes of dive time per charge via the included USB cable.

The controller communicates on 27MHz radio frequency, which penetrates water effectively for responsive control even when the sub is fully submerged. An auto-surface safety feature activates if signal is lost, ensuring the sub always returns to the surface for recovery. At 14 inches long, the Explorer is large enough to track visually yet nimble enough to navigate between pool noodles and diving toys. This is the RC vehicle that makes pool time an event — and the one that adults inevitably "borrow" when the kids aren't looking.`,
    keywords: ["submarine", "RC", "waterproof", "pool", "underwater"],
    ageRange: { min: 8, max: 14 },
    price: 34.99,
    inventory: 15,
    category: "vehicles",
    dimensions: { lengthInches: 14.0, widthInches: 4.0, heightInches: 4.5, weightLbs: 1.2 },
    manufacturer: "SkyBound Toys",
    bestSellersRank: 82,
    rating: { stars: 4.3, numberOfRatings: 876 },
  },
  // ── ARTS & CRAFTS ──────────────────────────────────────────────────────
  {
    id: "toy-039",
    name: "Modeling Dough Mega Pack (24 colors)",
    image: "/product-images/toy-039.png",
    description: "24 cans of classic modeling dough in a rainbow of colors. Non-toxic modeling compound that sparks creativity and imagination.",
    marketingCopy: `Twenty-four cans of pure creative potential — our Modeling Dough Mega Pack delivers the full rainbow and then some. From classic red, blue, and yellow to specialty shades like neon pink, metallic gold, and deep purple, this collection provides the palette for any project a young sculptor can envision. Each 3-ounce can is factory-fresh with the signature squish, smell, and satisfying moldability that has made modeling dough a childhood staple for decades.

This unique wheat-based, non-toxic formula is soft enough for two-year-olds to squeeze yet firm enough for eight-year-olds to sculpt detailed figures and structures. The compound air-dries slowly, giving children ample working time, and can be refreshed with a few drops of water if left out overnight. The wide color range encourages color mixing experiments — blending yellow and blue to discover green is a science lesson and a magic trick rolled into one, and the resulting marbled effects are uniquely beautiful.

Occupational therapists recommend modeling dough as one of the most effective tools for developing hand and finger strength, a prerequisite for pencil grip and handwriting readiness. Rolling, pinching, cutting, and stamping motions engage the small muscles of the hand in ways that screen-based activities simply cannot replicate. The 24-can format is ideal for classrooms, art stations, and families with multiple children, and the resealable cans keep unused colors fresh for months. Whether building a pizza shop, sculpting a menagerie, or just enjoying the meditative pleasure of squishing, this set delivers limitless creative mileage.`,
    keywords: ["modeling dough", "clay", "modeling", "creative", "art", "colors"],
    ageRange: { min: 2, max: 8 },
    price: 18.99,
    inventory: 70,
    category: "arts-crafts",
    dimensions: { lengthInches: 12.0, widthInches: 9.0, heightInches: 4.0, weightLbs: 3.2 },
    manufacturer: "Creative Compound Co.",
    bestSellersRank: 6,
    rating: { stars: 4.7, numberOfRatings: 8945 },
  },
  {
    id: "toy-040",
    name: "Watercolor Painting Kit",
    image: "/product-images/toy-040.png",
    description: "Complete watercolor set with 36 colors, 3 brushes, mixing palette, and a pad of watercolor paper. Perfect for budding artists.",
    marketingCopy: `Unleash the artist within with our complete Watercolor Painting Kit — everything a budding painter needs to create beautiful, expressive artwork from their very first brushstroke. The set includes 36 vibrant watercolor cakes in a hinged tin palette, three professional-quality synthetic brushes (round sizes 2, 6, and 10), a ceramic mixing palette with six wells, and a 20-sheet pad of 140 lb cold-press watercolor paper sized at 9x12 inches.

The watercolor cakes are formulated with high pigment loads for vivid, lightfast results that rival adult-grade paints. They activate instantly with a wet brush, blend beautifully on the palette, and produce transparent layers that children can build up gradually to create depth and complexity. The colors span the full spectrum, including warm and cool versions of each primary, a set of earth tones for natural subjects, and a metallic gold that adds sparkle to any composition. The brushes feature ergonomic triangular handles that promote proper grip and prevent rolling off the table.

Art educators praise watercolor as the ideal first painting medium because it forgives over-application (simply add more water), teaches color theory through transparent layering, and produces results that feel genuinely artistic rather than merely childish. The included paper is specifically formulated to handle water without warping, pilling, or bleeding through, ensuring that finished paintings look polished enough to frame. The hinged tin closes securely for travel and stacks neatly in art supply storage, making this kit as practical as it is inspiring.`,
    keywords: ["art", "painting", "watercolor", "creative", "brushes"],
    ageRange: { min: 5, max: 12 },
    price: 22.99,
    inventory: 42,
    category: "arts-crafts",
    dimensions: { lengthInches: 12.0, widthInches: 9.0, heightInches: 1.5, weightLbs: 1.1 },
    manufacturer: "ArtSpark Studios",
    bestSellersRank: 37,
    rating: { stars: 4.6, numberOfRatings: 2156 },
  },
  {
    id: "toy-041",
    name: "Fashion Design Studio",
    image: "/product-images/toy-041.png",
    description: "Design and create real fabric fashions with this complete studio set. Includes mannequin, fabric, pins, stencils, and a sketchbook.",
    marketingCopy: `Project Runway starts here. Our Fashion Design Studio gives aspiring designers everything they need to sketch, pattern, and create real wearable fashions — or to dress the included 12-inch mannequin in original couture creations. The kit contains a fully adjustable dress form mannequin, 10 fat quarters of coordinating fabrics (cotton, satin, and tulle), a pincushion with safety pins, 20 reusable stencils for bodices, skirts, and sleeves, a 60-page fashion sketchbook with figure templates, and a set of 24 fabric markers for custom prints and embellishments.

The sketchbook's figure templates are diverse in body type and skin tone, reflecting the real-world diversity of fashion consumers and encouraging inclusive design thinking. Each template page includes a notes section for recording fabric choices, color palettes, and design inspiration — mirroring the process used by real fashion designers. The stencils are cut from flexible, washable mylar, and the fabric markers are permanent on fabric but washable from skin, striking the perfect balance between creative freedom and parental sanity.

Fashion design engages a remarkable range of skills: visual-spatial reasoning (draping 3D fabric from 2D patterns), mathematical thinking (measuring, scaling, symmetry), fine motor precision (cutting, pinning, folding), and aesthetic judgment (color harmony, proportion, texture contrast). This studio set respects the intelligence of its audience — it is not a dumbed-down craft kit but a genuine design toolkit that produces results children are genuinely proud to show off. Additional fabric packs, embellishment kits, and advanced pattern booklets are available separately for designers who outgrow the starter set.`,
    keywords: ["fashion", "design", "sewing", "creative", "fabric", "art"],
    ageRange: { min: 8, max: 14 },
    price: 34.99,
    inventory: 20,
    category: "arts-crafts",
    dimensions: { lengthInches: 14.0, widthInches: 10.0, heightInches: 5.0, weightLbs: 2.0 },
    manufacturer: "ArtSpark Studios",
    bestSellersRank: 68,
    rating: { stars: 4.5, numberOfRatings: 1345 },
  },
  {
    id: "toy-042",
    name: "Kinetic Sand Deluxe Set",
    image: "/product-images/toy-042.png",
    description: "4 lbs of magical kinetic sand in 6 colors with molds, tools, and a sand tray. Mess-free sensory play that never dries out.",
    marketingCopy: `It flows through your fingers like a slow-motion waterfall, packs into shapes with satisfying precision, and somehow never makes a mess — welcome to the mesmerizing world of Kinetic Sand. Our Deluxe Set includes 4 pounds of this remarkable material in six vibrant colors (beach, blue, green, pink, purple, and white), plus a generous sand tray with raised edges, 10 detailed molds (castle, pyramid, starfish, shell, and more), and 5 sculpting tools for cutting, stamping, and shaping.

Kinetic Sand's secret is a proprietary blend of 98% ultra-fine sand and 2% polydimethylsiloxane — a non-toxic, hypoallergenic polymer that binds the grains into a flowing, moldable mass. The result is a material that sticks to itself but not to hands, clothing, or surfaces, making cleanup as simple as pressing loose grains into the main mass. Unlike traditional sand, kinetic sand never dries out, never gets crusty, and maintains its magical properties indefinitely in its resealable containers.

Therapists use kinetic sand extensively for sensory processing support, stress relief, and fine motor development. The act of squeezing, molding, and slicing the sand provides deep proprioceptive input that many children find profoundly calming. Parents love that the sand tray contains all play within a defined space, and that the sand itself is wheat-free, gluten-free, and casein-free, making it safe for children with common allergies. The vibrant colors can be mixed to create new shades or kept separate for rainbow creations — either way, the tactile experience is genuinely addictive for children and adults alike.`,
    keywords: ["kinetic sand", "sensory", "molding", "sand", "tactile"],
    ageRange: { min: 3, max: 8 },
    price: 28.99,
    inventory: 40,
    category: "arts-crafts",
    dimensions: { lengthInches: 14.0, widthInches: 10.0, heightInches: 4.0, weightLbs: 4.5 },
    manufacturer: "SensorySprout",
    bestSellersRank: 18,
    rating: { stars: 4.7, numberOfRatings: 5432 },
  },
  {
    id: "toy-043",
    name: "Friendship Bracelet Maker",
    image: "/product-images/toy-043.png",
    description: "Weave colorful friendship bracelets with the included loom, 120 skeins of thread, beads, and charms. Pattern book with 20 designs.",
    marketingCopy: `Craft, share, connect — our Friendship Bracelet Maker turns simple embroidery thread into wearable works of art that children create and exchange as tokens of friendship. The set includes a cushioned, rotating loom that holds threads taut and organized, 120 skeins of premium embroidery floss in 30 colors, a collection of alphabet beads, metallic charms (hearts, stars, peace signs, and butterflies), and a spiral-bound pattern book with step-by-step photo instructions for 20 designs ranging from simple three-strand braids to complex chevron and diamond patterns.

The rotating loom is the feature that transforms this from a frustrating tangle of threads into a smooth, enjoyable crafting experience. Threads clip securely into numbered slots, the disk rotates so the working area always faces the crafter, and a built-in measuring guide ensures consistent bracelet lengths every time. Even children who have struggled with knotting and braiding find success quickly, building confidence and fine motor dexterity with every completed bracelet.

Friendship bracelet making is experiencing a massive resurgence among tweens and teens, fueled by social media sharing and concert culture. This kit provides everything needed to ride that wave while developing patience, pattern recognition, color theory, and the social skills involved in gift-giving and reciprocity. The compact loom and thread organizer pack into the included zippered carry case for camp, sleepovers, and road trips. Extra thread packs, charm collections, and advanced pattern booklets are available to feed the bracelet-making obsession as it grows.`,
    keywords: ["bracelet", "friendship", "weaving", "jewelry", "craft"],
    ageRange: { min: 6, max: 12 },
    price: 16.99,
    inventory: 50,
    category: "arts-crafts",
    dimensions: { lengthInches: 9.0, widthInches: 7.0, heightInches: 2.5, weightLbs: 0.8 },
    manufacturer: "CraftStar",
    bestSellersRank: 42,
    rating: { stars: 4.5, numberOfRatings: 2789 },
  },
  {
    id: "toy-044",
    name: "Scratch Art Kit (50 sheets)",
    image: "/product-images/toy-044.png",
    description: "50 rainbow scratch-off sheets with wooden styluses and stencils. Scratch away the black coating to reveal vibrant colors beneath.",
    marketingCopy: `Reveal the rainbow hiding beneath the darkness with our Scratch Art Kit — 50 sheets of specially coated paper that conceal vivid, multicolored layers beneath a matte black surface. Using the included wooden styluses (one fine-tip for detail, one broad-edge for shading), children scratch away the black coating to reveal stunning rainbow, holographic, or solid-color patterns underneath. The result is artwork that looks almost professionally produced, delivering an instant sense of pride and accomplishment.

The kit includes three types of scratch sheets: 25 rainbow (multicolored stripes beneath the black), 15 holographic (shimmering silver that catches light from every angle), and 10 solid-color (gold, copper, or neon beneath the black). Eight reusable plastic stencils provide guided designs — mandala, butterfly, rocket, unicorn, and more — for children who want structure, while the blank sheets invite free-form drawing for those who prefer creative freedom. The fine-tip stylus produces lines thin enough for detailed portraits and lettering, making this kit suitable for a wide age range.

Scratch art is uniquely satisfying because the medium guarantees visually striking results regardless of drawing skill — even random scratches look beautiful when they reveal rainbow layers underneath. This makes the kit particularly empowering for children who feel intimidated by blank paper. Art therapists use scratch art for its calming, meditative quality; the repetitive scratching motion and gradual color reveal produce a mindful flow state. Each sheet can be used once, making finished pieces feel precious and gift-worthy.`,
    keywords: ["scratch art", "rainbow", "drawing", "craft", "creative"],
    ageRange: { min: 4, max: 10 },
    price: 12.99,
    inventory: 60,
    category: "arts-crafts",
    dimensions: { lengthInches: 10.0, widthInches: 7.0, heightInches: 1.0, weightLbs: 0.5 },
    manufacturer: "ArtSpark Studios",
    bestSellersRank: 30,
    rating: { stars: 4.6, numberOfRatings: 3456 },
  },
  {
    id: "toy-045",
    name: "Pottery Wheel Studio",
    image: "/product-images/toy-045.png",
    description: "Electric pottery wheel with air-dry clay, sculpting tools, and paints. Create real bowls, vases, and figurines. Foot pedal speed control.",
    marketingCopy: `Shape, sculpt, create — our Pottery Wheel Studio brings the ancient art of wheel-throwing to your kitchen table with a compact, electric pottery wheel and everything needed to produce real ceramic-style pieces. The studio includes a variable-speed motorized wheel with foot pedal control, 3 pounds of air-dry clay in natural terracotta and white, a set of 8 wire-loop and wooden sculpting tools, 6 acrylic paints, 2 brushes, a sponge, and a splash guard to keep the workspace contained.

The wheel motor operates on a safe 12V DC supply (AC adapter included) with smooth, vibration-free rotation that allows even beginners to center clay and pull walls with reasonable success. The foot pedal provides intuitive speed control — press gently for slow, contemplative shaping; press firmly for the faster speeds needed for trimming and finishing. The included quick-start guide walks new potters through their first bowl in 15 easy steps, with photos showing proper hand positions, pressure techniques, and common mistakes to avoid.

Air-dry clay eliminates the need for a kiln entirely; finished pieces dry to hardness in 24-48 hours and can then be sanded smooth and painted with the included acrylics for a beautiful, display-worthy finish. Children experience the deeply satisfying process of transforming a formless lump of clay into a functional object — a bowl that holds fruit, a vase that holds flowers, a mug that (with a food-safe sealant, sold separately) holds hot chocolate. This is pottery reimagined for home use, delivering the meditative joy of clay work without the industrial equipment.`,
    keywords: ["pottery", "wheel", "clay", "sculpting", "ceramic"],
    ageRange: { min: 8, max: 14 },
    price: 44.99,
    inventory: 16,
    category: "arts-crafts",
    dimensions: { lengthInches: 12.0, widthInches: 12.0, heightInches: 6.0, weightLbs: 4.0 },
    manufacturer: "ClayDay Studios",
    bestSellersRank: 74,
    rating: { stars: 4.3, numberOfRatings: 1123 },
  },
  {
    id: "toy-046",
    name: "Tie-Dye Kit (18 colors)",
    image: "/product-images/toy-046.png",
    description: "Everything needed to tie-dye up to 15 items. 18 squeeze bottles of non-toxic dye, rubber bands, gloves, and instruction booklet.",
    marketingCopy: `Groovy vibes guaranteed! Our Tie-Dye Kit puts 18 vibrant, non-toxic dye colors into squeeze bottles with precision applicator tips, giving young artists everything they need to transform plain white t-shirts, socks, tote bags, and pillowcases into one-of-a-kind wearable art. The included dye powder is pre-measured — just add water, shake, and start squeezing. Enough dye is included to treat approximately 15 items, making this kit perfect for birthday parties, summer camp activities, and family craft afternoons.

The instruction booklet illustrates 12 classic tie-dye techniques with step-by-step photos: spiral, bullseye, crumple, accordion fold, stripe, sunburst, heart, peace sign, and four advanced patterns that produce professional-grade results. Rubber bands, protective gloves, and plastic table covers are all included — the only thing you need to supply is the white fabric and a sense of adventure. The dyes are fiber-reactive, meaning they chemically bond with natural fibers (cotton, rayon, linen) for vibrant, wash-fast results that won't fade for years.

Tie-dye is a rare craft that appeals across the entire age spectrum: six-year-olds love the messy, unpredictable process, while teenagers appreciate the opportunity to create custom fashion that expresses their individual style. The chemistry of dye bonding — how different fabrics absorb color, how folding patterns create symmetry, how colors blend in the wash — provides embedded STEM learning that feels nothing like a lesson. Every item produced is guaranteed to be unique, making tie-dye one of the most empowering and shareable creative activities available.`,
    keywords: ["tie-dye", "colors", "fabric", "craft", "wearable"],
    ageRange: { min: 6, max: 14 },
    price: 19.99,
    inventory: 38,
    category: "arts-crafts",
    dimensions: { lengthInches: 12.0, widthInches: 8.0, heightInches: 3.0, weightLbs: 1.5 },
    manufacturer: "CraftStar",
    bestSellersRank: 46,
    rating: { stars: 4.5, numberOfRatings: 2567 },
  },
  {
    id: "toy-047",
    name: "Bead Art Pegboard Set",
    image: "/product-images/toy-047.png",
    description: "4000+ fusible beads in 30 colors with 6 pegboards, ironing paper, and tweezers. Create pixel-art characters, animals, and patterns.",
    marketingCopy: `Pixel art meets real-world crafting in our Bead Art Pegboard Set — a creative powerhouse that lets children design colorful mosaic creations bead by bead, then fuse them into permanent, display-worthy art pieces. The set includes over 4,000 precision-sized fusible beads in 30 colors (including glow-in-the-dark, glitter, and metallic), 6 interlocking pegboards in square, hexagon, circle, heart, star, and animal shapes, ironing paper, tweezers, and a pattern booklet with 30 designs from simple to advanced.

The creative process is meditative and deeply satisfying: place beads one by one onto the pegboard following a pattern (or your own imagination), lay the ironing paper over the finished design, and press with a household iron for 10 seconds. The heat partially melts the beads' surfaces, fusing them into a solid, smooth panel that pops off the pegboard as a finished creation. The result looks remarkably like pixel art, making this set a favorite among children who love video games, digital art, and retro gaming aesthetics.

Fine motor skills, color theory, pattern recognition, patience, and spatial planning are all exercised during bead art sessions, and the tangible finished product provides a sense of accomplishment that digital activities cannot match. The beads are stored in a compartmented case that keeps colors separated and accessible, and the interlocking pegboards can be combined to create oversized designs that span multiple boards. Additional bead color packs and specialty pegboard shapes are available for artists who become devoted to this endlessly engaging art form.`,
    keywords: ["beads", "pegboard", "pixel art", "fuse", "craft"],
    ageRange: { min: 5, max: 10 },
    price: 17.99,
    inventory: 45,
    category: "arts-crafts",
    dimensions: { lengthInches: 12.0, widthInches: 9.0, heightInches: 3.0, weightLbs: 1.4 },
    manufacturer: "CraftStar",
    bestSellersRank: 39,
    rating: { stars: 4.6, numberOfRatings: 2134 },
  },
  {
    id: "toy-048",
    name: "Rock Painting Kit",
    image: "/product-images/toy-048.png",
    description: "Paint 12 smooth river rocks with acrylic paints, metallic markers, and googly eyes. Includes transfer designs and display stands.",
    marketingCopy: `Turn ordinary stones into extraordinary art with our Rock Painting Kit — a creative set that combines the tactile appeal of natural river rocks with the vibrant expression of acrylic painting. The kit includes 12 smooth, palm-sized river rocks, 12 pots of acrylic paint in vivid colors, 3 metallic paint markers (gold, silver, copper), 2 fine-tip brushes, a dotting tool, 24 googly eyes in assorted sizes, a sheet of water-transfer designs, a bottle of clear sealant spray, and 6 mini easel display stands.

The included rocks are hand-selected for their smooth surfaces, pleasing shapes, and consistent sizing — each one a natural canvas waiting for transformation. Children can follow the illustrated idea card for guided projects (ladybug, owl, galaxy, cactus, emoji, and more) or dive into freeform painting. The metallic markers add shimmer and detail, the googly eyes inject personality and humor, and the water-transfer designs provide intricate patterns that even young painters can apply professionally.

Rock painting has become a global community phenomenon, with "kindness rocks" left in parks, trails, and public spaces for strangers to find and enjoy. Our kit includes a guide to this movement, encouraging children to paint messages of positivity, seal their rocks with the included spray, and hide them in their neighborhood for others to discover. The combination of outdoor treasure hunting, artistic expression, and community connection makes rock painting one of the most wholesome and engaging crafts available for families.`,
    keywords: ["rock painting", "acrylic", "craft", "outdoor", "creative"],
    ageRange: { min: 4, max: 12 },
    price: 14.99,
    inventory: 55,
    category: "arts-crafts",
    dimensions: { lengthInches: 10.0, widthInches: 8.0, heightInches: 3.0, weightLbs: 3.0 },
    manufacturer: "NatureCraft Co.",
    bestSellersRank: 32,
    rating: { stars: 4.7, numberOfRatings: 2890 },
  },
  {
    id: "toy-049",
    name: "Origami Paper & Book Set",
    image: "/product-images/toy-049.png",
    description: "200 sheets of origami paper in 40 patterns plus a 64-page instruction book with 50 projects from easy to expert.",
    marketingCopy: `Fold your way to mastery with our Origami Paper & Book Set — a comprehensive kit that takes paper-folders from their first simple cup to breathtaking expert-level creations like modular stars, leaping frogs, and flapping cranes. The set includes 200 sheets of premium, pre-cut 6-inch origami paper in 40 stunning patterns (solids, metallics, florals, geometric, and traditional Japanese washi prints), plus a 64-page hardcover instruction book with crystal-clear diagrams for 50 projects across five difficulty levels.

Each project page features numbered step-by-step valley and mountain fold diagrams using the international Yoshizawa–Randlett notation system — the global standard that ensures any folder, anywhere in the world, can follow along. Beginners start with fortune tellers, boats, and jumping frogs, then progress through intermediate animals and flowers to expert modular constructions that combine multiple folded units into three-dimensional sculptures. The paper is specifically weighted (60 gsm) for optimal folding: thin enough to create crisp creases yet sturdy enough to hold complex structures without tearing.

Origami is a uniquely powerful educational tool — it teaches geometric concepts (symmetry, fractions, angles), develops fine motor precision, builds spatial visualization skills, and cultivates patience and mindfulness. Studies show that children who practice origami regularly demonstrate measurably improved mathematical reasoning and problem-solving ability. The cultural heritage of Japanese paper-folding adds a dimension of global awareness, and the sheer magic of transforming a flat square into a three-dimensional crane never fails to delight folder and audience alike.`,
    keywords: ["origami", "paper", "folding", "craft", "Japanese"],
    ageRange: { min: 6, max: 14 },
    price: 13.99,
    inventory: 48,
    category: "arts-crafts",
    dimensions: { lengthInches: 7.0, widthInches: 7.0, heightInches: 1.5, weightLbs: 0.6 },
    manufacturer: "PaperCrane Arts",
    bestSellersRank: 58,
    rating: { stars: 4.5, numberOfRatings: 1678 },
  },
  {
    id: "toy-050",
    name: "Canvas Painting Set – Easel Included",
    image: "/product-images/toy-050.png",
    description: "Tabletop easel with 6 canvases, 24 acrylic paints, 10 brushes, and a palette. Everything a young artist needs in one box.",
    marketingCopy: `Set up a proper art studio anywhere in the house with our Canvas Painting Set — a comprehensive acrylic painting kit that includes everything from easel to brush and palette to canvas. The adjustable tabletop easel holds canvases securely at three different angles, six pre-stretched 8x10 inch canvases provide professional-quality painting surfaces, 24 tubes of richly pigmented acrylic paint cover the full color spectrum, and 10 brushes (rounds, flats, and a fan brush) give artists the right tool for every technique.

The acrylic paints are formulated for smooth application and excellent coverage with a creamy, non-drip consistency that works well for both broad strokes and fine detail. They dry to a matte-satin finish with vibrant color retention and can be thinned with water for watercolor effects or layered thickly for impasto texture. The included kidney-shaped palette has a thumb hole for comfortable holding and 12 mixing wells for blending custom colors. A laminated color-mixing chart shows how to create dozens of secondary and tertiary colors from the primaries provided.

This set is designed to make children feel like real artists — not craft-project kids. The canvases have the same cotton-duck weave and gesso priming used by professional painters, the brushes have seamless ferrules and comfortable wood handles, and the easel has the look and feel of a miniature version of the full-sized easels found in art schools. The kit arrives in an attractive storage box that keeps everything organized between painting sessions and makes a stunning gift for any child who shows an interest in visual art.`,
    keywords: ["canvas", "painting", "easel", "acrylic", "art"],
    ageRange: { min: 7, max: 14 },
    price: 32.99,
    inventory: 22,
    category: "arts-crafts",
    dimensions: { lengthInches: 14.0, widthInches: 11.0, heightInches: 6.0, weightLbs: 3.5 },
    manufacturer: "ArtSpark Studios",
    bestSellersRank: 53,
    rating: { stars: 4.6, numberOfRatings: 1567 },
  },
  // ── FIGURINES & PLAYSETS ───────────────────────────────────────────────
  {
    id: "toy-051",
    name: "Dinosaur Explorer Kit",
    image: "/product-images/toy-051.png",
    description: "12 realistic dinosaur figurines with a fold-out prehistoric playmat. Includes a field guide booklet with fun dinosaur facts.",
    marketingCopy: `Step back 65 million years with our Dinosaur Explorer Kit — a paleontologist's dream set that puts 12 scientifically accurate dinosaur figurines into the hands of young explorers. The collection spans the Mesozoic Era with a towering T-Rex, long-necked Brachiosaurus, armored Ankylosaurus, three-horned Triceratops, flying Pteranodon, swimming Plesiosaurus, and six more species, each one hand-painted with species-appropriate coloring and anatomically correct proportions based on current paleontological research.

The included fold-out playmat (24x36 inches) depicts a lush Cretaceous landscape with volcanoes, fern forests, rivers, and nesting grounds, providing a detailed backdrop for dinosaur adventures. The 16-page field guide booklet presents each species with a pronunciation guide, diet classification, size comparison to a human, time period, and three "wow factor" facts that children love sharing with anyone who will listen. The figurines range from 3 to 8 inches in length and are made from solid PVC with no hollow cavities, giving them a satisfying heft and stability.

Dinosaur play is one of the most powerful vehicles for developing scientific curiosity and classification skills in young children. The sheer diversity of the dinosaur kingdom — herbivores versus carnivores, bipeds versus quadrupeds, armored versus feathered — provides a natural framework for comparison, categorization, and hypothesis-building. This kit taps into the near-universal childhood fascination with these magnificent creatures, combining rigorous scientific accuracy with the imaginative play that brings extinct worlds roaring back to life.`,
    keywords: ["dinosaur", "figurines", "prehistoric", "educational", "science"],
    ageRange: { min: 3, max: 8 },
    price: 27.99,
    inventory: 41,
    category: "figurines",
    dimensions: { lengthInches: 12.0, widthInches: 8.0, heightInches: 4.0, weightLbs: 1.8 },
    manufacturer: "DinoWorld",
    bestSellersRank: 17,
    rating: { stars: 4.7, numberOfRatings: 4567 },
  },
  {
    id: "toy-052",
    name: "Safari Animals Tube (12 figurines)",
    image: "/product-images/toy-052.png",
    description: "Twelve hand-painted safari animal figurines in a reusable tube. Lion, elephant, giraffe, zebra, hippo, and more. Detailed and durable.",
    marketingCopy: `Bring the Serengeti to your living room with our Safari Animals Tube — twelve hand-painted wildlife figurines that capture the majesty and diversity of the African savanna. The collection features the iconic "Big Five" (lion, elephant, Cape buffalo, leopard, and rhinoceros) plus a giraffe, zebra, hippopotamus, cheetah, gorilla, crocodile, and flamingo, each one sculpted with remarkable anatomical detail and painted in lifelike coloring that reflects each species' natural appearance.

The figurines range from 2.5 to 5 inches in height and are molded from solid, non-toxic PVC with a matte finish that resists fingerprints and wear. Each animal stands independently on a sculpted base that represents its natural habitat — the lion on dry savanna grass, the hippo partially submerged in water, the gorilla on forest floor vegetation. The reusable clear tube with screw-on lid serves as both packaging and long-term storage, keeping the collection organized and travel-ready.

Wildlife figurine play fosters empathy, environmental awareness, and narrative storytelling as children create elaborate scenarios involving predator-prey relationships, migration, family groups, and conservation efforts. Our safari collection is developed in consultation with wildlife educators and is used in classrooms worldwide as a hands-on complement to zoology and ecology curricula. Collectible companion tubes (Arctic Animals, Rainforest Creatures, Australian Wildlife) are available separately, allowing young naturalists to build a comprehensive global menagerie.`,
    keywords: ["safari", "animals", "figurines", "lion", "elephant", "giraffe"],
    ageRange: { min: 3, max: 8 },
    price: 14.99,
    inventory: 55,
    category: "figurines",
    dimensions: { lengthInches: 12.0, widthInches: 3.0, heightInches: 3.0, weightLbs: 0.9 },
    manufacturer: "WildWorld Figurines",
    bestSellersRank: 23,
    rating: { stars: 4.6, numberOfRatings: 3890 },
  },
  {
    id: "toy-053",
    name: "Pirate Ship Playset",
    image: "/product-images/toy-053.png",
    description: "Detailed pirate ship with working cannon, crow's nest, and anchor. Comes with 4 pirate figures, treasure chest, and island base.",
    marketingCopy: `Hoist the Jolly Roger and set sail for adventure! Our Pirate Ship Playset is a 16-inch detailed galleon that fires soft-foam cannonballs, drops anchor with a working winch, and features a crow's nest lookout, a captain's wheel that turns, a plank for reluctant prisoners, and rigging made from real cotton cord. The ship comes with a crew of four articulated pirate figures (captain, first mate, lookout, and prisoner), a treasure chest that opens to reveal gold coin accessories, and a palm-tree island base with a hidden treasure cave.

The ship is constructed from sturdy ABS plastic with a wood-grain paint finish that gives it a surprisingly realistic appearance. The hull splits into two halves to reveal a below-deck interior with a mess table, cannon stations, and a brig for captured prisoners. The spring-loaded cannon fires soft foam balls up to 5 feet — far enough for exciting ship-to-ship battles, soft enough to be completely safe. The removable mast and sails make the ship easy to store on a shelf between play sessions.

Pirate play taps into one of the most enduring themes in children's imaginative narratives — adventure, exploration, treasure-hunting, moral decision-making, and the thrill of the high seas. This playset provides rich environmental storytelling support with enough accessories and articulated figures to sustain extended, complex play scenarios. The combination of action features (cannon, anchor, plank) and role-play elements (figures, treasure, island) engages children across the full spectrum of play styles, from action-oriented to narrative-driven.`,
    keywords: ["pirate", "ship", "playset", "adventure", "cannon"],
    ageRange: { min: 4, max: 9 },
    price: 39.99,
    inventory: 20,
    category: "figurines",
    dimensions: { lengthInches: 16.0, widthInches: 6.0, heightInches: 14.0, weightLbs: 2.5 },
    manufacturer: "Adventure Toys Co.",
    bestSellersRank: 49,
    rating: { stars: 4.5, numberOfRatings: 1678 },
  },
  {
    id: "toy-054",
    name: "Space Station Playset",
    image: "/product-images/toy-054.png",
    description: "Multi-level space station with shuttle, rover, satellite dish, and 3 astronaut figures. Light-up command center and opening bay doors.",
    marketingCopy: `Houston, we have a playset! Our Space Station is a multi-level orbital outpost that brings the wonder of space exploration to bedroom floors everywhere. The station features a light-up command center with blinking LED consoles, opening bay doors that launch the included space shuttle, a rotating satellite dish, a robotic arm that swivels and extends, a docking port for incoming vehicles, and a detachable laboratory module. Three fully articulated astronaut figures (pilot, scientist, and commander) come equipped with removable helmets, tethering cables, and miniature tools.

The included surface rover drives on real rolling wheels across any flat surface, with an articulating camera mast and sample collection arm that add realism to planetary exploration missions. The shuttle snaps into the bay doors for launch sequences, detaches for independent flight play, and re-docks with a satisfying magnetic click. Two button-cell batteries (included) power the command center LEDs for approximately 100 hours of intermittent use, with an accessible battery compartment for easy replacement.

Space play has experienced a renaissance as a new generation watches real-life missions to Mars and the Moon. This playset channels that excitement into creative, narrative play that naturally introduces STEM concepts: orbital mechanics, life support systems, scientific research methodology, and the international cooperation that makes space exploration possible. The station is designed at a consistent 1:35 scale, making it compatible with other similarly scaled playsets and vehicle collections for expansive space adventure scenarios.`,
    keywords: ["space", "astronaut", "station", "shuttle", "NASA"],
    ageRange: { min: 4, max: 10 },
    price: 44.99,
    inventory: 18,
    category: "figurines",
    dimensions: { lengthInches: 18.0, widthInches: 12.0, heightInches: 10.0, weightLbs: 2.8 },
    manufacturer: "CosmicPlay",
    bestSellersRank: 57,
    rating: { stars: 4.5, numberOfRatings: 1234 },
  },
  {
    id: "toy-055",
    name: "Farm Animals & Barn Set",
    image: "/product-images/toy-055.png",
    description: "Wooden barn with 10 farm animal figurines, fences, hay bales, and a tractor. Barn doors swing open and roof lifts off.",
    marketingCopy: `Old MacDonald had a barn — and now your child can too. Our Farm Animals & Barn Set is a beautifully crafted wooden playset that includes a red barn with swinging double doors and a lift-off roof, 10 hand-painted farm animal figurines (cow, horse, pig, sheep, goat, chicken, rooster, duck, dog, and cat), a wooden tractor with rolling wheels, split-rail fences, and hay bale accessories. Every piece is made from sustainably harvested hardwood with non-toxic, water-based paint finishes.

The barn is the centerpiece — large enough (8 inches tall, 10 inches wide) to house the entire animal collection, with a hayloft level accessible through the removable roof and a ground level divided into stalls by wooden partitions. The swinging doors have tiny wooden latches that toddlers can operate, building fine motor skills while enacting feed-time, bedtime, and morning-release routines. The fences connect with simple peg-and-hole joints, allowing children to create paddocks, corrals, and pasture layouts of their own design.

Farm play is a foundational imaginative theme that introduces children to the natural world, daily routines, animal care, and the connection between agriculture and the food they eat. The open-ended nature of this set — no prescribed narrative, no electronic sounds, no flashing lights — encourages children to create their own stories, voices, and scenarios, developing language skills, empathy, and the ability to sustain complex pretend-play sequences. This is the kind of wooden toy that becomes a family heirloom, growing more beautiful with use and more precious with each generation that plays with it.`,
    keywords: ["farm", "barn", "animals", "tractor", "wooden"],
    ageRange: { min: 2, max: 6 },
    price: 34.99,
    inventory: 25,
    category: "figurines",
    dimensions: { lengthInches: 10.0, widthInches: 8.0, heightInches: 8.0, weightLbs: 3.0 },
    manufacturer: "TinyTree Toys",
    bestSellersRank: 26,
    rating: { stars: 4.7, numberOfRatings: 2345 },
  },
  {
    id: "toy-056",
    name: "Medieval Knights & Castle Set",
    image: "/product-images/toy-056.png",
    description: "Foldable castle playset with drawbridge, catapult, and 8 knight and dragon figures. Snap-together assembly, no tools needed.",
    marketingCopy: `Defend the realm! Our Medieval Knights & Castle Set transforms any tabletop into a battleground of chivalry and adventure. The snap-together castle features towering turrets with crenellated battlements, a working drawbridge on real chains, a spring-loaded catapult that launches soft projectiles up to 4 feet, a secret escape tunnel, and a throne room with a removable king figure. Eight additional figures include four knights in heraldic armor, two archers, a wizard, and a fearsome dragon with poseable wings.

The castle assembles without tools in about 10 minutes using an intuitive tab-and-slot system, and folds flat for storage to just 3 inches thick — a thoughtful design that parents deeply appreciate. When assembled, it stands 14 inches tall and opens to reveal a full interior courtyard with enough space for elaborate siege scenarios, jousting tournaments, and dragon-slaying quests. The figures are made from durable PVC with 5 points of articulation each, and the knights' shields feature four different heraldic designs for team-based play.

Medieval play is a rich narrative genre that naturally introduces historical concepts, ethical reasoning (loyalty, courage, justice), and strategic thinking (defense planning, resource management, alliance-building). The catapult adds a physics element — children quickly learn that projectile angle and force determine range and accuracy. The dragon figure introduces a fantasy dimension that expands storytelling possibilities exponentially. This set delivers dozens of hours of deeply engaged imaginative play for a price that represents remarkable value.`,
    keywords: ["knights", "castle", "medieval", "dragon", "playset"],
    ageRange: { min: 4, max: 10 },
    price: 36.99,
    inventory: 22,
    category: "figurines",
    dimensions: { lengthInches: 16.0, widthInches: 12.0, heightInches: 14.0, weightLbs: 2.8 },
    manufacturer: "Adventure Toys Co.",
    bestSellersRank: 51,
    rating: { stars: 4.5, numberOfRatings: 1567 },
  },
  {
    id: "toy-057",
    name: "Insect & Bug Collection (24 figurines)",
    image: "/product-images/toy-057.png",
    description: "24 realistic insect and bug figurines including beetles, butterflies, spiders, and scorpions. Great for nature study and imaginative play.",
    marketingCopy: `Get up close and personal with the world's most fascinating creepy-crawlies — no bug spray required. Our Insect & Bug Collection features 24 realistically sculpted figurines spanning the major arthropod orders: beetles (stag, ladybug, rhinoceros), butterflies (monarch, swallowtail, morpho), arachnids (tarantula, scorpion, garden spider), flying insects (dragonfly, praying mantis, cicada), ants, grasshoppers, centipedes, and more. Each figurine is hand-painted with species-accurate coloring and measures 2 to 4 inches in length.

The figurines are molded from flexible PVC that withstands bending and rough play without cracking — important for toys that often end up in pockets, sandboxes, and bath water. The anatomical detail is impressive for this scale: compound eyes, segmented antennae, jointed legs, and wing venation patterns are all clearly visible. An included fold-out identification poster shows each species with its common and scientific name, habitat, diet, and one "amazing fact" that makes children eager to learn more.

Insects represent over 80% of all known animal species, making entomology one of the most important branches of biology — and one of the least appreciated by adults who have lost their childhood fascination. This collection reignites that fascination by putting realistic, non-threatening representations into children's hands, encouraging observation, classification, and respect for the small creatures that make ecosystems function. Teachers report that children who play with insect figurines show dramatically reduced fear responses during live insect encounters, replacing "ew!" with "cool!" — exactly the attitude shift that future environmental stewards need.`,
    keywords: ["insects", "bugs", "nature", "collection", "figurines"],
    ageRange: { min: 3, max: 8 },
    price: 12.99,
    inventory: 50,
    category: "figurines",
    dimensions: { lengthInches: 10.0, widthInches: 6.0, heightInches: 2.0, weightLbs: 0.7 },
    manufacturer: "WildWorld Figurines",
    bestSellersRank: 47,
    rating: { stars: 4.4, numberOfRatings: 2123 },
  },
  {
    id: "toy-058",
    name: "Adventure Action Figures (6 pack)",
    image: "/product-images/toy-058.png",
    description: "Six poseable adventure action figures with swappable accessories. Each 6 inches tall with 12 points of articulation.",
    marketingCopy: `Assemble your ultimate squad with our Adventure Action Figures — six original, diverse characters that bring excitement to tabletop, bedroom-floor, and backyard adventures. The roster includes Volt (electric-powered speedster), Titan (super-strong powerhouse), Shadow Wing (stealth flyer), Blaze (fire controller), Frost Nova (ice specialist), and Terra (earth manipulator). Each 6-inch figure features 12 points of articulation — neck, shoulders, elbows, wrists, hips, and knees — enabling dynamic action poses and combat stances.

Every hero comes with two swappable accessories — alternate hands, energy effects, weapons, or shields — that pop on and off via universal 3mm pegs, allowing cross-character customization. Volt's lightning bolts look just as cool on Terra's fists, and Shadow Wing's cape clips to any figure's back. The figures are made from durable ABS and PVC with detailed paint applications that survive rough play without chipping. Each one includes a character bio card with backstory, powers, weakness, and team affiliation, fueling imaginative storytelling.

Action figure play is one of the most studied and validated forms of creative play, consistently linked to narrative development, social skill building (when children negotiate roles and storylines with peers), and emotional processing (as children project complex feelings onto characters in dramatic scenarios). Our original character roster was deliberately designed to represent diverse body types, skin tones, and power archetypes, ensuring that every child can see themselves reflected in a hero. The universal accessory system encourages sharing, trading, and creative problem-solving across any size figure collection.`,
    keywords: ["adventure", "action figures", "poseable", "characters", "heroes"],
    ageRange: { min: 4, max: 10 },
    price: 29.99,
    inventory: 35,
    category: "figurines",
    dimensions: { lengthInches: 12.0, widthInches: 8.0, heightInches: 3.0, weightLbs: 1.2 },
    manufacturer: "HeroForge Toys",
    bestSellersRank: 39,
    rating: { stars: 4.5, numberOfRatings: 2678 },
  },
  {
    id: "toy-059",
    name: "Ocean Deep Sea Creatures Tube",
    image: "/product-images/toy-059.png",
    description: "10 deep-sea creature figurines: anglerfish, giant squid, nautilus, and more. Glow-in-the-dark details. Comes with info cards.",
    marketingCopy: `Explore the alien world of the ocean abyss with our Deep Sea Creatures Tube — 10 extraordinary figurines depicting the bizarre and beautiful life forms that thrive in Earth's deepest waters. The collection includes an anglerfish with a glowing lure, a giant squid with 10 individually sculpted tentacles, a coiled nautilus, a vampire squid, a gulper eel, a dumbo octopus, a barreleye fish, a yeti crab, a giant isopod, and a bioluminescent jellyfish. Glow-in-the-dark pigments are worked into key features — the anglerfish's lure, the jellyfish's bell, and the squid's photophores — creating an eerie, authentic deep-sea effect in darkened rooms.

Each figurine is accompanied by an illustrated info card printed on waterproof card stock, featuring the creature's depth range, size, diet, and most remarkable adaptation. The cards are designed to be collected and displayed alongside the figurines, creating a museum-quality deep-sea exhibit on any shelf or desk. The figurines themselves range from 2 to 5 inches and are molded from solid PVC with matte-finish paint that captures the ghostly, translucent quality of deep-sea organisms.

The deep ocean remains the least explored environment on Earth — more humans have walked on the Moon than have visited the Mariana Trench — and this set channels the awe and mystery of that frontier into tangible, playable form. Marine biologists consulted on species selection and anatomical accuracy, ensuring that these figurines serve as legitimate educational tools as well as imaginative play props. The reusable tube with screw-top lid provides organized storage and makes this set an outstanding gift for any child fascinated by the ocean's darkest depths.`,
    keywords: ["ocean", "deep sea", "creatures", "glow", "figurines"],
    ageRange: { min: 4, max: 10 },
    price: 16.99,
    inventory: 38,
    category: "figurines",
    dimensions: { lengthInches: 12.0, widthInches: 3.0, heightInches: 3.0, weightLbs: 0.8 },
    manufacturer: "DeepBlue Plush",
    bestSellersRank: 63,
    rating: { stars: 4.6, numberOfRatings: 1345 },
  },
  {
    id: "toy-060",
    name: "Mythical Creatures Set (8 figurines)",
    image: "/product-images/toy-060.png",
    description: "Eight detailed mythical creature figurines: dragon, phoenix, griffin, unicorn, pegasus, kraken, yeti, and thunderbird.",
    marketingCopy: `Legends come to life with our Mythical Creatures Set — eight meticulously sculpted figurines representing the most iconic beasts from mythology and folklore around the world. The collection spans cultures and continents: a Western dragon with outstretched wings, a blazing phoenix rising from flames, a lion-eagle griffin in mid-pounce, a rearing unicorn, a soaring pegasus, a tentacled kraken emerging from ocean waves, a snow-covered yeti, and a lightning-wreathed thunderbird from Native American tradition.

Each figurine is sculpted by professional model artists with extraordinary attention to detail — individual scales on the dragon, feather layering on the phoenix, muscle definition on the griffin, and textured fur on the yeti. The figures range from 3 to 6 inches and are made from solid hand-painted PVC with a protective clear coat that preserves the paint through years of play and display. The level of detail makes these figurines equally at home in a child's adventure scenario and on a collector's display shelf.

Mythological creatures are universal — every culture on Earth has imagined extraordinary beasts, and these figures provide a tangible entry point into comparative mythology, cultural literacy, and the enduring human impulse to explain the natural world through storytelling. Children who play with mythical creature figurines naturally encounter questions about different cultural traditions, symbolic meaning, and the line between fantasy and reality — rich conversational territory for families and educators. The set includes a fold-out poster with each creature's mythological origin, traditional symbolism, and notable appearances in literature and film.`,
    keywords: ["mythical", "dragon", "phoenix", "unicorn", "fantasy", "figurines"],
    ageRange: { min: 4, max: 12 },
    price: 22.99,
    inventory: 28,
    category: "figurines",
    dimensions: { lengthInches: 10.0, widthInches: 8.0, heightInches: 3.0, weightLbs: 1.0 },
    manufacturer: "WildWorld Figurines",
    bestSellersRank: 54,
    rating: { stars: 4.7, numberOfRatings: 1789 },
  },
  // ── PRETEND PLAY ───────────────────────────────────────────────────────
  {
    id: "toy-061",
    name: "Princess Castle Playset",
    image: "/product-images/toy-061.png",
    description: "Enchanted castle playset with two princess dolls, a unicorn, furniture, and magical accessories. Castle opens to reveal three floors of play space.",
    marketingCopy: `Once upon a time, in a castle made of dreams... Our Princess Castle Playset opens its hinged façade to reveal three floors of enchanted play space, each one decorated with printed murals of sparkling ballrooms, rose gardens, and starlit towers. Two fully articulated princess dolls (5 inches tall) live in the castle along with their loyal unicorn companion, and the 15-piece furniture collection includes a canopy bed, a vanity mirror, a throne, a dining table, and magical accessories like a crystal ball, a spell book, and a glowing (LED) chandelier.

The castle exterior features a working drawbridge, a balcony with climbing roses, and turret rooftops that lift off for top-down play access. The entire structure stands 18 inches tall when open and folds closed with a carry handle for easy transport to playdates and grandparents' houses. The hinge mechanism is engineered to withstand thousands of open-close cycles without loosening, and the latching system keeps the castle securely closed during transport, protecting the furniture and figures inside.

Fairy-tale play is far more than frothy fantasy — developmental psychologists identify it as a critical vehicle for exploring themes of agency, courage, kindness, and self-determination. Children who engage in princess-and-castle narratives practice complex social scripts, negotiate story arcs with peers, and experiment with problem-solving in emotional contexts. Our playset provides the richly detailed environment that sustains these deep play sessions while maintaining a price point and quality level that makes it an exceptional value in the princess playset category.`,
    keywords: ["castle", "princess", "dolls", "fantasy", "pretend play"],
    ageRange: { min: 3, max: 7 },
    price: 44.99,
    inventory: 22,
    category: "pretend-play",
    dimensions: { lengthInches: 18.0, widthInches: 6.0, heightInches: 18.0, weightLbs: 3.5 },
    manufacturer: "Sparkle Kingdom",
    bestSellersRank: 50,
    rating: { stars: 4.5, numberOfRatings: 1890 },
  },
  {
    id: "toy-062",
    name: "Spy Gear Detective Kit",
    image: "/product-images/toy-062.png",
    description: "Top-secret spy kit with night vision scope, fingerprint kit, invisible ink pen, walkie-talkies, and a decoder ring.",
    marketingCopy: `Your mission, should you choose to accept it: become the world's greatest junior detective with our Spy Gear Detective Kit. This classified equipment package includes a real working night-vision monocular with green LED illumination (see up to 15 feet in darkness), a forensic fingerprint dusting kit with powder, brush, and lift tape, an invisible-ink pen with UV light reveal, a pair of short-range walkie-talkies, a cipher decoder ring with 26 alphabet shifts, and a pocket-sized periscope for seeing around corners without being spotted.

Every tool is engineered to actually work — this is not a pretend-play approximation but a collection of real, functional spy equipment scaled for children's hands. The night vision scope genuinely amplifies available light, the fingerprint kit lifts real latent prints from smooth surfaces, and the invisible ink is truly invisible until exposed to the included UV LED. The walkie-talkies operate on FRS frequencies with a range of approximately 200 feet — enough for backyard surveillance operations and neighborhood mystery-solving.

Detective play exercises critical thinking, observational skills, deductive reasoning, and collaborative problem-solving in ways that few other play themes can match. Children naturally create mysteries to solve, assigning roles (detective, suspect, witness), gathering evidence, and constructing theories — a sophisticated narrative process that builds logical thinking and social skills simultaneously. The kit arrives in a lockable (combination lock included) "classified" briefcase that keeps all equipment organized and adds an irresistible layer of authenticity to every mission.`,
    keywords: ["spy", "detective", "secret", "walkie-talkie", "investigation"],
    ageRange: { min: 6, max: 12 },
    price: 42.99,
    inventory: 23,
    category: "pretend-play",
    dimensions: { lengthInches: 14.0, widthInches: 10.0, heightInches: 4.0, weightLbs: 2.2 },
    manufacturer: "CovertOps Kids",
    bestSellersRank: 59,
    rating: { stars: 4.4, numberOfRatings: 1678 },
  },
  {
    id: "toy-063",
    name: "Play Kitchen Set – Deluxe",
    image: "/product-images/toy-063.png",
    description: "Full-sized play kitchen with oven, microwave, fridge, and sink. Realistic sounds, lights, and running water feature. 30+ food accessories.",
    marketingCopy: `Welcome to the most popular restaurant on the block — your child's imagination. Our Deluxe Play Kitchen is a full-sized culinary command center standing 36 inches tall, featuring a four-burner stovetop with clicking knobs and light-up "flame" LEDs, an oven with a see-through door and interior light, a microwave with a spinning turntable, a French-door refrigerator with ice dispenser, and a sink with a hand-pump running-water feature that recirculates real water from a hidden reservoir.

The kitchen comes with over 30 food and utensil accessories: pots, pans, a spatula, a whisk, plates, cups, and a collection of play food items including vegetables, fruits, proteins, and a pizza that separates into Velcro-connected slices. Every accessory stores neatly in the kitchen's built-in shelving, hooks, and cabinets, encouraging organizational habits. The realistic sound effects — sizzling when a pan is placed on the lit burner, a timer ding from the oven, water flowing in the sink — create an immersive sensory experience that children find completely captivating.

Kitchen play is one of the richest domains of pretend play, naturally integrating mathematical concepts (measuring, counting, sequencing), scientific thinking (heating, mixing, transformation), social skills (hosting, serving, sharing), and life skills (cooking, cleaning, nutrition awareness). Our Deluxe Kitchen is built from engineered wood with a wipe-clean laminate finish, designed to withstand years of daily use and look beautiful doing it. Assembly requires approximately 45 minutes with the included hardware and illustrated instructions. This is the toy that dominates playrooms — the one that gets played with every single day.`,
    keywords: ["kitchen", "cooking", "pretend", "food", "appliances"],
    ageRange: { min: 2, max: 7 },
    price: 89.99,
    inventory: 10,
    category: "pretend-play",
    dimensions: { lengthInches: 30.0, widthInches: 12.0, heightInches: 36.0, weightLbs: 22.0 },
    manufacturer: "LittleChef Co.",
    bestSellersRank: 11,
    rating: { stars: 4.6, numberOfRatings: 3456 },
  },
  {
    id: "toy-064",
    name: "Doctor's Kit – 20 Piece",
    image: "/product-images/toy-064.png",
    description: "Realistic doctor's kit with stethoscope, blood pressure cuff, thermometer, syringe, and carrying case. All pieces sized for small hands.",
    marketingCopy: `The doctor is in! Our 20-Piece Doctor's Kit equips young medical professionals with everything they need to diagnose, treat, and comfort their patients — whether those patients are stuffed bears, willing siblings, or cooperative pets. The kit includes a stethoscope with a real working chest piece that amplifies heartbeat sounds, a blood pressure cuff with a squeeze bulb and Velcro strap, a digital-display thermometer (shows a random "temperature" when the button is pressed), a syringe with a retractable needle tip, a reflex hammer, bandages, an otoscope, and more.

Every instrument is designed to look and feel realistic while being completely safe for young hands. The stethoscope actually functions — press the chest piece against a friend's (or pet's) ribcage and hear the thump of their heartbeat through the earpieces. The blood pressure cuff wraps around a child's arm with a Velcro closure and features a squeeze bulb that kids find immensely satisfying to pump. All 20 pieces store in a rigid carrying case with a handle and a red cross emblem, organized in die-cut foam inserts that make cleanup as orderly as a real medical bag.

Doctor play serves a uniquely important emotional function: it gives children a sense of control and familiarity with medical experiences that might otherwise cause anxiety. Children who regularly play doctor show significantly less distress during real medical visits, because the instruments, procedures, and vocabulary are already familiar. Beyond emotional preparation, medical play exercises empathy, communication skills, and scientific vocabulary in a naturally engaging context. Pediatricians endorse this kit for its realism, safety, and genuine therapeutic value.`,
    keywords: ["doctor", "medical", "pretend", "stethoscope", "kit"],
    ageRange: { min: 3, max: 7 },
    price: 21.99,
    inventory: 45,
    category: "pretend-play",
    dimensions: { lengthInches: 10.0, widthInches: 7.0, heightInches: 4.0, weightLbs: 1.0 },
    manufacturer: "LittleChef Co.",
    bestSellersRank: 21,
    rating: { stars: 4.7, numberOfRatings: 3890 },
  },
  {
    id: "toy-065",
    name: "Wooden Tool Bench",
    image: "/product-images/toy-065.png",
    description: "Sturdy wooden workbench with hammer, saw, wrench, screwdriver, nuts, and bolts. Built-in storage shelf. Teaches tool recognition.",
    marketingCopy: `Every builder needs a proper workshop, and our Wooden Tool Bench provides exactly that — a sturdy, beautifully crafted workstation where young makers can hammer, saw, screw, and wrench to their heart's content. The bench stands 22 inches tall (perfect tabletop height for toddlers and preschoolers) and comes equipped with a wooden hammer, saw, wrench, screwdriver, pliers, a vise that actually clamps, wooden nuts and bolts that thread together, a pegboard backboard for tool organization, and a lower shelf for project storage.

Every component is made from solid hardwood — beech for the tools, birch plywood for the bench — with smooth, splinter-free surfaces and non-toxic paint accents. The nuts and bolts are oversized with deep, coarse threads that toddler fingers can engage without frustration. The vise clamp opens and closes with a real wooden screw mechanism, providing tactile feedback and mechanical understanding. The pegboard accepts all included tools via shaped pegs, encouraging cleanup routines and spatial-matching skills.

Tool play is a powerful form of functional pretend play that builds fine motor strength, hand-eye coordination, tool recognition, and the confidence to attempt real-world fixing and building tasks later in childhood. Children who play with realistic tool sets develop a comfort with tools and hardware that translates directly into practical life skills. Our bench is designed to be the centerpiece of a play workshop — sturdy enough to actually hammer on, detailed enough to feel genuinely "real," and beautiful enough to leave standing in a shared family space. Assembly takes 15 minutes with included hardware.`,
    keywords: ["tools", "workbench", "wooden", "building", "pretend"],
    ageRange: { min: 2, max: 6 },
    price: 39.99,
    inventory: 20,
    category: "pretend-play",
    dimensions: { lengthInches: 16.0, widthInches: 10.0, heightInches: 22.0, weightLbs: 6.0 },
    manufacturer: "TinyTree Toys",
    bestSellersRank: 37,
    rating: { stars: 4.6, numberOfRatings: 2145 },
  },
  {
    id: "toy-066",
    name: "Dress-Up Costume Trunk (10 costumes)",
    image: "/product-images/toy-066.png",
    description: "Trunk with 10 mix-and-match costumes: firefighter, astronaut, chef, doctor, pirate, fairy, superhero, police, wizard, and explorer.",
    marketingCopy: `Who do you want to be today? Our Dress-Up Costume Trunk answers that question ten different ways with a collection of mix-and-match costumes that transform children into firefighters, astronauts, chefs, doctors, pirates, fairies, superheroes, police officers, wizards, and jungle explorers — all stored in a sturdy fabric-covered trunk with reinforced handles and a pop-open lid. Each costume consists of a top or vest and one key accessory (helmet, hat, badge, wand, or tool), designed to slip on over regular clothes in seconds.

The costumes are sized to fit children ages 3-8 with adjustable Velcro closures that accommodate a wide range of body sizes. The fabrics are machine washable, brightly colored, and reinforced at stress points to survive the vigorous physical play that costumes inevitably invite. The accessories are lightweight plastic or fabric — no hard edges, no heavy helmets — ensuring comfortable wear during extended dress-up sessions, indoor play, and outdoor adventures.

Dress-up play is one of the most researched and validated forms of imaginative play, consistently linked to advances in perspective-taking, vocabulary development, social negotiation, and emotional regulation. When children don a costume, they mentally step into another person's role, practicing empathy and exploring identity in a safe, playful context. The diversity of roles in this trunk — spanning emergency services, sciences, arts, fantasy, and exploration — ensures that children encounter a broad range of career possibilities and social roles. The trunk itself becomes a permanent fixture in playrooms, inviting spontaneous costume changes throughout the day.`,
    keywords: ["dress-up", "costumes", "pretend", "roles", "trunk"],
    ageRange: { min: 3, max: 8 },
    price: 49.99,
    inventory: 16,
    category: "pretend-play",
    dimensions: { lengthInches: 20.0, widthInches: 12.0, heightInches: 12.0, weightLbs: 5.0 },
    manufacturer: "ImaginNation",
    bestSellersRank: 24,
    rating: { stars: 4.6, numberOfRatings: 2890 },
  },
  {
    id: "toy-067",
    name: "Cash Register & Shopping Set",
    image: "/product-images/toy-067.png",
    description: "Toy cash register with working calculator, scanner, play money, credit card, and 30 grocery items. Teaches counting and money skills.",
    marketingCopy: `Open for business! Our Cash Register & Shopping Set turns any room into a bustling marketplace where children take turns as shopkeeper and customer, learning real-world money skills through vibrant, hands-on pretend play. The electronic cash register features a working solar-powered calculator, a beeping barcode scanner, a pop-open cash drawer, a built-in scale, and a microphone with speaker (for announcing "price check on aisle three!"). The set includes realistic play money (bills and coins), a pretend credit card with swipe slot, and 30 grocery items — boxes, cans, fruits, vegetables, and bottles — each marked with a barcode and price sticker.

The calculator is a genuine functioning calculator — children doing "real math" with play money while making change is one of the most effective ways to build numerical fluency outside of formal instruction. The scanner beeps and flashes when items pass over the sensor window, and the scale displays a random weight on its LCD screen, adding layers of realism that keep play sessions engaging and complex. The cash drawer organizes bills and coins into labeled compartments, teaching sorting and organizational skills.

Shopping play is a goldmine of developmental learning: counting, addition, subtraction, social language (greetings, requests, thank-yous), turn-taking, and economic concepts (value, exchange, budgeting) all emerge naturally as children negotiate transactions. Our set provides enough accessories for multi-player scenarios — one cashier, one bagger, two shoppers — making it ideal for sibling play, playdates, and classroom dramatic-play centers. The register operates on 2 AA batteries (included) and features an auto-off function to preserve battery life.`,
    keywords: ["cash register", "shopping", "money", "pretend", "math"],
    ageRange: { min: 3, max: 7 },
    price: 26.99,
    inventory: 32,
    category: "pretend-play",
    dimensions: { lengthInches: 12.0, widthInches: 10.0, heightInches: 8.0, weightLbs: 2.5 },
    manufacturer: "BrightMinds Electronics",
    bestSellersRank: 30,
    rating: { stars: 4.5, numberOfRatings: 2567 },
  },
  {
    id: "toy-068",
    name: "Puppet Theater – Tabletop",
    image: "/product-images/toy-068.png",
    description: "Foldable wooden tabletop puppet theater with chalkboard marquee and fabric curtains. Fits standard hand and finger puppets.",
    marketingCopy: `The show must go on — and our Tabletop Puppet Theater ensures it does, anywhere, anytime. This beautifully crafted wooden theater folds flat for storage (just 2 inches thick) yet opens to reveal a proper proscenium stage with velvet-red fabric curtains that draw open and closed, a chalkboard marquee where young performers write the show title, and a sturdy stage opening sized to accommodate standard hand puppets and finger puppets alike. The theater stands 24 inches tall when set up on a table, creating a proper audience-facing performance space.

The frame is made from solid birch plywood with a satin lacquer finish in a classic theater-red and gold color scheme. The curtains are attached with Velcro tabs so they can be removed for washing or replaced with custom fabric. The chalkboard marquee comes with a set of colored chalk and an eraser, and the back of the theater features a printed "backstage" scene with hooks for hanging puppets between performances and a shelf for scripts and props.

Puppet theater play is extraordinarily rich from a developmental perspective: children practice narrative construction, dialogue creation, vocal expression, timing, and audience awareness — all foundational skills for communication and literacy. Shy children often find their voice through puppets, speaking freely and expressively in a character persona that feels safer than direct social interaction. The theater's professional appearance elevates puppet shows from casual play to genuine performance events, building pride and presentation skills. Add our Woodland Animals Puppets set (sold separately) for a complete theater experience from opening night.`,
    keywords: ["puppet", "theater", "stage", "performance", "wooden"],
    ageRange: { min: 3, max: 8 },
    price: 34.99,
    inventory: 18,
    category: "pretend-play",
    dimensions: { lengthInches: 24.0, widthInches: 2.0, heightInches: 24.0, weightLbs: 3.5 },
    manufacturer: "StageWhiskers",
    bestSellersRank: 66,
    rating: { stars: 4.5, numberOfRatings: 1234 },
  },
  {
    id: "toy-069",
    name: "Vet Clinic Playset",
    image: "/product-images/toy-069.png",
    description: "Veterinary clinic with exam table, X-ray machine, and medical tools. Includes 3 plush pets with removable casts and bandages.",
    marketingCopy: `Calling all animal doctors! Our Vet Clinic Playset puts compassionate young veterinarians in charge of a fully equipped animal hospital complete with an examination table, a working X-ray viewer (insert the included X-ray transparency cards and illuminate with the built-in backlight), a medicine cabinet with labeled bottles, a pet scale, medical instruments (stethoscope, thermometer, syringe, bandage roll), and three adorable plush patients — a puppy with a removable leg cast, a kitten with a Velcro bandage wrap, and a bunny with a cone collar.

The clinic is housed in a fold-open carrying case that resembles a medical facility when open (25 inches wide) and snaps closed into a compact travel case with a handle. The interior walls are printed with veterinary clinic details — anatomy posters, medicine shelves, a "Patients of the Week" photo wall — creating an immersive environment that sustains extended play sessions. Every medical tool stores in a dedicated slot inside the case, encouraging organizational habits and making cleanup simple.

Veterinary play combines two of children's deepest interests — animals and caregiving — into a play theme that builds empathy, nurturing behavior, scientific vocabulary, and emotional intelligence. Children practice gentle handling, diagnostic reasoning ("where does it hurt?"), and treatment planning, developing the same compassionate problem-solving skills that real veterinarians use daily. The inclusion of removable casts and bandages allows children to enact the full healing arc — injury, treatment, recovery — which is particularly therapeutic for children processing their own medical experiences or anxieties about pet health.`,
    keywords: ["vet", "animals", "clinic", "pretend", "pets", "medical"],
    ageRange: { min: 3, max: 7 },
    price: 32.99,
    inventory: 24,
    category: "pretend-play",
    dimensions: { lengthInches: 14.0, widthInches: 5.0, heightInches: 10.0, weightLbs: 2.0 },
    manufacturer: "LittleChef Co.",
    bestSellersRank: 43,
    rating: { stars: 4.6, numberOfRatings: 1890 },
  },
  {
    id: "toy-070",
    name: "Tea Party Set – Porcelain Style",
    image: "/product-images/toy-070.png",
    description: "15-piece tea set in a wicker basket. Floral porcelain-look plastic teapot, cups, saucers, and serving tray. Lightweight and durable.",
    marketingCopy: `You're cordially invited to the most charming tea party in town. Our Porcelain Style Tea Party Set brings the elegance of a traditional English tea service to the playroom with 15 exquisitely designed pieces: a teapot with lid, a creamer, a sugar bowl with lid, four cups, four saucers, and a serving tray — all nestled in a wicker carrying basket with a gingham liner and a hinged lid. The pieces are molded from lightweight, shatter-resistant melamine with a lustrous glaze finish that is virtually indistinguishable from real porcelain.

The floral pattern — hand-painted pink roses with green leaves on a white background with gold trim — is printed under the glaze, meaning it will never chip, scratch, or wash off. The teapot lid lifts off for filling (with water, juice, or imaginary Earl Grey), the creamer pours from a properly shaped spout, and the cups are sized to fit comfortably in children's hands. Every piece is food-safe and dishwasher-safe, so this set can serve real snacks and beverages at real tea parties as easily as imaginary ones.

Tea party play is a deceptively sophisticated form of social pretend play that develops etiquette, conversational skills, turn-taking, hosting responsibilities, and the language of politeness and hospitality. When children "pour" tea, "pass" the sugar, and "serve" their guests, they practice the social scripts that underpin everyday human interaction. The wicker basket elevates the set from toy to treasure, providing elegant storage and transport that makes every tea party feel like a special occasion. This set is equally beloved by three-year-olds having teddy-bear tea parties and seven-year-olds hosting elaborate themed gatherings for friends.`,
    keywords: ["tea party", "porcelain", "pretend", "social", "set"],
    ageRange: { min: 3, max: 7 },
    price: 19.99,
    inventory: 36,
    category: "pretend-play",
    dimensions: { lengthInches: 12.0, widthInches: 8.0, heightInches: 6.0, weightLbs: 1.5 },
    manufacturer: "ImaginNation",
    bestSellersRank: 35,
    rating: { stars: 4.7, numberOfRatings: 2345 },
  },
  // ── BOARD GAMES ────────────────────────────────────────────────────────
  {
    id: "toy-071",
    name: "Junior Word Builder",
    image: "/product-images/toy-071.png",
    description: "Kid-friendly version of the classic word game with two difficulty levels. Features colorful tiles, a two-sided game board, and picture clues for beginners.",
    marketingCopy: `Words become an adventure with Junior Word Builder — the kid-friendly gateway to the world's most beloved word-building format. The ingenious two-sided game board offers two distinct levels of play: the beginner side features pre-printed words with picture clues, so children simply match letter tiles to complete familiar words like "dog," "sun," and "tree." Flip the board over and the advanced side plays like a classic word game with a simplified scoring system, challenging young spellers to create their own words from a tile rack.

The oversized letter tiles are thick, colorful, and easy for small hands to grip and place, with a satisfying snap as they drop into the recessed board squares. The included tile bag, tile racks, and scoring track are all scaled for younger players, and the illustrated instruction booklet walks families through both game modes with clear examples and helpful tips. Games on the beginner side take about 15 minutes — perfect for short attention spans — while the advanced side extends to 25-30 minutes for more seasoned players.

Literacy researchers consistently identify letter-tile games as among the most effective informal tools for building phonemic awareness, spelling fluency, and vocabulary breadth. Junior Word Builder sneaks this learning into a genuinely fun, competitive family game night experience. Children who start with Junior Word Builder develop the confidence and skills to graduate to the full adult word game years ahead of their peers, making this not just a game but an investment in lifelong word-craft. For 2-4 players, recommended for ages 4-8.`,
    keywords: ["word builder", "word game", "letters", "spelling", "educational"],
    ageRange: { min: 4, max: 8 },
    price: 21.99,
    inventory: 38,
    category: "board-games",
    dimensions: { lengthInches: 10.5, widthInches: 10.5, heightInches: 2.0, weightLbs: 1.5 },
    manufacturer: "WonderPlay Games",
    bestSellersRank: 60,
    rating: { stars: 4.5, numberOfRatings: 2345 },
  },
  {
    id: "toy-072",
    name: "Strategy Board Game: Castle Siege",
    image: "/product-images/toy-072.png",
    description: "Epic medieval strategy game where players build castles, train armies, and compete for the kingdom. For 2-4 players, games last 30-45 minutes.",
    marketingCopy: `Kingdoms rise and fall at your command in Castle Siege — an epic strategy board game that challenges players to build fortifications, recruit armies, manage resources, and outmaneuver opponents in a race to claim the crown. The beautifully illustrated game board depicts a medieval kingdom divided into contested territories, each one offering strategic advantages: forests provide lumber for building, farms generate food for armies, mountains yield gold for recruitment, and rivers create natural defensive barriers.

Game play unfolds across three phases each turn: Build (place castle walls, towers, and gates), Recruit (draft knights, archers, and siege engines from a shared pool), and Battle (resolve conflicts using a clever card-based combat system that rewards strategic planning over pure luck). The 120 illustrated action cards add dramatic twists — spy infiltrations, dragon attacks, diplomatic alliances, and peasant revolts — ensuring no two games play alike. Average game length is 30-45 minutes, hitting the sweet spot between substantial strategy and family-friendly time commitment.

Castle Siege occupies the ideal niche for families seeking a game with genuine strategic depth that is still accessible to eight-year-olds. The mechanics teach resource management, risk assessment, long-term planning, and graceful losing — life skills wrapped in a medieval adventure that captivates both children and adults. The premium components — wooden castle pieces, embossed metal coins, linen-finish cards — elevate the tactile experience and make this a game that families return to week after week, discovering new strategies and developing rivalries that span years.`,
    keywords: ["strategy", "board game", "medieval", "castle", "multiplayer"],
    ageRange: { min: 8, max: 14 },
    price: 31.99,
    inventory: 27,
    category: "board-games",
    dimensions: { lengthInches: 12.0, widthInches: 12.0, heightInches: 3.0, weightLbs: 2.5 },
    manufacturer: "Stronghold Games",
    bestSellersRank: 76,
    rating: { stars: 4.6, numberOfRatings: 1234 },
  },
  {
    id: "toy-073",
    name: "Sweet Path Classic",
    image: "/product-images/toy-073.png",
    description: "The classic first board game for little ones. No reading required—just match colors and race to the Candy Castle. 2-4 players.",
    marketingCopy: `For decades, Sweet Path has been the game that teaches children what board games are — and makes them fall in love with the experience. The rules could not be simpler: draw a card, find the matching color on the board, and move your gingerbread person to that space. No reading, no counting, no strategy required — just pure, sweet anticipation as players wind through Peppermint Forest, past Gumdrop Mountain, and over Lollipop Bridge on their way to King Kandy's Candy Castle.

The board is a visual feast of candy-themed illustration that delights young eyes, and the four chunky gingerbread-person movers are sized perfectly for toddler grips. Special cards featuring beloved characters like Princess Lolly and Mr. Mint add exciting leaps forward (or disappointing slides backward) that teach children the emotional skills of handling both luck and setback — essential board-game social-emotional learning that they will draw upon for decades of game nights to come. Games last 10-15 minutes, perfectly calibrated for preschool attention spans.

Sweet Path is more than a game — it is a family rite of passage. Generations of families share fond memories of their first sessions, and the game continues to serve as the universal entry point into the world of tabletop gaming. Learning to take turns, follow rules, win graciously, and lose without meltdowns are skills that Sweet Path teaches gently, colorfully, and deliciously. This classic edition features the traditional art style that parents and grandparents remember, creating a beautiful cross-generational connection.`,
    keywords: ["sweet path", "classic", "colors", "first game", "simple"],
    ageRange: { min: 3, max: 6 },
    price: 12.99,
    inventory: 60,
    category: "board-games",
    dimensions: { lengthInches: 10.5, widthInches: 8.0, heightInches: 1.5, weightLbs: 0.9 },
    manufacturer: "WonderPlay Games",
    bestSellersRank: 4,
    rating: { stars: 4.6, numberOfRatings: 12450 },
  },
  {
    id: "toy-074",
    name: "Train Routes: First Journey",
    image: "/product-images/toy-074.png",
    description: "Simplified version of the popular train-route game designed for younger players. Collect cards, claim routes across the map. 2-4 players, 20 minutes.",
    marketingCopy: `All aboard the gaming express! Train Routes: First Journey brings the beloved train-route strategy format to younger players with streamlined rules, a colorful new map, and games that play in just 20 minutes. Players collect train cards in six colors and use them to claim routes between cities on the beautiful illustrated board — but the simplified ticket system and shorter routes mean that children as young as six can play competitively without adult coaching.

The game preserves the core satisfaction of the original game: the tension of watching your desired route get claimed by an opponent, the joy of completing a long-distance connection, and the strategic decision of when to collect more cards versus when to claim a route. Oversized train cards are easy for small hands to hold and sort, and the chunky plastic train pieces snap satisfyingly onto the board. Coast-to-coast bonus routes reward ambitious players who connect cities across the entire map.

Train Routes: First Journey is widely regarded as one of the best "gateway" strategy games for families — it teaches set collection, route planning, and competitive strategy without dice-based luck, giving children genuine agency over their success. The 20-minute play time means it fits easily into a busy weeknight, and the "one more game" factor is off the charts. Parents who introduce their children to this game often find themselves pleasantly surprised by the strategic thinking their kids demonstrate — and by how much fun they have playing alongside them.`,
    keywords: ["train routes", "trains", "routes", "strategy", "family"],
    ageRange: { min: 6, max: 12 },
    price: 29.99,
    inventory: 25,
    category: "board-games",
    dimensions: { lengthInches: 11.0, widthInches: 11.0, heightInches: 3.0, weightLbs: 1.8 },
    manufacturer: "RailQuest Games",
    bestSellersRank: 45,
    rating: { stars: 4.7, numberOfRatings: 2890 },
  },
  {
    id: "toy-075",
    name: "Mystery Mansion Junior",
    image: "/product-images/toy-075.png",
    description: "Who ate the last piece of cake? Junior detectives search for clues around the mansion. Simpler gameplay, same deduction fun. 2-6 players.",
    marketingCopy: `The mystery is afoot — and this time, it's delicious! In Mystery Mansion Junior, players don't solve a mystery crime; they solve the case of who ate the last piece of chocolate cake, and at what time, and what drink they had with it. The charming, kid-friendly mystery unfolds across a colorful game board depicting the rooms of a whimsical mansion, where junior detectives move from room to room discovering clues hidden under furniture pieces — a deduction mechanic that is refreshingly physical and interactive.

The game supports 2-6 players and takes about 15-20 minutes to play, making it ideal for family game nights, playdates, and classroom game sessions. The streamlined deduction system uses a simplified suspect roster (six kid characters instead of adult suspects) and a reveal-by-elimination process that young minds can follow intuitively. The satisfaction of correctly identifying the cake thief, the time, and the drink produces triumphant moments that children remember and want to replay immediately.

Deductive reasoning is one of the most valuable cognitive skills a child can develop, and Clue Junior introduces it in a context that feels like play rather than practice. Players must observe what is revealed, remember what has been eliminated, and synthesize available information into a logical conclusion — the same reasoning process used by scientists, diagnosticians, and yes, real detectives. The game naturally builds memory, logical thinking, and the ability to hold and manipulate multiple variables simultaneously, all while delivering the irresistible fun of a good whodunit.`,
    keywords: ["mystery", "mansion", "detective", "deduction", "junior"],
    ageRange: { min: 5, max: 8 },
    price: 18.99,
    inventory: 35,
    category: "board-games",
    dimensions: { lengthInches: 10.5, widthInches: 10.5, heightInches: 2.0, weightLbs: 1.2 },
    manufacturer: "WonderPlay Games",
    bestSellersRank: 38,
    rating: { stars: 4.4, numberOfRatings: 2567 },
  },
  {
    id: "toy-076",
    name: "Island Settlers: Family Edition",
    image: "/product-images/toy-076.png",
    description: "Family-friendly version of the beloved resource-trading game. Build settlements, trade goods, and settle the island. 3-4 players, 45 minutes.",
    marketingCopy: `Welcome to the island where every family becomes a civilization. The Family Edition of this beloved strategy board game retains the core resource-trading, settlement-building, and road-expanding mechanics that have made it a phenomenon, while streamlining the setup and rules for players as young as eight. The modular hex-tile board creates a different island layout every game, ensuring that no two sessions unfold the same way and that strategies must adapt to the terrain.

Players collect five types of resources — lumber, brick, grain, ore, and wool — by building settlements adjacent to productive hexes, then trade resources with each other (or the bank) to fuel expansion. The trading mechanic is the game's secret weapon: it transforms what could be a solitary puzzle into a dynamic, social negotiation game where deal-making, persuasion, and reading opponents become just as important as strategic planning. The family edition includes a quick-start guide that gets new players into their first game in under 10 minutes.

This game has sold millions of copies worldwide because it hits the perfect intersection of strategy, social interaction, and replayability. The Family Edition maintains this magic while reducing game length from 90 minutes to approximately 45 minutes and simplifying the development card deck. Parents report that it becomes a weekly family tradition — a screen-free gathering that generates laughter, heated negotiations, and the kind of shared memories that define a childhood. The premium components — wooden roads and settlements, embossed resource cards, thick hex tiles — make every game feel like an event.`,
    keywords: ["island", "strategy", "trading", "settlers", "family"],
    ageRange: { min: 8, max: 14 },
    price: 34.99,
    inventory: 20,
    category: "board-games",
    dimensions: { lengthInches: 11.5, widthInches: 11.5, heightInches: 3.0, weightLbs: 2.2 },
    manufacturer: "Hexland Games",
    bestSellersRank: 42,
    rating: { stars: 4.7, numberOfRatings: 3456 },
  },
  {
    id: "toy-077",
    name: "Cooperative Game: Forbidden Island",
    image: "/product-images/toy-077.png",
    description: "Work together to capture treasures from a sinking island. A thrilling cooperative game where everyone wins or loses together. 2-4 players.",
    marketingCopy: `Sink or swim — together. Forbidden Island is a cooperative board game where 2-4 players work as a team of intrepid adventurers racing to capture four sacred treasures from a mysterious island that is sinking beneath the waves. There are no opponents at the table — the rising water level is the enemy, and only coordinated teamwork, strategic communication, and smart resource management will save the expedition from a watery grave.

Each player takes on a unique role (diver, pilot, engineer, navigator, explorer, or messenger) with a special ability that contributes to the team's success. Every turn, the island floods a little more — tiles flip to their "flooded" side, and fully flooded tiles sink beneath the sea forever, shrinking the playing field and cutting off escape routes. The tension builds naturally and inexorably, creating genuinely thrilling moments when the team barely escapes a collapsing section or makes a last-second treasure capture.

Cooperative games represent a revolution in board gaming philosophy, and Forbidden Island is the gold standard gateway to the genre. Instead of teaching children to beat each other, it teaches them to communicate strategically, share resources, plan collectively, and celebrate shared success — social skills that translate directly into classroom collaboration, team sports, and workplace dynamics. The game also teaches graceful shared defeat; not every mission succeeds, and learning to analyze what went wrong without assigning blame is a profound life lesson wrapped in a 30-minute adventure.`,
    keywords: ["cooperative", "island", "treasure", "teamwork", "strategy"],
    ageRange: { min: 8, max: 14 },
    price: 22.99,
    inventory: 28,
    category: "board-games",
    dimensions: { lengthInches: 8.0, widthInches: 8.0, heightInches: 2.5, weightLbs: 1.0 },
    manufacturer: "Gamewright",
    bestSellersRank: 55,
    rating: { stars: 4.7, numberOfRatings: 2123 },
  },
  {
    id: "toy-078",
    name: "Face Guesser Classic",
    image: "/product-images/toy-078.png",
    description: "The classic face-guessing game. Ask yes-or-no questions to narrow down the mystery face. Two player deduction fun.",
    marketingCopy: `Does your person have glasses? A hat? A big smile? Face Guesser is the brilliantly simple deduction game that has entertained two-player rivalries for over four decades. Each player selects a mystery character from a roster of 24 colorful faces, then takes turns asking yes-or-no questions to eliminate suspects and identify the opponent's character. The iconic flip-frame boards — with rows of hinged character cards that click down satisfyingly when eliminated — create a tactile, visual experience that digital versions simply cannot replicate.

The game teaches deductive reasoning in its purest form: formulating questions that efficiently partition the remaining possibilities, processing binary information, and maintaining a mental model of eliminated options. Children who play Face Guesser regularly develop sharper categorical thinking and more strategic questioning skills — abilities that transfer to science, math, and everyday problem-solving. The 24-character roster is diverse in appearance, providing rich descriptive vocabulary practice ("Does your person have red hair?" "Are they wearing a hat?" "Do they have freckles?").

Games take about 5-10 minutes, making Face Guesser the perfect quick-play option for waiting rooms, restaurant tables, and rainy-afternoon entertainment. The compact, fold-closed design travels easily, and the robust plastic construction withstands years of enthusiastic flipping and clicking. This classic edition features the traditional character artwork that has become iconic in board-game culture, connecting today's players with a tradition that spans decades and shows no signs of losing its addictive appeal.`,
    keywords: ["face guesser", "deduction", "faces", "two player", "classic"],
    ageRange: { min: 5, max: 10 },
    price: 15.99,
    inventory: 45,
    category: "board-games",
    dimensions: { lengthInches: 10.0, widthInches: 8.0, heightInches: 2.5, weightLbs: 1.0 },
    manufacturer: "WonderPlay Games",
    bestSellersRank: 22,
    rating: { stars: 4.5, numberOfRatings: 4567 },
  },
  {
    id: "toy-079",
    name: "Chess Set – Beginner's Wood",
    image: "/product-images/toy-079.png",
    description: "Handsome wooden chess set with 15-inch folding board that doubles as storage. Includes a beginner's strategy booklet.",
    marketingCopy: `The game of kings, sized for young minds. Our Beginner's Chess Set combines the timeless elegance of a wooden chess board with a thoughtfully designed learning system that takes new players from "which way does the horsey go?" to confident, strategic play. The 15-inch folding board is crafted from walnut and maple inlays with a satin lacquer finish, and the 32 Staunton-style pieces are turned from weighted hardwood with felt bases that glide smoothly across the board.

The board's interior houses a felted compartment that stores all 32 pieces snugly, making this set beautifully portable for parks, cafes, and family trips. The included 32-page strategy booklet covers piece movement, check and checkmate, castling, en passant, and five opening strategies illustrated with clear board diagrams. A notation guide teaches algebraic chess notation so young players can record their games and study them later — the same learning technique used by grandmasters worldwide.

Chess is perhaps the single most studied game in human history, with overwhelming research linking regular chess play to improvements in concentration, planning, pattern recognition, and academic performance — particularly in mathematics. Our set is designed to lower the barrier to entry: the weighted pieces feel substantial and important, the board is beautiful enough to display proudly, and the booklet assumes zero prior knowledge. Schools, chess clubs, and families seeking a meaningful, screen-free intellectual pursuit will find this set to be the perfect starting point for a lifelong journey with the royal game.`,
    keywords: ["chess", "wooden", "strategy", "classic", "beginner"],
    ageRange: { min: 6, max: 14 },
    price: 24.99,
    inventory: 30,
    category: "board-games",
    dimensions: { lengthInches: 15.0, widthInches: 15.0, heightInches: 2.0, weightLbs: 2.0 },
    manufacturer: "Heritage Playthings",
    bestSellersRank: 33,
    rating: { stars: 4.7, numberOfRatings: 3234 },
  },
  {
    id: "toy-080",
    name: "Comparisons Junior",
    image: "/product-images/toy-080.png",
    description: "The hilarious comparisons game for kids. Play a red card that best matches the green card—funniest answer wins. 4-8 players.",
    marketingCopy: `Get ready to laugh until your sides hurt! Comparisons Junior takes the wildly popular party game formula — match a red noun card to a green adjective card — and fills the deck with kid-friendly, sidesplitting content that generates howling laughter around the table. When the judge plays "Scary," will the winning answer be "Thunderstorms," "Broccoli," or "Grandma's Kisses"? The beauty of the game is that there is no objectively right answer — the judge decides, and persuasive (or hilarious) arguments carry the day.

The game plays 4-8 players in about 20 minutes, making it the ideal party game for birthday celebrations, family reunions, sleepovers, and classroom reward time. The 576 cards provide enormous replayability, and the kid-curated content ensures that every card is recognizable and relevant to players aged 7-12. No reading level above basic sight words is required, making the game accessible to a wide range of abilities within the recommended age range.

Comparisons Junior is secretly one of the most effective vocabulary and creative-thinking games available: players must understand the nuance of adjective meanings, generate persuasive arguments, read their audience (the rotating judge), and think laterally about unexpected connections between concepts. All of this cognitive work happens under the cover of pure hilarity, making it the rare game that children beg to play and teachers love to assign. The compact box stores hundreds of cards neatly and fits easily on a game shelf.`,
    keywords: ["comparisons", "matching", "funny", "party", "junior"],
    ageRange: { min: 7, max: 12 },
    price: 14.99,
    inventory: 40,
    category: "board-games",
    dimensions: { lengthInches: 8.0, widthInches: 5.0, heightInches: 3.0, weightLbs: 0.9 },
    manufacturer: "WonderPlay Games",
    bestSellersRank: 28,
    rating: { stars: 4.5, numberOfRatings: 3890 },
  },
  {
    id: "toy-081",
    name: "Tower Tumble Classic",
    image: "/product-images/toy-081.png",
    description: "The classic block-stacking, stack-crashing game. Pull out blocks and stack them on top without toppling the tower. All ages fun.",
    marketingCopy: `Will it hold? The exquisite tension of Tower Tumble — that moment when you slide a block from the middle of a wobbling tower and the whole room holds its breath — is one of the most universal and instantly accessible thrills in all of gaming. The rules take 10 seconds to explain: pull out a block, stack it on top, don't let the tower fall. Yet this simplicity belies a game of surprising skill, strategy, and nerve that captivates players from age six to ninety-six.

The 54 precision-cut hardwood blocks create a tower that begins 18 stories tall and can grow to over 35 stories before its spectacular, crashing collapse. Each block is sanded smooth with slightly rounded edges and manufactured to exacting dimensional tolerances — the slight natural variations between blocks are what create the shifting weight distribution that makes every game unpredictable. The included stacking sleeve makes setup fast and ensures a perfectly aligned starting tower every time.

Tower Tumble is the rare game that needs no opponent — a single player can test their nerve against the tower — yet scales effortlessly to any group size. It has become a staple of family game nights, college dorm rooms, office break rooms, and outdoor barbecues precisely because it transcends age, language, and gaming experience. The physical, tactile nature of the game exercises fine motor control, spatial reasoning, and risk assessment, while the inevitable crash produces a cathartic release of tension that players immediately want to experience again. Tower Tumble is not just a game — it is a shared experience that creates stories.`,
    keywords: ["tower tumble", "stacking", "blocks", "dexterity", "classic"],
    ageRange: { min: 6, max: 14 },
    price: 14.99,
    inventory: 55,
    category: "board-games",
    dimensions: { lengthInches: 8.0, widthInches: 3.0, heightInches: 3.0, weightLbs: 1.5 },
    manufacturer: "WonderPlay Games",
    bestSellersRank: 10,
    rating: { stars: 4.7, numberOfRatings: 9876 },
  },
  {
    id: "toy-082",
    name: "Labyrinth – Moving Maze Game",
    image: "/product-images/toy-082.png",
    description: "Slide the maze walls to create paths and reach your treasures before opponents. A classic strategy maze game. 2-4 players.",
    marketingCopy: `The walls are moving — can you find your way? Labyrinth is a brilliantly engineered strategy game where the maze itself shifts and changes every turn. The board is a grid of fixed and sliding tiles that form a network of corridors and dead ends. On your turn, you push an extra tile into a row or column, physically shifting the maze walls and opening (or closing) paths across the board. Then you move your pawn through the newly configured labyrinth, trying to reach your assigned treasure.

The sliding-maze mechanic is what makes Labyrinth unique in the board-game universe: players must think in two dimensions simultaneously, visualizing how a tile insertion will cascade through the maze and calculating both their own path and the impact on opponents' routes. This spatial-reasoning challenge is deeply engaging for visual thinkers and provides genuine strategic depth — expert players learn to use their tile insertions defensively, blocking opponents while creating their own paths.

With over 15 million copies sold worldwide since its 1986 release, Labyrinth has earned its place among the all-time great family strategy games. The physical satisfaction of sliding tiles and watching the maze transform, combined with the "aha" moment of discovering a newly opened path, delivers a play experience that screens cannot replicate. Games last 20-30 minutes for 2-4 players, and the 24 treasure targets ensure high replayability. The premium game board with its precision-molded tile tracks provides smooth, jam-free sliding that withstands thousands of games.`,
    keywords: ["labyrinth", "maze", "strategy", "sliding", "treasure"],
    ageRange: { min: 7, max: 14 },
    price: 27.99,
    inventory: 22,
    category: "board-games",
    dimensions: { lengthInches: 10.5, widthInches: 10.5, heightInches: 2.5, weightLbs: 1.8 },
    manufacturer: "Ravensburger",
    bestSellersRank: 48,
    rating: { stars: 4.6, numberOfRatings: 2678 },
  },
  // ── PUZZLES ────────────────────────────────────────────────────────────
  {
    id: "toy-083",
    name: "1000-Piece Space Puzzle",
    image: "/product-images/toy-083.png",
    description: "Stunning 1000-piece jigsaw puzzle featuring a detailed illustration of our solar system. Finished size is 27x20 inches.",
    marketingCopy: `Journey through the cosmos one piece at a time with our 1000-Piece Space Puzzle — a breathtaking jigsaw featuring a scientifically accurate, richly illustrated panorama of our solar system. Planets are depicted at relative-brightness scale with accurate surface features (Jupiter's Great Red Spot, Saturn's Cassini Division, Mars's Olympus Mons), set against a deep-field background of galaxies, nebulae, and star clusters. The finished puzzle measures 27x20 inches and makes a stunning wall display when preserved with puzzle glue.

Every piece is precision die-cut from premium recycled cardboard with a linen-texture surface that resists glare and provides a satisfying snap-fit connection. The unique piece shapes ensure that no two are interchangeable — a quality indicator that eliminates the frustration of "almost fits" false positives. The included poster-sized reference print can be placed alongside the work area or mounted separately as companion artwork. The puzzle arrives in a sturdy, illustrated box that stores unfinished work between sessions.

Jigsaw puzzles are increasingly recognized as one of the most effective screen-free activities for developing visual-spatial reasoning, patience, and meditative focus. The space theme adds an educational dimension: as puzzlers search for Saturn's moons or the asteroid belt, they absorb astronomical geography almost unconsciously. This puzzle is rated for ages 8-14 but provides a genuinely challenging, rewarding experience for adult puzzlers as well — making it an ideal family project for rainy weekends, holiday breaks, and quiet evenings. The deep-space background sections provide a satisfying challenge even for experienced puzzlers.`,
    keywords: ["puzzle", "jigsaw", "space", "planets", "solar system"],
    ageRange: { min: 8, max: 14 },
    price: 16.99,
    inventory: 50,
    category: "puzzles",
    dimensions: { lengthInches: 10.0, widthInches: 8.0, heightInches: 3.0, weightLbs: 1.5 },
    manufacturer: "PuzzleCraft",
    bestSellersRank: 40,
    rating: { stars: 4.6, numberOfRatings: 2345 },
  },
  {
    id: "toy-084",
    name: "Floor Puzzle – World Map (48 pieces)",
    image: "/product-images/toy-084.png",
    description: "Giant 3-foot floor puzzle of the world map. Thick, durable pieces sized for small hands. Learn continents, oceans, and landmarks.",
    marketingCopy: `Explore the whole world without leaving your living room! Our Floor Puzzle – World Map is a giant, 3-foot-long jigsaw that assembles into a vibrant, illustrated map of the seven continents and five oceans. Each of the 48 extra-thick pieces is sized for small hands (approximately 4x4 inches) and features a portion of the world map with colorful illustrations of regional landmarks, animals, and cultural icons — the Eiffel Tower in Europe, kangaroos in Australia, penguins in Antarctica, the Great Wall in Asia.

The puzzle is printed on glossy, wipe-clean cardboard that is 50% thicker than standard jigsaw pieces, making it resistant to bending, tearing, and the enthusiastic handling of preschoolers. The pieces interlock firmly enough to survive being walked on (an inevitability with floor puzzles) yet separate easily when it's time to break down and rebuild. The finished puzzle lies flat with no curling corners, creating a play surface that children naturally use for imaginative geography games long after assembly.

Geography educators endorse floor puzzles as one of the most effective tools for building global awareness in young children. The physical act of assembling continents — fitting South America below North America, connecting Africa to Europe via the Mediterranean — creates spatial memories that persist far longer than flat-map viewing. The landmark illustrations spark conversations about different cultures, climates, and ecosystems, transforming puzzle time into a global exploration adventure. The puzzle stores flat in its original box, ready for rebuilding tomorrow.`,
    keywords: ["floor puzzle", "world map", "geography", "giant", "educational"],
    ageRange: { min: 3, max: 6 },
    price: 14.99,
    inventory: 40,
    category: "puzzles",
    dimensions: { lengthInches: 13.0, widthInches: 10.0, heightInches: 2.0, weightLbs: 1.2 },
    manufacturer: "PuzzleCraft",
    bestSellersRank: 24,
    rating: { stars: 4.7, numberOfRatings: 3456 },
  },
  {
    id: "toy-085",
    name: "3D Crystal Puzzle – Dragon",
    image: "/product-images/toy-085.png",
    description: "56-piece translucent crystal puzzle that assembles into a gleaming dragon. Challenging and beautiful display piece when complete.",
    marketingCopy: `Assemble a dragon from pure crystal light. Our 3D Crystal Puzzle challenges builders to fit 56 translucent, jewel-cut acrylic pieces into a stunning three-dimensional dragon sculpture that gleams like a precious gem when placed near a light source. Unlike flat jigsaw puzzles, this is a true spatial puzzle — pieces interlock in three dimensions, requiring builders to think about the dragon's form from multiple angles simultaneously.

Each piece is injection-molded from optically clear acrylic with prismatic facets that refract light into rainbow spectrums. The deep sapphire-blue color of the dragon creates a particularly dramatic effect when backlit. Assembly is guided by numbered piece sequences in the included instruction booklet, but experienced puzzlers can challenge themselves by ignoring the numbers and solving purely by shape and spatial reasoning. The completed dragon stands 5 inches tall on a mirrored base that doubles the visual impact.

3D crystal puzzles occupy a unique niche between toy and art — the solving process exercises spatial reasoning, sequential thinking, and fine motor precision, while the finished product is beautiful enough to display on a desk, shelf, or nightstand. The dragon is the most popular design in our crystal puzzle range, appealing to fantasy enthusiasts, puzzle lovers, and decorative-object collectors alike. The challenge level is genuinely demanding — expect 60-90 minutes for a first solve — making it a satisfying personal accomplishment for tweens and teens seeking intellectual stimulation beyond screens.`,
    keywords: ["3D", "crystal", "dragon", "display", "challenging"],
    ageRange: { min: 10, max: 14 },
    price: 12.99,
    inventory: 35,
    category: "puzzles",
    dimensions: { lengthInches: 5.0, widthInches: 3.0, heightInches: 5.0, weightLbs: 0.4 },
    manufacturer: "BePuzzled",
    bestSellersRank: 78,
    rating: { stars: 4.3, numberOfRatings: 1234 },
  },
  {
    id: "toy-086",
    name: "Puzzle Box – Secret Compartment",
    image: "/product-images/toy-086.png",
    description: "Intricately crafted wooden puzzle box that opens only when you discover the secret sequence of moves. Hides small treasures inside.",
    marketingCopy: `Can you unlock the secret? Our Puzzle Box is a masterfully crafted wooden cube that conceals an interior compartment accessible only to those who discover the correct sequence of slides, twists, and pushes required to open it. Crafted from alternating strips of walnut and maple with precision-fitted sliding panels, this puzzle box requires 7 sequential moves to open — a challenge that typically takes first-time solvers 15-30 minutes of delightful frustration before the satisfying "click" of the final panel sliding free.

The interior compartment is large enough to hold small treasures — jewelry, notes, coins, candy, or tiny gifts — making the puzzle box a brilliant interactive gift-wrapping alternative. Imagine a child's birthday present hidden inside: they must solve the puzzle to access their gift, transforming the unwrapping experience into a memorable brain-teasing adventure. The box measures 3.5 inches cubed and is finished with a hand-rubbed tung oil that highlights the contrasting wood grains beautifully.

Puzzle boxes have a centuries-long tradition in Japanese woodworking (known as "Himitsu-Bako"), and our version honors that heritage while being accessible to modern puzzlers. The mechanism is entirely mechanical — no keys, no magnets, no hidden buttons — and relies solely on the solver's spatial reasoning and systematic experimentation. Once the solution is learned, the box can be opened and closed repeatedly, making it a functional storage piece as well as a brain teaser. The difficulty level is calibrated for ages 8+, but adults find it equally challenging and addictive.`,
    keywords: ["puzzle box", "wooden", "secret", "brain teaser", "compartment"],
    ageRange: { min: 8, max: 14 },
    price: 18.99,
    inventory: 25,
    category: "puzzles",
    dimensions: { lengthInches: 3.5, widthInches: 3.5, heightInches: 3.5, weightLbs: 0.5 },
    manufacturer: "Heritage Playthings",
    bestSellersRank: 69,
    rating: { stars: 4.6, numberOfRatings: 1567 },
  },
  {
    id: "toy-087",
    name: "Progressive Puzzle Set (4 puzzles)",
    image: "/product-images/toy-087.png",
    description: "Four puzzles of increasing difficulty: 12, 24, 36, and 48 pieces. Animal themes. Grows with your child's skill level.",
    marketingCopy: `Start small, dream big! Our Progressive Puzzle Set contains four animal-themed jigsaw puzzles that grow in complexity alongside your child's developing skills: a 12-piece farm puzzle for beginners, a 24-piece ocean puzzle for builders gaining confidence, a 36-piece jungle puzzle for intermediate puzzlers, and a 48-piece Arctic puzzle for young experts ready for a real challenge. Each puzzle is printed on thick, durable cardboard with vibrant, age-appropriate illustrations featuring friendly, expressive animal characters.

The graduated difficulty ensures that children experience success at every stage: the 12-piece puzzle can be completed by most two-year-olds, building the confidence and spatial skills needed to tackle the 24-piece version, and so on up the ladder. The piece sizes decrease as the piece count increases, mirroring the development of fine motor skills that naturally occurs between ages two and five. Each puzzle is stored in its own mini-box within the main set box, making organization simple and allowing individual puzzles to travel to restaurants, waiting rooms, and grandparents' houses.

Puzzle-solving is one of the most heavily researched areas of child development, with consistent findings linking early puzzle play to superior spatial reasoning, mathematical readiness, and academic performance across subjects. Our progressive format maximizes these benefits by keeping children in the "zone of proximal development" — challenged enough to grow, but not so overwhelmed that they disengage. Parents frequently tell us that this set is the one their child reaches for every day, progressing through all four puzzles in a single sitting and then starting over again with the joy of mastery.`,
    keywords: ["progressive", "growing", "animals", "set", "puzzle"],
    ageRange: { min: 2, max: 5 },
    price: 19.99,
    inventory: 42,
    category: "puzzles",
    dimensions: { lengthInches: 10.0, widthInches: 8.0, heightInches: 3.0, weightLbs: 1.0 },
    manufacturer: "PuzzleCraft",
    bestSellersRank: 26,
    rating: { stars: 4.8, numberOfRatings: 2890 },
  },
  {
    id: "toy-088",
    name: "Twist Puzzle Cube – 3x3",
    image: "/product-images/toy-088.png",
    description: "The classic brain-twisting puzzle. Over 43 quintillion combinations, only one solution. Includes a beginner's solution guide.",
    marketingCopy: `43,252,003,274,489,856,000 combinations. One solution. Zero batteries. The twist puzzle cube is the best-selling puzzle in human history, and this original 3x3 edition delivers the same maddeningly addictive challenge that has captivated over 450 million solvers since 1974. Six faces, six colors, and a deceptively simple goal — return each face to a single solid color — conceal a mathematical labyrinth that has humbled geniuses and delighted beginners in equal measure.

This edition features the updated mechanism with smoother, faster turning, reduced friction, and a logo on the white center square. The stickers are replaced with embedded color tiles that will never peel, fade, or chip, and the internal core uses a modern ball-bearing design that allows finger-tricking speeds while remaining forgiving of rough turning. The included beginner's solution guide teaches a layer-by-layer method that gets first-time solvers to a complete cube in 20-30 minutes — a genuine accomplishment that builds confidence for increasingly advanced speed-solving techniques.

The twist puzzle cube is experiencing a massive global renaissance: speedcubing competitions draw tens of thousands of competitors, online tutorials have millions of views, and collecting limited-edition cubes has become a worldwide hobby. Learning to solve the cube develops algorithmic thinking, spatial reasoning, pattern recognition, muscle memory, and the growth mindset that comes from tackling an initially "impossible" challenge and conquering it through systematic effort. Whether you're a first-time solver, a casual fidgeter, or an aspiring speedcuber, this is the original and best.`,
    keywords: ["twist cube", "cube", "brain teaser", "classic", "logic"],
    ageRange: { min: 8, max: 14 },
    price: 9.99,
    inventory: 70,
    category: "puzzles",
    dimensions: { lengthInches: 2.25, widthInches: 2.25, heightInches: 2.25, weightLbs: 0.3 },
    manufacturer: "CubePuzzle Co.",
    bestSellersRank: 13,
    rating: { stars: 4.7, numberOfRatings: 7890 },
  },
  {
    id: "toy-089",
    name: "Tangram Set – Wooden",
    image: "/product-images/toy-089.png",
    description: "Classic Chinese tangram puzzle with 7 wooden pieces and 100 pattern cards from beginner to expert. Teaches geometry and spatial thinking.",
    marketingCopy: `Seven simple shapes, infinite possibilities. The tangram is an ancient Chinese puzzle consisting of seven flat pieces — two large triangles, one medium triangle, two small triangles, one square, and one parallelogram — that can be arranged to form hundreds of recognizable silhouettes: animals, people, letters, vehicles, buildings, and abstract geometric designs. Our set features seven precision-cut hardwood pieces with a satin finish, presented in a wooden tray with a slide-on lid, plus 100 double-sided pattern cards ranging from easy (5+ solutions visible) to expert (requires exact placement and rotation).

The beauty of the tangram lies in its constraint: every design must use all seven pieces, with no overlaps and no gaps. This seemingly simple rule creates a deeply engaging spatial puzzle that exercises geometric reasoning, rotational visualization, and creative problem-solving. Children begin by matching pieces to the outlined solutions on the beginner cards, then progress to silhouette-only cards where they must figure out the piece arrangement independently — a satisfying challenge that builds genuine spatial intelligence.

Tangrams have been used in mathematics education for over 200 years, and modern research confirms their effectiveness: regular tangram play measurably improves geometric understanding, spatial reasoning test scores, and creative-thinking assessments. The tactile, hands-on nature of wooden tangram pieces engages kinesthetic learners who struggle with abstract mathematical concepts on paper. Our set's 100 pattern cards provide months of progressive challenge, and the compact wooden tray makes this puzzle a perfect desk toy, travel companion, and classroom resource.`,
    keywords: ["tangram", "wooden", "geometry", "patterns", "spatial"],
    ageRange: { min: 5, max: 12 },
    price: 11.99,
    inventory: 48,
    category: "puzzles",
    dimensions: { lengthInches: 6.0, widthInches: 6.0, heightInches: 1.0, weightLbs: 0.5 },
    manufacturer: "Heritage Playthings",
    bestSellersRank: 41,
    rating: { stars: 4.7, numberOfRatings: 2345 },
  },
  {
    id: "toy-090",
    name: "1500-Piece Puzzle – Enchanted Forest",
    image: "/product-images/toy-090.png",
    description: "1500-piece jigsaw puzzle featuring a magical forest scene with hidden animals and fairies. Finished size 33x24 inches. Premium matte pieces.",
    marketingCopy: `Lose yourself in the magic of the Enchanted Forest — a 1500-piece jigsaw puzzle that reveals new wonders with every piece placed. The lush, detailed illustration depicts a sun-dappled ancient forest populated by hidden creatures: deer peering through ferns, foxes curled in hollow logs, owls watching from branches, and tiny fairies dancing among the wildflowers. The artist has embedded over 40 hidden details throughout the scene, turning the assembly process into a treasure hunt that keeps builders engaged even during the challenging monochromatic sections.

Every piece is precision die-cut from 2mm premium recycled cardboard with a matte linen-texture finish that eliminates glare under task lighting and provides superior piece-to-piece fit. The random-cut piece shapes ensure zero false positives, and the tight tolerances mean that connected pieces won't separate even when the in-progress puzzle is carefully slid across a table. The finished puzzle measures an impressive 33x24 inches — large enough to appreciate the intricate artwork but manageable on a standard dining table.

This is a puzzle for dedicated puzzlers who crave a multi-session challenge that rewards patience and observational skill. The forest theme provides natural landmarks for sorting (sky, canopy, understory, forest floor, stream), while the hidden creatures add a delightful discovery element that transforms frustrating sections into exciting searches. The premium box includes a full-size reference poster and can be used for flat storage of the in-progress puzzle between sessions. Estimated completion time: 12-20 hours across multiple sessions.`,
    keywords: ["puzzle", "jigsaw", "forest", "fantasy", "large"],
    ageRange: { min: 10, max: 14 },
    price: 21.99,
    inventory: 20,
    category: "puzzles",
    dimensions: { lengthInches: 12.0, widthInches: 10.0, heightInches: 3.5, weightLbs: 2.2 },
    manufacturer: "PuzzleCraft",
    bestSellersRank: 72,
    rating: { stars: 4.5, numberOfRatings: 1123 },
  },
  // ── STEM / SCIENCE ─────────────────────────────────────────────────────
  {
    id: "toy-091",
    name: "Science Lab Chemistry Set",
    image: "/product-images/toy-091.png",
    description: "Safe and exciting chemistry set with 50+ experiments. Includes test tubes, goggles, and all chemicals needed. Real science for curious minds.",
    marketingCopy: `Real science. Real experiments. Real wow. Our Science Lab Chemistry Set puts genuine laboratory equipment and safe, pre-measured chemicals into the hands of young scientists, enabling over 50 hands-on experiments that produce color changes, gas bubbles, crystal formations, pH reactions, and even a miniature volcanic eruption. The set includes 10 test tubes with a rack, safety goggles, a graduated beaker, an Erlenmeyer flask, litmus papers, a stirring rod, a pipette, and sealed packets of citric acid, sodium bicarbonate, calcium chloride, and other kid-safe reagents.

Every experiment is documented in the included 64-page lab manual with clear step-by-step instructions, safety notes, a "what happened?" scientific explanation, and a "try this next" extension activity. Experiments progress from simple (color-changing cabbage-juice pH indicator) to intermediate (exothermic vs. endothermic reactions) to advanced (chromatography separation and crystal growing), providing a structured curriculum that spans months of regular use. The lab manual also includes a section on the scientific method, teaching children to form hypotheses, design experiments, record observations, and draw conclusions.

This chemistry set is designed by science educators to be genuinely educational while remaining safe and approachable. All chemicals are non-toxic household-grade compounds, all glassware is borosilicate (heat and shatter resistant), and all experiments can be performed at a kitchen table with parental supervision. The set meets ASTM F963 toy safety standards and includes a comprehensive safety guide. Parents and teachers consistently report that this is the gift that sparks a lifelong love of science — the one kids remember decades later as the moment they became curious about how the world works.`,
    keywords: ["science", "chemistry", "experiments", "STEM", "lab", "educational"],
    ageRange: { min: 6, max: 12 },
    price: 36.99,
    inventory: 25,
    category: "stem",
    dimensions: { lengthInches: 14.0, widthInches: 10.0, heightInches: 4.0, weightLbs: 2.8 },
    manufacturer: "LabGenius",
    bestSellersRank: 29,
    rating: { stars: 4.6, numberOfRatings: 2890 },
  },
  {
    id: "toy-092",
    name: "Coding Robot Buddy",
    image: "/product-images/toy-092.png",
    description: "Programmable robot that teaches coding basics through play. Use the included coding cards or the free app to program dance moves, sounds, and light shows.",
    marketingCopy: `Meet your child's first programming partner — a charming, expressive robot that learns to dance, sing, flash, and navigate obstacle courses based entirely on code that your child writes. Coding Robot Buddy introduces computational thinking through two input methods: a set of 40 physical coding cards that slide into the robot's card reader (no screen required), and a free companion app (iOS/Android) that provides a block-based visual programming environment for more advanced coders.

The physical coding cards represent fundamental programming concepts — Forward, Turn Left, Turn Right, Loop, If/Then, Function, and Variable — and slot into the reader in sequence to create programs up to 30 steps long. The robot reads the card sequence, beeps confirmation, and then executes the program in real time: rolling across the floor, spinning, playing melodies through its speaker, and flashing its LED eyes in programmed patterns. The app extends this with sensor-reading capabilities (the robot has infrared proximity, tilt, and sound sensors), enabling programs that respond to environmental input.

Computer science educators developed our curriculum ladder, which takes children from simple sequential commands through loops and conditionals to functions and variables — the same progression used in university-level introductory programming courses, presented here through robot dances rather than text editors. The robot's personality — it celebrates successful programs with a victory dance and makes a comically sad face when it bumps into something — creates an emotional connection that sustains engagement far beyond typical learn-to-code products. Rechargeable via USB, runtime approximately 2 hours per charge.`,
    keywords: ["coding", "programming", "robot", "STEM", "technology", "app"],
    ageRange: { min: 5, max: 10 },
    price: 59.99,
    inventory: 15,
    category: "stem",
    dimensions: { lengthInches: 5.0, widthInches: 5.0, heightInches: 6.0, weightLbs: 1.0 },
    manufacturer: "BrightMinds Electronics",
    bestSellersRank: 34,
    rating: { stars: 4.6, numberOfRatings: 2345 },
  },
  {
    id: "toy-093",
    name: "Telescope Starter Kit",
    image: "/product-images/toy-093.png",
    description: "70mm refractor telescope with tripod, 2 eyepieces, and a star map. See the moon's craters and Saturn's rings from your backyard.",
    marketingCopy: `The universe is waiting — and it's closer than you think. Our Telescope Starter Kit puts a genuine 70mm refractor telescope into the hands of young astronomers, delivering views of the Moon's craters, Jupiter's moons, Saturn's rings, star clusters, and the Andromeda galaxy from the comfort of a backyard or balcony. The kit includes the telescope with fully coated glass optics, a lightweight aluminum tripod with smooth altitude-azimuth controls, two eyepieces (20mm for wide views, 10mm for close-ups), a 2x Barlow lens for doubled magnification, a red-dot finderscope, and a laminated star map showing the seasonal constellations.

The 70mm aperture is the sweet spot for beginner telescopes — large enough to gather sufficient light for satisfying planetary detail and deep-sky objects, yet compact enough to set up and transport easily. The fully coated optics minimize chromatic aberration, delivering sharp, high-contrast views with natural color. The altitude-azimuth mount uses slow-motion control cables for smooth tracking, and the tripod adjusts from 24 to 48 inches in height, accommodating both seated and standing observers.

There is a moment — usually the first time a child sees the Moon's craters and mountains with their own eyes through a telescope — when the abstract idea of "space" becomes breathtakingly, tangibly real. That moment of awe is the seed from which lifelong scientific curiosity grows. Our starter kit is designed to make that moment as accessible as possible: the setup takes 10 minutes, the controls are intuitive, and the included star map and quick-start guide walk first-time astronomers through their first observing session step by step. Includes a smartphone adapter for astrophotography through the eyepiece.`,
    keywords: ["telescope", "astronomy", "stars", "space", "science", "STEM"],
    ageRange: { min: 8, max: 14 },
    price: 69.99,
    inventory: 12,
    category: "stem",
    dimensions: { lengthInches: 28.0, widthInches: 8.0, heightInches: 8.0, weightLbs: 5.5 },
    manufacturer: "StarScope Optics",
    bestSellersRank: 64,
    rating: { stars: 4.4, numberOfRatings: 1567 },
  },
  {
    id: "toy-094",
    name: "Microscope Lab – 1200x",
    image: "/product-images/toy-094.png",
    description: "Student microscope with 100x, 400x, and 1200x magnification. Kit includes prepared slides, blank slides, cover slips, and specimen tools.",
    marketingCopy: `Discover the invisible world hiding in plain sight with our Microscope Lab — a genuine optical microscope that reveals the astonishing complexity of everyday objects at 100x, 400x, and 1200x magnification. The kit includes the microscope with three precision-ground glass objective lenses, a rack-and-pinion focus mechanism, a built-in LED illuminator with adjustable brightness, 10 prepared specimen slides, 10 blank slides with cover slips, a specimen collection toolkit (tweezers, pipette, petri dish, and micro-slicer), and a 48-page experiment guide.

The prepared slides showcase the microscopic world's greatest hits: onion skin cells, butterfly wing scales, a cross-section of a leaf, bacteria cultures, crystallized minerals, and more. The experiment guide walks young scientists through preparing their own specimens from household items — salt crystals, fabric fibers, pond water, cheek cells — teaching proper technique while fueling curiosity about the microscopic structure of their world. The LED illuminator provides even, cool lighting that won't heat or damage specimens, and operates on 2 AA batteries (included).

Microscopy is a threshold experience in scientific development — the moment when a child realizes that an entire universe exists below the resolution of their naked eye. This realization fundamentally shifts how they perceive the world, from passive observation to active investigation. Our microscope delivers genuine optical quality (not toy-grade plastic lenses) at an accessible price point, providing views that are sharp, well-lit, and genuinely revelatory. The metal body and glass optics ensure durability and accuracy that will serve a young scientist through elementary school and beyond.`,
    keywords: ["microscope", "science", "biology", "slides", "magnification"],
    ageRange: { min: 8, max: 14 },
    price: 49.99,
    inventory: 18,
    category: "stem",
    dimensions: { lengthInches: 8.0, widthInches: 6.0, heightInches: 12.0, weightLbs: 2.5 },
    manufacturer: "LabGenius",
    bestSellersRank: 61,
    rating: { stars: 4.5, numberOfRatings: 1678 },
  },
  {
    id: "toy-095",
    name: "Solar System Model Kit",
    image: "/product-images/toy-095.png",
    description: "Build and paint a motorized solar system model. Planets orbit the sun at scaled speeds. Includes glow-in-the-dark paint for night display.",
    marketingCopy: `Build the entire solar system on your desk — then watch it come to life. Our Solar System Model Kit provides everything needed to construct a motorized orrery (solar system model) where all eight planets orbit the central Sun at scaled relative speeds: Mercury zips around in seconds while Neptune takes a leisurely minute to complete its journey. The kit includes unpainted planet spheres in accurate relative sizes, a motorized central hub, wire orbit arms, acrylic paints in astronomically accurate colors, glow-in-the-dark paint for night display, and a detailed assembly and painting guide.

Assembly takes approximately 2 hours and involves painting each planet, attaching it to its orbit arm, and connecting the arm to the motorized hub. The painting guide provides reference photos from NASA imagery, but creative painters are encouraged to add their own artistic interpretation. The glow-in-the-dark paint transforms the completed model into a stunning night-light effect — charge it under a lamp, turn off the lights, and watch your solar system glow in the darkness of your bedroom, just like the real thing glows against the blackness of space.

This kit sits at the beautiful intersection of STEM education, arts and crafts, and mechanical assembly — a trifecta that engages diverse learning styles and produces a genuinely impressive finished product. The motorized orbiting mechanism teaches relative orbital periods visually and intuitively, and the painting process demands attention to planetary detail (Jupiter's bands, Mars's red surface, Saturn's ring system) that embeds astronomical knowledge through artistic engagement. The completed model runs on 2 AA batteries and makes a striking display piece that sparks conversations with every visitor.`,
    keywords: ["solar system", "planets", "model", "motorized", "space"],
    ageRange: { min: 6, max: 12 },
    price: 24.99,
    inventory: 30,
    category: "stem",
    dimensions: { lengthInches: 14.0, widthInches: 14.0, heightInches: 5.0, weightLbs: 1.5 },
    manufacturer: "CosmicPlay",
    bestSellersRank: 46,
    rating: { stars: 4.5, numberOfRatings: 2123 },
  },
  {
    id: "toy-096",
    name: "Snap Circuits – Pro (500 experiments)",
    image: "/product-images/toy-096.png",
    description: "Build 500+ electronic projects with snap-together components. Learn about circuits, LEDs, motors, and sensors. No soldering required.",
    marketingCopy: `Welcome to the electronics lab of the future — no soldering iron required. Snap Circuits Pro is the ultimate hands-on electronics education system, featuring over 75 snap-together components that connect on a grid board to create 500+ working electronic projects: AM radio receivers, burglar alarms, doorbells, lie detectors, voice recorders, digital music generators, strobe lights, and hundreds more. Each component — resistors, capacitors, transistors, LEDs, switches, speakers, motors, solar cells, and integrated circuits — snaps into place with color-coded connectors that make correct assembly intuitive and incorrect connections impossible.

The included project manual presents circuits in order of increasing complexity, starting with a simple lamp circuit and progressing through series and parallel configurations, transistor amplifiers, logic gates, and microcontroller-like integrated circuits. Each project page includes a clear grid diagram, a parts list, a "how it works" explanation, and a "modify it" challenge that encourages experimentation beyond the documented design. The educational content is developed by electrical engineers and aligns with Next Generation Science Standards for physical science and engineering.

Snap Circuits has won more education awards than any other electronics toy on the market, and for good reason: it transforms abstract electrical theory into tangible, working projects that children build with their own hands. The snap-together system eliminates the frustration and safety concerns of soldering, breadboarding, and wire stripping, while still teaching real circuit concepts that transfer directly to high school physics and university engineering courses. Every component is labeled with its schematic symbol, so children who start with Snap Circuits can read real circuit diagrams by the time they reach middle school.`,
    keywords: ["circuits", "electronics", "STEM", "snap", "engineering"],
    ageRange: { min: 8, max: 14 },
    price: 64.99,
    inventory: 14,
    category: "stem",
    dimensions: { lengthInches: 19.0, widthInches: 13.0, heightInches: 3.0, weightLbs: 3.0 },
    manufacturer: "Elenco",
    bestSellersRank: 35,
    rating: { stars: 4.8, numberOfRatings: 4567 },
  },
  {
    id: "toy-097",
    name: "Crystal Growing Kit",
    image: "/product-images/toy-097.png",
    description: "Grow 7 vibrant crystals in different colors and shapes. Includes growing powder, display domes, and a geology learning guide.",
    marketingCopy: `Watch science sparkle before your eyes with our Crystal Growing Kit — a seven-experiment set that transforms ordinary powder and water into dazzling, gemstone-like crystals over 7-10 days. Each experiment produces a distinct crystal structure in a different color (amethyst purple, emerald green, sapphire blue, ruby red, citrine yellow, diamond clear, and rose quartz pink), teaching the principles of supersaturation, nucleation, and crystal lattice formation through the most visually stunning science experiment a child can perform at home.

The kit includes seven growing containers, seven packets of crystal-growing compound (non-toxic potassium aluminum sulfate with food-grade dye), seven clear display domes for finished crystals, a magnifying glass, and a 24-page geology guide that explains crystal structure, the Mohs hardness scale, and the real-world minerals that each color represents. The growing process requires only the addition of hot water (adult supervision recommended for this step) and a warm, undisturbed location — the rest is pure chemistry and patience.

Watching crystals grow is a uniquely powerful science experience because it makes an invisible process (molecular self-organization) visible to the naked eye. Children observe their crystal solutions daily, measuring growth, comparing structures, and journaling observations — practicing the scientific method without even realizing it. The finished crystals are genuinely beautiful objects that children proudly display in their rooms for years, serving as permanent reminders of the day they grew a gemstone from a packet of powder and a cup of water. Additional crystal-growing refill packs are available for repeat experiments.`,
    keywords: ["crystal", "growing", "geology", "science", "experiment"],
    ageRange: { min: 6, max: 12 },
    price: 19.99,
    inventory: 35,
    category: "stem",
    dimensions: { lengthInches: 10.0, widthInches: 8.0, heightInches: 3.0, weightLbs: 1.2 },
    manufacturer: "LabGenius",
    bestSellersRank: 43,
    rating: { stars: 4.5, numberOfRatings: 2567 },
  },
  {
    id: "toy-098",
    name: "Weather Station Kit",
    image: "/product-images/toy-098.png",
    description: "Build a real weather station with thermometer, barometer, rain gauge, wind vane, and anemometer. Record data in the included weather journal.",
    marketingCopy: `Become your neighborhood's meteorologist with our Weather Station Kit — a hands-on science project that puts real weather-monitoring instruments into your backyard. The kit includes five functional instruments: a mercury-free spirit thermometer, an aneroid barometer with a calibration dial, a graduated rain gauge, a wind vane with directional compass, and a cup anemometer with a Beaufort scale readout. Each instrument is assembled from the included components (30 minutes total), then mounted outdoors on the provided stake or fence bracket.

The 48-page weather journal is the heart of the educational experience: formatted with daily recording tables for temperature, pressure, rainfall, wind direction, and wind speed, plus weekly summary pages for identifying trends. Margin notes explain meteorological concepts — why pressure drops before storms, how temperature inversions cause fog, why wind direction predicts approaching weather systems — turning daily data collection into a genuine scientific investigation. The journal covers 90 days of observations, enough for a full school-quarter weather project.

Weather is the most accessible branch of earth science because it is literally happening all around us, all the time. This kit transforms passive weather awareness ("it's raining") into active scientific observation ("pressure dropped 4 mb overnight, wind shifted to southwest, cumulus clouds building — I predict afternoon thunderstorms"). Children who monitor weather develop data literacy, graphing skills, pattern recognition, and the evidence-based prediction abilities that form the foundation of scientific thinking. The instruments are durable enough for year-round outdoor exposure and accurate enough for genuine data collection.`,
    keywords: ["weather", "station", "meteorology", "science", "outdoor"],
    ageRange: { min: 7, max: 12 },
    price: 29.99,
    inventory: 22,
    category: "stem",
    dimensions: { lengthInches: 12.0, widthInches: 8.0, heightInches: 4.0, weightLbs: 1.8 },
    manufacturer: "LabGenius",
    bestSellersRank: 70,
    rating: { stars: 4.4, numberOfRatings: 1234 },
  },
  {
    id: "toy-099",
    name: "Anatomy Model – Human Body",
    image: "/product-images/toy-099.png",
    description: "12-inch human body model with 24 removable organs and bones. Comes with an illustrated anatomy guide. Medical-grade accuracy.",
    marketingCopy: `Look inside yourself — literally. Our Human Body Anatomy Model is a 12-inch standing figure with 24 removable organs and skeletal elements that teach children the remarkable architecture of the human body through hands-on exploration. Remove the chest plate to reveal the heart, lungs, and ribcage. Lift out the stomach and intestines to see the kidneys and spine behind them. The brain lifts out of the skull in two hemispheres. Every organ is painted in anatomically accurate colors and labeled with tiny text that matches the entries in the included 32-page illustrated anatomy guide.

The model is manufactured from medical-grade PVC with the same precision and detail used in professional anatomical models — this is not a cartoon approximation but a genuinely accurate representation of human internal anatomy at 1:5 scale. The organs fit into the body cavity with gentle friction connections that allow easy removal and replacement without tools. The skeleton is visible through the transparent sections of the torso, showing the relationship between bones and organs in three dimensions.

Anatomy exploration is a profoundly engaging learning experience for children, combining the puzzle-like satisfaction of assembling organs into their correct positions with the genuine wonder of understanding how their own bodies work. Children who interact with anatomy models demonstrate significantly better health literacy, use more precise medical vocabulary, and show less anxiety during doctor visits. The model makes an outstanding science fair centerpiece, homeschool resource, or gift for any child who has ever asked "what's inside me?" — and been unsatisfied with a flat textbook illustration.`,
    keywords: ["anatomy", "human body", "organs", "biology", "model"],
    ageRange: { min: 8, max: 14 },
    price: 34.99,
    inventory: 20,
    category: "stem",
    dimensions: { lengthInches: 5.0, widthInches: 5.0, heightInches: 12.0, weightLbs: 1.5 },
    manufacturer: "LabGenius",
    bestSellersRank: 58,
    rating: { stars: 4.6, numberOfRatings: 1890 },
  },
  {
    id: "toy-100",
    name: "Electricity & Magnetism Lab",
    image: "/product-images/toy-100.png",
    description: "Hands-on experiments with electromagnets, generators, and motors. Build a working compass, telegraph, and electric quiz game.",
    marketingCopy: `Harness the invisible force that powers the modern world. Our Electricity & Magnetism Lab provides hands-on experiments that demystify the fundamental physics of electromagnetism — the same force that drives every motor, generator, and electronic device on Earth. The kit includes copper wire, iron cores, bar magnets, a compass, batteries with holders, LED bulbs, switches, a buzzer, iron filings, and all the components needed to build 20 working devices: an electromagnet, a simple motor, a generator, a telegraph, an electric quiz game, and more.

Each experiment is documented in the 48-page lab manual with clear diagrams, step-by-step assembly instructions, and a "physics explained" section that connects the hands-on experience to the underlying scientific principles. Children build an electromagnet and discover that more wire coils create stronger magnetic fields. They spin a motor and understand that electric current flowing through a magnetic field creates mechanical force. They crank a generator and feel the resistance that turns mechanical energy into electrical energy. These tactile, visceral experiences create deep understanding that textbook diagrams alone cannot achieve.

Electricity and magnetism are notoriously abstract concepts for students at every level — but they don't have to be. When a child builds a working telegraph and sends messages in Morse code to a friend across the room, electromagnetic induction stops being an equation and becomes an experience. When they use iron filings to visualize magnetic field lines radiating from a bar magnet, abstract vector fields become visible, tangible reality. This kit transforms some of physics' most important and challenging concepts into hands-on adventures that make children say "so THAT'S how it works!" — the most rewarding words in science education.`,
    keywords: ["electricity", "magnetism", "physics", "experiments", "STEM"],
    ageRange: { min: 8, max: 14 },
    price: 27.99,
    inventory: 24,
    category: "stem",
    dimensions: { lengthInches: 12.0, widthInches: 8.0, heightInches: 3.0, weightLbs: 1.8 },
    manufacturer: "LabGenius",
    bestSellersRank: 62,
    rating: { stars: 4.5, numberOfRatings: 1456 },
  },
  {
    id: "toy-101",
    name: "Robotics Engineering Kit",
    image: "/product-images/toy-101.png",
    description: "Build 10 different motorized machines from 230+ pieces. Includes motors, gears, and axles. Learn mechanical engineering principles.",
    marketingCopy: `Design. Build. Motorize. Our Robotics Engineering Kit contains over 230 precision-engineered pieces — beams, gears, axles, wheels, connectors, and two battery-powered motors — that assemble into 10 different motorized machines: a walking robot, a crane with a working winch, a race car, a spinning top launcher, a conveyor belt, and five more mechanical marvels. Each build teaches specific engineering principles: gear ratios, torque, mechanical advantage, cam mechanisms, and power transmission.

The 80-page engineering manual is organized like a real engineering textbook, with each chapter introducing a mechanical concept, demonstrating it with a build project, and then posing an "engineer's challenge" that requires the builder to modify the design to improve performance. How do you make the walking robot faster? Change the gear ratio. How do you make the crane lift heavier loads? Add a compound pulley. These iterative design challenges transform passive building into active engineering problem-solving.

The pieces are compatible with other leading construction systems (Meccano, Erector, and similar), so experienced builders can incorporate their existing collections into increasingly ambitious projects. Every component is manufactured from anodized aluminum and engineering-grade nylon for industrial-quality durability that withstands thousands of build-rebuild cycles. This kit is used in STEM education programs across the country and is the recipient of multiple engineering-education awards. For children who are ready to move beyond snap-together building into genuine mechanical engineering, this is the essential next step.`,
    keywords: ["robotics", "engineering", "motors", "gears", "machines"],
    ageRange: { min: 8, max: 14 },
    price: 42.99,
    inventory: 17,
    category: "stem",
    dimensions: { lengthInches: 16.0, widthInches: 12.0, heightInches: 4.0, weightLbs: 3.2 },
    manufacturer: "GravityWorks",
    bestSellersRank: 53,
    rating: { stars: 4.6, numberOfRatings: 1345 },
  },
  {
    id: "toy-102",
    name: "Bug Catcher & Observation Kit",
    image: "/product-images/toy-102.png",
    description: "Catch-and-release bug kit with magnifying jar, tweezers, net, and field guide. Ventilated observation chamber for safe insect study.",
    marketingCopy: `Go on a safari — in your own backyard! Our Bug Catcher & Observation Kit equips young entomologists with everything they need to safely catch, observe, and release insects and other small creatures. The kit includes a pop-up butterfly net with a telescoping handle, a ventilated observation chamber with a built-in 4x magnifying lid, soft-grip tweezers for gentle handling, a headlamp for nighttime collecting, a specimen jar with a magnifying base, and a 48-page illustrated field guide covering 100 common North American insects and spiders.

The observation chamber is the kit's centerpiece — a clear, cylindrical habitat with air holes, a hinged access lid, and a magnifying viewer built into the top. Children can observe their catch for minutes or hours, watching behaviors, counting legs, examining wing patterns, and sketching anatomical details before releasing the creature unharmed. The field guide is organized by habitat (garden, woodland, water, house) with identification photos, range maps, and fun facts that turn every catch into a learning moment.

Nature observation is one of the most powerful catalysts for environmental awareness and scientific curiosity in children. The hands-on experience of catching a butterfly, observing its proboscis through a magnifier, and then setting it free creates a personal connection to wildlife that documentaries and textbooks cannot match. Our kit emphasizes the "catch and RELEASE" ethic throughout, teaching responsible interaction with living creatures. The mesh net is gentle enough to capture without harming even delicate butterflies, and the observation chamber provides adequate ventilation and space for temporary housing. This kit is where budding biologists begin.`,
    keywords: ["bugs", "insects", "nature", "observation", "outdoor", "science"],
    ageRange: { min: 4, max: 10 },
    price: 16.99,
    inventory: 40,
    category: "stem",
    dimensions: { lengthInches: 10.0, widthInches: 6.0, heightInches: 8.0, weightLbs: 0.8 },
    manufacturer: "NatureCraft Co.",
    bestSellersRank: 32,
    rating: { stars: 4.6, numberOfRatings: 2890 },
  },
  {
    id: "toy-103",
    name: "Coding Board Game – Robot Turtles",
    image: "/product-images/toy-103.png",
    description: "Board game that teaches programming fundamentals without a computer. Write 'code' with cards to navigate your turtle to the jewel. 2-4 players.",
    marketingCopy: `Teach your kids to code before they can read — no screen required. Robot Turtles is the most-backed board game in Kickstarter history, and it earns that distinction by making programming concepts tangible, social, and hilarious for children as young as four. Each player controls a turtle on a gridded game board, playing instruction cards (Forward, Turn Left, Turn Right) to navigate through obstacles (ice walls and stone walls) to reach a jewel. The adult "Turtle Mover" executes the code physically, moving the turtle exactly as programmed — including into walls when the code has a bug.

The game introduces programming concepts progressively across three difficulty levels. Level 1 teaches sequential instructions. Level 2 adds the Function Frog card, which stores a reusable sequence of moves — teaching the concept of functions. Level 3 introduces the laser card, which melts ice walls, adding conditional logic to the planning process. The difficulty ramp is so gentle that children absorb foundational computer science concepts without any awareness that they are "learning" — they are simply playing a game, writing code with cards, and laughing when their turtle bonks into a wall.

The genius of Robot Turtles is that it teaches computational thinking — decomposition, pattern recognition, abstraction, and algorithmic design — through a physical, social, screen-free medium. Children learn that code must be precise, that debugging is a normal and expected part of the process, and that there are often multiple correct solutions to the same problem. These insights transfer directly to any programming language or computational task they will encounter later. The game plays in 10-15 minutes and has effectively infinite replayability due to the randomized board setup.`,
    keywords: ["coding", "board game", "programming", "turtles", "logic"],
    ageRange: { min: 4, max: 8 },
    price: 24.99,
    inventory: 28,
    category: "stem",
    dimensions: { lengthInches: 10.5, widthInches: 10.5, heightInches: 2.5, weightLbs: 1.5 },
    manufacturer: "Gamewright",
    bestSellersRank: 44,
    rating: { stars: 4.7, numberOfRatings: 2345 },
  },
  {
    id: "toy-104",
    name: "3D Pen – Kid-Safe",
    image: "/product-images/toy-104.png",
    description: "Low-temperature 3D pen that uses kid-safe biodegradable filament. Draw in the air and create 3D sculptures. Includes stencils and 10 filament colors.",
    marketingCopy: `Draw in three dimensions — literally. Our Kid-Safe 3D Pen extrudes warm, biodegradable filament that hardens within seconds of leaving the pen tip, allowing children to draw structures, sculptures, and decorations that stand up, stick together, and exist in real three-dimensional space. The pen operates at a low temperature (PCL filament melts at just 70°C/158°F versus 200°C+ for standard 3D printer filament), making it safe for direct finger contact with freshly drawn lines — a critical safety feature for young creators.

The pen is USB rechargeable with an ergonomic triangular grip that promotes proper hand positioning, a variable-speed extrusion button, and an automatic shut-off after 5 minutes of inactivity. The kit includes 10 colors of PCL filament (100 feet total), 20 reusable plastic stencil sheets (trace flat shapes, then fold them into 3D objects), and a project booklet with step-by-step instructions for 15 creations: glasses, a butterfly, a bicycle, a castle, a dinosaur, and more.

3D pens occupy a unique creative niche — they combine the freeform expressiveness of drawing with the structural dimensionality of sculpture, producing results that feel almost magical. Children start with guided stencil projects and quickly progress to freehand 3D drawing as they develop an intuitive sense of how the filament behaves in space. The biodegradable PCL filament is non-toxic, odorless, and dissolves in hot water, making cleanup effortless and environmental impact minimal. This is the creative tool that makes children feel like they have superpowers — the ability to draw objects into existence.`,
    keywords: ["3D pen", "drawing", "sculpture", "creative", "STEM"],
    ageRange: { min: 8, max: 14 },
    price: 34.99,
    inventory: 20,
    category: "stem",
    dimensions: { lengthInches: 7.5, widthInches: 2.0, heightInches: 2.0, weightLbs: 0.4 },
    manufacturer: "BrightMinds Electronics",
    bestSellersRank: 56,
    rating: { stars: 4.4, numberOfRatings: 1678 },
  },
  // ── OUTDOOR & ACTIVE ───────────────────────────────────────────────────
  {
    id: "toy-105",
    name: "Outdoor Explorer Binoculars",
    image: "/product-images/toy-105.png",
    description: "Kid-tough binoculars with 8x magnification, rubber-coated body, and neck strap. Comes with a bird-watching guide and nature journal.",
    marketingCopy: `See the world up close with our Outdoor Explorer Binoculars — real optics engineered for the rough-and-tumble life of a young adventurer. These aren't toy binoculars with plastic lenses and blurry views; they feature genuine BAK-4 prism glass optics with fully multi-coated lenses delivering crisp, bright, 8x21 magnification that brings distant birds, wildlife, and landscapes into sharp focus. The rubber-armored body absorbs drops and impacts, and the compact fold-down design fits comfortably in small hands.

The kit includes a breakaway neck strap (releases under 5 lbs of force for safety), a microfiber cleaning cloth, a belt-clip carrying case, a 32-page illustrated bird-watching guide covering 50 common North American species, and a spiral-bound nature journal with prompts for recording sightings, sketching wildlife, and tracking seasonal changes. The adjustable interpupillary distance (the eye-to-eye spread) accommodates the narrower face width of children, ensuring comfortable, strain-free viewing — a critical detail that most "kid" binoculars fail to address.

Bird-watching is one of the fastest-growing hobbies in the world, and it starts with a good pair of binoculars and a curious mind. Our explorer set provides both, along with the guided resources that transform random looking into purposeful observation. Children who bird-watch develop patience, stillness, attention to detail, and a deep connection to the natural world. The included journal creates a record of observations that children treasure for years, flipping back to remember the day they spotted their first hawk, heron, or hummingbird.`,
    keywords: ["binoculars", "nature", "outdoor", "birds", "exploration"],
    ageRange: { min: 4, max: 10 },
    price: 26.99,
    inventory: 30,
    category: "outdoor",
    dimensions: { lengthInches: 4.5, widthInches: 4.0, heightInches: 2.5, weightLbs: 0.5 },
    manufacturer: "NatureCraft Co.",
    bestSellersRank: 47,
    rating: { stars: 4.6, numberOfRatings: 2345 },
  },
  {
    id: "toy-106",
    name: "Kick Scooter Pro",
    image: "/product-images/toy-106.png",
    description: "Adjustable-height kick scooter with light-up wheels and a wide deck. Folds flat for easy storage. Supports up to 110 lbs.",
    marketingCopy: `Glide, cruise, and glow with our Kick Scooter Pro — a premium two-wheel scooter that grows with your child from kindergarten through middle school. The handlebars adjust through four height positions (24 to 34 inches), accommodating riders from about 42 to 60 inches tall. The extra-wide aluminum deck provides stable footing, the rear friction brake delivers reliable stopping power, and the 120mm polyurethane wheels are embedded with motion-activated LEDs that create a dazzling light show with every ride — no batteries required.

The scooter folds flat in one second with a patented lever mechanism, making it easy to carry into school, toss in a car trunk, or hang on a hook in the garage. The lightweight aluminum frame weighs just 5.5 pounds yet supports riders up to 110 lbs, and the ABEC-7 bearings deliver a smooth, fast roll on pavement, sidewalks, and bike paths. The rubberized handlebar grips absorb vibration and provide secure hold in all weather conditions, and the standing deck features a grit-tape surface for slip-resistant footing.

Scootering is a gateway to active outdoor play that meets children where they are — the learning curve is gentle enough for five-year-olds, while the speed and agility ceiling is high enough for twelve-year-olds to push their limits. Regular scootering builds leg strength, balance, coordination, and cardiovascular fitness, and the simple joy of wind-in-your-hair cruising is a powerful antidote to sedentary screen time. Our scooter is designed to be the last kick scooter your child will need, with adjustable sizing, durable construction, and a sleek look that riders of any age feel proud to be seen on.`,
    keywords: ["scooter", "outdoor", "wheels", "riding", "active"],
    ageRange: { min: 5, max: 12 },
    price: 54.99,
    inventory: 19,
    category: "outdoor",
    dimensions: { lengthInches: 28.0, widthInches: 5.0, heightInches: 34.0, weightLbs: 5.5 },
    manufacturer: "GlideRider",
    bestSellersRank: 18,
    rating: { stars: 4.7, numberOfRatings: 4567 },
  },
  {
    id: "toy-107",
    name: "Stomp Rocket Launcher",
    image: "/product-images/toy-107.png",
    description: "Jump on the air pad and launch foam rockets up to 200 feet in the air. No batteries needed. Includes 6 rockets and adjustable launch angle.",
    marketingCopy: `3... 2... 1... STOMP! Our Stomp Rocket Launcher harnesses the most powerful energy source available — a child's enthusiasm — to send foam rockets screaming up to 200 feet into the air. The concept is beautifully simple: connect the air pad to the launch tube via the flexible hose, place a foam rocket on the tube, and stomp on the pad as hard as you can. The displaced air fires the rocket skyward at impressive velocity, and the adjustable launch angle lets rocketeers dial in anything from straight-up altitude shots to long-distance trajectory arcs.

Six foam rockets are included — three standard and three "extreme" with fins for higher, more stable flights. The rockets are made from soft, lightweight EVA foam that is completely safe if (when) they land on someone. The air pad and launch tube are made from heavy-duty vinyl and ABS plastic respectively, designed to withstand thousands of enthusiastic stomps. No batteries, no fuel, no moving parts to break — the entire system runs on compressed air generated by the human foot, making it maintenance-free, weather-proof, and endlessly reusable.

The physics of rocket flight — thrust, drag, angle of attack, parabolic trajectory — emerge naturally as children experiment with stomp force and launch angle, making this one of the most effective (and most fun) informal physics education tools ever designed. The competitive element is irresistible: who can launch the highest? The farthest? Most accurately into the bucket target? Stomp rockets transform any outdoor space into a launch facility and any group of children into a cheering, stomping, rocket-chasing celebration of pure kinetic joy.`,
    keywords: ["rocket", "stomp", "outdoor", "launching", "foam"],
    ageRange: { min: 4, max: 10 },
    price: 24.99,
    inventory: 40,
    category: "outdoor",
    dimensions: { lengthInches: 22.0, widthInches: 6.0, heightInches: 4.0, weightLbs: 1.2 },
    manufacturer: "SkyBound Toys",
    bestSellersRank: 15,
    rating: { stars: 4.7, numberOfRatings: 5678 },
  },
  {
    id: "toy-108",
    name: "Archery Set – Suction Cup",
    image: "/product-images/toy-108.png",
    description: "Safe archery set with fiberglass bow, 6 suction-cup arrows, and a freestanding target. Indoor/outdoor use. Adjustable draw weight.",
    marketingCopy: `Take aim and let fly with our Suction Cup Archery Set — a genuine archery experience scaled for young archers with all the thrill and none of the danger. The 36-inch fiberglass bow features an adjustable draw weight (10-20 lbs) that accommodates beginners and intermediate shooters, a contoured grip with finger rest, and a real bowstring with a nocking point. Six foam-shaft arrows tipped with rubber suction cups fly straight and true, sticking satisfyingly to the included freestanding target board with a bullseye-and-ring scoring system.

The target board stands 36 inches tall on fold-out legs and can be used indoors on hard floors or outdoors on grass. The suction cups adhere to any smooth surface (the target face is a glossy laminate), making scoring unambiguous — the arrow sticks where it hits. The arrows' foam shafts and rubber tips ensure complete safety even at close range, allowing indoor practice during inclement weather. The bow includes a forearm guard and a finger tab to teach proper archery form from the start.

Archery is one of the oldest sports in human history, and its appeal to children is timeless — the focus, the draw, the release, and the satisfying thwack of a bullseye combine physical skill with mental discipline in a uniquely rewarding way. Our set teaches proper stance, grip, draw, aim, and release through the included technique guide, building skills that transfer directly to real archery when children are old enough for recurve or compound bows. The focus and breath control required for accurate shooting have been shown to improve concentration in other areas of life as well — making this toy both fun and genuinely beneficial.`,
    keywords: ["archery", "bow", "arrows", "target", "outdoor"],
    ageRange: { min: 6, max: 12 },
    price: 29.99,
    inventory: 28,
    category: "outdoor",
    dimensions: { lengthInches: 36.0, widthInches: 6.0, heightInches: 2.0, weightLbs: 1.5 },
    manufacturer: "Adventure Toys Co.",
    bestSellersRank: 39,
    rating: { stars: 4.5, numberOfRatings: 2123 },
  },
  {
    id: "toy-109",
    name: "Slip-N-Slide Mega Wave",
    image: "/product-images/toy-109.png",
    description: "25-foot water slide with built-in splash pool at the end. Connects to any garden hose. Includes repair patches.",
    marketingCopy: `Summer just got 25 feet longer! Our Slip-N-Slide Mega Wave turns any lawn into a water park with a quarter-inch-thick vinyl slide surface, built-in side bumpers that keep sliders on track, a continuous-spray water channel that keeps the surface slippery from start to finish, and a splash pool at the end that catches sliders in a cushion of cool water. Simply connect to any standard garden hose, turn on the water, and the fun begins — no inflating, no setup tools, no complicated assembly.

The 25-foot length provides enough runway for genuinely impressive slide distances, and the continuous-spray system eliminates dry patches that cause friction burns on lesser slides. The side bumpers are 6 inches tall, high enough to keep even enthusiastic adult sliders (we know you want to try it) on the track. The splash pool inflates in minutes with the included pump and holds enough water to cushion landings comfortably. Three self-adhesive repair patches are included for the inevitable thorn-in-the-lawn puncture.

Water slide play is the essence of summer childhood — the anticipation of the run-up, the exhilaration of the slide, the splash of the landing, and the immediate dash back to the start for another go. Our Mega Wave is constructed from heavy-duty PVC that outperforms the thin vinyl of budget alternatives, resisting tears and UV degradation through multiple summers of use. The compact roll-up design stores easily in a garage or shed between uses, and the quick-connect hose fitting detaches in seconds. Best used on a gentle downhill grade for maximum velocity — your kids' laughter will be audible from three houses away.`,
    keywords: ["water slide", "slip", "outdoor", "summer", "splash"],
    ageRange: { min: 5, max: 12 },
    price: 34.99,
    inventory: 22,
    category: "outdoor",
    dimensions: { lengthInches: 300.0, widthInches: 40.0, heightInches: 0.25, weightLbs: 4.0 },
    manufacturer: "SplashZone",
    bestSellersRank: 19,
    rating: { stars: 4.4, numberOfRatings: 3456 },
  },
  {
    id: "toy-110",
    name: "Pogo Stick – Adjustable",
    image: "/product-images/toy-110.png",
    description: "Steel-frame pogo stick with adjustable spring for riders 40-90 lbs. Non-slip foot pads and foam-covered handles. Builds balance and coordination.",
    marketingCopy: `Bounce your way to adventure with our Adjustable Pogo Stick — a steel-frame bouncer that turns driveways, sidewalks, and backyards into springboard playgrounds. The heavy-duty internal spring is adjustable to three tension settings, accommodating riders from 40 to 90 pounds and allowing the pogo experience to grow with your child. The wide, non-slip foot pads provide secure footing, the foam-padded handlebar grips absorb impact and prevent blisters, and the durable rubber tip grips pavement, concrete, and packed dirt without slipping.

The learning curve is part of the fun: first-time pogoers typically graduate from assisted bouncing (holding a parent's hand) to solo hopping within 15-20 minutes, and the sense of accomplishment when they achieve their first independent bounce is enormous. From there, the skill ceiling is surprisingly high — experienced riders learn to bounce continuously, hop on one foot, spin, and even perform tricks. The pogo stick builds core strength, leg power, balance, and proprioceptive awareness in a package that feels like pure play rather than exercise.

Pogo sticking is one of those rare activities that is simultaneously nostalgic (parents remember their own childhood pogo sticks) and genuinely exciting for modern kids raised on screens. The physical, kinesthetic, whole-body engagement is exactly the kind of active play that pediatricians recommend for developing bodies and brains. Our pogo stick is built to commercial-playground standards with welded steel construction, aircraft-grade spring steel, and replaceable rubber tips, ensuring years of reliable bouncing. Weight capacity reaches 90 lbs, covering most riders through age 10.`,
    keywords: ["pogo", "jumping", "balance", "outdoor", "active"],
    ageRange: { min: 5, max: 10 },
    price: 32.99,
    inventory: 25,
    category: "outdoor",
    dimensions: { lengthInches: 37.0, widthInches: 6.0, heightInches: 4.0, weightLbs: 4.0 },
    manufacturer: "BounceKing",
    bestSellersRank: 50,
    rating: { stars: 4.4, numberOfRatings: 1890 },
  },
  {
    id: "toy-111",
    name: "Frisbee Golf Disc Set",
    image: "/product-images/toy-111.png",
    description: "Three disc set (driver, mid-range, putter) sized for kids. Includes portable basket target and course setup guide.",
    marketingCopy: `Par for the fun! Our Frisbee Golf Disc Set brings the fastest-growing sport in America to your backyard with three professional-style discs scaled for young arms and a portable chain-basket target that sets up in seconds. The set includes a driver (long, flat, and fast for tee shots), a mid-range disc (versatile for approach shots), and a putter (rounded and stable for short-range accuracy) — each one lighter and smaller than adult discs, with softer edges for comfortable catching and safe near-miss impacts.

The portable basket target features a chain-curtain catching mechanism that works exactly like course baskets: throw the disc into the chains, watch it drop into the basket, and celebrate your ace. The target folds flat for storage and transport, and the included course-setup guide explains how to create a 9-hole backyard course using trees, mailboxes, lamp posts, and other landmarks as tee pads. Distance recommendations, par assignments, and scorecards are provided for immediate play.

Disc golf is uniquely accessible — the basic throwing motion is intuitive, the equipment is minimal, and the learning curve rewards practice with visible improvement that builds confidence. The sport combines outdoor exercise, spatial planning, and competitive scoring in a format that families can enjoy together regardless of age or athletic ability. Our kid-sized discs fly predictably and far enough (80-120 feet for most children) to create genuine course-play experiences, while the softer plastic and lighter weight eliminate any concern about property damage or injury during errant throws.`,
    keywords: ["frisbee", "disc golf", "outdoor", "throwing", "sport"],
    ageRange: { min: 6, max: 14 },
    price: 27.99,
    inventory: 20,
    category: "outdoor",
    dimensions: { lengthInches: 10.0, widthInches: 10.0, heightInches: 6.0, weightLbs: 2.0 },
    manufacturer: "DiscDash",
    bestSellersRank: 75,
    rating: { stars: 4.5, numberOfRatings: 1234 },
  },
  {
    id: "toy-112",
    name: "Slackline Kit – Beginner",
    image: "/product-images/toy-112.png",
    description: "50-foot slackline with training line, tree protectors, and ratchet tensioner. Teaches balance and core strength. Holds up to 250 lbs.",
    marketingCopy: `Walk the line — literally. Our Beginner Slackline Kit provides everything needed to set up a 50-foot balance challenge between two trees: a 2-inch-wide webbing slackline rated to 4,000 lbs, a ratchet tensioner with a protective cover, two tree-protector wraps that prevent bark damage, and — the feature that makes our kit uniquely beginner-friendly — an overhead training line with handles that gives new slackliners a confidence-building assist while they develop their balance.

The training line runs parallel above the main slackline, with adjustable-height handles that hang down at arms' reach. Beginners grip the handles for stability during their first crossing attempts, gradually relying on them less as their balance improves, until eventually they're walking the line unassisted. This progressive support system dramatically reduces the frustration that causes most beginners to quit, transforming the "impossible" feeling of first-time slacklining into a manageable, step-by-step skill progression.

Slacklining is one of the most effective balance-training activities available — physical therapists, yoga practitioners, and athletes use it to develop core stability, proprioception, and body awareness. For children, slacklining builds all of these physical skills while also teaching persistence, mindfulness, and the growth mindset needed to master a genuinely challenging physical skill. The setup takes about 10 minutes between two solid trees spaced 15-50 feet apart, and the ratchet tensioner allows precise adjustment of line tightness. The 250-lb weight capacity accommodates adults who inevitably want to try it themselves.`,
    keywords: ["slackline", "balance", "outdoor", "tightrope", "core"],
    ageRange: { min: 6, max: 14 },
    price: 44.99,
    inventory: 15,
    category: "outdoor",
    dimensions: { lengthInches: 12.0, widthInches: 8.0, heightInches: 6.0, weightLbs: 6.0 },
    manufacturer: "BounceKing",
    bestSellersRank: 68,
    rating: { stars: 4.5, numberOfRatings: 1456 },
  },
  {
    id: "toy-113",
    name: "Kite – Rainbow Delta",
    image: "/product-images/toy-113.png",
    description: "Easy-flying 5-foot delta kite with rainbow panels and a 10-foot streamer tail. Flies in light winds. Includes 200 feet of line on a winder.",
    marketingCopy: `Paint the sky with color! Our Rainbow Delta Kite is a showstopping 5-foot-wide delta design that soars effortlessly in winds as light as 5 mph, making it the ideal kite for beginners and experienced flyers alike. The ripstop nylon sail features vivid rainbow panels that catch the sunlight dramatically, and the 10-foot rainbow streamer tail adds graceful, undulating movement that mesmerizes from the ground. The kite launches in seconds — hold it up, let the wind catch it, and watch it climb.

The delta shape is inherently stable, requiring no assembly beyond sliding two fiberglass spar rods into sewn sleeves (30 seconds total). Once airborne, the kite flies itself, maintaining altitude and orientation with minimal line management. The included 200 feet of 50-lb-test polyester line on a wound handle provides ample altitude for impressive high-flying displays. The line winds and unwinds smoothly from the ergonomic spool handle, and the swivel clip attaches to the kite's bridle point for tangle-free flying.

Kite flying is one of the simplest, most joyful outdoor activities available — it requires nothing more than a breeze and an open space, yet it delivers a uniquely satisfying sense of connection between the flyer on the ground and their creation dancing in the sky. Children intuitively learn about wind direction, aerodynamics, tension, and the relationship between line length and altitude. The experience is meditative for adults and exhilarating for children, making it a rare activity that genuinely pleases every member of a family outing. The kite stuffs into the included nylon carry bag for compact transport and storage.`,
    keywords: ["kite", "flying", "rainbow", "outdoor", "wind"],
    ageRange: { min: 4, max: 12 },
    price: 14.99,
    inventory: 45,
    category: "outdoor",
    dimensions: { lengthInches: 30.0, widthInches: 3.0, heightInches: 3.0, weightLbs: 0.5 },
    manufacturer: "SkyBound Toys",
    bestSellersRank: 27,
    rating: { stars: 4.6, numberOfRatings: 3234 },
  },
  {
    id: "toy-114",
    name: "Giant Bubble Wand Kit",
    image: "/product-images/toy-114.png",
    description: "Create enormous bubbles with the tri-string wand and 32 oz of concentrated bubble solution (makes 2 gallons). Bubbles up to 6 feet long.",
    marketingCopy: `Prepare for astonishment — bubbles this big shouldn't be possible, but here they are. Our Giant Bubble Wand Kit produces impossibly enormous, shimmering bubbles up to 6 feet long that float, wobble, and drift across the sky like iridescent jellyfish. The tri-string wand consists of two lightweight wooden handles connected by a cotton cord loop with an absorbent wick section that holds enough solution for massive bubble formation. Dip, lift, and sweep — a single motion launches a bubble larger than most children.

The 32-ounce bottle of concentrated bubble solution mixes with water to create 2 gallons of high-performance bubble juice engineered for maximum bubble size and duration. The proprietary formula uses food-grade polymers to create a flexible, self-healing film that resists popping far longer than standard bubble solutions, allowing bubbles to grow to extraordinary sizes before detaching from the wand. Best results come on calm, humid days — but even in moderate wind, the bubbles produced by this kit dwarf anything a standard bubble wand can achieve.

Giant bubbles create instant community magic — when a six-foot bubble drifts across a park, every child (and most adults) stops what they're doing to watch, chase, and pop. The experience is simultaneously scientific (thin-film interference creates the rainbow colors; surface tension determines bubble shape) and purely, transcendently joyful. The wand technique — the speed of the sweep, the angle of the handles, the timing of the close — rewards practice with increasingly spectacular results, making this kit engaging for five-year-olds and fifty-year-olds alike. Additional concentrated solution refills are available.`,
    keywords: ["bubbles", "giant", "outdoor", "wand", "solution"],
    ageRange: { min: 3, max: 10 },
    price: 16.99,
    inventory: 50,
    category: "outdoor",
    dimensions: { lengthInches: 18.0, widthInches: 4.0, heightInches: 4.0, weightLbs: 2.5 },
    manufacturer: "SplashZone",
    bestSellersRank: 16,
    rating: { stars: 4.7, numberOfRatings: 4890 },
  },
  {
    id: "toy-115",
    name: "Camping Set – Pretend Play",
    image: "/product-images/toy-115.png",
    description: "Kids' camping set with pop-up tent, sleeping bag, lantern, compass, and binoculars. Perfect for backyard adventures or indoor camping.",
    marketingCopy: `The great outdoors starts in your backyard — or your living room. Our Pretend Play Camping Set puts everything a young adventurer needs for an overnight expedition into a single backpack: a pop-up tent sized for two children (42x42x36 inches), a kid-sized sleeping bag with a flannel lining, a battery-powered LED lantern with two brightness settings, a working compass, toy binoculars, a water bottle, and a nature journal with observation prompts and camping activity ideas.

The pop-up tent springs into shape instantly — no poles, no stakes, no instructions needed — and collapses flat into a carrying disc with a simple fold-and-twist motion. The sleeping bag is insulated for three-season backyard camping and features a fun woodland-animal print lining. The LED lantern provides genuine illumination for bedtime reading and midnight bathroom trips, with enough battery life (30+ hours on low) for multiple camping expeditions. The compass is a real orienteering compass with a liquid-filled capsule, and the binoculars provide 3x magnification — basic but functional for bird-watching and sky-gazing.

Backyard camping is a rite of childhood passage that builds independence, self-reliance, and nature connection in a safe, parent-accessible setting. Our set provides all the equipment needed for children to feel like real campers without requiring any existing outdoor gear. The complete package — from tent to sleeping bag to lantern — removes every barrier to the camping experience, making it possible for any family to create outdoor adventure memories. Indoor camping on rainy days is equally magical, transforming bedrooms and living rooms into wilderness base camps for imaginative overnight expeditions.`,
    keywords: ["camping", "tent", "outdoor", "adventure", "pretend"],
    ageRange: { min: 3, max: 8 },
    price: 39.99,
    inventory: 18,
    category: "outdoor",
    dimensions: { lengthInches: 16.0, widthInches: 16.0, heightInches: 3.0, weightLbs: 4.5 },
    manufacturer: "Adventure Toys Co.",
    bestSellersRank: 36,
    rating: { stars: 4.5, numberOfRatings: 2345 },
  },
  {
    id: "toy-116",
    name: "Croquet Set – Junior",
    image: "/product-images/toy-116.png",
    description: "6-player junior croquet set with colorful mallets, balls, wickets, and stakes. Comes in a carry bag. Great family lawn game.",
    marketingCopy: `Wickets, mallets, and lazy summer afternoons — our Junior Croquet Set brings the quintessential lawn game to families with an accessible, kid-friendly design. The set includes six 24-inch wooden mallets with cushioned grips, six matching colored balls, nine wire wickets with colored crown tops, two end stakes, and a durable canvas carry bag. Everything is scaled for young players: the mallets are lighter, the balls are slightly smaller, and the wicket spacing recommended in the instruction card creates a course that fits comfortably in most backyards.

The mallets are crafted from solid hardwood with a clear lacquer finish, and each one features a cushioned rubber end cap that provides a satisfying thwack on contact. The balls are made from solid resin with a glossy finish that rolls true on short grass, and each one matches its corresponding mallet color for easy player identification. The wire wickets push easily into soil and feature colored crown toppers that designate the course layout.

Croquet is a deceptively strategic game that rewards precision, planning, and a willingness to play defense by sending opponents' balls into unfavorable positions. The rules are simple enough for four-year-olds to follow (hit the ball through the hoops in order) yet deep enough for adults to find genuine competition. It is one of the few truly intergenerational games — grandparents, parents, and children compete on genuinely equal footing, creating family memories that span decades. The carry bag keeps all equipment organized and portable for parks, beaches, and vacation rentals.`,
    keywords: ["croquet", "lawn", "outdoor", "family", "sport"],
    ageRange: { min: 4, max: 10 },
    price: 34.99,
    inventory: 20,
    category: "outdoor",
    dimensions: { lengthInches: 26.0, widthInches: 8.0, heightInches: 8.0, weightLbs: 5.0 },
    manufacturer: "Heritage Playthings",
    bestSellersRank: 52,
    rating: { stars: 4.5, numberOfRatings: 1567 },
  },
  {
    id: "toy-117",
    name: "Balance Bike – No Pedals",
    image: "/product-images/toy-117.png",
    description: "Lightweight aluminum balance bike with adjustable seat and handlebars. Teaches balance before transitioning to a pedal bike. Air tires.",
    marketingCopy: `Skip the training wheels — our Balance Bike teaches children to ride the natural way. This lightweight aluminum-frame bike has no pedals, no chain, and no training wheels; children straddle the seat and propel themselves by walking, then running, then gliding with their feet off the ground. This intuitive progression builds the balance and steering skills that allow most balance-bike graduates to transition to pedal bikes in minutes rather than the weeks required by the training-wheel method.

The bike weighs just 6.2 pounds — light enough for a two-year-old to handle independently — with a minimum seat height of 12 inches that accommodates inseams as short as 12.5 inches. The quick-release seat post and handlebar clamp allow tool-free height adjustments as your child grows, and the maximum seat height of 17 inches keeps the bike relevant through age five. The 12-inch pneumatic air tires provide genuine suspension on rough surfaces, and the sealed-bearing hubs roll smoothly without maintenance.

The balance bike revolution has transformed how children learn to ride, and the research is compelling: children who start on balance bikes at age two are typically riding pedal bikes independently by age four, with dramatically fewer crashes, tears, and scraped knees than their training-wheel-using peers. The confidence that comes from mastering gliding and steering before adding the complexity of pedaling creates a positive association with cycling that often lasts a lifetime. Our bike is available in six colors with matching grips and arrives 90% pre-assembled — just attach the handlebars, adjust the seat, and watch your child's first ride unfold.`,
    keywords: ["balance bike", "riding", "outdoor", "no pedals", "learning"],
    ageRange: { min: 2, max: 5 },
    price: 64.99,
    inventory: 14,
    category: "outdoor",
    dimensions: { lengthInches: 32.0, widthInches: 16.0, heightInches: 22.0, weightLbs: 6.2 },
    manufacturer: "GlideRider",
    bestSellersRank: 20,
    rating: { stars: 4.8, numberOfRatings: 5678 },
  },
  {
    id: "toy-118",
    name: "Bocce Ball Set – Junior",
    image: "/product-images/toy-118.png",
    description: "Smaller-sized bocce ball set perfect for kids. 8 colorful balls, pallino, and measuring rope in a carry case.",
    marketingCopy: `Roll, aim, and celebrate with our Junior Bocce Ball Set — the timeless Italian lawn game scaled perfectly for young arms. The set includes eight brightly colored resin bocce balls in four team colors (two balls per team), one white pallino (target ball), a measuring rope for close calls, and a zippered canvas carry case. The balls are smaller (3 inches diameter) and lighter (8 ounces each) than standard adult bocce, making them comfortable and controllable for children ages 4-12.

The rules of bocce are elegantly simple: toss the pallino onto the lawn, then take turns rolling your bocce balls as close to the pallino as possible. The team with the closest ball scores points, and the first team to reach a target score wins. This simplicity makes bocce immediately playable by preschoolers, yet the strategic depth — banking shots, knocking opponents' balls away, positioning defensively — keeps older children and adults fully engaged.

Bocce is one of the world's oldest games, with roots stretching back to ancient Egypt and Rome, and its enduring popularity speaks to the timeless satisfaction of precision throwing. The game develops hand-eye coordination, distance judgment, strategic thinking, and sportsmanship in a relaxed, social format that encourages conversation, laughter, and friendly competition. The carry case keeps all equipment organized for backyard play, park outings, beach trips, and family gatherings. This is the game that turns any grassy space into a playing field and any group of people into a bocce league.`,
    keywords: ["bocce", "outdoor", "throwing", "lawn", "sport"],
    ageRange: { min: 4, max: 12 },
    price: 22.99,
    inventory: 26,
    category: "outdoor",
    dimensions: { lengthInches: 10.0, widthInches: 10.0, heightInches: 5.0, weightLbs: 4.0 },
    manufacturer: "Heritage Playthings",
    bestSellersRank: 59,
    rating: { stars: 4.5, numberOfRatings: 1678 },
  },
  // ── PERFORMANCE & MUSIC ────────────────────────────────────────────────
  {
    id: "toy-119",
    name: "Magic Trick Master Kit",
    image: "/product-images/toy-119.png",
    description: "Professional-quality magic set with 75 tricks including card tricks, disappearing acts, and illusions. Includes instructional DVD and secret compartment props.",
    marketingCopy: `Prepare to amaze, astonish, and mystify with our Magic Trick Master Kit — a professional-grade collection of 75 magic tricks that transforms aspiring magicians into confident performers. The kit includes a marked deck of cards, a cups-and-balls set, linking rings, a magic wand with a hidden compartment, a disappearing coin box, a color-changing scarf set, a floating card gimmick, a mind-reading number pad, and dozens more props and gimmicks, all organized in a compartmentalized magician's case.

The instructional system is what sets this kit apart from novelty magic sets: a detailed, illustrated trick manual and companion online video library walk young magicians through each trick with clear, step-by-step teaching that covers not just the mechanics of the secret, but the presentation skills — patter, misdirection, timing, audience management — that separate amateur fumbling from genuine magical performance. Tricks are organized by difficulty (beginner, intermediate, advanced) and by performance context (close-up, parlor, stage).

Magic is a performing art that builds an extraordinary range of skills: fine motor dexterity, public speaking confidence, creative storytelling, strategic thinking (about audience attention and misdirection), and the social-emotional resilience required to perform in front of others. Children who practice magic develop a comfort with public performance that serves them in school presentations, job interviews, and social situations for the rest of their lives. This kit provides the tools and training for a hobby that can last a lifetime — many professional magicians trace their passion back to a childhood magic set exactly like this one.`,
    keywords: ["magic", "tricks", "illusion", "performance", "cards"],
    ageRange: { min: 6, max: 12 },
    price: 29.99,
    inventory: 35,
    category: "performance",
    dimensions: { lengthInches: 16.0, widthInches: 10.0, heightInches: 3.0, weightLbs: 2.0 },
    manufacturer: "Prestige Magic Co.",
    bestSellersRank: 45,
    rating: { stars: 4.5, numberOfRatings: 2345 },
  },
  {
    id: "toy-120",
    name: "Kids Ukulele – Soprano",
    image: "/product-images/toy-120.png",
    description: "Real wood soprano ukulele sized for kids. Nylon strings, geared tuners, and a colorful finish. Comes with a chord chart and picks.",
    marketingCopy: `Strum your first chord and feel the magic of making music with our Kids Soprano Ukulele — a real musical instrument, not a toy approximation, sized perfectly for young hands. The solid basswood body produces a warm, resonant tone that sounds genuinely beautiful, the nylon strings are gentle on small fingertips, and the geared machine-head tuners hold pitch reliably through extended play sessions. Available in six vibrant color finishes that make this ukulele as fun to look at as it is to play.

The ukulele is universally regarded as the ideal first stringed instrument: its four strings (versus a guitar's six) simplify chord formation, the compact soprano size allows comfortable reach for children as young as five, and the nylon strings are soft enough that beginners can play for extended periods without developing finger soreness. The included chord chart teaches eight essential chords that unlock dozens of popular songs, and three picks (thin, medium, and thick) let players experiment with strumming feel and tone.

Music education research consistently shows that learning an instrument develops cognitive abilities, emotional expression, discipline, and social confidence in ways that few other activities can match. The ukulele accelerates this process by providing immediate gratification — most children can play a recognizable song within their first 30 minutes — building motivation for continued practice and skill development. Our ukulele is built with the same construction techniques used in adult instruments (dovetail neck joint, compensated saddle, proper intonation), ensuring that it plays in tune up the neck and supports genuine musical growth.`,
    keywords: ["ukulele", "music", "instrument", "strings", "soprano"],
    ageRange: { min: 5, max: 12 },
    price: 29.99,
    inventory: 25,
    category: "performance",
    dimensions: { lengthInches: 21.0, widthInches: 7.0, heightInches: 3.0, weightLbs: 1.0 },
    manufacturer: "MelodyMakers",
    bestSellersRank: 51,
    rating: { stars: 4.6, numberOfRatings: 2123 },
  },
  {
    id: "toy-121",
    name: "Drum Set – Junior (5 piece)",
    image: "/product-images/toy-121.png",
    description: "Complete 5-piece junior drum kit with bass drum, snare, 2 toms, cymbal, throne, and sticks. Real wood shells and tunable heads.",
    marketingCopy: `Rock on! Our Junior Drum Set is a genuine 5-piece kit that delivers the full drumming experience in a package sized for young percussionists. The kit includes a 16-inch bass drum with a foot pedal, a 10-inch snare drum, two rack toms (8 and 10 inch), a 10-inch crash cymbal on a height-adjustable stand, a padded drum throne with height adjustment, and a pair of junior-sized 5A drumsticks. Every drum features a real wood shell with wrapped finish, chrome lugs, and tunable Mylar heads that produce genuine drum tones.

The drums are fully tunable with a standard drum key (included), allowing players and parents to tighten or loosen the heads for different sounds and to re-tension heads as they stretch with use. The hardware is scaled for children ages 3-8 but uses the same engineering as adult kits: bass drum pedal with spring-loaded beater, memory-lock cymbal stand, and tom-mounting brackets that maintain positioning. The throne adjusts from 14 to 18 inches in height, and all stands have rubber feet to prevent floor scratching and slipping.

Learning drums develops rhythm, coordination, bilateral independence, and listening skills in ways unique among instruments — a drummer must coordinate all four limbs simultaneously while maintaining steady tempo and listening to other musicians. The physical, whole-body nature of drumming also provides a satisfying outlet for energy and emotion that many children find more engaging than seated instrument study. Our junior kit is built to withstand enthusiastic playing and to sound good enough that children feel like real musicians — not kids banging on plastic. Upgrade paths to full-sized kits are available as players grow.`,
    keywords: ["drums", "music", "percussion", "instrument", "kit"],
    ageRange: { min: 3, max: 8 },
    price: 79.99,
    inventory: 10,
    category: "performance",
    dimensions: { lengthInches: 24.0, widthInches: 18.0, heightInches: 20.0, weightLbs: 15.0 },
    manufacturer: "MelodyMakers",
    bestSellersRank: 73,
    rating: { stars: 4.4, numberOfRatings: 1234 },
  },
  {
    id: "toy-122",
    name: "Karaoke Machine – Bluetooth",
    image: "/product-images/toy-122.png",
    description: "Portable karaoke machine with Bluetooth connectivity, LED disco lights, and two microphones. Records performances. Built-in speaker.",
    marketingCopy: `Tonight, your living room becomes Madison Square Garden! Our Bluetooth Karaoke Machine turns any gathering into a concert event with powerful sound, dazzling lights, and dual microphones that let performers duet, harmonize, or compete for the crowd's adoration. The built-in 10-watt speaker delivers room-filling volume with clear vocal reproduction, and the Bluetooth connectivity streams backing tracks wirelessly from any smartphone, tablet, or laptop — access millions of karaoke tracks through free apps and streaming services.

Two wired microphones with on/off switches are included, each with a 6-foot cord for freedom of movement. The independent vocal volume controls let performers adjust their mic level relative to the backing track, and the echo/reverb effect adds professional polish that makes even the most enthusiastic amateurs sound surprisingly good. The built-in LED disco ball projects rotating colored lights across the room, creating an instant nightclub atmosphere that elevates every performance from singing to show.

The machine includes a recording function that captures performances to an SD card (included), creating instant shareable memories of birthday party performances, holiday sing-alongs, and impromptu family concerts. The compact, portable design with a carry handle makes it easy to move from room to room or bring to friends' houses, and the rechargeable battery provides 4+ hours of wireless operation. Karaoke builds singing confidence, performance skills, musical appreciation, and social bonding in a low-pressure, high-fun format that turns shy bathroom singers into confident performers.`,
    keywords: ["karaoke", "singing", "microphone", "bluetooth", "music"],
    ageRange: { min: 4, max: 12 },
    price: 49.99,
    inventory: 18,
    category: "performance",
    dimensions: { lengthInches: 10.0, widthInches: 8.0, heightInches: 12.0, weightLbs: 3.5 },
    manufacturer: "BrightMinds Electronics",
    bestSellersRank: 41,
    rating: { stars: 4.4, numberOfRatings: 2567 },
  },
  {
    id: "toy-123",
    name: "Xylophone – 25 Note Chromatic",
    image: "/product-images/toy-123.png",
    description: "Professional-quality 25-note chromatic xylophone with metal keys and two mallets. Full two-octave range with sharps and flats.",
    marketingCopy: `Make real music from day one with our 25-Note Chromatic Xylophone — a professional-quality percussion instrument that produces clear, bell-like tones across a full two-octave range including all sharps and flats. The precisely tuned aluminum keys are arranged in piano-keyboard layout (naturals in front, sharps/flats raised behind), making this xylophone a genuine melodic instrument capable of playing any song in any key, not just a pentatonic toy limited to simple melodies.

Each key is individually tuned to A=440Hz concert pitch and mounted on resonance-isolating rubber posts that produce sustained, ringing tones with remarkable clarity. The solid hardwood frame provides a stable base that won't slide during enthusiastic playing, and the two included mallets feature rubber heads that produce warm tones without damaging the keys. Color-coded note stickers (removable) are included for beginners learning note names, and a songbook with 15 popular melodies provides structured playing material from the first session.

The xylophone is one of the most rewarding first instruments because it provides immediate musical feedback with zero learning curve — strike a key and you hear a beautiful tone, instantly. Unlike wind or string instruments that require weeks of technique development before producing pleasant sounds, the xylophone delivers musical satisfaction from the very first tap. Our chromatic version elevates this experience by enabling real music-making: children can play melodies, experiment with scales, and even compose original pieces using the full palette of Western musical notes. This is the instrument that music teachers wish every student had at home.`,
    keywords: ["xylophone", "music", "percussion", "chromatic", "instrument"],
    ageRange: { min: 3, max: 10 },
    price: 34.99,
    inventory: 22,
    category: "performance",
    dimensions: { lengthInches: 18.0, widthInches: 8.0, heightInches: 3.0, weightLbs: 2.5 },
    manufacturer: "MelodyMakers",
    bestSellersRank: 54,
    rating: { stars: 4.7, numberOfRatings: 1890 },
  },
  {
    id: "toy-124",
    name: "Ventriloquist Puppet – Charlie",
    image: "/product-images/toy-124.png",
    description: "Classic boy ventriloquist puppet with moving mouth and eyebrows controlled by a hand lever. 30 inches tall. Includes a beginner's guide.",
    marketingCopy: `Say hello to Charlie — your new comedy partner! This professional-quality ventriloquist puppet stands 30 inches tall and features a moving mouth controlled by a hand lever inside the head, independently movable eyebrows (also lever-controlled) that create hilarious facial expressions, and a soft body dressed in a classic suit with bow tie. Charlie's head is sculpted from lightweight rigid foam with a hand-painted face that projects personality and charm to audiences near and far.

The hand controls are intuitively positioned: the main lever opens and closes the mouth in sync with speech, while smaller trigger levers raise each eyebrow independently for comic effect. The puppet's body is a soft fabric sleeve that fits over the performer's arm, with the hand supporting the head and operating the controls. At 30 inches, Charlie is tall enough to be seen above a tabletop or puppet-theater stage, yet light enough (under 2 lbs) for extended performances without arm fatigue.

The included beginner's guide teaches the fundamentals of ventriloquism: lip control, voice projection, character development, comedy timing, and five scripted routines to get new ventriloquists performing confidently within a week of practice. Ventriloquism is a rare performing art that combines vocal skill, puppetry, comedy writing, and audience engagement into a single discipline. Children who take up ventriloquism develop exceptional communication skills, creative thinking, and the confidence to command an audience's attention — skills that benefit them in every area of life. Charlie is waiting to tell his first joke — all he needs is your child's voice.`,
    keywords: ["ventriloquist", "puppet", "performance", "comedy", "talking"],
    ageRange: { min: 6, max: 14 },
    price: 39.99,
    inventory: 12,
    category: "performance",
    dimensions: { lengthInches: 12.0, widthInches: 8.0, heightInches: 30.0, weightLbs: 1.8 },
    manufacturer: "StageWhiskers",
    bestSellersRank: 85,
    rating: { stars: 4.3, numberOfRatings: 789 },
  },
  {
    id: "toy-125",
    name: "Kids Keyboard – 61 Keys",
    image: "/product-images/toy-125.png",
    description: "Full-size 61-key electronic keyboard with 200 tones, 100 rhythms, and a record/playback function. Includes music stand and AC adapter.",
    marketingCopy: `From first notes to first compositions — our 61-Key Kids Keyboard is a full-featured electronic instrument that grows with your child's musical ambitions. The 61 full-size keys span five octaves, providing enough range for classical pieces, pop songs, and creative exploration. Two hundred built-in tones (piano, organ, strings, brass, synths, and more) and 100 rhythm patterns (rock, pop, jazz, Latin, classical) transform a single keyboard into an entire orchestra, while the record/playback function lets young composers capture and review their creations.

The keyboard features touch-sensitive keys that respond to playing dynamics — press softly for quiet, gentle tones; press firmly for loud, expressive notes — teaching musical expression and dynamics from the earliest lessons. The built-in learning mode highlights keys in sequence for 50 pre-programmed songs, providing structured practice for beginners. A headphone jack allows silent practice for apartment dwellers and late-night musicians, and the included AC adapter ensures uninterrupted power for extended practice sessions (also runs on 6 AA batteries for portability).

Electronic keyboards are the most versatile entry point into music education: they require no tuning, produce a wide variety of sounds that sustain interest, and provide rhythm accompaniment that makes solo practice feel like band rehearsal. The full-size keys ensure that finger spacing and technique transfer directly to acoustic pianos, and the five-octave range accommodates everything from beginner method books to intermediate repertoire. The included music stand holds sheet music or a tablet displaying digital scores, and the slim profile stores easily behind furniture or in a closet.`,
    keywords: ["keyboard", "piano", "electronic", "music", "instrument"],
    ageRange: { min: 5, max: 14 },
    price: 69.99,
    inventory: 14,
    category: "performance",
    dimensions: { lengthInches: 37.0, widthInches: 12.0, heightInches: 4.0, weightLbs: 8.0 },
    manufacturer: "MelodyMakers",
    bestSellersRank: 57,
    rating: { stars: 4.5, numberOfRatings: 1567 },
  },
  {
    id: "toy-126",
    name: "Musical Instruments Starter Pack (6 instruments)",
    image: "/product-images/toy-126.png",
    description: "Tambourine, harmonica, recorder, egg shakers, triangle, and castanets in a canvas bag. Perfect for music exploration and rhythm games.",
    marketingCopy: `Discover your instrument with our Musical Instruments Starter Pack — six real, playable instruments that let children explore rhythm, melody, and musical expression across a range of timbres and techniques. The pack includes a 6-inch wooden tambourine with metal jingles, a 10-hole diatonic harmonica in key of C, a soprano recorder with fingering chart, a pair of egg shakers, a 6-inch steel triangle with striker, and wooden castanets on a handle. Every instrument is real, functional, and capable of producing genuinely musical sounds.

The diversity of instruments in this pack is intentional: the harmonica and recorder teach melody and breath control; the tambourine, egg shakers, and castanets develop rhythm and coordination; and the triangle introduces the concept of sustain and damping. Children naturally gravitate toward the instrument that resonates with their musical personality, and this pack ensures they have enough variety to discover that affinity. The included activity card suggests rhythm games, ensemble arrangements, and musical storytelling activities that make the most of the collection.

Early exposure to multiple instrument families is a cornerstone of Orff and Kodály music education approaches, both of which emphasize hands-on instrument exploration as the foundation for lifelong musical understanding. This pack provides that exposure at an accessible price point, with quality high enough that each instrument produces satisfying, in-tune sounds. The canvas drawstring bag keeps everything together and transportable, making this set ideal for music classes, playdates, and family jam sessions. Additional instrument packs (winds, strings, and world percussion) are available to expand the collection.`,
    keywords: ["instruments", "music", "rhythm", "starter", "variety"],
    ageRange: { min: 3, max: 8 },
    price: 24.99,
    inventory: 32,
    category: "performance",
    dimensions: { lengthInches: 12.0, widthInches: 8.0, heightInches: 4.0, weightLbs: 1.5 },
    manufacturer: "MelodyMakers",
    bestSellersRank: 31,
    rating: { stars: 4.6, numberOfRatings: 2678 },
  },
  {
    id: "toy-127",
    name: "DJ Turntable Mixer Toy",
    image: "/product-images/toy-127.png",
    description: "Electronic DJ turntable with scratch disc, crossfader, sound effects, and built-in tracks. Headphone jack and record function.",
    marketingCopy: `Drop the beat! Our DJ Turntable Mixer puts the tools of electronic music creation into the hands of young DJs with a feature-packed mixing station that looks, feels, and sounds like the real thing. The turntable features a touch-sensitive scratch disc that produces authentic vinyl-scratch sounds, a crossfader that blends between two music channels, a bank of 8 sound-effect buttons (air horn, siren, laser, record scratch, crowd cheer, and more), a tempo slider, and a beat-loop function that isolates and repeats a rhythmic pattern for live remixing.

Five built-in backing tracks spanning hip-hop, electronic, pop, and dance genres provide the foundation for DJ sessions, and the AUX input lets young DJs mix their own music from any external device. The headphone jack enables silent practice and private listening, while the built-in speaker delivers enough volume for bedroom performances and small parties. The record function captures mixes to an SD card (included) for playback, sharing, and iterative improvement. The LED-illuminated turntable platter pulsates in sync with the beat, creating a visual spectacle that amplifies the performance experience.

DJing develops an extraordinary range of skills: musical ear training (beat-matching, key-matching), hand-eye coordination (simultaneous manipulation of multiple controls), creative expression (selecting and sequencing music, designing transitions), and performance confidence (reading a crowd and adapting in real time). This toy turntable provides a genuine introduction to these skills while being intuitive enough for complete beginners. Many professional DJs describe their childhood toy turntable as the spark that ignited their musical career — this could be that spark for your child.`,
    keywords: ["DJ", "turntable", "music", "electronic", "mixing"],
    ageRange: { min: 6, max: 14 },
    price: 44.99,
    inventory: 16,
    category: "performance",
    dimensions: { lengthInches: 14.0, widthInches: 10.0, heightInches: 4.0, weightLbs: 2.5 },
    manufacturer: "BrightMinds Electronics",
    bestSellersRank: 66,
    rating: { stars: 4.3, numberOfRatings: 1234 },
  },
  // ── DOLLS ──────────────────────────────────────────────────────────────
  {
    id: "toy-128",
    name: "Baby Doll – Soft Body (14 inch)",
    image: "/product-images/toy-128.png",
    description: "Soft-bodied baby doll with vinyl head and limbs. Closes eyes when laid down. Comes with a bottle, bib, and onesie.",
    marketingCopy: `Every child needs a baby to love, and our 14-inch Soft Body Baby Doll is ready to be that baby. With a sweet vinyl face featuring painted lashes, rosy cheeks, and realistic blue eyes that close when laid down for a nap, this doll invites the nurturing play that is so essential to social-emotional development. The soft, huggable body is filled with a cuddly polyester stuffing that makes this doll perfect for carrying, rocking, and snuggling, while the vinyl hands and feet have individually sculpted fingers and toes.

The doll comes dressed in a removable cotton onesie with snap closures (practicing fine motor skills with every outfit change), plus a matching bib and a pretend baby bottle with a disappearing-milk mechanism — tip the bottle and the "milk" appears to empty, right it and the milk "refills." These accessories support the feeding, changing, and bedtime routines that form the backbone of baby-care pretend play. Additional outfits, diapers, and accessories are available separately.

Doll play is one of the most extensively researched areas of child development, with consistent findings that caring for a doll builds empathy, nurturing behavior, emotional vocabulary, and social scripts for caregiving interactions. Children who engage in regular baby-doll play demonstrate more prosocial behavior toward peers and siblings, use more emotion words in conversation, and show greater comfort with caregiving roles. Our doll is sized to feel real in a toddler's arms, soft enough for bed-sharing, and durable enough for daily love — the combination that transforms a toy into a treasured companion.`,
    keywords: ["baby doll", "soft", "nurturing", "bottle", "realistic"],
    ageRange: { min: 2, max: 6 },
    price: 19.99,
    inventory: 45,
    category: "dolls",
    dimensions: { lengthInches: 14.0, widthInches: 6.0, heightInches: 4.0, weightLbs: 0.8 },
    manufacturer: "DollDreams",
    bestSellersRank: 21,
    rating: { stars: 4.7, numberOfRatings: 3890 },
  },
  {
    id: "toy-129",
    name: "Fashion Doll – Career Collection (3 pack)",
    image: "/product-images/toy-129.png",
    description: "Three 11.5-inch fashion dolls dressed as a scientist, pilot, and chef. Fully articulated with career-themed accessories.",
    marketingCopy: `Who will she be today? A scientist discovering a new element, a pilot commanding a 747, or a chef running a five-star kitchen? Our Career Collection Fashion Dolls present three empowering role models, each one a fully articulated 11.5-inch doll dressed in detailed career attire with profession-specific accessories. The scientist wears a lab coat over a smart blouse and holds a flask and safety goggles; the pilot wears a tailored uniform with captain's wings and carries a flight bag and headset; the chef wears a double-breasted jacket and toque and comes with a rolling pin and mixing bowl.

Each doll features 22 points of articulation — neck, shoulders, elbows, wrists, hips, knees, and ankles — enabling realistic posing, sitting, and action positions. The diverse roster includes three different skin tones, hair textures, and face sculpts, ensuring representation and relatability for children of all backgrounds. The clothing is carefully tailored from real fabrics (not molded plastic) with working closures, and the accessories are detailed enough to support genuine career-themed imaginative play.

Research consistently shows that children who play with career-themed dolls show broader career aspirations and reduced gender stereotyping compared to those who play with exclusively fashion-focused dolls. Our Career Collection deliberately positions women in STEM, aviation, and culinary leadership roles, expanding children's vision of what's possible. The dolls are compatible with standard fashion-doll furniture, vehicles, and playsets, integrating seamlessly into existing collections while adding a dimension of professional aspiration to imaginative play.`,
    keywords: ["fashion doll", "careers", "scientist", "pilot", "chef"],
    ageRange: { min: 4, max: 10 },
    price: 34.99,
    inventory: 28,
    category: "dolls",
    dimensions: { lengthInches: 12.0, widthInches: 8.0, heightInches: 3.0, weightLbs: 1.0 },
    manufacturer: "DollDreams",
    bestSellersRank: 46,
    rating: { stars: 4.6, numberOfRatings: 1890 },
  },
  {
    id: "toy-130",
    name: "Dollhouse – Victorian Mansion",
    image: "/product-images/toy-130.png",
    description: "Three-story wooden dollhouse with 8 rooms, working doors, and a staircase. Includes 30 pieces of furniture. Assembly required.",
    marketingCopy: `Welcome to the most exquisite residence in toyland — our Victorian Mansion Dollhouse is a three-story, eight-room architectural masterpiece crafted from premium birch plywood with hand-painted details that bring the Victorian era to vivid life. The mansion features a grand staircase connecting all three floors, hinged room dividers that allow open-plan or enclosed play, nine working doors with tiny brass knobs, four arched windows with printed curtains, and a decorative mansard roof with a widow's walk viewing platform.

The 30-piece furniture collection outfits every room with era-appropriate pieces: a canopy bed, a claw-foot bathtub, a dining table with chairs, a parlor settee, a grand piano, a kitchen stove, a writing desk, and many more. Each piece is crafted from wood with hand-painted details — tiny drawer pulls, upholstery patterns, tableware — that reward close inspection. The furniture is scaled at 1:12 (standard dollhouse scale), making it compatible with the vast ecosystem of miniature furniture, dolls, and accessories available from specialty retailers.

Dollhouse play is extraordinarily rich developmentally: it exercises spatial reasoning (arranging furniture in rooms), narrative creation (inventing stories for the inhabitants), social-emotional processing (enacting family dynamics and interpersonal scenarios), and aesthetic sensibility (decorating and redecorating rooms). Our Victorian Mansion is designed to be a long-term creative investment — children begin with simple room-arrangement play and progress to elaborate multi-character narratives, interior design projects, and even historical-era research inspired by the Victorian setting. Assembly requires approximately 90 minutes with the included illustrated instructions.`,
    keywords: ["dollhouse", "wooden", "Victorian", "furniture", "miniature"],
    ageRange: { min: 4, max: 10 },
    price: 79.99,
    inventory: 10,
    category: "dolls",
    dimensions: { lengthInches: 24.0, widthInches: 12.0, heightInches: 28.0, weightLbs: 12.0 },
    manufacturer: "TinyTree Toys",
    bestSellersRank: 60,
    rating: { stars: 4.6, numberOfRatings: 1456 },
  },
  {
    id: "toy-131",
    name: "Rag Doll – Handmade Style",
    image: "/product-images/toy-131.png",
    description: "Classic rag doll with yarn hair, button eyes, and a gingham dress. 18 inches tall. Machine washable. Nostalgic and huggable.",
    marketingCopy: `Some toys capture the heart with their simplicity — our Rag Doll is one of those toys. Standing 18 inches tall with a soft cotton body, brown yarn pigtails tied with gingham ribbons, embroidered button-style eyes, a sweet stitched smile, and a removable gingham dress with a lace-trimmed petticoat, this doll channels the warmth and charm of handmade heirlooms while being produced with modern safety standards and machine-washable convenience.

Every detail is designed to invite affection: the floppy limbs that drape perfectly over a small arm, the yarn hair that can be gently brushed and braided, the soft cotton face that accepts goodnight kisses without being cold or hard. The cloth body is double-stitched at every seam and stuffed with hypoallergenic polyester fill that maintains its cuddly loft through hundreds of wash cycles. The removable dress teaches dressing skills (Velcro closure for young ones, snap closures for developing fingers), and additional outfits are available separately.

Rag dolls hold a special place in the pantheon of childhood companions — they lack the structured features of vinyl dolls, which paradoxically makes them more versatile as emotional partners. Children project their own feelings onto the simple face, seeing happiness when they're happy and sadness when they're sad, making the rag doll a uniquely effective tool for emotional processing and imaginative play. This doll is designed to become the one that travels everywhere, sleeps in the bed every night, and eventually takes its place in a keepsake box as one of childhood's most treasured memories.`,
    keywords: ["rag doll", "handmade", "classic", "yarn", "huggable"],
    ageRange: { min: 2, max: 7 },
    price: 22.99,
    inventory: 30,
    category: "dolls",
    dimensions: { lengthInches: 18.0, widthInches: 6.0, heightInches: 3.0, weightLbs: 0.5 },
    manufacturer: "DollDreams",
    bestSellersRank: 40,
    rating: { stars: 4.8, numberOfRatings: 2567 },
  },
  {
    id: "toy-132",
    name: "Doll Stroller – Foldable",
    image: "/product-images/toy-132.png",
    description: "Realistic doll stroller with adjustable canopy, storage basket, and safety harness. Fits dolls up to 20 inches. Folds flat.",
    marketingCopy: `Every doll parent needs a way to take their baby on the go, and our Foldable Doll Stroller provides the perfect ride — a realistic, full-featured stroller that looks and functions just like the real thing, scaled down for young caregivers and their beloved dolls. The stroller features a padded seat with a working three-point safety harness, an adjustable sun canopy, a storage basket underneath for doll accessories, and smooth-rolling double wheels that navigate carpet, tile, and outdoor sidewalks with ease.

The stroller accommodates dolls up to 20 inches tall and folds flat with a one-hand squeeze-and-fold mechanism — the same style used on real umbrella strollers. The folded profile is slim enough to stand in a closet corner or slide under a bed, making storage effortless. The frame is lightweight aluminum with a colorful fabric seat that is removable and machine washable, and the foam handlebar grips are positioned at the right height for children 2-6 years old.

Stroller play extends doll-care scenarios beyond the home environment, encouraging children to integrate their nurturing play into walks, shopping trips, park visits, and social interactions with other children and their "babies." The realistic features — harness, canopy, basket — teach practical caregiving skills, and the act of pushing a stroller builds gross motor skills and spatial awareness. Parents love that the stroller provides a purposeful activity during walks (the child pushes their stroller alongside the parent pushing theirs), creating parallel-play bonding moments that make family outings smoother and more enjoyable.`,
    keywords: ["stroller", "doll", "foldable", "wheels", "pretend"],
    ageRange: { min: 2, max: 6 },
    price: 24.99,
    inventory: 22,
    category: "dolls",
    dimensions: { lengthInches: 20.0, widthInches: 10.0, heightInches: 24.0, weightLbs: 2.5 },
    manufacturer: "DollDreams",
    bestSellersRank: 38,
    rating: { stars: 4.5, numberOfRatings: 2345 },
  },
  {
    id: "toy-133",
    name: "Paper Doll Fashion Design Kit",
    image: "/product-images/toy-133.png",
    description: "Magnetic paper dolls with over 100 mix-and-match outfits, shoes, and accessories. Comes with a tin carry case for travel.",
    marketingCopy: `Design the ultimate wardrobe — no sewing required! Our Paper Doll Fashion Design Kit features two magnetic paper dolls and over 100 mix-and-match magnetic clothing pieces, shoes, and accessories that cling to the dolls' surfaces for instant outfit creation. The collection includes casual wear, formal attire, sportswear, costumes, seasonal outfits, and fantasy fashion, giving young designers an enormous palette of style options. Mix a tutu with rain boots, pair a lab coat with a tiara, or create a runway-ready ensemble — there are no wrong combinations, only creative expression.

The magnetic connection system is what elevates this beyond traditional paper dolls: pieces stay firmly in place when the doll is picked up, moved, or displayed, eliminating the frustration of paper tabs that bend and tear. The dolls and all clothing pieces are printed on thick, glossy magnetic card stock that resists bending and wear, and the collection stores neatly in a hinged tin carry case with compartments for organized storage. The case's interior lid features a printed "dressing room" background for display play.

Fashion design play develops aesthetic sensibility, color coordination, personal expression, and decision-making skills as children evaluate options, make choices, and assess the results. The mix-and-match format means there are over 10,000 possible outfit combinations, providing essentially infinite creative possibilities within a compact, travel-friendly format. Parents appreciate the mess-free, quiet, portable nature of this kit — it's the perfect companion for restaurant tables, airplane tray tables, waiting rooms, and backseat road trips. Additional outfit expansion packs (seasonal, cultural, and career) are available.`,
    keywords: ["paper doll", "fashion", "magnetic", "mix and match", "travel"],
    ageRange: { min: 4, max: 8 },
    price: 14.99,
    inventory: 40,
    category: "dolls",
    dimensions: { lengthInches: 8.0, widthInches: 6.0, heightInches: 1.5, weightLbs: 0.5 },
    manufacturer: "CraftStar",
    bestSellersRank: 36,
    rating: { stars: 4.6, numberOfRatings: 2123 },
  },
  {
    id: "toy-134",
    name: "Fairy Garden Dolls (4 pack)",
    image: "/product-images/toy-134.png",
    description: "Four poseable fairy dolls with glittery wings and nature-themed outfits. Each 5 inches tall. Perfect for fairy garden play.",
    marketingCopy: `Invite magic into your garden — or your bedroom — with our Fairy Garden Dolls, a quartet of enchanting 5-inch fairies with glittery translucent wings, nature-inspired outfits, and poseable bodies that bring fairy-tale adventures to miniature life. The four fairies represent the seasons: Spring wears a flower-petal dress in pink and green, Summer shimmers in golden sunshine yellow, Autumn glows in russet and amber leaves, and Winter sparkles in icy blue and silver snowflakes. Each fairy's wings are embedded with fine glitter that catches light beautifully without shedding.

The dolls feature 5 points of articulation (neck, shoulders, hips), allowing them to sit on mushroom perches, stand among flowers, and fly through imagined forests. The nature-themed accessories — a mushroom seat, a leaf umbrella, a flower lantern, and a dewdrop mirror — complete the fairy-garden aesthetic. The fairies are made from durable, weather-resistant PVC that can safely live outdoors in real fairy gardens (the popular miniature landscaping hobby) or indoors in dollhouses, terrariums, and woodland playsets.

Fairy play combines elements of fantasy, nature appreciation, and miniature-world building into a uniquely captivating play theme. Children create elaborate fairy ecosystems — tiny gardens with real plants, pebble pathways, moss beds, and twig furniture — that develop fine motor skills, spatial planning, and environmental awareness. The seasonal theme of our fairy set adds an educational dimension, connecting the fairies to the natural rhythms of the year and sparking conversations about how seasons affect the living world. These fairies are equally at home in a backyard fairy garden, a bedroom windowsill, or a child's wildest imagination.`,
    keywords: ["fairy", "garden", "miniature", "glitter", "dolls"],
    ageRange: { min: 3, max: 8 },
    price: 18.99,
    inventory: 35,
    category: "dolls",
    dimensions: { lengthInches: 6.0, widthInches: 4.0, heightInches: 2.0, weightLbs: 0.3 },
    manufacturer: "Sparkle Kingdom",
    bestSellersRank: 49,
    rating: { stars: 4.6, numberOfRatings: 1789 },
  },
  // ── ELECTRONIC & TECH TOYS ─────────────────────────────────────────────
  {
    id: "toy-135",
    name: "Walkie-Talkies – Long Range (2 pack)",
    image: "/product-images/toy-135.png",
    description: "Durable walkie-talkies with 3-mile range, 22 channels, and built-in flashlight. Belt clips and wrist straps. Requires 3 AAA batteries each.",
    marketingCopy: `Breaker, breaker — adventure is calling! Our Long Range Walkie-Talkies give children the thrilling freedom of wireless communication with a 3-mile range that covers entire neighborhoods, campgrounds, and shopping malls. Operating on 22 FRS channels with 121 privacy codes, these radios provide clear, static-free communication even in crowded RF environments. The intuitive push-to-talk operation requires zero setup — turn them on, select the same channel, and start talking.

The rugged ABS housing is engineered to survive drops from 5 feet onto concrete, and the rubberized grip provides secure handling in wet or sweaty conditions. A built-in LED flashlight in each unit serves double duty for nighttime adventures and emergency signaling. Belt clips and wrist straps keep the radios accessible during active play, and the keypad lock prevents accidental channel changes. A call-alert tone lets children "ring" each other's radios, and the VOX (voice-activated) mode enables hands-free communication when both users' hands are occupied.

Walkie-talkie play builds independence, responsibility, and communication skills in a uniquely effective format. Children practice clear verbal communication (background noise forces them to speak distinctly), develop spatial awareness (coordinating positions from different locations), and exercise responsibility for a valuable piece of equipment. The 3-mile range enables genuinely useful communication: parents monitoring children at the park, siblings exploring different areas of a campground, or friends coordinating neighborhood games. Each radio requires 3 AAA batteries (included) with an estimated 20-hour battery life.`,
    keywords: ["walkie-talkie", "communication", "radio", "outdoor", "long range"],
    ageRange: { min: 5, max: 12 },
    price: 24.99,
    inventory: 35,
    category: "electronic",
    dimensions: { lengthInches: 6.5, widthInches: 2.0, heightInches: 1.5, weightLbs: 0.6 },
    manufacturer: "CovertOps Kids",
    bestSellersRank: 25,
    rating: { stars: 4.5, numberOfRatings: 3456 },
  },
  {
    id: "toy-136",
    name: "Kids Digital Camera – 12MP",
    image: "/product-images/toy-136.png",
    description: "Shockproof 12MP digital camera with video mode, selfie lens, and fun photo frames/filters. 2-inch screen, USB charging, 32GB card included.",
    marketingCopy: `Say cheese! Our Kids Digital Camera puts genuine 12-megapixel photography into small hands with a shockproof, brightly colored camera designed specifically for young photographers. The 2-inch LCD screen provides instant review of photos and videos, the front-facing selfie lens encourages creative self-portraiture, and 28 built-in photo frames and filters (bunny ears, pirate hat, rainbow border, vintage sepia, and more) add playful creativity to every shot.

The camera shoots photos at 4000x3000 resolution and records 1080p video with sound — genuine high-quality capture that produces images worth printing and framing. The shockproof silicone housing absorbs drops from up to 5 feet, and the included wrist strap and lanyard keep the camera secured to its photographer. A 32GB micro-SD card is pre-installed, providing storage for approximately 8,000 photos or 3 hours of video. USB-C charging delivers a full charge in 90 minutes for approximately 3 hours of continuous shooting.

Photography is an exceptional creative medium for children: it teaches composition, observation, perspective, and visual storytelling while producing tangible artifacts that can be shared, displayed, and treasured. Children who have their own camera begin seeing the world differently — noticing patterns, colors, light, and moments that might otherwise pass unobserved. Our camera removes every barrier to this creative practice: it's durable enough for rough handling, simple enough for four-year-olds to operate, and capable enough to produce genuinely good photographs that make young photographers proud of their work.`,
    keywords: ["camera", "digital", "photo", "video", "shockproof"],
    ageRange: { min: 4, max: 10 },
    price: 34.99,
    inventory: 25,
    category: "electronic",
    dimensions: { lengthInches: 3.5, widthInches: 2.5, heightInches: 2.0, weightLbs: 0.3 },
    manufacturer: "BrightMinds Electronics",
    bestSellersRank: 30,
    rating: { stars: 4.4, numberOfRatings: 2890 },
  },
  {
    id: "toy-137",
    name: "Voice-Changing Megaphone",
    image: "/product-images/toy-137.png",
    description: "Handheld megaphone with 10 voice effects: robot, alien, chipmunk, echo, and more. Built-in siren and record/playback. Loud and fun.",
    marketingCopy: `Attention, earthlings! Our Voice-Changing Megaphone amplifies and transforms your child's voice with 10 hilarious effects that turn ordinary speech into extraordinary performances. Toggle through robot, alien, chipmunk, deep monster, echo canyon, underwater, space radio, ghost, megaphone PA, and normal amplified voice modes — each one producing instant laughter and creative play scenarios. The built-in siren button adds three emergency sounds (police, fire, ambulance) for pretend-play first-responder scenarios.

The megaphone features a comfortable pistol grip, a cone-shaped speaker that projects sound up to 50 feet, and a record/playback function that captures up to 10 seconds of voice-modified audio for replaying and sharing. The voice effects are produced by real-time DSP (digital signal processing) chips that modify pitch, speed, and reverb with zero latency, creating convincing, responsive voice transformations that react to every word and inflection.

Voice play is a surprisingly valuable developmental activity: children experiment with volume control, vocal expression, character creation, and public projection while having enormous, uninhibited fun. The megaphone naturally encourages dramatic play, storytelling, and performance — shy children often find that speaking through a voice modifier gives them permission to be loud, silly, and expressive in ways they wouldn't attempt with their natural voice. The device runs on 3 AAA batteries (included) with approximately 8 hours of intermittent use. Warning: this toy is LOUD — parental noise tolerance will be tested (and rewarded with giggles).`,
    keywords: ["megaphone", "voice changer", "effects", "silly", "electronic"],
    ageRange: { min: 4, max: 10 },
    price: 16.99,
    inventory: 40,
    category: "electronic",
    dimensions: { lengthInches: 8.0, widthInches: 5.0, heightInches: 5.0, weightLbs: 0.5 },
    manufacturer: "CovertOps Kids",
    bestSellersRank: 33,
    rating: { stars: 4.4, numberOfRatings: 2567 },
  },
  {
    id: "toy-138",
    name: "LED Light-Up Terrarium Kit",
    image: "/product-images/toy-138.png",
    description: "Grow a miniature garden inside a glass jar with LED lid. Includes seeds, soil, figurines, and decorative stones. Self-sustaining ecosystem.",
    marketingCopy: `Create a living world in a jar with our LED Light-Up Terrarium Kit — a hands-on botany project that produces a beautiful, self-sustaining miniature garden illuminated by a warm LED light built into the mason jar lid. The kit includes a large glass mason jar, a bag of nutrient-rich potting soil, a drainage layer of decorative pebbles, packets of wheatgrass and chia seeds (fast-growing for quick gratification), miniature figurines (bunny, mushroom, fairy, and hedgehog), decorative moss, colored sand for layering, and a spray bottle for watering.

Assembly takes about 30 minutes: layer pebbles for drainage, add soil, plant seeds, position figurines, add moss and decorative elements, close the lid, and place near a window. The seeds sprout within 3-5 days, and within two weeks the terrarium is a lush, green miniature world. The LED lid (powered by 3 button-cell batteries, included) provides a warm, ambient glow that transforms the terrarium into a stunning nightlight — one that your child grew themselves.

Terrariums teach the water cycle (evaporation, condensation, precipitation), photosynthesis, and ecosystem biology in a visible, tangible format that no textbook can match. Children observe condensation forming on the glass, watch roots develop through the transparent soil layer, and learn about the delicate balance of light, water, and air that sustains living systems. The self-sustaining design means the terrarium requires only occasional misting and indirect sunlight — making it manageable even for children who have never cared for a plant before. This kit consistently ranks as one of the most satisfying STEM projects available for home use.`,
    keywords: ["terrarium", "garden", "LED", "growing", "ecosystem"],
    ageRange: { min: 6, max: 14 },
    price: 24.99,
    inventory: 28,
    category: "electronic",
    dimensions: { lengthInches: 6.0, widthInches: 6.0, heightInches: 8.0, weightLbs: 2.0 },
    manufacturer: "NatureCraft Co.",
    bestSellersRank: 42,
    rating: { stars: 4.6, numberOfRatings: 2345 },
  },
  {
    id: "toy-139",
    name: "Night Vision Goggles",
    image: "/product-images/toy-139.png",
    description: "Real working night vision goggles with green LED illumination. See up to 25 feet in total darkness. Adjustable head strap.",
    marketingCopy: `See in the dark like a real special-ops agent with our Night Vision Goggles — genuine working night-vision devices that use infrared LED illumination and optical amplification to reveal what hides in total darkness. The goggles project a focused IR beam (invisible to the naked eye) that reflects off objects up to 25 feet away, and the amplified image is displayed on the internal screen with the classic green-tint night-vision aesthetic that children recognize from movies and video games.

The adjustable head strap fits comfortably over most head sizes (ages 6+), and the eyepieces adjust for interpupillary distance. The flip-up mounting allows the goggles to be moved out of the line of sight when not actively in use, just like real military night-vision equipment. The unit runs on 5 AA batteries (not included) with approximately 10 hours of runtime, and an auto-off timer preserves battery life during inactive periods.

Night vision goggles transform ordinary backyard evenings into extraordinary adventure missions — nighttime hide-and-seek, animal spotting, camping surveillance, and spy games all become dramatically more exciting when one player can literally see in the dark. The technology sparks genuine curiosity about how infrared light works, why night-vision displays are green (the human eye can distinguish more shades of green than any other color), and how real military and wildlife-observation equipment operates. Fair warning: once your child has night vision, they will never want to come inside at dusk again.`,
    keywords: ["night vision", "goggles", "dark", "spy", "electronic"],
    ageRange: { min: 6, max: 14 },
    price: 39.99,
    inventory: 18,
    category: "electronic",
    dimensions: { lengthInches: 8.0, widthInches: 6.0, heightInches: 4.0, weightLbs: 0.8 },
    manufacturer: "CovertOps Kids",
    bestSellersRank: 63,
    rating: { stars: 4.3, numberOfRatings: 1456 },
  },
  {
    id: "toy-140",
    name: "Electronic Piggy Bank – ATM Style",
    image: "/product-images/toy-140.png",
    description: "ATM-style piggy bank with PIN code, auto bill feeder, and coin counter. LCD screen shows balance. Teaches saving and basic banking.",
    marketingCopy: `Make saving money as fun as spending it! Our ATM-Style Electronic Piggy Bank transforms the mundane piggy bank into an interactive banking experience that teaches children financial literacy through hands-on play. The unit features a personal PIN code (4 digits, set by the child), an automatic bill feeder that pulls paper bills into the vault with a motorized roller, a coin slot with an electronic counter that tracks deposits, an LCD screen displaying the running balance, and a secure access door that opens only with the correct PIN.

The ATM accepts real currency — both bills (any denomination) and coins (pennies through quarters, automatically identified by the electronic counter). The LCD displays the cumulative balance, and children can set a savings goal with a target amount; the screen shows progress toward the goal with an encouraging progress bar. The electronic counter accurately distinguishes between coin sizes, adding the correct value to the balance with each deposit. The motorized bill feeder is genuinely delightful — watching a dollar bill get pulled smoothly into the vault creates a satisfying deposit experience that motivates repeat saving.

Financial literacy experts recommend giving children ownership over their own savings as early as age five, and our ATM piggy bank makes that ownership tangible and engaging. Children learn the concepts of saving toward a goal, tracking a balance, and the PIN-code security that protects their money. The "bank" aspect transforms saving from an abstract parental instruction into a concrete, child-driven activity with visible results. The unit runs on 3 AA batteries (included) and makes a stellar birthday or holiday gift — especially when pre-loaded with a seed deposit to kick-start the savings journey.`,
    keywords: ["piggy bank", "ATM", "saving", "money", "electronic"],
    ageRange: { min: 5, max: 12 },
    price: 22.99,
    inventory: 30,
    category: "electronic",
    dimensions: { lengthInches: 7.0, widthInches: 5.0, heightInches: 8.0, weightLbs: 1.0 },
    manufacturer: "BrightMinds Electronics",
    bestSellersRank: 37,
    rating: { stars: 4.4, numberOfRatings: 2234 },
  },
  {
    id: "toy-141",
    name: "Drone – Mini Beginner",
    image: "/product-images/toy-141.png",
    description: "Palm-sized indoor drone with altitude hold, one-key takeoff, and 360-degree flips. 3 speed settings. USB rechargeable, 7-minute flight time.",
    marketingCopy: `Take flight — right in your living room! Our Mini Beginner Drone is a palm-sized quadcopter designed specifically for first-time pilots, with smart features that make flying fun instead of frustrating. Altitude hold automatically maintains hover height, one-key takeoff and landing puts the drone in the air and back on the ground with a single button press, and headless mode ensures the drone always responds correctly to directional inputs regardless of which way it's facing — the three most common pain points for new drone pilots, all solved.

The 2.4GHz controller is ergonomically sized for children's hands with responsive joysticks, a dedicated flip button that executes 360-degree aerial acrobatics on command, and a three-position speed switch (slow for beginners, medium for developing pilots, fast for experts). The propellers are enclosed in a full protective guard that prevents damage to furniture, walls, and fingers during the inevitable crashes of the learning process. The lightweight ABS frame bounces rather than breaks on impact.

The rechargeable lithium-polymer battery provides approximately 7 minutes of flight per 40-minute USB charge — short enough that the fun doesn't outstay the battery, long enough for meaningful skill development. Three batteries are included for back-to-back flight sessions. Drone flying develops hand-eye coordination, spatial awareness, and the kind of fine-motor joystick control that transfers to countless other applications. The Mini Beginner Drone is the perfect entry point into the drone hobby — small enough for indoor use, forgiving enough for beginners, and capable enough to deliver genuine flight thrills.`,
    keywords: ["drone", "flying", "indoor", "mini", "beginner"],
    ageRange: { min: 8, max: 14 },
    price: 29.99,
    inventory: 22,
    category: "electronic",
    dimensions: { lengthInches: 3.5, widthInches: 3.5, heightInches: 1.5, weightLbs: 0.2 },
    manufacturer: "SkyBound Toys",
    bestSellersRank: 48,
    rating: { stars: 4.3, numberOfRatings: 1890 },
  },
  {
    id: "toy-142",
    name: "LED Drawing Pad – Glow Art",
    image: "/product-images/toy-142.png",
    description: "Illuminated drawing pad with 4 neon markers and 30 stencils. Draw glowing pictures in the dark. Battery or USB powered.",
    marketingCopy: `Light up the night with your imagination! Our LED Drawing Pad creates a mesmerizing glow-art experience: draw on the illuminated surface with the included neon markers, turn off the room lights, and watch your creation glow with vibrant, otherworldly luminescence. The edge-lit LED panel evenly distributes light across the drawing surface, making every line, swirl, and detail radiate with uniform brightness. Four neon markers (blue, green, pink, and orange) are included, each one producing vivid, highly visible lines on the illuminated surface.

Thirty reusable stencils slide under the transparent drawing surface, providing guided outlines for animals, vehicles, letters, patterns, and fantasy scenes. Trace the stencil, remove it, and add your own creative details freehand — a scaffolded approach that builds drawing confidence and technique. The pad surface wipes clean instantly with a damp cloth, making it infinitely reusable. Power options include 3 AAA batteries or the included USB cable, providing flexibility for bedside use, travel, and extended drawing sessions.

The glow-art experience is uniquely captivating because it inverts the normal relationship between drawing and viewing: instead of creating marks that absorb light, children create marks that emit light, producing artwork that feels alive and magical. This perceptual shift engages children who might not be attracted to traditional drawing, opening a creative channel that builds visual-spatial skills, fine motor control, and artistic confidence. The pad is slim enough (0.3 inches) to slide into a backpack, making it an exceptional travel entertainment option and a beloved bedtime creative activity.`,
    keywords: ["LED", "drawing", "glow", "art", "neon", "light"],
    ageRange: { min: 4, max: 10 },
    price: 19.99,
    inventory: 38,
    category: "electronic",
    dimensions: { lengthInches: 13.0, widthInches: 10.0, heightInches: 0.3, weightLbs: 0.5 },
    manufacturer: "ArtSpark Studios",
    bestSellersRank: 28,
    rating: { stars: 4.6, numberOfRatings: 3456 },
  },
  // ── EDUCATIONAL ────────────────────────────────────────────────────────
  {
    id: "toy-143",
    name: "World Globe – Interactive Talking",
    image: "/product-images/toy-143.png",
    description: "10-inch globe with a smart pen that speaks 1000+ facts about countries, capitals, languages, and populations. Quiz mode with 3 difficulty levels.",
    marketingCopy: `The world is at your fingertips — literally. Our Interactive Talking Globe combines a beautifully detailed 10-inch physical globe with a wireless smart pen that speaks over 1,000 facts about countries, capitals, populations, languages, currencies, national anthems, and geographic features. Touch the pen to any country and hear its name, capital, population, official language, and a fascinating cultural fact, all spoken in a clear, engaging voice. Touch an ocean, mountain range, or river and learn its name, length, depth, and ecological significance.

Three quiz modes transform the globe from reference tool to competitive game: Easy mode asks players to find a named country, Medium asks for capitals and languages, and Hard challenges players with population comparisons, flag identification, and "what country am I?" riddle clues. Up to four players can compete, with the smart pen keeping score and announcing results. The globe's political map is updated annually and displays current national boundaries, capital cities, major cities, rivers, mountains, and ocean currents.

Interactive globe play develops geographic literacy, cultural awareness, and global perspective in ways that flat maps and screens cannot match. The three-dimensional format teaches the spatial relationships between continents, the scale of oceans, and the concept of hemispheres and poles intuitively. Children who regularly interact with a globe demonstrate significantly better geographic knowledge, cultural empathy, and world-awareness than those who rely solely on digital maps. The smart pen charges via USB and stores in a built-in holder on the globe's base.`,
    keywords: ["globe", "geography", "interactive", "talking", "educational"],
    ageRange: { min: 5, max: 12 },
    price: 44.99,
    inventory: 18,
    category: "educational",
    dimensions: { lengthInches: 11.0, widthInches: 11.0, heightInches: 14.0, weightLbs: 2.5 },
    manufacturer: "BrightMinds Electronics",
    bestSellersRank: 35,
    rating: { stars: 4.6, numberOfRatings: 2345 },
  },
  {
    id: "toy-144",
    name: "Math Flash Cards – Multiplication",
    image: "/product-images/toy-144.png",
    description: "169 self-checking flash cards covering all multiplication facts 0-12. Color-coded by difficulty. Rounded corners and durable lamination.",
    marketingCopy: `Master multiplication one fact at a time with our self-checking Flash Cards — 169 laminated cards covering every multiplication fact from 0×0 through 12×12. Each card displays the problem on the front and the answer on the back, enabling independent practice that builds fluency and confidence. The cards are color-coded by difficulty level: green for facts most children learn first (×0, ×1, ×2, ×5, ×10), yellow for intermediate facts (×3, ×4, ×6, ×9), and red for the challenging facts (×7, ×8, ×11, ×12) that require the most practice.

The cards are printed on heavy card stock with a matte lamination that resists moisture, fingerprints, and the wear of daily shuffling. Rounded corners prevent dog-earing, and the standard 3×5 inch size fits comfortably in children's hands and in card holders, pockets, and recipe-card boxes for organized storage. A parent/teacher guide included with the set outlines effective practice strategies: the "waterfall" method, the "3-pile sort" system, and timed-challenge games that turn drill into competition.

Multiplication fluency is the single most important mathematical milestone in elementary school — it is the foundation upon which fractions, division, algebra, and every subsequent mathematical concept is built. Children who achieve automatic recall of multiplication facts (answering in under 3 seconds per fact) consistently outperform their peers in all areas of mathematics throughout their academic careers. These flash cards provide the simplest, most effective, and most research-validated tool for building that fluency. Fifteen minutes of daily practice with these cards produces measurable improvement within two weeks.`,
    keywords: ["math", "multiplication", "flash cards", "educational", "practice"],
    ageRange: { min: 6, max: 10 },
    price: 8.99,
    inventory: 75,
    category: "educational",
    dimensions: { lengthInches: 5.0, widthInches: 3.0, heightInches: 2.0, weightLbs: 0.5 },
    manufacturer: "BrainBridge Learning",
    bestSellersRank: 8,
    rating: { stars: 4.7, numberOfRatings: 6789 },
  },
  {
    id: "toy-145",
    name: "Magnetic World Map Puzzle",
    image: "/product-images/toy-145.png",
    description: "92-piece magnetic puzzle of the world map on a wooden board. Each piece is a country or region with its name and flag.",
    marketingCopy: `Build the world, one country at a time. Our Magnetic World Map Puzzle transforms geography learning into a hands-on, tactile experience with 92 magnetic wooden pieces — each one shaped like a country or geographic region — that snap onto a beautiful illustrated wooden board. Every piece displays the country's name, flag, and a tiny iconic illustration (the Eiffel Tower for France, a kangaroo for Australia, the Taj Mahal for India), creating a rich, information-dense learning tool disguised as a gorgeous puzzle.

The magnetic connection provides a satisfying click as each piece finds its home on the board, and the strong magnets keep completed regions in place even when the board is tilted or carried. The board itself is framed in solid hardwood and measures 18×14 inches — large enough to appreciate the detail, yet compact enough to hang on a wall as permanent room décor between play sessions. The reverse side of each piece includes the country's capital, population, and primary language for deeper learning during repeat assembly.

Geographic puzzle play engages multiple learning modalities simultaneously: visual (flag recognition, spatial positioning), kinesthetic (physical manipulation, motor planning), and verbal (country names, facts shared during play). Children who regularly assemble geographic puzzles demonstrate dramatically superior map-reading skills, spatial reasoning, and cultural knowledge compared to those who learn geography from books alone. This puzzle makes an outstanding classroom resource, homeschool tool, or family-room fixture that sparks daily conversations about the wider world.`,
    keywords: ["map", "magnetic", "geography", "countries", "flags"],
    ageRange: { min: 5, max: 10 },
    price: 29.99,
    inventory: 25,
    category: "educational",
    dimensions: { lengthInches: 18.0, widthInches: 14.0, heightInches: 1.0, weightLbs: 2.5 },
    manufacturer: "BrainBridge Learning",
    bestSellersRank: 34,
    rating: { stars: 4.7, numberOfRatings: 2567 },
  },
  {
    id: "toy-146",
    name: "Sight Words Board Game",
    image: "/product-images/toy-146.png",
    description: "Fast-paced board game that helps kids learn 220 Dolch sight words. Spin, read, and race to the finish. 2-4 players.",
    marketingCopy: `Race to read! Our Sight Words Board Game transforms the essential (but often tedious) task of memorizing sight words into a fast-paced, competitive adventure that children beg to play. The game covers all 220 Dolch sight words — the high-frequency words that make up 50-75% of all English text — organized across a colorful game board with spaces themed as different reading environments: library, classroom, bookstore, and park. Players spin the spinner, draw a sight-word card, read the word aloud, and advance if correct — or stay put and practice if they need another try.

The game includes three difficulty tiers (pre-primer, primer, and advanced), allowing families to customize the challenge level to their child's current reading stage. Bonus spaces trigger fun challenges: "use the word in a sentence," "spell the word with your eyes closed," and "find the word on the game board," adding variety and deeper engagement with each word. The 220 word cards are laminated for durability and can also be used independently as flash cards when the game board is put away.

Sight-word fluency is the gateway to reading independence — when children can recognize common words instantly (without sounding them out), their reading speed increases, their comprehension improves, and the act of reading transforms from effortful work into pleasurable flow. Our game makes the repetition needed for sight-word mastery genuinely fun, with the competitive element providing motivation that isolated practice cannot match. Teachers and reading specialists regularly recommend this game as a classroom center activity and a home-practice tool.`,
    keywords: ["sight words", "reading", "literacy", "board game", "educational"],
    ageRange: { min: 4, max: 7 },
    price: 18.99,
    inventory: 35,
    category: "educational",
    dimensions: { lengthInches: 10.5, widthInches: 10.5, heightInches: 2.0, weightLbs: 1.2 },
    manufacturer: "BrainBridge Learning",
    bestSellersRank: 22,
    rating: { stars: 4.6, numberOfRatings: 3456 },
  },
  {
    id: "toy-147",
    name: "Solar System Floor Mat",
    image: "/product-images/toy-147.png",
    description: "5-foot cushioned floor mat with detailed solar system illustration. Planet facts around the border. Water-resistant and easy to clean.",
    marketingCopy: `Step into the cosmos every morning when you get out of bed. Our Solar System Floor Mat is a 5-foot-diameter cushioned play mat featuring a scientifically accurate, gorgeously illustrated map of our solar system, surrounded by a border packed with fascinating planet facts. Each planet is depicted at accurate relative size with surface detail based on NASA imagery, positioned along its orbital path with distance labels from the Sun. The asteroid belt, dwarf planets (including Pluto), and major moons are all represented.

The mat is constructed from 0.4-inch closed-cell EVA foam with a printed polyester surface layer that is water-resistant, stain-resistant, and easy to wipe clean. The cushioned surface is comfortable for sitting, lying, and playing on hard floors, and the anti-slip backing prevents the mat from sliding on tile, wood, and laminate surfaces. The vibrant, full-color printing is UV-resistant and maintains its vivid appearance through years of daily use.

Floor mats serve a unique educational function: because they live on the floor of a child's room, they provide passive learning exposure every single day, reinforcing planet names, order, and facts through constant visual presence. Children naturally engage with the mat during play — lying on it for reading, using it as a launch pad for space-themed pretend play, and quizzing themselves and visitors on planet facts. Space educators note that children with solar system décor in their bedrooms consistently demonstrate superior astronomical knowledge compared to peers without such environmental reinforcement.`,
    keywords: ["solar system", "space", "mat", "learning", "room decor"],
    ageRange: { min: 3, max: 10 },
    price: 26.99,
    inventory: 22,
    category: "educational",
    dimensions: { lengthInches: 60.0, widthInches: 60.0, heightInches: 0.4, weightLbs: 2.0 },
    manufacturer: "CosmicPlay",
    bestSellersRank: 44,
    rating: { stars: 4.5, numberOfRatings: 1890 },
  },
  {
    id: "toy-148",
    name: "Alphabet Learning Robot",
    image: "/product-images/toy-148.png",
    description: "Interactive robot that teaches ABCs, phonics, and spelling. Voice recognition responds to kids' answers. 3 learning modes plus games.",
    marketingCopy: `Meet Alpha — the friendliest teacher your child will ever have. Our Alphabet Learning Robot is an interactive, voice-responsive companion that teaches letter recognition, phonics, and early spelling through conversation, games, and enthusiastic encouragement. Alpha's LED face displays expressive emotions (happy, thinking, surprised, celebrating), and the built-in voice-recognition system listens to children's responses and provides immediate, personalized feedback: "That's right! B says 'buh'! Great job!"

Three learning modes progress in complexity: Explore mode lets children press letter buttons to hear names, sounds, and example words; Quiz mode asks children to find specific letters or identify sounds; and Spelling mode challenges children to spell simple CVC words (cat, dog, sun) by pressing letter sequences. The voice recognition is tuned to children's vocal frequencies and pronunciation patterns, ensuring accurate response detection even from developing speakers. Alpha celebrates correct answers with a victory dance and sound effect, creating positive associations with learning.

Interactive robots represent the frontier of educational toy design — they provide responsive, personalized instruction that adapts to a child's pace and engagement level. Alpha's warm personality and patient repetition make letter learning feel like playing with a friend rather than completing a lesson. Parents report that children who interact with Alpha daily demonstrate accelerated letter recognition and phonics mastery compared to passive learning methods. Alpha runs on 4 AA batteries (included) with approximately 8 hours of active learning time per set.`,
    keywords: ["alphabet", "phonics", "robot", "interactive", "letters"],
    ageRange: { min: 2, max: 5 },
    price: 39.99,
    inventory: 20,
    category: "educational",
    dimensions: { lengthInches: 6.0, widthInches: 5.0, heightInches: 8.0, weightLbs: 1.2 },
    manufacturer: "BrightMinds Electronics",
    bestSellersRank: 29,
    rating: { stars: 4.5, numberOfRatings: 2345 },
  },
  {
    id: "toy-149",
    name: "Fraction Pizza Math Game",
    image: "/product-images/toy-149.png",
    description: "Hands-on fraction learning with pizza-slice manipulatives. Match, compare, add, and subtract fractions. Includes game board and cards.",
    marketingCopy: `Fractions finally make sense — because who doesn't understand pizza? Our Fraction Pizza Math Game uses the universally beloved pizza as a visual and tactile model for fraction concepts, turning abstract mathematical notation into concrete, delicious reality. The game includes 6 foam pizza pies in different "flavors" (colors), each divided into slices representing halves, thirds, quarters, fifths, sixths, and eighths — 51 pizza-slice manipulatives in total, plus a game board, fraction cards, and a spinner.

In game mode, players spin to determine a target fraction, then race to build the correct pizza combination — but here's where it gets educational: 2/4 and 3/6 and 1/2 are all equivalent, and the player who finds the simplest equivalent fraction scores bonus points. The game naturally introduces fraction comparison (is 2/3 bigger than 3/4?), addition (1/4 + 1/4 = 2/4 = 1/2), and the concept of a whole (all slices together = 1). The manipulative pieces can also be used independently of the game for hands-on fraction exploration during homework time.

Fractions are consistently identified as the most difficult elementary math concept for students — and the most critical for future mathematical success. Research shows that hands-on manipulatives dramatically improve fraction understanding compared to symbolic-only instruction, and food-based models (especially pizza) are the most effective manipulative of all because children have intuitive, real-world experience with fair sharing of food. This game brings that research to life in a format that children genuinely enjoy, producing "aha moments" that transform fraction anxiety into fraction confidence.`,
    keywords: ["fractions", "math", "pizza", "hands-on", "manipulatives"],
    ageRange: { min: 6, max: 10 },
    price: 16.99,
    inventory: 30,
    category: "educational",
    dimensions: { lengthInches: 12.0, widthInches: 12.0, heightInches: 2.0, weightLbs: 1.0 },
    manufacturer: "BrainBridge Learning",
    bestSellersRank: 38,
    rating: { stars: 4.7, numberOfRatings: 2123 },
  },
  {
    id: "toy-150",
    name: "Bilingual Learning Tablet – English/Spanish",
    image: "/product-images/toy-150.png",
    description: "Electronic learning tablet with 100+ activities in English and Spanish. Covers letters, numbers, music, and logic. Touch-sensitive screen.",
    marketingCopy: `Two languages, one incredible learning tool. Our Bilingual Learning Tablet provides over 100 educational activities in both English and Spanish, seamlessly switching between languages at the touch of a button. The touch-sensitive screen displays colorful graphics with large, child-friendly interface elements, while a clear, expressive bilingual voice guides children through activities covering letter recognition, phonics, number concepts, basic vocabulary, music, and logic puzzles. Every activity is available in both languages, allowing children to learn a concept in English and immediately reinforce it in Spanish — or vice versa.

The tablet features a durable, rubberized casing that survives drops from table height, a volume control with three settings (plus headphone jack for quiet play), and an automatic power-save function. The screen displays vivid, non-backlit graphics that are easy on developing eyes, and the touch targets are generously sized for accuracy with small fingers. Five subject areas (Letters, Numbers, Words, Music, and Games) each contain 20+ activities with three difficulty levels that auto-adjust based on the child's performance.

Bilingual education research overwhelmingly supports early dual-language exposure for cognitive development, executive function, and cultural awareness — even for children growing up in monolingual households. Our tablet makes dual-language learning natural and fun, embedding Spanish and English vocabulary, pronunciation, and syntax into playful activities that children return to voluntarily. The tablet's bilingual voice is recorded by native speakers of both languages, ensuring accurate pronunciation modeling. Parents of heritage Spanish speakers find this tablet invaluable for reinforcing home-language literacy alongside English school learning.`,
    keywords: ["bilingual", "Spanish", "tablet", "learning", "language"],
    ageRange: { min: 3, max: 7 },
    price: 29.99,
    inventory: 24,
    category: "educational",
    dimensions: { lengthInches: 10.0, widthInches: 7.0, heightInches: 1.0, weightLbs: 0.7 },
    manufacturer: "BrightMinds Electronics",
    bestSellersRank: 32,
    rating: { stars: 4.5, numberOfRatings: 2567 },
  },
  {
    id: "toy-151",
    name: "History Timeline Card Game",
    image: "/product-images/toy-151.png",
    description: "Place historical events in chronological order to win. 300 event cards spanning ancient history to modern times. 2-6 players.",
    marketingCopy: `When did humans land on the Moon — before or after the first email was sent? Did the Great Wall of China come before or after the Roman Colosseum? Our History Timeline Card Game challenges players to place historical events in correct chronological order, building a shared timeline across the table one card at a time. With 300 event cards spanning from the Big Bang to the 21st century, every game is a fresh journey through the sweep of human history.

Game play is elegantly simple: draw a card showing an event (with an illustration and brief description but NO date visible), then place it where you think it falls in the growing timeline on the table. Flip the card to reveal the date — if you placed it correctly, it stays and you score a point; if not, it goes to the discard pile and your turn ends. The timeline grows longer and more nuanced with each round, making correct placement increasingly challenging as gaps fill in and precision matters more.

This game is sneakily one of the most effective history-education tools available because it teaches something textbooks rarely achieve: a sense of historical proportion and simultaneity. Players who discover that Shakespeare and Galileo were contemporaries, or that Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid, develop a richer, more interconnected understanding of history than sequential chapter reading can provide. The game plays beautifully with 2-6 players across a wide age range, as children and adults often bring complementary knowledge to the table.`,
    keywords: ["history", "timeline", "card game", "chronological", "educational"],
    ageRange: { min: 8, max: 14 },
    price: 14.99,
    inventory: 32,
    category: "educational",
    dimensions: { lengthInches: 5.0, widthInches: 4.0, heightInches: 2.0, weightLbs: 0.6 },
    manufacturer: "BrainBridge Learning",
    bestSellersRank: 52,
    rating: { stars: 4.6, numberOfRatings: 1789 },
  },
  {
    id: "toy-152",
    name: "Counting Bears & Cups Set",
    image: "/product-images/toy-152.png",
    description: "100 rainbow counting bears with 6 matching cups. Activity cards for sorting, counting, patterns, and basic math. Great classroom manipulative.",
    marketingCopy: `Count, sort, pattern, and play with our Rainbow Counting Bears — 100 adorable bear figurines in six colors and three sizes, paired with six matching sorting cups and a deck of 30 activity cards that turn mathematical concepts into hands-on, bear-powered fun. The bears are made from smooth, tactile plastic in vivid rainbow colors (red, orange, yellow, green, blue, and purple), with each color available in small, medium, and large sizes for multi-attribute sorting activities.

The activity cards progress through key early-math concepts: one-to-one counting, color sorting, size sorting, pattern creation and extension, addition, subtraction, greater-than/less-than comparison, and simple graphing. Each card presents a visual challenge — "Put 3 red bears and 2 blue bears in the cup. How many bears are there altogether?" — that children solve by physically manipulating the bears. The tactile, concrete nature of this manipulation is what makes counting bears so effective: children who learn math with manipulatives develop deeper conceptual understanding than those who learn from worksheets alone.

This set is a staple of preschool and kindergarten classrooms worldwide, valued by educators for its versatility across the entire early-math curriculum. At home, the bears double as pretend-play figurines — children create families, schools, and adventures for their bear communities, organically practicing counting and sorting within imaginative play. The sorting cups nest for compact storage, the bears fit in a zippered pouch (included), and the activity cards are laminated for durability. This is the math manipulative that makes children say "Can we do math?" — possibly the most transformative sentence in education.`,
    keywords: ["counting", "bears", "sorting", "math", "manipulatives"],
    ageRange: { min: 2, max: 5 },
    price: 14.99,
    inventory: 50,
    category: "educational",
    dimensions: { lengthInches: 10.0, widthInches: 8.0, heightInches: 4.0, weightLbs: 1.0 },
    manufacturer: "BrainBridge Learning",
    bestSellersRank: 14,
    rating: { stars: 4.8, numberOfRatings: 5678 },
  },
  // ── CARD GAMES ─────────────────────────────────────────────────────────
  {
    id: "toy-153",
    name: "Color Match – Classic",
    image: "/product-images/toy-153.png",
    description: "The world's #1 matching card game. Match colors and numbers, play action cards, and shout when you're down to one card! 2-10 players. 108 cards.",
    marketingCopy: `One card left! The moment that has launched a billion family arguments and cemented a billion family memories. The world's number-one card game needs no introduction — match cards by color or number, deploy action cards (Skip, Reverse, Draw Two) to thwart opponents, and remember to shout "One card!" when you're down to your last or face the dreaded two-card penalty. The 108-card deck includes number cards in four colors, action cards that change the flow of play, and wild cards that let you dictate the color of play — including the feared Wild Draw Four.

The genius of UNO lies in its accessibility: the rules take 60 seconds to learn, reading is not required (color and number matching only), and the game accommodates 2-10 players, making it equally suited for intimate two-player duels and raucous ten-player tournaments. Game length scales naturally with player count (10-15 minutes for 2-3 players, 20-30 for larger groups), and the luck-strategy balance ensures that everyone — from five-year-olds to grandparents — has a genuine chance of winning.

This game has sold over 150 million copies worldwide because it delivers three things that every great game must: social connection, dramatic tension, and joyful surprise. The moment when you play a Draw Four on the person who just played one on you, or when a well-timed Reverse saves you from elimination, creates shared emotional peaks that families remember and reference for years. The compact card deck travels anywhere — restaurants, airplanes, camping trips, waiting rooms — making UNO the universal game that's always ready when fun is needed.`,
    keywords: ["color match", "card game", "classic", "family", "matching"],
    ageRange: { min: 5, max: 14 },
    price: 7.99,
    inventory: 80,
    category: "card-games",
    dimensions: { lengthInches: 5.5, widthInches: 3.5, heightInches: 1.0, weightLbs: 0.3 },
    manufacturer: "WonderPlay Games",
    bestSellersRank: 2,
    rating: { stars: 4.8, numberOfRatings: 15678 },
  },
  {
    id: "toy-154",
    name: "Exploding Cats – Family Edition",
    image: "/product-images/toy-154.png",
    description: "Family-friendly version of the wildly popular card game. Draw cards, avoid exploding cats, and use action cards to survive. 2-5 players.",
    marketingCopy: `Will you survive — or will you explode? Exploding Cats is the card game phenomenon that has sold millions of copies worldwide, and this Family Edition brings all the strategic mayhem to younger players with kid-friendly artwork and simplified rules. The concept is deliciously simple: take turns drawing cards from the deck, and if you draw an Exploding Cat card, you're out — unless you have a Defuse card to save yourself. The rest of the deck is filled with action cards that let you skip turns, peek at the deck, shuffle the deck, and force opponents to draw extra cards.

The brilliance of Exploding Cats is in the escalating tension: as the game progresses, Defuse cards get used up and Exploding Cat cards become an increasingly large proportion of the remaining deck. Every card draw becomes a nail-biting gamble, and the action cards provide just enough control to create genuine strategic decisions — do you play your Skip now or save it for later when the odds are worse? The hilarious artwork adds visual comedy that keeps the tone light even as the tension builds.

Games last 15 minutes, making this the perfect palette cleanser between longer games or a quick-hit entertainment option when time is limited. The strategic depth-to-rules-complexity ratio is remarkable: the rules fit on a single card, yet experienced players develop genuine tactical approaches that increase their survival rate. The Family Edition content is fully appropriate for players 7+, with none of the adult-humor elements from the original edition. For 2-5 players who enjoy equal parts strategy and chaos.`,
    keywords: ["exploding cats", "card game", "funny", "strategy", "family"],
    ageRange: { min: 7, max: 14 },
    price: 19.99,
    inventory: 30,
    category: "card-games",
    dimensions: { lengthInches: 5.0, widthInches: 4.0, heightInches: 1.5, weightLbs: 0.4 },
    manufacturer: "Boom Cat Games",
    bestSellersRank: 17,
    rating: { stars: 4.6, numberOfRatings: 4567 },
  },
  {
    id: "toy-155",
    name: "Go Fish – Illustrated",
    image: "/product-images/toy-155.png",
    description: "Beautifully illustrated Go Fish card deck featuring ocean animals. Classic gameplay for young card game players. 2-6 players.",
    marketingCopy: `Got any seahorses? Our Illustrated Go Fish deck takes the classic matching game and immerses it in a gorgeous underwater world with 13 sets of four beautifully painted ocean animals: clownfish, seahorse, octopus, sea turtle, dolphin, whale, pufferfish, jellyfish, starfish, crab, manta ray, narwhal, and orca. Each card is a miniature work of art, with detailed watercolor illustrations that children study and admire while playing — learning marine biology vocabulary and species recognition as a natural byproduct of game play.

The rules of Go Fish are the perfect first card game: ask an opponent for a specific card to complete a matching set. If they have it, you score; if not, you "Go Fish" from the draw pile. The simplicity of the mechanic — no reading required, just image matching — makes Go Fish accessible to children as young as three, while the memory and deduction elements (tracking which cards opponents ask for) add cognitive challenge for older players. Games play in 10-15 minutes with 2-6 players.

Go Fish teaches turn-taking, social communication (making requests, responding to requests), memory, categorical thinking, and the foundational card-handling skills (holding a hand, drawing from a deck, organizing matches) that prepare children for more complex card games. Our illustrated edition elevates the experience from generic playing cards to a visually captivating, thematic adventure that children request by name. The oversized cards (3.5×5 inches) are easy for small hands to hold, and the thick, laminated card stock withstands the shuffling and handling of enthusiastic young players.`,
    keywords: ["go fish", "card game", "ocean", "classic", "simple"],
    ageRange: { min: 3, max: 7 },
    price: 6.99,
    inventory: 65,
    category: "card-games",
    dimensions: { lengthInches: 5.0, widthInches: 3.5, heightInches: 1.0, weightLbs: 0.2 },
    manufacturer: "Gamewright",
    bestSellersRank: 11,
    rating: { stars: 4.7, numberOfRatings: 5678 },
  },
  {
    id: "toy-156",
    name: "Sushi Dash Card Game",
    image: "/product-images/toy-156.png",
    description: "Fast-playing card-drafting game where you score points by building the best sushi combos. Adorable illustrations. 2-5 players, 15 minutes.",
    marketingCopy: `Pick and pass — the sushi is spinning! Sushi Dash is a lightning-fast card-drafting game where players simultaneously select cards from a hand, reveal their choices, and pass the remaining cards to the next player — mimicking the experience of grabbing dishes from a conveyor-belt sushi restaurant. Score points by collecting the best combinations: a pair of Tempura is worth 5 points, three Sashimi scores 10, and Maki Rolls award points to whoever collects the most. But choose carefully — Pudding cards scored at the end of the game can swing the final standings dramatically.

The gameplay is elegantly simple yet strategically rich: every card selection involves weighing your own scoring opportunities against what you're passing to opponents. The simultaneous-play mechanism eliminates downtime — everyone plays at once — keeping games fast and engaging. The adorable, personality-packed illustrations (smiling nigiri, winking dumplings, bashful wasabi) add charm that makes the game a joy to look at as well as play. Games take just 15 minutes with 2-5 players.

Sushi Dash has won numerous gaming awards for its brilliant design: it teaches the card-drafting mechanic (used in complex strategy games like 7 Wonders) in an accessible, family-friendly format that works for players aged 8 and up. The risk-reward decisions, the need to read opponents' strategies, and the end-game scoring surprises create genuine strategic depth in a tiny, portable package. The cards come in a collectible tin that fits in a jacket pocket, making Sushi Dash the perfect travel game, restaurant game, and "while we wait for the food to arrive" game.`,
    keywords: ["sushi dash", "drafting", "card game", "strategy", "cute"],
    ageRange: { min: 8, max: 14 },
    price: 12.99,
    inventory: 35,
    category: "card-games",
    dimensions: { lengthInches: 4.0, widthInches: 3.0, heightInches: 1.5, weightLbs: 0.3 },
    manufacturer: "Gamewright",
    bestSellersRank: 23,
    rating: { stars: 4.8, numberOfRatings: 4890 },
  },
  {
    id: "toy-157",
    name: "Memory Match – Animals (72 cards)",
    image: "/product-images/toy-157.png",
    description: "72-card memory matching game with adorable animal illustrations. Flip two cards and find pairs. Builds concentration and visual memory.",
    marketingCopy: `Flip, remember, match! Our Memory Match game challenges players to find matching pairs among 72 face-down cards featuring 36 adorable animal illustrations — each one appearing exactly twice in the deck. Players take turns flipping two cards face-up; if they match, the player keeps the pair and goes again. If not, both cards return face-down and the next player tries, using their memory of previously revealed cards to locate matches.

The 72-card format provides a genuinely challenging memory workout — this is not a toddler-level matching game but a real cognitive challenge that taxes adult memory just as effectively as children's. The beautiful animal illustrations (painted in a warm, contemporary style) include both familiar favorites (puppy, kitten, bunny) and fascinating species (axolotl, pangolin, quokka), sparking animal identification conversations during play. The cards are printed on heavy, linen-textured card stock that shuffles smoothly and resists bending.

Memory matching is one of the most researched cognitive training activities in developmental psychology, consistently linked to improvements in working memory, visual discrimination, concentration, and strategic thinking. Our 72-card version provides the optimal challenge level for developing brains: easy enough to produce satisfying matches, difficult enough to require genuine cognitive effort. For younger players or shorter game sessions, the deck can be reduced to 24 or 48 cards. The game plays 2-8 players, and children frequently outperform adults — a rare and empowering dynamic that builds confidence and enthusiasm for cognitive challenges.`,
    keywords: ["memory", "matching", "animals", "concentration", "card game"],
    ageRange: { min: 3, max: 7 },
    price: 9.99,
    inventory: 55,
    category: "card-games",
    dimensions: { lengthInches: 6.0, widthInches: 4.0, heightInches: 1.5, weightLbs: 0.4 },
    manufacturer: "PuzzleCraft",
    bestSellersRank: 15,
    rating: { stars: 4.6, numberOfRatings: 3890 },
  },
  {
    id: "toy-158",
    name: "Taco Cat Goat Cheese Pizza",
    image: "/product-images/toy-158.png",
    description: "Lightning-fast card slapping game that tests reflexes and attention. Say the words while flipping cards—slap the pile on a match! 2-8 players.",
    marketingCopy: `Taco! Cat! Goat! Cheese! PIZZA! SLAP! Our fastest-selling card game tests reflexes, attention, and the ability to keep a straight face during increasingly hilarious chaos. Players take turns flipping cards from their personal deck onto a central pile while saying the five words in sequence: "Taco... Cat... Goat... Cheese... Pizza..." When the word you say matches the card you flip, everyone slaps the pile — last hand on the pile takes all the cards. First player to empty their hand wins.

The genius twist: special action cards (Gorilla, Groundhog, Narwhal) interrupt the flow with silly physical actions (beat your chest, knock the table, form a horn on your forehead) that must be performed before slapping. The combination of verbal sequencing, visual matching, and physical action creates a cognitive juggling act that produces inevitable, hilarious mistakes — and the laughter that follows is the game's real reward.

This game scales beautifully from 2 players (intense, focused dueling) to 8 players (absolute pandemonium), and games last just 10-15 minutes. The rules take 30 seconds to explain, making it instantly playable at parties, family gatherings, and game nights. Children and adults play on perfectly equal footing — kids' faster reflexes often compensate for adults' better attention, creating genuinely competitive cross-age play. The compact deck fits in a pocket, and the game requires no table (play on any flat surface), making it the ultimate portable party game.`,
    keywords: ["taco cat", "slapping", "reflex", "party", "card game"],
    ageRange: { min: 6, max: 14 },
    price: 9.99,
    inventory: 45,
    category: "card-games",
    dimensions: { lengthInches: 4.5, widthInches: 3.5, heightInches: 1.0, weightLbs: 0.2 },
    manufacturer: "Dolphin Hat Games",
    bestSellersRank: 13,
    rating: { stars: 4.7, numberOfRatings: 6234 },
  },
  // ── SPORTS & FITNESS ───────────────────────────────────────────────────
  {
    id: "toy-159",
    name: "Basketball Hoop – Adjustable Indoor/Outdoor",
    image: "/product-images/toy-159.png",
    description: "Adjustable basketball hoop from 3 to 6.5 feet. Weighted base, shatterproof backboard, and all-weather net. Includes junior basketball.",
    marketingCopy: `Nothing but net! Our Adjustable Basketball Hoop grows with your child from first toddle-up layups to full-court jump shots, with six height positions spanning 3 to 6.5 feet. The shatterproof polycarbonate backboard features a printed square and border for bank-shot aiming, and the breakaway-style rim with all-weather nylon net provides the satisfying "swish" that keeps shooters coming back for one more shot. The included junior-sized basketball (size 3) is perfectly proportioned for small hands.

The fillable base holds up to 35 liters of water or sand, providing tip-resistant stability even during aggressive slam-dunk attempts. The steel pole and support structure are powder-coated for rust resistance, and the entire system can be used indoors on hard floors (rubber base pad included) or outdoors on driveways, patios, and lawns. Height adjustment is tool-free — simply release the locking collar, slide the pole to the desired position, and re-lock. The transition from 3-foot toddler height to 6.5-foot youth height happens in seconds.

Basketball develops hand-eye coordination, depth perception, cardiovascular fitness, and the motor planning required to calculate trajectories and adjust shooting form. The adjustable height ensures that children experience consistent success at every stage of development — the hoop is always low enough for regular baskets yet high enough to require genuine skill development. Parents love that this hoop creates an active, outdoor default activity that pulls children away from screens and into physical play. The full-size regulation hoop height of 10 feet can be approximated with the separately available extension pole for older players.`,
    keywords: ["basketball", "hoop", "adjustable", "sport", "indoor outdoor"],
    ageRange: { min: 3, max: 10 },
    price: 49.99,
    inventory: 15,
    category: "sports",
    dimensions: { lengthInches: 24.0, widthInches: 16.0, heightInches: 78.0, weightLbs: 12.0 },
    manufacturer: "ActiveKids Sports",
    bestSellersRank: 26,
    rating: { stars: 4.5, numberOfRatings: 3456 },
  },
  {
    id: "toy-160",
    name: "Soccer Goal & Ball Set",
    image: "/product-images/toy-160.png",
    description: "Pop-up soccer goal (4x3 feet) with a size 3 soccer ball, pump, and 6 training cones. Folds flat into a carry bag.",
    marketingCopy: `Goal! Our Pop-Up Soccer Goal & Ball Set turns any open space into a pitch in seconds. The 4×3-foot goal springs into shape instantly from its folded-flat carry bag — no assembly, no tools, no fumbling with poles and connectors. The steel-wire frame maintains its shape under ball impacts, and the polyester net catches shots with satisfying authenticity. A size 3 soccer ball (appropriate for ages 3-8), a hand pump with needle, and 6 bright orange training cones complete the kit.

The goal is engineered for genuine play: the frame rebounds from impacts without collapsing, the net is deep enough to contain hard shots, and the built-in ground stakes prevent the goal from sliding on grass. The pop-up design folds flat into a 24-inch disc that slides into the included carry bag, making transport and storage effortless. The entire kit weighs under 4 pounds, light enough for a child to carry to the park independently.

Soccer is the world's most popular sport, and introducing children early builds coordination, cardiovascular fitness, teamwork, and a foundation for organized play later. Our set removes every barrier to backyard practice: no inflation hassles (ball arrives fully inflated), no complex assembly, and enough accessories (cones for dribbling drills, goal for shooting practice) to support both solo training and multi-player games. The pop-up goal also excels as a target for other sports — throw balls into it, kick footballs through it, or use it as a base for backyard field games.`,
    keywords: ["soccer", "goal", "ball", "sport", "outdoor"],
    ageRange: { min: 3, max: 10 },
    price: 29.99,
    inventory: 28,
    category: "sports",
    dimensions: { lengthInches: 48.0, widthInches: 36.0, heightInches: 36.0, weightLbs: 3.5 },
    manufacturer: "ActiveKids Sports",
    bestSellersRank: 24,
    rating: { stars: 4.6, numberOfRatings: 2890 },
  },
  {
    id: "toy-161",
    name: "T-Ball Set",
    image: "/product-images/toy-161.png",
    description: "Adjustable batting tee, foam bat, and 5 soft baseballs. Safe indoor/outdoor play. Builds batting skills and hand-eye coordination.",
    marketingCopy: `Batter up! Our T-Ball Set introduces the thrill of baseball to the youngest sluggers with a safe, soft-foam system designed for indoor and outdoor batting practice. The adjustable batting tee extends from 18 to 24 inches to accommodate growing batters, the 24-inch foam bat provides a comfortable, lightweight swing, and five soft foam baseballs deliver the satisfying crack of a solid hit without any risk of injury or property damage.

The tee features a weighted rubber base that stays put on hard floors, grass, and carpet, and the flexible rubber ball holder bends on off-center hits rather than tipping. The foam bat is dense enough for genuine swing feedback yet soft enough for indoor use — it will not dent walls, break windows, or bruise siblings. The foam balls travel 10-20 feet on solid contact, far enough for a sense of accomplishment, contained enough for backyard and living-room practice.

T-ball is the universally recommended introduction to baseball because it eliminates the most frustrating variable for young batters: the pitch. With the ball sitting still on the tee, children can focus entirely on swing mechanics — stance, grip, step, swing, follow-through — building the muscle memory and hand-eye coordination that will serve them when they graduate to coach-pitch and player-pitch leagues. Our set makes daily batting practice as easy as setting up the tee and swinging away. Parents report measurable improvement in their children's contact rate and swing confidence within just a few days of regular practice.`,
    keywords: ["t-ball", "baseball", "batting", "sport", "foam"],
    ageRange: { min: 3, max: 7 },
    price: 19.99,
    inventory: 35,
    category: "sports",
    dimensions: { lengthInches: 24.0, widthInches: 6.0, heightInches: 24.0, weightLbs: 1.5 },
    manufacturer: "ActiveKids Sports",
    bestSellersRank: 21,
    rating: { stars: 4.6, numberOfRatings: 3234 },
  },
  {
    id: "toy-162",
    name: "Kids Boxing Gloves & Punching Bag",
    image: "/product-images/toy-162.png",
    description: "Freestanding inflatable punching bag (48 inches) with a pair of kids boxing gloves. Weighted base pops back up. Builds fitness and coordination.",
    marketingCopy: `Float like a butterfly, sting like a bee — with our Kids Boxing Gloves & Punching Bag set, young fighters can channel their energy into a safe, satisfying, and genuinely athletic activity. The 48-inch inflatable punching bag features a water-fillable base that weighs it down and allows it to rock back and forth when struck, always popping back upright for the next combination. The included kids boxing gloves (fits ages 4-10) feature padded knuckles, wrist support, and easy Velcro closures.

The punching bag is made from thick, puncture-resistant PVC with a colorful target printed on the front for aim training. The rocking-base design provides dynamic resistance that mimics real bag work — the bag absorbs and deflects punches at different angles, challenging young boxers to adjust their aim and timing. The water-filled base holds approximately 4 gallons and provides enough mass to prevent tipping during vigorous striking. Setup takes 5 minutes: inflate the bag, fill the base, and start swinging.

Boxing-based fitness is increasingly popular for children because it provides intense cardiovascular exercise, builds upper body and core strength, develops coordination and reflexes, and offers a healthy outlet for physical energy and emotional expression. The combination of punching bag and gloves creates a complete workout station that children gravitate toward naturally — few prompts from parents are needed to get a child to hit something. Physical therapists recommend punching-bag exercise for bilateral coordination development, and child psychologists endorse it as a constructive method for processing frustration and anger.`,
    keywords: ["boxing", "punching bag", "fitness", "sport", "inflatable"],
    ageRange: { min: 4, max: 10 },
    price: 24.99,
    inventory: 22,
    category: "sports",
    dimensions: { lengthInches: 16.0, widthInches: 16.0, heightInches: 48.0, weightLbs: 2.0 },
    manufacturer: "ActiveKids Sports",
    bestSellersRank: 43,
    rating: { stars: 4.4, numberOfRatings: 1890 },
  },
  {
    id: "toy-163",
    name: "Badminton Set – Family",
    image: "/product-images/toy-163.png",
    description: "Complete badminton set with 4 rackets, 3 shuttlecocks, net with poles, and a carry bag. Sets up in minutes on grass or sand.",
    marketingCopy: `Serve up family fun with our complete Family Badminton Set — everything needed to transform any backyard, beach, or park into a badminton court in under 10 minutes. The set includes four lightweight aluminum rackets with cushioned grips and pre-strung nylon heads, three feather shuttlecocks (the real thing — not plastic), a regulation-height net with adjustable guy ropes and steel ground stakes, and a heavy-duty canvas carry bag that keeps everything organized for transport and storage.

The rackets are available in two sizes within the set: two full-size adult rackets and two scaled-down junior rackets, ensuring comfortable play for every family member. The nylon string beds provide a generous sweet spot for beginners, and the lightweight aluminum frames make extended rallying comfortable without arm fatigue. The net spans 20 feet wide and adjusts from 4 to 5.5 feet in height, accommodating both regulation play and casual family-fun settings.

Badminton is uniquely well-suited for family play because the shuttlecock's air resistance naturally limits speed, creating longer rallies and more satisfying exchanges than faster-paced racket sports. Children as young as five can participate meaningfully, and the cooperative nature of rally play (keeping the shuttlecock airborne as long as possible) builds teamwork before competitive scoring even enters the picture. The sport develops hand-eye coordination, lateral movement, cardiovascular endurance, and the social skills of fair play and good sportsmanship. The complete set eliminates any barrier to play — just pick a flat area, set up the net, and start hitting.`,
    keywords: ["badminton", "racket", "net", "outdoor", "family sport"],
    ageRange: { min: 5, max: 14 },
    price: 34.99,
    inventory: 18,
    category: "sports",
    dimensions: { lengthInches: 26.0, widthInches: 8.0, heightInches: 4.0, weightLbs: 5.0 },
    manufacturer: "ActiveKids Sports",
    bestSellersRank: 47,
    rating: { stars: 4.5, numberOfRatings: 1678 },
  },
  {
    id: "toy-164",
    name: "Roller Skates – Adjustable (4 sizes)",
    image: "/product-images/toy-164.png",
    description: "Quad roller skates that adjust 4 full sizes as kids grow. Light-up wheels, padded boot, and easy lace/buckle closure. Includes wrist guards.",
    marketingCopy: `Roll into fun with our Adjustable Roller Skates — quad skates that grow with your child through four full shoe sizes, eliminating the need to buy new skates every year. The push-button size adjustment slides the boot from front to back in full-size increments, maintaining proper foot positioning and support at every setting. The padded high-top boot provides ankle support for beginners, the triple-closure system (laces plus two buckle straps) ensures a secure, custom fit, and the light-up wheels flash with every rotation in a dazzling multicolor display.

The 54mm polyurethane wheels ride on ABEC-5 bearings that provide smooth, controlled rolling speed — fast enough for the thrill of skating, slow enough for beginning skaters to maintain control. The rubber toe stop provides reliable braking for the "drag your toe" stopping technique that beginners learn first. The included wrist guards protect the most vulnerable body part during the inevitable early falls, and the skates' overall weight (under 3 lbs per skate) keeps legs from tiring during extended skating sessions.

Roller skating develops balance, coordination, leg strength, and cardiovascular fitness while delivering a sense of freedom and speed that few other activities can match. The adjustable sizing makes these skates an exceptional value — covering ages 4-10 or shoe sizes J10-6 depending on the size selected — and the light-up wheels add a "cool factor" that motivates children to practice until they achieve the confidence to skate without holding onto anything. Indoor and outdoor wheel hardnesses are available for different skating surface preferences.`,
    keywords: ["roller skates", "skating", "wheels", "adjustable", "light-up"],
    ageRange: { min: 4, max: 10 },
    price: 44.99,
    inventory: 16,
    category: "sports",
    dimensions: { lengthInches: 12.0, widthInches: 5.0, heightInches: 7.0, weightLbs: 5.0 },
    manufacturer: "GlideRider",
    bestSellersRank: 31,
    rating: { stars: 4.5, numberOfRatings: 2890 },
  },
  {
    id: "toy-165",
    name: "Mini Trampoline – 36 inch",
    image: "/product-images/toy-165.png",
    description: "Indoor mini trampoline with padded handlebar and safety enclosure net. Quiet bungee cords (no springs). Supports up to 100 lbs.",
    marketingCopy: `Bounce, bounce, bounce — without leaving the house! Our 36-inch Mini Trampoline brings the joy of jumping indoors with a quiet, spring-free bungee cord suspension that protects floors, reduces noise, and provides a controlled, joint-friendly bouncing experience. The padded handlebar adjusts to three heights, giving young jumpers a stability aid as they develop their balance, and the mesh safety enclosure net prevents bouncing off the edge during enthusiastic sessions.

The bungee cord suspension (30 industrial-grade cords instead of metal springs) creates a softer, more elastic bounce that absorbs impact more gently than traditional spring trampolines, reducing stress on developing joints and eliminating the pinch hazard that metal springs present. The jumping mat is UV-resistant polypropylene rated for 100,000+ bounce cycles, and the steel frame is powder-coated for scratch and rust resistance. The entire trampoline supports riders up to 100 lbs.

Mini trampoline jumping (also known as rebounding) is recommended by pediatric physical therapists as one of the most effective sensory-motor activities available: the rhythmic bouncing provides vestibular and proprioceptive input that helps children regulate sensory processing, improve coordination, and burn energy constructively. Children with ADHD, sensory processing differences, and excess energy find rebounding particularly beneficial — it is one of the few high-energy activities that can be performed indoors, year-round, without disturbing downstairs neighbors (thanks to the quiet bungee system). Assembly takes 15 minutes with the included tools.`,
    keywords: ["trampoline", "jumping", "indoor", "fitness", "active"],
    ageRange: { min: 3, max: 8 },
    price: 59.99,
    inventory: 14,
    category: "sports",
    dimensions: { lengthInches: 36.0, widthInches: 36.0, heightInches: 34.0, weightLbs: 12.0 },
    manufacturer: "BounceKing",
    bestSellersRank: 33,
    rating: { stars: 4.5, numberOfRatings: 2345 },
  },
  {
    id: "toy-166",
    name: "Yoga Cards for Kids (40 poses)",
    image: "/product-images/toy-166.png",
    description: "40 illustrated yoga pose cards with instructions on one side and a fun story prompt on the other. Includes a partner poses section.",
    marketingCopy: `Stretch, breathe, and tell a story with your body! Our Yoga Cards for Kids present 40 yoga poses through beautiful, kid-friendly illustrations on one side and playful narrative prompts on the other. Each card shows a child demonstrating the pose with clear alignment cues, while the reverse side offers a creative story prompt: "You're a tree growing tall in the forest — can you balance on one foot while your branches reach for the sky?" This narrative approach transforms yoga from exercise into imaginative play, making it irresistible for children who might resist structured physical activity.

The 40 poses span the foundational yoga repertoire: standing poses (tree, warrior, triangle), floor poses (cobra, butterfly, bridge), balance poses (eagle, dancer, airplane), and resting poses (child's pose, savasana). Eight partner-pose cards encourage cooperative stretching and balance challenges with a parent, sibling, or friend. The poses are organized by difficulty level (stars on the back of each card), and a suggested 15-minute "flow sequence" card shows how to link poses together for a complete mini-practice.

Children's yoga research shows consistent benefits for flexibility, balance, body awareness, emotional regulation, and stress management. The card format is superior to video instruction because children practice at their own pace, spend as long as they want in each pose, and develop independence rather than screen dependency. The waterproof, tear-resistant cards withstand outdoor use, and the compact tin case travels easily to parks, beaches, and grandparents' houses. Perfect for bedtime wind-down routines, morning energizers, and anytime emotional regulation support.`,
    keywords: ["yoga", "exercise", "cards", "flexibility", "mindfulness"],
    ageRange: { min: 4, max: 10 },
    price: 12.99,
    inventory: 40,
    category: "sports",
    dimensions: { lengthInches: 5.0, widthInches: 3.5, heightInches: 1.5, weightLbs: 0.3 },
    manufacturer: "BrainBridge Learning",
    bestSellersRank: 36,
    rating: { stars: 4.7, numberOfRatings: 2567 },
  },
  // ── BATH TOYS ──────────────────────────────────────────────────────────
  {
    id: "toy-167",
    name: "Bath Toy Submarine Set (3 pack)",
    image: "/product-images/toy-167.png",
    description: "Three wind-up submarines that dive and resurface in the tub. Each a different color with a spinning propeller. No batteries needed.",
    marketingCopy: `Dive, dive, dive! Our Bath Toy Submarine Set sends three wind-up submersibles on underwater missions across the bathtub, creating endless entertainment during what might otherwise be a reluctant bath. Each submarine is a different color (yellow, red, and blue), features a spinning propeller powered by a simple wind-up mechanism, and performs a charming dive-and-surface cycle: wind the propeller, place the sub in the water, and watch it motor across the tub, dive beneath the surface, and pop back up on the other side.

The wind-up mechanism is entirely sealed and waterproof, with no batteries, no electronics, and nothing to corrode or malfunction from water exposure. The propellers are soft, flexible plastic that won't hurt fingers, and the submarine bodies are rounded with no sharp edges. Each sub is approximately 5 inches long — large enough to grasp easily but small enough to navigate a standard bathtub without feeling cramped. The bright colors are molded throughout the plastic (not painted), so they'll never chip, peel, or fade.

Bath time with engaging toys transforms a daily hygiene routine into an anticipated play session — a shift that parents of bath-resistant toddlers find genuinely life-changing. The submarines introduce basic physics concepts (propulsion, buoyancy, displacement) through pure play, and the wind-up mechanism itself teaches cause-and-effect and fine motor coordination. The three-pack creates opportunities for racing, pattern play, and sharing during sibling baths. The submarines dry quickly when stood on end and resist mildew growth thanks to their sealed, drainage-free construction.`,
    keywords: ["bath", "submarine", "wind-up", "water", "tub"],
    ageRange: { min: 1, max: 5 },
    price: 12.99,
    inventory: 50,
    category: "bath-toys",
    dimensions: { lengthInches: 5.0, widthInches: 2.0, heightInches: 2.5, weightLbs: 0.3 },
    manufacturer: "SplashZone",
    bestSellersRank: 19,
    rating: { stars: 4.6, numberOfRatings: 3456 },
  },
  {
    id: "toy-168",
    name: "Bath Crayons & Paint Set",
    image: "/product-images/toy-168.png",
    description: "12 washable bath crayons and 6 bath paint squeeze tubes. Draw on tub walls and tiles—washes away easily with water.",
    marketingCopy: `Transform your bathroom into an art studio — then wash it all away! Our Bath Crayons & Paint Set includes 12 jumbo bath crayons in vivid colors and 6 squeeze tubes of bath paint, all formulated to draw beautifully on wet tub walls, tile, and glass while washing away completely with water and a quick wipe. The crayons glide smoothly on wet surfaces with rich color payoff, and the paint squeeze tubes allow precise lines, broad strokes, and finger-painting fun.

The crayon barrels are ergonomically chunky for secure grip in wet, soapy hands, and the retractable twist-up format means no wrappers to get soggy and no sharpening needed. The paint tubes have precision tips that allow children to draw fine lines or squeeze out puddles for finger-painting, body-painting, and stamping. All formulas are non-toxic, dermatologist-tested, hypoallergenic, and free from common allergens. They rinse from skin with water alone and clean from tile and tub surfaces with a wet cloth.

Bath art turns a passive hygiene routine into an active creative session, extending willing bath time and reducing the "time to get out" battles that many families experience. Children practice letter formation, draw portraits, create underwater scenes, and cover every available surface with colorful expression — all without any risk to walls, grout, or plumbing. The combination of crayons (for controlled drawing) and paints (for expressive, messy fun) provides two distinct creative modes within a single bath session. A mesh suction-cup holder (included) keeps all supplies organized on the tub wall.`,
    keywords: ["bath", "crayons", "paint", "washable", "creative"],
    ageRange: { min: 2, max: 7 },
    price: 9.99,
    inventory: 55,
    category: "bath-toys",
    dimensions: { lengthInches: 8.0, widthInches: 6.0, heightInches: 2.0, weightLbs: 0.6 },
    manufacturer: "ArtSpark Studios",
    bestSellersRank: 16,
    rating: { stars: 4.5, numberOfRatings: 4567 },
  },
  {
    id: "toy-169",
    name: "Water Wheel Bath Toy",
    image: "/product-images/toy-169.png",
    description: "Suction-cup wall-mount water wheel with spinning gears, funnels, and cups. Pour water through the top and watch it cascade down.",
    marketingCopy: `Pour, spin, cascade, repeat! Our Water Wheel Bath Toy mounts to the tub wall with powerful suction cups and creates a mesmerizing water cascade that children can play with for entire baths. The toy features a top funnel where water is poured in, which then flows through a series of spinning water wheels, rotating gears, and tilting cups before splashing back into the tub below. Each element moves differently — the wheels spin, the gears mesh, the cups fill and tip — creating a kinetic water sculpture that is endlessly fascinating to watch and interact with.

The five interconnected stations attach to any smooth, non-porous surface (tile, fiberglass, glass) with industrial-strength suction cups that hold firmly even with the weight of flowing water. The bright, translucent plastic components allow children to see the water flowing through them, and the modular design lets parents rearrange the stations in different configurations for variety. The toy disassembles into five separate pieces for thorough drying between baths, preventing mildew buildup.

Water play is one of the most valuable sensory-motor activities for young children: pouring develops bilateral coordination and volume estimation, watching water flow teaches cause-and-effect and gravity concepts, and the spinning/gear elements introduce mechanical engineering principles. Our water wheel toy channels these developmental benefits into an engaging, bath-specific format that transforms hygiene time into science time. The suction cups release cleanly from surfaces with a simple tab pull, and the toy stores compactly when disassembled.`,
    keywords: ["water wheel", "bath", "suction cup", "gears", "pouring"],
    ageRange: { min: 1, max: 4 },
    price: 14.99,
    inventory: 42,
    category: "bath-toys",
    dimensions: { lengthInches: 10.0, widthInches: 4.0, heightInches: 14.0, weightLbs: 0.5 },
    manufacturer: "SplashZone",
    bestSellersRank: 25,
    rating: { stars: 4.6, numberOfRatings: 2890 },
  },
  {
    id: "toy-170",
    name: "Fishing Game – Bath Edition",
    image: "/product-images/toy-170.png",
    description: "Magnetic fishing game for the bathtub. 10 floating fish and 2 magnetic fishing rods. Fish float upright and are easy to catch.",
    marketingCopy: `Gone fishin' — in the bathtub! Our Bath Edition Fishing Game turns every bath into a fishing expedition with 10 colorful floating fish and 2 magnetic fishing rods. Each fish features a hidden magnet in its mouth area, and the fishing rods have magnetic hooks on short, flexible lines. Dangle the rod over a fish, feel the satisfying click of magnetic contact, and lift your catch from the water. The fish are weighted to float upright with their mouths pointing up, making them easy targets for developing anglers.

The 10 fish are molded in 5 bright colors (2 of each) and numbered 1-10, enabling counting games, color-sorting games, and competitive "who catches the most" tournaments. The two fishing rods allow side-by-side fishing for siblings, parent-child bonding, or head-to-head competition. The rod handles are chunky and textured for secure grip in wet hands, and the fishing lines are 8 inches long — enough for authentic casting-and-reeling motion while preventing tangling.

Fishing-game play develops hand-eye coordination, patience, fine motor precision, and the ability to control movement in a focused, goal-directed way. The magnetic mechanism provides clear feedback (you either caught the fish or you didn't), creating a natural incentive to refine technique through repetition. Parents report that the fishing game is the single most effective tool for extending willing bath time, with children happily fishing for 20-30 minutes before asking to get out. The fish and rods dry quickly in the included mesh drainage bag that suction-cups to the tub wall.`,
    keywords: ["fishing", "bath", "magnetic", "water", "game"],
    ageRange: { min: 2, max: 6 },
    price: 11.99,
    inventory: 45,
    category: "bath-toys",
    dimensions: { lengthInches: 8.0, widthInches: 6.0, heightInches: 3.0, weightLbs: 0.4 },
    manufacturer: "SplashZone",
    bestSellersRank: 22,
    rating: { stars: 4.5, numberOfRatings: 3234 },
  },
  {
    id: "toy-171",
    name: "Foam Letters & Numbers – Bath (36 pieces)",
    image: "/product-images/toy-171.png",
    description: "36 colorful EVA foam letters and numbers that stick to wet tub walls. Practice ABCs and 123s during bath time. Quick-dry design.",
    marketingCopy: `ABCs in the tub! Our Foam Letters & Numbers set includes 26 uppercase alphabet letters and 10 numerals (0-9), each one cut from thick, colorful EVA foam that sticks to wet tub walls, tile, and glass through surface tension alone — no adhesive, no suction cups, just the natural physics of wet foam on smooth surfaces. Children press the letters onto the wall to spell words, practice alphabet order, form their name, and create simple math equations, turning bath time into the most fun literacy lesson of the day.

The letters and numbers are approximately 3 inches tall, brightly colored in 6 primary and secondary colors, and thick enough (0.5 inch) to float in bath water as well as stick to walls. The EVA foam is closed-cell, meaning it doesn't absorb water, dries quickly when removed from the tub, and resists mildew growth that plagues thinner, open-cell foam bath toys. The quick-dry design means no soggy letters lurking in the bottom of the toy basket between baths.

Educational researchers emphasize the importance of environmental print exposure — encountering letters and numbers in everyday contexts — for building pre-literacy and pre-numeracy skills. Bath letters provide daily, multi-sensory letter interaction: children see the letter shapes, feel them in their hands, hear the letter names spoken by a caregiver, and physically manipulate them into words and sequences. The tactile, playful context makes this learning feel like pure fun rather than instruction. The complete set stores in the included mesh bag that suction-cups to the wall for air-drying between baths.`,
    keywords: ["foam", "letters", "numbers", "bath", "learning"],
    ageRange: { min: 2, max: 5 },
    price: 7.99,
    inventory: 60,
    category: "bath-toys",
    dimensions: { lengthInches: 8.0, widthInches: 6.0, heightInches: 2.0, weightLbs: 0.3 },
    manufacturer: "BrainBridge Learning",
    bestSellersRank: 10,
    rating: { stars: 4.7, numberOfRatings: 5678 },
  },
  // ── COLLECTIBLES ───────────────────────────────────────────────────────
  {
    id: "toy-172",
    name: "Blind Bag Mini Figures – Series 5 (single)",
    image: "/product-images/toy-172.png",
    description: "Surprise mini collectible figure in a sealed bag. 24 different characters to collect in Series 5. Trade with friends to complete the set.",
    marketingCopy: `What's inside? The thrill of the unknown drives our Blind Bag Mini Figures — sealed, opaque bags each containing one of 24 uniquely designed collectible figurines from Series 5. Tear open the bag to discover which character you've received: will it be the ultra-rare holographic Cosmic Cat, the fan-favorite Pixel Pirate, or one of 22 other charmingly designed characters? Each figure stands approximately 2 inches tall, is made from solid PVC, and features surprisingly detailed paint applications for its compact size.

The collectible roster includes common figures (12 characters), uncommon figures (8 characters), rare figures (3 characters), and one ultra-rare figure with a special metallic or holographic finish. The rarity system creates a natural trading economy among friends: children swap duplicates, negotiate for specific characters, and experience the genuine excitement of completing a full collection. A collector's checklist card is included in every bag, tracking progress toward the complete set of 24.

Collecting is a developmentally significant activity that teaches categorization, organizational skills, goal-setting, social negotiation (trading), and the delayed gratification of building toward a complete set over time. The blind-bag format adds an element of probability and surprise that children find almost addictively exciting. At $4.99 per bag, this is an accessible collectible that fits allowance budgets and makes an ideal small gift, party favor, or reward. Series 1-4 figures are also available, and all series share a consistent scale for unified display and play.`,
    keywords: ["blind bag", "collectible", "surprise", "mini figure", "trading"],
    ageRange: { min: 5, max: 12 },
    price: 4.99,
    inventory: 100,
    category: "collectibles",
    dimensions: { lengthInches: 3.0, widthInches: 2.0, heightInches: 3.0, weightLbs: 0.1 },
    manufacturer: "ToyVault",
    bestSellersRank: 7,
    rating: { stars: 4.3, numberOfRatings: 8901 },
  },
  {
    id: "toy-173",
    name: "Trading Card Starter Pack – Mythic Battles",
    image: "/product-images/toy-173.png",
    description: "60-card starter deck for the Mythic Battles trading card game. Includes a rule book, playmat, and 2 rare holographic cards.",
    marketingCopy: `Enter the arena of legendary combat with our Mythic Battles Trading Card Starter Pack — a complete, ready-to-play 60-card deck that introduces players to the strategic depth and collectible excitement of the trading card game phenomenon. The deck features warriors, wizards, beasts, and spells drawn from mythologies worldwide — Greek heroes, Norse gods, Japanese yokai, Egyptian pharaohs, and Celtic druids — each one illustrated in stunning full-color artwork that brings legendary battles to vivid life.

The starter pack includes everything needed to begin playing immediately: a 60-card themed deck (including 2 rare holographic cards with prismatic foil finish), a full-color rulebook with illustrated tutorials, a foldable neoprene playmat with labeled zones, and a quick-reference card for turn sequence and keywords. The rules system uses a resource-management mechanic (spend energy to summon creatures and cast spells) combined with combat resolution (compare attack and defense values) that is approachable for new players yet deep enough for experienced TCG veterans.

Trading card games develop strategic thinking, resource management, probability assessment, reading comprehension, and social skills (deck-building discussions, trading negotiations, tournament sportsmanship) in a format that children find intrinsically motivating. The collectible aspect — opening booster packs (sold separately) to discover rare cards, building themed decks, and trading with friends — creates a self-sustaining engagement loop that drives continued interest for months and years. This starter pack is the gateway to that world, providing a competitive, playable deck from the very first game.`,
    keywords: ["trading cards", "TCG", "mythic", "collectible", "starter"],
    ageRange: { min: 7, max: 14 },
    price: 14.99,
    inventory: 40,
    category: "collectibles",
    dimensions: { lengthInches: 6.0, widthInches: 4.0, heightInches: 2.0, weightLbs: 0.4 },
    manufacturer: "CardForge Games",
    bestSellersRank: 29,
    rating: { stars: 4.5, numberOfRatings: 2345 },
  },
  {
    id: "toy-174",
    name: "Geode Cracking Kit (12 geodes)",
    image: "/product-images/toy-174.png",
    description: "Crack open 12 real geodes to reveal sparkling crystals inside. Includes safety goggles, display stands, and a mineral identification guide.",
    marketingCopy: `What treasures hide inside a plain grey rock? Crack one open and find out! Our Geode Cracking Kit provides 12 genuine volcanic geodes from Chihuahua, Mexico — each one an unassuming, golf-ball-sized stone that conceals a spectacular crystal cavity within. Using the included safety goggles and mesh cracking bag (place the geode inside, tap firmly with a hammer — not included — through the mesh), children experience the unforgettable thrill of splitting open a rock to discover sparkling quartz crystals, amethyst bands, or calcite formations that have been growing in darkness for millions of years.

Each geode is unique — some reveal clear quartz points, others contain purple amethyst crystals, and some surprise with banded agate, celestite, or calcite formations. The included 24-page mineral identification guide helps children identify their specific crystal types using properties like color, luster, hardness, and crystal structure. Six clear acrylic display stands are included for showcasing the most spectacular specimens on a desk, shelf, or science-fair display table.

Geode cracking is the ultimate hands-on geology experience: it combines the excitement of a surprise reveal with genuine scientific learning about mineralogy, volcanic processes, and crystal formation. Children learn that the ordinary-looking exterior conceals extraordinary beauty — a metaphor that extends well beyond geology. The kit makes an outstanding science-fair project, birthday-party activity (each guest cracks and keeps their own geode), or standalone gift for any child fascinated by rocks, minerals, and the hidden wonders of the Earth.`,
    keywords: ["geode", "crystal", "rock", "cracking", "mineral", "science"],
    ageRange: { min: 6, max: 14 },
    price: 24.99,
    inventory: 25,
    category: "collectibles",
    dimensions: { lengthInches: 10.0, widthInches: 8.0, heightInches: 4.0, weightLbs: 4.0 },
    manufacturer: "LabGenius",
    bestSellersRank: 39,
    rating: { stars: 4.7, numberOfRatings: 2678 },
  },
  {
    id: "toy-175",
    name: "Stamp Collection Starter Kit",
    image: "/product-images/toy-175.png",
    description: "Beginner stamp collecting kit with 200 world stamps, album, magnifying glass, tongs, and a stamp identifier guidebook.",
    marketingCopy: `Welcome to the world's most civilized hobby — stamp collecting. Our Starter Kit provides everything a new philatelist needs to begin a collection that can last a lifetime: 200 genuine cancelled postage stamps from over 50 countries, a 32-page stamp album with protective mounts, a 3x magnifying glass for examining fine print details, stamp tongs for handling specimens without fingerprint damage, adhesive-free hinges for mounting, and a 48-page stamp identifier guidebook covering stamp anatomy, grading, and the basics of philatelic valuation.

The 200 stamps span a dazzling range of subjects — animals, space, sports, historical figures, flags, flowers, art, and transportation — from countries across every continent. Each stamp tells a story about the culture, history, or natural environment of its country of origin, making a stamp collection a miniature encyclopedia of the world. The album pages are organized by region, with pre-printed country headers and space for additional stamps as the collection grows. The magnifying glass reveals watermarks, perforation patterns, and printing techniques invisible to the naked eye.

Stamp collecting has been called "the hobby of kings and the king of hobbies," and with good reason: it develops research skills, organizational thinking, geographic knowledge, historical awareness, and the patience required for careful, methodical curation. In an era of instant digital gratification, stamp collecting provides a contemplative, analog alternative that rewards sustained effort with tangible, beautiful results. The starter kit is priced to be accessible as a gift or allowance purchase, and the hobby naturally expands through stamp shows, online trading, and correspondence with collectors worldwide.`,
    keywords: ["stamps", "collecting", "world", "album", "hobby"],
    ageRange: { min: 7, max: 14 },
    price: 19.99,
    inventory: 20,
    category: "collectibles",
    dimensions: { lengthInches: 10.0, widthInches: 8.0, heightInches: 2.0, weightLbs: 0.8 },
    manufacturer: "Heritage Playthings",
    bestSellersRank: 74,
    rating: { stars: 4.4, numberOfRatings: 987 },
  },
  {
    id: "toy-176",
    name: "Hatching Egg Surprise – Unicorn",
    image: "/product-images/toy-176.png",
    description: "Place the egg in water and watch a unicorn slowly hatch over 24-48 hours. Grows up to 6 times its size. Each egg is a surprise color.",
    marketingCopy: `Magic is hatching! Place our Unicorn Egg in a bowl of water and watch in wonder as a crack slowly appears, widens, and reveals a tiny unicorn that grows to six times its original size over the next 24-48 hours. The hatching process is mesmerizing: the shell absorbs water and expands unevenly, creating realistic-looking cracks that spread organically across the surface until the shell falls away and the unicorn emerges, continuing to grow in the water for up to two days.

Each egg is a surprise — the unicorn inside can be any of six colors (pink, purple, blue, green, gold, or white), and the mystery adds collectible excitement to the scientific wonder of the growing process. The unicorn is made from EVA foam that expands when submerged in water through osmotic absorption, a genuinely fascinating physical process that parents can explain using concepts of polymer chemistry and diffusion. When removed from water and allowed to dry, the unicorn slowly shrinks back to its original size over several days, making the experiment repeatable.

Hatching eggs occupy a unique niche in the toy world: they combine the patience of delayed gratification (waiting 24-48 hours for full growth), the excitement of surprise (which color will emerge?), and the wonder of observable scientific phenomena (material expansion, shell cracking) into a package that costs less than a fancy coffee. Children check on their hatching egg repeatedly, measuring growth and recording observations — informal scientific practice that builds curiosity and attention to change over time. The eggs make wonderful party favors, stocking stuffers, and small rewards.`,
    keywords: ["hatching", "egg", "unicorn", "surprise", "growing"],
    ageRange: { min: 3, max: 8 },
    price: 6.99,
    inventory: 70,
    category: "collectibles",
    dimensions: { lengthInches: 2.5, widthInches: 2.0, heightInches: 3.0, weightLbs: 0.2 },
    manufacturer: "Sparkle Kingdom",
    bestSellersRank: 12,
    rating: { stars: 4.3, numberOfRatings: 5678 },
  },
  // ─── Travel & Portable ───────────────────────────────────────
  {
    id: "toy-177",
    name: "Magnetic Travel Tangram",
    image: "/product-images/toy-177.png",
    description: "Classic tangram puzzle with magnetic pieces that stay put in the car. Includes 100 challenge cards from easy to expert. Compact folding case fits in a seat-back pocket.",
    marketingCopy: `Road trips just got smarter. Our Magnetic Travel Tangram packs the ancient Chinese puzzle into a compact folding case that fits neatly into a seat-back pocket, purse, or carry-on bag. The seven magnetic tans cling firmly to the steel-backed play surface, so turbulence, potholes, and sudden stops won't scatter your masterpiece across the back seat. Each piece is precision-cut from thick EVA foam with embedded magnets — they're satisfying to handle, silent to place, and impossible to lose inside the case.

The included 100-card challenge deck progresses from simple shapes (a house, a cat) through intermediate figures (a running person, a sailboat) to fiendishly abstract outlines that stump even adults. Solutions are printed on the reverse of each card, so players can check their work independently. The tangram isn't just an idle pastime — it's a legitimate spatial reasoning trainer used by math educators worldwide. Research published in the Journal of Educational Psychology found that regular tangram practice improves mental rotation ability, geometric understanding, and creative problem-solving in children ages 5-12.

We designed this set specifically for travel durability. The case has a magnetic clasp (no zippers to break), rounded corners (no poking siblings), and a wipeable surface (because snack hands are inevitable). The challenge cards are laminated for longevity and sized to store inside the case. Whether you're killing time at a restaurant, surviving a long flight, or just need ten minutes of quiet focus, the Magnetic Travel Tangram delivers engaging, screen-free entertainment that genuinely exercises the brain.`,
    keywords: ["travel", "tangram", "magnetic", "puzzle", "portable"],
    ageRange: { min: 5, max: 99 },
    price: 14.99,
    inventory: 45,
    category: "travel",
    dimensions: { lengthInches: 6.0, widthInches: 6.0, heightInches: 0.75, weightLbs: 0.4 },
    manufacturer: "RoadScholar Games",
    bestSellersRank: 78,
    rating: { stars: 4.7, numberOfRatings: 2345 },
  },
  {
    id: "toy-178",
    name: "Wikki Stix Travel Pack",
    image: "/product-images/toy-178.png",
    description: "48 wax-coated yarn sticks in assorted colors. Bend, shape, and stick to surfaces without glue or mess. Perfect for restaurants and waiting rooms.",
    marketingCopy: `The ultimate waiting room weapon. Wikki Stix are deceptively simple — wax-coated yarn that bends, shapes, and sticks to any smooth surface without glue, tape, or mess — but their open-ended creativity keeps children engaged far longer than any structured activity. This travel pack includes 48 sticks in 12 vibrant colors, plus a fold-out activity guide with ideas ranging from simple letter formation for preschoolers to complex 3D sculptures for older kids.

What makes Wikki Stix magical is their tactile feedback. The wax coating provides just enough resistance to hold a shape permanently once bent, but the yarn core allows unlimited repositioning. Children can create flat artwork on a table, stick designs to windows (they peel off cleanly with zero residue), build standing 3D figures by wrapping sticks around each other, or use them as fidgets during anxious moments. Occupational therapists recommend Wikki Stix for fine motor development, and special education teachers use them for tactile letter and number learning.

This travel pack is intentionally compact — it slides into the same pocket as a phone and weighs almost nothing. The resealable pouch keeps sticks organized and prevents the dreaded "loose Wikki Stix stuck to the inside of the diaper bag" scenario that veteran parents know too well. Each stick is about 6 inches long, non-toxic, and made in the USA from food-grade paraffin wax and knitting yarn. They're not glamorous, they're not electronic, and they don't light up — they're just reliably, quietly, endlessly entertaining.`,
    keywords: ["wikki stix", "travel", "wax", "creative", "portable", "mess-free"],
    ageRange: { min: 3, max: 10 },
    price: 5.99,
    inventory: 80,
    category: "travel",
    dimensions: { lengthInches: 7.0, widthInches: 3.5, heightInches: 0.5, weightLbs: 0.15 },
    manufacturer: "Omnicor Inc",
    bestSellersRank: 34,
    rating: { stars: 4.5, numberOfRatings: 8901 },
  },
  {
    id: "toy-179",
    name: "Water Wow! Activity Pad – Safari",
    image: "/product-images/toy-179.png",
    description: "Paint with water to reveal hidden colors and patterns. Pages dry white and can be reused endlessly. Refillable pen included. Zero mess guaranteed.",
    marketingCopy: `Paint without the paint. Our Safari Water Wow pad lets children create vivid, full-color artwork using nothing but water — no paint cups to spill, no brushes to wash, no stained car seats to explain. The chunky refillable water pen is sized for small hands, and each of the four reusable pages transforms from a simple black-and-white outline into a richly colored safari scene as water is applied. Hidden details appear as the page gets wet: a chameleon camouflaged in leaves, a bird tucked behind a branch, a mouse hiding under a rock.

The reveal mechanic is genuinely satisfying for young children. The white coating is semi-transparent when dry, obscuring the printed colors beneath. As water saturates the coating, it becomes fully transparent, revealing the artwork in vivid detail. The effect is immediate and dramatic — a single stroke of the pen produces a bright swath of color that seems to appear from nowhere. As the page dries (usually within 10-15 minutes depending on humidity), the white coating returns and the colors disappear, resetting the page for another round.

We've tested these pads on cross-country flights, three-hour car trips, and the dreaded post-dinner wait at restaurants. They work every single time. The zero-mess guarantee is real: water is the only material involved, the pen doesn't leak when capped, and the pad fits in a standard airplane tray table. The safari theme includes savanna, jungle, watering hole, and nighttime scenes, each packed with 10+ hidden animals to discover. It's screen-free entertainment that requires zero parental supervision, zero cleanup, and zero batteries.`,
    keywords: ["water wow", "mess-free", "travel", "paint", "reusable", "safari"],
    ageRange: { min: 3, max: 6 },
    price: 6.99,
    inventory: 65,
    category: "travel",
    dimensions: { lengthInches: 10.0, widthInches: 6.0, heightInches: 0.25, weightLbs: 0.2 },
    manufacturer: "Melissa & Drew",
    bestSellersRank: 22,
    rating: { stars: 4.6, numberOfRatings: 12456 },
  },
  {
    id: "toy-180",
    name: "Pocket Etch – Mini Drawing Screen",
    image: "/product-images/toy-180.png",
    description: "Palm-sized mechanical drawing toy with two knobs. No batteries, no screen glare, no app required. Shake to erase and start over.",
    marketingCopy: `Small screen, big creativity. The Pocket Etch shrinks the classic mechanical drawing experience to a palm-sized format that fits in a coat pocket, clips to a backpack, or tucks into the seat-back pocket of an airplane. Two precision knobs control a stylus that scrapes aluminum powder off the inside of the screen, leaving dark lines on a light gray background. It's the same satisfying, tactile drawing mechanism that has captivated children since 1960 — no batteries, no software updates, no in-app purchases.

The miniature format actually makes certain drawings easier than the full-sized version. The shorter stylus travel means less hand fatigue, and the compact screen encourages detailed, focused compositions rather than sprawling abstractions. The knobs have been redesigned for small hands with textured grips and smooth ball-bearing action. A firm shake clears the screen instantly, and the sealed aluminum powder never runs out, leaks, or needs replacement. We've dropped ours off tables, stepped on it, and left it in a hot car — it still works perfectly.

In a world of glowing rectangles, there's something deeply refreshing about a drawing toy that works on pure mechanics. No charging cable, no WiFi needed, no notifications interrupting the creative flow. The Pocket Etch is the fidget spinner for the creative mind — a tactile, meditative experience that produces visible results and requires nothing but two hands and imagination. It comes with a snap-on cover that protects the screen and doubles as a stand for displaying finished artwork.`,
    keywords: ["etch", "drawing", "mechanical", "travel", "screen-free", "portable"],
    ageRange: { min: 4, max: 99 },
    price: 9.99,
    inventory: 50,
    category: "travel",
    dimensions: { lengthInches: 4.0, widthInches: 3.5, heightInches: 0.75, weightLbs: 0.2 },
    manufacturer: "SpinMaster Classics",
    bestSellersRank: 89,
    rating: { stars: 4.2, numberOfRatings: 3456 },
  },
  {
    id: "toy-181",
    name: "Magnetic Dress-Up Dolls – World Travelers",
    image: "/product-images/toy-181.png",
    description: "Two wooden dolls with 40+ magnetic clothing and accessory pieces representing outfits from 10 countries. Tin storage case doubles as play scene.",
    marketingCopy: `Dress for any destination. Our World Travelers magnetic dress-up set includes two sturdy wooden dolls and over 40 magnetic clothing and accessory pieces representing traditional and modern outfits from ten countries: Japan, India, Mexico, Nigeria, Scotland, Brazil, South Korea, Peru, Sweden, and Egypt. Each outfit is culturally researched and beautifully illustrated, with details like the precise draping of a Nigerian gele headwrap and the specific pleat pattern of a Scottish kilt.

The magnets are industrial-strength neodymium embedded directly in the wooden pieces, so outfits snap on with a satisfying click and stay firmly attached during play, travel, and the inevitable upside-down shaking that children inflict on dress-up dolls. The tin storage case features a world map interior that doubles as a play scene — children can "travel" their dolls to different countries and dress them in appropriate attire. The lid latches securely, keeping all 40+ pieces contained during transit.

Beyond the fun of mix-and-match dress-up, this set opens conversations about world cultures, geography, and the diversity of human expression through clothing. The included guide card provides a paragraph about each country's featured outfits, explaining cultural significance and when the clothing is traditionally worn. Children naturally begin asking questions — Why do people in Scotland wear kilts? What does the pattern on a Peruvian chullo mean? — turning dress-up play into genuine cultural curiosity. The set represents a meaningful step beyond generic "fashion doll" play by celebrating real-world diversity.`,
    keywords: ["magnetic", "dress-up", "travel", "cultural", "wooden", "dolls"],
    ageRange: { min: 3, max: 8 },
    price: 24.99,
    inventory: 30,
    category: "travel",
    dimensions: { lengthInches: 8.0, widthInches: 6.0, heightInches: 1.5, weightLbs: 0.8 },
    manufacturer: "GlobalPlay Co",
    bestSellersRank: 112,
    rating: { stars: 4.8, numberOfRatings: 1890 },
  },
  {
    id: "toy-182",
    name: "Airplane Activity Kit",
    image: "/product-images/toy-182.png",
    description: "Complete in-flight entertainment bundle: sticker book, mini colored pencils, fold-up puzzle, window clings, and snack-time trivia cards. TSA-friendly packaging.",
    marketingCopy: `Boarding pass to boredom-free flying. Our Airplane Activity Kit was designed by parents who've survived long-haul flights with young children, and it shows. The TSA-friendly clear pouch contains five distinct activities — a 20-page reusable sticker scene book, a set of 12 mini colored pencils with sharpener, a 48-piece fold-up jigsaw puzzle, a sheet of 30 repositionable window clings, and a deck of 40 snack-time trivia cards — each chosen for silent operation, zero mess, and independent play potential.

The sticker book uses repositionable stickers across airport, airplane, cloud, and destination scenes. The window clings stick to the airplane window without adhesive, letting children create their own sky scene that fellow passengers actually enjoy seeing. The colored pencils are half-length (TSA-compliant, no sharpening-in-the-seat-back drama) with a built-in sharpener in the cap of the case. The puzzle has an attached backing board so pieces don't end up under row 23. And the trivia cards cover age-appropriate topics (animals, geography, silly facts) to fill the snack-and-drink-cart window.

We field-tested this kit on 47 actual flights before finalizing the contents. We removed anything that rolled (bouncy balls — terrible idea at 30,000 feet), anything with small pieces that drop between seats (beads — the under-seat scavenger hunt nobody wants), and anything that makes noise (sorry, kazoo). What remains is the optimized, flight-proven collection of activities that reliably delivers 2-3 hours of engaged, quiet, independent entertainment. The clear pouch fits in the seat-back pocket and passes through security without unpacking.`,
    keywords: ["airplane", "travel", "activity kit", "flight", "stickers", "TSA"],
    ageRange: { min: 3, max: 8 },
    price: 18.99,
    inventory: 40,
    category: "travel",
    dimensions: { lengthInches: 10.0, widthInches: 7.0, heightInches: 1.0, weightLbs: 0.5 },
    manufacturer: "RoadScholar Games",
    bestSellersRank: 56,
    rating: { stars: 4.4, numberOfRatings: 4567 },
  },
  // ─── Construction Vehicles ───────────────────────────────────
  {
    id: "toy-183",
    name: "Giant Dump Truck – Sandbox Edition",
    image: "/product-images/toy-183.png",
    description: "24-inch dump truck with working tilting bed, oversized wheels for sand and dirt, and a reinforced steel axle. Holds up to 10 lbs of sand.",
    marketingCopy: `Built for the job site — the sandbox job site. Our Giant Dump Truck measures a full 24 inches from bumper to tailgate and features a working tilting bed with a locking mechanism that children operate with a simple lever. The bed tilts to a full 45 degrees, dumping its payload of sand, gravel, dirt, or whatever cargo the foreman (your child) has specified. The locking mechanism clicks satisfyingly into three positions: flat, angled, and full dump.

The oversized wheels are the secret to this truck's terrain capability. Each 5-inch diameter wheel features deep treads molded from flexible TPE rubber that grip sand, mud, gravel, and grass without getting stuck. The reinforced steel axle (not plastic — steel) handles the stress of heavy loads without bending, and the wheel bearings are sealed against sand infiltration. We tested this truck with 10 pounds of wet sand repeatedly, and the axle showed zero deformation after 500 dump cycles.

This is the dump truck that survives outdoor childhood. The body is molded from UV-stabilized, BPA-free polyethylene that won't fade, crack, or become brittle after seasons of sun exposure. The bed pivot is a through-bolt design (not a snap-in plastic pin) that parents can tighten if it ever loosens. The cab has an open design so children can place action figures in the driver's seat, and the proportions are accurate to real CAT dump trucks — a detail that construction-obsessed children absolutely notice and appreciate.`,
    keywords: ["dump truck", "construction", "sandbox", "outdoor", "vehicle"],
    ageRange: { min: 2, max: 7 },
    price: 34.99,
    inventory: 25,
    category: "construction vehicles",
    dimensions: { lengthInches: 24.0, widthInches: 11.0, heightInches: 13.0, weightLbs: 3.5 },
    manufacturer: "ToughTruck Toys",
    bestSellersRank: 67,
    rating: { stars: 4.6, numberOfRatings: 3890 },
  },
  {
    id: "toy-184",
    name: "Excavator with Working Hydraulics",
    image: "/product-images/toy-184.png",
    description: "Realistic excavator with three hydraulic-style levers controlling boom, stick, and bucket independently. Metal reinforced joints. 360-degree cab rotation.",
    marketingCopy: `Three levers. Infinite digging possibilities. Our Excavator features a genuinely functional three-lever hydraulic system that gives children independent control over the boom (up/down), stick (in/out), and bucket (scoop/dump). Unlike simplified toy excavators with a single lever or push-down mechanism, ours replicates the actual control scheme used by real excavator operators: left lever controls the boom and cab rotation, right lever controls the stick and bucket. The result is precise, realistic digging motion that feels like operating the real thing.

The 360-degree cab rotation rides on a steel ball-bearing turntable that spins smoothly under load — children can scoop a full bucket of sand, rotate the cab 180 degrees, and dump without the mechanism binding or jamming. The joints where the boom meets the cab, where the stick meets the boom, and where the bucket meets the stick are all reinforced with metal pins and bushings, not the plastic snap-fits that fail after a month of sandbox duty. The bucket teeth are individually molded and surprisingly effective at breaking up packed dirt.

We designed this excavator for the child who corrects adults on the difference between a backhoe and an excavator (and yes, they exist, and they're our primary customer). The proportions match a Caterpillar 320 excavator at roughly 1:16 scale, the cab has a detailed interior with a molded operator seat, and the tracks are articulated rubber that actually grip and propel on hard surfaces when pushed. The hydraulic levers have genuine resistance and spring return, providing tactile feedback that makes operation feel substantial rather than flimsy.`,
    keywords: ["excavator", "construction", "hydraulic", "digging", "sandbox"],
    ageRange: { min: 3, max: 8 },
    price: 39.99,
    inventory: 20,
    category: "construction vehicles",
    dimensions: { lengthInches: 18.0, widthInches: 7.0, heightInches: 12.0, weightLbs: 2.8 },
    manufacturer: "ToughTruck Toys",
    bestSellersRank: 83,
    rating: { stars: 4.7, numberOfRatings: 2678 },
  },
  // ─── Additional Science Kits ─────────────────────────────────
  {
    id: "toy-185",
    name: "Kitchen Chemistry Lab",
    image: "/product-images/toy-185.png",
    description: "30 safe experiments using common household ingredients. Includes lab notebook, safety goggles, test tubes, and measuring tools. No dangerous chemicals needed.",
    marketingCopy: `Your kitchen is already a laboratory — we just provide the curriculum. Kitchen Chemistry Lab contains 30 experiments that use ingredients already in your pantry: baking soda, vinegar, food coloring, dish soap, milk, cornstarch, and other common household items. The kit provides the laboratory equipment — real borosilicate glass test tubes, a graduated cylinder, a thermometer, pH strips, safety goggles, and a detailed lab notebook — while your kitchen supplies the reagents. No dangerous chemicals, no special disposal requirements, no worried glances from the other parent.

Each experiment follows proper scientific methodology: hypothesis, procedure, observation, and conclusion. The lab notebook has pre-formatted pages for each experiment with fill-in-the-blank hypothesis statements, step-by-step procedures with illustrations, space for recording observations, and guided conclusion questions. Experiments range from classic baking-soda-and-vinegar volcanos (we had to include it — it's a rite of passage) through density columns, crystal growing, pH indicator extraction from red cabbage, and milk-and-food-coloring surface tension demonstrations.

The genius of kitchen chemistry is accessibility and repeatability. Unlike kits with proprietary chemicals that run out after one use, these experiments can be repeated infinitely with a trip to the grocery store. Children can modify variables (more vinegar? hotter water? different food coloring?) and observe how outcomes change — real experimental design without the cost of restocking specialty chemicals. The kit bridges the gap between "YouTube science video" and "actual laboratory experience," giving children the tools and methodology to do real science in a safe, supervised environment.`,
    keywords: ["chemistry", "science", "kitchen", "experiments", "lab", "STEM"],
    ageRange: { min: 6, max: 12 },
    price: 29.99,
    inventory: 30,
    category: "science kits",
    dimensions: { lengthInches: 12.0, widthInches: 9.0, heightInches: 4.0, weightLbs: 1.5 },
    manufacturer: "LabGenius",
    bestSellersRank: 91,
    rating: { stars: 4.5, numberOfRatings: 3456 },
  },
  {
    id: "toy-186",
    name: "Solar System Model Kit – Motorized",
    image: "/product-images/toy-186.png",
    description: "Build a motorized orrery showing all 8 planets orbiting the sun. Planets rotate at proportionally scaled speeds. Glow-in-the-dark paint included.",
    marketingCopy: `Watch the solar system come alive on your desk. This motorized orrery kit lets children build a working mechanical model of our solar system, with all eight planets orbiting a central LED sun at proportionally scaled speeds. Mercury whips around its orbit while Neptune crawls — the speed ratios are accurate to real orbital periods, making the relative pace of inner vs. outer planets viscerally obvious in a way that no textbook diagram can achieve.

The build process itself is educational. The kit includes over 80 precision-cut plastic gears, structural pieces, and planet spheres that assemble using illustrated step-by-step instructions. Children learn about gear ratios (Mercury's gear train runs much faster than Neptune's), mechanical advantage, and the engineering challenge of translating a single motor's rotation into eight different speeds simultaneously. The motor is powered by 2 AA batteries (included) and runs whisper-quiet thanks to nylon gear teeth that mesh smoothly without the grinding noise of cheaper orreries.

Each planet sphere is pre-printed with accurate surface details — Jupiter's Great Red Spot, Saturn's ring system, Earth's continents and oceans, Mars's polar ice caps — and the kit includes glow-in-the-dark paint for a spectacular nighttime display. The central sun is an LED that can be set to steady glow or slow pulse. When assembled, the orrery stands about 14 inches tall and makes a genuinely impressive desk or shelf display. It's the kind of project that children show off to every visitor for weeks after building it, proudly explaining orbital mechanics to anyone who'll listen.`,
    keywords: ["solar system", "orrery", "planets", "motorized", "space", "STEM"],
    ageRange: { min: 8, max: 14 },
    price: 44.99,
    inventory: 20,
    category: "science kits",
    dimensions: { lengthInches: 14.0, widthInches: 14.0, heightInches: 14.0, weightLbs: 2.0 },
    manufacturer: "LabGenius",
    bestSellersRank: 104,
    rating: { stars: 4.6, numberOfRatings: 2123 },
  },
  {
    id: "toy-187",
    name: "Bug Vacuum & Observation Kit",
    image: "/product-images/toy-187.png",
    description: "Gentle bug vacuum safely captures insects for observation. Includes magnifying habitat, field guide to 100 common insects, and tweezers. Catch and release design.",
    marketingCopy: `Catch bugs without touching bugs. Our Bug Vacuum uses gentle suction (powered by 2 AA batteries) to safely capture insects into a clear observation chamber without harming them — and without requiring children to touch anything that crawls, flies, or wriggles. The vacuum tip is designed with a fine mesh screen that contains insects while allowing airflow, so captured bugs have plenty of oxygen during observation. A one-way valve prevents escape, and the transparent chamber offers 360-degree viewing.

The observation habitat is where the real learning happens. Transfer captured bugs from the vacuum chamber into the ventilated magnifying habitat, which features a built-in 3x magnifying lid, a measurement grid on the floor for estimating insect size, and a moisture sponge to keep the environment comfortable during observation periods. The included field guide covers 100 common insects found in North American backyards, with color photographs, identification tips, fun facts, and habitat information for each species.

This kit transforms backyard exploration from aimless wandering into focused scientific inquiry. The included activity journal prompts children to sketch their captures, record location and time of capture, identify species using the field guide, note behavior observations, and release the insect back to its habitat. The catch-and-release design is intentional — the kit teaches observation and respect for living creatures, not collection and preservation. Children learn that real entomologists spend far more time observing insects in the field than pinning them in cases, and that every backyard is a complex ecosystem worth studying.`,
    keywords: ["bugs", "insects", "vacuum", "nature", "observation", "outdoor"],
    ageRange: { min: 4, max: 10 },
    price: 22.99,
    inventory: 35,
    category: "science kits",
    dimensions: { lengthInches: 11.0, widthInches: 5.0, heightInches: 5.0, weightLbs: 0.9 },
    manufacturer: "LabGenius",
    bestSellersRank: 73,
    rating: { stars: 4.4, numberOfRatings: 4567 },
  },
  // ─── Garden & Nature ─────────────────────────────────────────
  {
    id: "toy-188",
    name: "My First Greenhouse Kit",
    image: "/product-images/toy-188.png",
    description: "Miniature greenhouse with 6 seed varieties, biodegradable pots, soil pellets, and a watering pipette. Watch plants grow from seed to sprout in days.",
    marketingCopy: `Growing things is magic — and this kit makes the magic visible. Our First Greenhouse is a clear-domed miniature greenhouse (about the size of a shoebox) that lets children watch the entire germination process unfold: from dry seed to swollen seed to cracked seed coat to emerging root to first leaf, all visible through the transparent walls of the biodegradable growing pots. Six seed varieties are included — cherry tomato, sunflower, basil, marigold, snap pea, and morning glory — each chosen for fast, reliable germination and vigorous early growth.

The soil pellets are compressed coco coir discs that expand dramatically when water is added — a mini science lesson before the first seed is even planted. The watering pipette teaches precision and prevents the number one cause of seedling death: overwatering by enthusiastic young gardeners. The greenhouse dome creates a humid microenvironment that accelerates germination, and the included thermometer and humidity card let children track growing conditions and correlate them with plant growth rates.

The real magic happens at day 3-5 when the first seeds crack open and roots begin to emerge. The biodegradable pots are transparent enough to see root development, turning an invisible underground process into a visible, trackable event. The included garden journal has daily observation pages for each plant, growth measurement charts, and space for drawings. When seedlings outgrow the greenhouse (usually 2-3 weeks), the biodegradable pots can be planted directly into outdoor soil — no transplant shock, no root disturbance. This kit doesn't just teach botany; it teaches patience, responsibility, and the profound satisfaction of nurturing a living thing from seed to plant.`,
    keywords: ["greenhouse", "garden", "seeds", "plants", "nature", "growing"],
    ageRange: { min: 4, max: 10 },
    price: 19.99,
    inventory: 35,
    category: "garden & nature",
    dimensions: { lengthInches: 12.0, widthInches: 6.0, heightInches: 6.0, weightLbs: 1.0 },
    manufacturer: "SproutKids",
    bestSellersRank: 98,
    rating: { stars: 4.3, numberOfRatings: 2890 },
  },
  {
    id: "toy-189",
    name: "Bird Feeder Building Kit",
    image: "/product-images/toy-189.png",
    description: "Build and paint a wooden bird feeder. Includes pre-cut cedar pieces, non-toxic paint, brushes, bird ID card, and suction cup window mount.",
    marketingCopy: `Build it, paint it, hang it, and meet the neighbors — the feathered ones. Our Bird Feeder Building Kit includes pre-cut, pre-drilled western red cedar pieces that assemble with real brass screws (not glue, not plastic pegs — actual screws with a child-sized Phillips screwdriver included). The platform design accommodates a wide range of bird species, from tiny chickadees to larger blue jays, and the roof overhang protects seed from rain while leaving the feeding area visible from inside.

Cedar was chosen deliberately: it's naturally rot-resistant, insect-resistant, and weathers to a beautiful silver-gray over time without any chemical treatment. The included non-toxic acrylic paints (6 colors plus brushes) let children personalize their feeder, and the paint is formulated to be bird-safe once dry. The pre-drilled holes ensure perfect alignment during assembly, and the brass screws won't rust, corrode, or leave streaks on the wood. Assembly takes about 30 minutes with adult supervision and is appropriate for children who can handle a screwdriver.

The suction cup window mount is the kit's secret weapon. Rather than hanging the feeder from a distant tree where birds are barely visible, the window mount places the feeder directly on a window, giving children an intimate, close-up view of visiting birds from inside the house. The included Bird ID card features 20 common backyard species with color illustrations, size comparisons, and diet preferences. Children quickly learn to identify regular visitors and can track which species visit at different times of day and in different seasons — a gentle introduction to ecological observation and citizen science.`,
    keywords: ["bird feeder", "woodworking", "nature", "birds", "building", "outdoor"],
    ageRange: { min: 5, max: 12 },
    price: 24.99,
    inventory: 25,
    category: "garden & nature",
    dimensions: { lengthInches: 10.0, widthInches: 8.0, heightInches: 4.0, weightLbs: 1.2 },
    manufacturer: "SproutKids",
    bestSellersRank: 134,
    rating: { stars: 4.5, numberOfRatings: 1890 },
  },
  {
    id: "toy-190",
    name: "Rock & Mineral Collection – 30 Specimens",
    image: "/product-images/toy-190.png",
    description: "Curated collection of 30 labeled rocks, minerals, and fossils in a wooden display case. Includes magnifying glass, streak plate, and identification guide.",
    marketingCopy: `Hold a piece of Earth's history in your hands. Our Rock & Mineral Collection contains 30 carefully selected specimens spanning igneous, sedimentary, and metamorphic rocks, plus minerals, crystals, and fossils. Each specimen is a genuine geological sample — real quartz, real obsidian, real amethyst, real fossils — not synthetic reproductions. They come arranged in a compartmented wooden display case with each specimen labeled and numbered to correspond with the detailed identification guide.

The identification guide goes far beyond simple names. For each specimen, it provides: geological classification, how and where it formed, Mohs hardness rating, chemical composition in plain language, interesting historical uses, and a "field identification" section teaching children how to recognize the material in nature. The included tools — a 5x magnifying glass, a porcelain streak plate, and a steel nail for hardness testing — let children perform actual mineralogical tests: streak color (dragging a mineral across the plate to see its powder color), hardness comparison (will the nail scratch it, or will it scratch the nail?), and crystal structure examination under magnification.

This collection was curated by a geology educator to tell a story about Earth's processes. The specimens are arranged in the case to illustrate rock cycle transformations: granite (igneous) weathers into sandstone (sedimentary) which is compressed into quartzite (metamorphic). Children can physically hold each stage of the cycle and see how the texture, color, and weight change. The fossils — a trilobite, a fern impression, and a shell — add the dimension of deep time, connecting rock formation to the history of life on Earth. It's a museum exhibit in a box.`,
    keywords: ["rocks", "minerals", "geology", "fossils", "collection", "science"],
    ageRange: { min: 6, max: 14 },
    price: 32.99,
    inventory: 20,
    category: "garden & nature",
    dimensions: { lengthInches: 12.0, widthInches: 8.0, heightInches: 2.0, weightLbs: 3.0 },
    manufacturer: "LabGenius",
    bestSellersRank: 119,
    rating: { stars: 4.7, numberOfRatings: 2345 },
  },
  // ─── Classic & Retro ─────────────────────────────────────────
  {
    id: "toy-191",
    name: "Classic Wooden Spinning Top Set",
    image: "/product-images/toy-191.png",
    description: "Set of 5 hand-painted wooden spinning tops in graduated sizes. Spin by twisting the stem between palms. Mesmerizing color-blend patterns when spinning.",
    marketingCopy: `Five tops, five sizes, five mesmerizing color patterns. Our Classic Wooden Spinning Tops are turned from solid maple on a lathe, hand-painted with non-toxic acrylic in vibrant geometric patterns, and finished with a smooth lacquer that makes them spin longer and feel wonderful in the hand. Each top is a different size — from a 1-inch mini to a 3-inch grand — and each produces a different spin dynamic: the small tops spin fastest with tight wobble patterns, while the large tops spin slower but with majestic, sweeping precession.

The painting on each top is designed to create specific optical effects when spinning. The smallest top has concentric rings that appear to pulse and breathe. The medium top has a spiral that creates an illusion of upward or downward flow. The largest top has a half-and-half color split that blends into a completely new color when spinning — red and yellow becoming orange, blue and yellow becoming green. These aren't accidental decorations; they're deliberately engineered optical illusions that demonstrate principles of color mixing and persistence of vision.

Spinning tops are among humanity's oldest toys, with archaeological examples dating back to 3500 BCE. There's a reason they've persisted for five millennia: the physics of gyroscopic precession is genuinely fascinating, the skill of achieving a long, stable spin is deeply satisfying to develop, and the meditative focus of watching a top spin is calming in a way that few modern toys can match. These tops come in a canvas drawstring bag, making them easy to carry and share. No batteries, no screens, no assembly — just beautiful objects that do one thing perfectly.`,
    keywords: ["spinning top", "wooden", "classic", "retro", "hand-painted"],
    ageRange: { min: 3, max: 99 },
    price: 16.99,
    inventory: 40,
    category: "classic & retro",
    dimensions: { lengthInches: 4.0, widthInches: 4.0, heightInches: 3.0, weightLbs: 0.5 },
    manufacturer: "Heritage Playthings",
    bestSellersRank: 143,
    rating: { stars: 4.4, numberOfRatings: 1567 },
  },
  {
    id: "toy-192",
    name: "Jacob's Ladder – Classic Illusion Toy",
    image: "/product-images/toy-192.png",
    description: "Handcrafted wooden Jacob's Ladder with 6 maple blocks connected by ribbon. Creates a mesmerizing cascading tumble illusion. Based on a toy design from the 1800s.",
    marketingCopy: `An optical illusion you hold in your hands. The Jacob's Ladder is one of history's most elegant folk toys: six polished maple blocks connected by grosgrain ribbon in a precise criss-cross pattern that creates the illusion of blocks tumbling end-over-end in an endless cascade. Tip the top block, and the second block appears to fall — then the third, then the fourth — in a mesmerizing waterfall of motion that seems to defy physics. In reality, no block moves more than a few degrees; the illusion is created entirely by the sequential flipping of ribbon connections.

Our version is handcrafted from hard maple with satin-smooth sanded edges and finished with food-safe mineral oil. The ribbon is genuine grosgrain (not the cheap polyester substitutes found in mass-produced versions) with enough body to create crisp, definitive flips. The ribbon attachment points are secured with brass tacks — historically accurate and more durable than the staples or glue used by inferior versions. Each block measures approximately 2.5 by 1.75 inches, sized to be comfortable in both child and adult hands.

The Jacob's Ladder is a conversation piece, a fidget toy, and a physics lesson in one package. The cascading illusion demonstrates how our visual system processes sequential motion — the same principle behind flip-book animation and cinema. Children inevitably want to understand HOW it works, which leads to taking it apart (the ribbon pattern is surprisingly simple) and attempting to reassemble it (surprisingly tricky, and an excellent exercise in spatial reasoning and patience). The toy dates to at least the 1800s, with some historians tracing similar ribbon-hinge mechanisms to ancient China.`,
    keywords: ["jacob's ladder", "illusion", "wooden", "classic", "retro", "folk toy"],
    ageRange: { min: 5, max: 99 },
    price: 12.99,
    inventory: 35,
    category: "classic & retro",
    dimensions: { lengthInches: 6.0, widthInches: 2.5, heightInches: 1.75, weightLbs: 0.3 },
    manufacturer: "Heritage Playthings",
    bestSellersRank: 167,
    rating: { stars: 4.3, numberOfRatings: 1234 },
  },
  {
    id: "toy-193",
    name: "Cup and Ball – Premium Hardwood",
    image: "/product-images/toy-193.png",
    description: "Traditional cup-and-ball skill toy made from turned walnut and maple. Silk cord connection. Practice persistence and hand-eye coordination with this centuries-old game.",
    marketingCopy: `The simplest game. The hardest game. A turned walnut cup, a maple ball, a silk cord, and the eternal challenge of landing the ball in the cup. The cup-and-ball (bilboquet, kendama's ancestor, balero — every culture has its own name) has been frustrating and delighting humans for at least 500 years, with documented examples from 16th-century France, Elizabethan England, and pre-Columbian Mexico. Its genius is that the challenge is immediately obvious, immediately attempted, and almost immediately failed — creating an irresistible urge to try again.

Our version is crafted from American walnut (the cup) and hard maple (the ball), chosen for their contrasting colors and complementary weights. The cup is turned on a lathe with a slightly flared rim that guides near-misses into catches rather than bouncing them away — a subtle design feature that makes learning less frustrating without making mastery less satisfying. The ball is connected by a 14-inch silk cord that swings smoothly without tangling, and the handle is ergonomically shaped for comfortable grip during the hundreds of attempts that precede the first successful catch.

The beauty of cup-and-ball is its skill curve. The first catch might take 20 minutes. The second takes 10. By the end of the first day, catches come every few tries. Within a week, children are attempting advanced tricks: catching on the spike (a small point on the base), flipping the ball and catching it on the cup's bottom, or stringing together multiple catches. The progression from fumbling beginner to fluid practitioner is visible, measurable, and deeply rewarding — a physical metaphor for the value of persistence that no motivational poster can match.`,
    keywords: ["cup and ball", "skill toy", "wooden", "classic", "coordination"],
    ageRange: { min: 6, max: 99 },
    price: 18.99,
    inventory: 30,
    category: "classic & retro",
    dimensions: { lengthInches: 7.0, widthInches: 3.0, heightInches: 3.0, weightLbs: 0.3 },
    manufacturer: "Heritage Playthings",
    bestSellersRank: 178,
    rating: { stars: 4.2, numberOfRatings: 987 },
  },
  {
    id: "toy-194",
    name: "Tin Kaleidoscope – Brass Finish",
    image: "/product-images/toy-194.png",
    description: "Classic brass-finish tin kaleidoscope with oil-filled color cell. Produces fluid, endlessly changing symmetrical patterns. 9 inches long with textured grip.",
    marketingCopy: `Infinity in a tube. Our Tin Kaleidoscope uses a three-mirror system and an oil-filled color cell to produce endlessly flowing symmetrical patterns that never repeat. Unlike dry-cell kaleidoscopes where beads tumble and settle quickly, the oil suspension keeps colors in constant, languid motion — turning the barrel produces patterns that flow and morph like living stained glass. The effect is genuinely mesmerizing; adults pick this up "to check the quality" and are still staring into it ten minutes later.

The brass-finish tin body is built to last generations. The mirror system uses front-surface glass mirrors (not plastic or rear-surface mirrors) for crystal-clear reflections without the ghosting or haziness that cheaper materials produce. The three mirrors are set at precisely 60 degrees to create perfect hexagonal symmetry — the same geometry found in snowflakes, honeycombs, and Islamic geometric art. The oil cell is sealed and contains hand-selected glass chips, colored oils, and metallic flakes that catch light differently depending on angle.

The kaleidoscope was invented in 1816 by Scottish physicist Sir David Brewster, who was studying the polarization of light. He intended it as a scientific instrument; the world embraced it as a toy. Our version honors both traditions: it's a beautiful object that produces genuine wonder, and it's also a practical demonstration of reflection symmetry, rotational geometry, and light behavior. The textured grip and solid brass weight make it feel like an instrument, not a toy — children treat it with a reverence they rarely extend to plastic objects. It comes in a kraft paper tube suitable for gift-giving.`,
    keywords: ["kaleidoscope", "brass", "classic", "optical", "retro"],
    ageRange: { min: 4, max: 99 },
    price: 14.99,
    inventory: 45,
    category: "classic & retro",
    dimensions: { lengthInches: 9.0, widthInches: 2.0, heightInches: 2.0, weightLbs: 0.4 },
    manufacturer: "Heritage Playthings",
    bestSellersRank: 112,
    rating: { stars: 4.6, numberOfRatings: 3456 },
  },
  {
    id: "toy-195",
    name: "Wooden Yo-Yo – Competition Grade",
    image: "/product-images/toy-195.png",
    description: "Fixed-axle wooden yo-yo made from laminated maple and walnut. Ball-bearing responsive axle. Includes trick book with 20 tricks from beginner to advanced.",
    marketingCopy: `Up and down is just the beginning. Our Competition Grade Wooden Yo-Yo combines the warm aesthetics of laminated maple and walnut with modern ball-bearing axle technology that makes learning tricks dramatically easier than fixed-axle designs. The bearing allows extended sleep times (the yo-yo spinning at the end of the string), giving beginners the time they need to land their first Rock the Cradle, and giving advanced players the spin stability for complex string tricks.

The body is precision-turned from alternating laminations of hard maple and American black walnut, creating a striking stripe pattern that becomes a hypnotic blur when spinning. The weight distribution is carefully calibrated: slightly rim-heavy for maximum spin time and gyroscopic stability, but not so rim-heavy that returns feel sluggish. The response pads (silicone O-rings that grip the string for the return) are replaceable, and we include two spare sets. The string is premium polyester that holds tension well and produces clean binds.

The included trick book starts with absolute basics — how to wind the string, the gravity pull, the forward pass — and progresses through 20 tricks of increasing difficulty: Sleeper, Walk the Dog, Rock the Cradle, Brain Twister, Trapeze, and beyond. Each trick includes a difficulty rating, step-by-step illustrations, common mistakes and fixes, and estimated practice time to proficiency. Yo-yoing is experiencing a renaissance among skill toy enthusiasts, and this yo-yo is the ideal entry point: it looks and feels premium, performs at competition level, and uses a timeless material that connects today's players to a toy tradition spanning thousands of years.`,
    keywords: ["yo-yo", "wooden", "competition", "skill toy", "tricks", "classic"],
    ageRange: { min: 6, max: 99 },
    price: 22.99,
    inventory: 35,
    category: "classic & retro",
    dimensions: { lengthInches: 2.25, widthInches: 2.25, heightInches: 1.5, weightLbs: 0.2 },
    manufacturer: "Heritage Playthings",
    bestSellersRank: 156,
    rating: { stars: 4.5, numberOfRatings: 2345 },
  },
  {
    id: "toy-196",
    name: "Jacks Set – Metal with Rubber Ball",
    image: "/product-images/toy-196.png",
    description: "Classic 10-piece metal jacks set with two rubber bouncing balls. Includes rules for 12 jacks game variations from around the world. Drawstring pouch included.",
    marketingCopy: `Onesies, twosies, threesies — the rhythm of a game that predates written history. Our metal Jacks set includes 10 classic six-pronged jacks cast from zinc alloy with a chrome finish, two high-bounce rubber balls (because one always rolls under the couch), and a comprehensive rules booklet covering 12 game variations from around the world. The jacks are sized and weighted for optimal play: heavy enough to stay put when scattered, light enough to scoop up quickly, and polished smooth so they don't snag on carpet fibers.

Jacks is one of humanity's oldest games — ancient Greek children played "knucklebones" (astragaloi) using actual sheep ankle bones, and similar games appear in cultures from Korea to Nigeria to Peru. The fundamental challenge hasn't changed in millennia: scatter the jacks, bounce the ball, pick up the required number of jacks before the ball bounces twice. It sounds simple. It isn't. The combination of bouncing accuracy, hand speed, fine motor precision, and strategic scattering makes jacks a genuinely challenging game that rewards practice and develops real physical skills.

The 12 game variations in our rules booklet range from basic "onesies through tensies" to challenging variants like Pigs in the Pen (scoop jacks into a fenced hand), Eggs in the Basket (transfer jacks to the non-dominant hand), and the Korean game Gonggi (no ball — toss and catch the jacks themselves). Each variation develops slightly different motor skills and strategic thinking. The chrome-finished jacks come in a drawstring cotton pouch, and the whole set is compact enough to carry anywhere — recess, sleepovers, road trips, or the kitchen floor where jacks have been played for generations.`,
    keywords: ["jacks", "metal", "classic", "retro", "ball", "skill game"],
    ageRange: { min: 5, max: 99 },
    price: 8.99,
    inventory: 60,
    category: "classic & retro",
    dimensions: { lengthInches: 4.0, widthInches: 3.0, heightInches: 2.0, weightLbs: 0.3 },
    manufacturer: "Heritage Playthings",
    bestSellersRank: 89,
    rating: { stars: 4.4, numberOfRatings: 4567 },
  },
  {
    id: "toy-197",
    name: "Wooden Marble Run – 50 Piece Classic",
    image: "/product-images/toy-197.png",
    description: "Solid beechwood marble run with 50 pieces including ramps, funnels, spirals, and a bell strike. Comes with 10 glass marbles. Compatible with standard building blocks.",
    marketingCopy: `Gravity is the engine. Imagination is the blueprint. Our 50-piece Wooden Marble Run is crafted from FSC-certified European beechwood with a natural oil finish that feels warm, looks beautiful, and is completely free of plastic. The set includes straight ramps, curved ramps, funnels, a spiral chute, a zigzag cascade, a bell-strike (the marble hits a real brass bell at the end — deeply satisfying), plus columns and connectors of various heights for building structures up to 24 inches tall.

The engineering challenge of a marble run is deceptively complex. Children must consider gravity (does this angle provide enough speed?), momentum (will the marble make it around this curve?), sequencing (which piece comes after the funnel?), and structural stability (will this tower stand under its own weight?). Trial and error is constant and immediate — either the marble makes it through, or it doesn't — providing the kind of instant, unambiguous feedback that makes learning feel like play. Failures are as educational as successes: a marble that flies off a curve teaches about centripetal force, a tower that topples teaches about center of gravity.

The pieces are precision-milled with tight tolerances so connections are firm without being difficult — children can build independently without the frustrating wobble of loose-fitting pieces or the parent-requiring force of too-tight fits. The natural beechwood blocks are compatible with standard wooden building blocks, so existing collections can be incorporated into marble run designs. The 10 included glass marbles are traditional cat's-eye style, and the run works with any standard 16mm marble. This is the kind of toy that stays relevant for years: a 4-year-old builds simple two-ramp runs, a 7-year-old constructs elaborate multi-path structures, and a 10-year-old engineers the longest possible run using every single piece.`,
    keywords: ["marble run", "wooden", "building", "engineering", "classic", "gravity"],
    ageRange: { min: 4, max: 10 },
    price: 54.99,
    inventory: 20,
    category: "classic & retro",
    dimensions: { lengthInches: 14.0, widthInches: 10.0, heightInches: 6.0, weightLbs: 4.5 },
    manufacturer: "Heritage Playthings",
    bestSellersRank: 45,
    rating: { stars: 4.8, numberOfRatings: 5678 },
  },
  // ─── High-End / Specialty ────────────────────────────────────
  {
    id: "toy-198",
    name: "Architect's Building Set – 250 Pieces",
    image: "/product-images/toy-198.png",
    description: "Premium construction set with real wood beams, transparent acrylic panels, and metal connectors. Build structures up to 3 feet tall. Includes architecture guide with 15 famous building projects.",
    marketingCopy: `Build the Eiffel Tower. Then build something better. Our Architect's Building Set contains 250 precision-crafted components — hardwood beams in 6 lengths, transparent acrylic panels in 4 sizes, brushed aluminum connectors, and flexible silicone joints — that connect via a universal slot-and-tab system allowing construction of structures up to 3 feet tall. The materials are deliberately mixed: wood provides warmth and structural rigidity, acrylic adds transparency and visual lightness, and metal connectors add industrial authenticity and permanent-feeling joints.

The included Architecture Guide presents 15 famous building projects adapted for this set: the Eiffel Tower, the Golden Gate Bridge, Fallingwater, the Sydney Opera House, a Gothic cathedral, a Japanese pagoda, and nine others. Each project includes historical context about the real structure, step-by-step building instructions, and engineering notes explaining why the real architects made specific structural choices. Children don't just build a bridge — they learn why suspension bridges use cables, why arch bridges distribute weight, and why truss bridges use triangles for rigidity.

This is unambiguously a premium product, and the quality reflects that positioning. The wood is kiln-dried maple, sanded to 220-grit smoothness. The acrylic panels are laser-cut with polished edges. The aluminum connectors are CNC-machined with anodized finish. Every component fits precisely, stays connected firmly, and looks beautiful both during construction and on display. The set comes in a wooden storage crate with laser-engraved compartment labels — because organization is part of the engineering discipline, and because scattering 250 premium components across the playroom floor is not an option at this price point.`,
    keywords: ["architecture", "building", "premium", "construction", "wood", "design"],
    ageRange: { min: 8, max: 99 },
    price: 129.99,
    inventory: 10,
    category: "specialty",
    dimensions: { lengthInches: 18.0, widthInches: 12.0, heightInches: 6.0, weightLbs: 8.0 },
    manufacturer: "Pinnacle Play",
    bestSellersRank: 189,
    rating: { stars: 4.9, numberOfRatings: 890 },
  },
  {
    id: "toy-199",
    name: "Handcrafted Wooden Chess Set – Tournament Size",
    image: "/product-images/toy-199.png",
    description: "Staunton-pattern chess set with weighted, felted pieces in walnut and maple. Folding walnut board with piece storage. Tournament regulation sizing.",
    marketingCopy: `Sixty-four squares. Thirty-two pieces. Infinite possibilities. Our Tournament Chess Set features full Staunton-pattern pieces hand-carved from solid walnut (dark) and hard maple (light), each weighted with a steel disc in the base and felted with green baize for smooth, silent movement across the board. The king stands 3.75 inches tall (FIDE tournament standard), and every piece is proportioned according to the official Staunton design ratios established in 1849 — the same proportions used in every World Chess Championship since.

The folding board is crafted from book-matched walnut with maple inlay squares, finished with a hand-rubbed oil-and-wax treatment that produces a deep, warm luster. When folded, the board becomes a storage case with fitted velvet compartments for each piece — no rattling, no scratching, no searching for the missing bishop. The board hinges are recessed brass with a magnetic closure, and the folded case has a leather carrying handle for transport to clubs, parks, or tournaments.

Chess is experiencing an unprecedented popularity surge, and this set is designed for players who want to invest in the game for life. The weight of the pieces (each has a steel disc embedded in the base) provides the satisfying, substantial feel that serious players prefer — pieces stay where you place them, and captures feel decisive. The felted bases protect the board surface and eliminate the distracting clack of unfelted pieces. This is a chess set that children grow into rather than out of: it serves a 6-year-old learning the rules, a 12-year-old studying openings, and a 30-year-old playing in club tournaments. It may well be the chess set their children learn on.`,
    keywords: ["chess", "wooden", "tournament", "Staunton", "strategy", "premium"],
    ageRange: { min: 6, max: 99 },
    price: 89.99,
    inventory: 15,
    category: "specialty",
    dimensions: { lengthInches: 15.0, widthInches: 15.0, heightInches: 2.5, weightLbs: 4.0 },
    manufacturer: "Pinnacle Play",
    bestSellersRank: 78,
    rating: { stars: 4.8, numberOfRatings: 3456 },
  },
  {
    id: "toy-200",
    name: "Deluxe Magic Set – 100 Tricks",
    image: "/product-images/toy-200.png",
    description: "Professional-quality magic set with 100 tricks, instructional video access, performance tips, and a magician's cape. Real magic props, not cheap plastic.",
    marketingCopy: `Ladies and gentlemen, prepare to be amazed. Our Deluxe Magic Set contains 100 tricks ranging from self-working card effects that a 6-year-old can master in minutes to sophisticated sleight-of-hand illusions that will fool adults. The props are professional quality — a real cups-and-balls set in spun aluminum, a genuine svengali deck, precision-machined coin gimmicks, silk scarves (not polyester), a solid wood magic wand, and rope that actually handles well for cut-and-restored routines. This is not the blister-packed plastic magic set that breaks on Christmas morning.

The instructional system is designed by a professional magician and educator. Each trick includes written instructions with step-by-step illustrations, plus access to an online video library where a performer demonstrates the trick from both audience and performer perspective. Tricks are organized into five difficulty levels: Instant Magic (self-working tricks requiring zero practice), Beginner (simple sleights mastered in an afternoon), Intermediate (tricks requiring confident handling), Advanced (genuine sleight-of-hand), and Showstopper (routines combining multiple techniques into performance pieces). Children naturally progress through the levels as their skills develop.

Magic teaches skills that no other activity quite replicates. Performing a trick requires practice (discipline), audience management (social skills), misdirection (understanding attention and perception), patter development (public speaking), and graceful recovery from mistakes (resilience). The included magician's cape and performance tips transform trick practice into show rehearsal, encouraging children to perform for family and friends. We've watched shy children become confident presenters through magic — there's something about having a genuine secret, a real skill that amazes adults, that builds a particular kind of self-assurance that nothing else provides.`,
    keywords: ["magic", "tricks", "performance", "illusion", "sleight of hand", "premium"],
    ageRange: { min: 6, max: 14 },
    price: 64.99,
    inventory: 15,
    category: "specialty",
    dimensions: { lengthInches: 16.0, widthInches: 12.0, heightInches: 4.0, weightLbs: 3.5 },
    manufacturer: "Pinnacle Play",
    bestSellersRank: 67,
    rating: { stars: 4.7, numberOfRatings: 4567 },
  },
];
