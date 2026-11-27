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
      actions: [{ label: 'Done' }]
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
})();
