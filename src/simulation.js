// Pure, serializable world rules. No DOM, time, renderer, or random global state.
export const WORLD_VERSION = 1;

export const MAX_HISTORY = 12;

export const INGREDIENTS = [
  {
    id: "herbs",
    name: "Herbs",
    note: "Seed a little forest",
    color: "#678447",
    glyph: "leaf",
    effect: "Plants roots. Damp, mild ground grows a grove.",
  },
  {
    id: "water",
    name: "Water",
    note: "Cool & soften",
    color: "#4c8c97",
    glyph: "drop",
    effect: "Cools the bowl, moistens roots, and dilutes salt.",
  },
  {
    id: "salt",
    name: "Sea salt",
    note: "A tide of tiny sailors",
    color: "#809aaa",
    glyph: "salt",
    effect: "Makes briny seas. Too much makes forests thirsty.",
  },
  {
    id: "chili",
    name: "Chili",
    note: "Turn up the weather",
    color: "#c65e43",
    glyph: "chili",
    effect: "Warms the air. A wet, warm bowl makes rain.",
  },
  {
    id: "sugar",
    name: "Sugar",
    note: "Sweeten a habitat",
    color: "#bd944c",
    glyph: "cube",
    effect: "Feeds meadow flowers. Herbs and sugar invite glowbugs.",
  },
  {
    id: "lemon",
    name: "Lemon",
    note: "A bright little twist",
    color: "#b89932",
    glyph: "lemon",
    effect: "Adds a little acidity. Try it near another pantry powder.",
  },
  {
    id: "soda",
    name: "Baking soda",
    note: "A pinch of possibility",
    color: "#9684a6",
    glyph: "jar",
    effect: "Waits in the soil. Something sour may wake it up.",
  },
];

export const GUIDE = [
  {
    id: "grove",
    title: "The herb woods",
    hint: "A few leaves, a drink, and room to take root.",
    recipe: "Herbs + damp soil",
    text: "Herbs root in moist ground. Little sproutlings gather where the canopy is kind.",
    glyph: "leaf",
  },
  {
    id: "sailors",
    title: "The brine brigade",
    hint: "Some little folk prefer their sea well seasoned.",
    recipe: "Sea salt → briny water",
    text: "Salty water welcomes kelp and shell boats. Land plants prefer a lighter pinch.",
    glyph: "salt",
  },
  {
    id: "rain",
    title: "A cloud with a kitchen",
    hint: "What happens to water when the kitchen warms?",
    recipe: "Chili + water → rain",
    text: "Warm, damp air makes a soft rain. The shower waters every patch in the bowl.",
    glyph: "drop",
  },
  {
    id: "glow",
    title: "The lantern meadow",
    hint: "Give a growing meadow something sweet.",
    recipe: "Herbs + sugar",
    text: "Sweet flowering herbs attract glowbugs. Their lanterns float above the growing meadow.",
    glyph: "cube",
  },
  {
    id: "ferry",
    title: "The bubble ferry",
    hint: "A sour fruit. A quiet powder. Something lighter than air.",
    recipe: "Lemon + baking soda, on one patch",
    text: "Acidity and baking soda make fizz. The sproutlings turn the bubbles into tiny flying ferries.",
    glyph: "lemon",
  },
];

export const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));

