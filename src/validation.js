const { HttpError } = require('./errors');

const MAX_ITEMS = 50;
const MAX_UNIT_PRICE_CENTS = 200000;
const MAX_QUANTITY = 100;

function bad(message) {
  return new HttpError(400, message);
}

function requireString(value, name, maxLength = 64) {
  if (typeof value !== 'string' || value.trim() === '' || value.length > maxLength) {
    throw bad(`${name} must be a non-empty string`);
  }
  return value;
}

function requireInt(value, name, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw bad(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}

function parseItem(raw, index) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw bad(`items[${index}] must be an object`);
  }
  const sku = requireString(raw.sku, `items[${index}].sku`);
  return {
    sku,
    description: raw.description === undefined ? sku : requireString(raw.description, `items[${index}].description`, 200),
    unit_price_cents: requireInt(raw.unit_price_cents, `items[${index}].unit_price_cents`, 0, MAX_UNIT_PRICE_CENTS),
    quantity: requireInt(raw.quantity, `items[${index}].quantity`, 1, MAX_QUANTITY),
    discount_pct: requireInt(raw.discount_pct, `items[${index}].discount_pct`, 0, 100),
  };
}

function parseItems(body) {
  const items = body && body.items;
  if (!Array.isArray(items) || items.length < 1 || items.length > MAX_ITEMS) {
    throw bad(`items must be an array of 1 to ${MAX_ITEMS} entries`);
  }
  return items.map(parseItem);
}

function parseOrderRequest(body) {
  const items = parseItems(body);
  const customerRef = requireString(body.customer_ref, 'customer_ref');
  const orderRef = body.order_ref === undefined ? undefined : requireString(body.order_ref, 'order_ref');
  return { items, customerRef, orderRef };
}

module.exports = { parseItems, parseOrderRequest };
