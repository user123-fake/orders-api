function computeLineDiscountCents(grossCents, discountPct) {
 return Math.floor((grossCents * discountPct + 50) / 100)
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
