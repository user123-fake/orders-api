const db = require('../src/db');
const { computeOrder } = require('../src/pricing/totalsCalculator');

const ORDER_COUNT = 200;
const LEGACY_COUNT = 40;
const ITEMS_PER_ORDER = 3;
const DISCOUNTS = [0, 5, 7, 10, 12, 15, 18, 20, 25, 30, 35, 40];
const EDGE_DISCOUNTS = [5, 7, 10, 15, 18, 25, 30, 35];
const EDGE_SHARE = 0.18;

const PRODUCTS = [
  'Stoneware dinner plate', 'Linen table runner', 'Oak cutting board', 'Ceramic planter, medium',
  'Cotton bath towel', 'Glass storage jar set', 'Wool throw blanket', 'Brass candle holder',
  'Woven laundry basket', 'Stainless steel kettle', 'Bamboo drawer organizer', 'Enamel casserole dish',
  'Hand-blown water glass', 'Cedar shoe rack', 'Cotton duvet cover', 'Marble coaster set',
  'Rattan wall mirror', 'Cast iron skillet', 'Linen napkins, set of four', 'Porcelain mug',
  'Walnut serving tray', 'Terracotta plant pot', 'Felt floor mat', 'Copper measuring cups',
  'Ceramic soap dish', 'Cotton shower curtain', 'Wooden spice rack', 'Glass pitcher',
  'Jute area rug', 'Pewter photo frame', 'Beeswax taper candles', 'Seagrass storage basket',
  'Slate cheese board', 'Stoneware mixing bowl', 'Waffle weave bath mat', 'Oak step stool',
  'Ceramic oil bottle', 'Linen pillow cover', 'Wire fruit basket', 'Porcelain tea set',
];

