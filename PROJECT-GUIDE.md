# Fundedapple Project Guide

## Start locally

Run `START-WEBSITE.bat`, or from this folder run:

```text
python -m http.server 8000
```

Open `http://localhost:8000/index.html`.

## Frontend ownership map

| Surface | Source of truth |
| --- | --- |
| Homepage section order | `js/loader.js` |
| Homepage content | `sections/*.html` |
| Homepage shared styling | `css/styles.css` |
| Homepage behavior and configurator state | `js/app.js` |
| Login | `login.html` and `css/login.css` |
| Create account | `create-account.html` |
| Password recovery | `forgot-password.html` |
| Challenge configuration | `checkout.html` |
| Final order review | `payment.html` |
| Trader dashboard | `dashboard.html` |
| Shared auth/checkout polish | `css/flow-polish.css` |
| Images and branding | `assets/` |

## Current data flow

The prototype uses browser `localStorage` until the backend is connected:

- `fundedappleAccount` stores the local account profile.
- `fundedappleLoggedIn` controls the prototype login gate.
- `fundedappleChallenge` stores the selected challenge after checkout.

This is demo-only state. It must move to server-side sessions and a database before production.

## Safe change workflow

1. Change content in `sections/` when the request is homepage copy or layout markup.
2. Change `css/styles.css` for homepage-wide visual changes.
3. Change the page file only for page-specific behavior or markup.
4. Keep pricing and rules in the existing JavaScript data objects until the backend API replaces them.
5. Validate the affected page at desktop and mobile widths after every change.

## Frontend readiness checklist before backend

- Replace placeholder alerts and toast messages with real product flows.
- Add proper loading, success, empty, error, and session-expired states.
- Add accessible labels, keyboard navigation, focus states, and form validation to every flow.
- Add real account, challenge, trading, payout, profile, and settings views.
- Add legal pages linked by signup (`terms.html`, `risk-disclosure.html`).
- Add a consistent notification and support experience.
- Replace emoji/placeholder icons with one consistent icon set.
- Add automated browser tests for signup, login, checkout, payment handoff, and dashboard gating.
- Connect the backend only after the frontend contracts and states are agreed.

## Reference-inspired product surfaces

FundedNext was reviewed for product ideas, not for copying its copy, assets, or visual identity. Its main frontend surfaces are:

- A clear hero promise with fast proof points and a primary challenge CTA.
- A local `trader-compass.svg` hero visual keeps the brand centered on rules, risk, edge, and payout.
- Challenge discovery with plan cards, account sizes, rules, platforms, and an interactive price summary.
- Reward proof with verified payout stories, aggregate totals, processing-time proof, and repeat-trader signals.
- Trust proof with awards, review links, company information, and transparent operating claims.
- Education and community entry points such as Discord, YouTube, trader stories, and learning content.
- Company and support proof with team presence, response-time expectations, contact options, and a searchable help center.
- Product innovation or beta-plan discovery for new challenge models.
- A persistent but restrained support entry point and a final conversion CTA.

## Fundedapple implementation order

1. Finish the current public flow: hero, challenge builder, rules, platform compatibility, testimonials, FAQ, and checkout states.
2. Add original trust surfaces using only verified Fundedapple data: payout proof, reviews, awards, legal entity, support hours, and team information.
3. Add community and education pages after the real channels and content are available.
4. Add authenticated trader surfaces: account overview, challenge metrics, trading history, payouts, documents, profile, and settings.
5. Replace localStorage with authenticated API contracts, server-side validation, payment webhooks, and audit logs.

Do not publish invented payout totals, awards, customer counts, response times, team sizes, or regulatory claims. Those numbers need source data before they appear in the UI.
