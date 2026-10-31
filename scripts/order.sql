WITH d AS (
  SELECT o.order_ref, i.unit_price_cents * i.quantity AS gross, i.discount_pct,
         i.line_discount_cents AS stored,
         (i.unit_price_cents * i.quantity * i.discount_pct + 50) / 100 AS spec
  FROM order_items i JOIN orders o ON o.id = i.order_id
  WHERE o.policy_version = 2
)
SELECT * FROM d WHERE stored <> spec ORDER BY order_ref;