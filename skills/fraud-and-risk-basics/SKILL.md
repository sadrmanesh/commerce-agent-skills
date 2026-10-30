---
name: fraud-and-risk-basics
description: "Hold or review risky payments using provider signals, velocity, and 3-D Secure without storing card numbers. Use when adding payment risk checks, a manual review queue, or decline handling for card abuse."
license: MIT
metadata:
  author: Naser Sadrmanesh
  version: "0.2.0"
---

# Fraud and risk basics

Use this skill to decide whether a confirmed payment attempt should capture, wait for review, or be declined. The payment skill still verifies the provider. This skill does not collect card numbers and it does not describe how to test stolen cards.

## Procedure

1. Let the payment provider collect the card. You store the provider payment id, AVS result, CVV result, and 3-D Secure result. You do not store PAN or CVV.
2. Start from the provider's risk recommendation. Do not replace it with a score you computed from a single field.
3. Add only signals you can explain: velocity, address mismatch, and a mismatch between the paid amount and the order.
4. Map the outcome to one action: capture, authorize and review, or do not capture.
5. A review queue shows the order id, amount, currency, and the signals. A person captures or voids. The queue does not auto-capture because it sat overnight.

Worked examples and checks are in [evals/tasks.json](evals/tasks.json).

## Actions

| Situation | Action |
| --- | --- |
| Provider says the payment is acceptable and no local rule fired | Capture, or accept the provider's capture, through the payment skill. |
| Provider asks for step-up authentication | Send the shopper through 3-D Secure. Do not capture before it finishes. |
| AVS or CVV is a mismatch and the amount is above the store's review threshold | Authorize if the provider allows it, and queue for review. Do not capture yet. |
| Velocity rule fires | Same review path. Do not silently decline every later order from that customer without a reason you store. |
| Amount, currency, or order id does not match | Do not capture. Follow the payment skill's mismatch rule. |
| Provider declines | Leave the order unpaid. Keep the cart. Do not retry the charge in a loop. |

AVS and CVV are signals. A match is not proof the shopper is the cardholder. A mismatch is not proof of fraud. International addresses often fail AVS. Do not decline every AVS mismatch unless the store has chosen that policy.

## Velocity

Count paid and attempted orders by the identifiers you are allowed to store: account id, shipping address hash, and provider customer id. A default worth configuring is more than three payment attempts from one account in ten minutes, or more than two shipping addresses used by one account in one hour. Tune the numbers. Do not present them as measured fraud rates.

Do not put the full card number into the velocity key.

## Review queue

- Store order id, amount, currency, provider payment id, the signals that fired, and the decision.
- Capture and void go through the payment provider, idempotently.
- The reviewer's user id is stored with the decision.
- A shopper-facing page says the payment is being reviewed. It does not say the order shipped.

## Gotchas

- Capturing before 3-D Secure returns loses the liability shift the provider offered. Wait for the result.
- A client-supplied `risk: low` field is not a signal. Ignore it.
- Logging the full webhook body can store a PAN the provider included by mistake. Log ids and result codes.
- Declining the renewal of every international card will cancel good subscriptions. Use the review path for subscriptions instead of an immediate cancel, unless the store has a written policy.

## Verification

- A mismatched amount is not captured.
- A 3-D Secure challenge does not capture before the provider reports success.
- The database and logs for a test payment contain no PAN and no CVV.
- Two clicks in the review queue do not capture twice.
