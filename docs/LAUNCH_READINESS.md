# Sleekblue Media Houz — Website Launch Readiness

**Goal:** When people arrive, the path is smooth, orders work, and we **keep customer testimonials**.  
**Date:** 2026-08  
**Live checks (as of last probe):**  
- `/api/health` → site is up, `indexExists: true`, persistent `dataDir` / `uploadsDir` OK  
- `/api/content` → `{}` (CMS content not filled yet)  
- `/api/promo-banner` → `null` (no launch banner yet)  
- Hardened health fields not live until upstream PR merge + redeploy  

---

## 1. What “smooth” means

| Visitor expectation | Site must do |
|---------------------|--------------|
| Understand what you sell in < 10s | Clear hero + products + prices |
| Order without confusion | Cart → details → bank/Paystack → confirmation |
| Trust you | Real samples, FAQ, WhatsApp, testimonials |
| Leave feedback | Easy review form → you approve → shows on site |
| Get help | Visible phone / WhatsApp |

Complaints usually come from: broken checkout, unclear price, no human contact, silent order status, or missing proof of quality.

---

## 2. Live status snapshot (fill as you fix)

| Check | Status | Notes |
|-------|--------|--------|
| Homepage loads | [ ] | |
| Products list + prices | [ ] | |
| Product detail + variants | [ ] | |
| Cart → create order | [ ] | |
| Paystack path (if used) | [ ] | |
| Bank / WhatsApp payment instructions clear | [ ] | |
| Admin login | [ ] | |
| Admin sees new orders | [ ] | |
| Promo banner live | [ ] | Currently `null` |
| Content (FAQ, trust bar, reviews block) | [ ] | Currently empty `{}` |
| At least 3 approved testimonials | [ ] | |
| Review submit form works | [ ] | |
| WhatsApp / phone visible | [ ] | |
| Mobile layout OK | [ ] | |

---

## 3. CMS fill checklist (admin — do before loud traffic)

Log into admin and set:

### 3.1 Promo banner (launch)
- [ ] Short text: offer + end date + URL reinforcement  
- [ ] Example: `Launch offer: 10% off until 31 Aug — Order on sleekbluemedia.com`  
- [ ] Turn off or update the day the offer ends  

### 3.2 Hero / homepage
- [ ] Headline matches launch message  
- [ ] Subtext: what you print + “order online”  
- [ ] CTA goes to store or WhatsApp  

### 3.3 Content block (`/api/content`)
Populate so it is **not** `{}`:
- [ ] **Trust bar** (delivery, quality, pay options)  
- [ ] **FAQ** (how to order, how long, payment methods, revisions)  
- [ ] **Reviews / testimonials** section enabled  
- [ ] Best-selling or featured products if used  

### 3.4 Products
- [ ] Every launch SKU has correct price  
- [ ] Images load (product + variant)  
- [ ] No placeholder “test” products public  

### 3.5 SEO / contact
- [ ] Phone and WhatsApp correct  
- [ ] Business name consistent  

---

## 4. Testimonials — capture and keep

### How the system already works

```
Customer submits review
  → POST /api/reviews/submit
  → stored in runtime pending-reviews (approved: false)
  → Admin: GET /api/admin/reviews
  → Admin approves: PATCH /api/admin/reviews/:id/approve
  → copied into site-data content.reviews.testimonials
  → public site shows approved testimonials via /api/content
```

**Nothing public until you approve.** That protects the brand.

### Launch process for testimonials

| Step | Action | Cadence |
|------|--------|---------|
| 1 | After a happy delivery, ask for a short review (WhatsApp + site form) | Every paid order |
| 2 | Customer submits name + text + rating on site | — |
| 3 | Admin checks pending reviews same day | Daily during launch |
| 4 | Approve good ones; delete spam/abuse | Daily |
| 5 | Optional: screenshot testimonial for Reels (with permission) | Weekly |

### Seed before launch (optional but powerful)

- [ ] Message 5–10 past happy customers  
- [ ] Ask 2–3 sentences + permission to show name  
- [ ] Enter via review form **or** paste into CMS testimonials if you add manually in admin content  
- [ ] Approve so homepage is not empty on day one  

