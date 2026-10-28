# Order Pricing and Rounding

Owner: Orders team. Applies to quotes and orders created by orders-api.

## Units

- Money is integer cents everywhere. No decimals are stored or exchanged.
- Discounts are whole-number percentages, 0 to 100.

## Line calculation

- gross_cents = unit_price_cents * quantity
- discount_cents = gross_cents * discount_pct / 100, computed exactly, then rounded to whole cents with halves rounded up
- line_total_cents = gross_cents - discount_cents

## Order calculation

- subtotal_cents = sum of line gross_cents
- discount_cents = sum of line discount_cents
- total_cents = sum of line_total_cents (equal to subtotal_cents - discount_cents)
- There is no order-level rounding. Tax and shipping are out of scope.

## Policy versions

- Version 2 takes effect 2026-03-01 and is what the rules above describe.
- Orders created before that date are version 1, which rounded halves down.
- Version 1 orders are not recalculated.

## Worked examples

Single line: unit 1250, quantity 2, discount 10%.
gross 2500, discount 250, line total 2250.

Two lines:
- A: unit 2002, quantity 1, discount 25%. gross 2002, discount 500.5 -> 501, total 1501.
- B: unit 1500, quantity 3, discount 15%. gross 4500, discount 675, total 3825.
- Order: subtotal 6502, discount 1176, total 5326.
