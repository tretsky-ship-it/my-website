/* Prospecting helpers.
   - Suggest accounts: Claude proposes companies that fit the ICP; you choose how many and which to import.
     Claude answers from its own knowledge (no live web search from the page), so suggested accounts are
     labelled unverified, and any trigger it mentions is kept as a note to check, never as a sourced fact.
   - Find buyers: for accounts without a ready contact, shows the persona titles to look for, with LinkedIn
     searches and a quick "Add contact" form. No names or emails are invented. */
(function () {
  'use strict';
  var G = window.GTM, App = window.App, S = App.S, esc = App.esc, I = App.icon, A = App.act;
  var SUGGESTED = 'GTM Engine suggestion (unverified)';

  /* ================= Suggest accounts ================= */
  function icpSummary(icp) {
    var lines = [
      'Target industries: ' + (icp.industries.values.join(', ') || 'any'),
      'Employees: ' + (icp.size.min != null ? icp.size.min : 'any') + ' to ' + (icp.size.max != null ? icp.size.max : 'any'),
      'Geography: ' + (icp.geography.values.join(', ') || 'any'),
      icp.disqualifiers.industries.length ? 'Exclude industries: ' + icp.disqualifiers.industries.join(', ') : '',
      icp.disqualifiers.keywords.length ? 'Exclude companies associated with: ' + icp.disqualifiers.keywords.join(', ') : '',
      icp.triggers.keywords.length ? 'Buying signals we look for: ' + icp.triggers.keywords.join(', ') : '',
      icp.personas.length ? 'Buyers: ' + icp.personas.map(function (p) { return p.name + ' (' + p.titles.slice(0, 4).join(', ') + ')'; }).join('; ') : ''
    ];
    icp.custom.forEach(function (c) { if (c.label) lines.push((c.mandatory ? 'Must: ' : 'Nice to have: ') + c.label); });
    return lines.filter(Boolean).join('\n');
  }
  function accountsPrompt(t, icp, n, focus) {
    var have = t.accounts.map(function (a) { return a.domain; }).concat(t.suppression.map(function (s) { return s.value; })).slice(0, 300);
    return 'You are a B2B prospecting researcher. Suggest ' + n + ' real, currently operating companies that fit this Ideal Customer Profile for ' + (t.profile.name || 'the client') + ', which sells: ' + (t.profile.offer || 'see ICP') + '.\n\n' +
      icpSummary(icp) + (focus ? '\nExtra focus from the operator: ' + focus : '') +
      (have.length ? '\n\nDo NOT include these domains (already in the list or blocked): ' + have.join(', ') : '') +
      '\n\nRules: only companies you are confident exist, with their real primary website domain. Prefer companies that are not household names, since those rarely buy from small vendors. Give your best estimate of employee count. If you know of a recent buying signal, describe it in "possibleTrigger" with roughly when, but say nothing if unsure; never invent URLs.' +
      '\n\nReply with ONLY a JSON object:\n{"accounts":[{"name":"Company name","domain":"example.com","industry":"industry as a data provider would label it","employees":350,"country":"United States","city":"Columbus, OH","why":"one line on why it fits","possibleTrigger":"optional, e.g. opened a second plant in 2025","confidence":"high or medium"}]}';
  }
  function cleanAccounts(d) {
    var t = S.t, seen = {};
    var list = (d && Array.isArray(d.accounts) ? d.accounts : Array.isArray(d) ? d : []).map(function (a) {
      var dom = G.normDomain(a && a.domain);
      return { name: String(a && a.name || '').trim().slice(0, 120), domain: dom, industry: String(a && a.industry || '').trim().slice(0, 80), employees: G.toInt(a && a.employees),
        country: String(a && a.country || '').trim().slice(0, 60), city: String(a && a.city || '').trim().slice(0, 80), why: String(a && a.why || '').trim().slice(0, 240),
        possibleTrigger: String(a && a.possibleTrigger || '').trim().slice(0, 200), confidence: /high/i.test(a && a.confidence) ? 'high' : 'medium',
        existing: !!(dom && G.accountByDomain(t, dom)) };
    }).filter(function (a) { if (!a.name || !a.domain || seen[a.domain]) return false; seen[a.domain] = 1; return true; });
    return list.length ? { accounts: list } : null;
  }
  function previewAccounts(c) {
    var t = S.t, icp = G.icpForScoring(t);
    var rows = c.accounts.map(function (a, i) {
      var tmp = G.blankAccount(a.domain, { name: a.name, industry: a.industry, employees: a.employees, country: a.country });
      var sc = icp ? G.scoreAccount(t, tmp, icp) : null;
      return '<tr><td><input type="checkbox" data-pick="a' + i + '"' + (a.existing ? ' disabled' : ' checked') + ' aria-label="Import ' + esc(a.name) + '"></td>' +
        '<td class="name"><b>' + esc(a.name) + '</b><span>' + esc(a.domain) + (a.city ? ' · ' + esc(a.city) : '') + '</span></td>' +
        '<td>' + esc(a.industry || '—') + '</td><td class="num">' + App.num(a.employees) + '</td><td>' + esc(a.country || '—') + '</td>' +
        '<td class="small" style="max-width:260px">' + esc(a.why) + (a.possibleTrigger ? '<br><span class="muted">Possible trigger to verify: ' + esc(a.possibleTrigger) + '</span>' : '') + '</td>' +
        '<td>' + (a.existing ? App.badge('muted', 'Already in list') : sc ? App.stateBadge(G.ACCOUNT_STATES, sc.status) : '') + (a.confidence === 'medium' ? '<br><span class="small faint">medium confidence</span>' : '') + '</td></tr>';
    }).join('');
    var fresh = c.accounts.filter(function (a) { return !a.existing; }).length;
    return '<div class="note warn">' + I('alert') + '<span class="grow"><b>Suggestions, not verified data.</b> GTM Engine suggests these from what its AI already knows, without live web search, so details can be out of date. They\'re imported labelled "unverified". Confirm each company (and find a dated, sourced trigger) before it\'s used in outreach.</span></div>' +
      '<div class="row"><span class="grow small muted">' + App.plural(fresh, 'new company', 'new companies') + ' · status shows how each would score against your ICP right now</span><button type="button" class="btn sm ghost" data-act="pick-all">Select all</button><button type="button" class="btn sm ghost" data-act="pick-none">Select none</button></div>' +
      '<div class="table-wrap" style="border:1px solid var(--line);border-radius:10px;max-height:52vh"><table class="t"><thead><tr><th></th><th>Company</th><th>Industry</th><th class="num">Employees</th><th>Country</th><th>Why it fits</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  function applyAccounts(c, picks) {
    var t = S.t, chosen = c.accounts.filter(function (a, i) { return picks['a' + i] && !a.existing; });
    if (!chosen.length) { App.toast('Tick at least one company to import', 'bad'); return; }
    var rows = chosen.map(function (a) { return { name: a.name, domain: a.domain, industry: a.industry, employees: a.employees == null ? '' : String(a.employees), country: a.country }; });
    var map = { name: 'name', domain: 'domain', industry: 'industry', employees: 'employees', country: 'country' };
    var r = G.importAccounts(t, rows, map, { source: SUGGESTED });
    chosen.forEach(function (a) {
      var acc = G.accountByDomain(t, a.domain);
      if (!acc || acc.importedFrom !== SUGGESTED) return;
      acc.suggested = true;
      acc.notes = ['Suggested by GTM Engine: ' + a.why, a.city ? 'Location: ' + a.city : '', a.possibleTrigger ? 'Possible trigger to verify (find a dated source before using): ' + a.possibleTrigger : ''].filter(Boolean).join('\n');
    });
    G.log(t, 'GTM Engine (suggestion)', 'Suggested accounts imported', r.added + ' added, ' + r.conflicts + ' sent to manual resolution');
    App.save(); S.ui.af = 'all';
    if (S.route === 'accounts') App.render(); else App.go('#/accounts');
    App.toast(App.plural(r.added, 'company', 'companies') + ' added as unverified suggestions' + (r.conflicts ? '; ' + r.conflicts + ' need manual review' : ''));
  }
  A['ai-accounts'] = function () {
    var t = S.t, icp = G.icpForScoring(t);
    if (!icp || !icp.industries.values.length) { App.toast('Set up the ICP first (at least target industries), so suggestions have something to match', 'bad'); App.go('#/icp'); return; }
    var m = App.modal({
      title: 'Suggest accounts with GTM Engine', sub: 'GTM Engine proposes companies that match ICP v' + icp.v + (icp.status !== 'approved' ? ' (draft)' : '') + '. You review the list and choose which to import.',
      body: '<div class="field"><label>How many companies?</label><div class="seg" id="sg-n">' + [10, 25, 50].map(function (n) { return '<button type="button" data-n="' + n + '" class="' + (n === 25 ? 'on' : '') + '">' + n + '</button>'; }).join('') + '</div><input id="sg-custom" type="number" min="1" max="50" placeholder="Or type a number up to 50" style="max-width:240px;margin-top:8px"></div>' +
        '<div class="field"><label for="sg-focus">Anything to focus on? (optional)</label><input id="sg-focus" placeholder="e.g. only Ohio and Indiana, family-owned, food packaging"></div>' +
        '<div class="small muted">Companies already in your list or on the do-not-contact list are skipped. Larger lists take longer (about a minute for 50).</div>',
      onOpen: function (mm) {
        mm.body.querySelectorAll('#sg-n button').forEach(function (b) { b.addEventListener('click', function () { mm.body.querySelectorAll('#sg-n button').forEach(function (x) { x.classList.toggle('on', x === b); }); mm.body.querySelector('#sg-custom').value = ''; }); });
      },
      actions: [{ label: 'Cancel', cls: 'ghost' }, {
        label: 'Suggest companies', cls: 'primary', icon: 'sparkle', onClick: function (mm) {
          var custom = G.toInt(mm.body.querySelector('#sg-custom').value), on = mm.body.querySelector('#sg-n .on');
          var n = Math.max(1, Math.min(50, custom || (on ? +on.getAttribute('data-n') : 25)));
          var focus = mm.body.querySelector('#sg-focus').value.trim();
          setTimeout(function () {
            App.askClaude({ title: 'Suggested accounts', sub: App.plural(n, 'company', 'companies') + ' matching ICP v' + icp.v + (focus ? ' · ' + esc(focus) : ''), basis: 'ICP v' + icp.v + ', offer, existing accounts', prompt: accountsPrompt(t, icp, n, focus), clean: cleanAccounts, preview: previewAccounts, apply: applyAccounts, applyLabel: 'Import selected' });
          });
        }
      }]
    });
    return m;
  };

  A['pick-all'] = function (el) { el.closest('.modal').querySelectorAll('[data-pick]:not(:disabled)').forEach(function (c) { c.checked = true; }); };
  A['pick-none'] = function (el) { el.closest('.modal').querySelectorAll('[data-pick]').forEach(function (c) { c.checked = false; }); };

  /* ================= Find buyers ================= */
  function liSearch(title, company) { return 'https://www.linkedin.com/search/results/people/?keywords=' + encodeURIComponent(title + ' ' + company); }
  /* ================= Suggest contacts ================= */
  var SUGGESTED_C = 'GTM Engine suggestion (unverified)';
  function needBuyers(t, icp) {
    var sc = G.scoreAll(t, icp), order = { eligible: 0, research: 1 };
    return t.accounts.filter(function (a) { var s = sc[a.id].status; return (s === 'eligible' || s === 'research') && !t.contacts.some(function (c) { return c.accountId === a.id && G.contactState(t, c, icp) === 'ready'; }); })
      .sort(function (a, b) { return order[sc[a.id].status] - order[sc[b.id].status] || sc[b.id].known - sc[a.id].known; });
  }
  function contactsPrompt(t, icp, accs, per) {
    return 'You are a B2B research assistant helping find the right buyers at target companies for ' + (t.profile.name || 'the client') + ', which sells: ' + (t.profile.offer || 'see personas') + '.\n\n' +
      'Buyer personas (in priority order):\n' + icp.personas.slice().sort(function (a, b) { return (a.priority === 'primary' ? 0 : 1) - (b.priority === 'primary' ? 0 : 1); }).map(function (p) { return '- ' + p.name + ' (' + p.priority + '): titles like ' + p.titles.join(', '); }).join('\n') +
      '\n\nCompanies:\n' + accs.map(function (a) { return '- ' + a.name + ' (' + a.domain + (a.country ? ', ' + a.country : '') + ')'; }).join('\n') +
      '\n\nFor each company, name up to ' + per + ' people who you are confident currently or very recently held a matching role there, based on public business information (company leadership pages, press releases, news). Prefer the primary persona. If you are not confident about a specific person at a company, do not guess a name: skip that company. Never include email addresses or phone numbers.' +
      '\n\nReply with ONLY a JSON object:\n{"contacts":[{"domain":"company domain from the list","name":"Full Name","title":"their job title","basis":"where this is publicly stated, e.g. company leadership page or a 2025 press release","confidence":"high or medium"}]}';
  }
  function cleanContacts(d, accs) {
    var t = S.t, seen = {}, byDom = {}, byName = {}, unmatched = 0, noName = 0;
    function nk(x) { return String(x || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\b(inc|llc|ltd|co|corp|corporation|company|the)\b/g, '').trim(); }
    accs.forEach(function (a) { byDom[a.domain] = a; byName[nk(a.name)] = a; });
    // Accept {contacts:[...]}, a bare array, other key names, or people nested under each company.
    var raw = Array.isArray(d) ? d : d && (d.contacts || d.people || d.results || d.buyers || d.companies) || [];
    var flat = [];
    (Array.isArray(raw) ? raw : []).forEach(function (x) {
      if (!x || typeof x !== 'object') return;
      var nested = x.contacts || x.people || x.buyers;
      if (Array.isArray(nested)) nested.forEach(function (p) { flat.push(Object.assign({ domain: x.domain || x.website, company: x.company || x.name }, p)); });
      else flat.push(x);
    });
    var list = flat.map(function (c) {
      var dom = G.normDomain(c.domain || c.website || c.companyDomain || c.company_domain);
      var a = (dom && (byDom[dom] || G.accountByDomain(t, dom))) || byName[nk(c.company || c.companyName || c.company_name || c.account)] || null;
      var name = String(c.name || c.fullName || c.full_name || [c.firstName || c.first_name, c.lastName || c.last_name].filter(Boolean).join(' ') || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      return { account: a, name: name, title: String(c.title || c.role || c.jobTitle || '').trim().slice(0, 120), basis: String(c.basis || c.source || '').trim().slice(0, 200), confidence: /high/i.test(c.confidence) ? 'high' : 'medium' };
    }).filter(function (c) {
      if (!c.account) { unmatched++; return false; }
      if (!c.name || !/\s/.test(c.name)) { noName++; return false; }
      var k = c.account.id + '|' + c.name.toLowerCase(); if (seen[k]) return false; seen[k] = 1;
      c.existing = t.contacts.some(function (x) { return x.accountId === c.account.id && x.name.toLowerCase() === c.name.toLowerCase(); });
      return true;
    });
    if (list.length) return { contacts: list };
    var why = flat.length ? ' It named ' + App.plural(flat.length, 'person', 'people') + ', but ' + (unmatched ? App.plural(unmatched, 'didn\'t match', 'didn\'t match') + ' a company in your list' : '') + (unmatched && noName ? ' and ' : '') + (noName ? noName + ' had no full name' : '') + '.' : '';
    return {
      empty: true,
      message: '<b>GTM Engine couldn\'t confidently name anyone at these companies.</b> That\'s normal for smaller and private companies, where leadership isn\'t widely published, and it\'s better than guessing.' + esc(why) +
        '<br><br>Next: use <b>Find buyers</b> for one-click LinkedIn searches by title at each company, then add the people you find. Or try fewer, larger companies.',
      actions: [{ label: 'Open Find buyers', cls: 'ghost', icon: 'search', onClick: function () { setTimeout(function () { A['find-buyers'](); }); } }]
    };
  }
  function previewContacts(c) {
    var t = S.t, icp = G.icpForScoring(t);
    var rows = c.contacts.map(function (x, i) {
      var ids = G.matchPersonas(x.title, icp.personas), per = ids.length === 1 ? icp.personas.find(function (p) { return p.id === ids[0]; }) : null;
      return '<tr><td><input type="checkbox" data-pick="c' + i + '"' + (x.existing ? ' disabled' : ' checked') + ' aria-label="Add ' + esc(x.name) + '"></td>' +
        '<td class="name"><b>' + esc(x.name) + '</b><span>' + esc(x.title) + '</span></td><td>' + esc(x.account.name) + '</td>' +
        '<td>' + (x.existing ? App.badge('muted', 'Already added') : per ? App.badge('ok', per.name) : ids.length ? App.badge('warn', 'Ambiguous') : App.badge('muted', 'No persona match')) + (x.confidence === 'medium' ? '<br><span class="small faint">medium confidence</span>' : '') + '</td>' +
        '<td class="small" style="max-width:220px">' + esc(x.basis || '—') + '</td>' +
        '<td><a class="chip" target="_blank" rel="noopener" href="' + esc(liSearch(x.name, x.account.name)) + '">' + I('search') + 'Verify on LinkedIn</a></td></tr>';
    }).join('');
    return '<div class="note warn">' + I('alert') + '<span class="grow"><b>Names to verify, not confirmed contacts.</b> GTM Engine suggests people from public business information it already knows, without live search, so someone may have changed roles. No emails are suggested: these are added as "Missing email" until you find and verify one.</span></div>' +
      '<div class="row"><span class="grow small muted">' + App.plural(c.contacts.filter(function (x) { return !x.existing; }).length, 'person', 'people') + ' suggested</span><button type="button" class="btn sm ghost" data-act="pick-all">Select all</button><button type="button" class="btn sm ghost" data-act="pick-none">Select none</button></div>' +
      '<div class="table-wrap" style="border:1px solid var(--line);border-radius:10px;max-height:52vh"><table class="t"><thead><tr><th></th><th>Person</th><th>Company</th><th>Persona</th><th>Publicly stated in</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  function applyContacts(c, picks) {
    var t = S.t, chosen = c.contacts.filter(function (x, i) { return picks['c' + i] && !x.existing; });
    if (!chosen.length) { App.toast('Tick at least one person to add', 'bad'); return; }
    var rows = chosen.map(function (x) { return { fullName: x.name, title: x.title, email: '', companyDomain: x.account.domain, verification: '', provider: SUGGESTED_C }; });
    var map = { fullName: 'fullName', title: 'title', email: 'email', companyDomain: 'companyDomain', verification: 'verification', provider: 'provider' };
    var r = G.importContacts(t, rows, map, { provider: SUGGESTED_C });
    chosen.forEach(function (x) {
      var ct = t.contacts.find(function (y) { return y.accountId === x.account.id && y.name.toLowerCase() === x.name.toLowerCase(); });
      if (ct) { ct.suggested = true; ct.note = 'Suggested by GTM Engine' + (x.basis ? ' (' + x.basis + ')' : '') + '. Verify the role and find a work email.'; ct.linkedinSearch = liSearch(x.name, x.account.name); }
    });
    G.log(t, 'GTM Engine (suggestion)', 'Suggested contacts added', r.added + ' added, names only');
    App.save(); S.ui.cf = 'all';
    if (S.route === 'contacts') App.render(); else App.go('#/contacts');
    App.toast(App.plural(r.added, 'person', 'people') + ' added as "Missing email". Verify each and add their work email.');
  }
  A['ai-contacts'] = function () {
    var t = S.t, icp = G.icpForScoring(t);
    if (!icp || !icp.personas.length) { App.toast('Add buyer personas to the ICP first', 'bad'); App.go('#/icp'); return; }
    var accs = needBuyers(t, icp).sort(function (a, b) { return (a.contactsSuggestedAt ? 1 : 0) - (b.contactsSuggestedAt ? 1 : 0); });
    var untried = accs.filter(function (a) { return !a.contactsSuggestedAt; }).length;
    if (!accs.length) { App.toast(t.accounts.length ? 'Every fitting account already has a ready buyer' : 'Add or suggest accounts first', 'bad'); if (!t.accounts.length) App.go('#/accounts'); return; }
    App.modal({
      title: 'Suggest contacts with GTM Engine', sub: 'Suggests named buyers at accounts that fit (or nearly fit) and don\'t have a ready contact yet. ' + App.plural(accs.length, 'account') + ' qualify' + (untried < accs.length ? ', ' + untried + ' not tried yet (those go first)' : '') + '.',
      body: '<div class="field"><label>How many accounts?</label><div class="seg" id="sc-a">' + [5, 10, 25].filter(function (n) { return n < accs.length; }).concat([accs.length]).map(function (n, i, arr) { var def = Math.min(10, accs.length), on = n === def || (i === arr.length - 1 && arr.indexOf(def) < 0); return '<button type="button" data-n="' + n + '" class="' + (on ? 'on' : '') + '">' + (i === arr.length - 1 ? 'All ' + n : n) + '</button>'; }).join('') + '</div><span class="hint">Best-fitting accounts first. Up to 15 are sent per request; run it again for the next ones.</span></div>' +
        '<div class="field"><label>People per account</label><div class="seg" id="sc-p">' + [1, 2, 3].map(function (n) { return '<button type="button" data-n="' + n + '" class="' + (n === 2 ? 'on' : '') + '">' + n + '</button>'; }).join('') + '</div></div>' +
        '<div class="small muted">Names and titles only. GTM Engine never guesses email addresses.</div>',
      onOpen: function (mm) {
        ['#sc-a', '#sc-p'].forEach(function (id) { mm.body.querySelectorAll(id + ' button').forEach(function (b) { b.addEventListener('click', function () { mm.body.querySelectorAll(id + ' button').forEach(function (x) { x.classList.toggle('on', x === b); }); }); }); });
      },
      actions: [{ label: 'Cancel', cls: 'ghost' }, {
        label: 'Suggest contacts', cls: 'primary', icon: 'sparkle', onClick: function (mm) {
          var na = +(mm.body.querySelector('#sc-a .on') || {}).getAttribute('data-n') || 10, per = +(mm.body.querySelector('#sc-p .on') || {}).getAttribute('data-n') || 2;
          var pick = accs.slice(0, Math.min(na, 15));
          pick.forEach(function (a) { a.contactsSuggestedAt = G.now(); }); App.save();
          setTimeout(function () {
            App.askClaude({ title: 'Suggested contacts', sub: 'Up to ' + per + ' per account at ' + App.plural(pick.length, 'account'), basis: 'ICP personas and ' + App.plural(pick.length, 'account'), prompt: contactsPrompt(t, icp, pick, per), clean: function (d) { return cleanContacts(d, pick); }, preview: previewContacts, apply: applyContacts, applyLabel: 'Add selected' });
          });
        }
      }]
    });
  };

  A['find-buyers'] = function () {
    var t = S.t, icp = G.icpForScoring(t);
    if (!icp || !icp.personas.length) { App.toast('Add buyer personas to the ICP first', 'bad'); App.go('#/icp'); return; }
    var sc = G.scoreAll(t, icp), order = { eligible: 0, research: 1 };
    var accs = t.accounts.filter(function (a) { var s = sc[a.id].status; return (s === 'eligible' || s === 'research') && !t.contacts.some(function (c) { return c.accountId === a.id && G.contactState(t, c, icp) === 'ready'; }); })
      .sort(function (a, b) { return order[sc[a.id].status] - order[sc[b.id].status] || sc[b.id].known - sc[a.id].known; });
    var prim = icp.personas.filter(function (p) { return p.priority === 'primary'; }).concat(icp.personas.filter(function (p) { return p.priority !== 'primary'; }));
    App.modal({
      title: 'Find buyers', wide: true,
      sub: 'Accounts that fit (or nearly fit) and still have no ready contact. Search LinkedIn for the persona titles, then add the person here. Connect Databar later to pull verified emails automatically.',
      body: accs.length ? '<div class="stack sm" style="max-height:60vh;overflow:auto">' + accs.slice(0, 60).map(function (a) {
        var s = sc[a.id];
        return '<div class="persona" style="gap:8px"><div class="row"><b class="grow">' + esc(a.name) + ' <span class="small muted">' + esc(a.domain) + '</span></b>' + App.stateBadge(G.ACCOUNT_STATES, s.status) + '<button type="button" class="btn sm primary" data-act="contact-add" data-acc="' + a.id + '">' + I('plus') + 'Add contact</button></div>' +
          '<div class="row tight small">' + prim.map(function (p) { return '<span class="muted">' + esc(p.name) + ':</span> ' + p.titles.slice(0, 4).map(function (ti) { return '<a href="' + esc(liSearch(ti, a.name)) + '" target="_blank" rel="noopener" class="chip">' + I('search') + esc(ti) + '</a>'; }).join(' '); }).join('<span class="muted">·</span>') + '</div></div>';
      }).join('') + '</div>' + (accs.length > 60 ? '<div class="small muted">Showing the first 60 by fit.</div>' : '')
        : '<div class="empty"><div class="art">' + I('check') + '</div><h2>Every fitting account has a buyer</h2><p>Import or suggest more accounts to keep going.</p></div>',
      actions: accs.length ? [{ label: 'Suggest names with GTM Engine', cls: 'ghost', icon: 'sparkle', onClick: function () { setTimeout(function () { A['ai-contacts'](); }); } }, { label: 'Done' }] : [{ label: 'Done' }]
    });
  };
  A['contact-add'] = function (el) {
    var t = S.t, a = G.accountById(t, el.getAttribute('data-acc')), icp = G.icpForScoring(t);
    App.modal({
      title: 'Add a contact at ' + a.name, sub: 'For someone you found on LinkedIn, the company site or a referral.',
      body: '<div class="fields"><div class="field"><label for="ca-n">Full name</label><input id="ca-n" autofocus></div><div class="field"><label for="ca-t">Job title</label><input id="ca-t" placeholder="As shown on their profile"></div>' +
        '<div class="field"><label for="ca-e">Work email</label><input id="ca-e" type="email" placeholder="name@' + esc(a.domain) + '"></div>' +
        '<div class="field"><label for="ca-v">Email status</label><select id="ca-v"><option value="">Not verified yet</option><option value="valid">Verified valid</option><option value="catch-all">Catch-all / risky</option><option value="invalid">Invalid</option></select></div>' +
        '<div class="field full"><label for="ca-l">LinkedIn URL (optional)</label><input id="ca-l" type="url" placeholder="https://www.linkedin.com/in/…"></div></div>' +
        (icp ? '<div class="small muted" id="ca-p">Type a title to see which persona it matches.</div>' : ''),
      onOpen: function (m) {
        var ti = m.body.querySelector('#ca-t'), out = m.body.querySelector('#ca-p');
        if (out) ti.addEventListener('input', function () {
          var ids = G.matchPersonas(ti.value, icp.personas);
          out.innerHTML = !ti.value ? 'Type a title to see which persona it matches.' : ids.length === 1 ? App.badge('ok', 'Matches ' + icp.personas.find(function (p) { return p.id === ids[0]; }).name) : ids.length ? App.badge('warn', 'Matches more than one persona; you\'ll pick one in Contacts') : App.badge('muted', 'No persona match');
        });
      },
      actions: [{ label: 'Cancel', cls: 'ghost' }, {
        label: 'Add contact', cls: 'primary', onClick: function (m) {
          var b = m.body, name = b.querySelector('#ca-n').value.trim(), email = b.querySelector('#ca-e').value.trim();
          if (!name) { App.toast('Enter the person\'s name', 'bad'); return false; }
          if (email && !G.normEmail(email)) { App.toast('That email address doesn\'t look right', 'bad'); return false; }
          var row = { fullName: name, title: b.querySelector('#ca-t').value.trim(), email: email, companyDomain: a.domain, verification: b.querySelector('#ca-v').value, provider: 'Manual research', linkedin: b.querySelector('#ca-l').value.trim() };
          var map = {}; Object.keys(row).forEach(function (k) { map[k] = k; });
          var r = G.importContacts(t, [row], map, { provider: 'Manual research' });
          G.log(t, 'Operator', 'Added contact manually', name + ' at ' + a.name);
          App.save(); App.rerender();
          App.toast(r.added ? name + ' added' : r.updated ? name + ' updated (already existed)' : 'No change');
        }
      }]
    });
  };

  /* ================= Test data ================= */
  // Fills a workspace with obviously fake contacts and placeholder buying signals so the rest of the flow
  // (batches, approval, export, outcomes) can be tried. Test emails use the reserved example.invalid domain,
  // so nothing can ever reach a real inbox. Everything is flagged and removable in one click.
  App.hasTestData = function (t) { return t.contacts.some(function (c) { return c.test; }) || t.accounts.some(function (a) { return a.testTrigger; }); };
  function personaTitle(icp) {
    var ps = icp.personas.slice().sort(function (a, b) { return (a.priority === 'primary' ? 0 : 1) - (b.priority === 'primary' ? 0 : 1); });
    for (var i = 0; i < ps.length; i++) for (var j = 0; j < ps[i].titles.length; j++) if (G.matchPersonas(ps[i].titles[j], icp.personas).length === 1) return ps[i].titles[j];
    return ps.length && ps[0].titles[0] || 'Head of Operations';
  }
  A['test-data'] = function () {
    var t = S.t, icp = G.icpForScoring(t);
    if (!icp || !icp.personas.length) { App.toast('Set up the ICP with at least one buyer persona first', 'bad'); App.go('#/icp'); return; }
    if (!t.accounts.length) { App.toast('Add some accounts first (Suggest accounts works well)', 'bad'); App.go('#/accounts'); return; }
    var sc = G.scoreAll(t, icp);
    var usable = t.accounts.filter(function (a) { return sc[a.id].status !== 'excluded'; });
    var noTrigger = usable.filter(function (a) { return !(a.trigger.text && a.trigger.date && a.trigger.url); }).length;
    var noBuyer = usable.filter(function (a) { return !t.contacts.some(function (c) { return c.accountId === a.id && G.contactState(t, c, icp) === 'ready'; }); }).length;
    App.modal({
      title: 'Fill with test data', sub: 'For trying out the flow. Nothing here is real, and nothing can be sent to a real person.',
      body: '<div class="note info">' + I('shield') + '<span class="grow">Test contacts are named "Test Buyer 1, 2, 3…" with addresses at <b>example.invalid</b>, a domain reserved so email can never be delivered. Everything is marked as test data, and you can remove it all in one click from the banner or Settings.</span></div>' +
        '<label class="check"><input type="checkbox" id="td-c" checked> Add a test contact at each company without a ready buyer (' + Math.min(noBuyer, 50) + ')</label>' +
        '<label class="check"><input type="checkbox" id="td-t"' + (noTrigger ? ' checked' : '') + '> Add a placeholder buying signal to companies missing one (' + noTrigger + '), so they can become Eligible</label>' +
        '<div class="small muted">Companies that are excluded (customers, open deals, wrong country or industry) are left alone.</div>',
      actions: [{ label: 'Cancel', cls: 'ghost' }, {
        label: 'Fill with test data', cls: 'primary', icon: 'flag', onClick: function (m) {
          var doC = m.body.querySelector('#td-c').checked, doT = m.body.querySelector('#td-t').checked, title = personaTitle(icp);
          var kw = icp.triggers.keywords[0] || 'growth', nT = 0, nC = 0, n = t.contacts.filter(function (c) { return c.test; }).length;
          if (doT) usable.forEach(function (a) {
            if (a.trigger.text && a.trigger.date && a.trigger.url) return;
            a.trigger = { text: 'shows a test signal (' + kw + ')', date: G.now(), url: 'https://example.invalid/gtm-engine-test-signal' }; a.testTrigger = true; nT++;
          });
          if (doC) usable.filter(function (a) { return !t.contacts.some(function (c) { return c.accountId === a.id && G.contactState(t, c, icp) === 'ready'; }); }).slice(0, 50).forEach(function (a) {
            n++; nC++;
            t.contacts.push({ id: G.uid('ct'), accountId: a.id, createdAt: G.now(), personaId: null, history: [], name: 'Test Buyer ' + n, firstName: 'Test', lastName: 'Buyer ' + n, title: title,
              email: 'test.buyer' + n + '.' + a.domain.replace(/[^a-z0-9]+/g, '-') + '@example.invalid', verification: 'valid', provider: 'Test data', retrievedAt: G.now(), linkedin: '', crmId: '', employmentConfirmed: true, test: true });
          });
          G.log(t, 'Operator', 'Added test data', nC + ' test contacts, ' + nT + ' placeholder signals');
          App.save();
          var am = G.accountMetrics(t), still = am.counts.research;
          App.render();
          App.modal({ title: 'Test data added', body: App.resultTiles([['Test contacts', nC], ['Placeholder signals', nT], ['Companies ready', am.counts.eligible], ['People ready', t.contacts.filter(function (c) { return G.contactState(t, c, icp) === 'ready'; }).length]]) +
            (still ? '<div class="note warn">' + I('info') + '<span class="grow">' + App.plural(still, 'company still needs', 'companies still need') + ' research for another reason, such as an unknown employee count or a country outside the ICP. Click one on the Accounts page to see what.</span></div>' : '') +
            '<div class="small">Next: open <b>Campaigns</b>, create or open a campaign, and click <b>Draft next batch</b>.</div>',
            actions: [{ label: 'Close', cls: 'ghost' }, { label: 'Go to Campaigns', cls: 'primary', onClick: function () { App.go('#/campaigns'); } }] });
        }
      }]
    });
  };
  A['test-remove'] = function () {
    var t = S.t, ids = t.contacts.filter(function (c) { return c.test; }).map(function (c) { return c.id; });
    var trig = t.accounts.filter(function (a) { return a.testTrigger; });
    App.confirm({ title: 'Remove all test data?', body: '<p>Removes ' + App.plural(ids.length, 'test contact') + ', ' + App.plural(trig.length, 'placeholder buying signal') + ', and anything recorded for test contacts (batch rows, enrollments, events, replies). Real data is untouched.</p>', ok: 'Remove test data', danger: true }).then(function (ok) {
      if (!ok) return;
      var gone = {}; ids.forEach(function (id) { gone[id] = 1; });
      t.contacts = t.contacts.filter(function (c) { return !gone[c.id]; });
      trig.forEach(function (a) { a.trigger = { text: '', date: '', url: '' }; delete a.testTrigger; });
      t.batches.forEach(function (b) {
        var before = b.rows.length;
        b.rows = b.rows.filter(function (r) { return !gone[r.contactId]; });
        if (b.rows.length !== before) { b.history.push({ at: G.now(), what: 'Test contacts removed' }); if (b.approval) b.approval = null; }
        if (!b.rows.length) b.archived = true;
      });
      t.enrollments = t.enrollments.filter(function (e) { return !gone[e.contactId]; });
      t.events = t.events.filter(function (e) { return !gone[e.contactId]; });
      t.tasks = t.tasks.filter(function (k) { return !gone[k.contactId]; });
      G.log(t, 'Operator', 'Removed test data', ids.length + ' contacts, ' + trig.length + ' signals');
      App.save(); App.render(); App.toast('Test data removed');
    });
  };
})();
