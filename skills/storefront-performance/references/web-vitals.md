# Web Vitals notes

## Thresholds

| Metric | Good | Needs improvement | Poor |
| --- | --- | --- | --- |
| LCP | at most 2500 ms | 2500 to 4000 ms | above 4000 ms |
| INP | at most 200 ms | 200 to 500 ms | above 500 ms |
| CLS | at most 0.1 | 0.1 to 0.25 | above 0.25 |

A page passes when all three are good at the 75th percentile.

## LCP parts

LCP time splits into four parts. Find the biggest one first.

1. Time to First Byte: server, cache misses, redirects.
2. Resource load delay: the image is discovered late, for example set by JavaScript or CSS.
3. Resource load duration: the file is too big.
4. Element render delay: render-blocking CSS or scripts, or a hidden page from an A/B testing script.

Preload the LCP image when it is not in the initial HTML:

```html
<link rel="preload" as="image" href="/img/mug-800.avif" imagesrcset="/img/mug-400.avif 400w, /img/mug-800.avif 800w" imagesizes="(max-width: 600px) 100vw, 50vw" fetchpriority="high">
```

## Collecting field data

```js
import { onLCP, onINP, onCLS } from "web-vitals";

function send(metric) {
  navigator.sendBeacon("/vitals", JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    template: document.body.dataset.template,
  }));
}

onLCP(send);
onINP(send);
onCLS(send);
```

Group the values by template and device, then take the 75th percentile.

## Input file for the checker

```json
[
  { "template": "product", "device": "mobile", "lcp": 3100, "inp": 180, "cls": 0.02 }
]
```
