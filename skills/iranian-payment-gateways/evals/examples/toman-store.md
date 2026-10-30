One Toman is ten Rial, so 125,000 IRT becomes 1250000 IRR. Send `amount: 1250000` to the Rial-only gateway, and send the same amount in the verify call.

With Zarinpal you can instead send `amount: 125000` with `currency: "IRT"`. Keep the conversion in one function and store the order currency as IRT.
