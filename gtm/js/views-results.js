/* Screens: outcomes & reply queue, weekly brief, learning inbox, spend & activity, settings. */
(function () {
  'use strict';
  var G = window.GTM, App = window.App, S = App.S, esc = App.esc, I = App.icon, V = App.views, A = App.act;
  var EV_TEMPLATE = 'event id,type,email,occurred at,campaign id,deal id,amount,text\nsl-001,delivered,ava.stone@acme-robotics.com,2026-11-12T15:00:00Z,,,,\nsl-002,positive_reply,ava.stone@acme-robotics.com,2026-11-13T09:30:00Z,,,,"Sure, send times"\nhs-101,meeting_booked,ava.stone@acme-robotics.com,2026-11-13T10:00:00Z,,,,\nhs-d-9,opportunity,ava.stone@acme-robotics.com,2026-11-20T10:00:00Z,,D-9,25000,\n';
  var TYPE_TONE = { positive_reply: 'ok', meeting_booked: 'ok', meeting_held: 'ok', opportunity: 'ok', closed_won: 'ok', referral: 'accent', question: 'accent', reply: 'accent', objection: 'warn', negative: 'muted', opt_out: 'bad', bounce: 'bad', auto_reply: 'muted', sent: 'muted', delivered: 'muted', closed_lost: 'muted' };
  function typeBadge(ty) { return App.badge(TYPE_TONE[ty] || 'muted', G.EVENT_TYPES[ty] || ty); }

  /* ================= Results block (shared by brief and campaign results) ================= */
  App.resultsHTML = function (t, f, cmp) {
    var m = G.metrics(t, f);
    if (!t.events.some(function (e) { return !f.campaignId || e.campaignId === f.campaignId; })) {
      return App.emptyState('brief', 'No campaign data yet', 'Results appear once delivery, reply, meeting and deal events are imported for this ' + (cmp ? 'campaign' : 'client') + '.', '<a class="btn primary" href="#/outcomes">Import outcomes</a>');
    }
    var steps = [['Delivered contacts', m.delivered, null], ['Human replies', m.replies, m.rates.reply], ['Positive replies', m.positive, m.rates.positive], ['Meetings booked', m.booked, { n: m.booked, d: m.delivered }], ['Meetings held', m.held, m.rates.held], ['Opportunities', m.opportunities, { n: m.opportunities, d: m.held }], ['Closed won', m.wonCount, { n: m.wonCount, d: m.opportunities }]];
    var max = Math.max(1, m.delivered);
    function rate(k, r, sub, money) { return '<div class="kpi"><span class="k">' + k + '</span><span class="v' + (G.rate(r) === null ? ' na' : '') + '">' + App.rateHTML(r, { money: money }).replace(/<small/, '</span><span class="s"><small') + '</span>' + (sub ? '<span class="s">' + esc(sub) + '</span>' : '') + '</div>'; }
    return '<div class="stack">' +
      '<div class="card"><div class="card-h"><h2>Funnel<span class="sub">Unique people and deals. Each opportunity counts once however many contacts share it.</span></h2>' + (m.deliveryEstimated ? App.badge('warn', 'Delivery estimated from sends') : '') + '</div><div class="card-b"><div class="funnel">' +
        steps.map(function (s) { return '<div class="f"><span class="lab">' + s[0] + '</span><div class="track"><div class="fill" style="width:' + Math.max(1, s[1] / max * 100) + '%;opacity:' + (s[1] ? .9 : .25) + '"></div><span class="val">' + App.num(s[1]) + '</span></div><span class="conv">' + (s[2] ? App.rateHTML(s[2]) : '') + '</span></div>'; }).join('') +
      '</div></div></div>' +
      '<div class="kpis">' + rate('Human reply rate', m.rates.reply, 'Excludes automatic replies') + rate('Positive reply rate', m.rates.positive, 'Human-confirmed interest') + rate('Held-meeting rate', m.rates.held, m.booked + ' booked · ' + m.held + ' held') + rate('Show rate', m.rates.show, 'Held ÷ booked') +
        '<div class="kpi"><span class="k">Sourced pipeline</span><span class="v">' + App.money(m.pipeline) + '</span><span class="s">' + App.plural(m.opportunities, 'opportunity', 'opportunities') + (m.unpricedDeals ? ' · ' + m.unpricedDeals + ' unpriced' : '') + '</span></div>' +
        rate('Cost per held meeting', m.rates.costPerHeld, m.unpricedCosts ? m.unpricedCosts + ' unpriced cost item(s) not included' : 'Actual costs only', true) + '</div>' +
      '<div class="small muted">Sent ' + App.num(m.messages) + ' messages to ' + App.num(m.sent) + ' people · ' + m.bounced + ' bounced · ' + m.optOuts + ' opted out' + (m.unmatched ? ' · ' + m.unmatched + ' unmatched events not counted' : '') + '</div></div>';
  };

  /* ================= Outcomes ================= */
  V.outcomes = {
    title: 'Outcomes & replies',
    header: function () { return { title: 'Outcomes & replies', actions: '<button class="btn hide-sm" data-act="ev-template">' + I('download') + 'Template</button><button class="btn" data-act="ev-log">' + I('plus') + 'Log an outcome</button><button class="btn primary" data-act="ev-import">' + I('upload') + 'Import events</button>' }; },
    render: function (param) {
      var t = S.t;
      if (!t.events.length) return App.emptyState('outcomes', 'Collect what happened', 'Import delivery and reply events from Smartlead and meetings and deals from HubSpot (CSV works). Duplicate webhooks count once, late events update the original cohort and each reply becomes a single owner task.', '<button class="btn primary" data-act="ev-import">' + I('upload') + 'Import events</button><button class="btn" data-act="ev-template">' + I('download') + 'CSV template</button>');
      var tab = param || 'replies';
      var open = t.tasks.filter(function (k) { return k.status !== 'closed' && k.status !== 'booked'; }).length;
      var um = t.events.filter(function (e) { return e.match === 'unmatched'; }).length;
      var html = '<div class="tabs"><a href="#/outcomes" class="' + (tab === 'replies' ? 'on' : '') + '">Reply queue <span class="n' + (open ? ' alert' : '') + '">' + open + '</span></a><a href="#/outcomes/events" class="' + (tab === 'events' ? 'on' : '') + '">All events <span class="n">' + t.events.length + '</span></a><a href="#/outcomes/unmatched" class="' + (tab === 'unmatched' ? 'on' : '') + '">Unmatched <span class="n' + (um ? ' alert' : '') + '">' + um + '</span></a></div>';
      if (tab === 'events') return html + eventsTable(t);
      if (tab === 'unmatched') return html + unmatched(t);
      return html + replyQueue(t);
    }
  };
  function contactLine(t, id) { var c = G.contactById(t, id), a = c && G.accountById(t, c.accountId); return c ? esc(c.name) + ' <span class="muted">· ' + esc(c.title) + (a ? ', ' + esc(a.name) : '') + '</span>' : '<span class="faint">Unknown</span>'; }
  function replyQueue(t) {
    var f = S.ui.tf || 'open', now = G.now();
    var list = t.tasks.filter(function (k) { return f === 'all' || (k.status !== 'closed' && k.status !== 'booked'); }).sort(function (a, b) { return String(a.due).localeCompare(String(b.due)); });
    var html = '<div class="row" style="margin-bottom:12px"><div class="seg"><button data-act="task-filter" data-f="open" class="' + (f === 'open' ? 'on' : '') + '">Open</button><button data-act="task-filter" data-f="all" class="' + (f === 'all' ? 'on' : '') + '">All <span class="n">' + t.tasks.length + '</span></button></div><span class="grow"></span><span class="small muted">Response target: ' + esc(t.profile.responseTargetHours) + ' hours</span></div>';
    if (!list.length) return html + '<div class="card"><div class="empty"><div class="art">' + I('check') + '</div><h2>No open replies</h2><p>Every human reply has been handled.</p></div></div>';
    var classes = ['interested', 'question', 'referral', 'objection', 'negative', 'opt-out', 'automatic', 'unclassified'];
    return html + '<div class="card">' + list.map(function (k) {
      var i = t.tasks.indexOf(k), P = 'tasks.' + i + '.', c = G.campaignById(t, k.campaignId);
      var overdue = (k.status === 'assigned' || k.status === 'accepted') && k.due < now;
      var evs = t.events.filter(function (e) { return k.eventKeys.indexOf(e.key) > -1; }).sort(function (a, b) { return a.occurredAt.localeCompare(b.occurredAt); });
      return '<div class="task"><div class="stack sm"><div><b>' + contactLine(t, k.contactId) + '</b></div>' +
        '<div class="meta">' + App.badge(k.classification === 'interested' ? 'ok' : k.classification === 'opt-out' ? 'bad' : k.classification === 'unclassified' ? 'warn' : 'accent', k.classification) + '<span>' + esc(c ? c.name : 'No campaign') + '</span><span>·</span><span>Replied ' + App.rel(k.createdAt) + '</span><span>·</span>' + (overdue ? App.badge('bad', 'Overdue ' + App.rel(k.due).replace(' ago', '')) : '<span>Due ' + App.fmtDT(k.due) + '</span>') + (k.reviewDate ? '<span>·</span><span>Review after ' + App.fmtDate(k.reviewDate) + '</span>' : '') + '</div>' +
        (evs.length ? '<div class="stack sm">' + evs.map(function (e) { return '<div class="small">' + typeBadge(e.type) + ' <span class="muted">' + App.fmtDT(e.occurredAt) + ' · ' + esc(e.provider) + '</span>' + (e.text ? '<div style="margin:4px 0 0 2px;padding-left:10px;border-left:2px solid var(--line)">' + esc(e.text) + '</div>' : '') + '</div>'; }).join('') + '</div>' : '') +
        (k.referralTask ? '<label class="check small"><input type="checkbox" data-bind="' + P + 'referralTask.done"' + (k.referralTask.done ? ' checked' : '') + '> Research task: ' + esc(k.referralTask.note) + ' (check eligibility before enrollment)</label>' : '') +
        App.bindSwitch(P + 'hold.acknowledged', 'Provider confirmed the sequence is paused') + (k.hold && !k.hold.acknowledged ? ' <span class="badge warn">Stop not confirmed</span>' : '') +
        '<div>' + App.bindText(P + 'notes', { rows: 1, placeholder: 'Next action or notes', label: 'Notes' }) + '</div></div>' +
        '<div class="ctl" style="flex-direction:column;align-items:stretch;min-width:190px">' +
          '<label class="small muted">Classification' + App.bindSelect(P + 'classification', classes, { rerender: true, cls: 'sm', label: 'Classification' }) + '</label>' +
          '<label class="small muted">Status' + App.bindSelect(P + 'status', G.TASK_STATES, { rerender: true, cls: 'sm', label: 'Status' }) + '</label>' +
          '<label class="small muted">Owner' + App.bindInput(P + 'assignee', { cls: 'sm', label: 'Owner' }) + '</label></div></div>';
    }).join('') + '</div>';
  }
  // A reviewer classifying a reply as an opt-out updates suppression.
  document.addEventListener('change', function (e) {
    var el = e.target.closest && e.target.closest('[data-bind^="tasks."][data-bind$=".classification"]');
    if (!el || el.value !== 'opt-out') return;
    var t = S.t, k = t.tasks[+el.getAttribute('data-bind').split('.')[1]], c = G.contactById(t, k.contactId);
    if (c && G.addSuppression(t, c.email, 'Opted out', 'Reviewer classification')) { G.log(t, 'Operator', 'Suppressed after opt-out', c.email); App.save(); App.toast(c.email + ' added to do-not-contact'); }
  }, true);
  A['task-filter'] = function (el) { S.ui.tf = el.getAttribute('data-f'); App.render(); };
  function eventsTable(t) {
    var evs = t.events.slice().sort(function (a, b) { return b.occurredAt.localeCompare(a.occurredAt); });
    var MB = { matched: ['ok', 'Matched'], ambiguous: ['warn', 'Ambiguous'], 'no-campaign': ['muted', 'No campaign'], unmatched: ['bad', 'Unmatched'], unattributed: ['muted', 'Unattributed'] };
    return '<div class="card"><div class="table-wrap"><table class="t"><thead><tr><th>Occurred</th><th>Event</th><th>Contact</th><th>Campaign</th><th>Deal</th><th>Source</th><th>Match</th></tr></thead><tbody>' + evs.map(function (e) {
      var c = G.campaignById(t, e.campaignId), mb = MB[e.match] || ['muted', e.match];
      return '<tr><td class="nowrap small">' + App.fmtDT(e.occurredAt) + '</td><td>' + typeBadge(e.type) + '</td><td>' + (e.contactId ? contactLine(t, e.contactId) : '<span class="mono small">' + esc(e.email || '—') + '</span>') + '</td><td class="small">' + esc(c ? c.name + ' · batch ' + ((G.batchById(t, e.batchId) || {}).n || '') : '—') + '</td><td class="small">' + (e.dealId ? esc(e.dealId) + (e.amount != null ? ' · ' + App.money(e.amount) : '') : '—') + '</td><td class="small muted">' + esc(e.provider) + '<br><span class="mono">' + esc(e.eventId) + '</span></td><td>' + App.badge(mb[0], mb[1]) + '</td></tr>';
    }).join('') + '</tbody></table></div></div>';
  }
  function unmatched(t) {
    var list = t.events.filter(function (e) { return e.match === 'unmatched'; });
    if (!list.length) return '<div class="card"><div class="empty"><div class="art">' + I('check') + '</div><h2>Everything is matched</h2><p>Events whose email or deal does not resolve to a known contact wait here for reconciliation, instead of being guessed.</p></div></div>';
    var opts = '<option value="">Match to contact…</option>' + t.contacts.map(function (c) { var a = G.accountById(t, c.accountId); return '<option value="' + c.id + '">' + esc(c.name + ' · ' + (a ? a.name : '') + ' · ' + c.email) + '</option>'; }).join('');
    return '<div class="card">' + list.map(function (e) {
      return '<div class="li"><span class="grow"><b>' + typeBadge(e.type) + ' <span class="mono">' + esc(e.email || 'no email') + '</span></b><span>' + App.fmtDT(e.occurredAt) + ' · ' + esc(e.provider) + ' ' + esc(e.eventId) + (e.text ? ' · "' + esc(e.text.slice(0, 80)) + '"' : '') + '</span></span><select id="um-' + esc(e.key) + '" style="max-width:300px" aria-label="Contact">' + opts + '</select><button class="btn sm" data-act="ev-match" data-k="' + esc(e.key) + '">Match</button><button class="btn sm ghost" data-act="ev-unattr" data-k="' + esc(e.key) + '">Leave unattributed</button></div>';
    }).join('') + '</div><p class="small muted" style="margin-top:10px">Unattributed events stay out of campaign metrics. Nothing is credited without a documented association.</p>';
  }
  function evByKey(k) { return S.t.events.find(function (e) { return e.key === k; }); }
  A['ev-match'] = function (el) {
    var t = S.t, e = evByKey(el.getAttribute('data-k')), sel = document.getElementById('um-' + e.key);
    if (!sel.value) { App.toast('Choose a contact first', 'bad'); return; }
    G.manualMatch(t, e, sel.value); G.log(t, 'Operator', 'Manually matched event', e.eventId + ' → ' + (G.contactById(t, sel.value) || {}).name);
    App.save(); App.render(); App.toast('Event matched');
  };
  A['ev-unattr'] = function (el) { var e = evByKey(el.getAttribute('data-k')); e.match = 'unattributed'; G.log(S.t, 'Operator', 'Left event unattributed', e.eventId); App.save(); App.render(); };
  A['ev-template'] = function () { App.download('outcome-events-template.csv', EV_TEMPLATE); };
  A['ev-import'] = function () {
    var t = S.t;
    App.importWizard({
      kind: 'events', title: 'Import outcome events', sub: 'Types: sent, delivered, bounce, reply, positive_reply, question, referral, objection, negative, opt_out, auto_reply, meeting_booked, meeting_held, opportunity, closed_won, closed_lost. Common provider names are recognised.', template: EV_TEMPLATE,
      extra: '<div class="field"><label for="iw-pr">Provider</label><select id="iw-pr" name="provider"><option>Smartlead</option><option>HubSpot</option><option>Calendar</option><option>Fathom</option><option>Other CSV</option></select><span class="hint">Event IDs are unique per provider, so re-importing the same export counts each event once.</span></div>',
      onImport: function (rows, mapping, ex) { return G.importEvents(t, rows, mapping, { provider: ex.provider || 'CSV' }); },
      result: function (r) { return App.resultTiles([['New events', r.added], ['Duplicates ignored', r.duplicates], ['Unmatched', r.unmatched], ['Reply tasks', r.tasks], ['Opt-outs', r.optOuts], ['Unreadable type', r.invalid]]); },
      after: function () { App.rerender(); }
    });
  };
  A['ev-log'] = function () {
    var t = S.t;
    if (!t.contacts.length) { App.toast('Import contacts first', 'bad'); return; }
    var enrolled = t.enrollments.map(function (e) { return e.contactId; });
    var cs = t.contacts.slice().sort(function (a, b) { return (enrolled.indexOf(b.id) > -1) - (enrolled.indexOf(a.id) > -1); });
    App.modal({
      title: 'Log an outcome', sub: 'For a call disposition, a meeting booked by hand or a reply seen outside the sender.',
      body: '<div class="fields"><div class="field full"><label for="lo-c">Contact</label><select id="lo-c">' + cs.map(function (c) { var a = G.accountById(t, c.accountId); return '<option value="' + c.id + '">' + esc(c.name + ' · ' + (a ? a.name : '')) + (enrolled.indexOf(c.id) > -1 ? ' (enrolled)' : '') + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="lo-t">What happened</label><select id="lo-t">' + Object.keys(G.EVENT_TYPES).map(function (k) { return '<option value="' + k + '"' + (k === 'meeting_booked' ? ' selected' : '') + '>' + esc(G.EVENT_TYPES[k]) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="lo-d">When</label><input id="lo-d" type="datetime-local" value="' + new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16) + '"></div>' +
        '<div class="field"><label for="lo-deal">HubSpot deal ID (opportunities)</label><input id="lo-deal"></div><div class="field"><label for="lo-amt">Amount</label><input id="lo-amt" type="number"></div>' +
        '<div class="field full"><label for="lo-n">Note or reply text</label><textarea id="lo-n" rows="2"></textarea></div></div>',
      actions: [{ label: 'Cancel', cls: 'ghost' }, {
        label: 'Log outcome', cls: 'primary', onClick: function (m) {
          var b = m.body, c = G.contactById(t, b.querySelector('#lo-c').value);
          var row = { email: c.email, type: b.querySelector('#lo-t').value, occurredAt: new Date(b.querySelector('#lo-d').value).toISOString(), dealId: b.querySelector('#lo-deal').value, amount: b.querySelector('#lo-amt').value, text: b.querySelector('#lo-n').value, eventId: G.uid('man') };
          if (!c.email) { App.toast('That contact has no email to match on', 'bad'); return false; }
          var map = {}; Object.keys(row).forEach(function (k) { map[k] = k; });
          G.importEvents(t, [row], map, { provider: 'Manual' }); App.save(); App.render(); App.toast('Outcome logged');
        }
      }]
    });
  };

  /* ================= Weekly brief ================= */
  function period() {
    var p = S.ui.bp || '30';
    if (p === 'all') return { from: null, to: null, label: 'All time' };
    var to = new Date(), from = new Date(Date.now() - (+p) * 864e5);
    return { from: from.toISOString(), to: to.toISOString(), label: 'Last ' + p + ' days (' + App.fmtDate(from.toISOString()) + ' – ' + App.fmtDate(to.toISOString()) + ')' };
  }
  V.brief = {
    title: 'Weekly brief',
    header: function () { return { title: 'Weekly brief', actions: (App.hosted ? '' : '<button class="btn hide-sm" data-act="print">' + I('print') + 'Print</button>') + '<button class="btn" data-act="brief-md">' + I('download') + 'Download</button><button class="btn primary" data-act="brief-copy">' + I('copy') + 'Copy client summary</button>' }; },
    render: function () {
      var t = S.t, p = period(), cid = S.ui.bc || '';
      var f = { from: p.from, to: p.to, campaignId: cid || null };
      var m = G.metrics(t, f), am = G.accountMetrics(t);
      var last = t.events.reduce(function (x, e) { return e.receivedAt > x ? e.receivedAt : x; }, '');
      var lastTest = t.tests[t.tests.length - 1];
      var exc = App.attention(t).filter(function (a) { return a.tone !== 'accent'; });
      var spent = t.costs.filter(function (c) { return !c.estimated && c.amount != null && G.inRange(c.at, p.from, p.to); }).reduce(function (s, c) { return s + c.amount; }, 0);
      var est = t.costs.filter(function (c) { return c.estimated && !c.superseded && c.amount != null; }).reduce(function (s, c) { return s + c.amount; }, 0);
      var openOpps = t.events.filter(function (e) { return e.type === 'opportunity' && (!cid || e.campaignId === cid); }).map(function (e) { return e.dealId; });
      openOpps = G.uniq(openOpps).filter(function (d) { return !t.events.some(function (e) { return e.dealId === d && (e.type === 'closed_won' || e.type === 'closed_lost'); }); });
      return '<div class="row no-print" style="margin-bottom:16px"><div class="seg">' + [['7', 'Last 7 days'], ['30', 'Last 30 days'], ['all', 'All time']].map(function (x) { return '<button data-act="brief-period" data-p="' + x[0] + '" class="' + ((S.ui.bp || '30') === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>' +
        '<select data-act-change="brief-cmp" style="max-width:280px" aria-label="Campaign"><option value="">All campaigns</option>' + t.campaigns.map(function (c) { return '<option value="' + c.id + '"' + (c.id === cid ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select></div>' +
        '<div class="stack">' +
        '<div class="card"><div class="card-b"><div class="eyebrow small muted" style="font-weight:700;letter-spacing:.06em;text-transform:uppercase">' + esc(t.profile.name) + ' · ' + esc(p.label) + '</div><h2 style="font-size:19px;margin:6px 0 4px">' + esc(summarySentence(m)) + '</h2>' +
          '<div class="small muted">Observation window: ' + esc(p.label) + ' · Last event received ' + (last ? App.rel(last) : 'never') + ' · CRM: ' + esc(t.profile.crm || '—') + (t.profile.crm && !t.events.some(function (e) { return e.provider === 'HubSpot'; }) ? ' <span class="badge warn">No CRM events imported: deal data unavailable</span>' : '') + '</div></div></div>' +
        App.resultsHTML(t, f) +
        '<div class="grid2">' +
          '<div class="card"><div class="card-h"><h2>Targeting</h2></div><div class="card-b"><dl class="kv"><dt>Research yield</dt><dd>' + App.rateHTML(am.yield) + '</dd><dt>Contact coverage</dt><dd>' + App.rateHTML(am.coverage) + '</dd><dt>Eligible</dt><dd>' + am.counts.eligible + ' accounts</dd><dt>Needs research</dt><dd>' + am.counts.research + '</dd><dt>Exclusions</dt><dd>' + (Object.keys(am.exclusionReasons).map(function (k) { return am.exclusionReasons[k] + ' ' + esc(k.toLowerCase()); }).join(' · ') || 'None') + '</dd><dt>Open opportunities</dt><dd>' + openOpps.length + '</dd></dl></div></div>' +
          '<div class="card"><div class="card-h"><h2>Spend</h2></div><div class="card-b"><dl class="kv"><dt>Actual (period)</dt><dd>' + App.money(spent) + '</dd><dt>Approved, pending</dt><dd>' + App.money(est) + ' <span class="small muted">estimate</span></dd><dt>Budget</dt><dd>' + (t.profile.budget != null ? App.money(t.profile.budget) : 'Not set') + '</dd><dt>Unpriced items</dt><dd>' + m.unpricedCosts + '</dd><dt>Cost per held</dt><dd>' + App.rateHTML(m.rates.costPerHeld, { money: true }) + '</dd></dl></div></div>' +
        '</div>' +
        '<div class="card"><div class="card-h"><h2>Exceptions</h2>' + App.badge(exc.length ? 'warn' : 'ok', exc.length + '') + '</div>' + (exc.length ? '<div class="list">' + exc.map(function (a) { return '<a class="li" href="' + a.href + '"><span class="lico ' + a.tone + '">' + I(a.icon) + '</span><span class="grow"><b>' + esc(a.title) + '</b><span>' + esc(a.sub) + '</span></span></a>'; }).join('') + '</div>' : '<div class="card-b muted">No unmatched events, conflicts, overdue replies or blocked batches.</div>') + '</div>' +
        '<div class="card"><div class="card-h"><h2>One next test<span class="sub">The brief is complete once a test has a named owner.</span></h2></div><div class="card-b stack">' +
          (lastTest ? '<div class="note">' + I('flag') + '<div class="grow"><b>Current test:</b> ' + esc(lastTest.hypothesis) + '<br><span class="small muted">Owner ' + esc(lastTest.owner) + ' · assigned ' + App.fmtDate(lastTest.at) + (lastTest.due ? ' · review ' + App.fmtDate(lastTest.due) : '') + '</span></div></div>' : '') +
          '<div class="fields three"><div class="field full"><label for="nt-h">Hypothesis to test next</label><input id="nt-h" placeholder="e.g. Controllers reply more than CFOs to the same trigger"></div>' +
          '<div class="field"><label for="nt-o">Owner</label><input id="nt-o" value="' + esc(t.profile.outreachOwner || '') + '"></div><div class="field"><label for="nt-d">Review date</label><input id="nt-d" type="date" value="' + new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10) + '"></div><div class="field" style="align-self:end"><button class="btn primary" data-act="test-add">' + I('flag') + 'Assign next test</button></div></div>' +
          (m.delivered < 30 && m.delivered > 0 ? '<div class="small muted">' + I('info') + ' With ' + m.delivered + ' delivered contacts, results are directional. A numerical lead is not a winner; the next test should add observations, not declare one.</div>' : '') +
        '</div></div>' +
        '<details class="card"><summary class="card-b" style="cursor:pointer"><b>Definitions used in this brief</b></summary><div class="card-b small stack sm" style="padding-top:0">' +
          '<div><b>Reply rate</b>: unique contacts with a human reply ÷ unique delivered contacts. Automatic replies are excluded.</div><div><b>Positive reply rate</b>: unique contacts with a human-confirmed positive reply ÷ unique delivered contacts.</div>' +
          '<div><b>Held-meeting rate</b>: unique delivered contacts with a linked held meeting ÷ unique delivered contacts.</div><div><b>Sourced pipeline</b>: sum of unique opportunity amounts linked to the campaign. Multiple contacts on a deal do not multiply it.</div>' +
          '<div><b>Cost per held meeting</b>: actual attributable cost ÷ held meetings. Estimates and unpriced items are shown separately.</div><div>A zero denominator shows "Not computable". Late events update the cohort they belong to.</div></div></details>' +
        '</div>';
    }
  };
  function summarySentence(m) {
    if (!m.delivered && !m.replies) return 'No delivered outreach in this window yet.';
    return App.plural(m.delivered, 'contact') + ' reached, ' + App.plural(m.replies, 'human reply', 'human replies') + ' (' + m.positive + ' positive), ' + App.plural(m.held, 'held meeting') + (m.opportunities ? ' and ' + App.money(m.pipeline) + ' in sourced pipeline.' : '.');
  }
  function briefMarkdown() {
    var t = S.t, p = period(), cid = S.ui.bc || null, m = G.metrics(t, { from: p.from, to: p.to, campaignId: cid }), am = G.accountMetrics(t), lt = t.tests[t.tests.length - 1];
    function r(x) { return App.pct(x) === null ? 'not computable' : App.pct(x) + ' (' + x.n + '/' + x.d + ')'; }
    return ['# ' + t.profile.name + ': weekly GTM brief', '', '_' + p.label + (cid ? ' · ' + (G.campaignById(t, cid) || {}).name : '') + '_', '', summarySentence(m), '',
      '## Funnel', '- Delivered contacts: ' + m.delivered + (m.deliveryEstimated ? ' (estimated from sends)' : ''), '- Human replies: ' + m.replies + ', reply rate ' + r(m.rates.reply), '- Positive replies: ' + m.positive + ', ' + r(m.rates.positive),
      '- Meetings booked: ' + m.booked + ', held: ' + m.held + ', held-meeting rate ' + r(m.rates.held), '- Opportunities: ' + m.opportunities + ', sourced pipeline ' + App.money(m.pipeline) + (m.unpricedDeals ? ' (' + m.unpricedDeals + ' unpriced)' : ''), '- Closed won: ' + m.wonCount + ' (' + App.money(m.won) + ')', '',
      '## Targeting', '- Research yield: ' + r(am.yield), '- Contact coverage: ' + r(am.coverage), '- Exclusions: ' + (Object.keys(am.exclusionReasons).map(function (k) { return am.exclusionReasons[k] + ' ' + k.toLowerCase(); }).join(', ') || 'none'), '',
      '## Spend', '- Actual: ' + App.money(m.costActual) + '; approved but pending: ' + App.money(m.costEstimated) + '; unpriced items: ' + m.unpricedCosts, '- Cost per held meeting: ' + (G.rate(m.rates.costPerHeld) === null ? 'not computable' : App.money(m.rates.costPerHeld.n / m.rates.costPerHeld.d)), '',
      '## Next test', lt ? '- ' + lt.hypothesis + ' (owner: ' + lt.owner + (lt.due ? ', review ' + lt.due : '') + ')' : '- Not assigned yet', '',
      '_Rates divide unique contacts; each opportunity counts once. Sample sizes this small are directional._'].join('\n');
  }
  A['brief-period'] = function (el) { S.ui.bp = el.getAttribute('data-p'); App.render(); };
  document.addEventListener('change', function (e) { if (e.target.matches && e.target.matches('[data-act-change="brief-cmp"]')) { S.ui.bc = e.target.value; App.render(); } });
  A['brief-copy'] = function () { App.copy(briefMarkdown(), 'Client summary copied'); G.log(S.t, 'Operator', 'Copied weekly brief'); App.save(); };
  A['brief-md'] = function () { App.download(App.slug(S.t.profile.name) + '-weekly-brief-' + new Date().toISOString().slice(0, 10) + '.md', briefMarkdown(), 'text/markdown'); };
  A.print = function () { window.print(); };
  A['test-add'] = function () {
    var h = document.getElementById('nt-h').value.trim(), o = document.getElementById('nt-o').value.trim();
    if (!h || !o) { App.toast('A next test needs a hypothesis and a named owner', 'bad'); return; }
    S.t.tests.forEach(function (x) { if (x.status === 'running') x.status = 'superseded'; });
    S.t.tests.push({ id: G.uid('test'), at: G.now(), hypothesis: h, owner: o, due: document.getElementById('nt-d').value, status: 'running' });
    G.log(S.t, 'Operator', 'Assigned next test', h + ' · ' + o); App.save(); App.render(); App.toast('Next test assigned to ' + o);
  };

  /* ================= Learning inbox ================= */
  V.learning = {
    title: 'Learning inbox',
    header: function () { return { title: 'Learning inbox', actions: '<button class="btn primary" data-act="obs-add">' + I('plus') + 'Add observation</button>' }; },
    render: function () {
      var t = S.t, topics = G.topics(t), icp = G.activeICP(t);
      var props = t.proposals.slice().reverse();
      var intro = '<div class="note info" style="margin-bottom:16px">' + I('info') + '<span class="grow">Evidence counts distinct original sources: 2 is a weak signal, 5 a supported pattern, 10 validated learning. A proposal to change approved strategy opens automatically at 10; earlier needs a named person and a reason. Approval is always required.</span></div>';
      if (!topics.length && !props.length) return intro + App.emptyState('learning', 'Capture what you are hearing', 'Log observations from calls, replies and reviews under a topic. Mirrored notes and transcripts of the same meeting count once, contradicting evidence is kept, and nothing changes strategy silently.', '<button class="btn primary" data-act="obs-add">' + I('plus') + 'Add the first observation</button>');
      var sel = S.ui.topic && topics.indexOf(S.ui.topic) > -1 ? S.ui.topic : topics[0];
      var html = intro;
      if (props.length) html += '<div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Proposals</h2></div><div class="list">' + props.map(function (p) {
        var tone = p.status === 'open' ? 'warn' : p.status === 'approved' ? 'ok' : p.status === 'conflict' || p.status === 'needs fresh review' ? 'bad' : 'muted';
        return '<div class="li"><span class="lico ' + (tone === 'muted' ? '' : tone) + '">' + I('learning') + '</span><span class="grow"><b>' + esc(G.describeChange(icp, p.change)) + '</b><span>' + esc(p.topic) + ' · expects ICP v' + p.expectedVersion + ' · ' + p.evidenceCount + ' distinct sources · requested by ' + esc(p.requestedBy) + ' ' + App.rel(p.createdAt) + (p.resultVersion ? ' · created v' + p.resultVersion : '') + '</span></span>' + App.badge(tone, p.status) + (p.status === 'open' || p.status === 'needs fresh review' || p.status === 'conflict' ? '<button class="btn sm primary" data-act="prop-review" data-id="' + p.id + '">Review</button>' : '') + '</div>';
      }).join('') + '</div></div>';
      if (!topics.length) return html;
      html += '<div class="split"><div class="stack">' + topics.map(function (tp) {
        var s = G.topicSummary(t, tp), on = tp === sel;
        return '<div class="card" style="' + (on ? 'border-color:var(--accent-line);box-shadow:0 0 0 3px var(--accent-soft)' : '') + '"><button class="li" data-act="topic-sel" data-t="' + esc(tp) + '" style="border:0"><span class="grow"><b>' + esc(tp) + '</b><span>' + App.plural(s.distinctSources, 'distinct source') + ' · ' + App.plural(s.accounts.length, 'account') + (s.contrary ? ' · ' + App.plural(s.contrary, 'contradiction') : '') + '</span></span>' + App.badge(s.level.tone, s.level.label) + '</button>' +
          '<div style="padding:0 18px 12px"><div class="levelbar" title="' + s.distinctSources + ' of 10 sources for validated learning">' + Array.from({ length: 10 }).map(function (_, i) { return '<i class="' + (i < s.distinctSources ? 'on' : '') + '"></i>'; }).join('') + '</div></div>' +
          (on ? '<div class="card-b" style="border-top:1px solid var(--line)">' + topicDetail(t, s) + '</div>' : '') + '</div>';
      }).join('') + '</div>' +
        '<div class="sticky card"><div class="card-h"><h2>How counting works</h2></div><div class="card-b small stack sm"><div>' + App.badge('muted', 'Observation') + ' 1 source: kept, no action.</div><div>' + App.badge('warn', 'Weak signal') + ' 2–4 sources.</div><div>' + App.badge('accent', 'Supported pattern') + ' 5–9 sources: can suggest an experiment.</div><div>' + App.badge('ok', 'Validated learning') + ' 10+ sources: a strategy proposal can open.</div><div class="muted">Distinct accounts are counted separately, and the largest single-account share is shown so one loud customer cannot look like a trend.</div></div></div></div>';
      return html;
    }
  };
  function topicDetail(t, s) {
    var src = function (id) { var x = G.sourceById(t, id); return x ? esc(x.title) + (x.originId ? ' <span class="faint">(' + esc(x.originId) + ')</span>' : '') : '<span class="faint">no source</span>'; };
    return '<div class="stack sm">' +
      (s.concentration && s.concentration.share >= .5 && s.supporting > 1 ? '<div class="note warn">' + I('alert') + '<span class="grow">' + Math.round(s.concentration.share * 100) + '% of supporting observations come from ' + esc(s.concentration.account) + '.</span></div>' : '') +
      s.observations.map(function (o) { return '<div class="row" style="align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--line)"><span>' + (o.contrary ? App.badge('bad', 'Contradicts') : App.badge('ok', 'Supports')) + '</span><span class="grow"><span>' + esc(o.text) + '</span><br><small class="muted">' + src(o.sourceId) + (o.account ? ' · ' + esc(o.account) : '') + (o.locator ? ' · ' + esc(o.locator) : '') + ' · ' + App.fmtDate(o.createdAt) + '</small></span></div>'; }).join('') +
      '<div class="row" style="margin-top:6px"><button class="btn sm" data-act="obs-add" data-t="' + esc(s.topic) + '">' + I('plus') + 'Add observation</button><span class="grow"></span><button class="btn sm ' + (s.eligible ? 'primary' : '') + '" data-act="prop-new" data-t="' + esc(s.topic) + '">' + (s.eligible ? 'Propose strategy change' : 'Request early proposal') + '</button></div></div>';
  }
  A['topic-sel'] = function (el) { S.ui.topic = el.getAttribute('data-t'); App.render(); };
  A['obs-add'] = function (el) {
    var t = S.t, topics = G.topics(t), pre = el && el.getAttribute && el.getAttribute('data-t');
    App.modal({
      title: 'Add observation', sub: 'Something a buyer said or did, tied to its source. Count matters only across distinct sources.',
      body: '<div class="field"><label for="ob-t">Topic</label><input id="ob-t" list="ob-topics" value="' + esc(pre || '') + '" placeholder="e.g. Migration timing is the main objection" autofocus><datalist id="ob-topics">' + topics.map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist></div>' +
        '<div class="field"><label for="ob-x">What was observed</label><textarea id="ob-x" rows="3" placeholder="Quote or describe it"></textarea></div>' +
        '<div class="fields"><div class="field"><label for="ob-s">Source</label><select id="ob-s"><option value="">No source (will not count)</option>' + t.sources.filter(function (s) { return !s.withdrawn; }).map(function (s) { return '<option value="' + s.id + '">' + esc(s.title) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="ob-a">Account domain</label><input id="ob-a" list="ob-accts" placeholder="optional"><datalist id="ob-accts">' + t.accounts.map(function (a) { return '<option value="' + esc(a.domain) + '">' + esc(a.name) + '</option>'; }).join('') + '</datalist></div>' +
        '<div class="field"><label for="ob-l">Locator</label><input id="ob-l" placeholder="e.g. 12:41 or paragraph 3"></div></div>' +
        '<label class="check"><input type="checkbox" id="ob-c"> This contradicts the topic</label>',
      actions: [{ label: 'Cancel', cls: 'ghost' }, {
        label: 'Add observation', cls: 'primary', onClick: function (m) {
          var b = m.body, tp = b.querySelector('#ob-t').value.trim(), tx = b.querySelector('#ob-x').value.trim();
          if (!tp || !tx) { App.toast('A topic and the observation are required', 'bad'); return false; }
          t.observations.push({ id: G.uid('obs'), topic: tp, text: tx, sourceId: b.querySelector('#ob-s').value || null, account: G.normDomain(b.querySelector('#ob-a').value) || '', locator: b.querySelector('#ob-l').value, contrary: b.querySelector('#ob-c').checked, createdAt: G.now() });
          S.ui.topic = tp; G.log(t, 'Operator', 'Added observation', tp); App.save(); App.render(); App.toast('Observation added');
        }
      }]
    });
  };
  A['prop-new'] = function (el) {
    var t = S.t, tp = el.getAttribute('data-t'), s = G.topicSummary(t, tp), icp = G.activeICP(t);
    if (!icp) { App.toast('There is no approved ICP to change', 'bad'); return; }
    App.modal({
      title: s.eligible ? 'Propose a strategy change' : 'Request an early proposal', sub: esc(tp) + ' · ' + App.plural(s.distinctSources, 'distinct source') + ' · ' + s.level.label,
      body: '<div class="fields"><div class="field"><label for="pp-f">Change</label><select id="pp-f">' + Object.keys(G.CHANGE_FIELDS).map(function (k) { return '<option value="' + k + '">' + esc(G.CHANGE_FIELDS[k]) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field" id="pp-opw"><label for="pp-o">Action</label><select id="pp-o"><option value="add">Add</option><option value="remove">Remove</option></select></div>' +
        '<div class="field" id="pp-vw"><label for="pp-v">Value</label><input id="pp-v" placeholder="e.g. Logistics"></div>' +
        '<div class="field hidden" id="pp-pw"><label for="pp-p">Persona</label><select id="pp-p">' + icp.personas.map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + ' (now ' + p.priority + ')</option>'; }).join('') + '</select></div>' +
        '<div class="field hidden" id="pp-prw"><label for="pp-pr">New priority</label><select id="pp-pr"><option value="primary">Primary</option><option value="secondary">Secondary</option></select></div></div>' +
        '<div class="fields"><div class="field"><label for="pp-by">Requested by</label><input id="pp-by" value="' + esc(t.profile.outreachOwner || '') + '"></div>' +
        '<div class="field"><label for="pp-r">Reason' + (s.eligible ? ' (optional)' : ' (required below the threshold)') + '</label><input id="pp-r"></div></div>' +
        (!s.eligible ? '<div class="note warn">' + I('alert') + '<span class="grow">This topic has ' + s.distinctSources + ' of the 10 distinct sources needed for validated learning. You can still request a proposal, with a reason; it is labelled as early.</span></div>' : ''),
      onOpen: function (m) {
        var f = m.body.querySelector('#pp-f');
        f.addEventListener('change', function () { var pr = f.value === 'personaPriority'; ['pp-opw', 'pp-vw'].forEach(function (id) { m.body.querySelector('#' + id).classList.toggle('hidden', pr); }); ['pp-pw', 'pp-prw'].forEach(function (id) { m.body.querySelector('#' + id).classList.toggle('hidden', !pr); }); });
      },
      actions: [{ label: 'Cancel', cls: 'ghost' }, {
        label: 'Send for approval', cls: 'primary', onClick: function (m) {
          var b = m.body, field = b.querySelector('#pp-f').value, reason = b.querySelector('#pp-r').value.trim(), by = b.querySelector('#pp-by').value.trim();
          var ch = field === 'personaPriority' ? { field: field, op: 'set', personaId: b.querySelector('#pp-p').value, value: b.querySelector('#pp-pr').value } : { field: field, op: b.querySelector('#pp-o').value, value: b.querySelector('#pp-v').value.trim() };
          if (field !== 'personaPriority' && !ch.value) { App.toast('Enter the value to change', 'bad'); return false; }
          if (!s.eligible && !reason) { App.toast('Give a reason for proposing below the threshold', 'bad'); return false; }
          if (!by) { App.toast('Name who is requesting this', 'bad'); return false; }
          t.proposals.push({ id: G.uid('prop'), topic: tp, change: ch, expectedVersion: icp.v, evidenceCount: s.distinctSources, accounts: s.accounts, contrary: s.contrary, early: !s.eligible, reason: reason, requestedBy: by, createdAt: G.now(), status: 'open' });
          G.log(t, by, 'Proposed strategy change', G.describeChange(icp, ch)); App.save(); App.render(); App.toast('Proposal sent for approval');
        }
      }]
    });
  };
  A['prop-review'] = function (el) {
    var t = S.t, p = t.proposals.find(function (x) { return x.id === el.getAttribute('data-id'); }), icp = G.activeICP(t);
    var s = G.topicSummary(t, p.topic), after = G.clone(icp); G.applyChange(after, p.change);
    function val(v) {
      var c = p.change;
      if (c.field === 'personaPriority') { var pe = v.personas.find(function (x) { return x.id === c.personaId; }); return pe ? pe.name + ': ' + pe.priority : '—'; }
      var map = { industries: v.industries.values, disqualifierIndustries: v.disqualifiers.industries, disqualifierKeywords: v.disqualifiers.keywords, triggerKeywords: v.triggers.keywords, geography: v.geography.values };
      return (map[c.field] || []).join(', ') || 'none';
    }
    var stale = icp.v !== p.expectedVersion;
    var imp = G.icpImpact(t, icp, after);
    App.modal({
      title: 'Review proposal', sub: esc(G.describeChange(icp, p.change)), wide: true,
      body: (stale ? '<div class="note bad">' + I('alert') + '<span class="grow">This proposal expected ICP v' + p.expectedVersion + ', but v' + icp.v + ' is now active. Approving checks the version again and will be refused; reject it or ask for a fresh proposal against v' + icp.v + '.</span></div>' : '') +
        '<div class="diff"><div class="old"><b>Current (v' + icp.v + ')</b>' + esc(val(icp)) + '</div><div class="new"><b>Proposed (v' + (G.nextV(t)) + ')</b>' + esc(val(after)) + '</div></div>' +
        App.resultTiles([['Distinct sources', s.distinctSources], ['Accounts', s.accounts.length], ['Contradictions', s.contrary], ['Newly eligible', imp.newlyEligible.length], ['Newly out of scope', imp.newlyExcluded.length]]) +
        (p.early ? '<div class="note warn">' + I('alert') + '<span class="grow"><b>Early proposal</b> below the validated-learning threshold. Reason given: ' + esc(p.reason) + '</span></div>' : '') +
        '<div><div class="label" style="margin-bottom:6px">Evidence</div>' + topicDetail(t, s).replace(/<div class="row" style="margin-top:6px">[\s\S]*$/, '</div>') + '</div>' +
        '<div class="fields"><div class="field"><label for="pr-by">Decided by</label><input id="pr-by" value="' + esc(t.profile.approver || '') + '"></div><div class="field"><label for="pr-why">Reason</label><input id="pr-why"></div></div>' +
        '<div class="small muted">Approving creates a new ICP version and keeps v' + icp.v + ' for historical reports. Queued batches with contacts that move out of scope are held for review.</div>',
      actions: [{ label: 'Reject', cls: 'danger', onClick: function (m) { decide(m, 'reject'); } }, { label: 'Request more evidence', cls: 'ghost', onClick: function (m) { decide(m, 'more'); } }, { label: 'Approve change', cls: 'primary', icon: 'shield', onClick: function (m) { return decide(m, 'approve'); } }]
    });
    function decide(m, d) {
      var by = m.body.querySelector('#pr-by').value.trim();
      if (!by) { App.toast('Name who is deciding', 'bad'); return false; }
      var r = G.decideProposal(t, p, d, by, m.body.querySelector('#pr-why').value.trim());
      App.save(); App.render();
      if (r.conflict) App.toast('Refused: expected v' + r.expected + ' but v' + r.current + ' is active. The proposal needs fresh review.', 'bad');
      else if (r.ok && d === 'approve') App.toast('Approved. ICP v' + r.version + ' is now active.');
      else if (r.ok) App.toast('Decision recorded');
      else App.toast((r.problems || ['Could not apply'])[0], 'bad');
    }
  };

  /* ================= Spend & activity ================= */
  V.activity = {
    title: 'Spend & activity',
    header: function () { return { title: 'Spend & activity', actions: '<button class="btn primary" data-act="cost-add">' + I('plus') + 'Record cost</button>' }; },
    render: function () {
      var t = S.t;
      var actual = t.costs.filter(function (c) { return !c.estimated && c.amount != null; }).reduce(function (s, c) { return s + c.amount; }, 0);
      var pend = t.costs.filter(function (c) { return c.estimated && !c.superseded && c.amount != null; }).reduce(function (s, c) { return s + c.amount; }, 0);
      var unpriced = t.costs.filter(function (c) { return c.amount == null; }).length;
      var credits = t.costs.filter(function (c) { return !c.estimated; }).reduce(function (s, c) { return s + (+c.credits || 0); }, 0);
      var held = G.metrics(t).held;
      var q = (S.ui.lq || '').toLowerCase();
      return '<div class="kpis" style="margin-bottom:16px"><div class="kpi"><span class="k">Actual spend</span><span class="v">' + App.money(actual) + '</span><span class="s">' + App.num(credits) + ' provider credits</span></div><div class="kpi"><span class="k">Approved, pending</span><span class="v">' + App.money(pend) + '</span><span class="s">Estimate, not yet billed</span></div>' +
        '<div class="kpi"><span class="k">Budget remaining</span><span class="v' + (t.profile.budget == null ? ' na' : '') + '">' + (t.profile.budget != null ? App.money(t.profile.budget - actual - pend) : 'No budget set') + '</span><span class="s">' + (t.profile.budget != null ? 'of ' + App.money(t.profile.budget) : '<a href="#/setup">Set a cap</a>') + '</span></div>' +
        '<div class="kpi"><span class="k">Cost per held meeting</span><span class="v' + (held ? '' : ' na') + '">' + (held ? App.money(actual / held) : 'Not computable') + '</span><span class="s">' + (unpriced ? unpriced + ' unpriced item(s) excluded' : 'Actual costs only') + '</span></div></div>' +
        '<div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Costs</h2></div><div class="table-wrap"><table class="t"><thead><tr><th>Date</th><th>Kind</th><th>Provider</th><th class="num">Credits</th><th class="num">Amount</th><th>Type</th><th>Note</th></tr></thead><tbody>' +
          (t.costs.length ? t.costs.slice().sort(function (a, b) { return b.at.localeCompare(a.at); }).map(function (c) { return '<tr><td class="small nowrap">' + App.fmtDate(c.at) + '</td><td>' + esc(c.kind) + '</td><td>' + esc(c.provider || '—') + '</td><td class="num">' + App.num(c.credits) + '</td><td class="num">' + (c.amount == null ? '<span class="badge warn">Unpriced</span>' : App.money(c.amount)) + '</td><td>' + (c.estimated ? App.badge(c.superseded ? 'muted' : 'warn', c.superseded ? 'Estimate (replaced)' : 'Estimate') : App.badge('ok', 'Actual')) + '</td><td class="small muted">' + esc(c.note || '') + '</td></tr>'; }).join('') : '<tr><td colspan="7" class="muted">No costs recorded yet.</td></tr>') +
        '</tbody></table></div></div>' +
        '<div class="card"><div class="card-h"><h2>Audit log<span class="sub">Every approval records who, when, which version and what was decided.</span></h2><input type="search" data-filter="log" placeholder="Filter" value="' + esc(S.ui.lq || '') + '" style="max-width:220px" aria-label="Filter audit log"></div><div class="table-wrap" id="log-table">' + logTable(t, q) + '</div></div>';
    }
  };
  function logTable(t, q) {
    var rows = t.audit.filter(function (a) { return !q || (a.action + ' ' + a.who + ' ' + a.detail).toLowerCase().indexOf(q) > -1; });
    return '<table class="t"><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Detail</th></tr></thead><tbody>' + (rows.length ? rows.slice(0, 300).map(function (a) { return '<tr><td class="small nowrap">' + App.fmtDT(a.at) + '</td><td>' + esc(a.who) + '</td><td><b>' + esc(a.action) + '</b></td><td class="small muted">' + esc(a.detail) + '</td></tr>'; }).join('') : '<tr><td colspan="4" class="muted">Nothing logged yet.</td></tr>') + '</tbody></table>';
  }
  document.addEventListener('input', function (e) { if (e.target.matches && e.target.matches('[data-filter="log"]')) { S.ui.lq = e.target.value; var el = document.getElementById('log-table'); if (el) el.innerHTML = logTable(S.t, S.ui.lq.toLowerCase()); } });
  A['cost-add'] = function () {
    var t = S.t;
    App.modal({
      title: 'Record a cost', sub: 'Actual costs are reported separately from estimates. Leave the amount empty for an unpriced item.',
      body: '<div class="fields"><div class="field"><label for="co-k">Kind</label><select id="co-k"><option>Contact enrichment</option><option>Account sourcing</option><option>Model usage</option><option>Sending</option><option>Delivery labor</option><option>Other</option></select></div><div class="field"><label for="co-p">Provider</label><input id="co-p" placeholder="e.g. Clay"></div>' +
        '<div class="field"><label for="co-c">Credits</label><input id="co-c" type="number"></div><div class="field"><label for="co-a">Amount (USD)</label><input id="co-a" type="number" step="0.01"></div>' +
        '<div class="field full"><label for="co-n">Note</label><input id="co-n"></div></div><label class="check"><input type="checkbox" id="co-e"> This is an estimate, not a billed amount</label>',
      actions: [{ label: 'Cancel', cls: 'ghost' }, {
        label: 'Record', cls: 'primary', onClick: function (m) {
          var b = m.body;
          t.costs.push({ id: G.uid('cost'), at: G.now(), kind: b.querySelector('#co-k').value, provider: b.querySelector('#co-p').value, credits: G.toNum(b.querySelector('#co-c').value), amount: G.toNum(b.querySelector('#co-a').value), estimated: b.querySelector('#co-e').checked, note: b.querySelector('#co-n').value });
          G.log(t, 'Operator', 'Recorded cost', b.querySelector('#co-k').value); App.save(); App.render();
        }
      }]
    });
  };

  /* ================= Settings ================= */
  V.settings = {
    title: 'Settings',
    header: function () { return { title: 'Settings' }; },
    render: function () {
      var t = S.t;
      var conn = [
        ['GTM Engine AI', 'ICP, account and brief suggestions, plus drafting', 'Built in. Suggestions are reviewed before use, and drafts are checked against cited facts and proof rules.'],
        ['Databar', 'Account sourcing', 'Versioned CSV import plus an exported filter recipe, until live permissions and quotas pass a pilot test.'],
        ['Clay', 'Contact enrichment', 'CSV import with provider, verification and retrieval date. Spend is approved here first.'],
        ['HubSpot', 'Accounts, owners, meetings and deals', 'Read-only CSV import of meetings and deals, matched by HubSpot IDs. No CRM writes.'],
        ['Smartlead', 'Email sending and delivery/reply events', 'Staging via reviewed CSV export; enrollment only from the provider\'s acknowledgement file.'],
        ['HeyReach', 'LinkedIn', 'Later channel, after the email pilot.'],
        ['Fathom', 'Call transcripts', 'Add transcripts as sources (TXT, VTT, SRT) and log observations from them.']
      ];
      return '<div class="stack" style="max-width:900px">' +
        '<div class="card"><div class="card-h"><h2>Workspace</h2></div><div class="card-b stack"><div class="fields"><div class="field"><label for="st-n">Client name</label>' + App.bindInput('profile.name', { id: 'st-n', rerender: true }) + '</div><div class="field"><label>Created</label><input disabled value="' + esc(App.fmtDT(t.createdAt)) + '"></div></div>' +
          '<div class="row"><div class="grow"><b>' + (t.paused ? 'Paused' : 'Active') + '</b><div class="small muted">Pausing blocks approvals, staging, spend approval and exports for this client only. Other clients keep running.</div></div><button class="btn" data-act="toggle-pause">' + I(t.paused ? 'play' : 'pause') + (t.paused ? 'Resume client' : 'Pause client') + '</button></div></div></div>' +
        '<div class="card"><div class="card-h"><h2>Connections<span class="sub">Each client connects its own accounts. Until a connector passes a staging round-trip, the CSV fallback is used, with the same checks.</span></h2></div><div class="list">' +
          conn.map(function (c) { return '<div class="li"><span class="lico">' + I('link') + '</span><span class="grow"><b>' + c[0] + '</b><span>' + esc(c[1]) + ' · ' + esc(c[2]) + '</span></span>' + App.badge(c[0] === 'HeyReach' ? 'muted' : 'accent', c[0] === 'HeyReach' ? 'Later' : c[0] === 'GTM Engine AI' ? 'Built in' : 'CSV fallback') + '</div>'; }).join('') + '</div></div>' +
        '<div class="card"><div class="card-h"><h2>Data</h2></div><div class="card-b stack"><div class="row"><div class="grow"><b>Export this client</b><div class="small muted">One JSON file with this client\'s records only. Keep it as a backup or move it to another browser.</div></div><button class="btn" data-act="export-json">' + I('download') + 'Export JSON</button></div>' +
          '<div class="row"><div class="grow"><b>Import a client file</b><div class="small muted">Creates a new, separate workspace. It never merges into an existing client.</div></div><label class="btn">' + I('upload') + 'Import JSON<input type="file" accept=".json,application/json" class="sr" id="imp-json"></label></div>' +
          '<div class="small muted">' + (App.Store.persistent ? I('info') + ' Data is stored in this browser only. Clearing site data removes it.' : I('alert') + ' Browser storage is unavailable: data lasts only until this tab closes.') + '</div></div></div>' +
        '<div class="card" style="border-color:var(--bad-line)"><div class="card-h"><h2>Delete this client</h2></div><div class="card-b row"><div class="grow small muted">Removes every record, approval and cost for ' + esc(t.profile.name || 'this client') + ' from this browser. Export first if you might need it.</div><button class="btn danger" data-act="delete-client">' + I('trash') + 'Delete client</button></div></div>' +
        '</div>';
    }
  };
  A['export-json'] = function () { var t = S.t; App.download(App.slug(t.profile.name) + '-gtm-engine-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(t, null, 2), 'application/json'); G.log(t, 'Operator', 'Exported client data'); App.save(); };
  document.addEventListener('change', function (e) {
    if (e.target.id !== 'imp-json' || !e.target.files[0]) return;
    App.readFile(e.target.files[0]).then(function (txt) {
      var d; try { d = JSON.parse(txt); } catch (x) { App.toast('That is not a valid JSON file', 'bad'); return; }
      if (!d || !d.profile || !Array.isArray(d.accounts)) { App.toast('That file is not a GTM Engine client export', 'bad'); return; }
      var fresh = G.newTenant(); Object.keys(fresh).forEach(function (k) { if (d[k] === undefined) d[k] = fresh[k]; });
      d.id = G.uid('client'); d.profile.name = (d.profile.name || 'Imported client') + (App.Store.index().some(function (c) { return c.name === d.profile.name; }) ? ' (imported)' : '');
      G.log(d, 'Operator', 'Imported workspace from file', e.target.files[0].name);
      App.Store.save(d); App.openClient(d.id); App.toast('Imported as a new workspace');
    });
  });
  A['delete-client'] = function () {
    var t = S.t;
    App.prompt({ title: 'Delete ' + t.profile.name + '?', sub: 'This cannot be undone.', label: 'Type the client name to confirm', ok: 'Delete permanently' }).then(function (v) {
      if (v === null) return;
      if (v !== t.profile.name) { App.toast('The name did not match; nothing was deleted', 'bad'); return; }
      App.Store.remove(t.id); App.Store.del('active');
      var next = App.Store.index()[0];
      S.t = null;
      if (next) App.openClient(next.id); else { location.hash = ''; App.render(); }
      App.toast('Client deleted');
    });
  };
})();