export function hashSeed(seed) {
  let hash = 2166136261;

  for (const c of seed) {
    hash ^= c.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function random(seed) {
  let a = seed >>> 0;

  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createWorld(seed = "little-soup") {
  seed = String(seed).trim().slice(0, 40) || "little-soup";
  const rng = random(hashSeed(seed));
  const cells = [];

  for (let r = -4; r <= 4; r++)
    for (let q = -4; q <= 4; q++) {
      const radius = Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));

      if (radius > 4) continue;
      cells.push({
        id: cells.length,
        q,
        r,
        land: radius <= 2 || (radius === 3 && rng() > 0.24),
        variant: Math.floor(rng() * 4),
        herbs: radius < 2 ? 20 + rng() * 15 : rng() * 12,
        moisture: 52 + rng() * 10,
        salt: 0,
        sugar: 0,
        acid: 0,
        soda: 0,
        flowers: 0,
      });
    }

  const land = cells.filter((c) => c.land);

  const residents = Array.from({ length: 12 }, (_, id) => ({
    id,
    cell: land[Math.floor(rng() * land.length)].id,
    mood: "wandering",
  }));

  return {
    version: WORLD_VERSION,
    seed,
    tick: 0,
    heat: 26,
    humidity: 54,
    salinity: 8,
    fizz: 0,
    cells,
    residents,
    discovered: [],
    doses: 0,
    events: [
      {
        tick: 0,
        text: "A small world wakes up. Every pinch changes something.",
      },
    ],
  };
}

export const hexDistance = (a, b) =>
  Math.max(
    Math.abs(a.q - b.q),
    Math.abs(a.r - b.r),
    Math.abs(a.q + a.r - b.q - b.r),
  );

function record(world, text) {
  world.events.unshift({ tick: world.tick, text });
  world.events = world.events.slice(0, 6);
}

function discover(world) {
  const conditions = {
    grove: world.cells.some(
      (c) => c.land && c.herbs >= 45 && c.moisture >= 30 && c.salt < 65,
    ),
    sailors: world.salinity >= 30,
    rain: world.heat >= 42 && world.humidity >= 58,
    glow: world.cells.some(
      (c) => c.land && c.herbs >= 35 && c.sugar >= 20 && c.moisture > 25,
    ),
    ferry: world.fizz > 10,
  };

  for (const entry of GUIDE)
    if (conditions[entry.id] && !world.discovered.includes(entry.id)) {
      world.discovered.push(entry.id);
      record(world, `Field note found: ${entry.title}.`);
    }
}

export function addIngredient(previous, ingredient, cellId) {
  if (!INGREDIENTS.some((i) => i.id === ingredient) || !previous.cells[cellId])
    throw new Error("Choose a pantry ingredient and a world patch.");
  const world = structuredClone(previous);
  const target = world.cells[cellId];
  world.doses = Math.min(world.doses + 1, 1000000);

  for (const c of world.cells) {
    const distance = hexDistance(c, target);

    if (distance > 1) continue;
    const weight = distance === 0 ? 1 : 0.38;

    if (ingredient === "herbs") c.herbs = clamp(c.herbs + 42 * weight);

    if (ingredient === "water") {
      c.moisture = clamp(c.moisture + 30 * weight);
      c.salt = clamp(c.salt - 18 * weight);
    }

    if (ingredient === "salt") c.salt = clamp(c.salt + 36 * weight);

    if (ingredient === "sugar") c.sugar = clamp(c.sugar + 34 * weight);

    if (ingredient === "lemon") c.acid = clamp(c.acid + 40 * weight);

    if (ingredient === "soda") c.soda = clamp(c.soda + 40 * weight);
    const reaction = Math.min(c.acid, c.soda);

    if (reaction >= 4) {
      c.acid -= reaction;
      c.soda -= reaction;
      world.fizz = clamp(world.fizz + reaction * 1.5);
    }
  }

  if (ingredient === "water") {
    world.heat = clamp(world.heat - 7);
    world.humidity = clamp(world.humidity + 16);
    world.salinity = clamp(world.salinity - 8);
  }

  if (ingredient === "salt") world.salinity = clamp(world.salinity + 14);

  if (ingredient === "chili") {
    world.heat = clamp(world.heat + 21);
    world.humidity = clamp(world.humidity + 2);
  }

  const messages = {
    herbs: "Little roots reach into the soil.",
    water: "A cool splash. The roots drink; the brine softens.",
    salt: "The sea grows briny. Shell boats catch the tide.",
    chili: "Warm air rises. The wind begins to turn.",
    sugar: "Something sweet settles in the meadow.",
    lemon: "A bright squeeze waits in the soil.",
    soda: "A quiet powder, full of possibility.",
  };

  record(world, messages[ingredient]);
  discover(world);

  return world;
}

export function weather(world) {
  if (world.fizz > 10)
    return {
      name: "Bubble breeze",
      symbol: "◌",
      text: "The sproutlings are catching a lift.",
    };

  if (world.heat >= 42 && world.humidity >= 58)
    return {
      name: "Kitchen rain",
      symbol: "☂",
      text: "Warm air turns moisture into gentle rain.",
    };

  if (world.heat >= 42)
    return {
      name: "Spicy winds",
      symbol: "〰",
      text: "Warm air is drying the meadow.",
    };

  if (world.salinity >= 30)
    return {
      name: "Briny & bright",
      symbol: "≈",
      text: "Shell boats explore the salty shallows.",
    };

  return {
    name: "Soft & sunny",
    symbol: "☀",
    text: "A lovely day for little experiments.",
  };
}

export function residentMode(world, resident) {
  return world.fizz > 10
    ? "flying"
    : world.salinity >= 30 && resident.id % 3 === 0
      ? "sailing"
      : world.cells[resident.cell].herbs > 45
        ? "nesting"
        : "wandering";
}

export function stepWorld(previous, steps = 1) {
  if (!Number.isInteger(steps) || steps < 0 || steps > 10000)
    throw new Error("Invalid simulation step count.");
  const world = structuredClone(previous);

  for (let i = 0; i < steps; i++) {
    world.tick = (world.tick + 1) % 1000000000;
    const rain = world.heat >= 42 && world.humidity >= 58;
    world.heat += (26 - world.heat) * 0.002;
    world.humidity += (54 - world.humidity) * 0.003;
    world.fizz = clamp(world.fizz - 0.4);

    for (const c of world.cells) {
      c.moisture = clamp(
        c.moisture +
          (rain ? 0.55 : -0.08 - Math.max(0, world.heat - 40) * 0.012),
      );

      if (c.land && c.herbs > 3)
        c.herbs = clamp(
          c.herbs + (c.moisture > 25 && c.salt < 65 ? 0.13 : -0.18),
        );
      c.sugar = clamp(c.sugar - 0.025);
      c.flowers = clamp(
        c.flowers +
          (c.herbs > 35 && c.sugar > 15 && c.moisture > 25 ? 0.5 : -0.12),
      );
      c.acid = clamp(c.acid - 0.015);
      c.soda = clamp(c.soda - 0.015);
    }

    for (const resident of world.residents) {
      const here = world.cells[resident.cell];
      resident.mood = residentMode(world, resident);

      if (world.tick % 8 === resident.id % 8) {
        const neighbours = world.cells.filter(
          (c) => c.land && hexDistance(c, here) <= 1,
        );

        neighbours.sort(
          (a, b) =>
            b.herbs + b.moisture - b.salt - (a.herbs + a.moisture - a.salt) ||
            a.id - b.id,
        );
        resident.cell = neighbours.length
          ? neighbours[
              (world.tick + resident.id) % Math.min(neighbours.length, 3)
            ].id
          : resident.cell;
      }
    }

    discover(world);
  }

  return world;
}

export function describeWorld(world) {
  const forests = world.cells.filter((c) => c.land && c.herbs >= 45).length;
  const blooms = world.cells.filter((c) => c.flowers > 5).length;

  return `${world.residents.length} sproutlings. ${forests} wooded patches. ${blooms} flowering patches. ${weather(world).name}. ${world.discovered.length} of ${GUIDE.length} field notes found.`;
}

// Reject malformed imports rather than partially trusting their shape.
export function validateWorld(value) {
  if (
    !value ||
    value.version !== WORLD_VERSION ||
    // eslint-disable-next-line anti-slop/no-runtime-typeof -- Validate untrusted saved/imported data at this native-JavaScript boundary before domain use.
    typeof value.seed !== "string" ||
    value.seed.length > 40
  )
    return false;

  if (
    !Number.isInteger(value.tick) ||
    value.tick < 0 ||
    value.tick >= 1000000000
  )
    return false;

  if (
    !Number.isInteger(value.doses) ||
    value.doses < 0 ||
    value.doses > 1000000
  )
    return false;

  if (
    ["heat", "humidity", "salinity", "fizz"].some(
      (k) => !Number.isFinite(value[k]) || value[k] < 0 || value[k] > 100,
    )
  )
    return false;
  const template = createWorld(value.seed);

  if (
    !Array.isArray(value.cells) ||
    value.cells.length !== 61 ||
    !Array.isArray(value.residents) ||
    value.residents.length !== 12
  )
    return false;

  for (let i = 0; i < value.cells.length; i++) {
    const c = value.cells[i],
      t = template.cells[i];

    if (
      !c ||
      c.id !== i ||
      c.q !== t.q ||
      c.r !== t.r ||
      c.land !== t.land ||
      c.variant !== t.variant
    )
      return false;

    if (
      ["herbs", "moisture", "salt", "sugar", "acid", "soda", "flowers"].some(
        (k) => !Number.isFinite(c[k]) || c[k] < 0 || c[k] > 100,
      )
    )
      return false;
  }

  for (let i = 0; i < value.residents.length; i++) {
    const r = value.residents[i];

    if (
      !r ||
      r.id !== i ||
      !Number.isInteger(r.cell) ||
      !value.cells[r.cell]?.land ||
      !["flying", "sailing", "nesting", "wandering"].includes(r.mood)
    )
      return false;
  }

  if (
    !Array.isArray(value.discovered) ||
    new Set(value.discovered).size !== value.discovered.length ||
    value.discovered.some((id) => !GUIDE.some((g) => g.id === id))
  )
    return false;

  if (
    !Array.isArray(value.events) ||
    value.events.length > 6 ||
    value.events.some(
      (e) =>
        !e ||
        !Number.isInteger(e.tick) ||
        e.tick < 0 ||
        // eslint-disable-next-line anti-slop/no-runtime-typeof -- Validate untrusted saved/imported data at this native-JavaScript boundary before domain use.
        typeof e.text !== "string" ||
        e.text.length > 180,
    )
  )
    return false;

  return true;
}
