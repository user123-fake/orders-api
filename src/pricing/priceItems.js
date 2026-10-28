const { computeOrder } = require('./totalsCalculator');

const POLICY_VERSION = 2;

function priceItems(items) {
  const order = computeOrder(items.map((item) => ({
    unitPriceCents: item.unit_price_cents,
    quantity: item.quantity,
    discountPct: item.discount_pct,
  })));
  return {
    policy_version: POLICY_VERSION,
    items: items.map((item, i) => ({
      ...item,
      line_gross_cents: order.lines[i].grossCents,
      line_discount_cents: order.lines[i].discountCents,
      line_total_cents: order.lines[i].totalCents,
    })),
    subtotal_cents: order.subtotalCents,
    discount_cents: order.discountCents,
    total_cents: order.totalCents,
  };
}

module.exports = { POLICY_VERSION, priceItems };
