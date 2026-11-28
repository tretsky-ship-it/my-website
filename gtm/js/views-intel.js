/* Sales Intelligence screens: Calls (import, per-call insights beside the transcript), Deals (HubSpot deals,
   health and MEDDIC), Trends (patterns across calls) and Product insights (a dashboard for the product team). */
(function () {
  'use strict';
  var G = window.GTM, App = window.App, S = App.S, esc = App.esc, I = App.icon, V = App.views, A = App.act;

  function T() { var t = S.t; t.calls = t.calls || []; t.deals = t.deals || []; t.productStatus = t.productStatus || {}; return t; }
  function callById(id) { return T().calls.find(function (c) { return c.id === id; }); }
  function dealById(id) { return T().deals.find(function (d) { return d.id === id; }); }
  function dealName(c) { var d = c.dealId && dealById(c.dealId); return d ? d.name : ''; }
  function scoreBadge(sc) { return sc.score === null ? App.badge('muted', sc.label) : App.badge(sc.tone, sc.label + ' · ' + sc.score); }
  var MEDDIC_TONE = { known: 'ok', partial: 'warn', unknown: 'muted' };
  function meddicDots(m) {
    return '<span class="meddic-dots" title="' + esc(G.MEDDIC.map(function (x) { return x.label + ': ' + ((m[x.key] || {}).status || 'unknown'); }).join('\n')) + '">' +
      G.MEDDIC.map(function (x) { var st = (m[x.key] || {}).status || 'unknown'; return '<i class="' + st + '">' + x.label[0] + '</i>'; }).join('') + '</span>';
  }
  App.meddicDots = meddicDots;

  /* ================= Calls ================= */
  V.calls = {
    title: 'Calls',
    header: function () {
      var c = S.param && callById(S.param);
      if (c) return { title: c.title || 'Call', actions: '<a class="btn ghost" href="#/calls">All calls</a><button class="btn" data-act="call-link" data-id="' + c.id + '">' + I('deal') + (c.dealId ? 'Change deal' : 'Link to deal') + '</button><button class="btn primary" data-act="call-analyze" data-id="' + c.id + '">' + I('sparkle') + (c.analysis ? 'Re-analyze' : 'Analyze call') + '</button>' };
      var un = T().calls.filter(function (x) { return !x.analysis; }).length;
      return { title: 'Calls', actions: (un ? '<button class="btn" data-act="calls-analyze-all">' + I('sparkle') + 'Analyze ' + un + ' new</button>' : '') + '<button class="btn primary" data-act="call-add">' + I('plus') + 'Add call</button>' };
    },
    render: function (param) {
      var t = T();
      if (param) { var c = callById(param); return c ? callDetail(t, c) : '<p>That call no longer exists. <a href="#/calls">Back to calls</a></p>'; }
      if (!t.calls.length) return App.emptyState('mic', 'Bring in your sales calls', 'Paste a transcript or upload one from Fathom, Zoom, Gong or anywhere else. GTM Engine finds the questions, objections, pains, competitors, product feedback and next steps, scores the call with MEDDIC, and rolls it up to the deal and to trends across all calls.', '<button class="btn primary" data-act="call-add">' + I('plus') + 'Add the first call</button>');
      var rows = t.calls.slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
      return '<div class="card"><div class="table-wrap"><table class="t"><thead><tr><th>Call</th><th>Deal</th><th>How it went</th><th class="num">Buyer talk</th><th>Next step</th><th class="num">Objections</th></tr></thead><tbody>' +
        rows.map(function (c) {
          var sc = G.callScore(c), a = c.analysis, ts = G.talkShare(c);
          return '<tr class="click" data-act="go" data-href="#/calls/' + c.id + '" tabindex="0"><td class="name"><b>' + esc(c.title) + '</b><span>' + App.fmtDate(c.date) + ' · ' + esc(c.source) + ' · ' + App.plural(ts.speakers, 'speaker') + '</span></td>' +
            '<td>' + (c.dealId ? esc(dealName(c)) : '<span class="faint">Not linked</span>') + '</td><td>' + scoreBadge(sc) + '</td>' +
            '<td class="num">' + (ts.buyerShare === null ? '—' : Math.round(ts.buyerShare * 100) + '%') + '</td>' +
            '<td class="small" style="max-width:260px">' + (a ? (a.nextStep && a.nextStep.agreed ? esc(a.nextStep.text || 'Agreed') : '<span class="badge bad">None agreed</span>') : '—') + '</td>' +
            '<td class="num">' + (a ? (a.objections || []).length : '—') + '</td></tr>';
        }).join('') + '</tbody></table></div></div>';
    }
  };
  A.go = function (el) { App.go(el.getAttribute('data-href')); };

  function quoteLink(c, q) { return q ? '<button type="button" class="quote" data-act="call-jump" data-id="' + c.id + '" data-q="' + esc(q.slice(0, 60)) + '">“' + esc(q) + '”</button>' : ''; }
  function callDetail(t, c) {
    var a = c.analysis, sc = G.callScore(c), p = G.parseTranscript(c.transcript), ts = sc.talk || G.talkShare(c);
    var left = '';
    if (!a) left += '<div class="note warn">' + I('sparkle') + '<div class="grow"><b>Not analyzed yet.</b> Analyze it to pull out questions, objections, pains, competitors, product feedback, MEDDIC and next steps.<div style="margin-top:8px"><button class="btn primary sm" data-act="call-analyze" data-id="' + c.id + '">Analyze call</button></div></div></div>';
    else {
      left += '<div class="card"><div class="card-h"><h2>How it went</h2>' + scoreBadge(sc) + '</div><div class="card-b stack sm">' +
        (a.summary ? '<p style="margin:0">' + esc(a.summary) + '</p>' : '') +
        '<ul class="reasons">' + sc.reasons.map(function (r) { return '<li class="' + (r.good ? 'good' : 'bad') + '">' + I(r.good ? 'check' : 'alert') + esc(r.text) + '</li>'; }).join('') + '</ul></div></div>';
      left += '<div class="card"><div class="card-h"><h2>MEDDIC</h2>' + meddicDots(a.meddic || {}) + '</div><table class="t"><tbody>' + G.MEDDIC.map(function (x) {
        var e = (a.meddic || {})[x.key] || { status: 'unknown' };
        return '<tr><td style="width:170px"><b>' + x.label + '</b><br><small class="muted">' + esc(x.q) + '</small></td><td>' + App.badge(MEDDIC_TONE[e.status] || 'muted', e.status || 'unknown') + '</td><td class="small">' + esc(e.note || '') + (e.quote ? '<br>' + quoteLink(c, e.quote) : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
      left += section('Objections', a.objections, function (o) { return '<b>' + esc(o.topic) + '</b> ' + App.badge(o.handled === 'yes' ? 'ok' : o.handled === 'partly' ? 'warn' : 'bad', o.handled === 'yes' ? 'Answered' : o.handled === 'partly' ? 'Partly answered' : 'Left open') + (o.response ? '<div class="small muted">How we answered: ' + esc(o.response) + '</div>' : '') + quoteLink(c, o.quote); });
      left += section('Questions the buyer asked', a.questions, function (q) { return '<b>' + esc(q.topic) + '</b>' + (q.answered === false ? ' ' + App.badge('warn', 'Not answered') : '') + quoteLink(c, q.quote); });
      left += section('Pains', a.pains, function (x) { return '<b>' + esc(x.topic) + '</b>' + quoteLink(c, x.quote); });
      left += section('Competitors mentioned', a.competitors, function (x) { return '<b>' + esc(x.topic) + '</b>' + (x.context ? ' <span class="small muted">' + esc(x.context) + '</span>' : '') + quoteLink(c, x.quote); });
      left += section('Product feedback', a.feedback, function (x) { return '<b>' + esc(x.topic) + '</b> ' + App.badge(x.type === 'blocker' ? 'bad' : x.type === 'praised' ? 'ok' : 'warn', x.type || 'request') + (x.severity ? ' <span class="small muted">' + esc(x.severity) + ' severity</span>' : '') + quoteLink(c, x.quote); });
      left += section('What landed well', a.positives, function (x) { return '<b>' + esc(x.topic) + '</b>' + quoteLink(c, x.quote); });
      if (a.risks && a.risks.length) left += '<div class="card"><div class="card-h"><h2>Risks to watch</h2></div><div class="card-b"><ul style="margin:0;padding-left:18px">' + a.risks.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul></div></div>';
    }
    var sides = c.sides || {};
    var right = '<div class="card sticky"><div class="card-h"><h2>Transcript<span class="sub">' + App.plural(p.words, 'word') + ' · ' + App.fmtDT(c.date) + ' · ' + esc(c.source) + '</span></h2></div>' +
      '<div class="card-b stack sm" style="border-bottom:1px solid var(--line)"><div class="label">Who\'s who <span class="small muted" style="font-weight:400">(click to switch sides)</span></div><div class="row tight">' +
      p.speakers.map(function (s) { var side = sides[s.name] || 'buyer'; return '<button type="button" class="chip side-' + side + '" data-act="call-side" data-id="' + c.id + '" data-name="' + esc(s.name) + '">' + esc(s.name) + ' · ' + (side === 'seller' ? 'our team' : 'buyer') + ' · ' + Math.round(s.words / Math.max(1, p.words) * 100) + '%</button>'; }).join('') + '</div>' +
      (ts.buyerShare !== null ? '<div class="meter" title="Buyer vs our team"><span class="a" style="width:' + Math.round(ts.buyerShare * 100) + '%;background:var(--ok)"></span><span class="a" style="width:' + (100 - Math.round(ts.buyerShare * 100)) + '%;background:var(--accent)"></span></div><div class="legend"><span><i style="background:var(--ok)"></i>Buyer ' + Math.round(ts.buyerShare * 100) + '%</span><span><i style="background:var(--accent)"></i>Our team ' + (100 - Math.round(ts.buyerShare * 100)) + '%</span></div>' : '') +
      '</div><div class="transcript" id="tx">' + p.segments.map(function (s) {
        return '<div class="seg ' + ((sides[s.speaker] || 'buyer') === 'seller' ? 'us' : 'them') + '" data-i="' + s.i + '"><div class="who">' + esc(s.speaker) + (s.time ? ' <span class="faint">' + esc(s.time) + '</span>' : '') + '</div><div>' + esc(s.text) + '</div></div>';
      }).join('') + '</div></div>';
    return '<div class="split wide-side"><div class="stack">' + left + '<div class="row"><button class="btn ghost danger sm" data-act="call-delete" data-id="' + c.id + '">Delete call</button></div></div>' + right + '</div>';
    function section(title, items, fn) {
      if (!items || !items.length) return '';
      return '<div class="card"><div class="card-h"><h2>' + title + '</h2><span class="badge muted plain">' + items.length + '</span></div><div class="list">' + items.map(function (x) { return '<div class="li" style="display:block">' + fn(x) + '</div>'; }).join('') + '</div></div>';
    }
  }
  A['call-jump'] = function (el) {
    var q = el.getAttribute('data-q').toLowerCase().replace(/\s+/g, ' ').slice(0, 40), tx = document.getElementById('tx'); if (!tx) return;
    var segs = [].slice.call(tx.querySelectorAll('.seg')), hit = segs.find(function (s) { return s.textContent.toLowerCase().replace(/\s+/g, ' ').indexOf(q) > -1; });
    if (!hit) { q = q.split(' ').slice(0, 4).join(' '); hit = segs.find(function (s) { return s.textContent.toLowerCase().indexOf(q) > -1; }); }
    tx.querySelectorAll('.seg.hl').forEach(function (s) { s.classList.remove('hl'); });
    if (hit) { hit.classList.add('hl'); hit.scrollIntoView({ block: 'center', behavior: 'smooth' }); } else App.toast('That quote is paraphrased; it couldn\'t be found word for word', 'bad');
  };
  A['call-side'] = function (el) {
    var c = callById(el.getAttribute('data-id')), n = el.getAttribute('data-name'); c.sides = c.sides || {};
    c.sides[n] = (c.sides[n] || 'buyer') === 'seller' ? 'buyer' : 'seller';
    var tm = T().profile.teamNames = T().profile.teamNames || [];
    if (c.sides[n] === 'seller' && tm.indexOf(n) < 0) tm.push(n); if (c.sides[n] === 'buyer') T().profile.teamNames = tm.filter(function (x) { return x !== n; });
    App.save(); App.render();
  };
  A['call-delete'] = function (el) {
    var t = T(), c = callById(el.getAttribute('data-id'));
    App.confirm({ title: 'Delete "' + c.title + '"?', body: '<p>Its insights leave the deal and trend views. The transcript source in Evidence is kept.</p>', ok: 'Delete call', danger: true }).then(function (ok) {
      if (!ok) return; t.calls = t.calls.filter(function (x) { return x !== c; }); G.log(t, 'Operator', 'Deleted call', c.title); App.save(); App.go('#/calls');
    });
  };

  /* ---------- add a call ---------- */
  function dealOptions(sel) { return '<option value="">Not linked to a deal</option>' + T().deals.map(function (d) { return '<option value="' + d.id + '"' + (d.id === sel ? ' selected' : '') + '>' + esc(d.name + (d.company ? ' · ' + d.company : '')) + '</option>'; }).join('') + '<option value="__new">+ New deal…</option>'; }
  A['call-add'] = function (el) {
    var t = T(), pre = el && el.getAttribute && el.getAttribute('data-deal');
    var now = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
    var m = App.modal({
      title: 'Add a call', wide: true, sub: 'Paste the transcript, or upload the file from Fathom, Zoom, Gong, Teams or Meet (.txt, .vtt, .srt, .md).',
      body: '<div class="field"><label for="cl-x">Transcript</label><textarea id="cl-x" rows="9" autofocus placeholder="Jordan Avery: Thanks for making time today…&#10;Pat Lee: Happy to. Our AP team is buried…"></textarea><input type="file" id="cl-f" accept=".txt,.vtt,.srt,.md,text/plain" style="margin-top:6px"></div>' +
        '<div id="cl-sp"></div>' +
        '<div class="fields"><div class="field"><label for="cl-t">Call title</label><input id="cl-t" placeholder="e.g. Acme discovery call"></div><div class="field"><label for="cl-d">When</label><input id="cl-d" type="datetime-local" value="' + now + '"></div>' +
        '<div class="field"><label for="cl-deal">Deal</label><select id="cl-deal">' + dealOptions(pre) + '</select></div><div class="field"><label for="cl-acc">Company (optional)</label><select id="cl-acc"><option value="">—</option>' + t.accounts.map(function (a) { return '<option value="' + a.id + '">' + esc(a.name) + '</option>'; }).join('') + '</select></div></div>' +
        '<label class="check"><input type="checkbox" id="cl-go" checked> Analyze it right away</label>',
      onOpen: function (mm) {
        var x = mm.body.querySelector('#cl-x'), f = mm.body.querySelector('#cl-f');
        function refresh() {
          var p = G.parseTranscript(x.value), box = mm.body.querySelector('#cl-sp'), team = t.profile.teamNames || [];
          if (!p.speakers.length || !x.value.trim()) { box.innerHTML = ''; return; }
          box.innerHTML = '<div class="field"><label>Who\'s on your team? <span class="hint" style="font-weight:400">Tick the sellers. Everyone else counts as the buyer.</span></label><div class="row tight">' + p.speakers.slice(0, 12).map(function (s) {
            var seller = G.guessSide(s.name, team.concat(t.profile.outreachOwner ? [t.profile.outreachOwner] : [])) === 'seller';
            return '<label class="check chip"><input type="checkbox" data-side="' + esc(s.name) + '"' + (seller ? ' checked' : '') + '> ' + esc(s.name) + ' <span class="faint">' + Math.round(s.words / Math.max(1, p.words) * 100) + '%</span></label>';
          }).join('') + '</div>' + (p.speakers.length === 1 && p.speakers[0].name === 'Unknown' ? '<span class="hint">No speaker names found. Insights still work, but talk time can\'t be measured.</span>' : '') + '</div>';
        }
        x.addEventListener('input', refresh);
        f.addEventListener('change', function () { if (f.files[0]) App.readFile(f.files[0]).then(function (txt) { x.value = txt; var tt = mm.body.querySelector('#cl-t'); if (!tt.value) tt.value = f.files[0].name.replace(/\.[a-z]+$/i, '').replace(/[_-]+/g, ' '); refresh(); }); });
        var dsel = mm.body.querySelector('#cl-deal');
        dsel.addEventListener('change', function () {
          if (dsel.value !== '__new') return;
          App.prompt({ title: 'New deal', label: 'Deal name', placeholder: 'e.g. Acme - Pilot', ok: 'Create deal', required: true }).then(function (n) {
            if (!n) { dsel.value = ''; return; }
            var d = { id: G.uid('deal'), name: n, stage: '', amount: null, company: '', accountId: null, owner: '', source: 'Manual', createdAt: G.now() };
            t.deals.push(d); App.save(); dsel.innerHTML = dealOptions(d.id);
          });
        });
      },
      actions: [{ label: 'Cancel', cls: 'ghost' }, {
        label: 'Add call', cls: 'primary', onClick: function (mm) {
          var b = mm.body, tx = b.querySelector('#cl-x').value.trim();
          if (tx.length < 40) { App.toast('Paste or upload the transcript first', 'bad'); return false; }
          var sides = {}; G.parseTranscript(tx).speakers.forEach(function (s) { sides[s.name] = 'buyer'; });
          b.querySelectorAll('[data-side]').forEach(function (cb) { sides[cb.getAttribute('data-side')] = cb.checked ? 'seller' : 'buyer'; });
          var reps = Object.keys(sides).filter(function (n) { return sides[n] === 'seller'; });
          t.profile.teamNames = G.uniq((t.profile.teamNames || []).concat(reps));
          var dealId = b.querySelector('#cl-deal').value; if (dealId === '__new') dealId = '';
          var deal = dealId && dealById(dealId), accId = b.querySelector('#cl-acc').value || (deal && deal.accountId) || null;
          var when = b.querySelector('#cl-d').value ? new Date(b.querySelector('#cl-d').value).toISOString() : G.now();
          var title = b.querySelector('#cl-t').value.trim() || (deal ? deal.name : 'Call') + ', ' + App.fmtDate(when);
          var c = { id: G.uid('call'), title: title, date: when, source: 'Pasted / uploaded', transcript: tx.slice(0, 250000), sides: sides, reps: reps, dealId: dealId || null, accountId: accId, createdAt: G.now(), analysis: null };
          // Every call is also an evidence source, so its quotes can back ICP and campaign decisions.
          var src = { id: G.uid('src'), title: 'Call: ' + title, type: 'Transcript', date: when.slice(0, 10), owner: reps[0] || t.profile.outreachOwner || '', permission: 'internal', url: '', originId: c.id, withdrawn: false, addedAt: G.now(), content: tx.slice(0, 200000) };
          t.sources.push(src); c.sourceId = src.id;
          t.calls.push(c); G.log(t, 'Operator', 'Added call', title); App.save();
          var go = b.querySelector('#cl-go').checked;
          App.go('#/calls/' + c.id);
          if (go) setTimeout(function () { App.analyzeCall(c.id); }, 80);
        }
      }]
    });
    return m;
  };
  A['call-link'] = function (el) {
    var c = callById(el.getAttribute('data-id'));
    var m = App.modal({ title: 'Link "' + c.title + '" to a deal', body: '<div class="field"><label for="lk-d">Deal</label><select id="lk-d">' + dealOptions(c.dealId) + '</select></div>',
      onOpen: function (mm) { var s = mm.body.querySelector('#lk-d'); s.addEventListener('change', function () { if (s.value === '__new') App.prompt({ title: 'New deal', label: 'Deal name', ok: 'Create deal', required: true }).then(function (n) { if (!n) { s.value = ''; return; } var d = { id: G.uid('deal'), name: n, stage: '', amount: null, company: '', accountId: c.accountId, owner: '', source: 'Manual', createdAt: G.now() }; T().deals.push(d); App.save(); s.innerHTML = dealOptions(d.id); }); }); },
      actions: [{ label: 'Cancel', cls: 'ghost' }, { label: 'Save', cls: 'primary', onClick: function (mm) { var v = mm.body.querySelector('#lk-d').value; c.dealId = v && v !== '__new' ? v : null; var d = c.dealId && dealById(c.dealId); if (d && d.accountId && !c.accountId) c.accountId = d.accountId; App.save(); App.render(); } }] });
    return m;
  };

  /* ---------- AI analysis of a call ---------- */
  function analysisPrompt(t, c) {
    var reps = Object.keys(c.sides || {}).filter(function (n) { return c.sides[n] === 'seller'; });
    var known = {}; Object.keys(G.INSIGHT_KINDS).forEach(function (k) { known[k] = G.knownTopics(t, k, 30); });
    var icp = G.activeICP(t);
    return 'You are a sales-call analyst (like Gong) for ' + (t.profile.name || 'the seller') + ', which sells: ' + (t.profile.offer || 'see transcript') + '.' +
      (icp && icp.personas.length ? ' Buyer personas: ' + icp.personas.map(function (p) { return p.name; }).join(', ') + '.' : '') +
      '\nSpeakers on the SELLER side: ' + (reps.join(', ') || 'unknown; infer from context') + '. Everyone else is the buyer side.' +
      '\n\nAnalyze ONLY what the buyer side says for questions, objections, pains, competitors, product feedback and positive reactions (the seller praising their own product is not a positive reaction). Use short reusable topic labels (2-5 words) so the same issue gets the same label across calls. Reuse these existing labels when they fit:' +
      Object.keys(known).map(function (k) { return known[k].length ? '\n- ' + k + ': ' + known[k].join('; ') : ''; }).join('') +
      '\nQuotes must be copied word for word from the transcript (max 30 words). Do not invent anything that was not said. A hypothetical question is not an objection.' +
      '\n\nTranscript:\n"""\n' + String(c.transcript).slice(0, 120000) + '\n"""' +
      '\n\nReply with ONLY a JSON object:\n{"summary":"3 sentences: what the buyer needs, where the deal stands, what happens next",' +
      '"sentiment":"positive | mixed | negative | unclear (the buyer\'s overall reaction)",' +
      '"nextStep":{"agreed":true,"text":"what was agreed","date":"YYYY-MM-DD or empty"},' +
      '"meddic":{"metrics":{"status":"known | partial | unknown","note":"what we learned","quote":""},"economicBuyer":{...},"decisionCriteria":{...},"decisionProcess":{...},"identifyPain":{...},"champion":{...}},' +
      '"objections":[{"topic":"label","quote":"buyer\'s words","handled":"yes | partly | no","response":"how the seller answered"}],' +
      '"questions":[{"topic":"label","quote":"","answered":true}],"pains":[{"topic":"label","quote":""}],' +
      '"competitors":[{"topic":"competitor or current tool","context":"evaluating | current vendor | mentioned","quote":""}],' +
      '"feedback":[{"topic":"label","type":"missing | confusing | praised | blocker","severity":"low | medium | high","quote":""}],' +
      '"positives":[{"topic":"label","quote":""}],"risks":["short risk"]}';
  }
  function s(v, n) { return String(v == null ? '' : v).trim().slice(0, n || 300); }
  function list(v, fn) { return (Array.isArray(v) ? v : []).slice(0, 15).map(fn).filter(function (x) { return x.topic; }); }
  function cleanAnalysis(d) {
    if (!d || typeof d !== 'object') return null;
    var oneOf = function (v, opts, def) { v = String(v || '').toLowerCase().trim(); return opts.indexOf(v) > -1 ? v : def; };
    var m = {}; G.MEDDIC.forEach(function (x) { var e = (d.meddic || {})[x.key] || {}; m[x.key] = { status: oneOf(e.status, ['known', 'partial', 'unknown'], 'unknown'), note: s(e.note, 240), quote: s(e.quote, 240) }; });
    var ns = d.nextStep || {};
    var a = {
      summary: s(d.summary, 700), sentiment: oneOf(d.sentiment, ['positive', 'mixed', 'negative', 'unclear'], 'unclear'),
      nextStep: { agreed: ns.agreed === true || ns.agreed === 'true', text: s(ns.text, 200), date: /^\d{4}-\d{2}-\d{2}$/.test(ns.date || '') ? ns.date : '' }, meddic: m,
      objections: list(d.objections, function (o) { return { topic: s(o && o.topic, 60), quote: s(o && o.quote, 260), handled: oneOf(o && o.handled, ['yes', 'partly', 'no'], 'no'), response: s(o && o.response, 240) }; }),
      questions: list(d.questions, function (o) { return { topic: s(o && o.topic, 60), quote: s(o && o.quote, 260), answered: o && o.answered !== false }; }),
      pains: list(d.pains, function (o) { return { topic: s(o && o.topic, 60), quote: s(o && o.quote, 260) }; }),
      competitors: list(d.competitors, function (o) { return { topic: s(o && (o.topic || o.name), 60), context: s(o && o.context, 60), quote: s(o && o.quote, 260) }; }),
      feedback: list(d.feedback, function (o) { return { topic: s(o && o.topic, 60), type: oneOf(o && o.type, ['missing', 'confusing', 'praised', 'blocker'], 'missing'), severity: oneOf(o && o.severity, ['low', 'medium', 'high'], 'medium'), quote: s(o && o.quote, 260) }; }),
      positives: list(d.positives, function (o) { return { topic: s(o && o.topic, 60), quote: s(o && o.quote, 260) }; }),
      risks: (Array.isArray(d.risks) ? d.risks : []).map(function (r) { return s(r, 200); }).filter(Boolean).slice(0, 6)
    };
    return a.summary || a.objections.length || a.questions.length ? a : null;
  }
  function saveAnalysis(c, a) { c.analysis = a; c.analyzedAt = G.now(); G.log(T(), 'GTM Engine (analysis)', 'Analyzed call', c.title + ' · ' + G.callScore(c).label); App.save(); }
  App.analyzeCall = function (id) {
    var t = T(), c = callById(id);
    App.askClaude({
      title: 'Analyze "' + c.title + '"', sub: 'Questions, objections, pains, competitors, product feedback, MEDDIC and next steps, with quotes.', basis: App.plural(G.parseTranscript(c.transcript).words, 'word') + ' of transcript',
      prompt: analysisPrompt(t, c), clean: cleanAnalysis,
      preview: function (a) {
        var tmp = Object.assign({}, c, { analysis: a }), sc = G.callScore(tmp);
        return '<div class="row">' + scoreBadge(sc) + '<span class="grow small">' + esc(a.summary) + '</span></div>' +
          App.resultTiles([['Objections', a.objections.length], ['Questions', a.questions.length], ['Pains', a.pains.length], ['Competitors', a.competitors.length], ['Product feedback', a.feedback.length], ['Positive reactions', a.positives.length]]) +
          '<div class="small">MEDDIC: ' + meddicDots(a.meddic) + ' · Next step: ' + (a.nextStep.agreed ? esc(a.nextStep.text || 'agreed') : 'none agreed') + '</div>';
      },
      applyLabel: 'Save analysis', apply: function (a) { saveAnalysis(c, a); App.render(); App.toast('Call analyzed'); }
    });
  };
  A['call-analyze'] = function (el) { App.analyzeCall(el.getAttribute('data-id')); };
  A['calls-analyze-all'] = function () {
    var t = T(), todo = t.calls.filter(function (c) { return !c.analysis; });
    var m = App.modal({ title: 'Analyzing ' + App.plural(todo.length, 'call'), body: '<div id="aa-p" class="stack sm"></div>', actions: [{ label: 'Close' }] });
    var box = m.body.querySelector('#aa-p'), done = 0, failed = 0, stop = false;
    m.root.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) stop = true; });
    function line(txt, tone) { box.insertAdjacentHTML('beforeend', '<div class="small">' + App.badge(tone, tone === 'ok' ? 'Done' : tone === 'bad' ? 'Failed' : 'Working') + ' ' + esc(txt) + '</div>'); }
    (function next(i) {
      if (stop || i >= todo.length) { box.insertAdjacentHTML('beforeend', '<div class="note ' + (failed ? 'warn' : 'ok') + '">' + I(failed ? 'alert' : 'check') + '<span class="grow">' + done + ' analyzed' + (failed ? ', ' + failed + ' failed (open each one to retry)' : '') + '.</span></div>'); App.rerender(); return; }
      var c = todo[i];
      App.aiJSON(analysisPrompt(t, c)).then(function (d) {
        var a = cleanAnalysis(d); if (!a) throw { code: 'empty' };
        saveAnalysis(c, a); done++; line(c.title + ' · ' + G.callScore(c).label, 'ok'); next(i + 1);
      }, function (e) {
        if (e && e.code === 'unavailable') { box.innerHTML = '<div class="note warn">' + I('info') + '<span class="grow">Batch analysis runs in the hosted version of GTM Engine. Here, open each call and click <b>Analyze call</b> to use the copy-and-paste route.</span></div>'; return; }
        failed++; line(c.title + (e && e.code === 'rate_limited' ? ' (usage limit; try again later)' : ''), 'bad'); if (e && e.code === 'rate_limited') stop = true; next(i + 1);
      });
    })(0);
  };

  /* ================= Deals ================= */
  V.deals = {
    title: 'Deals',
    header: function () {
      var d = S.param && dealById(S.param);
      if (d) return { title: d.name, actions: '<a class="btn ghost" href="#/deals">All deals</a><button class="btn primary" data-act="call-add" data-deal="' + d.id + '">' + I('plus') + 'Add call to this deal</button>' };
      return { title: 'Deals', actions: '<button class="btn" data-act="deal-add">' + I('plus') + 'Add deal</button><button class="btn primary" data-act="deals-import">' + I('upload') + 'Import HubSpot deals</button>' };
    },
    render: function (param) {
      var t = T();
      if (param) { var d = dealById(param); return d ? dealDetail(t, d) : '<p>Deal not found. <a href="#/deals">Back</a></p>'; }
      if (!t.deals.length) return App.emptyState('deal', 'See every deal\'s health', 'Export your deals from HubSpot (Deals → Export, CSV) and import them here, or add them as you go. Link calls to deals to see which are going well, MEDDIC gaps and open objections. A live HubSpot connection comes once its connector is set up.', '<button class="btn primary" data-act="deals-import">' + I('upload') + 'Import HubSpot deals</button><button class="btn" data-act="deal-add">' + I('plus') + 'Add a deal</button>');
      var rows = t.deals.map(function (d) { return { d: d, s: G.dealSummary(t, d) }; }).sort(function (a, b) { return (a.s.health === null) - (b.s.health === null) || (a.s.health || 0) - (b.s.health || 0); });
      var counts = { 'Going well': 0, Mixed: 0, 'At risk': 0 }; rows.forEach(function (r) { if (counts[r.s.label] != null) counts[r.s.label]++; });
      return '<div class="kpis" style="margin-bottom:16px">' + ['Going well', 'Mixed', 'At risk'].map(function (k) { return '<div class="kpi"><span class="k">' + k + '</span><span class="v">' + counts[k] + '</span><span class="s">deals, by their calls</span></div>'; }).join('') +
        '<div class="kpi"><span class="k">Open pipeline</span><span class="v">' + App.money(t.deals.reduce(function (n, d) { return n + (+d.amount || 0); }, 0)) + '</span><span class="s">' + App.plural(t.deals.length, 'deal') + '</span></div></div>' +
        '<div class="card"><div class="table-wrap"><table class="t"><thead><tr><th>Deal</th><th>Stage</th><th class="num">Amount</th><th>Health</th><th>MEDDIC</th><th class="num">Calls</th><th>Latest</th></tr></thead><tbody>' + rows.map(function (r) {
          var d = r.d, s = r.s;
          return '<tr class="click" data-act="go" data-href="#/deals/' + d.id + '" tabindex="0"><td class="name"><b>' + esc(d.name) + '</b><span>' + esc(d.company || '') + (d.owner ? ' · ' + esc(d.owner) : '') + '</span></td><td>' + esc(d.stage || '—') + '</td><td class="num">' + App.money(d.amount) + '</td>' +
            '<td>' + App.badge(s.tone, s.label + (s.health !== null ? ' · ' + s.health : '')) + '</td><td>' + meddicDots(s.meddic) + '</td><td class="num">' + s.calls.length + '</td>' +
            '<td class="small">' + (s.calls.length ? App.rel(s.calls[s.calls.length - 1].date) + (s.openObjections.length ? '<br><span class="muted">' + App.plural(s.openObjections.length, 'open objection') + '</span>' : '') : '<span class="faint">No calls</span>') + '</td></tr>';
        }).join('') + '</tbody></table></div></div>';
    }
  };
  function dealDetail(t, d) {
    var s = G.dealSummary(t, d);
    var tr = G.trends(t, { dealId: d.id });
    function top(kind, n) { var l = tr.kinds[kind].slice(0, n || 6); return l.length ? '<div class="list">' + l.map(function (e) { return '<button class="li" data-act="insight-open" data-kind="' + kind + '" data-key="' + esc(e.key) + '" data-deal="' + d.id + '"><span class="grow"><b>' + esc(e.label) + '</b><span>' + App.plural(e.calls.length, 'call') + (kind === 'objections' ? ' · ' + (e.handled.yes ? e.handled.yes + ' answered' : 'not answered yet') : '') + '</span></span>' + I('arrow') + '</button>'; }).join('') + '</div>' : '<div class="card-b small muted">None yet.</div>'; }
    return '<div class="split wide-side"><div class="stack">' +
      '<div class="card"><div class="card-h"><h2>Deal health</h2>' + App.badge(s.tone, s.label + (s.health !== null ? ' · ' + s.health : '')) + '</div><div class="card-b stack sm">' +
        (s.reasons.length ? '<ul class="reasons">' + s.reasons.map(function (r) { return '<li class="' + (r.good ? 'good' : 'bad') + '">' + I(r.good ? 'check' : 'alert') + esc(r.text) + '</li>'; }).join('') + '</ul>' : '<p class="muted" style="margin:0">' + (s.calls.length ? 'Analyze its calls to see how it\'s going.' : 'Add a call to this deal to see how it\'s going.') + '</p>') +
        (s.lastScore && s.calls[s.calls.length - 1].analysis ? '<div class="small"><b>Latest call summary:</b> ' + esc(s.calls[s.calls.length - 1].analysis.summary) + '</div>' : '') + '</div></div>' +
      '<div class="card"><div class="card-h"><h2>MEDDIC across all calls</h2>' + meddicDots(s.meddic) + '</div><table class="t"><tbody>' + G.MEDDIC.map(function (x) {
        var e = s.meddic[x.key]; return '<tr><td style="width:170px"><b>' + x.label + '</b><br><small class="muted">' + esc(x.q) + '</small></td><td>' + App.badge(MEDDIC_TONE[e.status], e.status) + '</td><td class="small">' + esc(e.note || (e.status === 'unknown' ? 'Not covered on any call yet. Ask next time.' : '')) + (e.callId ? ' <a href="#/calls/' + e.callId + '">call</a>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="grid2"><div class="card"><div class="card-h"><h2>Objections</h2></div>' + top('objections') + '</div><div class="card"><div class="card-h"><h2>Questions asked</h2></div>' + top('questions') + '</div>' +
      '<div class="card"><div class="card-h"><h2>Competitors</h2></div>' + top('competitors') + '</div><div class="card"><div class="card-h"><h2>Product feedback</h2></div>' + top('feedback') + '</div></div></div>' +
      '<div class="stack sticky"><div class="card"><div class="card-h"><h2>Deal</h2>' + (d.source ? '<span class="badge muted plain">' + esc(d.source) + '</span>' : '') + '</div><div class="card-b"><dl class="kv"><dt>Company</dt><dd>' + esc(d.company || '—') + '</dd><dt>Stage</dt><dd>' + esc(d.stage || '—') + '</dd><dt>Amount</dt><dd>' + App.money(d.amount) + '</dd><dt>Owner</dt><dd>' + esc(d.owner || '—') + '</dd><dt>Close date</dt><dd>' + App.fmtDate(d.closeDate) + '</dd>' + (d.crmId ? '<dt>HubSpot ID</dt><dd class="mono">' + esc(d.crmId) + '</dd>' : '') + '</dl></div></div>' +
      '<div class="card"><div class="card-h"><h2>Calls</h2><span class="badge muted plain">' + s.calls.length + '</span></div><div class="list">' + (s.calls.length ? s.calls.slice().reverse().map(function (c) { return '<a class="li" href="#/calls/' + c.id + '"><span class="grow"><b>' + esc(c.title) + '</b><span>' + App.fmtDate(c.date) + '</span></span>' + scoreBadge(G.callScore(c)) + '</a>'; }).join('') : '<div class="li small muted">No calls linked yet.</div>') + '</div></div></div></div>';
  }
  A['deal-add'] = function () {
    App.prompt({ title: 'Add a deal', label: 'Deal name', placeholder: 'e.g. Acme - Pilot', ok: 'Add deal', required: true }).then(function (n) {
      if (!n) return; var d = { id: G.uid('deal'), name: n, stage: '', amount: null, company: '', accountId: null, owner: '', source: 'Manual', createdAt: G.now() };
      T().deals.push(d); App.save(); App.go('#/deals/' + d.id);
    });
  };
  A['deals-import'] = function () {
    var t = T();
    App.importWizard({
      kind: 'deals', title: 'Import HubSpot deals', sub: 'In HubSpot: Deals → Export view (CSV). Deals are matched by HubSpot ID, so re-importing updates them.',
      template: 'Record ID,Deal Name,Deal Stage,Amount,Associated Company,Deal owner,Close Date,Pipeline\n901,Acme - Pilot,Demo scheduled,12000,Acme Robotics,Jordan Avery,2026-12-20,Sales\n',
      onImport: function (rows, mapping) { var r = G.importDeals(t, rows, mapping); G.log(t, 'Operator', 'Imported HubSpot deals', r.added + ' added, ' + r.updated + ' updated'); return r; },
      result: function (r) { return App.resultTiles([['Added', r.added], ['Updated', r.updated]]); },
      after: function () { App.rerender(); }
    });
  };

  /* ================= Trends ================= */
  function trendFilter() {
    var p = S.ui.tp || '90', f = {};
    if (p !== 'all') { f.to = new Date().toISOString(); f.from = new Date(Date.now() - (+p) * 864e5).toISOString(); }
    if (S.ui.tstage) f.stage = S.ui.tstage; if (S.ui.trep) f.rep = S.ui.trep;
    return f;
  }
  function filterBar(t) {
    var stages = G.uniq(t.deals.map(function (d) { return d.stage; }).filter(Boolean)), reps = G.uniq([].concat.apply([], t.calls.map(function (c) { return c.reps || []; })));
    return '<div class="row" style="margin-bottom:16px"><div class="seg">' + [['30', '30 days'], ['90', '90 days'], ['all', 'All time']].map(function (x) { return '<button data-act="tr-period" data-p="' + x[0] + '" class="' + ((S.ui.tp || '90') === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      (stages.length ? '<select data-act-change="tr-stage" style="max-width:200px" aria-label="Deal stage"><option value="">All deal stages</option>' + stages.map(function (s) { return '<option' + (S.ui.tstage === s ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select>' : '') +
      (reps.length ? '<select data-act-change="tr-rep" style="max-width:200px" aria-label="Rep"><option value="">All reps</option>' + reps.map(function (s) { return '<option' + (S.ui.trep === s ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select>' : '') + '</div>';
  }
  A['tr-period'] = function (el) { S.ui.tp = el.getAttribute('data-p'); App.render(); };
  document.addEventListener('change', function (e) {
    if (!e.target.matches) return;
    if (e.target.matches('[data-act-change="tr-stage"]')) { S.ui.tstage = e.target.value; App.render(); }
    if (e.target.matches('[data-act-change="tr-rep"]')) { S.ui.trep = e.target.value; App.render(); }
  });
  function trendList(t, kind, tr, ch, n) {
    var l = tr.kinds[kind].slice(0, n || 8);
    if (!l.length) return '<div class="card-b small muted">Nothing yet in this period.</div>';
    var max = l[0].calls.length;
    return '<div class="list">' + l.map(function (e) {
      var c = ch && ch.kinds[kind][e.key];
      return '<button class="li trend-row" data-act="insight-open" data-kind="' + kind + '" data-key="' + esc(e.key) + '"><span class="grow"><b>' + esc(e.label) + '</b>' + (c && c.isNew && ch.prevCalls ? ' ' + App.badge('accent', 'New') : c && e.calls.length > c.prevCalls * 1.5 && c.prevCalls ? ' ' + App.badge('warn', 'Rising') : '') +
        '<span class="bar"><i style="width:' + Math.round(e.calls.length / max * 100) + '%"></i></span><span>' + e.calls.length + ' of ' + tr.calls + ' calls (' + Math.round(e.share * 100) + '%) · ' + App.plural(e.accounts.length, 'company', 'companies') +
        (kind === 'objections' ? ' · answered ' + Math.round(e.handled.yes / Math.max(1, e.mentions.length) * 100) + '% of the time' : '') + '</span></span>' + I('arrow') + '</button>';
    }).join('') + '</div>';
  }
  V.trends = {
    title: 'Call trends',
    header: function () { return { title: 'Call trends' }; },
    render: function () {
      var t = T(), f = trendFilter(), tr = G.trends(t, f), ch = G.trendChange(t, f);
      if (!t.calls.some(function (c) { return c.analysis; })) return App.emptyState('trend', 'Trends appear after a few calls', 'Add and analyze calls. This page then shows what keeps coming up across them: top objections and how often they\'re answered, the questions buyers ask, pains, competitors and what lands well.', '<a class="btn primary" href="#/calls">Go to calls</a>');
      var calls = G.trendCalls(t, f), scores = calls.map(function (c) { return G.callScore(c); });
      var avg = scores.length ? Math.round(scores.reduce(function (n, s) { return n + s.score; }, 0) / scores.length) : null;
      var ns = calls.filter(function (c) { return c.analysis.nextStep && c.analysis.nextStep.agreed; }).length;
      var bsh = scores.map(function (s) { return s.talk && s.talk.buyerShare; }).filter(function (x) { return x !== null && x !== undefined; });
      function card(kind, title, sub) { return '<div class="card"><div class="card-h"><h2>' + title + '<span class="sub">' + sub + '</span></h2></div>' + trendList(t, kind, tr, ch) + '</div>'; }
      return filterBar(t) +
        '<div class="kpis" style="margin-bottom:16px"><div class="kpi"><span class="k">Calls analyzed</span><span class="v">' + tr.calls + '</span><span class="s">' + (ch ? ch.prevCalls + ' in the period before' : 'in this view') + '</span></div>' +
        '<div class="kpi"><span class="k">Average call score</span><span class="v' + (avg === null ? ' na' : '') + '">' + (avg === null ? '—' : avg) + '</span><span class="s">70+ is going well</span></div>' +
        '<div class="kpi"><span class="k">Ended with a next step</span><span class="v">' + (tr.calls ? Math.round(ns / tr.calls * 100) + '%' : '—') + '</span><span class="s">' + ns + ' of ' + tr.calls + ' calls</span></div>' +
        '<div class="kpi"><span class="k">Buyer talk time</span><span class="v">' + (bsh.length ? Math.round(bsh.reduce(function (n, x) { return n + x; }, 0) / bsh.length * 100) + '%' : '—') + '</span><span class="s">Average; 40–75% is healthy</span></div></div>' +
        '<div class="grid2">' + card('objections', 'Biggest objections', 'How often each comes up, and how often it\'s answered') + card('questions', 'Questions buyers ask', 'What prospects keep needing explained') +
        card('pains', 'Pains', 'Problems buyers describe in their own words') + card('competitors', 'Competitors and current tools', 'Who else comes up') +
        card('positives', 'What lands well', 'Moments buyers reacted well to') + card('feedback', 'Product feedback', 'Requests, confusion and blockers. Full view in Product insights') + '</div>';
    }
  };

  /* ================= Product insights (for the product team) ================= */
  var PSTAT = ['New', 'Investigating', 'Planned', 'Shipped', 'Won\'t do'];
  V.product = {
    title: 'Product insights',
    header: function () { return { title: 'Product insights', actions: '<button class="btn" data-act="product-copy">' + I('copy') + 'Copy summary for the product team</button>' }; },
    render: function () {
      var t = T(), f = trendFilter(), tr = G.trends(t, f), fb = tr.kinds.feedback, ch = G.trendChange(t, f);
      if (!t.calls.some(function (c) { return c.analysis; })) return App.emptyState('box', 'What buyers say about the product', 'Once calls are analyzed, this dashboard groups every product request, point of confusion, blocker and piece of praise, with how many calls and companies raised it, revenue at stake and quotes. Built for the product team to click into.', '<a class="btn primary" href="#/calls">Go to calls</a>');
      var at = function (e) { return e.deals.reduce(function (n, id) { var d = dealById(id); return n + (d && +d.amount || 0); }, 0); };
      var issues = fb.filter(function (e) { return !(e.types.praised && Object.keys(e.types).length === 1); }), praise = fb.filter(function (e) { return e.types.praised; });
      return filterBar(t) +
        '<div class="kpis" style="margin-bottom:16px"><div class="kpi"><span class="k">Product themes</span><span class="v">' + issues.length + '</span><span class="s">from ' + tr.calls + ' analyzed calls</span></div>' +
        '<div class="kpi"><span class="k">Blockers</span><span class="v">' + issues.filter(function (e) { return e.types.blocker; }).length + '</span><span class="s">stopping or stalling deals</span></div>' +
        '<div class="kpi"><span class="k">Revenue at stake</span><span class="v">' + App.money(issues.reduce(function (n, e) { return n + at(e); }, 0)) + '</span><span class="s">deals that raised an issue</span></div>' +
        '<div class="kpi"><span class="k">Recurring questions</span><span class="v">' + tr.kinds.questions.filter(function (e) { return e.calls.length > 1; }).length + '</span><span class="s">may point to confusing areas</span></div></div>' +
        '<div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Requests, confusion and blockers<span class="sub">Grouped by underlying problem. Click a row for the quotes behind it.</span></h2></div><div class="table-wrap"><table class="t"><thead><tr><th>Theme</th><th>Type</th><th>Severity</th><th class="num">Calls</th><th class="num">Companies</th><th class="num">Revenue at stake</th><th>Status</th></tr></thead><tbody>' +
        (issues.length ? issues.map(function (e) {
          var types = Object.keys(e.types).filter(function (k) { return k !== 'praised'; }), st = (t.productStatus[e.key] || {}).status || 'New', c = ch && ch.kinds.feedback[e.key];
          return '<tr class="click" data-act="insight-open" data-kind="feedback" data-key="' + esc(e.key) + '"><td><b>' + esc(e.label) + '</b>' + (c && c.isNew && ch.prevCalls ? ' ' + App.badge('accent', 'New') : '') + '</td><td>' + types.map(function (x) { return App.badge(x === 'blocker' ? 'bad' : 'warn', x); }).join(' ') + '</td><td>' + (['', 'Low', 'Medium', 'High'][e.severity] || '—') + '</td>' +
            '<td class="num">' + e.calls.length + '</td><td class="num">' + e.accounts.length + '</td><td class="num">' + App.money(at(e)) + '</td><td>' + App.badge(st === 'New' ? 'accent' : st === 'Shipped' ? 'ok' : 'muted', st) + '</td></tr>';
        }).join('') : '<tr><td colspan="7" class="muted">No product issues raised in this period.</td></tr>') + '</tbody></table></div></div>' +
        '<div class="grid2"><div class="card"><div class="card-h"><h2>What buyers praise</h2></div>' + (praise.length ? '<div class="list">' + praise.slice(0, 8).map(function (e) { return '<button class="li" data-act="insight-open" data-kind="feedback" data-key="' + esc(e.key) + '"><span class="grow"><b>' + esc(e.label) + '</b><span>' + App.plural(e.calls.length, 'call') + '</span></span>' + I('arrow') + '</button>'; }).join('') + '</div>' : '<div class="card-b small muted">Nothing yet.</div>') + '</div>' +
        '<div class="card"><div class="card-h"><h2>Questions buyers keep asking<span class="sub">Often a sign of a confusing area or missing docs</span></h2></div>' + trendList(t, 'questions', tr, ch, 8) + '</div></div>';
    }
  };
  A['product-copy'] = function () {
    var t = T(), tr = G.trends(t, trendFilter());
    var lines = ['# Product feedback from sales calls', '', '_' + tr.calls + ' analyzed calls_', ''];
    tr.kinds.feedback.slice(0, 15).forEach(function (e) { lines.push('- **' + e.label + '** (' + Object.keys(e.types).join(', ') + '): ' + e.calls.length + ' calls, ' + e.accounts.length + ' companies. Status: ' + ((t.productStatus[e.key] || {}).status || 'New') + (e.mentions[0] && e.mentions[0].quote ? '\n  > "' + e.mentions[0].quote + '" (a prospect)' : '')); });
    lines.push('', '## Questions buyers keep asking'); tr.kinds.questions.slice(0, 8).forEach(function (e) { lines.push('- ' + e.label + ' (' + e.calls.length + ' calls)'); });
    App.copy(lines.join('\n'), 'Summary copied');
  };

  /* ---------- insight drawer: the evidence behind any pattern ---------- */
  A['insight-open'] = function (el) { S.ui.ins = { kind: el.getAttribute('data-kind'), key: el.getAttribute('data-key'), deal: el.getAttribute('data-deal') || '' }; App.drawer({ render: insightDrawer }); };
  function insightDrawer() {
    var t = T(), q = S.ui.ins; if (!q) return null;
    var f = q.deal ? { dealId: q.deal } : trendFilter(), tr = G.trends(t, f), e = (tr.kinds[q.kind] || []).find(function (x) { return x.key === q.key; });
    if (!e) return null;
    var head = '<div class="small muted">' + esc(G.INSIGHT_KINDS[q.kind].label) + '</div><h2>' + esc(e.label) + '</h2><div class="small muted">' + App.plural(e.calls.length, 'call') + ' of ' + tr.calls + ' · ' + App.plural(e.accounts.length, 'company', 'companies') + ' · ' + App.plural(e.mentions.length, 'mention') + '</div>';
    var body = '';
    if (q.kind === 'feedback') {
      var ps = t.productStatus[q.key] = t.productStatus[q.key] || { status: 'New', note: '' };
      body += '<div class="card"><div class="card-h"><h3>Product status</h3></div><div class="card-b stack sm">' + App.bindSelect('productStatus.' + q.key + '.status', PSTAT, { label: 'Status', rerender: true }) + App.bindText('productStatus.' + q.key + '.note', { rows: 2, placeholder: 'Product team note', label: 'Note' }) + '</div></div>';
    }
    if (q.kind === 'objections') body += '<div class="note">' + I('info') + '<span class="grow">Answered ' + e.handled.yes + ' times, partly ' + e.handled.partly + ', left open ' + e.handled.no + '.</span></div>';
    body += '<div class="stack sm">' + e.mentions.slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }).map(function (m) {
      var c = callById(m.callId), d = c && c.dealId && dealById(c.dealId);
      return '<div class="persona" style="gap:6px">' + (m.quote ? '<div>“' + esc(m.quote) + '”</div>' : '') + (m.note ? '<div class="small muted">' + esc(m.note) + '</div>' : '') +
        '<div class="small"><a href="#/calls/' + m.callId + '">' + esc(c ? c.title : 'Call') + '</a> · ' + App.fmtDate(m.date) + (d ? ' · ' + esc(d.name) : '') + (m.handled ? ' · ' + App.badge(m.handled === 'yes' ? 'ok' : m.handled === 'partly' ? 'warn' : 'bad', m.handled === 'yes' ? 'answered' : m.handled === 'partly' ? 'partly answered' : 'left open') : '') + '</div></div>';
    }).join('') + '</div>';
    body += '<div class="row"><button class="btn" data-act="insight-learn">' + I('learning') + 'Send to Learning inbox</button><span class="small muted grow">Adds each mention as evidence, so repeated patterns can update the ICP.</span></div>';
    return { head: head, body: body };
  }
  A['insight-learn'] = function () {
    var t = T(), q = S.ui.ins, tr = G.trends(t, q.deal ? { dealId: q.deal } : trendFilter()), e = tr.kinds[q.kind].find(function (x) { return x.key === q.key; }); if (!e) return;
    var topic = (G.INSIGHT_KINDS[q.kind].one[0].toUpperCase() + G.INSIGHT_KINDS[q.kind].one.slice(1)) + ': ' + e.label, n = 0;
    e.mentions.forEach(function (m) {
      var c = callById(m.callId); if (!c) return;
      if (t.observations.some(function (o) { return o.topic === topic && o.callId === c.id; })) return;
      var acc = c.accountId && G.accountById(t, c.accountId);
      t.observations.push({ id: G.uid('obs'), topic: topic, text: m.quote || e.label, sourceId: c.sourceId || null, account: acc ? acc.domain : '', locator: '', contrary: false, createdAt: G.now(), callId: c.id }); n++;
    });
    G.log(t, 'Operator', 'Sent call insight to Learning inbox', topic); App.save(); S.ui.topic = topic;
    App.toast(n ? n + ' mention(s) added to the Learning inbox' : 'Already in the Learning inbox');
  };
})();
