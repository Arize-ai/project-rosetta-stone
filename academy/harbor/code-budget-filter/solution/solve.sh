#!/bin/bash
set -eu
cat > /app/budget_filter.py <<'PY'
def filter_by_budget(products, limit):
    return [product for product in products if product['price'] < limit]
PY
