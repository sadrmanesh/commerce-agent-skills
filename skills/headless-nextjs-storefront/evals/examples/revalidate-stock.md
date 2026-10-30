Tag the product fetch and invalidate that tag from the webhook route.

```js
revalidateTag(`product:${id}`);
```

Do not cache the cart response with the public product cache.
