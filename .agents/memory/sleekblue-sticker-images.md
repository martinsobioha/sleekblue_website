---
name: Sticker image uploads
description: How per-size sticker images work — server storage, upload, and ProductPage rendering
---

# Sticker Size Images

## Storage
`site-data.json → stickerImages[size]` — array of `/uploads/products/...` URLs per size key (e.g. `3x3"`)

## Endpoints
- `GET /api/sticker-images` — public, returns all sizes
- `POST /api/admin/upload/sticker-image` — requires JWT; body: FormData with `image` file + `size` text
- `DELETE /api/admin/sticker-image` — requires JWT; body JSON `{ size, url }`

## Admin UI
StickerPricesView in AdminPage.jsx has a collapsible "🖼️ Sticker Showcase Images" card. Upload multiple images per size. Shown as thumbnail grid with × delete buttons.

## ProductPage rendering
`stickerImages` state fetched from `/api/sticker-images`. Priority: server images first, static `STICKER_SIZE_IMAGES` fallback.
```js
const serverStickerImgs = stickerImages[effectiveSize] || []
const productImgs = isDieCut
  ? (serverStickerImgs.length > 0 ? serverStickerImgs : (STICKER_SIZE_IMAGES[effectiveSize] || []))
  : ...
```

**Why:** Static imports cannot be changed at runtime. Server images allow admin to upload real product photos per sticker size without redeploying.
