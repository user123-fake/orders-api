# orders-api

Orders and quoting service. Node 20, Express, Postgres 16.

Start: `docker compose up -d --build`, then `docker compose exec -T api npm run seed` for sample data.
`scripts/reset.sh` wipes volumes, rebuilds and reseeds.
API on http://localhost:3000, Postgres on localhost:5433 (user/password/database: orders).
Endpoints: GET /health, POST /quote, POST /orders, GET /orders/:id, GET /orders/ref/:order_ref, GET /reports/summary.
Pricing rules are in docs/rounding-spec.md.
Source changes under src/ reload automatically.