### Review request message (copy)

> Hi [Name], thanks for ordering with Sleekblue Media Houz.  
> If you were happy with the print, could you leave a short review here:  
> https://www.sleekbluemedia.com (use the review form)  
> It helps other customers trust us. Thank you!

### Rules

- Never publish fake reviews.  
- Prefer real names or first name + city.  
- Remove phone numbers from review text before approve if they paste them.  
- Keep a backup: admin backup download includes reviews.

---

## 5. Order path — no-complaint rules

### Before launch day

- [ ] Place **one bank** order as a customer  
- [ ] Place **one Paystack** order (small amount) if Paystack is on  
- [ ] Confirm order appears in admin  
- [ ] Confirm customer gets clear next-step message (on-screen + WhatsApp if you use it)  

### During launch (ops)

| Event | Response time target |
|-------|----------------------|
| New order in admin | Acknowledge < 2 hours (business hours) |
| Payment confirmed | Update status; message customer |
| Print delay | Proactive WhatsApp — don’t wait for complaint |
| Wrong item risk | Confirm size/variant in chat for first-time buyers if unsure |

### Payment clarity (common complaint source)

On site and WhatsApp, state clearly:
1. How to pay (Paystack / bank / WhatsApp)  
2. What happens after pay  
3. Typical delivery / pickup timing  
4. Who to contact if stuck  

---

## 6. Friction checklist (fix these before ads)

| Friction | Fix |
|----------|-----|
| Empty content API | Fill admin content + testimonials |
| No promo banner | Set launch offer banner |
| Unclear prices | Fix product overrides / catalog |
| Broken images | Re-upload product/variant images |
| Deep link refresh fails | Confirm SPA + server fallback (already in server.js) |
| No human contact | Sticky WhatsApp / footer phone |
| Slow mobile | Compress images; rely on Hostinger CDN |
| Order but no follow-up | Daily admin order check ritual |

---

## 7. Daily launch ops (15–20 min)

Morning:
1. [ ] `/api/health`  
2. [ ] Admin → new orders  
3. [ ] Admin → pending reviews (approve/delete)  
4. [ ] WhatsApp unanswered chats  

Evening:
1. [ ] Count paid orders today  
2. [ ] Any complaint? Log + fix path  
3. [ ] One content post scheduled for tomorrow  

---

## 8. Complaint log (simple)

Keep a note (Google Sheet or book):

| Date | Issue | Customer | Root cause | Fix | Prevent next time |
|------|-------|----------|------------|-----|-------------------|
| | | | | | |

After launch week, top 3 causes → permanent FAQ or process change.

---

## 9. Tech still pending (don’t forget)

| Item | Why it matters for launch |
|------|---------------------------|
| Merge PR #15 + redeploy | Hardening (write locks, PM2 limits, richer health) |
| Confirm live health shows `uptimeSeconds` / `memory` / `paystackConfigured` | Ops visibility under traffic |
| `DATA_DIR` / `UPLOADS_DIR` already persistent | Keep using them — do not save orders only under `.builds` |

---

## 10. Definition of “ready for loud traffic”

All of the following:

1. [ ] Test order path works end-to-end  
2. [ ] `/api/content` is not empty (FAQ + trust + reviews section)  
3. [ ] ≥ 3 approved testimonials visible  
4. [ ] Promo banner shows launch offer + end date  
5. [ ] WhatsApp/phone visible  
6. [ ] Someone assigned to check orders + reviews daily  
7. [ ] Launch offer rules written (see LAUNCH_PLAYBOOK.md)  

When these are checked, push content and traffic.

---

## 11. Related docs

- [LAUNCH_PLAYBOOK.md](./LAUNCH_PLAYBOOK.md) — marketing calendar & scripts  
- [RISK_AND_TESTING.md](./RISK_AND_TESTING.md) — smoke tests  
- [DEPLOYMENT_DEVOPS.md](./DEPLOYMENT_DEVOPS.md) — deploy  
- [HANDOFF.md](./HANDOFF.md) — who does what  

---

*Smooth launch = filled CMS + working checkout + human follow-up + real testimonials. The code already supports reviews; the work now is configuration and daily ops.*
