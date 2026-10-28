const crypto = require('crypto');
const express = require('express');
const db = require('../db');
const { asyncHandler } = require('../errors');
const { parseOrderRequest } = require('../validation');
const { priceItems } = require('../pricing/priceItems');
const { formatCents } = require('../pricing/format');

const router = express.Router();

const ORDER_COLUMNS = 'id, order_ref, customer_ref, policy_version, created_at, subtotal_cents, discount_cents, total_cents';
const ITEM_COLUMNS = 'id, order_id, sku, description, unit_price_cents, quantity, discount_pct, line_gross_cents, line_discount_cents, line_total_cents';

function newOrderRef() {
  return `WEB-${crypto.randomBytes(4).toString('hex')}`;
}

async function insertOrder(client, { orderRef, customerRef, priced }) {
  const orderResult = await client.query(
    `INSERT INTO orders (order_ref, customer_ref, policy_version, created_at, subtotal_cents, discount_cents, total_cents)
     VALUES ($1, $2, $3, now(), $4, $5, $6)
     RETURNING ${ORDER_COLUMNS}`,
    [orderRef, customerRef, priced.policy_version, priced.subtotal_cents, priced.discount_cents, priced.total_cents],
  );
  const order = orderResult.rows[0];
  const items = [];
  for (const item of priced.items) {
    const itemResult = await client.query(
      `INSERT INTO order_items (order_id, sku, description, unit_price_cents, quantity, discount_pct,
                                line_gross_cents, line_discount_cents, line_total_cents)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING ${ITEM_COLUMNS}`,
      [order.id, item.sku, item.description, item.unit_price_cents, item.quantity, item.discount_pct,
        item.line_gross_cents, item.line_discount_cents, item.line_total_cents],
    );
    items.push(itemResult.rows[0]);
  }
  return { ...order, items };
}

async function loadOrder(where, param) {
  const orderResult = await db.query(`SELECT ${ORDER_COLUMNS} FROM orders WHERE ${where}`, [param]);
  if (orderResult.rows.length === 0) return null;
  const order = orderResult.rows[0];
  const itemResult = await db.query(
    `SELECT ${ITEM_COLUMNS} FROM order_items WHERE order_id = $1 ORDER BY id`,
    [order.id],
  );
  return { ...order, items: itemResult.rows };
}

router.post('/', asyncHandler(async (req, res) => {
  const { items, customerRef, orderRef } = parseOrderRequest(req.body);
  const priced = priceItems(items);
  const order = await db.withTransaction((client) => insertOrder(client, {
    orderRef: orderRef || newOrderRef(),
    customerRef,
    priced,
  }));
  console.log(`order ${order.order_ref} created, total ${formatCents(order.total_cents)}`);
  res.status(201).json(order);
}));

router.get('/ref/:order_ref', asyncHandler(async (req, res) => {
  const order = await loadOrder('order_ref = $1', req.params.order_ref);
  if (!order) return res.status(404).json({ error: 'order not found' });
  return res.json(order);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  if (!/^\d{1,9}$/.test(req.params.id)) return res.status(404).json({ error: 'order not found' });
  const order = await loadOrder('id = $1', Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'order not found' });
  return res.json(order);
}));

module.exports = router;
