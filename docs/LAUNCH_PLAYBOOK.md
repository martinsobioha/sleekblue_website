# Sleekblue Media Houz — Website Launch Playbook

**Goal:** Make the site launch **loud** this month — clear offer, heavy content, real orders.  
**Constraint:** Prefer organic + micro-influencer + physical; no required new paid stack.  
**Site:** https://www.sleekbluemedia.com  
**Repo (fork):** `akameredon/sleekblue_website` → upstream `martinsobioha/sleekblue_website`

---

## 0. One-line message (use everywhere)

> **Sleekblue Media Houz is live online.**  
> Design, print, brand — order from your phone.  
> Launch offer: **[X]% off until [DATE]** + extra stickers on qualifying orders.  
> Refer a friend, both win.  
> No awoof — real print, real delivery.  
> **www.sleekbluemedia.com**

Brand line from brainstorm: **“I don’t carry Awoof come.”**  
= We don’t do fake freebies; we deliver real print and real value.

---

## 1. Pre-launch tech gate (do this first)

| # | Checkpoint | Owner | Done |
|---|------------|--------|------|
| 1 | PR merged to `martinsobioha/main` + Hostinger redeploy | Maintainer | [ ] |
| 2 | `GET /api/health` → ok, indexExists, paystackConfigured | Operator | [ ] |
| 3 | One full test order (bank or Paystack) → shows in admin | Operator | [ ] |
| 4 | Promo banner / offer dates set in admin CMS | Operator | [ ] |
| 5 | WhatsApp click-to-chat + phone visible on site | Operator | [ ] |
| 6 | Mobile homepage + product → cart path works | Operator | [ ] |

**Rule:** Do not scale ads or influencer pushes until rows 1–3 are green.

---

## 2. Launch offer (lock once, then repeat)

### Primary package (recommended)

| Element | Spec | Fill in |
|---------|------|---------|
| Discount | 10–15% on selected products or site-wide launch SKUs | ____ % |
| Window | 2–4 weeks hard end date | From ______ to ______ |
| Referral | Referrer **10%** next order; friend **10%** first order | Or: free extra stickers |
| Bonus | Extra stickers when order ≥ ₦______ | ₦______ |
| Name | e.g. *Sleekblue Launch Week* / *First Print Drop* | ______________ |

### Rules (publish with the offer)

1. Discount applies only to paid orders in the window.  
2. Referral reward only after friend’s order is **paid**.  
3. One referral reward per referred paid customer.  
4. No fake/self-referral.  
5. Offer ends **[DATE] 11:59 PM WAT** — no extensions without a new campaign name.

### Site execution

- [ ] Promo banner text + end date (`/api` promo-banner / admin)  
- [ ] Offer restated on homepage / store  
- [ ] Referral instructions (WhatsApp or code field — manual is OK for v1)  
- [ ] Staff unique codes list (spreadsheet)

---

## 3. Content pillars (produce in batches)

### A. Educate — shorten the journey

| Asset | Length | Script focus | Status |
|-------|--------|--------------|--------|
| Website demo | 60–90s | Home → product → cart → pay | [ ] |
| How to order in 5 steps | 45–60s | Tap-by-tap mobile | [ ] |
| Product samples on camera | 30–45s | Real print quality close-ups | [ ] |
| What’s on the site | 60s | Educative (Chidera-style) | [ ] |

### B. Entertain — skit / drama / dance

| Asset | Idea from team brainstorm | Status |
|-------|---------------------------|--------|
| Office drama | Disrespect / phone → punchline: order on Sleekblue, keep proof | [ ] |
| Football penalty | Keeper in **Sleekblue** shirt stops shots; shooter in “customer” shirt = we keep orders & deliver | [ ] |
| Dance + end card | Logo + URL + offer | [ ] |
| Temu-style cuts | Product → price → “order online” → URL (fast) | [ ] |

### C. Social proof

| Asset | Notes | Status |
|-------|--------|--------|
| Customer / friend shout-out | Small compensation: stickers or code | [ ] |
| Staff as micro-influencers | % or credit on tracked paid referrals | [ ] |
| Polytechnic MC clip | Short promo + URL | [ ] |

### D. Physical & brand wear

| Asset | Notes | Status |
|-------|--------|--------|
| Posters | URL + phone + offer end date | [ ] |
| Stickers | URL + phone; give as launch bonus | [ ] |
| Cap / tee mock or real | Website on apparel (Miracle-style energy; honest about AI mock if used) | [ ] |

**Safety:** Street marketing = posters/stickers on **allowed** surfaces and **consenting adults**. Do not involve children in risky stunts (e.g. tape on necks).

---

## 4. Channel plan

