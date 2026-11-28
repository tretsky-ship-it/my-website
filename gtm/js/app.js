/* Shell: client switcher, step navigation, routing, global search and actions. */
(function () {
  'use strict';
  var G = window.GTM, App = window.App, S = App.S, esc = App.esc, I = App.icon;

  App.NAV = [
    { group: null, items: [{ id: 'home', label: 'Home', icon: 'home' }] },
    { group: 'Pilot steps', items: [
      { id: 'setup', label: 'Client setup', step: 1 },
      { id: 'evidence', label: 'Evidence & proof', step: 2 },
      { id: 'icp', label: 'Ideal customer profile', step: 3 },
      { id: 'accounts', label: 'Accounts', step: 4 },
      { id: 'contacts', label: 'Contacts', step: 5 },
      { id: 'campaigns', label: 'Campaigns', step: 6 },
      { id: 'outcomes', label: 'Outcomes & replies', step: 7 },
      { id: 'brief', label: 'Weekly brief', step: 8 }
    ] },
    { group: 'Sales intelligence', items: [
      { id: 'calls', label: 'Calls', icon: 'mic' },
      { id: 'deals', label: 'Deals', icon: 'deal' },
      { id: 'trends', label: 'Call trends', icon: 'trend' },
      { id: 'product', label: 'Product insights', icon: 'box' }
    ] },
    { group: 'Improve', items: [
      { id: 'learning', label: 'Learning inbox', icon: 'learning' },
      { id: 'activity', label: 'Spend & activity', icon: 'activity' },
      { id: 'settings', label: 'Settings', icon: 'settings' }
    ] }
  ];

  /* ---------- pilot progress (drives the nav, the stepper and "next step") ---------- */
  App.steps = function (t) {
    var icp = G.activeICP(t), am = G.accountMetrics(t);
    var miss = G.intakeMissing(t), filled = G.INTAKE.length - miss.length;
    var approvedBatch = t.batches.some(function (b) { return ['approved', 'staged', 'enrolled', 'reconciled'].indexOf(G.batchState(t, b)) > -1; });
    var draft = G.draftICP(t), withContacts = t.contacts.length;
    function list(a) { return a.slice(0, 3).join(', ') + (a.length > 3 ? ' and ' + (a.length - 3) + ' more' : ''); }
    return [
      { id: 'setup', label: 'Set up the client', done: !miss.length, started: filled > 0,
        todo: miss.length ? 'Still missing: ' + list(miss.map(function (m) { return m.label.toLowerCase(); })) : 'Done',
        title: 'Finish the client intake', body: 'Record the offer, geography, outreach owner, approver, budget and CRM. Missing: ' + list(miss.map(function (m) { return m.label.toLowerCase(); })) + '.', cta: 'Complete intake' },
      { id: 'evidence', label: 'Add evidence', done: t.sources.length > 0, started: t.proof.length > 0,
        todo: !t.sources.length ? 'Add at least one source: a deck, call transcript, notes or won/lost list' : t.proof.length ? 'Done' : 'Done. Adding proof (a result or quote the client allows) is recommended before campaigns',
        title: 'Add client sources and proof', body: 'Paste a call transcript or upload the deck, notes and won/lost list, and record which proof can be used publicly. Every ICP criterion and claim points back to these.', cta: 'Add evidence' },
      { id: 'icp', label: 'Approve ICP', done: !!icp, started: !!draft,
        todo: icp ? 'Done (v' + icp.v + ' approved)' : draft ? 'Draft v' + draft.v + ' is waiting for approval' : 'Create and approve an ICP',
        title: draft ? 'Review and approve ICP v' + draft.v : 'Draft the ideal customer profile', body: draft ? 'The draft is ready for the sponsor. Approving freezes it, so accounts can be scored against it.' : 'Define target industries, size, triggers, disqualifiers and buyer personas, then set the scoring weights.', cta: draft ? 'Review draft' : 'Start the ICP' },
      { id: 'accounts', label: 'Source accounts', done: am.counts.eligible > 0, started: t.accounts.length > 0,
        todo: am.counts.eligible ? 'Done (' + am.counts.eligible + ' eligible)' : t.accounts.length ? App.plural(t.accounts.length, 'account') + ' added, none eligible yet. Most need a dated, sourced trigger: open an account marked "Needs research"' : 'Import or suggest accounts',
        title: t.accounts.length ? 'Research accounts to reach eligibility' : 'Add your first accounts', body: t.accounts.length ? am.counts.research + ' accounts need research before they count as eligible. Open one to see exactly what is missing.' : 'Let GTM Engine suggest companies that fit the ICP, or import a list. Existing customers and open deals are suppressed automatically.', cta: t.accounts.length ? 'Open workbench' : 'Add accounts' },
      { id: 'contacts', label: 'Resolve buyers', done: am.coverage.n > 0, started: withContacts > 0,
        todo: am.coverage.n ? 'Done (' + am.coverage.n + ' eligible accounts have a ready buyer)' : withContacts ? 'Contacts added, but none is ready at an eligible account. Ready = verified email + persona match, at an eligible account' : 'Suggest, find or import contacts',
        title: 'Find buyers at eligible accounts', body: 'Suggest named buyers, look them up with Find buyers, or import contacts. A contact is ready once it has a verified email and matches a persona.', cta: 'Open contacts' },
      { id: 'campaigns', label: 'Approve a batch', done: approvedBatch, started: t.campaigns.length > 0,
        todo: approvedBatch ? 'Done' : t.batches.length ? 'A batch is drafted but not approved yet' : t.campaigns.length ? 'Brief started. Draft a batch, then approve it' : 'Write a campaign brief',
        title: t.campaigns.length ? 'Draft and approve a campaign batch' : 'Write the campaign brief', body: t.campaigns.length ? 'Draft a batch from ready contacts, review the copy and citations, then get it approved.' : 'Set the objective, persona, CTA and sequence. Drafts use only approved positioning and cited account facts.', cta: t.campaigns.length ? 'Open campaigns' : 'Create campaign' },
      { id: 'outcomes', label: 'Collect outcomes', done: t.events.length > 0, started: false,
        todo: t.events.length ? 'Done' : 'Import delivery, reply, meeting or deal events',
        title: 'Import replies, meetings and deals', body: 'Bring in Smartlead and HubSpot events. Duplicates count once and every reply becomes one owner task.', cta: 'Import outcomes' },
      { id: 'brief', label: 'Weekly brief', done: t.tests.length > 0, started: false,
        todo: t.tests.length ? 'Done' : 'Assign one next test with an owner on the Weekly brief',
        title: 'Send the weekly brief', body: 'Review the funnel, exceptions and spend, then assign one next test with an owner.', cta: 'Open brief' }
    ];
  };

  App.attention = function (t) {
    var items = [];
    t.batches.forEach(function (b) {
      var st = G.batchState(t, b), c = G.campaignById(t, b.campaignId);
      if (st === 'awaiting-approval') items.push({ tone: 'warn', icon: 'shield', title: 'Batch ' + b.n + ' awaits approval', sub: (c ? c.name : '') + ' · ' + App.plural(b.rows.length, 'contact'), href: '#/campaigns/' + b.campaignId, route: 'campaigns' });
      if (st === 'expired-approval') items.push({ tone: 'bad', icon: 'alert', title: 'Batch ' + b.n + ' changed after approval', sub: 'Re-approve before staging', href: '#/campaigns/' + b.campaignId, route: 'campaigns' });
      if (st === 'needs-review') items.push({ tone: 'bad', icon: 'alert', title: 'Batch ' + b.n + ' needs review after an ICP change', sub: App.plural(b.needsReview.outOfScope.length, 'contact') + ' moved out of scope', href: '#/campaigns/' + b.campaignId, route: 'campaigns' });
      if (st === 'staged') { var u = G.unresolvedRows(t, b).length; if (u) items.push({ tone: 'warn', icon: 'swap', title: 'Batch ' + b.n + ': ' + App.plural(u, 'row') + ' not confirmed by the provider', sub: 'Reconcile before retrying', href: '#/campaigns/' + b.campaignId, route: 'campaigns' }); }
    });
    var d = G.draftICP(t); if (d) items.push({ tone: 'accent', icon: 'icp', title: 'ICP v' + d.v + ' draft is waiting', sub: d.note || 'Review and approve', href: '#/icp', route: 'icp' });
    var open = t.proposals.filter(function (p) { return p.status === 'open' || p.status === 'needs fresh review'; }).length;
    if (open) items.push({ tone: 'accent', icon: 'learning', title: App.plural(open, 'strategy proposal') + ' to decide', sub: 'Learning inbox', href: '#/learning', route: 'learning' });
    var cf = t.conflicts.filter(function (c) { return !c.resolved; }).length;
    if (cf) items.push({ tone: 'warn', icon: 'swap', title: App.plural(cf, 'import conflict') + ' to resolve', sub: 'Subsidiaries, missing domains, unmatched contacts', href: '#/accounts/conflicts', route: 'accounts' });
    var now = new Date().toISOString();
    var overdue = t.tasks.filter(function (k) { return ['assigned', 'accepted'].indexOf(k.status) > -1 && k.due < now; }).length;
    if (overdue) items.push({ tone: 'bad', icon: 'activity', title: App.plural(overdue, 'reply', 'replies') + ' overdue', sub: 'Past the ' + t.profile.responseTargetHours + 'h response target', href: '#/outcomes', route: 'outcomes' });
    var unassigned = t.tasks.filter(function (k) { return k.status === 'assigned'; }).length;
    if (unassigned && !overdue) items.push({ tone: 'warn', icon: 'outcomes', title: App.plural(unassigned, 'reply', 'replies') + ' not yet accepted', sub: 'Reply queue', href: '#/outcomes', route: 'outcomes' });
    var um = t.events.filter(function (e) { return e.match === 'unmatched'; }).length;
    if (um) items.push({ tone: 'warn', icon: 'link', title: App.plural(um, 'unmatched event') + '', sub: 'Match to a contact or leave unattributed', href: '#/outcomes/unmatched', route: 'outcomes' });
    var review = t.contacts.filter(function (c) { var s = G.contactState(t, c); return s === 'ambiguous-persona' || s === 'conflicting-employment'; }).length;
    if (review) items.push({ tone: 'warn', icon: 'contacts', title: App.plural(review, 'contact') + ' need a decision', sub: 'Ambiguous persona or employment', href: '#/contacts/review', route: 'contacts' });
    return items;
  };

  /* ---------- rendering ---------- */
  var root = document.getElementById('root');
  App.render = function (opts) {
    if (!(opts && opts.keepDrawer)) App.closeDrawer(true);
    if (!S.t) { root.innerHTML = App.views.welcome.render(); return; }
    var v = App.views[S.route] || App.views.home;
    if (!root.querySelector('.app')) {
      root.innerHTML = '<div class="app"><aside class="side" id="side"></aside><div class="main"><header class="topbar" id="topbar"></header><div id="banners"></div><main class="content" id="view" tabindex="-1"></main></div></div>';
    }
    App.renderSide();
    var hdr = v.header ? v.header() : {};
    document.getElementById('topbar').innerHTML =
      '<button class="btn ghost icon menu-btn" data-act="toggle-side" aria-label="Open menu">' + I('menu') + '</button>' +
      '<h1><span class="crumb">' + esc(S.t.profile.name || 'Untitled client') + '</span>' + esc(hdr.title || v.title) + '</h1>' +
      '<div class="row tight">' + (hdr.actions || '') + '<button class="btn ghost hide-sm" data-act="search" title="Search this client (Ctrl K)">' + I('search') + '<span>Search</span> <kbd>Ctrl K</kbd></button></div>';
    var bn = '';
    if (S.t.paused) bn += '<div class="banner paused">' + I('pause') + '<span class="grow"><b>This client is paused.</b> Approvals, staging and exports are blocked until you resume.</span><button class="btn sm" data-act="toggle-pause">' + I('play') + 'Resume</button></div>';
    if (App.hasTestData && App.hasTestData(S.t)) bn += '<div class="banner sample">' + I('flag') + '<span class="grow"><b>Test data in use.</b> Test contacts and placeholder signals are fake and can\'t reach real inboxes.</span><button class="btn sm" data-act="test-remove">' + I('trash') + 'Remove test data</button></div>';
    if (S.t.sample) bn += '<div class="banner sample">' + I('info') + '<span class="grow"><b>Sample client.</b> Ledgerline and every company here are fictional, so you can try each step safely.</span><button class="btn sm" data-act="new-client">' + I('plus') + 'Set up a real client</button></div>';
    document.getElementById('banners').innerHTML = bn;
    document.getElementById('view').innerHTML = v.render(S.param);
    document.title = (hdr.title || v.title) + ' · ' + (S.t.profile.name || 'GTM Engine');
    if (v.mounted) v.mounted(S.param);
    if (opts && opts.keepDrawer) App.refreshDrawer();
  };
  App.rerender = function () { App.render({ keepDrawer: true }); };
  App.renderSide = function () {
    var side = document.getElementById('side');
    if (!side || !S.t) return;
    var t = S.t, steps = App.steps(t), firstTodo = steps.find(function (s) { return !s.done; });
    var att = App.attention(t);
    var counts = {};
    att.forEach(function (a) { counts[a.route] = (counts[a.route] || 0) + 1; });
    var openP = t.proposals.filter(function (p) { return p.status === 'open'; }).length;
    var html = '<div class="brand"><span class="brand-mark">' + I('icp') + '</span><span>GTM Engine<small>Client workspace</small></span></div>' +
      '<div class="client-switch"><button class="client-btn" data-act="client-menu" aria-haspopup="menu" aria-expanded="false">' + App.avatar(t.profile.name || '?') +
      '<span class="meta"><b>' + esc(t.profile.name || 'Untitled client') + '</b><span>' + (t.paused ? 'Paused' : t.sample ? 'Sample data' : 'Isolated workspace') + '</span></span>' + I('chev') + '</button></div><nav class="nav" aria-label="Workspace">';
    App.NAV.forEach(function (g) {
      if (g.group) html += '<div class="nav-label">' + esc(g.group) + '</div>';
      g.items.forEach(function (it) {
        var on = S.route === it.id, st = it.step ? steps[it.step - 1] : null;
        var lead = it.step ? '<span class="step-dot' + (st.done ? ' done' : st.started ? ' part' : firstTodo && firstTodo.id === it.id ? ' cur' : '') + '">' + (st.done ? '✓' : it.step) + '</span>' : '<span class="ico">' + I(it.icon) + '</span>';
        var n = it.id === 'learning' ? openP : counts[it.id] || 0;
        html += '<a href="#/' + it.id + '" class="' + (on ? 'on' : '') + '"' + (on ? ' aria-current="page"' : '') + (st ? ' title="' + esc((st.done ? 'Complete. ' : st.started ? 'In progress. ' : '') + (st.done ? '' : st.todo)) + '"' : '') + '>' + lead + '<span>' + esc(it.label) + '</span>' + (n && it.id !== 'home' ? '<span class="count' + (att.some(function (a) { return a.route === it.id && a.tone === 'bad'; }) ? ' alert' : '') + '">' + n + '</span>' : '') + '</a>';
      });
    });
    var dark = document.documentElement.getAttribute('data-theme') === 'dark' || (!document.documentElement.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
    html += '</nav><div class="side-foot"><button data-act="search">' + I('search') + 'Search</button><button data-act="theme" aria-label="Switch to ' + (dark ? 'light' : 'dark') + ' theme">' + I(dark ? 'sun' : 'moon') + (dark ? 'Light' : 'Dark') + '</button></div>';
    side.innerHTML = html;
  };

  /* ---------- routing ---------- */
  function parse() {
    var h = location.hash.replace(/^#\/?/, '').split('/');
    S.route = h[0] || 'home'; S.param = decodeURIComponent(h.slice(1).join('/') || '');
  }
  App.go = function (hash) { if (location.hash === hash) { parse(); App.render(); } else location.hash = hash; };
  window.addEventListener('hashchange', function () {
    parse(); App.render();
    document.getElementById('side') && document.getElementById('side').classList.remove('open');
    window.scrollTo(0, 0);
    var v = document.getElementById('view'); if (v) v.focus({ preventScroll: true });
  });
  window.addEventListener('scroll', function () { var tb = document.getElementById('topbar'); if (tb) tb.classList.toggle('scrolled', window.scrollY > 4); }, { passive: true });

  /* ---------- clients ---------- */
  App.openClient = function (id) {
    var t = App.Store.load(id);
    if (!t) { App.toast('That client could not be loaded', 'bad'); return; }
    App.closeDrawer(true);
    S.t = t; S.ui = {};
    App.Store.set('active', id);
    App.go('#/home');
  };
  App.createClient = function (name, sample) {
    var t = sample ? App.buildSample() : G.newTenant(name);
    if (!sample) G.log(t, 'Operator', 'Created client workspace', 'Started from the blank template');
    App.Store.save(t);
    App.openClient(t.id);
    App.go(sample ? '#/home' : '#/setup');
    return t;
  };
  App.act['client-menu'] = function (el) {
    var box = el.parentNode, existing = box.querySelector('.menu');
    if (existing) { existing.remove(); el.setAttribute('aria-expanded', 'false'); return; }
    var idx = App.Store.index();
    var menu = document.createElement('div'); menu.className = 'menu'; menu.setAttribute('role', 'menu');
    menu.innerHTML = '<div class="small muted" style="padding:6px 8px">Clients (each is fully isolated)</div>' + idx.map(function (c) {
      return '<button role="menuitem" data-act="open-client" data-id="' + esc(c.id) + '" class="' + (S.t && S.t.id === c.id ? 'on' : '') + '">' + App.avatar(c.name) + '<span class="grow"><b>' + esc(c.name) + '</b>' + (c.sample ? '<br><small class="muted">Sample data</small>' : '') + '</span>' + (S.t && S.t.id === c.id ? I('check') : '') + '</button>';
    }).join('') + '<hr><button role="menuitem" data-act="new-client">' + I('plus') + 'New client</button>' + (idx.some(function (c) { return c.sample; }) ? '' : '<button role="menuitem" data-act="load-sample">' + I('sparkle') + 'Add sample client</button>');
    box.appendChild(menu); el.setAttribute('aria-expanded', 'true');
    setTimeout(function () {
      document.addEventListener('click', function off(e) { if (!box.contains(e.target)) { menu.remove(); el.setAttribute('aria-expanded', 'false'); document.removeEventListener('click', off); } });
    });
  };
  App.act['open-client'] = function (el) { App.openClient(el.getAttribute('data-id')); };
  App.act['new-client'] = function () {
    App.prompt({ title: 'New client workspace', sub: 'Starts from the blank template: no ICP, prospects, campaigns or connections. Nothing is shared with other clients.', label: 'Client name', placeholder: 'e.g. Acme Robotics', ok: 'Create workspace', required: true })
      .then(function (n) { if (n) { App.createClient(n); App.toast('Workspace created for ' + n); } });
  };
  App.act['load-sample'] = function () { var existing = App.Store.index().find(function (c) { return c.sample; }); if (existing) App.openClient(existing.id); else { App.createClient('', true); App.toast('Sample client loaded'); } };
  App.act['welcome-create'] = function () {
    var inp = document.getElementById('wc-name'), n = inp.value.trim();
    if (!n) { inp.focus(); App.toast('Enter the client name first', 'bad'); return; }
    App.createClient(n);
  };
  App.act['toggle-pause'] = function () {
    S.t.paused = !S.t.paused;
    G.log(S.t, 'Operator', S.t.paused ? 'Paused client' : 'Resumed client');
    App.save(); App.render();
    App.toast(S.t.paused ? 'Client paused' : 'Client resumed');
  };
  App.act.theme = function () {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark' || (!document.documentElement.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
    var next = dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    App.Store.set('theme', next);
    App.renderSide();
  };
  App.act['toggle-side'] = function () { document.getElementById('side').classList.toggle('open'); };

  /* ---------- search, scoped to the open client only ---------- */
  App.act.search = function () {
    if (!S.t) return;
    var t = S.t;
    var m = App.modal({ title: 'Search ' + (t.profile.name || 'this client'), sub: 'Accounts, contacts, campaigns and sources in this workspace only.', body: '<input id="sq" type="search" placeholder="Type a company, person, domain or campaign" autofocus><div class="search-res" id="sres"></div>', actions: [] });
    var inp = m.body.querySelector('#sq'), res = m.body.querySelector('#sres'), sel = 0, hits = [];
    function run() {
      var q = inp.value.trim().toLowerCase();
      hits = [];
      if (q) {
        t.accounts.forEach(function (a) { if ((a.name + ' ' + a.domain).toLowerCase().indexOf(q) > -1) hits.push({ k: 'Account', label: a.name, sub: a.domain, go: function () { App.go('#/accounts'); setTimeout(function () { App.openAccount(a.id); }, 30); } }); });
        t.contacts.forEach(function (c) { if ((c.name + ' ' + c.email + ' ' + c.title).toLowerCase().indexOf(q) > -1) hits.push({ k: 'Contact', label: c.name, sub: c.title + ' · ' + c.email, go: function () { App.go('#/accounts'); setTimeout(function () { App.openAccount(c.accountId); }, 30); } }); });
        t.campaigns.forEach(function (c) { if (c.name.toLowerCase().indexOf(q) > -1) hits.push({ k: 'Campaign', label: c.name, sub: c.owner, go: function () { App.go('#/campaigns/' + c.id); } }); });
        t.sources.forEach(function (s) { if (s.title.toLowerCase().indexOf(q) > -1) hits.push({ k: 'Source', label: s.title, sub: s.type + ' · ' + App.fmtDate(s.date), go: function () { App.go('#/evidence'); } }); });
      }
      hits = hits.slice(0, 30); sel = 0;
      res.innerHTML = !q ? '<p class="small muted" style="padding:8px">Start typing to search.</p>' : hits.length ? hits.map(function (h, i) { return '<button data-i="' + i + '" class="' + (i === sel ? 'on' : '') + '"><span class="k">' + h.k + '</span><span class="grow"><b>' + esc(h.label) + '</b><br><small class="muted">' + esc(h.sub) + '</small></span></button>'; }).join('') : '<p class="small muted" style="padding:8px">No matches in this client.</p>';
    }
    inp.addEventListener('input', run);
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, Math.min(hits.length - 1, sel + (e.key === 'ArrowDown' ? 1 : -1))); res.querySelectorAll('button').forEach(function (b, i) { b.classList.toggle('on', i === sel); }); }
      if (e.key === 'Enter' && hits[sel]) { m.close(); hits[sel].go(); }
    });
    res.addEventListener('click', function (e) { var b = e.target.closest('button[data-i]'); if (b) { m.close(); hits[+b.getAttribute('data-i')].go(); } });
    run();
  };
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); App.act.search(); }
  });

  /* ---------- delegated actions ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-act]');
    if (!el) return;
    var fn = App.act[el.getAttribute('data-act')];
    if (fn) { e.preventDefault(); fn(el, e); }
  });

  /* ---------- boot ---------- */
  parse();
  var active = App.Store.get('active');
  if (active && App.Store.load(active)) S.t = App.Store.load(active);
  else { var first = App.Store.index()[0]; if (first) S.t = App.Store.load(first.id); }
  if (!App.Store.persistent) setTimeout(function () { App.toast('Browser storage is unavailable here, so data lasts only until this tab closes. Use Settings → Export to keep it.', 'bad'); }, 600);
  App.render();
})();
