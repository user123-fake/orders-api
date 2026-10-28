CREATE TABLE orders (
  id serial PRIMARY KEY,
  order_ref text UNIQUE NOT NULL,
  customer_ref text NOT NULL,
  policy_version int NOT NULL CHECK (policy_version IN (1, 2)),
  created_at timestamptz NOT NULL,
  subtotal_cents int NOT NULL,
  discount_cents int NOT NULL,
  total_cents int NOT NULL
);

CREATE TABLE order_items (
  id serial PRIMARY KEY,
  order_id int REFERENCES orders(id) ON DELETE CASCADE,
  sku text NOT NULL,
  description text NOT NULL,
  unit_price_cents int NOT NULL,
  quantity int NOT NULL CHECK (quantity >= 1),
  discount_pct int NOT NULL CHECK (discount_pct BETWEEN 0 AND 100),
  line_gross_cents int NOT NULL,
  line_discount_cents int NOT NULL,
  line_total_cents int NOT NULL
);

CREATE INDEX order_items_order_id_idx ON order_items (order_id);
CREATE INDEX orders_created_at_idx ON orders (created_at);
