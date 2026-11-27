# GTM Engine

A client-scoped GTM workspace built from the *GTM Engine PRD*. It covers the pilot loop: intake → evidence → approved ICP →
accounts → contacts → reviewed outbound batch → outcomes → weekly brief, plus the learning inbox that feeds strategy changes back.

Static HTML/CSS/JS, no build step. Open `gtm/index.html` through any static server:

```sh
python3 -m http.server 8000   # then open http://localhost:8000/gtm/
node gtm/tests/engine.test.js # PRD acceptance checks for the core logic
```

## Using it

- **First launch** shows the blank template: create a client workspace or open the fictional sample client (Ledgerline).
- The left rail lists the eight pilot steps with progress. **Home** always shows the single next step or the highest-priority blocked batch.
- Every list starts with an empty state and one obvious action. CSV imports map columns automatically from common export
  headers (Databar, Clay, HubSpot, Smartlead) and show a preview before anything is written.
- `Ctrl K` searches the open client only.
- **Suggest with GTM Engine** (Setup, ICP, accounts and campaign brief) drafts the ICP's firmographics, triggers, disqualifiers and buyer personas, or a
  campaign brief and sequence, from the website, offer, notes and sources you entered. You pick what to keep; suggested criteria are
  labelled *Assumption* until you attach a source, and nothing is approved automatically. On the hosted version it runs with one click
  (powered by Claude); elsewhere it gives you a prompt to paste into an AI assistant and a box for the answer. The UI never names the model.

## What the PRD requirements map to

| PRD | Where |
|---|---|
| P01 tenant isolation | Each client is stored under its own key; only the open client is loaded; search, exports and approvals are scoped to it |
| P02 evidence provenance | Evidence & proof: date, owner, permission, origin ID; withdrawing a source flags dependent criteria and proof |
| P03 ICP versions | ICP editor: sourced-or-assumption criteria, approve/retire versions, change review, Databar recipe with manual research rules |
| P04 import & dedupe | Domain normalisation, idempotent re-import, subsidiaries / reused HubSpot IDs / missing domains go to manual resolution |
| P05 scoring | Known vs unresolved points, cutoff on verified points only, hard exclusions override, research queue |
| P06 contacts | Provider, verification, retrieval date; explicit dispositions; persona matching with an ambiguity queue |
| P07 grounded drafts | Personalization only from a dated, sourced trigger; inferred pain becomes a question; unverified or internal proof is withheld |
| P08 batch approval | Approval fingerprints audience + copy + channel + sender; any edit invalidates it; suppression rechecked at export; enrollment only from provider acknowledgement; retries send unresolved rows only |
| P09 events | Unique key per provider event; late events attribute to the original cohort; unmatched events wait for reconciliation; one reply task per contact and campaign |
| P10 learning | Distinct-origin evidence counts (2 / 5 / 10), contradictions, account concentration, versioned proposals with a write-time version check |
| P11 weekly brief | Funnel, rates with numerator / denominator ("Not computable" at zero), exclusions, spend, exceptions, one next test with an owner; Markdown export |
| P12 control & spend | Pause a client, approve enrichment spend against the budget cap, actual vs estimated vs unpriced costs, audit log |

`gtm/js/engine.js` holds all of that logic with no DOM access; the tests in `gtm/tests/` exercise the release-acceptance cases from PRD §5, §8, §9 and §10.

## Not built here (yet)

- **Live connectors.** Databar, Clay, HubSpot and Smartlead use the PRD's CSV fallback (same checks as an API payload). Claude drafting uses a copy-able,
  client-scoped context packet instead of an API key in the browser.
- **Server-side tenancy.** Data lives in the browser's local storage. Production needs the database, per-client deployments on verified domains, sign-in and
  n8n workflows described in PRD §3 and §6–7.
- **Content studio, Sizzle Reels, newsletter, call-transcript analysis and HubSpot MCP reporting** (PRD §7–8) are later modules.
