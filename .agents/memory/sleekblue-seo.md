---
name: SEO architecture
description: How dynamic SEO titles/meta work across all pages in Sleekblue
---

# Sleekblue SEO Architecture

## Hook
`src/hooks/useSEO.js` — fetches `/api/seo` once (cached module-level), then sets `document.title` and `meta[name="description"]` and `meta[name="keywords"]`.

## Admin
- GET `/api/seo` — public, returns `data.seo` from site-data.json
- PUT `/api/admin/seo` — requires JWT, merges and saves `data.seo`
- Admin UI: AdminPage.jsx → SeoView component → sidebar item `{ id: 'seo', icon: '🔍', label: 'SEO Manager' }`

## Page keys in use
`home`, `store`, `about`, `blog`, `quote`, `dieCut`, `flexBanner`, `labels`, `checkout`

## BlogPostPage
Sets title dynamically from `post.title` inside the useEffect (not useSEO hook, since key is the post slug).

**Why:** All pages need dynamic titles for Google search ranking. Admin can override any page's title/description without code changes.
