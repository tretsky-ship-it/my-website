/* Screens: prospect workbench (accounts), contacts, campaigns and batch review. */
(function () {
  'use strict';
  var G = window.GTM, App = window.App, S = App.S, esc = App.esc, I = App.icon, V = App.views, A = App.act;

  var ACC_TEMPLATE = 'company,domain,industry,employees,country,trigger,trigger date,trigger url,hubspot id,lifecycle stage\nAcme Robotics,acme-robotics.com,Manufacturing,450,United States,is hiring a Controller,2026-11-02,https://acme-robotics.com/careers/controller,1234567,\n';
  var CON_TEMPLATE = 'first name,last name,title,email,company domain,verification,provider,retrieved date,linkedin url\nAva,Stone,CFO,ava.stone@acme-robotics.com,acme-robotics.com,valid,Clay,2026-11-10,https://linkedin.com/in/example\n';

  function scoreBar(s) {
    if (s.status === 'needs-icp' || !s.max) return '<span class="faint small">Unscored</span>';
    var cut = s.cutoff != null ? Math.min(100, s.cutoff / s.max * 100) : null;
    return '<div class="score" title="' + s.known + ' verified points, ' + s.unresolved + ' unresolved, cutoff ' + s.cutoff + '"><div class="bar"><span class="known" style="width:' + (s.known / s.max * 100) + '%"></span><span class="unres" style="left:' + (s.known / s.max * 100) + '%;width:' + (s.unresolved / s.max * 100) + '%"></span>' + (cut != null ? '<span class="cut" style="left:' + cut + '%"></span>' : '') + '</div><span class="lbl"><b>' + s.known + '</b>' + (s.unresolved ? ' +' + s.unresolved + ' unresolved' : '') + ' / ' + s.max + '</span></div>';
  }
  App.scoreBar = scoreBar;

  /* ================= Accounts / prospect workbench ================= */
  V.accounts = {
    title: 'Accounts',
    header: function () {
      return { title: 'Prospect workbench', actions: (S.t.accounts.length ? '<button class="btn hide-sm" data-act="acc-sheet">' + I('download') + 'Export sheet</button><button class="btn" data-act="acc-spend" title="Approve enrichment spend">' + I('shield') + 'Approve spend</button>' : '') + '<button class="btn" data-act="ai-accounts">' + I('sparkle') + 'Suggest accounts</button><button class="btn primary" data-act="acc-import">' + I('upload') + 'Import</button>' };
    },
    render: function (param) {
      var t = S.t, icp = G.icpForScoring(t), act = G.activeICP(t);
      var conflicts = t.conflicts.filter(function (c) { return !c.resolved; });
      if (!t.accounts.length && !conflicts.length) {
        return (!act ? icpNote(t) : '') + App.emptyState('accounts', 'Import a small first batch', 'No list yet? Let GTM Engine suggest companies that fit your ICP, choosing how many. Or start with 25–50 companies from Databar or any CSV. Domains are normalised, re-imports never duplicate, existing customers and open deals are suppressed, and subsidiaries go to manual review.', (G.icpForScoring(t) ? '<button class="btn primary" data-act="ai-accounts">' + I('sparkle') + 'Suggest accounts with GTM Engine</button><button class="btn" data-act="acc-import">' + I('upload') + 'Import a list</button>' : '<button class="btn primary" data-act="acc-import">' + I('upload') + 'Import accounts</button>') + '<button class="btn" data-act="acc-template">' + I('download') + 'CSV template</button>');
      }
      var am = G.accountMetrics(t), tab = param === 'conflicts' ? 'conflicts' : 'list';
      var f = S.ui.af || 'all';
      var c = am.counts;
      var html = (!act ? icpNote(t) : '') +
        '<div class="kpis" style="margin-bottom:16px">' +
          tile('Research yield', App.rateHTML(am.yield), 'Eligible ÷ evaluated accounts') +
          tile('Contact coverage', App.rateHTML(am.coverage), 'Eligible accounts with a ready buyer') +
          tile('Excluded', c.excluded, Object.keys(am.exclusionReasons).slice(0, 2).map(function (k) { return am.exclusionReasons[k] + ' ' + k.toLowerCase(); }).join(' · ') || 'None') +
          tile('Scored against', icp ? 'ICP v' + icp.v : '—', icp ? (icp.status === 'approved' ? 'Approved' : 'Draft preview') + ' · cutoff ' + (icp.cutoff != null ? icp.cutoff : 'unset') : 'No ICP yet') +
        '</div>' +
        '<div class="tabs"><a href="#/accounts" class="' + (tab === 'list' ? 'on' : '') + '">Accounts <span class="n">' + t.accounts.length + '</span></a><a href="#/accounts/conflicts" class="' + (tab === 'conflicts' ? 'on' : '') + '">Manual resolution <span class="n' + (conflicts.length ? ' alert' : '') + '">' + conflicts.length + '</span></a></div>';
      if (tab === 'conflicts') return html + conflictList(t);
      html += '<div class="row" style="margin-bottom:12px"><div class="seg" role="tablist" aria-label="Filter by status">' +
        [['all', 'All', t.accounts.length], ['eligible', 'Eligible', c.eligible], ['research', 'Needs research', c.research], ['deprioritized', 'Deprioritised', c.deprioritized], ['excluded', 'Excluded', c.excluded]].concat(c['needs-icp'] ? [['needs-icp', 'Unscored', c['needs-icp']]] : [])
          .map(function (x) { return '<button data-act="acc-filter" data-f="' + x[0] + '" class="' + (f === x[0] ? 'on' : '') + '" role="tab" aria-selected="' + (f === x[0]) + '">' + x[1] + ' <span class="n">' + x[2] + '</span></button>'; }).join('') +
        '</div><span class="grow"></span><input type="search" data-filter="acc" placeholder="Search company or domain" value="' + esc(S.ui.aq || '') + '" style="max-width:260px" aria-label="Search accounts"></div>' +
        '<div class="card"><div class="table-wrap" id="acc-table"></div></div>';
      return html;
      function tile(k, v, s) { return '<div class="kpi"><span class="k">' + k + '</span><span class="v" style="font-size:20px">' + v + '</span><span class="s">' + esc(s) + '</span></div>'; }
    },
    mounted: function () { App.refresh('acc-table'); }
  };
  function icpNote(t) {
    var d = G.draftICP(t);
    return '<div class="note warn" style="margin-bottom:16px">' + I('alert') + '<span class="grow">' + (d ? 'Scores below preview <b>draft ICP v' + d.v + '</b>. Nothing can be staged until a version is approved.' : 'No ICP yet, so accounts can be imported but not scored.') + '</span><a class="btn sm" href="#/icp">' + (d ? 'Review draft' : 'Create ICP') + '</a></div>';
  }
  App.refreshers['acc-table'] = function () {
    var el = document.getElementById('acc-table'); if (!el) return;
    var t = S.t, sc = G.scoreAll(t), f = S.ui.af || 'all', q = (S.ui.aq || '').toLowerCase();
    var rows = t.accounts.filter(function (a) { return (f === 'all' || sc[a.id].status === f) && (!q || (a.name + ' ' + a.domain).toLowerCase().indexOf(q) > -1); });
    var order = { eligible: 0, research: 1, deprioritized: 2, 'needs-icp': 3, excluded: 4 };
    rows.sort(function (a, b) { var x = sc[a.id], y = sc[b.id]; return order[x.status] - order[y.status] || (y.known + y.unresolved / 2) - (x.known + x.unresolved / 2); });
    if (!rows.length) { el.innerHTML = '<div class="empty"><p>No accounts match this filter.</p></div>'; return; }
    el.innerHTML = '<table class="t"><thead><tr><th>Company</th><th>Industry</th><th class="num">Employees</th><th>Country</th><th>Trigger</th><th>Score</th><th>Status</th><th class="num">Contacts</th></tr></thead><tbody>' +
      rows.map(function (a) {
        var s = sc[a.id], nc = t.contacts.filter(function (c) { return c.accountId === a.id; });
        var ready = nc.filter(function (c) { return G.contactState(t, c) === 'ready'; }).length;
        var why = s.status === 'excluded' ? s.reasons[0] : s.status === 'research' ? s.research[0] : '';
        return '<tr class="click" data-act="acc-open" data-id="' + a.id + '" tabindex="0"><td class="name"><b>' + esc(a.name) + (a.suggested ? ' <span class="badge info plain" title="Suggested by GTM Engine; confirm the details">Suggested</span>' : '') + '</b><span>' + esc(a.domain) + (a.crmId ? ' · HS ' + esc(a.crmId) : '') + '</span></td>' +
          '<td>' + esc(a.industry || '—') + '</td><td class="num">' + App.num(a.employees) + '</td><td>' + esc(a.country || '—') + '</td>' +
          '<td style="max-width:240px">' + (a.trigger.text ? '<span title="' + esc(a.trigger.text) + '">' + esc(a.trigger.text.length > 42 ? a.trigger.text.slice(0, 40) + '…' : a.trigger.text) + '</span><br><small class="muted">' + (a.trigger.date ? App.rel(a.trigger.date) : 'undated') + (a.trigger.url ? ' · sourced' : ' · no source') + '</small>' : '<span class="faint">—</span>') + '</td>' +
          '<td>' + scoreBar(s) + '</td><td>' + App.stateBadge(G.ACCOUNT_STATES, s.status) + (why ? '<br><small class="muted">' + esc(why) + '</small>' : '') + '</td>' +
          '<td class="num">' + (nc.length ? ready + ' / ' + nc.length : '<span class="faint">0</span>') + '</td></tr>';
      }).join('') + '</tbody></table>';
  };
  document.addEventListener('input', function (e) {
    var el = e.target.closest && e.target.closest('[data-filter]');
    if (!el) return;
    var k = el.getAttribute('data-filter');
    if (k === 'acc') { S.ui.aq = el.value; App.refresh('acc-table'); }
    if (k === 'con') { S.ui.cq = el.value; App.refresh('con-table'); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.matches && e.target.matches('tr.click')) { e.preventDefault(); e.target.click(); }
  });
  A['acc-filter'] = function (el) { S.ui.af = el.getAttribute('data-f'); App.render(); };
  A['acc-template'] = function () { App.download('accounts-template.csv', ACC_TEMPLATE); };
  A['acc-import'] = function () {
    var t = S.t;
    App.importWizard({
      kind: 'accounts', title: 'Import accounts', sub: 'Matched by normalised domain. Re-importing the same rows updates them instead of creating duplicates.', template: ACC_TEMPLATE,
      extra: '<div class="field"><label for="iw-src">Where is this list from?</label><input id="iw-src" name="source" placeholder="e.g. Databar export, HubSpot companies" value="CSV import"></div>',
      onImport: function (rows, mapping, ex) {
        var r = G.importAccounts(t, rows, mapping, { source: ex.source || 'CSV import' });
        G.log(t, 'Operator', 'Imported ' + rows.length + ' account rows from ' + (ex.source || 'CSV'), r.added + ' added, ' + r.updated + ' updated, ' + r.unchanged + ' unchanged, ' + r.conflicts + ' to manual resolution');
        return r;
      },
      result: function (r) {
        return App.resultTiles([['Added', r.added], ['Updated', r.updated], ['Unchanged', r.unchanged, 'already up to date'], ['Need review', r.conflicts, 'subsidiary or bad domain']]) +
          (r.conflicts ? '<div class="note warn">' + I('swap') + '<span class="grow">' + App.plural(r.conflicts, 'row') + ' went to manual resolution instead of guessing. <a href="#/accounts/conflicts" data-close>Review them</a>.</span></div>' : '') +
          (r.dupConflicts ? '<p class="small muted">' + App.plural(r.dupConflicts, 'row') + ' already waiting in manual resolution were not added again.</p>' : '');
      },
      after: function () { App.rerender(); }
    });
  };
  function conflictList(t) {
    var open = t.conflicts.filter(function (c) { return !c.resolved; });
    if (!open.length) return '<div class="card"><div class="empty"><div class="art">' + I('check') + '</div><h2>Nothing to resolve</h2><p>Rows with a missing domain, a likely subsidiary, a reused HubSpot ID or no matching account land here instead of being merged silently.</p></div></div>';
    return '<div class="stack">' + open.map(function (c) {
      var rel = c.relatedId && G.accountById(t, c.relatedId);
      var fields = Object.keys(c.row).filter(function (k) { return c.row[k]; }).map(function (k) { return '<span class="chip"><b>' + esc(k) + ':</b> ' + esc(c.row[k]) + '</span>'; }).join(' ');
      var actions = '';
      if (c.kind === 'account' && !c.domain) actions = '<input id="fix-' + c.id + '" placeholder="Correct domain, e.g. delta.com" style="max-width:260px" aria-label="Correct domain"><button class="btn primary sm" data-act="cf-fix" data-id="' + c.id + '">Import with this domain</button>';
      else if (c.kind === 'account') actions = (rel ? '<button class="btn sm" data-act="cf-merge" data-id="' + c.id + '">' + I('link') + 'Same company as ' + esc(rel.name) + '</button>' : '') + '<button class="btn sm" data-act="cf-separate" data-id="' + c.id + '">Keep as separate account</button>';
      else actions = '<span class="small muted">Import or fix the account first, then re-import this contact.</span>';
      return '<div class="card"><div class="card-b stack sm"><div class="row">' + App.badge('warn', c.kind === 'account' ? 'Account' : 'Contact') + '<b class="grow">' + esc(c.reason) + '</b><span class="small muted">' + App.rel(c.createdAt) + '</span></div><div class="row tight">' + fields + '</div>' +
        '<div class="row">' + actions + '<span class="grow"></span><button class="btn sm ghost" data-act="cf-dismiss" data-id="' + c.id + '">Dismiss</button></div></div></div>';
    }).join('') + '</div>';
  }
  function cfDo(el, action, extra) {
    var t = S.t, c = t.conflicts.find(function (x) { return x.id === el.getAttribute('data-id'); });
    var ok = G.resolveConflict(t, c, action, extra);
    if (ok === false) { App.toast('That is not a valid domain', 'bad'); return; }
    G.log(t, 'Operator', 'Resolved import conflict', c.reason + ' → ' + action);
    App.save(); App.render(); App.toast('Resolved');
  }
  A['cf-merge'] = function (el) { var c = S.t.conflicts.find(function (x) { return x.id === el.getAttribute('data-id'); }); cfDo(el, 'merge', c.relatedId); };
  A['cf-separate'] = function (el) { cfDo(el, 'separate'); };
  A['cf-dismiss'] = function (el) { cfDo(el, 'dismissed'); };
  A['cf-fix'] = function (el) { var v = document.getElementById('fix-' + el.getAttribute('data-id')).value; cfDo(el, 'fix', v); };

  /* account drawer */
  A['acc-open'] = function (el) { App.openAccount(el.getAttribute('data-id')); };
  App.openAccount = function (id) { S.ui.openAcc = id; App.drawer({ render: accDrawer }); };
  function accDrawer() {
    var t = S.t, a = G.accountById(t, S.ui.openAcc);
    if (!a) return null;
    var icp = G.icpForScoring(t), s = G.scoreAccount(t, a, icp), P = 'accounts.' + t.accounts.indexOf(a);
    var cs = t.contacts.filter(function (c) { return c.accountId === a.id; });
    var head = '<div class="row">' + App.avatar(a.name) + '<div class="grow"><h2>' + esc(a.name) + '</h2><span class="small muted">' + esc(a.domain) + ((a.altDomains || []).length ? ' · also ' + esc(a.altDomains.join(', ')) : '') + '</span></div></div><div class="row" style="margin-top:8px">' + App.stateBadge(G.ACCOUNT_STATES, s.status) + (icp ? '<span class="small muted">ICP v' + icp.v + (icp.status !== 'approved' ? ' (draft)' : '') + '</span>' : '') + '</div>';
    var ov = [{ value: '', label: 'Auto' }, { value: 'match', label: 'Verified match' }, { value: 'nomatch', label: 'Verified no match' }];
    var body = '<div id="dr-score">' + scoreSection(t, a, s) + '</div>' +
      (icp ? '<div class="card"><div class="card-h"><h3>Operator verification</h3><span class="sub small muted">Use when research confirms or rules out a criterion</span></div><div class="card-b stack sm">' +
        G.COMPONENTS.map(function (c) { return '<div class="row"><span class="grow small">' + esc(c.label) + '</span><div style="width:170px">' + App.bindSelect(P + '.checks.' + c.key, ov, { cls: 'sm', refresh: 'acc', label: c.label + ' verification' }) + '</div></div>'; }).join('') +
        (icp.geography.values.length ? '<div class="row"><span class="grow small">Geography</span><div style="width:170px">' + App.bindSelect(P + '.checks.geography', ov, { cls: 'sm', refresh: 'acc', label: 'Geography verification' }) + '</div></div>' : '') +
        icp.custom.map(function (c) { return '<div class="row"><span class="grow small">' + esc(c.label || 'Untitled criterion') + (c.mandatory ? ' <span class="badge warn plain">mandatory</span>' : '') + '</span><div style="width:170px">' + App.bindSelect(P + '.custom.' + c.id, [{ value: '', label: 'Unknown' }, { value: 'match', label: 'Meets it' }, { value: 'nomatch', label: 'Does not' }], { cls: 'sm', refresh: 'acc', label: c.label }) + '</div></div>'; }).join('') +
        '</div></div>' : '') +
      '<div class="card"><div class="card-h"><h3>Account facts</h3></div><div class="card-b"><div class="fields">' +
        fld('Company name', P + '.name') + fld('Industry', P + '.industry') + fld('Employees', P + '.employees', { type: 'int' }) + fld('Country', P + '.country') +
        '<div class="field full"><label>Trigger</label>' + App.bindInput(P + '.trigger.text', { refresh: 'acc', placeholder: 'e.g. is hiring a Controller', label: 'Trigger' }) + '<span class="hint">Write it so it reads after the company name: "I noticed Acme <i>is hiring a Controller</i>."</span></div>' +
        fld('Trigger date', P + '.trigger.date', { type: 'date' }) + fld('Trigger source URL', P + '.trigger.url', { inputType: 'url' }) + fld('HubSpot company ID', P + '.crmId') +
        '<div class="field full stack sm">' + App.bindSwitch(P + '.flags.customer', 'Existing customer', { refresh: 'acc' }) + App.bindSwitch(P + '.flags.openOpp', 'Active opportunity in CRM', { refresh: 'acc' }) + '</div>' +
        '<div class="field full"><label>Research notes</label>' + App.bindText(P + '.notes', { refresh: 'acc', rows: 2, placeholder: 'What you checked and where' }) + '</div>' +
      '</div></div></div>' +
      '<div class="card"><div class="card-h"><h3>Contacts</h3><span class="badge muted plain">' + cs.length + '</span><span class="grow"></span><button class="btn sm" data-act="contact-add" data-acc="' + a.id + '">' + I('plus') + 'Add contact</button></div><div class="list">' + (cs.length ? cs.map(function (c) { var st = G.contactState(t, c, icp); return '<div class="li"><span class="grow"><b>' + esc(c.name) + '</b><span>' + esc(c.title) + ' · ' + esc(c.email || 'no email') + '</span></span>' + App.stateBadge(G.CONTACT_STATES, st) + '</div>'; }).join('') : '<div class="li muted small">No contacts yet. Approve enrichment spend for eligible accounts, then import contacts.</div>') + '</div></div>' +
      '<div class="card"><div class="card-h"><h3>Provenance</h3></div><div class="card-b small stack sm"><div>Imported from <b>' + esc(a.importedFrom || 'CSV') + '</b> · ' + App.fmtDT(a.createdAt) + '</div>' +
        (a.mergeLog.length ? a.mergeLog.slice().reverse().map(function (m) { return '<div class="muted">' + App.fmtDT(m.at) + ' · ' + esc(m.source) + ': ' + esc(m.changes.join('; ')) + '</div>'; }).join('') : '<div class="muted">No merges or updates since import.</div>') + '</div></div>' +
      '<div class="row"><button class="btn danger sm" data-act="acc-suppress" data-id="' + a.id + '">' + I('x') + 'Add domain to do-not-contact</button></div>';
    return { head: head, body: body };
    function fld(l, path, o) { o = o || {}; o.refresh = 'acc'; o.label = l; return '<div class="field"><label>' + esc(l) + '</label>' + App.bindInput(path, o) + '</div>'; }
  }
  function scoreSection(t, a, s) {
    var html = '';
    if (s.reasons.length) html += '<div class="note bad">' + I('x') + '<div class="grow"><b>Excluded</b> (overrides the score)<ul>' + s.reasons.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul></div></div>';
    else if (s.status === 'research') html += '<div class="note warn">' + I('search') + '<div class="grow"><b>Research to do</b><ul>' + G.uniq(s.research).map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul></div></div>';
    else if (s.status === 'eligible') html += '<div class="note ok">' + I('check') + '<span class="grow"><b>Eligible.</b> ' + s.known + ' verified points meet the cutoff of ' + s.cutoff + '.</span></div>';
    else if (s.status === 'deprioritized') html += '<div class="note">' + I('info') + '<span class="grow"><b>Deprioritised.</b> Fully evaluated, even unresolved points could not reach ' + s.cutoff + '.</span></div>';
    if (s.status !== 'needs-icp') {
      html += '<div class="card" style="margin-top:12px"><div class="card-h"><h3>Score breakdown</h3>' + scoreBar(s) + '</div><table class="t"><tbody>' + s.components.map(function (c) {
        var tone = c.state === 'match' ? 'ok' : c.state === 'unknown' ? 'warn' : 'muted';
        return '<tr><td><b>' + esc(c.label) + '</b><br><small class="muted">' + esc(c.reason) + '</small></td><td>' + App.badge(tone, c.state === 'match' ? 'Verified' : c.state === 'unknown' ? 'Unresolved' : 'No match') + '</td><td class="num nowrap"><b>' + c.points + '</b> / ' + c.weight + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    }
    return html;
  }
  App.refreshers.acc = function () {
    var t = S.t, a = G.accountById(t, S.ui.openAcc), el = document.getElementById('dr-score');
    if (a && el) el.innerHTML = scoreSection(t, a, G.scoreAccount(t, a));
    var hb = document.querySelector('.drawer-h .badge'); if (a && hb) hb.outerHTML = App.stateBadge(G.ACCOUNT_STATES, G.scoreAccount(t, a).status);
    App.refresh('acc-table');
  };
  A['acc-suppress'] = function (el) {
    var t = S.t, a = G.accountById(t, el.getAttribute('data-id'));
    App.prompt({ title: 'Suppress ' + a.domain + '?', label: 'Reason', value: 'Client asked not to contact', ok: 'Suppress' }).then(function (why) {
      if (why === null) return;
      G.addSuppression(t, a.domain, why || 'Do not contact', 'Account review'); G.log(t, 'Operator', 'Suppressed domain', a.domain + ' · ' + why);
      App.save(); App.refreshDrawer(); App.refresh('acc-table'); App.toast(a.domain + ' suppressed');
    });
  };
  A['acc-spend'] = function () {
    var t = S.t, icp = G.activeICP(t);
    if (!icp) { App.toast('Approve an ICP first: credits are only spent on eligible accounts', 'bad'); return; }
    if (t.paused) { App.toast('Client is paused', 'bad'); return; }
    var sc = G.scoreAll(t, icp);
    var cand = t.accounts.filter(function (a) { return sc[a.id].status === 'eligible' && !t.contacts.some(function (c) { return c.accountId === a.id && G.contactState(t, c, icp) === 'ready'; }); });
    var cpa = t.profile.creditsPerAccount, cpc = t.profile.costPerCredit;
    var credits = cpa != null ? cand.length * cpa : null, cost = credits != null && cpc != null ? Math.round(credits * cpc * 100) / 100 : null;
    var spent = t.costs.filter(function (c) { return c.amount != null && (!c.estimated || !c.superseded); }).reduce(function (s, c) { return s + c.amount; }, 0);
    var left = t.profile.budget != null ? t.profile.budget - spent : null;
    var over = left != null && cost != null && cost > left;
    var titles = G.uniq([].concat.apply([], icp.personas.map(function (p) { return p.titles; })));
    App.modal({
      title: 'Approve enrichment spend', sub: 'Credits go only to eligible accounts that do not yet have a ready buyer.',
      body: cand.length ? App.resultTiles([['Accounts', cand.length], ['Est. credits', credits == null ? '—' : credits], ['Est. cost', cost == null ? 'Unpriced' : App.money(cost)]]) +
        (cost == null ? '<div class="note warn">' + I('alert') + '<span class="grow">Credits per account or cost per credit is not set, so this action is unpriced. <a href="#/setup" data-close>Set them in setup</a>.</span></div>' : '') +
        (left != null ? '<div class="note ' + (over ? 'bad' : 'info') + '">' + I(over ? 'alert' : 'info') + '<span class="grow">Budget remaining after actual and approved spend: <b>' + App.money(left) + '</b>.' + (over ? ' This request exceeds the client cap, so optional enrichment is stopped.' : '') + '</span></div>' : '') +
        '<div class="small muted">Export includes domain, company and target titles (' + esc(titles.slice(0, 6).join(', ')) + (titles.length > 6 ? '…' : '') + ') for Clay or another provider.</div>'
        : '<div class="empty"><p>No eligible accounts are missing a ready buyer.</p></div>',
      actions: cand.length ? [{ label: 'Cancel', cls: 'ghost' }, {
        label: 'Approve and export ' + cand.length + ' domains', cls: 'primary', disabled: over, onClick: function () {
          t.costs.push({ id: G.uid('cost'), at: G.now(), kind: 'Contact enrichment', provider: 'Clay', credits: credits, amount: cost, estimated: true, note: 'Approved spend: ' + cand.length + ' accounts pending enrichment' });
          G.log(t, 'Operator', 'Approved enrichment spend', cand.length + ' accounts · ' + (cost != null ? App.money(cost) : 'unpriced'));
          App.download(App.slug(t.profile.name) + '-enrichment-request.csv', G.toCSV([{ key: 'domain' }, { key: 'company' }, { key: 'target_titles' }, { key: 'account_id' }], cand.map(function (a) { return { domain: a.domain, company: a.name, target_titles: titles.join('; '), account_id: a.id }; })));
          App.save(); App.rerender(); App.toast('Spend approved and recorded as pending');
        }
      }] : [{ label: 'Close' }]
    });
  };
  App.enrichmentSheet = function (t, batch) {
    var icp = G.activeICP(t), sc = G.scoreAll(t, icp), rows = [];
    function rowFor(c, b, r) {
      var a = G.accountById(t, c.accountId), s = sc[a.id], cmp = b && G.campaignById(t, b.campaignId);
      var it = b && t.enrollments.find(function (e) { return e.key === G.intentKey(b.campaignId, b.channel, c.id); });
      var sup = G.suppressionHit(t, c.email) || G.suppressionHit(t, a.domain);
      var pm = G.contactPersona(c, icp), per = icp && icp.personas.find(function (p) { return p.id === pm.id; });
      rows.push({
        client: t.profile.name, account_id: a.id, domain: a.domain, crm_id: a.crmId, icp_version: b ? b.icpVersion : (icp ? icp.v : ''),
        industry: a.industry, employees: a.employees, country: a.country, trigger: a.trigger.text, trigger_date: (a.trigger.date || '').slice(0, 10), trigger_url: a.trigger.url,
        score_known: s.known, score_unresolved: s.unresolved, account_status: s.status, exclusion: s.reasons.join('; '),
        contact_id: c.id, name: c.name, title: c.title, persona: per ? per.name : '', work_email: c.email, verification: c.verification, retrieved: (c.retrievedAt || '').slice(0, 10), provider: c.provider,
        suppression: sup ? sup.reason : '', claim_id: r ? r.proofId || '' : '', draft_version: b ? 'batch ' + b.n : '', campaign_id: b ? b.campaignId : '', campaign: cmp ? cmp.name : '',
        owner: cmp ? cmp.owner : t.profile.outreachOwner, disposition: it ? it.state : G.contactState(t, c, icp)
      });
    }
    if (batch) batch.rows.forEach(function (r) { var c = G.contactById(t, r.contactId); if (c) rowFor(c, batch, r); });
    else t.contacts.forEach(function (c) {
      if (!G.accountById(t, c.accountId)) return;
      var bs = t.batches.filter(function (b) { return b.rows.some(function (r) { return r.contactId === c.id; }); });
      if (!bs.length) rowFor(c, null, null); else bs.forEach(function (b) { rowFor(c, b, b.rows.find(function (r) { return r.contactId === c.id; })); });
    });
    var keys = rows.length ? Object.keys(rows[0]) : ['client'];
    return G.toCSV(keys.map(function (k) { return { key: k }; }), rows);
  };
  A['acc-sheet'] = function () {
    var t = S.t;
    App.download(App.slug(t.profile.name) + '-enrichment-sheet.csv', App.enrichmentSheet(t));
    G.log(t, 'Operator', 'Exported internal enrichment sheet'); App.save();
    App.toast('Internal sheet exported. It includes evidence links: do not send it to sending tools.');
  };

  /* ================= Contacts ================= */
  var REVIEW = ['ambiguous-persona', 'no-persona', 'unverified', 'conflicting-employment', 'missing-email', 'unmatched'];
  V.contacts = {
    title: 'Contacts',
    header: function () { return { title: 'Contacts', actions: '<button class="btn hide-sm" data-act="con-template">' + I('download') + 'Template</button>' + (S.t.accounts.length ? '<button class="btn" data-act="ai-contacts">' + I('sparkle') + 'Suggest contacts</button><button class="btn" data-act="find-buyers">' + I('search') + 'Find buyers</button>' : '') + '<button class="btn primary" data-act="con-import">' + I('upload') + 'Import contacts</button>' }; },
    render: function (param) {
      var t = S.t;
      if (param === 'review') S.ui.cf = 'review';
      if (!t.contacts.length) return App.emptyState('contacts', 'Resolve the buyers', t.accounts.length ? 'Let GTM Engine suggest named buyers at your accounts, look them up yourself with Find buyers, or import contacts from Clay or a CSV. Titles are matched to your personas; anything ambiguous comes back here for a decision.' : 'Import accounts first. Contacts are matched to accounts by company domain or email domain.', t.accounts.length ? '<button class="btn primary" data-act="ai-contacts">' + I('sparkle') + 'Suggest contacts with GTM Engine</button><button class="btn" data-act="find-buyers">' + I('search') + 'Find buyers</button><button class="btn" data-act="con-import">' + I('upload') + 'Import contacts</button><button class="btn" data-act="con-template">' + I('download') + 'CSV template</button>' : '<a class="btn primary" href="#/accounts">Go to accounts</a>');
      var icp = G.icpForScoring(t), counts = { all: t.contacts.length, ready: 0, review: 0, blocked: 0 };
      t.contacts.forEach(function (c) { var s = G.contactState(t, c, icp); if (s === 'ready') counts.ready++; else if (REVIEW.indexOf(s) > -1) counts.review++; else counts.blocked++; });
      var f = S.ui.cf || 'all';
      return '<div class="row" style="margin-bottom:12px"><div class="seg">' + [['all', 'All'], ['ready', 'Ready'], ['review', 'Needs review'], ['blocked', 'Suppressed or excluded']].map(function (x) { return '<button data-act="con-filter" data-f="' + x[0] + '" class="' + (f === x[0] ? 'on' : '') + '">' + x[1] + ' <span class="n">' + counts[x[0]] + '</span></button>'; }).join('') +
        '</div><span class="grow"></span><input type="search" data-filter="con" placeholder="Search name, title or email" value="' + esc(S.ui.cq || '') + '" style="max-width:260px" aria-label="Search contacts"></div>' +
        (counts.review ? '<div class="note warn" style="margin-bottom:12px">' + I('contacts') + '<span class="grow"><b>' + App.plural(counts.review, 'contact') + ' need a decision.</b> Pick a persona for ambiguous titles, confirm employment where the email domain differs, or exclude.</span></div>' : '') +
        '<div class="card"><div class="table-wrap" id="con-table"></div></div>';
    },
    mounted: function () { App.refresh('con-table'); }
  };
  App.refreshers['con-table'] = function () {
    var el = document.getElementById('con-table'); if (!el) return;
    var t = S.t, icp = G.icpForScoring(t), f = S.ui.cf || 'all', q = (S.ui.cq || '').toLowerCase();
    var rows = t.contacts.filter(function (c) {
      var s = G.contactState(t, c, icp);
      if (f === 'ready' && s !== 'ready') return false;
      if (f === 'review' && REVIEW.indexOf(s) < 0) return false;
      if (f === 'blocked' && (s === 'ready' || REVIEW.indexOf(s) > -1)) return false;
      return !q || (c.name + ' ' + c.title + ' ' + c.email).toLowerCase().indexOf(q) > -1;
    });
    if (!rows.length) { el.innerHTML = '<div class="empty"><p>No contacts match this filter.</p></div>'; return; }
    el.innerHTML = '<table class="t"><thead><tr><th>Contact</th><th>Company</th><th>Email</th><th>Persona</th><th>Disposition</th><th>Source</th><th></th></tr></thead><tbody>' + rows.map(function (c) {
      var i = t.contacts.indexOf(c), a = G.accountById(t, c.accountId), s = G.contactState(t, c, icp), pm = G.contactPersona(c, icp);
      var auto = pm.manual ? '' : pm.id ? (icp.personas.find(function (p) { return p.id === pm.id; }) || {}).name : pm.ids.length > 1 ? 'Ambiguous' : 'No match';
      var popts = [{ value: '', label: 'Auto: ' + (auto || '—') }].concat(icp ? icp.personas.map(function (p) { return { value: p.id, label: p.name || 'Untitled' }; }) : []);
      var fix = s === 'conflicting-employment' ? '<button class="btn sm" data-act="con-confirm" data-i="' + i + '">Confirm employment</button>' : (s === 'missing-email' || s === 'unverified') ? '<button class="btn sm" data-act="con-email" data-i="' + i + '">' + (s === 'missing-email' ? 'Add email' : 'Update email') + '</button>' : '';
      return '<tr><td class="name"><b>' + esc(c.name) + (c.suggested ? ' <span class="badge info plain" title="Suggested by GTM Engine; verify the role and find a work email">Suggested</span>' : '') + '</b><span>' + esc(c.title || 'No title') + (c.linkedinSearch ? ' · <a href="' + esc(c.linkedinSearch) + '" target="_blank" rel="noopener">verify</a>' : '') + '</span></td><td>' + (a ? '<a href="#" data-act="acc-open" data-id="' + a.id + '">' + esc(a.name) + '</a>' : '—') + '</td>' +
        '<td><span class="mono">' + esc(c.email || '—') + '</span><br><small class="' + (G.isVerified(c.verification) ? 'muted' : 'faint') + '">' + esc(c.verification || 'unverified') + '</small></td>' +
        '<td style="min-width:170px">' + (icp ? App.bindSelect('contacts.' + i + '.personaId', popts, { cls: 'sm', refresh: 'con-table', label: 'Persona for ' + c.name }) : '—') + '</td>' +
        '<td>' + App.stateBadge(G.CONTACT_STATES, s) + '</td><td class="small muted nowrap">' + esc(c.provider || '—') + '<br>' + App.fmtDate(c.retrievedAt) + '</td>' +
        '<td class="right nowrap">' + fix + '<button class="btn sm ghost" data-act="con-exclude" data-i="' + i + '">' + (c.excluded ? 'Include' : 'Exclude') + '</button></td></tr>';
    }).join('') + '</tbody></table>';
    App.renderSide();
  };
  A['con-filter'] = function (el) { S.ui.cf = el.getAttribute('data-f'); if (S.param) App.go('#/contacts'); else App.render(); };
  A['con-template'] = function () { App.download('contacts-template.csv', CON_TEMPLATE); };
  A['con-confirm'] = function (el) { var c = S.t.contacts[+el.getAttribute('data-i')]; c.employmentConfirmed = true; G.log(S.t, 'Operator', 'Confirmed employment', c.name + ' · ' + c.email); App.save(); App.refresh('con-table'); };
  A['con-email'] = function (el) {
    var t = S.t, c = t.contacts[+el.getAttribute('data-i')], a = G.accountById(t, c.accountId);
    App.modal({
      title: (c.email ? 'Update email for ' : 'Add email for ') + c.name, sub: esc(c.title || '') + (a ? ' at ' + esc(a.name) : ''),
      body: '<div class="fields"><div class="field"><label for="ce-e">Work email</label><input id="ce-e" type="email" autofocus value="' + esc(c.email || '') + '" placeholder="name@' + esc(a ? a.domain : 'company.com') + '"></div>' +
        '<div class="field"><label for="ce-v">Email status</label><select id="ce-v"><option value="">Not verified yet</option><option value="valid"' + (G.isVerified(c.verification) ? ' selected' : '') + '>Verified valid</option><option value="catch-all">Catch-all / risky</option><option value="invalid">Invalid</option></select></div></div>' +
        (c.linkedinSearch ? '<div class="small"><a href="' + esc(c.linkedinSearch) + '" target="_blank" rel="noopener">Look them up on LinkedIn</a> to confirm they still hold this role.</div>' : ''),
      actions: [{ label: 'Cancel', cls: 'ghost' }, {
        label: 'Save', cls: 'primary', onClick: function (m) {
          var e = m.body.querySelector('#ce-e').value.trim(), v = m.body.querySelector('#ce-v').value;
          if (e && !G.normEmail(e)) { App.toast('That email address doesn\'t look right', 'bad'); return false; }
          if (e && t.contacts.some(function (x) { return x !== c && x.email === G.normEmail(e); })) { App.toast('Another contact already has that email', 'bad'); return false; }
          c.email = G.normEmail(e); c.verification = v; c.history = c.history || []; c.history.push({ at: G.now(), source: 'Manual', changed: ['email'] });
          G.log(t, 'Operator', 'Updated contact email', c.name); App.save(); App.render(); App.toast('Saved');
        }
      }]
    });
  };
  A['con-exclude'] = function (el) { var c = S.t.contacts[+el.getAttribute('data-i')]; c.excluded = !c.excluded; G.log(S.t, 'Operator', (c.excluded ? 'Excluded' : 'Included') + ' contact', c.name); App.save(); App.render(); };
  A['con-import'] = function () {
    var t = S.t;
    if (!t.accounts.length) { App.toast('Import accounts first', 'bad'); return; }
    App.importWizard({
      kind: 'contacts', title: 'Import contacts', sub: 'Matched to accounts by company domain, then email domain. Re-importing updates existing contacts.', template: CON_TEMPLATE,
      extra: '<div class="fields three"><div class="field"><label for="iw-p">Provider</label><input id="iw-p" name="provider" value="Clay"></div><div class="field"><label for="iw-cr">Credits used (optional)</label><input id="iw-cr" name="credits" type="number"></div><div class="field"><label for="iw-co">Actual cost, USD (optional)</label><input id="iw-co" name="cost" type="number" step="0.01"></div></div>',
      onImport: function (rows, mapping, ex) {
        var r = G.importContacts(t, rows, mapping, { provider: ex.provider || 'CSV' });
        if (ex.cost || ex.credits) {
          var pend = t.costs.find(function (c) { return c.estimated && !c.superseded && c.kind === 'Contact enrichment'; });
          if (pend) pend.superseded = true;
          t.costs.push({ id: G.uid('cost'), at: G.now(), kind: 'Contact enrichment', provider: ex.provider || 'CSV', credits: G.toNum(ex.credits), amount: G.toNum(ex.cost), estimated: false, note: rows.length + ' rows imported' });
        }
        G.log(t, 'Operator', 'Imported ' + rows.length + ' contact rows from ' + (ex.provider || 'CSV'), r.added + ' added, ' + r.updated + ' updated, ' + r.conflicts + ' without an account');
        return r;
      },
      result: function (r) {
        var icp = G.icpForScoring(t), review = t.contacts.filter(function (c) { return REVIEW.indexOf(G.contactState(t, c, icp)) > -1; }).length;
        return App.resultTiles([['Added', r.added], ['Updated', r.updated], ['Unchanged', r.unchanged], ['No account', r.conflicts]]) + (review ? '<div class="note warn">' + I('contacts') + '<span class="grow">' + App.plural(review, 'contact') + ' need review (persona, verification or employment).</span></div>' : '');
      },
      after: function () { App.rerender(); }
    });
  };

  /* ================= Campaigns ================= */
  function cmpIdx(c) { return S.t.campaigns.indexOf(c); }
  function briefMissing(t, c) {
    var m = [];
    [['name', 'Name'], ['owner', 'Owner'], ['objective', 'Business objective'], ['personaId', 'Persona'], ['hypothesis', 'Hypothesis'], ['cta', 'Call to action'], ['sender', 'Sending mailbox'], ['kpi', 'Primary KPI'], ['successCriterion', 'Success criterion']]
      .forEach(function (f) { if (!c[f[0]] || !String(c[f[0]]).trim()) m.push(f[1]); });
    if (!c.steps.length) m.push('At least one sequence step');
    return m;
  }
  V.campaigns = {
    title: 'Campaigns',
    header: function () {
      var parts = (S.param || '').split('/'), c = parts[0] && G.campaignById(S.t, parts[0]);
      if (c) return { title: c.name || 'Untitled campaign', actions: '<a class="btn ghost" href="#/campaigns">All campaigns</a><button class="btn primary" data-act="cmp-draft" data-id="' + c.id + '">' + I('sparkle') + 'Draft next batch</button>' };
      return { title: 'Campaigns', actions: '<button class="btn primary" data-act="cmp-new">' + I('plus') + 'New campaign</button>' };
    },
    render: function (param) {
      var t = S.t, parts = (param || '').split('/'), c = parts[0] && G.campaignById(t, parts[0]);
      if (c) return detail(t, c, parts[1] || (t.batches.some(function (b) { return b.campaignId === c.id; }) ? 'batches' : 'brief'));
      if (!t.campaigns.length) {
        var act = G.activeICP(t);
        return App.emptyState('campaign', 'Write the first campaign brief', 'A campaign has a named owner, objective, persona, hypothesis, CTA, sender and sequence. Drafts use only approved positioning, cited account facts and verified public proof.', act ? '<button class="btn primary" data-act="cmp-new">' + I('plus') + 'New campaign</button>' : '<a class="btn primary" href="#/icp">Approve an ICP first</a>');
      }
      return '<div class="grid2">' + t.campaigns.map(function (c) {
        var bs = t.batches.filter(function (b) { return b.campaignId === c.id; }), m = G.metrics(t, { campaignId: c.id });
        var icp = G.icpByV(t, c.icpVersion), per = icp && icp.personas.find(function (p) { return p.id === c.personaId; });
        return '<a class="card" href="#/campaigns/' + c.id + '" style="color:inherit;text-decoration:none"><div class="card-b stack sm"><div class="row"><h2 class="grow">' + esc(c.name || 'Untitled campaign') + '</h2>' + (bs.length ? App.stateBadge(G.BATCH_STATES, G.batchState(t, bs[bs.length - 1])) : App.badge('muted', 'Brief only')) + '</div>' +
          '<div class="small muted">' + esc(per ? per.name : 'Any persona') + ' · ' + esc(c.channel) + ' · owner ' + esc(c.owner || '—') + ' · ICP v' + (c.icpVersion || '—') + '</div>' +
          '<p class="small" style="margin:4px 0 6px">' + esc(c.hypothesis || 'No hypothesis yet') + '</p>' +
          '<div class="row small"><span>' + App.plural(bs.length, 'batch', 'batches') + '</span><span class="muted">·</span><span>' + m.delivered + ' delivered</span><span class="muted">·</span><span>' + m.positive + ' positive</span><span class="muted">·</span><span>' + m.held + ' held</span></div></div></a>';
      }).join('') + '</div>';
    },
    mounted: function () { App.refresh('cmp-preview'); }
  };
  A['cmp-new'] = function () {
    var t = S.t;
    if (!G.activeICP(t)) { App.toast('Approve an ICP first', 'bad'); App.go('#/icp'); return; }
    var c = G.blankCampaign(t); c.name = 'New campaign';
    t.campaigns.push(c); G.log(t, 'Operator', 'Created campaign brief'); App.save(); App.go('#/campaigns/' + c.id + '/brief');
  };
  function detail(t, c, tab) {
    var bs = t.batches.filter(function (b) { return b.campaignId === c.id; });
    var html = '<div class="tabs"><a href="#/campaigns/' + c.id + '/brief" class="' + (tab === 'brief' ? 'on' : '') + '">Brief & sequence</a><a href="#/campaigns/' + c.id + '/batches" class="' + (tab === 'batches' ? 'on' : '') + '">Batches <span class="n">' + bs.length + '</span></a><a href="#/campaigns/' + c.id + '/results" class="' + (tab === 'results' ? 'on' : '') + '">Results</a></div>';
    if (tab === 'results') return html + App.resultsHTML(t, { campaignId: c.id }, c);
    if (tab === 'batches') return html + batchesHTML(t, c, bs);
    return html + briefHTML(t, c);
  }
  function briefHTML(t, c) {
    var P = 'campaigns.' + cmpIdx(c) + '.', icp = G.activeICP(t) || G.icpByV(t, c.icpVersion);
    var locked = t.batches.some(function (b) { return b.campaignId === c.id && b.approval; });
    function f(l, k, o) { o = o || {}; o.refresh = 'cmp-preview'; o.id = 'cb-' + k; return '<div class="field' + (o.full ? ' full' : '') + '"><label for="cb-' + k + '">' + esc(l) + '</label>' + (o.text ? App.bindText(P + k, o) : o.select ? App.bindSelect(P + k, o.select, o) : App.bindInput(P + k, o)) + (o.hint ? '<span class="hint">' + o.hint + '</span>' : '') + '</div>'; }
    var proofOpts = [{ value: '', label: 'No proof' }].concat(t.proof.map(function (p) { var u = G.proofUsable(t, p); return { value: p.id, label: (u.ok ? '✓ ' : '⚠ ' + u.why + ': ') + p.text.slice(0, 70) }; }));
    var miss = briefMissing(t, c);
    return '<div class="split wide-side"><div class="stack">' +
      (locked ? '<div class="note info">' + I('info') + '<span class="grow">Batches already drafted keep their own frozen copy. Edits here apply to the next batch you draft.</span></div>' : '') +
      '<div class="card"><div class="card-h"><h2>Brief</h2><span id="cmp-badge"></span><button class="btn sm" data-act="ai-brief" data-id="' + c.id + '">' + I('sparkle') + 'Suggest with GTM Engine</button></div><div class="card-b"><div class="fields">' +
        f('Campaign name', 'name') + f('Owner', 'owner', { hint: 'Gets replies when the CRM has no owner.' }) +
        f('Business objective', 'objective', { full: true, text: true, rows: 2 }) +
        f('Persona', 'personaId', { select: icp ? icp.personas.map(function (p) { return { value: p.id, label: p.name + ' (' + p.priority + ')' }; }) : [] }) +
        f('Proof to cite', 'proofId', { select: proofOpts, hint: 'Only verified, public-use proof is inserted; anything else is withheld.' }) +
        f('Pain point and evidence', 'pain', { full: true, text: true, rows: 2, placeholder: 'What you believe hurts, and which sources say so' }) +
        f('Hypothesis', 'hypothesis', { full: true, text: true, rows: 2, placeholder: 'If we tell X about Y, they will Z' }) +
        f('Call to action', 'cta', { full: true, placeholder: 'e.g. Worth a 20-minute look next week?' }) +
        f('Channel', 'channel', { select: [{ value: 'Email', label: 'Email (Smartlead)' }] , hint: 'LinkedIn via HeyReach follows the email pilot.' }) + f('Sending mailbox', 'sender') +
        f('Sender name', 'senderName') + f('Batch size', 'batchSize', { type: 'int' }) +
        f('Primary KPI', 'kpi', { select: ['Held meetings', 'Positive replies', 'Sourced pipeline'] }) + f('Success criterion', 'successCriterion', { placeholder: 'e.g. 2 held meetings from 25 delivered' }) +
        f('Attribution window (days)', 'windowDays', { type: 'int' }) + f('Campaign budget (USD)', 'budget', { type: 'num' }) +
      '</div></div></div>' +
      '<div class="card"><div class="card-h"><h2>Sequence<span class="sub">Click a token to insert it where your cursor is.</span></h2><button class="btn sm" data-act="step-add" data-id="' + c.id + '">' + I('plus') + 'Add step</button></div><div class="card-b stack">' +
        '<div class="token-bar">' + G.TOKENS.map(function (k) { return '<button type="button" data-act="token" data-k="' + k + '">{{' + k + '}}</button>'; }).join('') + '</div>' +
        c.steps.map(function (s, j) {
          return '<div class="persona"><div class="row"><b class="grow">Step ' + (j + 1) + '</b>' + (j ? '<span class="small muted">Wait</span><div style="width:70px">' + App.bindInput(P + 'steps.' + j + '.delayDays', { type: 'int', cls: 'sm', label: 'Delay days' }) + '</div><span class="small muted">days</span>' : '') + (c.steps.length > 1 ? '<button class="btn ghost sm icon" data-act="step-rm" data-id="' + c.id + '" data-j="' + j + '" aria-label="Remove step">' + I('trash') + '</button>' : '') + '</div>' +
            App.bindInput(P + 'steps.' + j + '.subject', { refresh: 'cmp-preview', placeholder: 'Subject', label: 'Subject, step ' + (j + 1), cls: 'tok' }) +
            App.bindText(P + 'steps.' + j + '.body', { refresh: 'cmp-preview', rows: 8, label: 'Body, step ' + (j + 1) }).replace('<textarea', '<textarea class="tok"') + '</div>';
        }).join('') +
        '<div class="small muted">' + I('info') + ' <b>{{personalization}}</b> is filled only from a dated, sourced account trigger. <b>{{question}}</b> comes from the persona: inferred pain is asked, never asserted. Empty lines collapse when a token has nothing to say.</div>' +
      '</div></div></div>' +
      '<div class="sticky stack"><div class="card"><div class="card-h"><h2>Live preview</h2></div><div class="card-b stack sm" id="cmp-preview" data-id="' + c.id + '"></div></div>' +
      '<div class="card"><div class="card-b stack sm"><div class="stack sm" id="cmp-ready"></div><button class="btn" data-act="cmp-claude" data-id="' + c.id + '">' + I('copy') + 'Copy AI drafting prompt</button>' +
        '<button class="btn ghost danger sm" data-act="cmp-delete" data-id="' + c.id + '">Delete campaign</button></div></div></div></div>';
  }
  App.refreshers['cmp-preview'] = function () {
    var el = document.getElementById('cmp-preview'); if (!el) return;
    var t = S.t, c = G.campaignById(t, el.getAttribute('data-id')), icp = G.activeICP(t);
    var miss = briefMissing(t, c), rd = document.getElementById('cmp-ready'), bd = document.getElementById('cmp-badge');
    if (bd) bd.innerHTML = miss.length ? App.badge('warn', miss.length + ' missing') : App.badge('ok', 'Complete');
    if (rd) rd.innerHTML = (miss.length ? '<div class="small"><b>Before drafting a batch:</b> ' + esc(miss.join(', ')) + '</div>' : '<div class="small">' + I('check') + ' Brief is complete.</div>') +
      '<button class="btn primary" data-act="cmp-draft" data-id="' + c.id + '"' + (miss.length ? ' disabled' : '') + '>' + I('sparkle') + 'Draft next batch</button>';
    if (!icp) { el.innerHTML = '<p class="muted small">Approve an ICP to preview drafts.</p>'; return; }
    var cand = G.batchCandidates(t, c).contacts;
    var pool = cand.length ? cand : t.contacts.filter(function (x) { return G.contactState(t, x, icp) === 'ready'; });
    if (!pool.length) { el.innerHTML = '<p class="muted small">No ready contacts yet. Import contacts at eligible accounts to preview real drafts.</p>'; return; }
    var pick = pool.find(function (x) { return x.id === S.ui.prevC; }) || pool[0];
    var d = G.renderDraft(t, c, pick, icp);
    el.innerHTML = '<select data-act-change="prev-contact" aria-label="Preview contact">' + pool.map(function (x) { var a = G.accountById(t, x.accountId); return '<option value="' + x.id + '"' + (x === pick ? ' selected' : '') + '>' + esc(x.name + ' · ' + (a ? a.name : '')) + '</option>'; }).join('') + '</select>' +
      App.draftHTML(d) + (!cand.length ? '<div class="small muted">Everyone ready is already in this campaign; showing them for preview only.</div>' : '<div class="small muted">' + App.plural(cand.length, 'contact') + ' ready for the next batch.</div>');
  };
  App.draftHTML = function (d) {
    return d.steps.map(function (s, i) {
      var body = esc(s.body);
      if (d.personalization) body = body.replace(esc(d.personalization.text), '<mark>' + esc(d.personalization.text) + '</mark>');
      return '<div class="email"><div class="subj"><small>Step ' + (i + 1) + (s.delayDays ? ' · +' + s.delayDays + 'd' : '') + '</small>' + esc(s.subject || '(no subject)') + '</div><div class="body">' + body + '</div></div>';
    }).join('') +
      (d.personalization ? '<div class="cite">' + I('link') + 'Fact: <a href="' + esc(d.personalization.url) + '" target="_blank" rel="noopener">' + esc(d.personalization.url.replace(/^https?:\/\//, '').slice(0, 48)) + '</a> · ' + App.fmtDate(d.personalization.date) + '</div>' : '') +
      (d.withheld.length ? '<div class="note warn">' + I('eye') + '<div class="grow"><b>Withheld</b><ul>' + d.withheld.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul></div></div>' : '') +
      (d.unknownTokens && d.unknownTokens.length ? '<div class="note bad">' + I('alert') + '<span class="grow">Unknown tokens left in the copy: ' + esc(d.unknownTokens.join(', ')) + '</span></div>' : '');
  };
  document.addEventListener('change', function (e) {
    if (e.target.matches && e.target.matches('[data-act-change="prev-contact"]')) { S.ui.prevC = e.target.value; App.refresh('cmp-preview'); }
  });
  var lastTok = null;
  document.addEventListener('focusin', function (e) { if (e.target.classList && e.target.classList.contains('tok')) lastTok = e.target; });
  A.token = function (el) {
    var k = '{{' + el.getAttribute('data-k') + '}}';
    var f = lastTok && document.body.contains(lastTok) ? lastTok : document.querySelector('textarea.tok');
    if (!f) return;
    var s = f.selectionStart != null ? f.selectionStart : f.value.length, e2 = f.selectionEnd != null ? f.selectionEnd : s;
    f.value = f.value.slice(0, s) + k + f.value.slice(e2);
    f.focus(); f.selectionStart = f.selectionEnd = s + k.length;
    f.dispatchEvent(new Event('change', { bubbles: true }));
  };
  A['step-add'] = function (el) { var c = G.campaignById(S.t, el.getAttribute('data-id')); c.steps.push({ subject: 'Re: ' + (c.steps[0] ? c.steps[0].subject : ''), body: 'Hi {{first_name}},\n\n{{cta}}\n\n{{sender_name}}', delayDays: 3 }); App.save(); App.render(); };
  A['step-rm'] = function (el) { var c = G.campaignById(S.t, el.getAttribute('data-id')); c.steps.splice(+el.getAttribute('data-j'), 1); App.save(); App.render(); };
  A['cmp-delete'] = function (el) {
    var t = S.t, c = G.campaignById(t, el.getAttribute('data-id'));
    if (t.batches.some(function (b) { return b.campaignId === c.id && b.approval; })) { App.toast('This campaign has approved batches. Archive its batches instead, so history stays reproducible.', 'bad'); return; }
    App.confirm({ title: 'Delete "' + c.name + '"?', body: '<p>Its draft batches are removed too.</p>', ok: 'Delete', danger: true }).then(function (ok) {
      if (!ok) return; t.campaigns.splice(t.campaigns.indexOf(c), 1); t.batches = t.batches.filter(function (b) { return b.campaignId !== c.id; });
      G.log(t, 'Operator', 'Deleted campaign', c.name); App.save(); App.go('#/campaigns');
    });
  };
  A['cmp-draft'] = function (el) {
    var t = S.t, c = G.campaignById(t, el.getAttribute('data-id'));
    if (t.paused) { App.toast('Client is paused', 'bad'); return; }
    var miss = briefMissing(t, c);
    if (miss.length) { App.toast('Finish the brief first: ' + miss.join(', '), 'bad'); App.go('#/campaigns/' + c.id + '/brief'); return; }
    var cand = G.batchCandidates(t, c);
    if (!cand.icp) { App.toast('Approve an ICP first', 'bad'); return; }
    var sk = Object.keys(cand.skipped);
    App.modal({
      title: 'Draft batch ' + (t.batches.filter(function (b) { return b.campaignId === c.id; }).length + 1), sub: 'Drafts are rendered from the brief, ICP v' + cand.icp.v + ' and each account\'s cited facts.',
      body: (cand.contacts.length ? App.resultTiles([['Will be drafted', cand.contacts.length], ['Waiting for next batch', cand.overflow]]) : '<div class="note warn">' + I('alert') + '<span class="grow">No contacts are ready for this campaign yet.</span></div>') +
        (sk.length ? '<div><div class="label" style="margin-bottom:6px">Not included, and why</div><table class="t"><tbody>' + sk.sort(function (a, b) { return cand.skipped[b] - cand.skipped[a]; }).map(function (k) { return '<tr><td>' + esc(k) + '</td><td class="num"><b>' + cand.skipped[k] + '</b></td></tr>'; }).join('') + '</tbody></table></div>' : '') +
        '<div class="small muted">Suppressed contacts produce no draft. Suppression is checked again just before export.</div>',
      actions: cand.contacts.length ? [{ label: 'Cancel', cls: 'ghost' }, {
        label: 'Draft ' + App.plural(cand.contacts.length, 'email sequence'), cls: 'primary', icon: 'sparkle', onClick: function () {
          c.icpVersion = cand.icp.v;
          var r = G.createBatch(t, c);
          if (!r.ok) { App.toast(r.why, 'bad'); return; }
          App.save(); App.go('#/campaigns/' + c.id + '/batches'); App.toast('Batch drafted. Review it, then send for approval.');
        }
      }] : [{ label: 'Close' }]
    });
  };
  A['cmp-claude'] = function (el) {
    var t = S.t, c = G.campaignById(t, el.getAttribute('data-id')), b = el.getAttribute('data-b') && G.batchById(t, el.getAttribute('data-b'));
    var rows = b ? b.rows : G.batchCandidates(t, c).contacts.map(function (x) { var d = G.renderDraft(t, c, x, G.activeICP(t)); return { contactId: x.id, accountId: x.accountId, email: x.email, personalization: d.personalization }; });
    var txt = G.claudePacket(t, c, rows);
    App.modal({
      title: 'AI drafting prompt', sub: 'A minimal, client-scoped context packet: approved persona, usable proof and cited facts only. Paste it into your AI assistant, then paste improved copy back into each row of the batch, which will need approval again.', wide: true,
      body: '<textarea readonly rows="16" style="font:12px/1.5 var(--mono)">' + esc(txt) + '</textarea>',
      actions: [{ label: 'Close', cls: 'ghost' }, { label: 'Copy prompt', cls: 'primary', icon: 'copy', onClick: function () { App.copy(txt, 'Prompt copied'); G.log(t, 'Operator', 'Copied AI drafting prompt', (c.name || '') + ' · ' + rows.length + ' recipients'); App.save(); } }]
    });
  };

  /* ---------- batch review ---------- */
  var PIPE = [['awaiting-approval', 'Awaiting approval'], ['approved', 'Approved'], ['staged', 'Staged'], ['enrolled', 'Enrolled'], ['reconciled', 'Reconciled']];
  function batchesHTML(t, c, bs) {
    if (!bs.length) return App.emptyState('campaign', 'No batches yet', 'Draft a batch from contacts who are ready, at eligible accounts, for this persona. You will review every rendered email and its sources before approval.', '<button class="btn primary" data-act="cmp-draft" data-id="' + c.id + '">' + I('sparkle') + 'Draft first batch</button>');
    return '<div class="stack">' + bs.slice().reverse().map(function (b) { return batchCard(t, c, b); }).join('') + '</div>';
  }
  function batchCard(t, c, b) {
    var st = G.batchState(t, b), hash = G.batchHash(b), icp = G.icpByV(t, b.icpVersion);
    var order = PIPE.map(function (x) { return x[0]; }), cur = order.indexOf(st === 'expired-approval' || st === 'needs-review' ? 'awaiting-approval' : st);
    var intents = G.batchIntents(t, b), enrolled = intents.filter(function (e) { return e.state === 'enrolled'; }).length;
    var skips = b.exportSkips || [], unresolved = st === 'staged' ? G.unresolvedRows(t, b) : [];
    var html = '<div class="card"><div class="card-h"><h2>Batch ' + b.n + '<span class="sub">Drafted ' + App.fmtDT(b.createdAt) + ' · ICP v' + b.icpVersion + ' · ' + App.plural(b.rows.length, 'recipient') + ' · ' + esc(b.channel) + ' from ' + esc(b.sender || '—') + '</span></h2>' + App.stateBadge(G.BATCH_STATES, st) + '</div><div class="card-b stack">' +
      '<div class="pipe">' + PIPE.map(function (p, i) { return '<span class="' + (i < cur || (i === cur && (st === 'enrolled' || st === 'reconciled')) ? 'done' : i === cur ? 'cur' : '') + '"><i></i>' + p[1] + (p[0] === 'enrolled' && intents.length ? ' (' + enrolled + '/' + (b.rows.length - skips.length) + ')' : '') + '</span>'; }).join('') + '</div>';
    if (st === 'needs-review') {
      var outs = b.needsReview.outOfScope.map(function (id) { var x = G.contactById(t, id); return x ? x.name : id; });
      html += '<div class="note bad">' + I('alert') + '<div class="grow"><b>' + esc(b.needsReview.reason) + '.</b> ' + App.plural(outs.length, 'contact') + ' no longer eligible: ' + esc(outs.join(', ')) + '. The audience must be re-approved before release.<div class="row" style="margin-top:8px"><button class="btn sm" data-act="bat-scope" data-b="' + b.id + '" data-mode="remove">Remove them and re-submit</button><button class="btn sm ghost" data-act="bat-scope" data-b="' + b.id + '" data-mode="keep">Keep all rows and re-submit</button></div></div></div>';
    }
    if (st === 'expired-approval') html += '<div class="note bad">' + I('alert') + '<span class="grow"><b>Copy or audience changed after ' + esc(b.approval.by) + ' approved it.</b> The earlier approval cannot authorise this version (fingerprint ' + b.approval.hash + ' → ' + hash + ').</span></div>';
    if (b.approval && st !== 'expired-approval') html += '<div class="small muted">' + I('shield') + ' Approved by <b>' + esc(b.approval.by) + '</b> on ' + App.fmtDT(b.approval.at) + ' · binds this exact audience, copy, channel and sender (fingerprint <span class="mono">' + b.approval.hash + '</span>)</div>';
    if (skips.length) html += '<div class="note warn">' + I('x') + '<span class="grow">' + App.plural(skips.length, 'row') + ' held back at the export recheck: ' + esc(skips.map(function (s) { var x = G.contactById(t, s.contactId); return (x ? x.name : '') + ' (' + s.reason + ')'; }).join(', ')) + '. Other rows proceeded.</span></div>';
    if (unresolved.length) html += '<div class="note warn">' + I('swap') + '<span class="grow"><b>' + App.plural(unresolved.length, 'exported row') + ' not confirmed by the provider.</b> Reconcile the provider\'s enrollment list before retrying; a retry includes only unresolved rows, so nobody is enrolled twice.</span></div>';
    html += '<div class="table-wrap" style="border:1px solid var(--line);border-radius:10px"><table class="t"><thead><tr><th>Recipient</th><th>Company</th><th>Personalization</th><th>Withheld</th><th>Status</th><th></th></tr></thead><tbody>' + b.rows.map(function (r, i) {
      var x = G.contactById(t, r.contactId), a = G.accountById(t, r.accountId);
      var it = intents.find(function (e) { return e.contactId === r.contactId; }), sk = skips.find(function (s) { return s.contactId === r.contactId; });
      var stb = sk ? App.badge('bad', 'Held: ' + sk.reason) : it ? (it.state === 'enrolled' ? App.badge('ok', 'Enrolled') : it.state === 'failed' ? App.badge('bad', 'Rejected') : App.badge('accent', 'Staged')) + (it.hold ? '<br><small class="muted">Sequence held: ' + esc(it.hold.reason) + (it.hold.acknowledged ? ' (confirmed)' : '') + '</small>' : '') : App.badge('muted', 'Not staged');
      return '<tr><td class="name"><b>' + esc(x ? x.name : '?') + (r.edited ? ' <span class="badge info plain">edited</span>' : '') + '</b><span>' + esc(x ? x.title : '') + ' · ' + esc(r.email) + '</span></td><td>' + esc(a ? a.name : '') + '</td>' +
        '<td>' + (r.personalization ? '<span class="cite">' + I('link') + '<a href="' + esc(r.personalization.url) + '" target="_blank" rel="noopener" title="' + esc(r.personalization.text) + '">Sourced fact</a></span>' : '<span class="faint small">Omitted</span>') + '</td>' +
        '<td>' + (r.withheld.length ? '<span class="badge warn plain" title="' + esc(r.withheld.join('\n')) + '">' + r.withheld.length + '</span>' : '<span class="faint">—</span>') + '</td><td>' + stb + '</td>' +
        '<td class="right nowrap"><button class="btn sm ghost" data-act="row-view" data-b="' + b.id + '" data-i="' + i + '">' + I('eye') + 'Review</button>' + (!it ? '<button class="btn sm ghost icon" data-act="row-rm" data-b="' + b.id + '" data-i="' + i + '" aria-label="Remove ' + esc(x ? x.name : '') + ' from batch">' + I('x') + '</button>' : '') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
    var acts = '';
    if (st === 'awaiting-approval' || st === 'expired-approval') acts += '<button class="btn primary" data-act="bat-approve" data-b="' + b.id + '">' + I('shield') + 'Approve batch</button>';
    if (st === 'approved') acts += '<button class="btn primary" data-act="bat-stage" data-b="' + b.id + '">' + I('download') + 'Export to Smartlead (stage)</button>';
    if (st === 'staged') acts += '<button class="btn primary" data-act="bat-ack" data-b="' + b.id + '">' + I('upload') + 'Record provider acknowledgement</button><button class="btn" data-act="bat-ack-all" data-b="' + b.id + '">Provider accepted all exported rows</button>' + (unresolved.length ? '<button class="btn" data-act="bat-stage" data-b="' + b.id + '">' + I('download') + 'Retry unresolved rows only</button>' : '');
    if (st === 'enrolled') acts += '<button class="btn" data-act="bat-reconcile" data-b="' + b.id + '">' + I('check') + 'Mark reconciled</button>';
    acts += '<span class="grow"></span><button class="btn ghost sm" data-act="cmp-claude" data-id="' + c.id + '" data-b="' + b.id + '">' + I('copy') + 'AI prompt</button><button class="btn ghost sm" data-act="bat-sheet" data-b="' + b.id + '">' + I('download') + 'Internal sheet</button>' + (st !== 'enrolled' && st !== 'reconciled' && !intents.length ? '<button class="btn ghost sm" data-act="bat-archive" data-b="' + b.id + '">Archive</button>' : '');
    html += '<div class="row">' + acts + '</div>';
    if (b.history.length) html += '<details><summary class="small muted" style="cursor:pointer">History (' + b.history.length + ')</summary><div class="stack sm" style="margin-top:8px">' + b.history.slice().reverse().map(function (h) { return '<div class="small"><span class="muted">' + App.fmtDT(h.at) + '</span> · ' + esc(h.what) + '</div>'; }).join('') + '</div></details>';
    return html + '</div></div>';
  }
  function bat(el) { return G.batchById(S.t, el.getAttribute('data-b')); }
  A['row-view'] = function (el) {
    var t = S.t, b = bat(el), r = b.rows[+el.getAttribute('data-i')], x = G.contactById(t, r.contactId), a = G.accountById(t, r.accountId);
    var locked = G.batchIntents(t, b).some(function (e) { return e.contactId === r.contactId; });
    var wasApproved = b.approval && G.batchState(t, b) !== 'expired-approval';
    App.modal({
      title: (x ? x.name : '') + ' · ' + (a ? a.name : ''), sub: esc(x ? x.title : '') + ' · ' + esc(r.email), wide: true,
      body: '<div class="grid2"><div class="stack sm"><div class="label">Rendered copy' + (locked ? ' (already exported, read-only)' : '') + '</div>' + r.steps.map(function (s, j) {
        return '<div class="persona"><div class="small muted">Step ' + (j + 1) + '</div><input data-rs="' + j + '" value="' + esc(s.subject) + '"' + (locked ? ' disabled' : '') + ' aria-label="Subject"><textarea data-rb="' + j + '" rows="9"' + (locked ? ' disabled' : '') + ' aria-label="Body">' + esc(s.body) + '</textarea></div>';
      }).join('') + '</div><div class="stack sm"><div class="label">Evidence behind this email</div>' +
        (r.personalization ? '<div class="note ok">' + I('link') + '<div class="grow"><b>Fact used</b><br>' + esc(r.personalization.text) + '<br><a href="' + esc(r.personalization.url) + '" target="_blank" rel="noopener">' + esc(r.personalization.url) + '</a> · ' + App.fmtDate(r.personalization.date) + '</div></div>' : '<div class="note">' + I('info') + '<span class="grow">No sourced fact for this account, so no personalization line.</span></div>') +
        (r.proofId ? '<div class="note ok">' + I('shield') + '<span class="grow"><b>Approved proof</b><br>' + esc((S.t.proof.find(function (p) { return p.id === r.proofId; }) || {}).text) + '</span></div>' : '') +
        (r.withheld.length ? '<div class="note warn">' + I('eye') + '<div class="grow"><b>Withheld</b><ul>' + r.withheld.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul></div></div>' : '') +
        (wasApproved && !locked ? '<div class="note bad">' + I('alert') + '<span class="grow">Saving an edit invalidates the approval for the whole batch.</span></div>' : '') + '</div></div>',
      actions: locked ? [{ label: 'Close' }] : [{ label: 'Cancel', cls: 'ghost' }, {
        label: 'Save edits', cls: 'primary', onClick: function (m) {
          var changed = false;
          r.steps.forEach(function (s, j) {
            var ns = m.body.querySelector('[data-rs="' + j + '"]').value, nb = m.body.querySelector('[data-rb="' + j + '"]').value;
            if (ns !== s.subject || nb !== s.body) { changed = true; s.subject = ns; s.body = nb; }
          });
          if (!changed) return;
          r.edited = true; b.history.push({ at: G.now(), what: 'Edited copy for ' + (x ? x.name : r.email) });
          G.log(t, 'Operator', 'Edited batch ' + b.n + ' copy', x ? x.name : r.email);
          App.save(); App.render(); App.toast(wasApproved ? 'Saved. The batch needs approval again.' : 'Saved');
        }
      }]
    });
  };
  A['row-rm'] = function (el) {
    var t = S.t, b = bat(el), r = b.rows[+el.getAttribute('data-i')], x = G.contactById(t, r.contactId);
    App.confirm({ title: 'Remove ' + (x ? x.name : r.email) + ' from batch ' + b.n + '?', body: b.approval ? '<p>Changing the audience invalidates the current approval.</p>' : '<p>They can be drafted into a later batch.</p>', ok: 'Remove', danger: true }).then(function (ok) {
      if (!ok) return;
      b.rows.splice(b.rows.indexOf(r), 1); b.history.push({ at: G.now(), what: 'Removed ' + (x ? x.name : r.email) });
      G.log(t, 'Operator', 'Removed recipient from batch ' + b.n, x ? x.name : r.email);
      if (!b.rows.length) b.archived = true;
      App.save(); App.render();
    });
  };
  A['bat-scope'] = function (el) {
    var t = S.t, b = bat(el), mode = el.getAttribute('data-mode'), out = b.needsReview.outOfScope;
    if (mode === 'remove') b.rows = b.rows.filter(function (r) { return out.indexOf(r.contactId) < 0; });
    b.history.push({ at: G.now(), what: (mode === 'remove' ? 'Removed ' + out.length + ' out-of-scope contacts' : 'Kept all rows') + ' after ICP v' + b.needsReview.v + '; approval cleared' });
    G.log(t, 'Operator', 'Resolved ICP change review for batch ' + b.n, mode === 'remove' ? out.length + ' removed' : 'kept');
    b.icpVersion = b.needsReview.v; b.needsReview = null; b.approval = null;
    if (!b.rows.length) b.archived = true;
    App.save(); App.render(); App.toast('Batch returned for approval');
  };
  A['bat-approve'] = function (el) {
    var t = S.t, b = bat(el), c = G.campaignById(t, b.campaignId);
    if (t.paused) { App.toast('Client is paused', 'bad'); return; }
    var withheld = b.rows.filter(function (r) { return r.withheld.length; }).length, sourced = b.rows.filter(function (r) { return r.personalization; }).length;
    App.modal({
      title: 'Approve batch ' + b.n, sub: 'Approval binds exactly what is listed here. Editing any of it later invalidates the approval.',
      body: '<dl class="kv"><dt>Campaign</dt><dd>' + esc(c.name) + '</dd><dt>Audience</dt><dd>' + App.plural(b.rows.length, 'recipient') + ' · ICP v' + b.icpVersion + '</dd><dt>Channel</dt><dd>' + esc(b.channel) + '</dd><dt>Sender</dt><dd>' + esc(b.sender || '—') + '</dd><dt>Copy</dt><dd>' + App.plural(b.rows[0] ? b.rows[0].steps.length : 0, 'step') + ' per recipient · fingerprint <span class="mono">' + G.batchHash(b) + '</span></dd><dt>Evidence</dt><dd>' + sourced + ' with a cited fact · ' + withheld + ' with something withheld</dd></dl>' +
        '<div class="field"><label for="ba-by">Approver</label><input id="ba-by" value="' + esc(t.profile.approver || '') + '" autofocus></div>' +
        '<label class="check"><input type="checkbox" id="ba-ok"> I reviewed the rendered emails and the sources behind each personalization line.</label>',
      actions: [{ label: 'Cancel', cls: 'ghost' }, {
        label: 'Approve batch', cls: 'primary', icon: 'shield', onClick: function (m) {
          if (!m.body.querySelector('#ba-ok').checked) { App.toast('Confirm that you reviewed the copy and sources', 'bad'); return false; }
          var r = G.approveBatch(t, b, m.body.querySelector('#ba-by').value.trim());
          if (!r.ok) { App.toast(r.why, 'bad'); return false; }
          App.save(); App.render(); App.toast('Batch ' + b.n + ' approved');
        }
      }]
    });
  };
  A['bat-stage'] = function (el) {
    var t = S.t, b = bat(el), c = G.campaignById(t, b.campaignId);
    var r = G.stageBatch(t, b);
    if (!r.ok) { App.toast(r.why, 'bad'); return; }
    App.save();
    if (r.rows.length) App.download(App.slug(t.profile.name) + '-' + App.slug(c.name) + '-batch' + b.n + '-smartlead.csv', G.senderCSV(t, b, r.rows));
    App.render();
    App.toast(r.rows.length ? 'Exported ' + App.plural(r.rows.length, 'row') + (r.skips.length ? '; ' + r.skips.length + ' held by the suppression recheck' : '') + '. Recorded as staged, not enrolled.' : 'Nothing left to export', r.rows.length ? 'ok' : 'bad');
  };
  A['bat-ack'] = function (el) {
    var t = S.t, b = bat(el);
    App.importWizard({
      kind: 'acks', title: 'Record provider acknowledgement', sub: 'Upload the provider\'s list of accepted leads. Only confirmed rows count as enrolled; the rest stay unresolved for a safe retry.',
      onImport: function (rows, mapping) { return G.recordAcks(t, b, rows, mapping); },
      result: function (r) { return App.resultTiles([['Newly enrolled', r.enrolled], ['Already recorded', r.already], ['Rejected', r.rejected], ['Not in batch', r.unknown.length]]) + (r.unknown.length ? '<p class="small muted">Not in this batch: ' + esc(r.unknown.slice(0, 8).join(', ')) + '</p>' : ''); },
      after: function () { App.rerender(); }
    });
  };
  A['bat-ack-all'] = function (el) {
    var t = S.t, b = bat(el);
    var rows = G.batchIntents(t, b).filter(function (e) { return e.state === 'staged'; }).map(function (e) { return { email: (b.rows.find(function (r) { return r.contactId === e.contactId; }) || {}).email }; });
    App.confirm({ title: 'Provider accepted all ' + rows.length + ' exported rows?', body: '<p>Only confirm this if the provider shows every one of them enrolled. If the export timed out or you are unsure, upload the provider\'s list instead.</p>', ok: 'Yes, mark enrolled' }).then(function (ok) {
      if (!ok) return; G.recordAcks(t, b, rows, { email: 'email' }); App.save(); App.render(); App.toast('Enrollment recorded');
    });
  };
  A['bat-reconcile'] = function (el) { var b = bat(el); b.reconciledAt = G.now(); b.history.push({ at: G.now(), what: 'Marked reconciled with provider' }); G.log(S.t, 'Operator', 'Reconciled batch ' + b.n); App.save(); App.render(); };
  A['bat-archive'] = function (el) { var b = bat(el); b.archived = true; b.history.push({ at: G.now(), what: 'Archived' }); G.log(S.t, 'Operator', 'Archived batch ' + b.n); App.save(); App.render(); };
  A['bat-sheet'] = function (el) { var t = S.t, b = bat(el); App.download(App.slug(t.profile.name) + '-batch' + b.n + '-internal-sheet.csv', App.enrichmentSheet(t, b)); };
})();
