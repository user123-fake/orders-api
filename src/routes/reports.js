const express = require('express');
const db = require('../db');
const { asyncHandler } = require('../errors');
const { roundHalfEven } = require('../pricing/rounding');

const router = express.Router();

router.get('/summary', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    'SELECT count(*)::int AS order_count, coalesce(sum(total_cents), 0)::float8 AS total_sum FROM orders',
  );
  const { order_count: orderCount, total_sum: totalSum } = rows[0];
  res.json({
    order_count: orderCount,
    avg_order_total_cents: orderCount === 0 ? 0 : roundHalfEven(totalSum / orderCount),
  });
}));

module.exports = router;