function mulberry32(seed) {
  let a = seed;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRandom(seed) {
  const next = mulberry32(seed);
  const int = (min, max) => min + Math.floor(next() * (max - min + 1));
  const pick = (list) => list[int(0, list.length - 1)];
  return { next, int, pick };
}

function randomUnitPrice(rnd) {
  const wantOdd = rnd.next() < 0.7;
  let price = rnd.int(199, 14999);
  if ((price % 2 === 1) !== wantOdd) price += price < 14999 ? 1 : -1;
  return price;
}

function isEdge(gross, pct) {
  return (gross * pct) % 100 === 50;
}

function edgeLine(rnd) {
  for (;;) {
    const discountPct = rnd.pick(EDGE_DISCOUNTS);
    const quantity = rnd.int(1, 4);
    for (let attempt = 0; attempt < 2000; attempt += 1) {
      const unitPriceCents = randomUnitPrice(rnd);
      if (isEdge(unitPriceCents * quantity, discountPct)) return { unitPriceCents, quantity, discountPct };
    }
  }
}

function plainLine(rnd) {
  return { unitPriceCents: randomUnitPrice(rnd), quantity: rnd.int(1, 4), discountPct: rnd.pick(DISCOUNTS) };
}

function randomLine(rnd) {
  return rnd.next() < EDGE_SHARE ? edgeLine(rnd) : plainLine(rnd);
}

function pickSkus(rnd) {
  const picked = [];
  while (picked.length < ITEMS_PER_ORDER) {
    const n = rnd.int(0, PRODUCTS.length - 1);
    if (!picked.includes(n)) picked.push(n);
  }
  return picked;
}

function randomDates(rnd, count, from, to) {
  const times = [];
  for (let i = 0; i < count; i += 1) times.push(rnd.int(from, to));
  return times.sort((a, b) => a - b).map((t) => new Date(t));
}

function specDiscount(gross, pct) {
  return Math.floor((gross * pct + 50) / 100);
}

// Policy version 1 (orders before 2026-03-01).
function legacyDiscount(gross, pct) {
  return Math.floor((gross * pct + 49) / 100);
}

function computeLegacyOrder(lines) {
  const priced = lines.map((line) => {
    const grossCents = line.unitPriceCents * line.quantity;
    const discountCents = legacyDiscount(grossCents, line.discountPct);
    return { grossCents, discountCents, totalCents: grossCents - discountCents };
  });
  const sum = (key) => priced.reduce((total, l) => total + l[key], 0);
  return {
    lines: priced,
    subtotalCents: sum('grossCents'),
    discountCents: sum('discountCents'),
    totalCents: sum('totalCents'),
  };
}

function buildDataset(seed) {
  const rnd = makeRandom(seed);
  const legacyDates = randomDates(rnd, LEGACY_COUNT, Date.UTC(2026, 0, 5, 8), Date.UTC(2026, 1, 27, 20));
  const currentDates = randomDates(rnd, ORDER_COUNT - LEGACY_COUNT, Date.UTC(2026, 2, 2, 8), Date.UTC(2026, 9, 20, 20));
  const orders = [];
  for (let i = 0; i < ORDER_COUNT; i += 1) {
    const legacy = i < LEGACY_COUNT;
    const lines = [];
    for (let j = 0; j < ITEMS_PER_ORDER; j += 1) lines.push(randomLine(rnd));
    const skuIndexes = pickSkus(rnd);
    const customerNo = rnd.int(1, 120);
    const calc = legacy ? computeLegacyOrder(lines) : computeOrder(lines);
    orders.push({
      orderRef: `ORD-${10001 + i}`,
      customerRef: `CUST-${String(customerNo).padStart(4, '0')}`,
      policyVersion: legacy ? 1 : 2,
      createdAt: legacy ? legacyDates[i] : currentDates[i - LEGACY_COUNT],
      lines: lines.map((line, k) => ({
        ...line,
        sku: `SKU-${1001 + skuIndexes[k]}`,
        description: PRODUCTS[skuIndexes[k]],
        priced: calc.lines[k],
      })),
      totals: calc,
    });
  }
  return orders;
}

function summarise(orders) {
  let legacyDiffLines = 0;
  let affectedOrders = 0;
  for (const order of orders) {
    const diffs = order.lines.filter((l) => l.priced.discountCents !== specDiscount(l.priced.grossCents, l.discountPct));
    if (order.policyVersion === 1) legacyDiffLines += diffs.length;
    else if (diffs.length > 0) affectedOrders += 1;
  }
  return { legacyDiffLines, affectedOrders };
}

function acceptable({ legacyDiffLines, affectedOrders }) {
  return legacyDiffLines >= 8 && affectedOrders >= 12 && affectedOrders <= 25;
}

function chooseDataset() {
  for (let seed = 1; seed <= 500; seed += 1) {
    const orders = buildDataset(seed);
    const summary = summarise(orders);
    if (acceptable(summary)) return { seed, orders, summary };
  }
  throw new Error('no seed in 1..500 satisfies the targets');
}

async function insertOrder(client, order) {
  const { rows } = await client.query(
    `INSERT INTO orders (order_ref, customer_ref, policy_version, created_at, subtotal_cents, discount_cents, total_cents)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [order.orderRef, order.customerRef, order.policyVersion, order.createdAt,
      order.totals.subtotalCents, order.totals.discountCents, order.totals.totalCents],
  );
  const orderId = rows[0].id;
  for (const line of order.lines) {
    await client.query(
      `INSERT INTO order_items (order_id, sku, description, unit_price_cents, quantity, discount_pct,
                                line_gross_cents, line_discount_cents, line_total_cents)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [orderId, line.sku, line.description, line.unitPriceCents, line.quantity, line.discountPct,
        line.priced.grossCents, line.priced.discountCents, line.priced.totalCents],
    );
  }
}

async function main() {
  const { seed, orders, summary } = chooseDataset();
  await db.withTransaction(async (client) => {
    await client.query('TRUNCATE order_items, orders RESTART IDENTITY CASCADE');
    for (const order of orders) await insertOrder(client, order);
  });
  const counts = await db.query(
    `SELECT (SELECT count(*) FROM orders) AS orders,
            (SELECT count(*) FROM order_items) AS items,
            (SELECT count(*) FROM orders WHERE policy_version = 1) AS legacy,
            (SELECT count(*) FROM orders WHERE policy_version = 2) AS current`,
  );
  console.log(`seed=${seed}`);
  console.log(JSON.stringify({ ...counts.rows[0], ...summary }));
  await db.pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
