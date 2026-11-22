/* Hawaii, Well Planned: application logic (vanilla JS, no build step). */
(function () {
  "use strict";

  /* Set this to a URL that accepts POSTed JSON to receive content reports.
     Left empty, reports are kept in the reporter's browser and the UI says so. */
  const REPORT_ENDPOINT = "";

  const D = window.HWP;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const store = {
    get(k, d) { try { const v = localStorage.getItem("hwp:" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("hwp:" + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
  };

  /* ------------------------------------------------------------ lookups */
  const ISL = Object.fromEntries(D.islands.map((i) => [i.id, i]));
  const islandName = (id) => (ISL[id] ? ISL[id].name : id);
  if (D.foodAdded) D.foodAdded.forEach((p) => { if (!D.food.some((x) => x.id === p.id)) D.food.push(p); D.foodPlacement[p.id] = p.place; });
  if (D.foodSourceLinks) Object.entries(D.foodSourceLinks).forEach(([id, s]) => { const p = D.food.find((x) => x.id === id); if (p) p.sources = s; });
  D.food.forEach((p) => { p.kind2 = "food"; if (D.foodChecks && D.foodChecks[p.id]) Object.assign(p, D.foodChecks[p.id]); });
  D.beaches.forEach((p) => (p.kind2 = "beaches"));
  D.sights.forEach((p) => (p.kind2 = "sights"));
  const ALL = [...D.food, ...D.beaches, ...D.sights];
  const BY_ID = Object.fromEntries(ALL.map((p) => [p.id, p]));
  const DIM = Object.fromEntries(D.dimensions.map((d) => [d.id, d]));

  /* ------------------------------------------------------------ helpers */
  function hawaiiToday() {
    const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Honolulu", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    return p; // YYYY-MM-DD
  }
  function addDays(iso, n) {
    const [y, m, d] = iso.split("-").map(Number);
    const t = new Date(Date.UTC(y, m - 1, d + n));
    return t.toISOString().slice(0, 10);
  }
  function daysBetween(a, b) {
    const pa = a.split("-").map(Number), pb = b.split("-").map(Number);
    return Math.round((Date.UTC(pb[0], pb[1] - 1, pb[2]) - Date.UTC(pa[0], pa[1] - 1, pa[2])) / 86400000);
  }
  function fmtDate(iso, opts) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", Object.assign({ timeZone: "UTC", weekday: "short", month: "short", day: "numeric" }, opts || {}));
  }
  function km(a, b) {
    const R = 6371, toR = Math.PI / 180;
    const dLat = (b.lat - a.lat) * toR, dLon = (b.lon - a.lon) * toR;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  /* Drive-time estimate in minutes as a [low, high] range. Straight-line distance,
     a road-winding factor and island average speeds. Labeled as an estimate everywhere. */
  function drive(a, b) {
    if (!a || !b || a.lat == null || b.lat == null) return [0, 0];
    const factor = Math.max(a.roadFactor || 1, b.roadFactor || 1);
    const dist = km(a, b) * 1.35 * factor;
    if (dist < 1.5) return [0, 5];
    const mins = (dist / 48) * 60 + 5;
    return [Math.round(mins * 0.85 / 5) * 5 || 5, Math.round(mins * 1.35 / 5) * 5 || 10];
  }
  const fmtMins = (m) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? " " + (m % 60) + " min" : ""}`);
  const fmtRange = (r) => (r[1] <= 5 ? "under 5 min" : `${fmtMins(r[0])}–${fmtMins(r[1])}`);
  const mapUrl = (p) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`${p.name}, ${p.area}, ${ISL[p.island].plain}, HI`);
  const yelpUrl = (p) => "https://www.yelp.com/search?find_desc=" + encodeURIComponent(p.name) + "&find_loc=" + encodeURIComponent(`${p.area.split(",")[0]}, HI`);
  const priceLabel = (n) => ["", "$", "$$", "$$$", "$$$$"][n] || "";
  const priceBasis = (n) => ["", "typically under $20 per person", "about $20–40 per person", "about $40–75 per person", "typically over $75 per person"][n] || "";

  function toast(el, msg) {
    el.textContent = msg;
    clearTimeout(el._t);
    el._t = setTimeout(() => (el.textContent = ""), 3500);
  }
  async function copyText(text, statusEl) {
    try {
      await navigator.clipboard.writeText(text);
      if (statusEl) toast(statusEl, "Copied to clipboard.");
      return true;
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (e2) { ok = false; }
      ta.remove();
      if (statusEl) toast(statusEl, ok ? "Copied to clipboard." : "Couldn't copy automatically. Select the text and copy it.");
      return ok;
    }
  }
  function download(filename, text, type) {
    const blob = new Blob([text], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ------------------------------------------------------------ app state */
  const state = {
    saved: new Set(store.get("saved", [])),
    quiz: store.get("quiz", {}),
    quizStep: 0,
    quizShown: false,
    plan: store.get("plan", null),
    planInputs: store.get("planInputs", null),
    undo: [],
    dir: { kind: "food", island: "", q: "", price: "", meal: "", type: "", activity: "", category: "", easyOnly: false, savedOnly: false, sort: "editorial" },
  };
  const saveSaved = () => { store.set("saved", [...state.saved]); renderTripSummary(); };

  /* Fill static source links and dates */
  function fillStatic() {
    $$("[data-src]").forEach((a) => {
      const s = D.sources[a.dataset.src];
      if (s) { a.href = s.url; a.textContent = s.label; a.target = "_blank"; a.rel = "noopener"; }
    });
    $$("[data-content-date]").forEach((el) => (el.textContent = D.meta.contentDate));
    $("#editorialStatus").textContent = D.meta.editorialStatus;
  }

  /* =================================================================== QUIZ */
  const QUIZ = [
    { id: "nights", type: "range", q: "How many nights will you spend in Hawaiʻi?", min: 2, max: 21, def: 7 },
    { id: "visit", type: "one", q: "Have you been to Hawaiʻi before?", opts: [["first", "This is my first trip"], ["repeat", "I've been before", "We'll lean toward a different side of the islands"]] },
    { id: "interests", type: "many", q: "What matters most on this trip?", hint: "Pick up to three.", max: 3, opts: [["nature", "Nature and scenery", "Volcanoes, valleys, hikes, viewpoints"], ["beaches", "Beach and ocean time", "Swimming, snorkeling, lazy afternoons"], ["food", "Food", "Local favorites, markets, special meals"], ["culture", "Culture and history", "Museums, historic sites, learning"], ["nightlife", "Nightlife", "Bars, music, late dinners"]] },
    { id: "pace", type: "one", q: "What pace suits your group?", opts: [["relaxed", "Relaxed", "One plan a day and plenty of downtime"], ["balanced", "Balanced", "A couple of things a day"], ["full", "Full", "Early starts and packed days"]] },
    { id: "group", type: "one", q: "Who's traveling?", opts: [["adults", "Adults only"], ["kids", "Family with young children"], ["teens", "Family with teens"], ["multigen", "Multigenerational group"]] },
    { id: "mobility", type: "one", q: "Any mobility or access needs?", opts: [["none", "None"], ["some", "Limited walking or stairs"], ["wheel", "Wheelchair or mobility device user"]] },
    { id: "budget", type: "one", q: "What's your budget feel?", opts: [["value", "Value", "Stretch every dollar"], ["mid", "Mid-range"], ["splurge", "Splurge", "Resorts and special meals"]] },
    { id: "driving", type: "one", q: "How do you feel about driving?", opts: [["avoid", "I'd rather not drive much"], ["some", "A few drives are fine"], ["love", "Road trips are part of the fun"]] },
    { id: "hop", type: "one", q: "Would you consider more than one island?", opts: [["one", "One island is fine"], ["open", "Open to two if it makes sense"]] },
    { id: "vibe", type: "one", q: "Lively or quiet?", opts: [["lively", "Lively", "Restaurants, energy, things happening"], ["mixed", "A mix"], ["quiet", "Quiet", "Small towns and space"]] },
  ];

  function renderQuiz() {
    const el = $("#quiz");
    const i = state.quizStep;
    const q = QUIZ[i];
    const a = state.quiz;
    let body = "";
    if (q.type === "range") {
      const v = a[q.id] || q.def;
      body = `<div class="nights-out" id="nightsOut">${v} nights</div>
        <label for="quiz-${q.id}" class="small muted">Drag or use arrow keys</label>
        <input type="range" id="quiz-${q.id}" min="${q.min}" max="${q.max}" value="${v}">`;
    } else {
      const multi = q.type === "many";
      const cur = a[q.id];
      body = `${q.hint ? `<p class="small muted" style="margin:-.6rem 0 .6rem">${esc(q.hint)}</p>` : ""}<div class="options" role="${multi ? "group" : "radiogroup"}" aria-label="${esc(q.q)}">` +
        q.opts.map(([v, l, s], k) => {
          const checked = multi ? (cur || []).includes(v) : cur === v;
          return `<label class="opt" for="q-${q.id}-${k}"><input type="${multi ? "checkbox" : "radio"}" name="q-${q.id}" id="q-${q.id}-${k}" value="${v}" ${checked ? "checked" : ""}><span>${esc(l)}${s ? `<small>${esc(s)}</small>` : ""}</span></label>`;
        }).join("") + `</div>`;
    }
    el.innerHTML = `
      <div class="quiz-progress" aria-hidden="true">${QUIZ.map((_, k) => `<span class="${k <= i ? "done" : ""}"></span>`).join("")}</div>
      <p class="quiz-step">Question ${i + 1} of ${QUIZ.length}</p>
      <h2 id="quizQ" tabindex="-1">${esc(q.q)}</h2>
      ${body}
      <div class="quiz-nav">
        <button type="button" class="btn btn-ghost btn-sm" id="qBack" ${i === 0 ? "disabled" : ""}>Back</button>
        <div class="right">
          <button type="button" class="btn btn-ghost btn-sm" id="qSkip">${i === QUIZ.length - 1 ? "Skip" : "Skip"}</button>
          <button type="button" class="btn btn-sm" id="qNext">${i === QUIZ.length - 1 ? "See my match" : "Next"}</button>
        </div>
      </div>
      ${i > 0 && i < QUIZ.length - 1 ? `<p class="small" style="margin-top:.6rem"><button type="button" class="link-btn" id="qNow">See results with what I've answered</button></p>` : ""}`;

    if (q.type === "range") {
      const r = $("#quiz-" + q.id);
      r.addEventListener("input", () => { a[q.id] = +r.value; $("#nightsOut").textContent = r.value + " nights"; persistQuiz(); });
    } else {
      $$(`input[name="q-${q.id}"]`, el).forEach((inp) =>
        inp.addEventListener("change", () => {
          if (q.type === "many") {
            let vals = $$(`input[name="q-${q.id}"]:checked`, el).map((x) => x.value);
            if (vals.length > q.max) { inp.checked = false; vals = vals.filter((v) => v !== inp.value); }
            a[q.id] = vals;
          } else a[q.id] = inp.value;
          persistQuiz();
        })
      );
    }
    $("#qBack").onclick = () => { state.quizStep = Math.max(0, i - 1); renderQuiz(); $("#quizQ").focus(); };
    const next = () => {
      if (q.type === "range" && !a[q.id]) { a[q.id] = q.def; persistQuiz(); }
      if (i < QUIZ.length - 1) { state.quizStep = i + 1; renderQuiz(); $("#quizQ").focus(); }
      else showResults();
    };
    $("#qNext").onclick = next;
    $("#qSkip").onclick = () => { if (q.type !== "range") delete a[q.id]; persistQuiz(); if (i < QUIZ.length - 1) { state.quizStep = i + 1; renderQuiz(); $("#quizQ").focus(); } else showResults(); };
    if ($("#qNow")) $("#qNow").onclick = showResults;
  }
  function persistQuiz() { store.set("quiz", state.quiz); if (state.quizShown) renderResults(); }
  function showResults() {
    state.quizShown = true;
    renderResults();
    $("#quizResult").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scoreIsland(isl, a) {
    const s = isl.scores, c = [];
    const add = (pts, label) => { if (pts) c.push({ pts, label }); };
    (a.interests || []).forEach((k) => add((s[k] - 3) * 3, `You prioritized ${DIM[k].label.toLowerCase()}: ${isl.name} rates ${s[k]}/5`));
    if (["kids", "teens", "multigen"].includes(a.group)) add((s.family - 3) * 2, `Family fit rates ${s.family}/5`);
    if (a.mobility === "some") add((s.accessibility - 3) * 2, `Accessibility rates ${s.accessibility}/5`);
    if (a.mobility === "wheel") add((s.accessibility - 3) * 3, `Accessibility rates ${s.accessibility}/5`);
    if (a.budget === "value") add((3 - s.cost) * 2, s.cost >= 4 ? "Tends to be expensive" : `Cost level ${s.cost}/5 suits a value budget`);
    if (a.budget === "splurge") add(s.cost - 3, "Strong resort and splurge options");
    if (a.driving === "avoid") add((s.lowDriving - 3) * 2.5, s.lowDriving >= 4 ? "Easy to enjoy with little driving" : "Most sights need long drives");
    if (a.driving === "love") add((3 - s.lowDriving) * 1.5, "Rewards road trips");
    if (a.vibe === "lively") add((3 - s.quiet) * 2, s.quiet <= 2 ? "Lively, with lots going on" : "Quieter than you asked for");
    if (a.vibe === "quiet") add((s.quiet - 3) * 2, s.quiet >= 4 ? "Calm, small-town feel" : "Busier than you asked for");
    if (a.pace === "relaxed") add(s.lowDriving - 3, s.lowDriving >= 4 ? "Short distances suit a relaxed pace" : "Distances can make a relaxed pace harder");
    if (a.visit === "first") {
      if (isl.id === "oahu" || isl.id === "maui") add(2, "Easy first-visit logistics and range of options");
      if (isl.id === "lanai") add(-4, "Better as an add-on or a return trip");
    }
    if (a.visit === "repeat" && (isl.id === "kauai" || isl.id === "hawaii" || isl.id === "lanai")) add(1, "A different side of Hawaiʻi for repeat visitors");
    const nights = a.nights || 7;
    if (nights < isl.minStayNights) add(-(isl.minStayNights - nights) * 2, `${nights} nights is short for the suggested ${isl.minStay}`);
    const total = c.reduce((t, x) => t + x.pts, 0);
    return { isl, total, c };
  }

  function rankIslands(a) {
    const r = D.islands.map((i) => scoreIsland(i, a)).sort((x, y) => y.total - x.total);
    const max = r[0].total, min = r[r.length - 1].total;
    r.forEach((x) => (x.pct = Math.round(35 + 65 * ((x.total - min) / ((max - min) || 1)))));
    return r;
  }

  function answerSummary(a) {
    return QUIZ.map((q, k) => {
      let v = a[q.id];
      if (v == null || (Array.isArray(v) && !v.length)) return `<button type="button" class="btn btn-ghost btn-sm" data-edit="${k}">${esc(q.id === "interests" ? "Interests" : q.q.replace(/\?$/, ""))}: skipped</button>`;
      if (q.type === "range") v = v + " nights";
      else if (q.type === "many") v = v.map((x) => DIM[x].label).join(", ");
      else v = (q.opts.find((o) => o[0] === v) || [, v])[1];
      return `<button type="button" class="btn btn-ghost btn-sm" data-edit="${k}" aria-label="Edit answer: ${esc(q.q)} (currently ${esc(v)})">${esc(v)} ✎</button>`;
    }).join(" ");
  }

  function renderResults(surpriseId) {
    const el = $("#quizResult");
    const a = state.quiz;
    if (surpriseId) {
      const isl = ISL[surpriseId];
      el.innerHTML = `<div class="match-grid"><div class="card match primary">
        <p class="rank">Surprise pick</p><h3>${esc(isl.name)}</h3><p>${esc(isl.lede)}</p>
        <div class="why"><h4>Who tends to love it</h4><p>${esc(isl.bestFor)}</p></div>
        <div class="why"><h4>Who may prefer another island</h4><p>${esc(isl.preferAnother)}</p></div>
        <div class="result-actions"><button class="btn btn-sm" type="button" data-plan-island="${isl.id}">Plan ${esc(isl.name)}</button><button class="btn btn-ghost btn-sm" type="button" data-browse="${isl.id}">See places</button><button class="btn btn-ghost btn-sm" type="button" id="surpriseAgain">Another surprise</button></div>
      </div></div>`;
      $("#surpriseAgain").onclick = surprise;
      wireResultActions(el);
      return;
    }
    const r = rankIslands(a);
    const top = r.slice(0, 3);
    const nights = a.nights || 7;
    const card = (x, idx) => {
      const pos = x.c.filter((k) => k.pts > 0).sort((p, q) => q.pts - p.pts).slice(0, 3);
      const neg = x.c.filter((k) => k.pts < 0).sort((p, q) => p.pts - q.pts).slice(0, 2);
      const weak = (a.interests || []).filter((k) => x.isl.scores[k] <= 2).map((k) => `Weaker for ${DIM[k].label.toLowerCase()}`);
      const trade = [...neg.map((k) => k.label), ...weak].slice(0, 3);
      return `<div class="card match ${idx === 0 ? "primary" : ""}">
        <p class="rank">${idx === 0 ? "Best match" : "Alternative " + idx}</p>
        <h3>${esc(x.isl.name)}</h3>
        <p class="small muted">Relative fit for your answers</p>
        <div class="match-meter" role="img" aria-label="Relative fit ${x.pct} out of 100"><span style="width:${x.pct}%"></span></div>
        <p style="margin-top:.6rem">${esc(x.isl.lede)}</p>
        <div class="why"><h4>Why it fits</h4>${pos.length ? `<ul>${pos.map((k) => `<li>${esc(k.label)}</li>`).join("")}</ul>` : `<p class="small muted">Answer a few more questions to see reasons.</p>`}</div>
        <div class="why"><h4>Tradeoffs</h4><ul>${(trade.length ? trade : [x.isl.preferAnother]).map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>
        <p class="small muted" style="margin-top:.6rem">Suggested stay: ${esc(x.isl.minStay)} (estimate)</p>
        <div class="result-actions"><button class="btn btn-sm" type="button" data-plan-island="${x.isl.id}">Plan ${esc(x.isl.name)}</button><button class="btn btn-ghost btn-sm" type="button" data-browse="${x.isl.id}">See places</button></div>
      </div>`;
    };
    let combo = "";
    const p = top[0].isl;
    if (a.hop === "open") {
      if (nights >= 9) {
        const partner = (p.id === "maui" ? top.find((x) => x.isl.id !== "maui") : top.find((x) => x.isl.id !== p.id && x.isl.id !== "lanai")).isl;
        const route = findRoute(p.id, partner.id);
        const n1 = Math.round(nights * (p.minStayNights / (p.minStayNights + partner.minStayNights)));
        combo = `<p class="result-note"><strong>Two-island option:</strong> ${esc(p.name)} (${n1} nights) + ${esc(partner.name)} (${nights - n1} nights). The transfer (${esc(route.via)}) takes about ${route.doorToDoor[0]}–${route.doorToDoor[1]} hours door to door. <a href="#between" style="color:inherit">See the transfer breakdown</a>.</p>`;
      } else if (p.id === "maui" && nights >= 5) {
        combo = `<p class="result-note"><strong>Easy add-on:</strong> with ${nights} nights, stay on Maui and consider a Lānaʻi day trip by ferry instead of a second base.</p>`;
      } else {
        combo = `<p class="result-note"><strong>We suggest one island.</strong> With ${nights} nights, a second island would use about half a day or more in transit, plus repacking and a second rental car.</p>`;
      }
    } else if (nights >= 12) {
      combo = `<p class="result-note"><strong>Plenty of time.</strong> ${nights} nights on one island is a relaxed trip. If you change your mind, two islands also fit.</p>`;
    }
    el.innerHTML = `
      <h2 style="color:var(--hero-ink);font-size:var(--step-2);margin-bottom:.4rem">Your island match</h2>
      <p class="result-note" style="margin-top:0">These suggestions reflect your answers and our editorial scores. They aren't an objective ranking. Change any answer and the results update.</p>
      <div class="hero-actions" style="margin:.6rem 0 1rem">${answerSummary(a)}</div>
      <div class="match-grid">${top.map(card).join("")}</div>
      ${combo}
      <p class="result-note">Not convinced? <a href="#islands" style="color:inherit">Compare all five islands</a>.</p>`;
    $$("[data-edit]", el).forEach((b) => (b.onclick = () => { state.quizStep = +b.dataset.edit; renderQuiz(); $("#picker").scrollIntoView({ behavior: "smooth" }); setTimeout(() => $("#quizQ").focus(), 300); }));
    wireResultActions(el);
  }
  function wireResultActions(root) {
    $$("[data-plan-island]", root).forEach((b) => (b.onclick = () => startPlanFor(b.dataset.planIsland)));
    $$("[data-browse]", root).forEach((b) => (b.onclick = () => browseIsland(b.dataset.browse)));
  }
  function surprise() {
    const ids = D.islands.map((i) => i.id);
    const cur = $("#quizResult .match h3") ? $("#quizResult .match h3").textContent : "";
    let pick;
    do { pick = ids[Math.floor(Math.random() * ids.length)]; } while (ISL[pick].name === cur);
    renderResults(pick);
    $("#quizResult").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ============================================================ COMPARE */
  function renderCompare() {
    const sortSel = $("#compareSort");
    sortSel.innerHTML = `<option value="">Default order</option>` + D.dimensions.map((d) => `<option value="${d.id}">${esc(d.label)}</option>`).join("");
    const draw = () => {
      const sort = sortSel.value, nights = +$("#compareNights").value || 0;
      const list = [...D.islands];
      if (sort) list.sort((a, b) => b.scores[sort] - a.scores[sort]);
      const dots = (n, label) => `<span class="dots" aria-hidden="true">${[1, 2, 3, 4, 5].map((k) => `<i class="${k <= n ? "on" : ""}"></i>`).join("")}</span><span class="dots-label">${label}: ${n} of 5</span>`;
      $("#compareTable").innerHTML = `<caption class="dots-label">Island comparison, editorial scores 1 to 5</caption>
        <thead><tr><th scope="col">Island</th>${D.dimensions.map((d) => `<th scope="col" class="${sort === d.id ? "sorted" : ""}" title="${esc(d.hint)}">${esc(d.label)}</th>`).join("")}<th scope="col">Suggested stay</th></tr></thead>
        <tbody>${list.map((i) => {
          const dim = nights && i.minStayNights > nights + 1;
          return `<tr class="${dim ? "dim" : ""}"><th scope="row"><a href="#isl-${i.id}">${esc(i.name)}</a></th>${D.dimensions.map((d) => `<td class="${sort === d.id ? "sorted" : ""}">${dots(i.scores[d.id], d.label)}</td>`).join("")}<td class="small">${esc(i.minStay)}${dim ? `<br><span class="badge badge-warn">Tight for this trip</span>` : ""}</td></tr>`;
        }).join("")}</tbody>`;
    };
    sortSel.onchange = draw;
    $("#compareNights").onchange = draw;
    draw();

    $("#islandCards").innerHTML = D.islands.map((i) => `
      <article class="card island-card" id="isl-${i.id}">
        <h3>${esc(i.name)}</h3>
        <p class="nick">${esc(i.nickname)}</p>
        <p style="margin-top:.5rem">${esc(i.lede)}</p>
        <dl>
          <div><dt>Best fit</dt><dd>${esc(i.bestFor)}</dd></div>
          <div><dt>May prefer another island</dt><dd>${esc(i.preferAnother)}</dd></div>
          <div><dt>Suggested minimum stay (estimate)</dt><dd>${esc(i.minStay)}</dd></div>
        </dl>
        <details>
          <summary>Food, landscape, bases and logistics</summary>
          <dl>
            <div><dt>Distinctive experiences</dt><dd>${i.experiences.map(esc).join(" · ")}</dd></div>
            <div><dt>Food identity</dt><dd>${esc(i.food)}</dd></div>
            <div><dt>Landscape</dt><dd>${esc(i.landscape)}</dd></div>
            <div><dt>Pace</dt><dd>${esc(i.pace)}</dd></div>
            <div><dt>Where to base yourself</dt><dd><ul style="margin:0;padding-left:1.1rem">${i.bases.map((b) => `<li><b>${esc(b.name)}</b>: ${esc(b.note)}</li>`).join("")}</ul></dd></div>
            <div><dt>Getting around</dt><dd>${esc(i.transport)}</dd></div>
            <div><dt>Accessibility</dt><dd>${esc(i.access)} <span class="badge badge-warn">Verify specifics</span></dd></div>
            <div><dt>Families</dt><dd>${esc(i.family)}</dd></div>
            <div><dt>Seasons and crowds</dt><dd>${esc(i.seasonality)} <span class="small muted">Reviewed ${D.meta.contentDate}; see <a href="#when">When to go</a>.</span></dd></div>
            <div><dt>Airports</dt><dd>${i.airports.map((c) => `<span class="mono">${c}</span> ${esc(D.airports[c].name)}`).join("<br>")}</dd></div>
          </dl>
        </details>
        <div class="actions">
          <button type="button" class="btn btn-sm" data-plan-island="${i.id}">Plan ${esc(i.name)}</button>
          <button type="button" class="btn btn-ghost btn-sm" data-browse="${i.id}">See places</button>
          <a class="btn btn-ghost btn-sm" href="${i.gohawaii}" target="_blank" rel="noopener">Official visitor info ↗</a>
        </div>
      </article>`).join("");
    wireResultActions($("#islandCards"));
  }

  /* ============================================================ BETWEEN */
  function findRoute(a, b) {
    return D.routes.find((r) => (r.a === a && r.b === b) || (r.a === b && r.b === a));
  }
  function transferSteps(route) {
    return D.transferSteps.map((s) => (s.id === "flight" ? Object.assign({}, s, { min: route.flight, max: route.flight + 25 }) : s));
  }
  function renderBetween() {
    const opts = D.islands.map((i) => `<option value="${i.id}">${esc(i.name)}</option>`).join("");
    $("#routeFrom").innerHTML = opts; $("#routeTo").innerHTML = opts;
    $("#routeFrom").value = "oahu"; $("#routeTo").value = "maui";
    const draw = () => {
      const a = $("#routeFrom").value, b = $("#routeTo").value;
      if (a === b) { $("#routeOut").innerHTML = `<p class="callout">Pick two different islands.</p>`; return; }
      const r = findRoute(a, b);
      const steps = transferSteps(r);
      const lo = steps.reduce((t, s) => t + s.min, 0), hi = steps.reduce((t, s) => t + s.max, 0);
      const colors = (s) => (s.id === "flight" ? "var(--lehua)" : s.id === "buffer" ? "var(--warn)" : "var(--accent)");
      $("#routeOut").innerHTML = `
        <p style="margin-top:.75rem"><b>${esc(islandName(a))} → ${esc(islandName(b))}</b> · <span class="mono">${esc(r.via)}</span></p>
        <p class="small muted">${esc(r.note)}</p>
        <div class="timeline-bar" role="img" aria-label="Transfer timeline: the ${r.flight}-minute flight is a small share of ${fmtMins(lo)} to ${fmtMins(hi)} total">
          ${steps.map((s, k) => `<span style="flex:${s.min};background:${colors(s)};opacity:${s.id === "flight" ? 1 : k % 2 ? .55 : .8}" title="${esc(s.label)}"></span>`).join("")}
        </div>
        <ol class="steps">${steps.map((s, k) => `<li><span class="sw" style="background:${colors(s)};opacity:${s.id === "flight" ? 1 : k % 2 ? .55 : .8}"></span><span>${esc(s.label)}</span><span class="t">${s.min}–${s.max} min</span></li>`).join("")}</ol>
        <div class="total"><span>Door to door (estimate)</span><span class="mono">${fmtMins(lo)} – ${fmtMins(hi)}</span></div>
        <p class="small muted" style="margin-top:.5rem">Estimates only. Check-in cutoffs and recommended arrival times vary by airline; follow the operator's guidance. Agricultural inspection applies when leaving for the mainland, not between islands.</p>
        <h4 style="margin-top:1rem">Operators that may serve this route</h4>
        <ul class="linklist">${r.operators.map((id) => { const o = D.operators.find((x) => x.id === id); return `<li><a href="${o.url}" target="_blank" rel="noopener">${esc(o.name)}</a> <span class="small muted">${esc(o.kind)}</span></li>`; }).join("")}</ul>
        <p class="small"><span class="badge badge-warn">Not yet verified</span> Route availability for your date must be confirmed with the operator.</p>`;
    };
    $("#routeFrom").onchange = draw; $("#routeTo").onchange = draw;
    draw();

    $("#operatorList").innerHTML = D.operators.map((o) => `<li><a href="${o.url}" target="_blank" rel="noopener"><b>${esc(o.name)}</b></a><span class="small muted">${esc(o.kind)}. ${esc(o.note)}</span></li>`).join("") +
      `<li><a href="${D.sources.airports.url}" target="_blank" rel="noopener"><b>Hawaiʻi airports (HDOT)</b></a><span class="small muted">Airport alerts, parking and terminal information.</span></li>`;

    // Transit share of waking hours: 5 h per transfer, 14 waking hours a day, arrival/departure days excluded.
    const rows = [5, 7, 10, 14].map((n) => {
      const waking = (n - 1) * 14;
      const cells = [1, 2, 3].map((isl) => {
        const t = (isl - 1) * 5;
        const pct = Math.round((t / waking) * 100);
        const perIsl = n / isl;
        const cls = isl === 1 ? "badge-ok" : perIsl < 3 ? "badge-bad" : perIsl < 4.5 ? "badge-warn" : "badge-ok";
        const word = isl === 1 ? "No transfers" : perIsl < 3 ? "Not advised" : perIsl < 4.5 ? "Tight" : "Workable";
        return `<td><span class="badge ${cls}">${word}</span>${isl > 1 ? `<br><span class="small mono">${pct}% of waking hours</span>` : ""}</td>`;
      }).join("");
      return `<tr><th scope="row">${n} nights</th>${cells}</tr>`;
    }).join("");
    $("#hopAdvice").innerHTML = `<div class="table-scroll"><table class="compare" style="min-width:0"><thead><tr><th scope="col">Trip</th><th scope="col">1 island</th><th scope="col">2 islands</th><th scope="col">3 islands</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="small muted" style="margin-top:.5rem">Assumes about 5 hours per transfer and 14 waking hours a day. Each extra island also adds repacking, a second rental, and lodging check-in times. A rule of thumb: at least 4 nights per island.</p>`;
  }

  /* =============================================================== WHEN */
  function renderWhen() {
    const strip = $("#monthStrip");
    const now = new Date().getMonth();
    strip.innerHTML = D.months.map((m, k) => `<button type="button" role="listitem" class="month" data-m="${k}" aria-pressed="${k === now}" aria-label="${m.m}: ${["", "often quieter", "moderate", "often busy"][m.demand]}"><span class="bar"><i class="d${m.demand}"></i></span><b>${m.m}</b></button>`).join("");
    strip.insertAdjacentHTML("afterend", `<div class="legend"><span><i style="background:var(--ok);opacity:.7"></i>Often quieter</span><span><i style="background:var(--warn);opacity:.65"></i>Moderate</span><span><i style="background:var(--lehua);opacity:.7"></i>Often busy</span><span>General pattern, all islands</span></div>`);
    const detail = (k) => {
      const m = D.months[k];
      $("#monthDetail").innerHTML = `<h3>${new Date(2000, k, 1).toLocaleString("en-US", { month: "long" })}</h3>
        <p><span class="badge ${["", "badge-ok", "badge-warn", "badge-bad"][m.demand]}">${["", "Often quieter", "Moderate", "Often busy"][m.demand]}</span> <span class="badge">General guidance</span></p>
        <p style="margin-top:.6rem">${esc(m.note)}</p>
        <p class="small muted" style="margin-top:.6rem">Flight and resort prices usually follow demand. Event dates change yearly, so check the event's own site. No month guarantees empty beaches or trails.</p>`;
      $$(".month", strip).forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.m === k)));
    };
    $$(".month", strip).forEach((b) => (b.onclick = () => detail(+b.dataset.m)));
    detail(now);

    const mOpts = D.months.map((m, k) => `<option value="${k}">${m.m}</option>`).join("");
    const defaults = [[4, 4], [8, 9], [11, 11]];
    $("#rangeCompare").innerHTML = defaults.map((d, k) => `<div class="range-row"><select aria-label="Window ${k + 1} start month" id="rs${k}">${mOpts}</select><select aria-label="Window ${k + 1} end month" id="re${k}">${mOpts}</select><span class="range-score" id="rv${k}"></span></div>`).join("") +
      `<p class="small muted" style="margin-top:.6rem">Average of the monthly pattern above. Holidays inside a window can still make specific weeks busy.</p>`;
    defaults.forEach((d, k) => {
      $("#rs" + k).value = d[0]; $("#re" + k).value = d[1];
      const upd = () => {
        let s = +$("#rs" + k).value, e = +$("#re" + k).value, sum = 0, n = 0;
        for (let i = s; ; i = (i + 1) % 12) { sum += D.months[i].demand; n++; if (i === e || n > 12) break; }
        const avg = sum / n;
        const [cls, w] = avg < 1.6 ? ["badge-ok", "Often quieter"] : avg < 2.4 ? ["badge-warn", "Mixed"] : ["badge-bad", "Often busy"];
        $("#rv" + k).innerHTML = `<span class="badge ${cls}">${w}</span>`;
      };
      $("#rs" + k).onchange = upd; $("#re" + k).onchange = upd; upd();
    });
    $("#crowdTips").innerHTML = D.crowdTips.map((t) => `<li>${esc(t)}</li>`).join("");
  }

  /* ============================================================ WEATHER */
  const WMO = (c) => {
    if (c === 0) return "Clear"; if (c === 1) return "Mostly clear"; if (c === 2) return "Partly cloudy"; if (c === 3) return "Cloudy";
    if (c === 45 || c === 48) return "Fog"; if (c >= 51 && c <= 57) return "Drizzle"; if (c >= 61 && c <= 67) return "Rain";
    if (c >= 71 && c <= 77) return "Snow (summits)"; if (c >= 80 && c <= 82) return "Showers"; if (c >= 95) return "Thunderstorms"; return "—";
  };
  const wxCache = {};
  async function getJSON(url) {
    if (wxCache[url]) return wxCache[url];
    const p = fetch(url).then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
    wxCache[url] = p;
    p.catch(() => delete wxCache[url]);
    return p;
  }
  function forecastUrl(a) {
    return `https://api.open-meteo.com/v1/forecast?latitude=${a.lat}&longitude=${a.lon}${a.elevation ? "&elevation=" + a.elevation : ""}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=Pacific%2FHonolulu&forecast_days=10`;
  }
  function climateUrl(a, y0, y1) {
    return `https://archive-api.open-meteo.com/v1/archive?latitude=${a.lat}&longitude=${a.lon}${a.elevation ? "&elevation=" + a.elevation : ""}&start_date=${y0}-01-01&end_date=${y1}-12-31&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&temperature_unit=fahrenheit&precipitation_unit=inch&timezone=Pacific%2FHonolulu`;
  }
  const pct = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.max(0, Math.round((s.length - 1) * p)))]; };

  function renderWeatherControls() {
    $("#wxIsland").innerHTML = D.islands.map((i) => `<option value="${i.id}">${esc(i.name)}</option>`).join("");
    const startDef = (state.planInputs && state.planInputs.start) || addDays(hawaiiToday(), 3);
    $("#wxStart").value = startDef;
    if (state.planInputs && state.planInputs.nights) $("#wxNights").value = state.planInputs.nights;
    const drawAreas = () => {
      const isl = ISL[$("#wxIsland").value];
      $("#wxAreas").innerHTML = isl.weatherAreas.map((k, n) => `<label class="chip" for="wxa-${k}"><input type="checkbox" id="wxa-${k}" value="${k}" ${n < 2 ? "checked" : ""}><span>${esc(D.weatherAreas[k].name)}</span></label>`).join("");
      $$("#wxAreas input").forEach((i) => (i.onchange = loadWeather));
      loadWeather();
    };
    $("#wxIsland").onchange = drawAreas;
    $("#wxStart").onchange = loadWeather;
    $("#wxNights").onchange = loadWeather;
    drawAreas();
  }

  let wxSeq = 0;
  async function loadWeather() {
    const seq = ++wxSeq;
    const out = $("#wxOut");
    const keys = $$("#wxAreas input:checked").map((i) => i.value);
    if (!keys.length) { out.innerHTML = `<p class="callout">Choose at least one area to see weather.</p>`; return; }
    const start = $("#wxStart").value || hawaiiToday();
    const nights = Math.max(1, Math.min(30, +$("#wxNights").value || 7));
    const end = addDays(start, nights);
    const today = hawaiiToday();
    const fEnd = addDays(today, 9);
    out.innerHTML = keys.map((k) => `<div class="card wx-area" id="wx-${k}"><h3>${esc(D.weatherAreas[k].name)}</h3><p class="muted small">Loading weather…</p></div>`).join("");

    for (const k of keys) {
      const a = D.weatherAreas[k];
      const box = () => $("#wx-" + k);
      let html = `<div class="wx-head"><h3>${esc(a.name)}</h3><span class="small muted">${esc(islandName(a.island))}${a.elevation ? ` · about ${a.elevation.toLocaleString()} m elevation` : ""}</span></div>`;
      let forecast = null, err = null;
      try { forecast = await getJSON(forecastUrl(a)); } catch (e) { err = e; }
      if (seq !== wxSeq) return;
      if (forecast) {
        const c = forecast.current;
        const t = c.time.replace("T", " ");
        html += `<p class="wx-kind" style="margin-top:.6rem"><span class="badge badge-conf">Current conditions</span><span class="small muted">Model analysis for ${esc(t)} HST · Open-Meteo. For station observations see <a href="${D.sources.nwsHfo.url}" target="_blank" rel="noopener">NWS Honolulu</a>.</span></p>
          <div class="wx-current"><span class="wx-temp">${Math.round(c.temperature_2m)}°F</span>
          <span class="wx-meta">${esc(WMO(c.weather_code))}<br>Feels like ${Math.round(c.apparent_temperature)}°F · Humidity ${c.relative_humidity_2m}%<br>Wind ${Math.round(c.wind_speed_10m)} mph, gusts ${Math.round(c.wind_gusts_10m)} mph</span></div>`;
        const d = forecast.daily;
        html += `<p class="wx-kind" style="margin-top:1rem"><span class="badge badge-ok">10-day forecast</span><span class="small muted">Issued from model data via Open-Meteo. Less certain after day 3–5. Trip days are outlined.</span></p>
          <div class="wx-days">${d.time.map((day, n) => `<div class="wx-day ${day >= start && day <= end ? "in-trip" : ""}"><b>${esc(fmtDate(day, { weekday: "short", month: "numeric", day: "numeric" }))}</b><span>${esc(WMO(d.weather_code[n]))}</span><br><span class="hi">${Math.round(d.temperature_2m_max[n])}°</span> <span class="lo">${Math.round(d.temperature_2m_min[n])}°</span><span class="rain">${d.precipitation_probability_max[n] ?? "–"}% rain</span><span class="small muted">wind ${Math.round(d.wind_speed_10m_max[n])} mph</span></div>`).join("")}</div>`;
      } else {
        html += `<div class="callout warn" style="margin-top:.75rem"><strong>Live weather couldn't load.</strong> Your connection or this page's host blocked the weather service. Check the <a href="${D.sources.nwsHfo.url}" target="_blank" rel="noopener">National Weather Service Honolulu forecast</a> directly.</div>`;
      }

      // Historical estimate for trip days beyond the forecast window
      const beyondStart = start > fEnd ? start : addDays(fEnd, 1);
      if (end > fEnd) {
        try {
          const y1 = +today.slice(0, 4) - 1, y0 = y1 - 9;
          const hist = await getJSON(climateUrl(a, y0, y1));
          if (seq !== wxSeq) return;
          const span = Math.min(daysBetween(beyondStart, end), 30);
          const mds = new Set(); for (let n = 0; n <= span; n++) mds.add(addDays(beyondStart, n).slice(5));
          const hiA = [], loA = [], rA = [];
          hist.daily.time.forEach((day, n) => { if (mds.has(day.slice(5)) && hist.daily.temperature_2m_max[n] != null) { hiA.push(hist.daily.temperature_2m_max[n]); loA.push(hist.daily.temperature_2m_min[n]); rA.push(hist.daily.precipitation_sum[n] || 0); } });
          if (hiA.length) {
            const wetDays = Math.round((rA.filter((r) => r >= 0.1).length / rA.length) * 100);
            const avgRain = (rA.reduce((s, x) => s + x, 0) / rA.length).toFixed(2);
            html += `<p class="wx-kind" style="margin-top:1rem"><span class="badge badge-warn">Historical estimate, not a forecast</span><span class="small muted">${esc(fmtDate(beyondStart))} – ${esc(fmtDate(end))} · same calendar dates ${y0}–${y1} · ERA5 reanalysis via Open-Meteo</span></p>
              <div class="wx-current">
                <span class="wx-meta"><b style="color:var(--ink);font-size:1.15rem">Highs ${Math.round(pct(hiA, .1))}–${Math.round(pct(hiA, .9))}°F</b><br>Lows ${Math.round(pct(loA, .1))}–${Math.round(pct(loA, .9))}°F (middle 80% of days)</span>
                <span class="wx-meta"><b style="color:var(--ink);font-size:1.15rem">${wetDays}% of days</b><br>had 0.1 in. of rain or more · average ${avgRain} in./day</span>
              </div>
              <p class="small muted" style="margin-top:.5rem">Reanalysis data is gridded at roughly 9–25 km, so it smooths out Hawaiʻi's sharp local differences in rain and temperature. It is not the official NOAA 1991–2020 climate normal; see <a href="${D.sources.climateNormals.url}" target="_blank" rel="noopener">NOAA Climate Normals</a>. When your dates come within 10 days, this switches to the forecast.</p>`;
            html += packingHint(k, Math.round(pct(loA, .1)), wetDays);
          }
        } catch (e) {
          html += `<div class="callout" style="margin-top:.75rem"><strong>Historical estimate unavailable.</strong> For typical conditions on your dates, see <a href="${D.sources.climateNormals.url}" target="_blank" rel="noopener">NOAA Climate Normals</a>. Historical averages are never a forecast.</div>`;
        }
      } else if (forecast) {
        const d = forecast.daily;
        const idx = d.time.map((t, n) => (t >= start && t <= end ? n : -1)).filter((n) => n >= 0);
        if (idx.length) {
          const lo = Math.min(...idx.map((n) => d.temperature_2m_min[n]));
          const rainy = Math.round((idx.filter((n) => (d.precipitation_probability_max[n] || 0) >= 50).length / idx.length) * 100);
          html += packingHint(k, Math.round(lo), rainy);
        }
      }
      if (box()) box().innerHTML = html;
    }
  }
  function packingHint(areaKey, lowF, wetPct) {
    const a = D.weatherAreas[areaKey];
    const tips = [];
    if (lowF < 50) tips.push("Pack warm layers, a hat and gloves for cold mornings and evenings.");
    else if (lowF < 62) tips.push("Bring a fleece or light jacket for evenings.");
    if (wetPct >= 40) tips.push("Expect showers: a rain shell and quick-dry shoes help.");
    const indoor = D.sights.filter((s) => s.island === a.island && /History/.test(s.category));
    if (wetPct >= 40 && indoor.length) tips.push(`Rainy-day options nearby: ${indoor.slice(0, 2).map((s) => s.name).join(", ")}.`);
    if (!tips.length) tips.push("Sun protection and water. Ocean conditions are separate: check surf and hazards before swimming.");
    return `<div class="callout wx-pack"><strong>Packing and plan ideas</strong>${tips.map(esc).join(" ")}</div>`;
  }

  /* ========================================================== DIRECTORY */
  const isVerified = (p) => !!(p.verified && p.verified.date && p.status !== "unconfirmed");
  const statusBadges = (p) => `<span class="badge badge-ed">Editorial pick</span>${isVerified(p) ? `<span class="badge badge-ok">Checked on official site ${esc(p.verified.date)}</span>` : p.status === "unconfirmed" ? `<span class="badge badge-bad">Couldn't confirm it's open</span>` : `<span class="badge badge-warn">Not yet verified</span>`}<span>Description reviewed ${D.meta.contentDate}</span>`;
  const statusAlert = (p) => p.status === "temp-closed" ? `<div class="callout bad"><strong>Temporarily closed</strong>${esc(p.note)}</div>` : p.status === "unconfirmed" ? `<div class="callout warn"><strong>Status unconfirmed</strong>${esc(p.note || "")}</div>` : p.note ? `<p class="small muted">${esc(p.note)}</p>` : "";

  function placeCard(p) {
    const saved = state.saved.has(p.id);
    const isl = ISL[p.island];
    let kicker, facts = [], extra = "", links = [];
    if (p.kind2 === "food") {
      kicker = `${p.kind} · ${isl.name}`;
      facts = [["Area", p.area], ["Address", p.address], ["Phone", p.phone], ["Hours", p.hours ? `${p.hours} (as listed on the official site; subject to change)` : "Not listed here. Check the official site."], ["Order", p.signature], ["Meals", p.meals.join(", ")], ["Price", `${priceLabel(p.price)} · ${priceBasis(p.price)} (estimate)`], ["Reservations", p.reservations], ["Setting", p.setting]];
      links.push(p.web ? `<a class="btn btn-sm primary-link" href="${p.web}" target="_blank" rel="noopener">${esc(p.webLabel)} ↗</a>` : `<span class="small muted">${esc(p.webLabel)}</span>`);
      links.push(`<a class="btn btn-ghost btn-sm" href="${mapUrl(p)}" target="_blank" rel="noopener">Map ↗</a>`);
      links.push(`<a class="btn btn-ghost btn-sm" href="${yelpUrl(p)}" target="_blank" rel="noopener" title="Yelp ratings are separate from our editorial pick">Find on Yelp ↗</a>`);
      const atPhoto = Object.values(D.photos || {}).find((ph) => ph.at === p.id);
      extra = (atPhoto ? `<figure class="place-photo"><img src="${atPhoto.src}" alt="${esc(atPhoto.alt)}" width="720" height="540" loading="lazy"><figcaption class="small muted">${photoCredit(atPhoto)}</figcaption></figure>` : "") +
        ((p.sources || []).length ? `<p class="small"><b>Recommended in:</b> ${p.sources.map((k) => `<a href="${D.foodSources[k].url}" target="_blank" rel="noopener">${esc(D.foodSources[k].label)}</a>`).join("; ")}</p>` : "") +
        `<p class="small muted">Yelp search link only; we haven't matched a verified listing yet. Ratings there are not part of our recommendation.</p>`;
    } else if (p.kind2 === "beaches") {
      kicker = `Beach · ${isl.name}`;
      facts = [["Area", p.area], ["Generally better for", p.bestFor.join(", ")], ["Lifeguard", p.lifeguard], ["Facilities", p.facilities], ["Permits", p.reservation], ["Quieter", p.quieter], ["Alternative", p.alt]];
      extra = `<p class="small"><b>Know before you go:</b> ${esc(p.caveats)}</p>
        <div class="safety"><b>Conditions change daily.</b> A beach can be dangerous even when it looks calm. This card's reputation for calm water is not a guarantee. <a href="${D.sources.beachSafety.url}" target="_blank" rel="noopener">Check today's surf and hazards ↗</a> · <a href="${D.sources.nwsHfo.url}" target="_blank" rel="noopener">NWS surf forecast ↗</a></div>`;
      if (p.link) links.push(`<a class="btn btn-sm primary-link" href="${p.link.url}" target="_blank" rel="noopener">${esc(p.link.label)} ↗</a>`);
      links.push(`<a class="btn btn-ghost btn-sm" href="${mapUrl(p)}" target="_blank" rel="noopener">Map ↗</a>`);
    } else {
      kicker = `${p.category} · ${isl.name}`;
      facts = [["Area", p.area], ["Time needed", p.duration + " (estimate)"], ["Effort", p.effort], ["Best time", p.bestTime], ["Reservations", p.reservation], ["Access", p.access], ["Etiquette", p.etiquette], ["Pair with", p.nearby]];
      extra = `<p class="small"><b>Skip this if:</b> ${esc(p.skipIf)}</p>` +
        (/Nature/.test(p.category) ? `<div class="safety"><b>Check closures and conditions</b> before you go. <a href="${D.sources.stateParks.url}" target="_blank" rel="noopener">State park alerts ↗</a> · <a href="${D.sources.trails.url}" target="_blank" rel="noopener">Trail conditions ↗</a> · <a href="${D.sources.nwsHfo.url}" target="_blank" rel="noopener">Weather alerts ↗</a></div>` : "");
      p.links.forEach((l, k) => links.push(`<a class="btn ${k ? "btn-ghost " : ""}btn-sm${k ? "" : " primary-link"}" href="${l.url}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`));
      links.push(`<a class="btn btn-ghost btn-sm" href="${mapUrl(p)}" target="_blank" rel="noopener">Map ↗</a>`);
    }
    const dist = p._dist ? `<span class="badge">${esc(fmtRange(p._dist))} drive from your base (estimate)</span>` : "";
    return `<article class="card place" id="${p.id}">
      <div class="place-top"><div><p class="place-kicker">${esc(kicker)}</p><h3>${esc(p.name)}</h3></div>
        <button type="button" class="btn btn-ghost btn-sm save-btn" data-save="${p.id}" aria-pressed="${saved}" aria-label="${saved ? "Remove" : "Save"} ${esc(p.name)}">${saved ? "Saved" : "Save"}</button></div>
      ${dist}
      ${p.kind2 === "food" ? statusAlert(p) : ""}
      <p class="why"><b>Why go:</b> ${esc(p.why)}</p>
      ${p.tags ? `<div class="tags">${p.tags.map((t) => `<span class="badge">${esc(t)}</span>`).join("")}</div>` : ""}
      <dl class="facts">${facts.filter((f) => f[1]).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
      ${extra}
      <p class="status">${statusBadges(p)}</p>
      <div class="place-actions">${links.join("")}
        <button type="button" class="btn btn-ghost btn-sm" data-addplan="${p.id}">Add to plan</button>
        <button type="button" class="btn btn-ghost btn-sm" data-share="${p.id}">Share</button>
        <button type="button" class="btn btn-ghost btn-sm" data-report="${esc(p.name)}">Report an update</button>
      </div>
    </article>`;
  }

  function renderFilters() {
    const f = state.dir;
    const islOpts = `<option value="">All islands</option>` + D.islands.map((i) => `<option value="${i.id}" ${f.island === i.id ? "selected" : ""}>${esc(i.name)}</option>`).join("");
    let specific = "";
    if (f.kind === "food") {
      const types = [...new Set(D.food.map((p) => p.kind))].sort();
      specific = `
        <div class="field"><label for="fPrice">Max price</label><select id="fPrice"><option value="">Any</option>${[1, 2, 3, 4].map((n) => `<option value="${n}" ${+f.price === n ? "selected" : ""}>${priceLabel(n)} or less</option>`).join("")}</select></div>
        <div class="field"><label for="fMeal">Meal</label><select id="fMeal"><option value="">Any</option>${["Breakfast", "Lunch", "Dinner", "Snack", "Drinks"].map((m) => `<option ${f.meal === m ? "selected" : ""}>${m}</option>`).join("")}</select></div>
        <div class="field"><label for="fType">Type</label><select id="fType"><option value="">Any</option>${types.map((t) => `<option ${f.type === t ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></div>
        <label class="check" title="Available once opening hours are verified"><input type="checkbox" disabled> Open now <span class="small muted">(needs verified hours)</span></label>`;
    } else if (f.kind === "beaches") {
      specific = `<div class="field"><label for="fAct">Good for</label><select id="fAct"><option value="">Any</option>${["Swimming", "Snorkeling", "Surfing", "Viewing", "Walking", "Kids", "Sunset"].map((m) => `<option ${f.activity === m ? "selected" : ""}>${m}</option>`).join("")}</select></div>`;
    } else {
      specific = `<div class="field"><label for="fCat">Type</label><select id="fCat"><option value="">Any</option>${["Nature", "History", "Culture"].map((m) => `<option ${f.category === m ? "selected" : ""}>${m}</option>`).join("")}</select></div>
        <label class="check"><input type="checkbox" id="fEasy" ${f.easyOnly ? "checked" : ""}> Easy effort only</label>`;
    }
    const hasBase = state.planInputs && state.planInputs.islands && state.planInputs.islands.length;
    $("#filters").innerHTML = `
      <div class="field grow"><label for="fQ">Search</label><input type="search" id="fQ" placeholder="Dish, place, town…" value="${esc(f.q)}"></div>
      <div class="field"><label for="fIsl">Island</label><select id="fIsl">${islOpts}</select></div>
      ${specific}
      <div class="field"><label for="fSort">Order</label><select id="fSort"><option value="editorial">Editorial order</option><option value="near" ${f.sort === "near" ? "selected" : ""} ${hasBase ? "" : "disabled"}>Nearest to my base${hasBase ? "" : " (set in planner)"}</option></select></div>
      <label class="check"><input type="checkbox" id="fSaved" ${f.savedOnly ? "checked" : ""}> Saved only</label>`;
    const bind = (id, key, ev = "change", fn = (e) => e.target.value) => { const el = $("#" + id); if (el) el.addEventListener(ev, (e) => { f[key] = fn(e); renderDirectory(false); }); };
    bind("fQ", "q", "input");
    bind("fIsl", "island");
    bind("fPrice", "price"); bind("fMeal", "meal"); bind("fType", "type"); bind("fAct", "activity"); bind("fCat", "category");
    bind("fEasy", "easyOnly", "change", (e) => e.target.checked);
    bind("fSaved", "savedOnly", "change", (e) => e.target.checked);
    bind("fSort", "sort");
  }

  function baseFor(islandId) {
    const pi = state.planInputs;
    if (!pi || !pi.islands) return null;
    const row = pi.islands.find((r) => r.id === islandId);
    if (!row) return null;
    return ISL[islandId].bases[row.base || 0];
  }

  function renderDirectory(withFilters = true) {
    const f = state.dir;
    if (withFilters) renderFilters();
    let list = f.kind === "food" ? D.food : f.kind === "beaches" ? D.beaches : D.sights;
    const q = f.q.trim().toLowerCase();
    list = list.filter((p) => {
      if (f.island && p.island !== f.island) return false;
      if (f.savedOnly && !state.saved.has(p.id)) return false;
      if (q && !JSON.stringify([p.name, p.area, p.why, p.signature, p.cuisine, p.tags, p.category, p.bestFor, ISL[p.island].plain]).toLowerCase().includes(q)) return false;
      if (f.kind === "food") {
        if (f.price && p.price > +f.price) return false;
        if (f.meal && !p.meals.includes(f.meal)) return false;
        if (f.type && p.kind !== f.type) return false;
      } else if (f.kind === "beaches") {
        if (f.activity && !p.bestFor.join(" ").includes(f.activity)) return false;
      } else {
        if (f.category && !p.category.includes(f.category)) return false;
        if (f.easyOnly && !/^Easy/.test(p.effort) || (f.easyOnly && /strenuous|tiring/i.test(p.effort))) return false;
      }
      return true;
    });
    list.forEach((p) => { const b = baseFor(p.island); p._dist = b ? drive(b, p) : null; });
    if (f.sort === "near") list = [...list].sort((a, b) => (a._dist ? a._dist[0] : 1e9) - (b._dist ? b._dist[0] : 1e9));
    $("#resultCount").textContent = `${list.length} ${list.length === 1 ? "place" : "places"}${f.island ? " on " + islandName(f.island) : " across five islands"}`;
    $("#panel-dir").innerHTML = list.length ? list.map(placeCard).join("") : `<div class="empty">No places match these filters. Try clearing the search or choosing all islands.</div>`;
  }

  function setTab(kind, focus) {
    state.dir.kind = kind;
    state.dir.price = state.dir.meal = state.dir.type = state.dir.activity = state.dir.category = "";
    $$(".tabs [data-kind]").forEach((t) => { const on = t.dataset.kind === kind; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
    $("#panel-dir").setAttribute("aria-labelledby", "tab-" + kind);
    renderDirectory();
  }
  function wireTabs(container, onSelect) {
    const tabs = $$('[role="tab"]', container);
    tabs.forEach((t, k) => {
      t.addEventListener("click", () => onSelect(t, false));
      t.addEventListener("keydown", (e) => {
        let n = null;
        if (e.key === "ArrowRight") n = (k + 1) % tabs.length;
        if (e.key === "ArrowLeft") n = (k - 1 + tabs.length) % tabs.length;
        if (e.key === "Home") n = 0;
        if (e.key === "End") n = tabs.length - 1;
        if (n != null) { e.preventDefault(); onSelect(tabs[n], true); }
      });
    });
  }
  function browseIsland(id) {
    state.dir.island = id;
    setTab(state.dir.kind);
    $("#directory").scrollIntoView({ behavior: "smooth" });
  }
  function showPlace(id) {
    const p = BY_ID[id]; if (!p) return;
    Object.assign(state.dir, { island: p.island, q: "", savedOnly: false });
    setTab(p.kind2);
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.style.outline = "3px solid var(--accent)"; setTimeout(() => (el.style.outline = ""), 2500); }
  }

  /* ========================================================== FOOD LIST */
  const foodState = { group: "type", island: "", openOnly: true };
  const photoCredit = (ph) => `Photo: ${ph.page ? `<a href="${ph.page}" target="_blank" rel="noopener">${esc(ph.author)}</a>` : esc(ph.author)}, ${ph.licenseUrl ? `<a href="${ph.licenseUrl}" target="_blank" rel="noopener">${esc(ph.license)}</a>` : esc(ph.license)}`;
  function renderDishes() {
    $("#foodDishes").innerHTML = D.dishes.map((d) => {
      const ph = D.photos[d.photo];
      const places = d.places.map((id) => BY_ID[id]).filter((p) => p && (!p.status || p.status === "ok"));
      return `<article class="dish">
        <figure><img src="${ph.src}" alt="${esc(ph.alt)}" width="720" height="540" loading="lazy"><figcaption>${photoCredit(ph)}${ph.at && BY_ID[ph.at] ? ` · taken at ${esc(BY_ID[ph.at].name)}` : ""}${ph.note ? ` · ${esc(ph.note)}` : ""}</figcaption></figure>
        <div class="dish-body"><h4>${esc(d.name)}</h4><p>${esc(d.what)}</p>
        ${places.length ? `<p class="dish-try"><b>Try it at:</b> ${places.map((p) => `<a href="#${p.id}" data-goto-food="${p.id}">${esc(p.name)}</a> <span class="muted">(${esc(ISL[p.island].name)})</span>`).join(", ")}</p>` : `<p class="dish-try muted">Easy to find at markets and convenience stores on every island.</p>`}</div>
      </article>`;
    }).join("");
    $$("#foodDishes [data-goto-food]").forEach((a) => (a.onclick = (e) => { e.preventDefault(); showPlace(a.dataset.gotoFood); }));
    $("#photoCredits").innerHTML = Object.entries(D.photos).map(([k, ph]) => `<li>${esc(ph.alt.split(":")[0])}: ${photoCredit(ph)}</li>`).join("");
  }
  function renderFoodList() {
    renderDishes();
    $("#foodIslands").innerHTML = [["", "All islands"], ...D.islands.map((i) => [i.id, i.name])].map(([id, n]) =>
      `<label class="chip" for="fi-${id || "all"}"><input type="radio" name="foodIsl" id="fi-${id || "all"}" value="${id}" ${foodState.island === id ? "checked" : ""}><span>${esc(n)}</span></label>`).join("");
    $$("#foodIslands input").forEach((i) => (i.onchange = () => { foodState.island = i.value; drawFoodGroups(); }));
    $$(".seg-btn").forEach((b) => (b.onclick = () => { foodState.group = b.dataset.group; $$(".seg-btn").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); drawFoodGroups(); }));
    $("#foodOpenOnly").onchange = (e) => { foodState.openOnly = e.target.checked; drawFoodGroups(); };
    drawFoodGroups();
  }
  function foodRow(p, groupBy) {
    const pl = D.foodPlacement[p.id];
    const status = p.status === "temp-closed" ? `<span class="badge badge-bad">Temporarily closed</span>` : p.status === "unconfirmed" ? `<span class="badge badge-bad">Unconfirmed</span>` : isVerified(p) ? `<span class="badge badge-ok">Checked</span>` : "";
    const where = groupBy === "type" ? `${pl.region}, ${ISL[p.island].name}` : (D.foodTypes.find((t) => t.id === pl.type) || {}).label;
    const n = (p.sources || []).length;
    return `<li class="food-row${p.status && p.status !== "ok" ? " is-off" : ""}">
      <div class="fr-main">
        <a href="#${p.id}" class="fr-name" data-goto-food="${p.id}">${esc(p.name)}</a>${pl.star ? ` <span class="badge badge-star">Must-try</span>` : ""}${n ? ` <span class="badge badge-guides" title="${esc(p.sources.map((k) => D.foodSources[k].label).join("; "))}">In ${n} ${n === 1 ? "guide" : "guides"}</span>` : ""}
        <span class="fr-sub">${esc(where)} · ${esc(p.signature)}</span>
      </div>
      <div class="fr-side"><span class="fr-price" title="${esc(priceBasis(p.price))}">${priceLabel(p.price)}</span>${status}${p.web ? `<a class="fr-web" href="${p.web}" target="_blank" rel="noopener" aria-label="${esc(p.name)} official website">Site ↗</a>` : ""}</div>
    </li>`;
  }
  function drawFoodGroups() {
    const list = D.food.filter((p) => D.foodPlacement[p.id] && (!foodState.island || p.island === foodState.island) && (!foodState.openOnly || !p.status || p.status === "ok"));
    const rank = (p) => (D.foodPlacement[p.id].star ? 0 : 100) - (p.sources || []).length * 6 + (isVerified(p) ? 0 : 4) + D.foodPlacement[p.id].rank;
    let groups;
    if (foodState.group === "type") {
      const typePhoto = { hawaiian: "laulau", local: "plate-lunch", seafood: "ahi-poke", sweets: "haupia", shaveice: "shave-ice" };
      groups = D.foodTypes.map((t) => ({ title: t.label, sub: t.blurb, photo: typePhoto[t.id], items: list.filter((p) => D.foodPlacement[p.id].type === t.id) }));
    } else {
      groups = [];
      D.islands.forEach((i) => {
        const regions = [...new Set(list.filter((p) => p.island === i.id).map((p) => D.foodPlacement[p.id].region))];
        regions.forEach((r) => groups.push({ title: r, sub: i.name, items: list.filter((p) => p.island === i.id && D.foodPlacement[p.id].region === r) }));
      });
    }
    groups = groups.filter((g) => g.items.length);
    $("#foodGroups").innerHTML = groups.length ? groups.map((g) => `<section class="food-group card${g.photo ? " has-photo" : ""}">
        ${g.photo ? `<img class="fg-photo" src="${D.photos[g.photo].src}" alt="${esc(D.photos[g.photo].alt)}" width="720" height="540" loading="lazy">` : ""}
        <header><h3>${esc(g.title)}</h3><p class="small muted">${esc(g.sub)} · ${g.items.length} ${g.items.length === 1 ? "pick" : "picks"}</p></header>
        <ol class="food-rows">${g.items.sort((a, b) => rank(a) - rank(b)).map((p) => foodRow(p, foodState.group)).join("")}</ol>
      </section>`).join("") : `<div class="empty">No picks match. Try all islands.</div>`;
    $$("[data-goto-food]").forEach((a) => (a.onclick = (e) => { e.preventDefault(); showPlace(a.dataset.gotoFood); }));
  }

  /* ============================================================ HISTORY */
  function renderHistory() {
    $("#historyKinds").innerHTML = D.historyKinds.map((k) => `<div class="card"><h3>${esc(k.kind)}</h3><p>${esc(k.text)}</p></div>`).join("");
    $("#historyTabs").innerHTML = D.islands.map((i, k) => `<button role="tab" id="htab-${i.id}" aria-controls="historyPanel" aria-selected="${k === 0}" tabindex="${k === 0 ? 0 : -1}" data-h="${i.id}">${esc(i.name)}</button>`).join("");
    const show = (id) => {
      const h = D.history[id];
      $$("#historyTabs [role=tab]").forEach((t) => { const on = t.dataset.h === id; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1; });
      $("#historyPanel").setAttribute("aria-labelledby", "htab-" + id);
      $("#historyPanel").innerHTML = `
        <div>
          <p class="overview">${esc(h.overview)}</p>
          <p class="names"><b>Place names.</b> ${esc(h.names)} <span class="small">Look up words at <a href="${D.sources.wehewehe.url}" target="_blank" rel="noopener">Wehewehe</a>.</span></p>
          ${h.sensitive ? `<div class="callout warn"><strong>Visiting with care</strong>${esc(h.sensitive)}</div>` : ""}
          <details open style="margin-top:1rem"><summary><b>Deeper timeline</b></summary>
            <ol class="tl">${h.timeline.map((t) => `<li><b>${esc(t.when)}</b>${esc(t.what)}</li>`).join("")}</ol>
            <p class="small muted">A timeline is one way to tell history. Many moʻolelo and genealogies aren't organized by Western dates, and that knowledge belongs to the families and communities who keep it.</p>
          </details>
        </div>
        <div class="card">
          <h3>Places to learn, respectfully</h3>
          <div class="history-places">${h.places.map((p) => `<div><b>${esc(p.name)}</b><p class="small">${esc(p.why)}</p><p class="small muted">${esc(p.etiquette)}</p></div>`).join("")}</div>
          <h3 class="mt">Further reading</h3>
          <ul class="linklist small">${h.reading.map((r) => `<li><a href="${r.url}" target="_blank" rel="noopener">${esc(r.label)}</a></li>`).join("")}
            ${["oha", "papakilo", "ulukau", "archives"].map((k) => `<li><a href="${D.sources[k].url}" target="_blank" rel="noopener">${esc(D.sources[k].label)}</a></li>`).join("")}</ul>
          <p class="small muted" style="margin-top:.8rem">Draft text dated ${D.meta.contentDate}, awaiting review by local historians and cultural practitioners. <button type="button" class="link-btn" data-report="History: ${esc(ISL[id].name)}">Suggest a correction</button></p>
        </div>`;
    };
    wireTabs($("#historyTabs"), (t, focus) => { show(t.dataset.h); if (focus) t.focus(); });
    show("oahu");
  }

  /* ============================================================ PLANNER */
  const DRIVE_LIMIT = { low: 90, medium: 180, high: 270 };
  const SLOTS = { relaxed: ["Morning"], balanced: ["Morning", "Afternoon"], full: ["Morning", "Afternoon", "Late afternoon"] };

  function defaultInputs() {
    return {
      start: addDays(hawaiiToday(), 60), nights: 7, flexible: false, arrival: "",
      islands: [{ id: "oahu", base: 0, nights: 7 }],
      group: "adults", pace: "balanced", budget: "mid", interests: ["food", "culture", "beaches"], diet: "", mobility: "none", car: "yes", driveTol: "medium",
      useSaved: true, fill: true,
    };
  }

  function renderPlannerForm() {
    const pi = state.planInputs || defaultInputs();
    const sel = (id, opts, val) => `<select id="${id}">${opts.map(([v, l]) => `<option value="${v}" ${v === val ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
    const isRow = (i) => {
      const row = pi.islands.find((r) => r.id === i.id);
      return `<div class="row">
        <label class="check" for="pi-${i.id}" style="min-height:auto"><input type="checkbox" id="pi-${i.id}" data-isl="${i.id}" ${row ? "checked" : ""}> ${esc(i.name)}</label>
        <select id="pb-${i.id}" aria-label="${esc(i.name)} base area" ${row ? "" : "disabled"}>${i.bases.map((b, k) => `<option value="${k}" ${row && +row.base === k ? "selected" : ""}>${esc(b.name)}</option>`).join("")}</select>
        <input type="number" id="pn-${i.id}" min="1" max="30" aria-label="${esc(i.name)} nights" value="${row ? row.nights : ""}" placeholder="nights" ${row ? "" : "disabled"}>
      </div>`;
    };
    $("#plannerForm").innerHTML = `
      <div class="field"><label for="pStart">Start date</label><input type="date" id="pStart" value="${pi.start}"></div>
      <div class="field"><label for="pNights">Total nights</label><input type="number" id="pNights" min="1" max="30" value="${pi.nights}"></div>
      <div class="field"><label for="pArrival">Arriving at</label>${sel("pArrival", [["", "Not sure yet"], ...Object.entries(D.airports).map(([c, a]) => [c, `${c} · ${a.name}`])], pi.arrival)}</div>
      <label class="check" for="pFlex"><input type="checkbox" id="pFlex" ${pi.flexible ? "checked" : ""}> My dates are flexible</label>
      <fieldset class="span4"><legend>Islands, base area and nights (in travel order)</legend>
        <div class="island-alloc">${D.islands.map(isRow).join("")}</div>
        <p class="small muted" id="allocNote" style="margin-top:.4rem"></p>
      </fieldset>
      <div class="field"><label for="pGroup">Group</label>${sel("pGroup", [["adults", "Adults"], ["kids", "Family, young kids"], ["teens", "Family, teens"], ["multigen", "Multigenerational"]], pi.group)}</div>
      <div class="field"><label for="pPace">Pace</label>${sel("pPace", [["relaxed", "Relaxed (1 plan a day)"], ["balanced", "Balanced (2 a day)"], ["full", "Full (3 a day)"]], pi.pace)}</div>
      <div class="field"><label for="pBudget">Budget</label>${sel("pBudget", [["value", "Value"], ["mid", "Mid-range"], ["splurge", "Splurge"]], pi.budget)}</div>
      <div class="field"><label for="pMob">Mobility needs</label>${sel("pMob", [["none", "None"], ["some", "Limited walking or stairs"], ["wheel", "Wheelchair or mobility device"]], pi.mobility)}</div>
      <fieldset class="span2"><legend>Priority interests</legend><div class="chips">${D.dimensions.slice(0, 5).map((d) => `<label class="chip" for="pint-${d.id}"><input type="checkbox" id="pint-${d.id}" value="${d.id}" ${pi.interests.includes(d.id) ? "checked" : ""}><span>${esc(d.label)}</span></label>`).join("")}</div></fieldset>
      <div class="field"><label for="pCar">Rental car</label>${sel("pCar", [["yes", "Yes"], ["some", "Some days"], ["no", "No car"]], pi.car)}</div>
      <div class="field"><label for="pDrive">Driving per day</label>${sel("pDrive", [["low", "Up to 1.5 hours"], ["medium", "Up to 3 hours"], ["high", "Up to 4.5 hours"]], pi.driveTol)}</div>
      <div class="field span2"><label for="pDiet">Food preferences or dietary needs</label><input type="text" id="pDiet" value="${esc(pi.diet)}" placeholder="e.g. vegetarian, no shellfish, kid-friendly"></div>
      <div class="span2" style="display:grid;gap:.3rem;align-content:end">
        <label class="check" for="pUseSaved" style="min-height:auto"><input type="checkbox" id="pUseSaved" ${pi.useSaved ? "checked" : ""}> Use my saved places first</label>
        <label class="check" for="pFill" style="min-height:auto"><input type="checkbox" id="pFill" ${pi.fill ? "checked" : ""}> Fill gaps with suggestions</label>
      </div>
      <div class="actions span4">
        <button type="submit" class="btn">${state.plan ? "Rebuild my plan" : "Build my plan"}</button>
        <button type="button" class="btn btn-ghost" id="planReset">Start over</button>
        <span class="small muted">Rebuilding replaces manual edits. Use Undo to go back.</span>
      </div>`;

    const syncAlloc = () => {
      const rows = D.islands.filter((i) => $("#pi-" + i.id).checked);
      D.islands.forEach((i) => { const on = $("#pi-" + i.id).checked; $("#pb-" + i.id).disabled = !on; $("#pn-" + i.id).disabled = !on; });
      const total = +$("#pNights").value || 0;
      const sum = rows.reduce((t, i) => t + (+$("#pn-" + i.id).value || 0), 0);
      $("#allocNote").textContent = rows.length ? `Allocated ${sum} of ${total} nights.${sum !== total ? " Adjust so they match." : ""}` : "Choose at least one island.";
    };
    $$(".island-alloc input[type=checkbox]").forEach((cb) => cb.addEventListener("change", () => {
      const on = D.islands.filter((i) => $("#pi-" + i.id).checked);
      const total = +$("#pNights").value || 7;
      // Split nights proportionally to suggested minimum stay
      const w = on.reduce((t, i) => t + i.minStayNights, 0);
      let left = total;
      on.forEach((i, k) => { const n = k === on.length - 1 ? left : Math.max(1, Math.round((total * i.minStayNights) / w)); $("#pn-" + i.id).value = n; left -= n; });
      D.islands.filter((i) => !$("#pi-" + i.id).checked).forEach((i) => ($("#pn-" + i.id).value = ""));
      syncAlloc();
    }));
    $$(".island-alloc input[type=number]").forEach((n) => n.addEventListener("input", syncAlloc));
    $("#pNights").addEventListener("input", syncAlloc);
    syncAlloc();
    $("#plannerForm").onsubmit = (e) => { e.preventDefault(); buildPlan(); };
    $("#planReset").onclick = () => {
      pushUndo();
      state.plan = null; state.planInputs = null; store.set("plan", null); store.set("planInputs", null);
      renderPlannerForm(); renderPlan(); renderTripSummary();
    };
  }

  function readInputs() {
    const islands = D.islands.filter((i) => $("#pi-" + i.id).checked).map((i) => ({ id: i.id, base: +$("#pb-" + i.id).value || 0, nights: Math.max(1, +$("#pn-" + i.id).value || 1) }));
    return {
      start: $("#pStart").value || addDays(hawaiiToday(), 60), nights: Math.max(1, +$("#pNights").value || 7), flexible: $("#pFlex").checked, arrival: $("#pArrival").value,
      islands, group: $("#pGroup").value, pace: $("#pPace").value, budget: $("#pBudget").value, mobility: $("#pMob").value,
      interests: $$(".planner-form .chips input:checked").map((i) => i.value), car: $("#pCar").value, driveTol: $("#pDrive").value, diet: $("#pDiet").value.trim(),
      useSaved: $("#pUseSaved").checked, fill: $("#pFill").checked,
    };
  }

  function startPlanFor(id) {
    const pi = state.planInputs || defaultInputs();
    pi.islands = [{ id, base: 0, nights: pi.nights }];
    if (state.quiz.nights) { pi.nights = state.quiz.nights; pi.islands[0].nights = pi.nights; }
    if (state.quiz.pace) pi.pace = state.quiz.pace;
    if (state.quiz.interests && state.quiz.interests.length) pi.interests = state.quiz.interests;
    if (state.quiz.group) pi.group = state.quiz.group;
    if (state.quiz.mobility) pi.mobility = state.quiz.mobility;
    if (state.quiz.budget) pi.budget = state.quiz.budget;
    if (state.quiz.driving) pi.driveTol = { avoid: "low", some: "medium", love: "high" }[state.quiz.driving];
    state.planInputs = pi; store.set("planInputs", pi);
    renderPlannerForm();
    $("#planner").scrollIntoView({ behavior: "smooth" });
  }

  const needsBooking = (p) => p && ((p.reservation && /reserv|required|ticket/i.test(p.reservation) && !/^None/i.test(p.reservation)) || (p.reservations && /recommend|required|essential|ahead/i.test(p.reservations)));
  const isFullDay = (p) => p && p.duration && /full day/i.test(p.duration);
  function suits(p, pi) {
    if (p.status === "temp-closed" || p.status === "unconfirmed") return false;
    if (pi.mobility === "wheel" && p.effort && !/^Easy/.test(p.effort)) return false;
    if (pi.mobility === "wheel" && p.kind2 === "beaches" && !/Swimming|Kids/.test(p.bestFor.join(" "))) return false;
    if (pi.mobility === "some" && p.effort && /strenuous|steep/i.test(p.effort) && !/^Easy/.test(p.effort)) return false;
    if (pi.budget === "value" && p.price === 4) return false;
    return true;
  }
  function interestScore(p, pi) {
    let s = 0;
    const I = pi.interests;
    if (p.kind2 === "beaches" && I.includes("beaches")) s += 3;
    if (p.kind2 === "sights" && /Nature/.test(p.category) && I.includes("nature")) s += 3;
    if (p.kind2 === "sights" && /History|Culture/.test(p.category) && I.includes("culture")) s += 3;
    if (["kids", "teens", "multigen"].includes(pi.group) && p.bestFor && p.bestFor.join(" ").includes("Kids")) s += 2;
    if (state.saved.has(p.id) && pi.useSaved) s += 10;
    return s;
  }

  function buildPlan() {
    const pi = readInputs();
    const warnings = [];
    if (!pi.islands.length) { $("#plannerWarnings").innerHTML = `<div class="callout bad"><strong>Choose at least one island.</strong>Tick an island in the list above, then build again.</div>`; return; }
    pushUndo();
    state.planInputs = pi; store.set("planInputs", pi);

    const allocated = pi.islands.reduce((t, r) => t + r.nights, 0);
    const nights = allocated;
    const days = [];
    let date = pi.start;
    const used = new Set();
    pi.islands.forEach((row, ri) => {
      const isl = ISL[row.id];
      const base = Object.assign({ island: row.id }, isl.bases[row.base] || isl.bases[0]);
      const pool = ALL.filter((p) => p.island === row.id && p.kind2 !== "food" && suits(p, pi) && (pi.fill || (pi.useSaved && state.saved.has(p.id))))
        .sort((a, b) => interestScore(b, pi) - interestScore(a, pi));
      const foods = D.food.filter((p) => p.island === row.id && suits(p, pi) && (pi.fill || state.saved.has(p.id)))
        .sort((a, b) => (state.saved.has(b.id) ? 1 : 0) - (state.saved.has(a.id) ? 1 : 0));
      const usedFood = new Set();
      const pickFood = (near, meal) => {
        const c = foods.filter((f) => !usedFood.has(f.id) && f.meals.includes(meal) && drive(near, f)[1] <= 50).sort((a, b) => (state.saved.has(b.id) - state.saved.has(a.id)) * 1000 + (drive(near, a)[0] - drive(near, b)[0]));
        if (!c.length) return null;
        usedFood.add(c[0].id); return c[0];
      };
      const segDays = row.nights + (ri === pi.islands.length - 1 ? 1 : 0);
      for (let d = 0; d < segDays; d++) {
        const first = d === 0, last = ri === pi.islands.length - 1 && d === segDays - 1;
        const day = { date, island: row.id, base: base.name, baseIdx: row.base, blocks: [], kind: "full" };
        const blk = (slot, type, ref, text, meta) => ({ uid: Math.random().toString(36).slice(2, 9), slot, type, ref: ref || null, text: text || "", meta: meta || "" });
        if (first && ri === 0) {
          day.kind = "arrival";
          day.title = "Arrive and settle in";
          day.blocks.push(blk("Afternoon", "note", null, `Arrive${pi.arrival ? " at " + pi.arrival : ""}, ${pi.car === "no" ? "transfer" : "pick up the rental car"} and check in at ${base.name}.`, "Flights from the mainland often land midday or later."));
          day.blocks.push(blk("Late afternoon", "downtime", null, "Downtime: unpack, walk to the beach, adjust to the time zone."));
          const f = pickFood(base, "Dinner"); if (f) day.blocks.push(blk("Evening", "place", f.id, "", "Dinner near your base"));
        } else if (first && ri > 0) {
          day.kind = "transfer";
          const prev = pi.islands[ri - 1];
          const r = findRoute(prev.id, row.id);
          day.title = `Travel day: ${islandName(prev.id)} → ${isl.name}`;
          day.blocks.push(blk("Morning", "transfer", null, `Check out, return the car and fly ${r ? r.via : ""}.`, r ? `About ${r.doorToDoor[0]}–${r.doorToDoor[1]} hours door to door (estimate). Book early and confirm the route operates on your date.` : ""));
          day.blocks.push(blk("Afternoon", "note", null, `Pick up a car and check in at ${base.name}.`, "Leave the rest of the day open as a buffer."));
          const f = pickFood(base, "Dinner"); if (f) day.blocks.push(blk("Evening", "place", f.id, "", "Easy dinner near your new base"));
        } else if (last) {
          day.kind = "departure";
          day.title = "Departure day";
          const f = pickFood(base, "Breakfast"); if (f) day.blocks.push(blk("Morning", "place", f.id, "", "Unhurried breakfast"));
          day.blocks.push(blk("Midday", "transfer", null, "Pack, check out and head to the airport.", "Plan to leave about 3 hours before your flight, more from remote areas."));
        } else {
          day.title = "";
          const slots = SLOTS[pi.pace];
          let anchor = null;
          const cand = pool.filter((p) => !used.has(p.id));
          if (cand.length) {
            anchor = cand[0]; used.add(anchor.id);
            day.blocks.push(blk("Morning", "place", anchor.id, "", anchor.bestTime || anchor.quieter || ""));
          }
          if (anchor && !isFullDay(anchor)) {
            for (let s = 1; s < slots.length; s++) {
              const rest = pool.filter((p) => !used.has(p.id) && !isFullDay(p)).sort((a, b) => drive(anchor, a)[0] - drive(anchor, b)[0]);
              if (rest.length && drive(anchor, rest[0])[1] <= 60) { used.add(rest[0].id); day.blocks.push(blk(slots[s], "place", rest[0].id, "", rest[0].quieter || rest[0].bestTime || "")); }
            }
            const lunch = pickFood(anchor, "Lunch"); if (lunch) day.blocks.splice(1, 0, blk("Lunch", "place", lunch.id, "", "Lunch along the way"));
          } else if (!anchor) {
            day.blocks.push(blk("Morning", "downtime", null, "Open morning: beach near your base or a slow breakfast."));
          }
          day.blocks.push(blk(pi.pace === "full" ? "Evening" : "Afternoon", "downtime", null, pi.pace === "relaxed" ? "Downtime: pool, beach nap or nothing at all." : "Downtime before dinner."));
          const dinner = pickFood(base, "Dinner");
          day.blocks.push(dinner ? blk("Evening", "place", dinner.id, "", "Dinner") : blk("Evening", "note", null, "Dinner near your base: your pick, or a saved place.", "Leave room for a night off from plans."));
          day.blocks.sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));
        }
        days.push(day);
        if (!(last)) date = addDays(date, 1);
      }
    });

    // Plan-level warnings
    if (allocated !== pi.nights) warnings.push(["warn", "Nights don't add up", `Your islands add up to ${allocated} nights but you entered ${pi.nights}. The plan uses ${allocated}.`]);
    const transfers = pi.islands.length - 1;
    if (transfers && nights / pi.islands.length < 3) warnings.push(["bad", "Too many island changes", `${pi.islands.length} islands in ${nights} nights averages under 3 nights each. Each change costs about half a day or more. Consider dropping an island.`]);
    else if (transfers >= 2) warnings.push(["warn", `${transfers} island changes`, "Each transfer costs roughly half a day. Make sure each island gets at least 4 nights."]);
    pi.islands.forEach((r) => { if (r.nights < ISL[r.id].minStayNights - 1) warnings.push(["warn", `Short stay on ${islandName(r.id)}`, `${r.nights} nights is less than the suggested ${ISL[r.id].minStay}. Expect to choose between highlights.`]); });
    if (pi.car === "no" && pi.islands.some((r) => r.id !== "oahu")) warnings.push(["warn", "Car needed", "Outside Oʻahu, most places in this plan need a car or a booked tour."]);
    if (pi.diet) warnings.push(["info", "Dietary needs", `We haven't verified dietary options for listings yet. Check menus for “${pi.diet}” on each restaurant's official site.`]);

    state.plan = { v: 1, created: hawaiiToday(), inputs: pi, days, checks: {} };
    state._warnings = warnings;
    savePlan();
    renderPlannerForm();
    renderPlan();
    $("#planToolbar").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const SLOT_ORDER = ["Morning", "Lunch", "Midday", "Afternoon", "Late afternoon", "Evening"];

  function savePlan() { store.set("plan", state.plan); renderTripSummary(); }
  function pushUndo() {
    state.undo.push(JSON.stringify({ plan: state.plan, planInputs: state.planInputs }));
    if (state.undo.length > 40) state.undo.shift();
    const u = $("#undoBtn"); if (u) u.disabled = false;
  }
  function undo() {
    const s = state.undo.pop(); if (!s) return;
    const o = JSON.parse(s);
    state.plan = o.plan; state.planInputs = o.planInputs;
    store.set("plan", state.plan); store.set("planInputs", state.planInputs);
    renderPlannerForm(); renderPlan(); renderTripSummary();
    toast($("#planToast"), "Undone.");
  }

  function dayMeta(day, pi) {
    const isl = ISL[day.island];
    const base = Object.assign({}, isl.bases[day.baseIdx] || isl.bases[0]);
    let prev = base, lo = 0, hi = 0, hasFull = false;
    day.blocks.forEach((b) => {
      if (b.type !== "place") return;
      const p = BY_ID[b.ref]; if (!p) return;
      const r = drive(prev, p); lo += r[0]; hi += r[1]; prev = p;
      if (isFullDay(p)) hasFull = true;
    });
    const back = drive(prev, base); lo += back[0]; hi += back[1];
    const flags = [];
    const limit = DRIVE_LIMIT[(pi && pi.driveTol) || "medium"];
    if (hi > limit) flags.push(["bad", `Driving may exceed your ${fmtMins(limit)} limit`]);
    const places = day.blocks.filter((b) => b.type === "place" && BY_ID[b.ref] && BY_ID[b.ref].kind2 !== "food").length;
    if (hasFull && places > 1) flags.push(["warn", "A full-day outing plus more stops"]);
    if (places > 3) flags.push(["warn", "Packed day"]);
    if (!day.blocks.some((b) => b.type === "downtime") && day.kind === "full") flags.push(["warn", "No downtime"]);
    day.blocks.forEach((b) => { const p = BY_ID[b.ref]; if (needsBooking(p)) flags.push(["info", `Book: ${p.name}`]); });
    if (day.blocks.some((b) => b.ref === "s-haleakala")) flags.push(["info", "Sunrise means a ~3 a.m. start; keep the afternoon free"]);
    return { drive: [lo, hi], flags };
  }

  function alternatives(day, used) {
    const pool = ALL.filter((p) => p.island === day.island && p.kind2 !== "food" && !used.has(p.id));
    const rain = pool.find((p) => p.kind2 === "sights" && /History/.test(p.category)) || null;
    const isl = ISL[day.island], base = isl.bases[day.baseIdx] || isl.bases[0];
    const low = pool.filter((p) => p.kind2 === "beaches").sort((a, b) => drive(base, a)[0] - drive(base, b)[0])[0] || null;
    return { rain, low };
  }

  function renderPlan() {
    const plan = state.plan;
    $("#planToolbar").hidden = !plan;
    $("#undoBtn").disabled = !state.undo.length;
    if (!plan) {
      $("#planDays").innerHTML = `<div class="card plan-empty"><h3>Your plan will appear here</h3><p class="muted" style="margin-top:.4rem">Choose your islands and dates above, then build. Save places from the directory first if you want them included. Example: 7 nights on Oʻahu based in Waikīkī, balanced pace, food and culture.</p><button type="button" class="btn btn-sm" id="exampleBtn" style="margin-top:.8rem">Build the example</button></div>`;
      $("#planSide").innerHTML = "";
      $("#plannerWarnings").innerHTML = "";
      $("#exampleBtn").onclick = () => buildPlan();
      return;
    }
    const pi = plan.inputs;
    const used = new Set(plan.days.flatMap((d) => d.blocks.map((b) => b.ref)).filter(Boolean));
    const warn = (state._warnings || []).map(([k, t, m]) => `<div class="callout ${k === "bad" ? "bad" : k === "warn" ? "warn" : ""}"><strong>${esc(t)}</strong>${esc(m)}</div>`);
    let longDays = 0;
    const dayOpts = (cur) => plan.days.map((d, k) => `<option value="${k}" ${k === cur ? "selected" : ""}>Day ${k + 1}</option>`).join("");

    $("#planDays").innerHTML = plan.days.map((day, di) => {
      const m = dayMeta(day, pi);
      if (m.flags.some((f) => f[0] === "bad")) longDays++;
      const alt = alternatives(day, used);
      const label = pi.flexible ? `Day ${di + 1}` : `Day ${di + 1} · ${fmtDate(day.date)}`;
      return `<article class="card day" aria-labelledby="dayh-${di}">
        <div class="day-head">
          <div><h3 id="dayh-${di}">${esc(label)}</h3><p class="sub">${esc(islandName(day.island))} · based in ${esc(day.base)}${day.title ? " · " + esc(day.title) : ""}</p></div>
          <div class="tools">
            <button type="button" class="mini btn-sm" data-dact="up" data-d="${di}" ${di === 0 ? "disabled" : ""} aria-label="Move day ${di + 1} earlier">↑</button>
            <button type="button" class="mini btn-sm" data-dact="down" data-d="${di}" ${di === plan.days.length - 1 ? "disabled" : ""} aria-label="Move day ${di + 1} later">↓</button>
            <button type="button" class="mini btn-sm" data-dact="dup" data-d="${di}">Duplicate</button>
            <button type="button" class="mini btn-sm" data-dact="del" data-d="${di}">Remove day</button>
          </div>
        </div>
        <div class="day-flags"><span class="badge">Driving ${esc(fmtRange(m.drive))} (estimate)</span>${m.flags.map(([k, t]) => `<span class="badge ${k === "bad" ? "badge-bad" : k === "warn" ? "badge-warn" : "badge-conf"}">${esc(t)}</span>`).join("")}</div>
        <ol class="blocks">${day.blocks.map((b, bi) => {
          const p = BY_ID[b.ref];
          const title = p ? `<a href="#${p.id}" data-goto="${p.id}">${esc(p.name)}</a>` : esc(b.text);
          const meta = p ? [p.kind2 === "food" ? `${p.kind} · ${priceLabel(p.price)}` : p.duration || (p.bestFor && p.bestFor.join(", ")), b.meta, needsBooking(p) ? "Reservation needed" : "", isVerified(p) ? "" : "Verify before you go"].filter(Boolean).join(" · ") : b.meta;
          return `<li class="block ${b.type}">
            <span class="slot">${esc(b.slot)}</span>
            <div class="what"><b>${title}</b>${meta ? `<span class="meta">${esc(meta)}</span>` : ""}</div>
            <div class="btools">
              <button type="button" class="mini" data-bact="up" data-d="${di}" data-b="${bi}" ${bi === 0 ? "disabled" : ""} aria-label="Move earlier">↑</button>
              <button type="button" class="mini" data-bact="down" data-d="${di}" data-b="${bi}" ${bi === day.blocks.length - 1 ? "disabled" : ""} aria-label="Move later">↓</button>
              <select class="mini" data-bact="move" data-d="${di}" data-b="${bi}" aria-label="Move to another day">${dayOpts(di)}</select>
              ${p && p.kind2 !== "food" && alt.rain ? `<button type="button" class="mini" data-bact="swap" data-d="${di}" data-b="${bi}" data-to="${alt.rain.id}" title="Swap for ${esc(alt.rain.name)}">Swap</button>` : ""}
              <button type="button" class="mini" data-bact="del" data-d="${di}" data-b="${bi}" aria-label="Remove">✕</button>
            </div>
          </li>`;
        }).join("")}</ol>
        ${day.kind === "full" && (alt.rain || alt.low) ? `<p class="small muted" style="padding:0 1.1rem .8rem">${alt.rain ? `<b>If it rains:</b> <a href="#${alt.rain.id}" data-goto="${alt.rain.id}">${esc(alt.rain.name)}</a>. ` : ""}${alt.low ? `<b>Low-energy day:</b> <a href="#${alt.low.id}" data-goto="${alt.low.id}">${esc(alt.low.name)}</a> near your base.` : ""}</p>` : ""}
      </article>`;
    }).join("");
    if (longDays) warn.push(`<div class="callout bad"><strong>${longDays} day${longDays > 1 ? "s" : ""} with more driving than you wanted</strong>Move or remove a stop on the flagged days, or raise your daily driving limit.</div>`);
    $("#plannerWarnings").innerHTML = warn.join("");

    // Checklist
    const tasks = checklistItems(plan);
    $("#planSide").innerHTML = `
      <div class="card"><h3>Booking and permit checklist</h3>
        <ul class="checklist">${tasks.map((t) => `<li><label for="ck-${t.key}"><input type="checkbox" id="ck-${t.key}" data-ck="${t.key}" ${plan.checks[t.key] ? "checked" : ""}><span>${t.html}</span></label></li>`).join("")}</ul></div>
      <div class="card"><h3>Verify before you go</h3>
        <p class="small">${plan.days.flatMap((d) => d.blocks).filter((b) => BY_ID[b.ref] && !isVerified(BY_ID[b.ref])).length} stops in this plan have unverified hours or access details. Check each official link a day or two ahead.</p>
        <ul class="linklist small"><li><a href="${D.sources.beachSafety.url}" target="_blank" rel="noopener">Ocean conditions</a></li><li><a href="${D.sources.nwsHfo.url}" target="_blank" rel="noopener">Weather alerts</a></li><li><a href="${D.sources.stateParks.url}" target="_blank" rel="noopener">State park closures</a></li></ul></div>
      <div class="card"><h3>Add saved places</h3>${savedNotInPlan(plan)}</div>`;
    wirePlan();
  }

  function checklistItems(plan) {
    const items = [];
    const pi = plan.inputs;
    items.push({ key: "flights", html: "Book flights to and from Hawaiʻi" });
    if (pi.car !== "no") items.push({ key: "car", html: "Reserve rental car(s) early" });
    pi.islands.slice(1).forEach((r, k) => { const rt = findRoute(pi.islands[k].id, r.id); items.push({ key: "hop" + k, html: `Book ${esc(islandName(pi.islands[k].id))} → ${esc(islandName(r.id))} (${esc(rt ? rt.via : "")})` }); });
    pi.islands.forEach((r) => items.push({ key: "lodge-" + r.id, html: `Book lodging in ${esc(ISL[r.id].bases[r.base].name)}, ${esc(islandName(r.id))} (check rental permitting)` }));
    const seen = new Set();
    plan.days.forEach((d) => d.blocks.forEach((b) => {
      const p = BY_ID[b.ref];
      if (p && needsBooking(p) && !seen.has(p.id)) {
        seen.add(p.id);
        const link = p.links ? p.links[p.links.length > 1 ? 1 : 0] : p.link ? p.link : p.web ? { url: p.web } : null;
        items.push({ key: "res-" + p.id, html: `${esc(p.name)}: ${esc(p.reservation || p.reservations)}${link ? ` <a href="${link.url}" target="_blank" rel="noopener">Book ↗</a>` : ""}` });
      }
    }));
    return items;
  }
  function savedNotInPlan(plan) {
    const inPlan = new Set(plan.days.flatMap((d) => d.blocks.map((b) => b.ref)));
    const list = [...state.saved].filter((id) => BY_ID[id] && !inPlan.has(id));
    if (!list.length) return `<p class="small muted">Everything you've saved is in the plan. Save more from the <a href="#directory">directory</a>.</p>`;
    return `<ul class="saved-list">${list.map((id) => `<li><span>${esc(BY_ID[id].name)} <span class="small muted">${esc(islandName(BY_ID[id].island))}</span></span><button type="button" class="mini btn-sm" data-addplan="${id}">Add</button></li>`).join("")}</ul>`;
  }

  function mutate(fn) { pushUndo(); fn(state.plan); savePlan(); renderPlan(); }
  function reDate(plan) { plan.days.forEach((d, k) => (d.date = addDays(plan.inputs.start, k))); }
  function wirePlan() {
    $$("[data-bact]").forEach((el) => {
      const di = +el.dataset.d, bi = +el.dataset.b, act = el.dataset.bact;
      const h = () => mutate((plan) => {
        const blocks = plan.days[di].blocks;
        if (act === "up" && bi > 0) [blocks[bi - 1], blocks[bi]] = [blocks[bi], blocks[bi - 1]];
        if (act === "down" && bi < blocks.length - 1) [blocks[bi + 1], blocks[bi]] = [blocks[bi], blocks[bi + 1]];
        if (act === "del") blocks.splice(bi, 1);
        if (act === "swap") { blocks[bi].ref = el.dataset.to; blocks[bi].meta = "Swapped in"; }
        if (act === "move") { const to = +el.value; if (to !== di) { const [b] = blocks.splice(bi, 1); plan.days[to].blocks.push(b); } }
      });
      el.addEventListener(act === "move" ? "change" : "click", h);
    });
    $$("[data-dact]").forEach((el) => el.addEventListener("click", () => {
      const di = +el.dataset.d, act = el.dataset.dact;
      mutate((plan) => {
        const days = plan.days;
        if (act === "up" && di > 0) [days[di - 1], days[di]] = [days[di], days[di - 1]];
        if (act === "down" && di < days.length - 1) [days[di + 1], days[di]] = [days[di], days[di + 1]];
        if (act === "dup") { const c = JSON.parse(JSON.stringify(days[di])); c.kind = "full"; c.blocks.forEach((b) => (b.uid = Math.random().toString(36).slice(2, 9))); days.splice(di + 1, 0, c); }
        if (act === "del" && days.length > 1) days.splice(di, 1);
        reDate(plan);
      });
    }));
    $$("[data-ck]").forEach((el) => el.addEventListener("change", () => { state.plan.checks[el.dataset.ck] = el.checked; savePlan(); }));
    $$("[data-goto]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); showPlace(a.dataset.goto); }));
  }

  function addToPlan(id) {
    const p = BY_ID[id];
    if (!state.saved.has(id)) { state.saved.add(id); saveSaved(); }
    if (!state.plan) { toast($("#planToast"), ""); flash(`Saved ${p.name}. Build a plan in the planner to place it on a day.`); renderDirectory(false); return; }
    const days = state.plan.days.map((d, k) => [d, k]).filter(([d]) => d.island === p.island && d.kind === "full");
    if (!days.length) { flash(`${p.name} is on ${islandName(p.island)}, which isn't in your plan. Add the island in the planner first.`); return; }
    const isl = ISL[p.island];
    const best = days.sort(([a], [b]) => {
      const ca = a.blocks.filter((x) => x.type === "place").length, cb = b.blocks.filter((x) => x.type === "place").length;
      const da = Math.min(...a.blocks.filter((x) => BY_ID[x.ref]).map((x) => drive(BY_ID[x.ref], p)[0]).concat([drive(isl.bases[a.baseIdx], p)[0]]));
      const db = Math.min(...b.blocks.filter((x) => BY_ID[x.ref]).map((x) => drive(BY_ID[x.ref], p)[0]).concat([drive(isl.bases[b.baseIdx], p)[0]]));
      return ca * 20 + da - (cb * 20 + db);
    })[0];
    mutate((plan) => {
      const blocks = plan.days[best[1]].blocks;
      const slot = p.kind2 === "food" ? (p.meals.includes("Dinner") ? "Evening" : p.meals.includes("Lunch") ? "Lunch" : "Morning") : "Afternoon";
      blocks.push({ uid: Math.random().toString(36).slice(2, 9), slot, type: "place", ref: id, text: "", meta: "Added by you" });
      blocks.sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));
    });
    flash(`Added ${p.name} to day ${best[1] + 1}.`);
  }

  /* Export helpers */
  function planText() {
    const plan = state.plan; const pi = plan.inputs;
    const lines = [`Hawaiʻi trip plan: ${pi.islands.map((r) => islandName(r.id)).join(" + ")}, ${pi.islands.reduce((t, r) => t + r.nights, 0)} nights`, "Travel times are estimates. Verify hours, reservations and conditions with official sources.", ""];
    plan.days.forEach((d, k) => {
      lines.push(`Day ${k + 1}${pi.flexible ? "" : " (" + fmtDate(d.date) + ")"}: ${islandName(d.island)}, ${d.base}${d.title ? " · " + d.title : ""}`);
      d.blocks.forEach((b) => { const p = BY_ID[b.ref]; lines.push(`  ${b.slot}: ${p ? p.name + (p.web ? " " + p.web : "") : b.text}`); });
      lines.push("");
    });
    return lines.join("\n");
  }
  function planIcs() {
    const plan = state.plan;
    const icsEsc = (s) => String(s).replace(/[\\;,]/g, (c) => "\\" + c).replace(/\n/g, "\\n");
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const ev = plan.days.map((d, k) => [
      "BEGIN:VEVENT", `UID:hwp-${plan.created}-${k}@hawaii-well-planned`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${d.date.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${addDays(d.date, 1).replace(/-/g, "")}`,
      `SUMMARY:${icsEsc(`Day ${k + 1}: ${islandName(d.island)}${d.title ? " · " + d.title : ""}`)}`,
      `DESCRIPTION:${icsEsc(d.blocks.map((b) => `${b.slot}: ${BY_ID[b.ref] ? BY_ID[b.ref].name : b.text}`).join("\n"))}`,
      `LOCATION:${icsEsc(d.base + ", " + ISL[d.island].plain + ", HI")}`, "END:VEVENT"].join("\r\n"));
    return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hawaii Well Planned//EN", "CALSCALE:GREGORIAN", ...ev, "END:VCALENDAR"].join("\r\n");
  }
  function encodePlan(plan) {
    const compact = { i: plan.inputs, d: plan.days.map((d) => [d.date, d.island, d.base, d.baseIdx, d.kind, d.title || "", d.blocks.map((b) => [b.slot, b.type, b.ref || "", b.text, b.meta])]) };
    return btoa(unescape(encodeURIComponent(JSON.stringify(compact)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function decodePlan(s) {
    const json = decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
    const c = JSON.parse(json);
    return { v: 1, created: hawaiiToday(), inputs: c.i, checks: {}, days: c.d.map(([date, island, base, baseIdx, kind, title, blocks]) => ({ date, island, base, baseIdx, kind, title, blocks: blocks.map(([slot, type, ref, text, meta]) => ({ uid: Math.random().toString(36).slice(2, 9), slot, type, ref: ref || null, text, meta })) })) };
  }

  function wireToolbar() {
    $("#undoBtn").onclick = undo;
    $("#shareBtn").onclick = () => copyText(location.href.split("#")[0] + "#plan=" + encodePlan(state.plan), $("#planToast"));
    $("#copyTextBtn").onclick = () => copyText(planText(), $("#planToast"));
    $("#icsBtn").onclick = () => { try { download("hawaii-trip.ics", planIcs(), "text/calendar"); toast($("#planToast"), "Calendar file downloaded."); } catch (e) { toast($("#planToast"), "Download blocked here. Use Copy as text instead."); } };
    $("#printBtn").onclick = () => window.print();
  }

  /* ========================================================== TRIP DRAWER */
  function renderTripSummary() {
    const n = state.saved.size;
    const plan = state.plan;
    const open = plan ? checklistItems(plan).filter((t) => !plan.checks[t.key]).length : 0;
    $("#tripPillMeta").textContent = `${n} saved${plan ? ` · ${open} to do` : ""}`;
    const dlg = $("#tripDrawer");
    if (!dlg.open) return;
    const pi = (plan && plan.inputs) || state.planInputs;
    const nights = pi ? pi.islands.reduce((t, r) => t + r.nights, 0) : null;
    const dates = pi && pi.start ? `${fmtDate(pi.start)} – ${fmtDate(addDays(pi.start, nights || pi.nights))}` : "Not set";
    $("#drawerBody").innerHTML = `
      <div class="summary-grid">
        <div><span>Dates</span><b style="font-size:1rem">${pi ? (pi.flexible ? "Flexible" : esc(dates)) : "Not set"}</b></div>
        <div><span>Island(s)</span><b style="font-size:1rem">${pi && pi.islands.length ? esc(pi.islands.map((r) => islandName(r.id)).join(" + ")) : "Not chosen"}</b></div>
        <div><span>Nights</span><b>${nights || "–"}</b></div>
        <div><span>Saved places</span><b>${n}</b></div>
      </div>
      <div><h3>Open booking and access tasks</h3>${plan ? `<p>${open} of ${checklistItems(plan).length} still to do. <a href="#planner" data-close>Open checklist</a></p>` : `<p class="small muted">Build a plan to get a checklist.</p>`}</div>
      <div><h3>Saved places</h3>${n ? `<ul class="saved-list">${[...state.saved].filter((id) => BY_ID[id]).map((id) => `<li><a href="#${id}" data-goto-d="${id}">${esc(BY_ID[id].name)}</a><button type="button" class="mini btn-sm" data-unsave="${id}" aria-label="Remove ${esc(BY_ID[id].name)}">Remove</button></li>`).join("")}</ul>` : `<p class="small muted">Nothing saved yet. Use Save on any place card.</p>`}</div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap"><a class="btn btn-sm" href="#planner" data-close>Go to planner</a><a class="btn btn-ghost btn-sm" href="#directory" data-close>Browse places</a></div>
      <p class="small muted">Your trip is stored in this browser only. Use “Copy share link” in the planner to move it to another device.</p>`;
    $$("[data-close]", dlg).forEach((a) => a.addEventListener("click", () => dlg.close()));
    $$("[data-unsave]", dlg).forEach((b) => b.addEventListener("click", () => { state.saved.delete(b.dataset.unsave); saveSaved(); renderDirectory(false); if (state.plan) renderPlan(); }));
    $$("[data-goto-d]", dlg).forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); dlg.close(); showPlace(a.dataset.gotoD); }));
  }

  /* ============================================================ REPORTS */
  function openReport(about) {
    const dlg = $("#reportDialog");
    $("#reportAbout").textContent = "About: " + about;
    dlg.dataset.about = about;
    $("#reportText").value = ""; $("#reportStatus").textContent = "";
    dlg.showModal();
  }
  function wireReport() {
    const dlg = $("#reportDialog");
    $("#reportCancel").onclick = () => dlg.close();
    $("#reportForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const r = { about: dlg.dataset.about, type: $("#reportType").value, text: $("#reportText").value.trim(), page: location.href.split("#")[0], at: new Date().toISOString() };
      if (!r.text) { $("#reportStatus").textContent = "Add a sentence about what changed so an editor can check it."; $("#reportText").focus(); return; }
      if (REPORT_ENDPOINT) {
        try {
          const res = await fetch(REPORT_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r) });
          if (!res.ok) throw new Error();
          $("#reportStatus").textContent = "Thanks. An editor will review it.";
          setTimeout(() => dlg.close(), 1400);
          return;
        } catch (err) { /* fall through to local queue */ }
      }
      const q = store.get("reports", []); q.push(r); store.set("reports", q);
      $("#reportStatus").textContent = "Saved in this browser. Report sending isn't connected yet, so it hasn't reached an editor.";
    });
  }

  /* ============================================================== flash */
  function flash(msg) {
    let el = $("#flash");
    if (!el) {
      el = document.createElement("div"); el.id = "flash"; el.setAttribute("role", "status");
      el.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:40;background:var(--ink);color:var(--bg);padding:.65rem 1rem;border-radius:8px;max-width:calc(100% - 32px);font-weight:600;box-shadow:var(--shadow)";
      document.body.appendChild(el);
    }
    el.textContent = msg; el.hidden = false;
    clearTimeout(el._t); el._t = setTimeout(() => (el.hidden = true), 3800);
  }

  /* ======================================================== global events */
  function wireGlobal() {
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-save],[data-addplan],[data-share],[data-report]");
      if (!t) return;
      if (t.dataset.save) {
        const id = t.dataset.save;
        state.saved.has(id) ? state.saved.delete(id) : state.saved.add(id);
        saveSaved();
        const on = state.saved.has(id);
        t.setAttribute("aria-pressed", on); t.textContent = on ? "Saved" : "Save";
        t.setAttribute("aria-label", `${on ? "Remove" : "Save"} ${BY_ID[id].name}`);
        if (state.plan) renderPlan();
      } else if (t.dataset.addplan) addToPlan(t.dataset.addplan);
      else if (t.dataset.share) copyText(location.href.split("#")[0] + "#" + t.dataset.share).then((ok) => flash(ok ? "Link to this place copied." : "Couldn't copy the link."));
      else if (t.dataset.report) openReport(t.dataset.report);
    });
    const MOON = "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z";
    const SUN = "M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0-6 1.2 3.2h-2.4zm0 22-1.2-3.2h2.4zM1 12l3.2-1.2v2.4zm22 0-3.2 1.2v-2.4zM4.2 4.2l3.1 1.4-1.7 1.7zm15.6 15.6-3.1-1.4 1.7-1.7zM4.2 19.8l1.4-3.1 1.7 1.7zM19.8 4.2l-1.4 3.1-1.7-1.7z";
    const applyTheme = (dark) => {
      if (dark) document.documentElement.setAttribute("data-theme", "dark"); else document.documentElement.removeAttribute("data-theme");
      const b = $("#themeToggle");
      b.setAttribute("aria-pressed", String(dark));
      b.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      $("#themeLabel").textContent = dark ? "Light" : "Dark";
      $("#themeIcon").setAttribute("d", dark ? SUN : MOON);
    };
    applyTheme(store.get("theme", "light") === "dark");
    $("#themeToggle").onclick = () => { const dark = document.documentElement.getAttribute("data-theme") !== "dark"; store.set("theme", dark ? "dark" : "light"); applyTheme(dark); };
    $("#tripPill").onclick = () => { $("#tripDrawer").showModal(); renderTripSummary(); };
    $("#closeDrawer").onclick = () => $("#tripDrawer").close();
    $("#tripDrawer").addEventListener("click", (e) => { if (e.target === $("#tripDrawer")) $("#tripDrawer").close(); });
    $("#surpriseBtn").onclick = surprise;
    wireTabs($(".tabs[aria-label='Directory']"), (t, focus) => setTab(t.dataset.kind, focus));
  }

  function handleHash() {
    const h = location.hash.slice(1);
    if (h.startsWith("plan=")) {
      try {
        const plan = decodePlan(h.slice(5));
        pushUndo();
        state.plan = plan; state.planInputs = plan.inputs; state._warnings = [["info", "Shared plan loaded", "This plan came from a share link. It's now saved in this browser; edit it freely."]];
        savePlan(); renderPlannerForm(); renderPlan();
        history.replaceState(null, "", location.pathname + location.search + "#planner");
        setTimeout(() => $("#planner").scrollIntoView(), 50);
      } catch (e) { flash("That share link couldn't be read. It may be incomplete."); }
    } else if (BY_ID[h]) setTimeout(() => showPlace(h), 50);
  }

  /* ================================================================ init */
  function init() {
    fillStatic();
    renderQuiz();
    if (Object.keys(state.quiz).length > 1) { state.quizShown = true; renderResults(); }
    renderCompare();
    renderBetween();
    renderWhen();
    renderWeatherControls();
    renderFoodList();
    renderDirectory();
    renderHistory();
    renderPlannerForm();
    renderPlan();
    wireToolbar();
    wireReport();
    wireGlobal();
    renderTripSummary();
    handleHash();
    window.addEventListener("hashchange", handleHash);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
