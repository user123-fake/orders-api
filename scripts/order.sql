const d = pm.iterationData;
pm.test('discount matches spec', () => pm.expect(pm.response.json().discount_cents).to.eql(Number(d.get('expected_discount_cents')))); 
pm.test('total matches spec', () => pm.expect(pm.response.json().total_cents).to.eql(Number(d.get('expected_total_cents'))));
Check the response field names against your real Quote response before recording and adjust if they differ. A single Send outside the Runner will show these tests failing because there is no iteration data. That is expected, so only trust them in the Runner.
B. SQL in TablePlus. Type the CTE in two bursts, with a sentence of narration between.
WITH d AS (
  SELECT o.order_ref, i.unit_price_cents * i.quantity AS gross, i.discount_pct,
         i.line_discount_cents AS stored,
         (i.unit_price_cents * i.quantity * i.discount_pct + 50) / 100 AS spec
  FROM order_items i JOIN orders o ON o.id = i.order_id
  WHERE o.policy_version = 2
)
SELECT * FROM d WHERE stored <> spec ORDER BY order_ref;