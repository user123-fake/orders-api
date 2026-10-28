function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatCents(cents) {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const dollars = (abs - (abs % 100)) / 100;
  return `${sign}$${dollars}.${pad2(abs % 100)}`;
}

module.exports = { formatCents };
