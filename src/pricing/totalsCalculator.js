function computeLineDiscountCents(grossCents, discountPct) {
    const payableRate = 1 - discountPct / 100;
  return Math.round(grossCents * (1 - payableRate));
}

function computeLine({ unitPriceCents, quantity, discountPct }) {
  const grossCents = unitPriceCents * quantity;
  const discountCents = computeLineDiscountCents(grossCents, discountPct);
  return { grossCents, discountCents, totalCents: grossCents - discountCents };
}

function sumOf(lines, key) {
  return lines.reduce((sum, line) => sum + line[key], 0);
}

function computeOrder(items) {
  const lines = items.map(computeLine);
  return {
    lines,
    subtotalCents: sumOf(lines, 'grossCents'),
    discountCents: sumOf(lines, 'discountCents'),
    totalCents: sumOf(lines, 'totalCents'),
  };
}

module.exports = { computeLineDiscountCents, computeLine, computeOrder };