| Channel | Cadence in launch window | Owner |
|---------|--------------------------|--------|
| WhatsApp Status / groups | Daily offer or clip | |
| Instagram / Facebook Reels | 3–5 short videos / week | |
| TikTok | Same skits + demo | |
| Physical (campus, shops, poly) | Poster + sticker blitz Week 2–3 | |
| Micro-influencers (3–5 local) | Product/credit payment preferred | |
| Staff referral scheme | Codes live Week 1 | |
| Light paid boost | Only if budget appears; boost best organic clip | |

---

## 5. Micro-influencer & staff scheme

1. One **unique code or link** per person.  
2. Reward only on **paid** orders.  
3. Written rules in staff/creator chat (no fake orders).  
4. Optional weekly leaderboard.  
5. Cap monthly liability (max free stickers / max discount ₦).  

| Name | Code | Channel | Notes |
|------|------|---------|--------|
| | | | |
| | | | |
| | | | |

---

## 6. 30-day calendar

### Week 1 — Foundation
- [ ] Tech gate complete  
- [ ] Offer locked (numbers + dates)  
- [ ] Shoot: demo + 2 skits + samples  
- [ ] Design poster + sticker  
- [ ] Staff codes issued  

### Week 2 — Soft launch
- [ ] Message existing customers / WhatsApp lists  
- [ ] Publish demo + one skit  
- [ ] First testimonial  
- [ ] Posters at 2–3 priority locations  

### Week 3 — Loud push
- [ ] Dance / penalty / Temu-style drops  
- [ ] Micro-influencer posts go live  
- [ ] Daily Status + 1 feed post  
- [ ] Optional small ad boost on best performer  

### Week 4 — Close & convert
- [ ] “Ends [day]” urgency creative  
- [ ] More shout-outs  
- [ ] Count paid orders vs target  
- [ ] Decide what offer/content continues after launch  

---

## 7. Production scripts (short)

### 7.1 Website demo (60–90s)

1. Hook: “You can order Sleekblue print from your phone — watch.”  
2. Open site → pick product → show price.  
3. Add to cart → checkout fields.  
4. Pay (Paystack or bank instruction).  
5. CTA: “Link in bio — offer ends [DATE]. www.sleekbluemedia.com”

### 7.2 Football penalty (30–45s)

1. Shooter in plain/“customer” shirt takes penalties.  
2. Keeper in Sleekblue shirt saves.  
3. VO/text: “Every order — we keep it and we deliver.”  
4. End card: logo + URL + launch %.

### 7.3 Office / phone drama (45–60s)

1. Conflict beat (disrespect / missing phone energy).  
2. Cut: “Don’t stress — order branded print the clear way.”  
3. Show site + sample product.  
4. CTA + offer.

### 7.4 Temu-style (15–25s)

Fast cuts: product → detail → price → “Order online” → URL → offer end date.

---

## 8. Targets (set numbers as a team)

| Metric | Target this launch | Actual |
|--------|--------------------|--------|
| Paid orders | ______ | |
| Referral paid orders | ______ | |
| Content pieces published | ≥ 12 short videos | |
| Poster locations | ≥ ______ | |
| Micro-influencer posts | ≥ ______ | |

---

## 9. Roles

| Role | Name | Responsibilities |
|------|------|------------------|
| Launch lead | | Calendar, offer lock, daily check-in |
| Tech / site | | Health, banner, deploy |
| Content | | Shoot, edit, post |
| Physical | | Print, paste, campus |
| Influencer / staff codes | | Codes, tracking, rewards |
| Customer replies | | WhatsApp / comments |

---

## 10. Daily standup questions (15 min)

1. Tech still green?  
2. What content ships **today**?  
3. Any paid order issues?  
4. What blocks tomorrow?

---

## 11. After launch

- [ ] Turn off or rename offer (don’t leave expired % live)  
- [ ] Keep best 3 videos evergreen  
- [ ] Note top channel (WhatsApp vs IG vs TikTok)  
- [ ] Feed learnings into next promo  
- [ ] Confirm Phase 1 tech docs still accurate (`docs/`)

---

## 12. Related project docs

| Doc | Use |
|-----|-----|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | How the site runs |
| [ROADMAP.md](./ROADMAP.md) | Phase 1 vs later |
| [DEPLOYMENT_DEVOPS.md](./DEPLOYMENT_DEVOPS.md) | Ship safely |
| [RISK_AND_TESTING.md](./RISK_AND_TESTING.md) | Smoke tests before ads |
| [HANDOFF.md](./HANDOFF.md) | Onboard helpers fast |

---

## 13. Brainstorm backlog (from team notes — park here)

Use when core calendar is full:

- Digital “combing” / awareness talk series  
- Jesus-going-to-church style faith-friendly sketch (keep respectful)  
- Special gift / praise moment for loyal customers  
- “Wars” / challenge format between creators  
- Full micro-influencer academy scheme (scale after first 3–5 work)  
- Facebook ad sets once creative winners are known  

---

*Save this file in-repo so the whole team executes the same plan. Update checkboxes as you go. Loud launch = clear offer + shipped content + working checkout — not more tools.*
