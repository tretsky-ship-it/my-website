/* Screens: welcome, client home, setup (intake), evidence & proof, ICP editor. */
(function () {
  'use strict';
  var G = window.GTM, App = window.App, S = App.S, esc = App.esc, I = App.icon, V = App.views, A = App.act;

  /* ================= Welcome (blank template, no clients yet) ================= */
  V.welcome = {
    title: 'Welcome',
    render: function () {
      var steps = [['Set up', 'Offer, owners, budget, CRM'], ['Evidence', 'Deck, calls, won/lost, proof'], ['ICP', 'Sourced criteria, approved'], ['Accounts', 'Import, dedupe, score'], ['Contacts', 'Buyers matched to personas'], ['Campaign', 'Cited drafts, approved batch'], ['Outcomes', 'Replies, meetings, deals'], ['Weekly brief', 'Funnel, spend, next test']];
      return '<div class="welcome"><div class="welcome-in">' +
        '<div class="hero"><span class="brand-mark" style="width:52px;height:52px;border-radius:14px;color:#fff">' + I('icp') + '</span><h1>GTM Engine</h1>' +
        '<p>One shared, approved record of whom to target, what to say and what happened next, for each client. Work through eight guided steps from intake to a reconciled weekly brief.</p></div>' +
        '<div class="choices"><div class="card choice"><h2>Set up your first client</h2><p class="muted">Each client gets its own isolated workspace that starts empty: no ICP, prospects, campaigns or connections.</p>' +
        '<div class="row"><input id="wc-name" placeholder="Client name, e.g. Acme Robotics" aria-label="Client name" class="grow" onkeydown="if(event.key===\'Enter\'){App.act[\'welcome-create\']()}"><button class="btn primary" data-act="welcome-create">Create workspace ' + I('arrow') + '</button></div></div>' +
        '<div class="card choice"><h2>Explore with sample data</h2><p class="muted">A fictional client with an approved ICP, scored accounts, a staged batch, replies and a booked meeting.</p><div><button class="btn" data-act="load-sample">' + I('sparkle') + 'Open the sample client</button></div></div></div>' +
        '<div class="flow">' + steps.map(function (s, i) { return '<div><span class="n">' + (i + 1) + '</span><b>' + s[0] + '</b>' + s[1] + '</div>'; }).join('') + '</div>' +
        '<p class="small muted" style="text-align:center">Data stays in this browser. Nothing is sent anywhere until you export a file.</p>' +
        '</div></div>';
    }
  };

  /* ================= Home ================= */
  V.home = {
    title: 'Home',
    header: function () { return { title: 'Home' }; },
    render: function () {
      var t = S.t, steps = App.steps(t), next = steps.find(function (s) { return !s.done; });
      var att = App.attention(t), am = G.accountMetrics(t), m = G.metrics(t), icp = G.activeICP(t);
      var blocked = att.find(function (a) { return a.tone === 'bad' && a.route === 'campaigns'; }) || att.find(function (a) { return a.route === 'campaigns'; });
      var hero;
      if (blocked) hero = { eyebrow: 'Resume the highest-priority batch', title: blocked.title, body: blocked.sub, href: blocked.href, cta: 'Open batch', icon: 'campaign' };
      else if (next) hero = { eyebrow: 'Next step · ' + (steps.indexOf(next) + 1) + ' of 8', title: next.title, body: next.body, href: '#/' + next.id, cta: next.cta, icon: 'arrow' };
      else hero = { eyebrow: 'Pilot loop complete', title: 'Run the next test', body: 'Every step has been completed at least once. Review the weekly brief and assign the next test.', href: '#/brief', cta: 'Open weekly brief', icon: 'check' };
      var spent = t.costs.filter(function (c) { return !c.estimated && c.amount != null; }).reduce(function (s, c) { return s + c.amount; }, 0);
      var pending = t.costs.filter(function (c) { return c.estimated && !c.superseded && c.amount != null; }).reduce(function (s, c) { return s + c.amount; }, 0);
      var budget = t.profile.budget;
      var enrolled = t.enrollments.filter(function (e) { return e.state === 'enrolled'; }).length;
      var readyContacts = t.contacts.filter(function (c) { return G.contactState(t, c) === 'ready'; }).length;
      var firstTodo = next ? next.id : null;

      return '<div class="stack">' +
        '<div class="next"><span class="ico">' + I(hero.icon) + '</span><div><div class="eyebrow">' + esc(hero.eyebrow) + '</div><h2>' + esc(hero.title) + '</h2><p>' + esc(hero.body) + '</p></div><a class="btn primary lg" href="' + hero.href + '">' + esc(hero.cta) + I('arrow') + '</a></div>' +
        '<div class="card"><div class="card-b"><div class="stepper">' + steps.map(function (s, i) {
          return '<a href="#/' + s.id + '" class="' + (s.done ? 'done' : s.id === firstTodo ? 'cur' : '') + '"><span class="dot">' + (s.done ? '✓' : i + 1) + '</span>' + esc(s.label) + '</a>';
        }).join('') + '</div></div></div>' +
        '<div class="kpis">' +
          kpi('#/icp', 'Active ICP', icp ? 'v' + icp.v : '—', icp ? 'Approved ' + App.rel(icp.approvedAt) : 'Not approved yet') +
          kpi('#/accounts', 'Eligible accounts', am.counts.eligible, am.total ? am.counts.research + ' need research · ' + am.counts.excluded + ' excluded' : 'No accounts yet') +
          kpi('#/contacts', 'Ready contacts', readyContacts, t.contacts.length ? App.plural(t.contacts.length - readyContacts, 'contact') + ' need review' : 'No contacts yet') +
          kpi('#/campaigns', 'Enrolled', enrolled, t.batches.length ? App.plural(t.batches.length, 'batch', 'batches') : 'No campaign data yet') +
          kpi('#/brief', 'Positive replies', m.positive, m.delivered ? App.pct(m.rates.positive) + ' of ' + m.delivered + ' delivered' : 'No campaign data yet') +
          kpi('#/brief', 'Held meetings', m.held, m.booked ? m.booked + ' booked' : 'No campaign data yet') +
          kpi('#/brief', 'Sourced pipeline', m.opportunities ? App.money(m.pipeline) : '—', m.opportunities ? App.plural(m.opportunities, 'opportunity', 'opportunities') : 'No campaign data yet') +
        '</div>' +
        '<div class="grid2">' +
          '<div class="card"><div class="card-h"><h2>Decisions due</h2><span class="badge ' + (att.length ? 'warn' : 'ok') + '">' + att.length + '</span></div>' +
            (att.length ? '<div class="list">' + att.slice(0, 8).map(function (a) { return '<a class="li" href="' + a.href + '"><span class="lico ' + a.tone + '">' + I(a.icon) + '</span><span class="grow"><b>' + esc(a.title) + '</b><span>' + esc(a.sub) + '</span></span>' + I('arrow') + '</a>'; }).join('') + '</div>'
              : '<div class="empty"><div class="art">' + I('check') + '</div><h2>Nothing is waiting on you</h2><p>Approvals, conflicts, overdue replies and unmatched events show up here.</p></div>') + '</div>' +
          '<div class="stack">' +
            '<div class="card"><div class="card-h"><h2>Budget</h2><a class="btn sm ghost" href="#/activity">Details</a></div><div class="card-b">' +
              (budget ? '<div class="row" style="justify-content:space-between;margin-bottom:8px"><b style="font-size:20px">' + App.money(Math.max(0, budget - spent - pending)) + '</b><span class="muted small">remaining of ' + App.money(budget) + '</span></div>' +
                '<div class="meter"><span class="a" style="width:' + Math.min(100, spent / budget * 100) + '%"></span><span class="b" style="width:' + Math.min(100, pending / budget * 100) + '%"></span></div>' +
                '<div class="legend"><span><i style="background:var(--accent)"></i>Actual ' + App.money(spent) + '</span><span><i style="background:var(--accent-line)"></i>Approved, pending ' + App.money(pending) + '</span></div>'
                : '<p class="muted">No pilot budget set. <a href="#/setup">Add one</a> so optional enrichment stops at the client cap.</p>') +
            '</div></div>' +
            '<div class="card"><div class="card-h"><h2>Recent activity</h2><a class="btn sm ghost" href="#/activity">All</a></div><div class="list">' +
              (t.audit.length ? t.audit.slice(0, 5).map(function (a) { return '<div class="li"><span class="grow"><b>' + esc(a.action) + '</b><span>' + esc(a.who) + ' · ' + App.rel(a.at) + (a.detail ? ' · ' + esc(a.detail) : '') + '</span></span></div>'; }).join('') : '<div class="li muted">No activity yet.</div>') +
            '</div></div>' +
          '</div>' +
        '</div></div>';
      function kpi(href, k, v, s) { return '<a class="kpi" href="' + href + '"><span class="k">' + esc(k) + '</span><span class="v">' + esc(v) + '</span><span class="s">' + esc(s) + '</span></a>'; }
    }
  };

  /* ================= Setup / intake ================= */
  V.setup = {
    title: 'Client setup',
    header: function () { return { title: 'Client setup', actions: '<a class="btn primary" href="#/evidence">Next: evidence ' + I('arrow') + '</a>' }; },
    render: function () {
      var t = S.t, p = 'profile.';
      function f(label, path, o) { o = o || {}; return '<div class="field' + (o.full ? ' full' : '') + '"><label for="f-' + path + '">' + esc(label) + '</label>' + (o.text ? App.bindText(p + path, { id: 'f-' + path, refresh: 'intake', rows: 3, placeholder: o.placeholder }) : o.select ? App.bindSelect(p + path, o.select, { id: 'f-' + path, refresh: 'intake' }) : App.bindInput(p + path, { id: 'f-' + path, refresh: 'intake', type: o.type, placeholder: o.placeholder })) + (o.hint ? '<span class="hint">' + o.hint + '</span>' : '') + '</div>'; }
      var ch = ['Email', 'Calling', 'LinkedIn', 'Newsletter'];
      return '<div class="split"><div class="stack">' +
        card('Client and offer', 'What is being sold, to whom, where.',
          '<div class="fields">' + f('Client name', 'name', { placeholder: 'Acme Robotics' }) + f('Website', 'website', { placeholder: 'acme.com' }) +
          f('Offer being sold', 'offer', { full: true, placeholder: 'e.g. Predictive maintenance for packaging lines' }) +
          f('Target geography', 'geography', { placeholder: 'United States and Canada' }) + f('CRM', 'crm', { select: ['HubSpot', 'Salesforce', 'Pipedrive', 'None yet'] }) +
          f('Notes from discovery', 'notes', { full: true, text: true, placeholder: 'Constraints, sensitivities, pilot scope' }) + '</div>') +
        card('Ownership and approvals', 'Every approval records the person, time, client, version and decision.',
          '<div class="fields">' + f('Outreach owner', 'outreachOwner', { placeholder: 'Who runs the campaigns', hint: 'Default owner for replies with no CRM owner.' }) +
          f('Authorised approver', 'approver', { placeholder: 'Named by the client', hint: 'The person allowed to approve audiences and copy.' }) + '</div>') +
        card('Budget and costs', 'Optional enrichment stops at the client cap.',
          '<div class="fields three">' + f('Pilot budget (USD)', 'budget', { type: 'num', placeholder: '1500' }) + f('Credits per account', 'creditsPerAccount', { type: 'num', placeholder: '6', hint: 'Used to estimate spend before you approve it.' }) +
          f('Cost per credit (USD)', 'costPerCredit', { type: 'num', placeholder: '0.12' }) + '</div>') +
        card('Channels and sending', 'Smartlead is the proposed email sender; LinkedIn follows the email pilot.',
          '<div class="stack sm"><div class="label">Connected channels</div><div class="row">' + ch.map(function (c) {
            var on = (t.profile.channels || []).indexOf(c) > -1;
            return '<label class="check"><input type="checkbox" data-channel value="' + c + '"' + (on ? ' checked' : '') + '>' + c + (c === 'LinkedIn' ? ' <span class="badge muted plain">later</span>' : '') + '</label>';
          }).join('') + '</div></div><div class="fields" style="margin-top:14px">' + f('Sending mailbox', 'sender', { placeholder: 'name@client.com' }) + f('Reply response target (hours)', 'responseTargetHours', { type: 'num', placeholder: '24' }) + '</div>') +
        card('Suppression policy', 'Applied at import and rechecked immediately before every export.',
          '<div class="stack sm">' + App.bindSwitch(p + 'suppressCustomers', 'Suppress existing customers', { refresh: 'intake' }) + App.bindSwitch(p + 'suppressOpenOpps', 'Suppress accounts with an active opportunity') +
          '<div class="label" style="margin-top:10px">Do-not-contact list</div><div class="row"><input id="sup-in" placeholder="email@domain.com or domain.com" class="grow" aria-label="Email or domain to suppress"><input id="sup-why" placeholder="Reason" style="max-width:200px" aria-label="Reason"><button class="btn" data-act="sup-add">' + I('plus') + 'Add</button></div>' +
          '<div id="sup-list">' + supList(t) + '</div></div>') +
        '</div><div class="sticky stack"><div class="card"><div class="card-h"><h2>Intake checklist</h2></div><div class="card-b" id="intake"></div></div>' +
        '<div class="card"><div class="card-b small muted">' + I('shield') + ' <b>This workspace is isolated.</b> Its records, approvals, costs and exports are stored separately from every other client.</div></div></div></div>';
      function card(h, sub, body) { return '<div class="card"><div class="card-h"><h2>' + h + '<span class="sub">' + sub + '</span></h2></div><div class="card-b">' + body + '</div></div>'; }
    },
    mounted: function () { App.refresh('intake'); }
  };
  function supList(t) {
    if (!t.suppression.length) return '<p class="small muted" style="margin-top:8px">No manual suppressions. Opt-outs and hard bounces are added here automatically.</p>';
    return '<div class="table-wrap" style="margin-top:8px"><table class="t"><thead><tr><th>Email or domain</th><th>Reason</th><th>Source</th><th>Added</th><th></th></tr></thead><tbody>' +
      t.suppression.map(function (s, i) { return '<tr><td class="mono">' + esc(s.value) + '</td><td>' + esc(s.reason) + '</td><td class="small muted">' + esc(s.source) + '</td><td class="small">' + App.fmtDate(s.addedAt) + '</td><td class="right"><button class="btn sm ghost" data-act="sup-rm" data-i="' + i + '" aria-label="Remove">' + I('trash') + '</button></td></tr>'; }).join('') + '</tbody></table></div>';
  }
  App.refreshers.intake = function () {
    var el = document.getElementById('intake'); if (!el) return;
    var t = S.t, miss = G.intakeMissing(t), all = G.INTAKE.concat([{ path: 'sources', label: 'At least one client source' }]);
    var done = all.length - miss.length;
    el.innerHTML = '<div class="row" style="justify-content:space-between;margin-bottom:8px"><b>' + done + ' of ' + all.length + ' complete</b>' + (miss.length ? '' : App.badge('ok', 'Ready')) + '</div><div class="meter" style="margin-bottom:14px"><span class="a" style="width:' + (done / all.length * 100) + '%"></span></div>' +
      '<ul class="checklist">' + all.map(function (f) {
        var ok = !miss.some(function (m) { return m.path === f.path; });
        return '<li class="' + (ok ? 'done' : '') + '"><span class="tick">' + (ok ? I('check') : '') + '</span><span>' + esc(f.label) + (f.path === 'sources' && !ok ? ' · <a href="#/evidence">add</a>' : '') + '</span></li>';
      }).join('') + '</ul>' +
      (t.sources.length ? '<div class="small muted" style="margin-top:12px">Newest source: ' + App.fmtDate(t.sources.map(function (s) { return s.date; }).sort().pop()) + ' · oldest: ' + App.fmtDate(t.sources.map(function (s) { return s.date; }).sort()[0]) + '</div>' : '');
    App.renderSide();
  };
  document.addEventListener('change', function (e) {
    var el = e.target.closest && e.target.closest('input[data-channel]');
    if (!el || !S.t) return;
    var arr = S.t.profile.channels || (S.t.profile.channels = []);
    var i = arr.indexOf(el.value);
    if (el.checked && i < 0) arr.push(el.value);
    if (!el.checked && i > -1) arr.splice(i, 1);
    App.save();
  });
  A['sup-add'] = function () {
    var v = document.getElementById('sup-in').value, why = document.getElementById('sup-why').value || 'Do not contact';
    if (!G.addSuppression(S.t, v, why, 'Manual')) { App.toast('Enter a valid email or domain that is not already listed', 'bad'); return; }
    G.log(S.t, 'Operator', 'Added suppression', v);
    App.save(); document.getElementById('sup-list').innerHTML = supList(S.t); document.getElementById('sup-in').value = ''; App.toast('Added to do-not-contact list');
  };
  A['sup-rm'] = function (el) {
    var s = S.t.suppression[+el.getAttribute('data-i')];
    App.confirm({ title: 'Remove suppression?', body: '<p><b>' + esc(s.value) + '</b> (' + esc(s.reason) + ') will become contactable again.</p>', ok: 'Remove', danger: true }).then(function (ok) {
      if (!ok) return;
      S.t.suppression.splice(S.t.suppression.indexOf(s), 1); G.log(S.t, 'Operator', 'Removed suppression', s.value); App.save();
      var l = document.getElementById('sup-list'); if (l) l.innerHTML = supList(S.t);
    });
  };

  /* ================= Evidence & proof ================= */
  V.evidence = {
    title: 'Evidence & proof',
    header: function () { return { title: 'Evidence & proof', actions: '<button class="btn" data-act="proof-add">' + I('plus') + 'Add proof</button><button class="btn primary" data-act="source-add">' + I('upload') + 'Add source</button>' }; },
    render: function (param) {
      var t = S.t, tab = param === 'proof' ? 'proof' : 'sources';
      var html = '<div class="tabs"><a href="#/evidence" class="' + (tab === 'sources' ? 'on' : '') + '">Sources <span class="n">' + t.sources.length + '</span></a><a href="#/evidence/proof" class="' + (tab === 'proof' ? 'on' : '') + '">Proof library <span class="n">' + t.proof.length + '</span></a></div>';
      if (tab === 'sources') {
        if (!t.sources.length) return html + empty('evidence', 'Add the client\'s materials', 'Upload the deck, website material, discovery notes, call transcripts and won/lost records. Each keeps its date, owner and usage permission, so every claim can be traced.', '<button class="btn primary" data-act="source-add">' + I('upload') + 'Add the first source</button>');
        return html + '<div class="card"><div class="table-wrap"><table class="t"><thead><tr><th>Source</th><th>Type</th><th>Date</th><th>Owner</th><th>Permission</th><th class="num">Used by</th><th></th></tr></thead><tbody>' +
          t.sources.map(function (s) {
            var dep = dependents(t, s.id);
            return '<tr><td class="name"><b>' + esc(s.title) + (s.withdrawn ? ' ' + App.badge('bad', 'Withdrawn') : '') + '</b><span>' + (s.originId ? 'Origin: ' + esc(s.originId) + ' · ' : '') + (s.fileName ? esc(s.fileName) : s.url ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.url) + '</a>' : 'No file attached') + '</span></td>' +
              '<td>' + esc(s.type) + '</td><td class="nowrap">' + App.fmtDate(s.date) + '</td><td>' + esc(s.owner || '—') + '</td><td>' + (s.permission === 'public' ? App.badge('ok', 'Public use') : App.badge('muted', 'Internal only')) + '</td>' +
              '<td class="num">' + dep.total + '</td><td class="right nowrap">' + (s.content ? '<button class="btn sm ghost" data-act="source-view" data-id="' + s.id + '">' + I('eye') + 'View</button>' : '') +
              '<button class="btn sm ghost" data-act="source-withdraw" data-id="' + s.id + '">' + (s.withdrawn ? 'Restore' : 'Withdraw') + '</button></td></tr>';
          }).join('') + '</tbody></table></div></div>' +
          '<p class="small muted" style="margin-top:10px">' + I('info') + ' Sources are never deleted, so history stays traceable. Withdrawing one flags every claim and criterion that depends on it. Notes and transcripts of the same meeting should share an origin ID so they count once as evidence.</p>';
      }
      if (!t.proof.length) return html + empty('shield', 'Record what the client can claim', 'Proof is a result, quote or fact the sponsor permits. Only verified, public-use proof can appear in outreach; anything else is withheld automatically.', '<button class="btn primary" data-act="proof-add">' + I('plus') + 'Add proof</button>');
      return html + '<div class="grid2">' + t.proof.map(function (p, i) {
        var u = G.proofUsable(t, p), s = G.sourceById(t, p.sourceId), P = 'proof.' + i + '.';
        return '<div class="card"><div class="card-b stack sm"><div class="row"><span class="grow">' + (u.ok ? App.badge('ok', 'Usable in outreach') : App.badge('warn', u.why)) + '</span>' + (p.status === 'retired' ? App.badge('muted', 'Retired') : '') + '</div>' +
          '<p style="font-size:14px;margin:4px 0">' + esc(p.text) + '</p><div class="small muted">Source: ' + (s ? esc(s.title) + (s.withdrawn ? ' (withdrawn)' : '') : 'none') + '</div>' +
          '<div class="row" style="margin-top:6px">' + App.bindSwitch(P + 'verified', 'Verified', { rerender: true }) + App.bindSelect(P + 'permission', [{ value: 'public', label: 'Public use' }, { value: 'internal', label: 'Internal only' }], { rerender: true, cls: 'sm', label: 'Permission' }) +
          '<span class="grow"></span><button class="btn sm ghost" data-act="proof-retire" data-i="' + i + '">' + (p.status === 'retired' ? 'Reinstate' : 'Retire') + '</button></div></div></div>';
      }).join('') + '</div>';
    }
  };
  function empty(icon, title, body, actions) { return '<div class="card"><div class="empty"><div class="art">' + I(icon) + '</div><h2>' + esc(title) + '</h2><p>' + esc(body) + '</p><div class="row">' + (actions || '') + '</div></div></div>'; }
  App.emptyState = empty;
  function dependents(t, id) {
    var crit = [];
    t.icp.forEach(function (v) {
      [['industries', 'Target industries'], ['size', 'Size'], ['geography', 'Geography'], ['triggers', 'Triggers'], ['disqualifiers', 'Disqualifiers']].forEach(function (k) { if ((v[k[0]].basis || []).indexOf(id) > -1) crit.push('ICP v' + v.v + ' · ' + k[1]); });
      v.custom.forEach(function (c) { if ((c.basis || []).indexOf(id) > -1) crit.push('ICP v' + v.v + ' · ' + c.label); });
    });
    var proof = t.proof.filter(function (p) { return p.sourceId === id; });
    var obs = t.observations.filter(function (o) { return o.sourceId === id; });
    return { crit: crit, proof: proof, obs: obs, total: crit.length + proof.length + obs.length };
  }
  A['source-add'] = function () {
    var today = new Date().toISOString().slice(0, 10);
    App.modal({
      title: 'Add a source', sub: 'Evidence keeps its date, owner and usage permission. Text files (.txt, .md, .vtt, .srt, .csv) are stored so excerpts can be opened later.',
      body: '<div class="fields"><div class="field full"><label for="sa-t">Title</label><input id="sa-t" placeholder="e.g. Discovery call with sponsor" autofocus></div>' +
        '<div class="field"><label for="sa-ty">Type</label><select id="sa-ty"><option>Deck</option><option>Website</option><option>Call notes</option><option>Transcript</option><option>Won/lost export</option><option>Case study</option><option>Other</option></select></div>' +
        '<div class="field"><label for="sa-d">Source date</label><input id="sa-d" type="date" value="' + today + '"></div>' +
        '<div class="field"><label for="sa-o">Owner</label><input id="sa-o" value="' + esc(S.t.profile.outreachOwner || '') + '"></div>' +
        '<div class="field"><label for="sa-p">Usage permission</label><select id="sa-p"><option value="internal">Internal only</option><option value="public">Public use permitted</option></select></div>' +
        '<div class="field"><label for="sa-u">URL (optional)</label><input id="sa-u" type="url" placeholder="https://"></div>' +
        '<div class="field"><label for="sa-or">Meeting or origin ID (optional)</label><input id="sa-or" placeholder="Same ID for notes and transcript of one call"></div>' +
        '<div class="field full"><label for="sa-f">File (optional)</label><input id="sa-f" type="file"></div></div>',
      actions: [{ label: 'Cancel', cls: 'ghost' }, {
        label: 'Add source', cls: 'primary', onClick: function (m) {
          var b = m.body, title = b.querySelector('#sa-t').value.trim();
          if (!title) { b.querySelector('#sa-t').focus(); App.toast('Give the source a title', 'bad'); return false; }
          var s = { id: G.uid('src'), title: title, type: b.querySelector('#sa-ty').value, date: b.querySelector('#sa-d').value, owner: b.querySelector('#sa-o').value, permission: b.querySelector('#sa-p').value, url: b.querySelector('#sa-u').value, originId: b.querySelector('#sa-or').value.trim(), withdrawn: false, addedAt: G.now() };
          var file = b.querySelector('#sa-f').files[0];
          function finish() { S.t.sources.push(s); G.log(S.t, 'Operator', 'Added source', title); App.save(); App.render(); App.toast('Source added'); }
          if (file) {
            s.fileName = file.name; s.fileSize = file.size;
            if (/\.(txt|md|vtt|srt|csv)$/i.test(file.name) && file.size < 400000) App.readFile(file).then(function (txt) { s.content = txt; finish(); });
            else finish();
          } else finish();
        }
      }]
    });
  };
  A['source-view'] = function (el) {
    var s = G.sourceById(S.t, el.getAttribute('data-id'));
    App.modal({ title: s.title, sub: esc(s.type) + ' · ' + App.fmtDate(s.date) + ' · ' + (s.permission === 'public' ? 'Public use' : 'Internal only'), wide: true, body: '<pre style="white-space:pre-wrap;font:13px/1.6 var(--mono);margin:0;max-height:60vh;overflow:auto">' + esc(s.content) + '</pre>' });
  };
  A['source-withdraw'] = function (el) {
    var t = S.t, s = G.sourceById(t, el.getAttribute('data-id'));
    if (s.withdrawn) { s.withdrawn = false; G.log(t, 'Operator', 'Restored source', s.title); App.save(); App.render(); return; }
    var d = dependents(t, s.id);
    App.confirm({
      title: 'Withdraw "' + s.title + '"?', ok: 'Withdraw source', danger: true,
      body: '<p>Claims that depend on this source stop being usable until they are reviewed.</p>' + (d.total ? '<div class="note warn">' + I('alert') + '<div class="grow"><b>' + App.plural(d.total, 'dependent item') + '</b><ul>' + d.crit.map(function (c) { return '<li>' + esc(c) + ' becomes an assumption</li>'; }).join('') + d.proof.map(function (p) { return '<li>Proof withheld: ' + esc(p.text.slice(0, 70)) + '…</li>'; }).join('') + (d.obs.length ? '<li>' + App.plural(d.obs.length, 'learning observation') + ' lose their source</li>' : '') + '</ul></div></div>' : '<p class="muted">Nothing depends on it yet.</p>')
    }).then(function (ok) {
      if (!ok) return;
      s.withdrawn = true; s.withdrawnAt = G.now(); G.log(t, 'Operator', 'Withdrew source', s.title + ' · ' + d.total + ' dependents flagged'); App.save(); App.render(); App.toast('Source withdrawn; dependent claims flagged');
    });
  };
  A['proof-add'] = function () {
    var t = S.t;
    App.modal({
      title: 'Add proof', sub: 'A result, quote or fact the client is allowed to state. Unverified or internal-only proof is never placed in outreach.',
      body: '<div class="field"><label for="pa-t">Claim, exactly as it may be used</label><textarea id="pa-t" autofocus placeholder="e.g. Customers cut invoice processing time by half in their first quarter."></textarea></div>' +
        '<div class="fields"><div class="field"><label for="pa-s">Source</label><select id="pa-s"><option value="">No source yet</option>' + t.sources.map(function (s) { return '<option value="' + s.id + '">' + esc(s.title) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="pa-p">Permission</label><select id="pa-p"><option value="internal">Internal only</option><option value="public">Public use</option></select></div></div>' +
        '<label class="check"><input type="checkbox" id="pa-v"> Verified against the source</label>',
      actions: [{ label: 'Cancel', cls: 'ghost' }, {
        label: 'Add proof', cls: 'primary', onClick: function (m) {
          var txt = m.body.querySelector('#pa-t').value.trim();
          if (!txt) { App.toast('Write the claim first', 'bad'); return false; }
          t.proof.push({ id: G.uid('pr'), text: txt, sourceId: m.body.querySelector('#pa-s').value || null, permission: m.body.querySelector('#pa-p').value, verified: m.body.querySelector('#pa-v').checked, status: 'active', addedAt: G.now() });
          G.log(t, 'Operator', 'Added proof', txt.slice(0, 80)); App.save(); App.go('#/evidence/proof'); App.toast('Proof added');
        }
      }]
    });
  };
  A['proof-retire'] = function (el) {
    var p = S.t.proof[+el.getAttribute('data-i')];
    p.status = p.status === 'retired' ? 'active' : 'retired';
    G.log(S.t, 'Operator', (p.status === 'retired' ? 'Retired' : 'Reinstated') + ' proof', p.text.slice(0, 80));
    App.save(); App.render();
  };

  /* ================= ICP editor ================= */
  function selICP() {
    var t = S.t;
    var v = S.ui.icpV && G.icpByV(t, S.ui.icpV);
    return v || G.draftICP(t) || G.activeICP(t) || t.icp[t.icp.length - 1] || null;
  }
  V.icp = {
    title: 'Ideal customer profile',
    header: function () {
      var icp = selICP();
      return { title: 'Ideal customer profile', actions: icp ? '<button class="btn" data-act="icp-recipe">' + I('download') + 'Databar filter recipe</button>' : '' };
    },
    render: function () {
      var t = S.t, icp = selICP();
      if (!icp) return empty('icp', 'Draft the first ICP', 'Define who to target: industries, size, geography, dated triggers, disqualifiers and buyer personas. Weights start unset; you can use the suggested split. The sponsor approves a frozen version before any account is scored.', '<button class="btn primary" data-act="icp-new">' + I('plus') + 'Start ICP draft</button>');
      var idx = t.icp.indexOf(icp), P = 'icp.' + idx, ed = icp.status === 'draft', dis = !ed;
      var vers = t.icp.slice().sort(function (a, b) { return b.v - a.v; });
      function crit(title, sub, input, basis) { return '<div class="crit"><div class="ttl"><b>' + title + '</b><span>' + sub + '</span></div><div>' + input + '</div><div>' + (basis || '') + '</div></div>'; }
      function card(h, sub, body, action) { return '<div class="card"><div class="card-h"><h2>' + h + (sub ? '<span class="sub">' + sub + '</span>' : '') + '</h2>' + (action || '') + '</div><div class="card-b" style="padding-top:4px;padding-bottom:4px">' + body + '</div></div>'; }
      var w = icp.weights, wsum = ['industry', 'size', 'trigger', 'buyer'].reduce(function (s, k) { return s + (+w[k] || 0); }, 0);

      var left = '<div class="stack">' +
        '<div class="row"><div class="versions">' + vers.map(function (v) { return '<button class="vpill' + (v === icp ? ' on' : '') + '" data-act="icp-sel" data-v="' + v.v + '">v' + v.v + ' <span class="s">' + (v.status === 'approved' ? '· active' : v.status) + '</span></button>'; }).join('') + '</div><span class="grow"></span>' +
          (!G.draftICP(t) ? '<button class="btn sm" data-act="icp-new">' + I('edit') + 'Propose changes as v' + G.nextV(t) + '</button>' : '') + '</div>' +
        (dis ? '<div class="note">' + I('info') + '<span class="grow">v' + icp.v + ' is ' + (icp.status === 'approved' ? 'the approved, frozen version' : 'retired') + '. To change it, propose a new draft; history stays reproducible.</span></div>' : '') +
        card('Scoring', 'Points only count for verified matches. Hard exclusions override any score.',
          '<div class="crit"><div class="ttl"><b>Weights</b><span>Total ' + wsum + ' points</span></div><div class="fields" style="grid-template-columns:repeat(4,minmax(0,1fr))">' +
            G.COMPONENTS.map(function (c) { return '<div class="field"><label for="w-' + c.key + '">' + esc(c.label) + '</label>' + App.bindInput(P + '.weights.' + c.key, { id: 'w-' + c.key, type: 'num', refresh: 'icp-preview icp-status', disabled: dis, placeholder: 'unset' }) + '</div>'; }).join('') +
          '</div><div>' + (ed ? '<button class="btn sm" data-act="icp-suggest">Use 40/25/20/15</button>' : '') + '</div></div>' +
          crit('Minimum score', 'Applied to verified points only', '<div style="max-width:160px">' + App.bindInput(P + '.cutoff', { type: 'num', refresh: 'icp-preview icp-status', disabled: dis, placeholder: 'e.g. 70', label: 'Minimum score' }) + '</div>')) +
        card('Firmographics', null,
          crit('Target industries', 'Matched against the account\'s industry', App.tagInput(P + '.industries.values', icp.industries.values, { disabled: dis, refresh: 'icp-preview icp-status', placeholder: 'e.g. Manufacturing', label: 'Add industry' }), App.basisPicker(P + '.industries.basis', icp.industries, dis)) +
          crit('Employee range', 'Inclusive', '<div class="row"><div style="width:130px">' + App.bindInput(P + '.size.min', { type: 'int', refresh: 'icp-preview icp-status', disabled: dis, placeholder: 'Min', label: 'Minimum employees' }) + '</div><span class="muted">to</span><div style="width:130px">' + App.bindInput(P + '.size.max', { type: 'int', refresh: 'icp-preview icp-status', disabled: dis, placeholder: 'Max', label: 'Maximum employees' }) + '</div></div>', App.basisPicker(P + '.size.basis', icp.size, dis)) +
          crit('Geography', 'Mandatory: outside is excluded, unknown goes to research', App.tagInput(P + '.geography.values', icp.geography.values, { disabled: dis, refresh: 'icp-preview', placeholder: 'e.g. United States', label: 'Add country' }), App.basisPicker(P + '.geography.basis', icp.geography, dis))) +
        card('Triggers', 'Only a dated trigger with a source URL counts as a fact.',
          crit('Trigger keywords', 'Matched in the trigger text', App.tagInput(P + '.triggers.keywords', icp.triggers.keywords, { disabled: dis, refresh: 'icp-preview', placeholder: 'e.g. hiring, new CFO', label: 'Add trigger keyword' }), App.basisPicker(P + '.triggers.basis', icp.triggers, dis)) +
          crit('Recency', 'Older triggers score zero', '<div class="row"><div style="width:110px">' + App.bindInput(P + '.triggers.recencyDays', { type: 'int', refresh: 'icp-preview', disabled: dis, label: 'Recency in days' }) + '</div><span class="muted">days</span></div>')) +
        card('Disqualifiers', 'Any hit excludes the account, whatever its score.',
          crit('Industries', 'Excluded outright', App.tagInput(P + '.disqualifiers.industries', icp.disqualifiers.industries, { disabled: dis, refresh: 'icp-preview', placeholder: 'e.g. Government', label: 'Add excluded industry' }), App.basisPicker(P + '.disqualifiers.basis', icp.disqualifiers, dis)) +
          crit('Keywords', 'Matched in name, industry, notes or trigger', App.tagInput(P + '.disqualifiers.keywords', icp.disqualifiers.keywords, { disabled: dis, refresh: 'icp-preview', placeholder: 'e.g. bankruptcy', label: 'Add disqualifier keyword' }))) +
        card('Buyer personas', 'Contact titles are matched to these keywords. A title matching two personas goes to review.',
          '<div class="stack" style="padding:12px 0">' + (icp.personas.length ? icp.personas.map(function (p, i) {
            var PP = P + '.personas.' + i + '.';
            return '<div class="persona"><div class="row"><div class="grow">' + App.bindInput(PP + 'name', { disabled: dis, placeholder: 'Persona name', label: 'Persona name' }) + '</div><div style="width:160px">' + App.bindSelect(PP + 'priority', [{ value: 'primary', label: 'Primary buyer' }, { value: 'secondary', label: 'Secondary buyer' }], { disabled: dis, label: 'Priority' }) + '</div>' + (ed ? '<button class="btn ghost sm icon" data-act="persona-rm" data-i="' + i + '" aria-label="Remove persona">' + I('trash') + '</button>' : '') + '</div>' +
              '<div class="field"><label>Title keywords</label>' + App.tagInput(PP + 'titles', p.titles, { disabled: dis, refresh: 'icp-status', placeholder: 'e.g. CFO, VP Finance, Controller', label: 'Add title keyword' }) + '</div>' +
              '<div class="fields"><div class="field"><label>Likely pain <span class="badge warn plain">inference</span></label>' + App.bindText(PP + 'pain', { disabled: dis, rows: 2, placeholder: 'What you believe hurts' }) + '<span class="hint">Never stated as fact in outreach.</span></div>' +
              '<div class="field"><label>Discovery question</label>' + App.bindText(PP + 'question', { disabled: dis, rows: 2, placeholder: 'How the pain is asked about' }) + '<span class="hint">Inserted as {{question}}.</span></div>' +
              '<div class="field full"><label>Approved message</label>' + App.bindText(PP + 'message', { disabled: dis, rows: 2, placeholder: 'The positioning line for this persona' }) + '</div></div></div>';
          }).join('') : '<p class="muted">No personas yet.</p>') + (ed ? '<div><button class="btn" data-act="persona-add">' + I('plus') + 'Add persona</button></div>' : '') + '</div>') +
        card('Other criteria', 'Mandatory unknowns send the account to research. Criteria that providers cannot filter on become manual research rules.',
          '<div class="stack sm" style="padding:12px 0">' + (icp.custom.length ? icp.custom.map(function (c, i) {
            var CP = P + '.custom.' + i + '.';
            return '<div class="row" style="padding:6px 0;border-bottom:1px solid var(--line)"><div class="grow">' + App.bindInput(CP + 'label', { disabled: dis, placeholder: 'e.g. Uses NetSuite', label: 'Criterion' }) + '</div>' + App.bindSwitch(CP + 'mandatory', 'Mandatory', { disabled: dis, refresh: 'icp-preview' }) + App.bindSwitch(CP + 'filterable', 'Provider filter', { disabled: dis }) + App.basisPicker(CP + 'basis', c, dis) + (ed ? '<button class="btn ghost sm icon" data-act="custom-rm" data-i="' + i + '" aria-label="Remove criterion">' + I('trash') + '</button>' : '') + '</div>';
          }).join('') : '<p class="muted small">None. Add criteria such as tech stack or funding stage.</p>') + (ed ? '<div><button class="btn sm" data-act="custom-add">' + I('plus') + 'Add criterion</button></div>' : '') + '</div>') +
        '</div>';

      var right = '<div class="sticky stack"><div class="card"><div class="card-h"><h2>Version ' + icp.v + '</h2>' + App.badge(icp.status === 'approved' ? 'ok' : icp.status === 'draft' ? 'warn' : 'muted', icp.status === 'approved' ? 'Approved' : icp.status === 'draft' ? 'Draft' : 'Retired') + '</div><div class="card-b stack sm" id="icp-status"></div></div>' +
        '<div class="card"><div class="card-h"><h2>Effect on your accounts<span class="sub">Live preview against ' + App.plural(t.accounts.length, 'imported account') + '</span></h2></div><div class="card-b" id="icp-preview"></div></div></div>';
      return '<div class="split wide-side">' + left + right + '</div>';
    },
    mounted: function () { App.refresh('icp-status'); App.refresh('icp-preview'); }
  };
  App.refreshers['icp-status'] = function () {
    var el = document.getElementById('icp-status'); if (!el) return;
    var t = S.t, icp = selICP(), P = 'icp.' + t.icp.indexOf(icp);
    var html = '';
    if (icp.status === 'draft') {
      var probs = G.icpProblems(t, icp);
      var assumptions = ['industries', 'size', 'geography', 'triggers'].filter(function (k) { return G.criterionBasis(t, icp[k]).assumption; }).length;
      html += '<div class="field"><label for="icp-note">What changed and why</label>' + App.bindText(P + '.note', { id: 'icp-note', rows: 2, placeholder: 'Shown in the approval record' }) + '</div>';
      html += probs.length ? '<div class="note warn">' + I('alert') + '<div class="grow"><b>Before approval</b><ul>' + probs.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul></div></div>' : '<div class="note ok">' + I('check') + '<span class="grow">Ready for the sponsor to approve.</span></div>';
      if (assumptions) html += '<div class="small muted">' + App.plural(assumptions, 'criterion', 'criteria') + ' labelled as assumptions. That is allowed for a baseline; mark sources when you have them.</div>';
      html += '<div class="row"><button class="btn primary grow" data-act="icp-approve"' + (probs.length ? ' disabled' : '') + '>' + I('shield') + 'Approve v' + icp.v + '</button><button class="btn ghost" data-act="icp-discard">Discard</button></div>';
      if (icp.basedOn) html += '<div class="small muted">Based on v' + icp.basedOn + '.</div>';
    } else if (icp.status === 'approved') {
      html += '<dl class="kv"><dt>Approved by</dt><dd>' + esc(icp.approvedBy) + '</dd><dt>Approved</dt><dd>' + App.fmtDT(icp.approvedAt) + '</dd>' + (icp.note ? '<dt>Change</dt><dd>' + esc(icp.note) + '</dd>' : '') + '</dl>';
    } else {
      html += '<dl class="kv"><dt>Approved by</dt><dd>' + esc(icp.approvedBy || '—') + '</dd><dt>Retired</dt><dd>' + App.fmtDT(icp.retiredAt) + '</dd>' + (icp.note ? '<dt>Change</dt><dd>' + esc(icp.note) + '</dd>' : '') + '</dl><div class="small muted">Campaigns launched under v' + icp.v + ' still report against it.</div>';
    }
    el.innerHTML = html;
  };
  App.refreshers['icp-preview'] = function () {
    var el = document.getElementById('icp-preview'); if (!el) return;
    var t = S.t, icp = selICP();
    if (!t.accounts.length) { el.innerHTML = '<p class="muted small" style="margin:0">Import accounts to see how this profile sorts them.</p>'; return; }
    var sc = G.scoreAll(t, icp), c = { eligible: 0, research: 0, deprioritized: 0, excluded: 0, 'needs-icp': 0 };
    Object.keys(sc).forEach(function (k) { c[sc[k].status]++; });
    var act = G.activeICP(t), diff = null;
    if (act && act !== icp && icp.status === 'draft') diff = G.icpImpact(t, act, icp);
    el.innerHTML = (c['needs-icp'] === t.accounts.length ? '<div class="note warn">' + I('alert') + '<span class="grow">Set all four weights and the minimum score to see scores.</span></div>' :
      '<div class="stack sm">' + ['eligible', 'research', 'deprioritized', 'excluded'].map(function (k) {
        var s = G.ACCOUNT_STATES[k];
        return '<div class="row"><span class="grow">' + App.badge(s.tone, s.label) + '</span><b>' + c[k] + '</b></div><div class="meter" style="height:5px"><span class="a" style="width:' + (c[k] / t.accounts.length * 100) + '%;background:var(--' + (s.tone === 'muted' ? 'faint' : s.tone) + ')"></span></div>';
      }).join('') + '</div>') +
      (diff ? '<div class="note" style="margin-top:12px">' + I('swap') + '<div class="grow"><b>Compared with active v' + act.v + '</b><br>' + diff.newlyEligible.length + ' newly eligible · ' + diff.newlyExcluded.length + ' newly out of scope · ' + diff.uncertain.length + ' now uncertain</div></div>' : '');
  };
  A['icp-sel'] = function (el) { S.ui.icpV = +el.getAttribute('data-v'); App.render(); };
  A['icp-new'] = function () {
    var t = S.t, base = G.activeICP(t);
    var d = G.newDraftFrom(t, base);
    if (!base) d.triggers.recencyDays = 90;
    S.ui.icpV = d.v; G.log(t, 'Operator', 'Started ICP v' + d.v + ' draft', base ? 'from v' + base.v : 'blank');
    App.save(); App.render(); App.toast('Draft v' + d.v + ' created');
  };
  A['icp-discard'] = function () {
    var t = S.t, d = G.draftICP(t);
    App.confirm({ title: 'Discard draft v' + d.v + '?', body: '<p>The approved version stays as it is.</p>', ok: 'Discard draft', danger: true }).then(function (ok) {
      if (!ok) return; t.icp.splice(t.icp.indexOf(d), 1); S.ui.icpV = null; G.log(t, 'Operator', 'Discarded ICP draft v' + d.v); App.save(); App.render();
    });
  };
  A['icp-suggest'] = function () {
    var icp = selICP(); Object.assign(icp.weights, G.SUGGESTED_WEIGHTS); if (icp.cutoff === null) icp.cutoff = 70;
    App.save(); App.render(); App.toast('Suggested weights applied; adjust if the client prefers');
  };
  A['persona-add'] = function () { var icp = selICP(); icp.personas.push({ id: G.uid('per'), name: '', priority: icp.personas.length ? 'secondary' : 'primary', titles: [], pain: '', question: '', message: '' }); App.save(); App.render(); };
  A['persona-rm'] = function (el) { selICP().personas.splice(+el.getAttribute('data-i'), 1); App.save(); App.render(); };
  A['custom-add'] = function () { selICP().custom.push({ id: G.uid('cu'), label: '', mandatory: false, filterable: false, basis: [] }); App.save(); App.render(); };
  A['custom-rm'] = function (el) { selICP().custom.splice(+el.getAttribute('data-i'), 1); App.save(); App.render(); };
  A['icp-approve'] = function () {
    var t = S.t, icp = selICP(), act = G.activeICP(t);
    var probs = G.icpProblems(t, icp); if (probs.length) return;
    var imp = act ? G.icpImpact(t, act, icp) : null;
    function names(list) { return list.slice(0, 6).map(function (x) { var a = G.accountById(t, x.id); return esc(a.name); }).join(', ') + (list.length > 6 ? ' and ' + (list.length - 6) + ' more' : ''); }
    var affected = imp ? imp.batches.filter(function (b) { return b.outOfScope.length; }) : [];
    App.modal({
      title: 'Approve ICP v' + icp.v, sub: 'This freezes the version. Accounts are scored against it and campaigns pin it.',
      body: '<div class="field"><label for="ap-by">Approver</label><input id="ap-by" value="' + esc(t.profile.approver || '') + '" placeholder="Name of the authorised approver" autofocus></div>' +
        (imp ? '<div class="card"><div class="card-h"><h3>Change review vs v' + act.v + '</h3></div><div class="card-b stack sm">' +
          '<div class="row"><span class="grow">' + App.badge('ok', 'Newly eligible') + '</span><b>' + imp.newlyEligible.length + '</b></div>' + (imp.newlyEligible.length ? '<div class="small muted">' + names(imp.newlyEligible) + '</div>' : '') +
          '<div class="row"><span class="grow">' + App.badge('bad', 'Newly out of scope') + '</span><b>' + imp.newlyExcluded.length + '</b></div>' + (imp.newlyExcluded.length ? '<div class="small muted">' + names(imp.newlyExcluded) + '</div>' : '') +
          '<div class="row"><span class="grow">' + App.badge('warn', 'Now uncertain') + '</span><b>' + imp.uncertain.length + '</b></div>' + (imp.uncertain.length ? '<div class="small muted">' + names(imp.uncertain) + '</div>' : '') +
          (affected.length ? '<div class="note bad">' + I('alert') + '<span class="grow">' + App.plural(affected.length, 'queued batch', 'queued batches') + ' include contacts who move out of scope. They will be held for review and need fresh approval.</span></div>' : '<div class="small muted">No queued batch is affected. Completed sends and reports keep the version in effect at launch.</div>') +
        '</div></div>' : '<div class="note info">' + I('info') + '<span class="grow">This is the baseline. Criteria without a source are recorded as sponsor-approved assumptions.</span></div>'),
      actions: [{ label: 'Cancel', cls: 'ghost' }, {
        label: 'Approve v' + icp.v, cls: 'primary', icon: 'shield', onClick: function (m) {
          var by = m.body.querySelector('#ap-by').value.trim();
          if (!by) { App.toast('Enter the approver\'s name', 'bad'); return false; }
          var r = G.approveICP(t, icp, by);
          if (!r.ok) { App.toast(r.problems[0], 'bad'); return false; }
          S.ui.icpV = icp.v; App.save(); App.render(); App.toast('ICP v' + icp.v + ' approved by ' + by);
        }
      }]
    });
  };
  A['icp-recipe'] = function () {
    var t = S.t, icp = selICP(), r = G.databarRecipe(t, icp), f = r.filters;
    function li(k, v) { return '<dt>' + k + '</dt><dd>' + (v && (v.length || typeof v === 'string') ? esc(Array.isArray(v) ? v.join(', ') : v) : '<span class="faint">none</span>') + '</dd>'; }
    var json = JSON.stringify(r, null, 2);
    App.modal({
      title: 'Databar filter recipe · ICP v' + icp.v, sub: icp.status !== 'approved' ? '<b>This version is ' + icp.status + '.</b> Use the approved version for live sourcing.' : 'Filters the provider supports, plus manual research rules for everything else.', wide: true,
      body: '<dl class="kv">' + li('Industries', f.industries) + li('Employees', (f.employees.min || 0) + ' – ' + (f.employees.max || 'any')) + li('Countries', f.countries) + li('Exclude industries', f.excludeIndustries) + li('Job titles', f.jobTitles) + li('Custom filters', f.customFilters) + li('Suppress domains', r.suppressDomains) + '</dl>' +
        '<div><div class="label" style="margin-bottom:6px">Manual research rules</div>' + (r.manualResearch.length ? '<ul class="checklist">' + r.manualResearch.map(function (m) { return '<li><span class="tick"></span><span><b>' + esc(m.rule) + '</b><br><small class="muted">' + esc(m.why) + '</small></span></li>'; }).join('') + '</ul>' : '<p class="muted small">None.</p>') + '</div>',
      actions: [{ label: 'Copy JSON', cls: 'ghost', icon: 'copy', onClick: function () { App.copy(json, 'Recipe copied'); return false; } }, { label: 'Download JSON', cls: 'primary', icon: 'download', onClick: function () { App.download(App.slug(t.profile.name) + '-icp-v' + icp.v + '-databar.json', json, 'application/json'); G.log(t, 'Operator', 'Exported Databar recipe for ICP v' + icp.v); App.save(); return false; } }]
    });
  };
})();
