# Storefront performance

- Judge Core Web Vitals on field data at the 75th percentile, mobile and desktop apart.
- Good means LCP at most 2500 ms, INP at most 200 ms, CLS at most 0.1.
- Never lazy-load the main product image. Give it `fetchpriority="high"` and the right size.
- Set image dimensions and reserve space for banners and widgets.
- Break up long tasks and defer third-party scripts.
- Cache catalog pages for anonymous shoppers only. Bypass cart, checkout, account, and session cookies.
- Purge cached pages when price or stock changes.
- Recheck field data over 28 days after a change.
