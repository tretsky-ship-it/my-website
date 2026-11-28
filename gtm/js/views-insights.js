/* Call insights page (layout from the call-insights reference kit): filters and headline numbers, a validated
   AI synthesis, topic trends with sparklines, grouped buyer questions, repeated phrases, signal lists and topics
   by segment. Sits beside Calls, Deals, Call trends and Product insights. */
(function () {
  'use strict';
  var G = window.GTM, App = window.App, S = App.S, esc = App.esc, I = App.icon, V = App.views, A = App.act, CI = G.CI;

  function T() { var t = S.t; t.calls = t.calls || []; t.deals = t.deals || []; t.insightReports = t.insightReports || []; return t; }
  function F() { return S.ui.ci || (S.ui.ci = { range: 'all', rep: 'all', seg: 'all', report: 0 }); }
  function scoped(t) {
    var f = F(), now = Date.now();
    return t.calls.filter(function (c) {
      return (f.range === 'all' || CI.callDate(c) >= now - (+f.range) * 864e5) && (f.rep === 'all' || (c.reps || []).indexOf(f.rep) > -1) && (f.seg === 'all' || CI.segmentOf(t, c) === f.seg);
    });
  }
  function scopeLabel() { var f = F(); return [f.range === 'all' ? 'All dates' : 'Last ' + f.range + ' days', f.rep === 'all' ? 'All reps' : f.rep, f.seg === 'all' ? 'All segments' : f.seg].join(' · '); }
  var last = null;
  function analyze(t) {
    var calls = scoped(t), team = t.profile.teamNames || [], tr = CI.topicTrends(calls, team);
    last = { calls: calls, team: team, trends: tr, questions: CI.questionGroups(calls, team), phrases: CI.recurringPhrases(calls, team), signals: CI.signalLists(calls, team), matrix: CI.segmentMatrix(t, calls, team, tr.topics) };
    return last;
  }
  function audTag(a) { return '<span class="ci-tag aud-' + a.toLowerCase() + '">' + (a === 'Both' ? 'Product + Marketing' : a) + '</span>'; }
  function callsOf(n, of) { return n + ' of ' + of + ' call' + (of === 1 ? '' : 's'); }
  function spark(shares) {
    var w = 120, h = 28, n = shares.length;
    var pts = shares.map(function (v, i) { return v === null ? null : [n === 1 ? w / 2 : i / (n - 1) * (w - 6) + 3, h - 3 - v * (h - 6)]; });
    var line = pts.filter(Boolean).map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" aria-hidden="true"><line x1="3" x2="' + (w - 3) + '" y1="' + (h - 3) + '" y2="' + (h - 3) + '" class="spark-base"/><polyline points="' + line + '"/>' + pts.map(function (p) { return p ? '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.2"/>' : ''; }).join('') + '</svg>';
  }
  function sel(key, label, opts) { var f = F(); return '<label class="ci-filter"><span>' + label + '</span><select data-ci-filter="' + key + '" aria-label="' + label + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(f[key]) === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>'; }
  function callTitle(id) { var c = T().calls.find(function (x) { return x.id === id; }); return c ? c.title : 'Call no longer in library'; }
  function quote(s, callId) { return '<blockquote class="ci-ev"><span>“' + esc(CI.maskIds(s)) + '”</span><a href="#/calls/' + esc(callId) + '">' + esc(callTitle(callId)) + ' ↗</a></blockquote>'; }

  V.insights = {
    title: 'Call insights',
    header: function () { return { title: 'Call insights', actions: '<button class="btn" data-act="ci-export">' + I('download') + 'Export report</button><button class="btn primary" data-act="call-add">' + I('plus') + 'Add call</button>' }; },
    render: function () {
      var t = T();
      if (!t.calls.length) return App.emptyState('sparkle', 'What buyers keep telling you', 'Trends, questions, repeated phrases and signals from every call in your library, for the sales, product and marketing teams. Add calls, or load ten sample calls to see how it works.', '<button class="btn primary" data-act="ci-sample-add">' + I('sparkle') + 'Add 10 sample calls</button><button class="btn" data-act="call-add">' + I('plus') + 'Add a call</button>');
      var a = analyze(t), f = F();
      var reps = G.uniq([].concat.apply([], t.calls.map(function (c) { return c.reps || []; }))), segs = G.uniq(t.calls.map(function (c) { return CI.segmentOf(t, c); }));
      var qHeard = a.questions.reduce(function (n, q) { return n + q.items.length; }, 0), rising = a.trends.topics.filter(function (x) { return x.status === 'Rising' || x.status === 'New'; }).length;
      var html = '<div class="ci-head"><div class="ci-eyebrow">Insights · across calls</div><h2 class="ci-h">What buyers keep telling us.</h2><p class="muted">Trends, questions, repeated phrases and signals from the calls in your library, for the sales, product and marketing teams. Buyer-side speech only; excerpts are internal and email addresses and phone numbers are masked.</p></div>' +
        '<div class="card ci-filters"><div class="card-b row">' + sel('range', 'Dates', [['all', 'All dates'], ['30', 'Last 30 days'], ['60', 'Last 60 days'], ['90', 'Last 90 days']]) + sel('rep', 'Rep', [['all', 'All reps']].concat(reps.map(function (r) { return [r, r]; }))) + sel('seg', 'Segment', [['all', 'All segments']].concat(segs.map(function (s) { return [s, s]; }))) +
        '<span class="ci-scope">' + callsOf(a.calls.length, t.calls.length).replace(' calls', ' calls in scope') + '</span><span class="grow"></span>' + (App.hasSampleCalls(t) ? '<button class="btn" data-act="ci-sample-remove">Remove sample calls</button>' : '<button class="btn" data-act="ci-sample-add">' + I('sparkle') + 'Add 10 sample calls</button>') + '</div></div>' +
        '<details class="ci-team"><summary>Who counts as our team?</summary><div class="stack sm" style="margin-top:8px"><span class="small muted">Lines from these speakers are left out of every count. You can also switch any speaker\'s side on a call page.</span>' + App.tagInput('profile.teamNames', t.profile.teamNames || [], { placeholder: 'Add a teammate\'s name as it appears in transcripts', label: 'Add team member' }) + '</div></details>' +
        '<div class="kpis ci-stats"><div class="kpi"><span class="k">Calls in scope</span><span class="v">' + a.calls.length + '</span><span class="s">' + esc(scopeLabel()) + '</span></div><div class="kpi"><span class="k">Questions heard</span><span class="v">' + qHeard + '</span><span class="s">' + a.questions.length + ' distinct</span></div>' +
        '<div class="kpi"><span class="k">Recurring phrases</span><span class="v">' + a.phrases.length + '</span><span class="s">in 2+ calls</span></div><div class="kpi"><span class="k">Topics rising</span><span class="v">' + rising + '</span><span class="s">vs. first half of the period</span></div></div>';
      html += aiBrief(t, a);
      html += '<div class="grid2 ci-two"><div class="card"><div class="card-h"><h2>Topic trends<span class="sub">Share of calls mentioning each topic over the period. Rising and falling compare the second half of the period with the first.</span></h2></div>' +
        (a.trends.topics.length ? '<div class="ci-trends">' + a.trends.topics.map(function (tp) {
          return '<button class="ci-trend" data-act="ci-open" data-type="topic" data-id="' + tp.id + '"><span class="lab">' + esc(tp.label) + '</span>' + spark(tp.shares) + '<span class="mono small">' + callsOf(tp.callCount, a.calls.length) + '</span><span class="ci-status st-' + tp.status.split(' ')[0].toLowerCase() + '">' + tp.status + '</span></button>';
        }).join('') + '</div>' : '<div class="card-b small muted">No tracked topics in these calls.</div>') + '</div>' +
        '<div class="card"><div class="card-h"><h2>Questions buyers ask<span class="sub">Similar questions are grouped; counts are distinct calls. Routed to the team best placed to answer them.</span></h2></div>' +
        (a.questions.length ? '<div class="ci-qs">' + a.questions.slice(0, 14).map(function (q, i) {
          return '<button class="ci-q" data-act="ci-open" data-type="question" data-id="' + i + '"><span class="n">' + q.callCount + '</span><span class="grow"><b>' + esc(CI.maskIds(q.question)) + '</b><span class="row tight"><span class="ci-tag">' + esc(q.categoryLabel) + '</span>' + audTag(q.audience) + (q.items.length > 1 ? '<span class="small muted">' + q.items.length + ' times</span>' : '') + '</span></span></button>';
        }).join('') + '</div>' : '<div class="card-b small muted">No buyer questions found.</div>') + '</div></div>';
      html += '<div class="card"><div class="card-h"><h2>Phrases they repeat<span class="sub">Their words, in two or more calls. Useful plain language for sales and marketing copy.</span></h2></div><div class="card-b ci-phrases">' +
        (a.phrases.length ? a.phrases.map(function (p, i) { return '<button class="ci-phrase" data-act="ci-open" data-type="phrase" data-id="' + i + '">' + esc(p.phrase) + ' <span>' + p.callCount + '</span></button>'; }).join('') : '<span class="small muted">No phrases repeat across calls yet.</span>') + '</div></div>';
      html += '<div class="section-title"><h2>Signals worth knowing</h2><p>Sentences that read like requests, concerns, switching triggers, wow moments or mentions of current tools. Pattern matched, so open the sources before acting on one.</p></div><div class="grid3">' +
        a.signals.map(function (sg, i) {
          return '<div class="card ci-signal"><div class="card-h"><h2>' + esc(sg.label) + '</h2>' + audTag(sg.audience) + '</div><div class="card-b stack sm"><span class="small muted">' + callsOf(sg.callCount, a.calls.length) + '</span>' +
            (sg.items.length ? sg.items.slice(0, 4).map(function (s) { return quote(s.text, s.call.id); }).join('') + (sg.items.length > 4 ? '<div><button class="btn sm" data-act="ci-open" data-type="signal" data-id="' + i + '">All ' + sg.items.length + ' mentions ↗</button></div>' : '') : '<span class="small muted">None in this scope.</span>') + '</div></div>';
        }).join('') + '</div>';
      if (a.matrix.cols.length) html += '<div class="card" style="margin-top:16px"><div class="card-h"><h2>Topics by segment<span class="sub">Share of each segment\'s calls that mention the topic. Segments come from the deal or the company\'s industry.</span></h2></div><div class="table-wrap"><table class="t ci-matrix"><thead><tr><th>Topic</th>' + a.matrix.cols.map(function (c) { return '<th class="num">' + esc(c.label) + '<br><span class="faint">' + c.calls.length + ' calls</span></th>'; }).join('') + '</tr></thead><tbody>' +
        a.matrix.rows.map(function (r) { return '<tr><td><b>' + esc(r.label) + '</b></td>' + r.cells.map(function (c) { return '<td class="num"><span class="ci-cell" style="--s:' + c.share.toFixed(2) + '">' + (c.n ? Math.round(c.share * 100) + '%' : '—') + '</span></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div></div>';
      return html;
    }
  };
  function aiBrief(t, a) {
    var reports = t.insightReports, f = F(), idx = Math.min(+f.report || 0, Math.max(0, reports.length - 1)), r = reports[idx];
    var order = [['Trend', 'Trends and themes'], ['Question', 'Questions buyers ask'], ['Product', 'For the product team'], ['Marketing', 'For the marketing team'], ['Watch', 'Watch list']];
    var head = '<div class="card-h ci-brief-h"><h2><span class="ci-eyebrow">AI synthesis · GTM Engine</span>What sales, product and marketing should know<span class="sub">GTM Engine reads every call in the current scope together. Every quote is checked word for word against its transcript before it\'s shown, and the app counts the calls itself.</span></h2>' +
      (reports.length > 1 ? sel('report', 'Report', reports.map(function (x, i) { return [String(i), App.fmtDate(x.createdAt) + ' · ' + x.callIds.length + ' calls' + (x.sample ? ' (sample)' : '')]; })) : '') +
      '<button class="btn primary" data-act="ci-run"' + (a.calls.length ? '' : ' disabled') + '>' + I('sparkle') + 'Analyze ' + App.plural(a.calls.length, 'call') + '</button></div>';
    if (!r) return '<div class="card ci-brief">' + head + '<div class="empty"><div class="art">' + I('sparkle') + '</div><h2>No synthesis yet</h2><p>Choose a scope above, then select Analyze. It takes about a minute.</p></div></div>';
    var body = order.map(function (o) {
      var items = r.items.filter(function (i) { return i.section === o[0]; }); if (!items.length) return '';
      return '<div class="ci-brief-sec"><h3>' + o[1] + '</h3>' + items.map(function (i) {
        return '<article class="ci-item"><div class="row"><h4 class="grow">' + esc(i.title) + '</h4>' + audTag(i.audience) + '<span class="ci-tag">' + callsOf(i.callCount, r.callIds.length) + '</span></div><p>' + esc(i.detail) + '</p>' + i.evidence.map(function (e) { return quote(e.quote, e.callId); }).join('') + '</article>';
      }).join('') + '</div>';
    }).join('');
    return '<div class="card ci-brief">' + head + '<div class="card-b"><div class="ci-summary"><p>' + esc(r.summary) + '</p><p class="small muted">' + App.fmtDT(r.createdAt) + ' · ' + r.callIds.length + ' calls · ' + esc(r.scopeLabel || '') + (r.sample ? ' · sample report' : '') + (r.dropped ? ' · ' + App.plural(r.dropped, 'unsupported item') + ' removed' : '') + '</p></div>' + body +
      '<div class="note" style="margin-top:12px">' + I('info') + '<span class="grow">Internal only. Quotes come from prospects and customers; content for LinkedIn goes through the Content Engine, which never names them.</span></div></div></div>';
  }
  document.addEventListener('change', function (e) {
    var el = e.target.closest && e.target.closest('[data-ci-filter]'); if (!el) return;
    F()[el.getAttribute('data-ci-filter')] = el.value; App.render();
  });
  A['ci-sample-add'] = function () { var t = T(), n = App.addSampleCalls(t); App.save(); App.render(); App.toast(n ? n + ' sample calls added across 6 deals. Remove them any time.' : 'Sample calls are already here'); };
  A['ci-sample-remove'] = function () {
    App.confirm({ title: 'Remove the sample calls?', body: '<p>Removes the 10 sample calls, their 6 sample deals and the sample report. Your own calls are untouched.</p>', ok: 'Remove sample calls', danger: true }).then(function (ok) { if (!ok) return; App.removeSampleCalls(T()); App.save(); App.render(); App.toast('Sample calls removed'); });
  };
  A['ci-run'] = function () {
    var t = T(), calls = scoped(t); if (!calls.length) return;
    App.askClaude({
      title: 'Analyze ' + App.plural(calls.length, 'call') + ' together', sub: esc(scopeLabel()) + '. Quotes that can\'t be found word for word in their call are removed.', basis: App.plural(calls.length, 'call') + ' in scope',
      prompt: CI.insightPrompt(t, calls), clean: function (d) { var r = CI.validateInsights(d, calls); if (!r && d && Array.isArray(d.items) && d.items.length) return { empty: true, message: 'GTM Engine wrote ' + App.plural(d.items.length, 'insight') + ', but none of their quotes could be found word for word in the calls, so nothing was kept. Try again.' }; return r; },
      preview: function (r) { return '<p>' + esc(r.summary) + '</p>' + App.resultTiles([['Insights', r.items.length], ['Removed (unsupported)', r.dropped]]) + '<ul class="small">' + r.items.slice(0, 8).map(function (i) { return '<li><b>' + esc(i.section) + ':</b> ' + esc(i.title) + '</li>'; }).join('') + '</ul>'; },
      applyLabel: 'Save report', apply: function (r) {
        t.insightReports.unshift({ id: G.uid('rep'), createdAt: G.now(), callIds: calls.map(function (c) { return c.id; }), scopeLabel: scopeLabel(), summary: r.summary, items: r.items, dropped: r.dropped });
        F().report = 0; G.log(t, 'GTM Engine (analysis)', 'Analyzed calls together', calls.length + ' calls'); App.save(); App.render(); App.toast('Report saved');
      }
    });
  };
  A['ci-open'] = function (el) { S.ui.cio = { type: el.getAttribute('data-type'), id: el.getAttribute('data-id') }; App.drawer({ render: ciDrawer }); };
  function ciDrawer() {
    var t = T(), q = S.ui.cio, a = last || analyze(t), title = '', sub = '', items = [];
    if (q.type === 'topic') {
      var tp = a.trends.topics.find(function (x) { return x.id === q.id; }); if (!tp) return null;
      var re = new RegExp(CI.TOPICS.find(function (x) { return x[0] === q.id; })[2], 'i');
      title = tp.label; sub = callsOf(tp.callCount, a.calls.length) + ' · ' + tp.status;
      a.calls.forEach(function (c) { CI.buyerSentences(c, a.team).forEach(function (s) { if (re.test(s.text)) items.push(s); }); });
    } else if (q.type === 'question') {
      var g = a.questions[+q.id]; if (!g) return null; title = CI.maskIds(g.question); sub = g.categoryLabel + ' · ' + callsOf(g.callCount, a.calls.length); items = g.items;
    } else if (q.type === 'phrase') {
      var p = a.phrases[+q.id]; if (!p) return null; title = '“' + p.phrase + '”'; sub = callsOf(p.callCount, a.calls.length) + ' · ' + App.plural(p.mentions, 'mention');
      a.calls.forEach(function (c) { CI.buyerSentences(c, a.team).forEach(function (s) { if (s.text.toLowerCase().replace(/[’']/g, '').indexOf(p.phrase) > -1) items.push(s); }); });
    } else if (q.type === 'signal') {
      var sg = a.signals[+q.id]; if (!sg) return null; title = sg.label; sub = callsOf(sg.callCount, a.calls.length); items = sg.items;
    }
    items = items.slice().sort(function (x, y) { return CI.callDate(y.call) - CI.callDate(x.call); });
    return { head: '<div class="small muted">Call insights</div><h2>' + esc(title) + '</h2><div class="small muted">' + esc(sub) + '</div>',
      body: '<div class="stack sm">' + items.map(function (s) { return '<div class="persona" style="gap:4px"><div>“' + esc(CI.maskIds(s.text)) + '”</div><div class="small muted">' + esc(s.speaker || 'Buyer') + ' · <a href="#/calls/' + s.call.id + '">' + esc(s.call.title) + '</a> · ' + App.fmtDate(s.call.date) + '</div></div>'; }).join('') + '</div>' };
  }
  A['ci-export'] = function () {
    var t = T(), a = last || analyze(t), r = t.insightReports[Math.min(+F().report || 0, t.insightReports.length - 1)];
    var L = ['# Call insights: ' + (t.profile.name || ''), '', '_' + scopeLabel() + ' · ' + a.calls.length + ' calls_', ''];
    if (r) { L.push('## AI synthesis', '', r.summary, ''); r.items.forEach(function (i) { L.push('- **' + i.section + ': ' + i.title + '** (' + i.audience + ', ' + callsOf(i.callCount, r.callIds.length) + ') ' + i.detail); i.evidence.forEach(function (e) { L.push('  > "' + CI.maskIds(e.quote) + '" (a prospect)'); }); }); L.push(''); }
    L.push('## Topic trends'); a.trends.topics.forEach(function (x) { L.push('- ' + x.label + ': ' + callsOf(x.callCount, a.calls.length) + ' (' + x.status + ')'); });
    L.push('', '## Questions buyers ask'); a.questions.slice(0, 15).forEach(function (q) { L.push('- ' + CI.maskIds(q.question) + ' (' + q.categoryLabel + ', ' + App.plural(q.callCount, 'call') + ')'); });
    L.push('', '## Phrases they repeat', a.phrases.map(function (p) { return p.phrase + ' (' + p.callCount + ')'; }).join(' · '));
    a.signals.forEach(function (sg) { L.push('', '## ' + sg.label + ' (' + callsOf(sg.callCount, a.calls.length) + ')'); sg.items.slice(0, 6).forEach(function (s) { L.push('- "' + CI.maskIds(s.text) + '"'); }); });
    App.download(App.slug(t.profile.name) + '-call-insights-' + new Date().toISOString().slice(0, 10) + '.md', L.join('\n'), 'text/markdown');
  };
})();
