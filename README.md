# Hawaiʻi, Well Planned

A responsive trip-planning page for Oʻahu, Maui, Hawaiʻi Island, Kauaʻi and Lānaʻi, built from the
"Hawaii Islands Trip Planner" PRD. Static HTML/CSS/JS, no build step.

## Run it

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

Any static host works (GitHub Pages, Vercel, Netlify).

## What's here

| PRD module | Where |
|---|---|
| 7.1 Island picker questionnaire (skippable, editable, surprise me) | `#picker`, `renderQuiz` / `scoreIsland` in `js/app.js` |
| 7.2 Island guide and comparison | `#islands` |
| 7.3 Traveling between islands (door-to-door calculator, operators, hop advice) | `#between` |
| 7.4 History of the islands | `#history` |
| 7.5 Best time to go / crowd guidance, flexible-range comparison | `#when` |
| 7.6 Weather: current, 10-day forecast, historical estimate beyond the window | `#weather` (Open-Meteo, no API key) |
| 7.7–7.9 Food, beaches, must-sees with filters, save, share, report | `#directory` |
| 7.10 Planner: area-grouped days, downtime, drive estimates, warnings, undo, share link, text/.ics export, print | `#planner` |
| 7.11 Essentials, stewardship, emergency links | `#essentials` |

Saved places and plans live in `localStorage` (anonymous, local-first). Share links encode the plan in the URL hash.

## Content status — read before launch

All content lives in `js/data.js`.

- **Food listings were checked against official sites on 2026-11-22** (see `HWP.foodChecks` at the end of
  `js/data.js`). 20 are confirmed; 3 are marked "Couldn't confirm it's open" (Hāliʻimaile General Store, Bar Acuda,
  Lānaʻi City Grille) and Punaluʻu Bake Shop is marked temporarily closed. The planner skips those four. Seven remain
  unverified: no official site (T. Komoda, Hamura Saimin), or the site blocked automated access or was unreachable
  (Da Poke Shack, Blue Ginger Café, Big Island Candies, Giovanni's, Ululani's).
- **13 food places were added from research** (Hawaii Magazine readers' polls, Honolulu Magazine, Frommer's,
  Food Network, travel guides; see `js/food-extra.js`). They cite their sources on the page but haven't been checked
  against official websites yet. Reddit couldn't be searched with the tools used.
- **Kauaʻi has 88 food listings.** About 60 were added from area round-ups and topic guides (breakfast,
  plate lunch, bars, burgers, tacos, sushi, food trucks); each cites the guide it came from. They are search-based
  and haven't been checked against official websites.
- **Food photos** in `images/food/` are from Wikimedia Commons; author and license for each are in `HWP.photos`
  and shown on the page. Keep the credits if you reuse them.
- **Beach and sight listings are drafts.** They have `verified: null`, so the UI shows "Not yet verified"
  and routes people to the official source. When a listing is checked, add
  `verified: { date: "YYYY-MM-DD", by: "reviewer" }` and the card will show the verification date.
- Street addresses and phone numbers are intentionally omitted until verified; cards link to a map search and the official site.
- Yelp links are search links, not matched listings, and are labeled as separate from editorial picks.
- **History content needs review** by Hawaiian cultural practitioners and local historians (PRD §7.4, §10).
- Inter-island routes and operators change often; confirm `HWP.routes` and `HWP.operators` against operator sites.

## Reports

The "Report an update" form posts JSON to `REPORT_ENDPOINT` at the top of `js/app.js`. Until that is set,
reports are stored only in the reporter's browser and the form says so.
