# Price lists

## Shape

```json
{
  "id": "wholesale-2026",
  "currency": "EUR",
  "groups": ["wholesale"],
  "priority": 10,
  "validFrom": "2026-01-01",
  "validTo": "2026-12-31",
  "entries": [
    { "sku": "MUG-RED", "minQuantity": 1, "unitPrice": 9.00 },
    { "sku": "MUG-RED", "minQuantity": 10, "unitPrice": 8.50 },
    { "sku": "MUG-RED", "minQuantity": 50, "percentOff": 20 }
  ]
}
```

A contract is a price list with `companies` instead of `groups`.

## Rules

| Rule | Recommendation |
| --- | --- |
| Which lists apply | Lists for the buyer's company (contracts), then the buyer's groups, valid on the order date, in the cart currency |
| Tier inside a list | Highest `minQuantity` that is at most the line quantity |
| Several lists apply | Contract first. Then the lowest unit price, or the highest priority if the store chooses that. Record the rule in one place. |
| `percentOff` base | The public regular price of the SKU |
| Rounding | Round the unit price to the currency's minor unit, then multiply |

## Request for the resolver script

```json
{
  "sku": "MUG-RED",
  "quantity": 12,
  "company": "acme",
  "groups": ["wholesale"],
  "date": "2026-10-30",
  "currency": "EUR",
  "basePrice": 11.0,
  "strategy": "lowest"
}
```
