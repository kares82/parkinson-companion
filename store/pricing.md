# Pricing

**Recommendation: free, with no in-app purchases.** Set in
`fastlane/Deliverfile` as `price_tier(0)`.

This is a judgement call, so here is the reasoning rather than just the number.

## Why free

**The growth channel is a clinician recommending it.** The GP who does home
visits for Parkinson's patients is worth more than any marketing, and a price is
the single biggest obstacle in that channel. A doctor hands out a free tool
without a second thought; recommending something patients must pay for feels
like selling to them, and many simply won't do it.

**There is nothing to recoup per user.** No server, no database, no per-user
cost. The app is a static file on Cloudflare Pages. The marginal cost of the
ten-thousandth user is zero, so the usual reason to charge does not apply.

**The realistic revenue does not justify the overhead.** Parkinson's affects
roughly 170,000 people in France and around 10 million worldwide, but a
French/English diary reaches a small fraction of that, and paid conversion on a
niche health utility is low single digits. Against that: a paid app requires
Apple's Paid Applications Agreement, banking details, tax forms, and income to
declare — real recurring admin for an amount that will not cover the time.

**A free app is materially less work to ship.** Free apps need only the standard
agreement; no banking, no tax setup. It removes an entire class of launch
blockers.

**It keeps the regulatory posture clean.** As set out in `regulatory.md`, the app
sits outside medical-device scope as a diary. Charging money strengthens the
framing of a commercial medical product, which is the direction you do not want
to travel while the classification rests on it being a record-keeping tool.

**The users are the wrong people to charge.** Elderly patients and unpaid family
carers, in a country where health tools are expected to be free at the point of
use.

## What this costs you

The Apple Developer Program is €99/year and the Play Console a one-off $25. Treat
those as the cost of the thing existing, not as something to earn back. If that
changes, revisit — but revisit with the options below, not with a paywall.

## If you later want revenue

In order of how well they fit this product:

1. **A "support the developer" tip.** A non-consumable in-app purchase that
   unlocks nothing. The app stays fully usable; people who find it valuable can
   pay. Least damage to the recommendation channel.
2. **A paid companion for professionals.** If GPs or clinics end up wanting
   multi-patient features, that is a different product with a different buyer,
   and one that can carry a price.
3. **Grants.** Parkinson's charities and foundations fund patient-facing tools.
   A free, open, no-data-collection app is exactly the kind of thing they fund,
   and it does not compromise the product.

## What not to do

- **No subscription.** There is no ongoing service to bill for — no server, no
  sync, no content. Apple scrutinises subscriptions that provide no recurring
  value, and users would be right to object.
- **Never gate the patient's own data.** Putting export, backup or the report
  behind a paywall means charging someone for access to their own health record.
  It is a bad look, it would harm people, and it undermines the reason a doctor
  would recommend it.
- **No ads.** Beyond the obvious tastelessness in a health context, ad SDKs
  collect data, which would destroy the "Data Not Collected" privacy label and
  the entire privacy story.
