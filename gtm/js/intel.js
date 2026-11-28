/* Sales Intelligence: deterministic core.
   Parses transcripts into speaker turns, computes talk share, scores calls ("going well" / mixed / at risk)
   from the AI analysis plus measurable signals, rolls calls up to deals (MEDDIC), and aggregates trends.
   No DOM access, so it can be tested in Node (gtm/tests/intel.test.js). Extends the GTM namespace. */
(function (root) {
  'use strict';
  var G = (typeof module === 'object' && module.exports) ? require('./engine.js') : root.GTM;

  G.MEDDIC = [
    { key: 'metrics', label: 'Metrics', q: 'What measurable outcome do they want?' },
    { key: 'economicBuyer', label: 'Economic buyer', q: 'Who controls the budget, and are they engaged?' },
    { key: 'decisionCriteria', label: 'Decision criteria', q: 'How will they judge the options?' },
    { key: 'decisionProcess', label: 'Decision process', q: 'What steps and people does a decision go through?' },
    { key: 'identifyPain', label: 'Identified pain', q: 'What problem is serious enough to act on?' },
    { key: 'champion', label: 'Champion', q: 'Who inside is selling for us?' }
  ];
  G.INSIGHT_KINDS = {
    objections: { label: 'Objections', one: 'objection' },
    questions: { label: 'Questions buyers ask', one: 'question' },
    pains: { label: 'Pains', one: 'pain' },
    competitors: { label: 'Competitors', one: 'competitor' },
    feedback: { label: 'Product feedback', one: 'product request' },
    positives: { label: 'What lands well', one: 'positive reaction' }
  };

  /* ---------- transcript parsing ---------- */
  var TIME = '(\\d{1,2}:\\d{2}(?::\\d{2})?(?:\\.\\d+)?)';
  var reTimeNameText = new RegExp('^\\s*[\\[(]?' + TIME + '[\\])]?\\s*[-–|]?\\s*([^:\\n]{2,48}?):\\s+(.+)$');
  var reNameTimeText = new RegExp('^\\s*([A-Za-z][^:\\n\\d]{1,46}?)\\s*[\\[(]' + TIME + '[\\])]\\s*:?\\s*(.*)$');
  var reNameText = /^\s*([A-Z][A-Za-z.'\- ]{0,40}[A-Za-z.])\s*:\s+(.+)$/;
  var reHeaderNameTime = new RegExp('^\\s*([A-Za-z][A-Za-z.\'\\- ]{1,46}?)\\s+[\\[(]?' + TIME + '[\\])]?\\s*$');
  var reHeaderTimeName = new RegExp('^\\s*[\\[(]?' + TIME + '[\\])]?\\s*[-–|]?\\s*([A-Za-z][A-Za-z.\'\\- ]{1,46})\\s*$');
  var reVttCue = /-->/;
  var reVttVoice = /^\s*<v\s+([^>]+)>\s*(.*?)(?:<\/v>)?\s*$/i;
  function cleanName(n) { return String(n || '').replace(/\s+/g, ' ').trim(); }
  function badName(n) { return !n || /https?|www\.|^\d|^(note|notes|summary|action items?|agenda|transcript)$/i.test(n) || n.split(' ').length > 5; }

  G.parseTranscript = function (text) {
    var lines = String(text || '').replace(/\r/g, '').split('\n');
    var segs = [], cur = null, time = '';
    function push(speaker, t, txt) {
      txt = String(txt || '').trim();
      if (!txt) { cur = { speaker: speaker, time: t, text: '' }; segs.push(cur); return; }
      if (cur && cur.speaker === speaker && !cur.text) { cur.text = txt; if (!cur.time) cur.time = t; return; }
      cur = { speaker: speaker, time: t, text: txt }; segs.push(cur);
    }
    lines.forEach(function (raw) {
      var line = raw.trim(), m;
      if (!line || /^WEBVTT/i.test(line) || /^\d+$/.test(line)) return;
      if (reVttCue.test(line)) { time = (line.match(/(\d{1,2}:\d{2}(?::\d{2})?)/) || [])[1] || ''; return; }
      if ((m = line.match(reVttVoice))) { push(cleanName(m[1]), time, m[2]); return; }
      if ((m = line.match(reTimeNameText)) && !badName(cleanName(m[2]))) { push(cleanName(m[2]), m[1], m[3]); return; }
      if ((m = line.match(reNameTimeText)) && !badName(cleanName(m[1]))) { push(cleanName(m[1]), m[2], m[3]); return; }
      if ((m = line.match(reHeaderTimeName)) && !badName(cleanName(m[2]))) { push(cleanName(m[2]), m[1], ''); return; }
      if ((m = line.match(reHeaderNameTime)) && !badName(cleanName(m[1]))) { push(cleanName(m[1]), m[2], ''); return; }
      if ((m = line.match(reNameText)) && !badName(cleanName(m[1]))) { push(cleanName(m[1]), time, m[2]); return; }
      if (cur) cur.text += (cur.text ? ' ' : '') + line;
      else { cur = { speaker: 'Unknown', time: '', text: line }; segs.push(cur); }
    });
    segs = segs.filter(function (s) { return s.text; });
    // Merge consecutive turns by the same speaker.
    var merged = [];
    segs.forEach(function (s) { var last = merged[merged.length - 1]; if (last && last.speaker === s.speaker) last.text += ' ' + s.text; else merged.push({ speaker: s.speaker, time: s.time, text: s.text }); });
    merged.forEach(function (s, i) { s.i = i; s.words = s.text.split(/\s+/).filter(Boolean).length; });
    var speakers = {};
    merged.forEach(function (s) { var x = speakers[s.speaker] || (speakers[s.speaker] = { name: s.speaker, words: 0, turns: 0 }); x.words += s.words; x.turns++; });
    var list = Object.keys(speakers).map(function (k) { return speakers[k]; }).sort(function (a, b) { return b.words - a.words; });
    return { segments: merged, speakers: list, words: merged.reduce(function (n, s) { return n + s.words; }, 0) };
  };

  // Which speakers are on our side: names in the team list, or the people the operator ticked.
  G.guessSide = function (name, teamNames) {
    var n = String(name || '').toLowerCase();
    return (teamNames || []).some(function (t) {
      t = String(t || '').toLowerCase().trim(); if (!t) return false;
      return n === t || n.split(' ')[0] === t.split(' ')[0] && (n.split(' ').length === 1 || t.split(' ').length === 1 || n === t);
    }) ? 'seller' : 'buyer';
  };
  G.talkShare = function (call) {
    var p = G.parseTranscript(call.transcript), sides = call.sides || {}, buyer = 0, seller = 0, unknown = 0;
    p.speakers.forEach(function (s) { var side = sides[s.name] || 'unknown'; if (side === 'buyer') buyer += s.words; else if (side === 'seller') seller += s.words; else unknown += s.words; });
    var known = buyer + seller;
    return { buyer: buyer, seller: seller, unknown: unknown, buyerShare: known ? buyer / known : null, speakers: p.speakers.length, words: p.words };
  };

  /* ---------- call score: is this call going well? ---------- */
  G.callScore = function (call) {
    var a = call.analysis;
    if (!a) return { score: null, label: 'Not analyzed', tone: 'muted', reasons: [] };
    var pts = 0, max = 0, reasons = [];
    function add(w, got, good, bad) { max += w; pts += got * w; if (got >= 0.7 && good) reasons.push({ good: true, text: good }); else if (got < 0.4 && bad) reasons.push({ good: false, text: bad }); }
    var ns = a.nextStep || {};
    add(30, ns.agreed ? (ns.date ? 1 : 0.8) : 0, 'Next step agreed' + (ns.text ? ': ' + ns.text : ''), 'No clear next step agreed');
    var mood = { positive: 1, mixed: 0.5, negative: 0, unclear: 0.4 }[a.sentiment] != null ? { positive: 1, mixed: 0.5, negative: 0, unclear: 0.4 }[a.sentiment] : 0.4;
    add(20, mood, 'Buyer was positive', a.sentiment === 'negative' ? 'Buyer was negative' : 'Buyer\'s mood unclear or mixed');
    var ts = G.talkShare(call);
    if (ts.buyerShare !== null) {
      var bs = ts.buyerShare, s = bs >= 0.4 && bs <= 0.75 ? 1 : bs > 0.75 ? 0.8 : bs >= 0.25 ? 0.5 : 0.1;
      add(15, s, 'Buyer did ' + Math.round(bs * 100) + '% of the talking', 'Buyer only did ' + Math.round(bs * 100) + '% of the talking');
    }
    var obj = a.objections || [];
    if (obj.length) {
      var h = obj.reduce(function (n, o) { return n + (o.handled === 'yes' ? 1 : o.handled === 'partly' ? 0.5 : 0); }, 0) / obj.length;
      add(20, h, 'Objections were answered', obj.filter(function (o) { return o.handled !== 'yes'; }).length + ' objection(s) left open');
    } else add(20, 0.85, null, null);
    var m = a.meddic || {}, cov = G.MEDDIC.reduce(function (n, x) { var st = (m[x.key] || {}).status; return n + (st === 'known' ? 1 : st === 'partial' ? 0.5 : 0); }, 0) / G.MEDDIC.length;
    add(15, cov, 'MEDDIC well covered', 'Most of MEDDIC still unknown');
    var score = Math.round(pts / max * 100);
    var label = score >= 70 ? 'Going well' : score >= 45 ? 'Mixed' : 'At risk';
    return { score: score, label: label, tone: score >= 70 ? 'ok' : score >= 45 ? 'warn' : 'bad', reasons: reasons, talk: ts, meddicCoverage: cov };
  };

  /* ---------- deals ---------- */
  G.FIELDS.deals = [
    { key: 'dealId', label: 'HubSpot deal ID', syn: ['deal id', 'record id', 'hs_object_id', 'id'] },
    { key: 'name', label: 'Deal name', required: true, syn: ['deal name', 'name', 'deal'] },
    { key: 'stage', label: 'Deal stage', syn: ['deal stage', 'stage', 'dealstage'] },
    { key: 'amount', label: 'Amount', syn: ['amount', 'deal amount', 'value'] },
    { key: 'company', label: 'Company name', syn: ['company', 'company name', 'associated company', 'account'] },
    { key: 'domain', label: 'Company domain', syn: ['domain', 'company domain', 'website'] },
    { key: 'owner', label: 'Deal owner', syn: ['deal owner', 'owner', 'hubspot owner'] },
    { key: 'closeDate', label: 'Close date', syn: ['close date', 'closedate', 'expected close date'] },
    { key: 'pipeline', label: 'Pipeline', syn: ['pipeline'] }
  ];
  G.importDeals = function (t, rows, mapping) {
    t.deals = t.deals || [];
    var res = { added: 0, updated: 0 };
    rows.forEach(function (raw) {
      var r = G.mapRow(raw, mapping);
      if (!r.name) return;
      var d = (r.dealId && t.deals.find(function (x) { return x.crmId === r.dealId; })) || t.deals.find(function (x) { return !x.crmId && x.name.toLowerCase() === r.name.toLowerCase(); });
      var dom = G.normDomain(r.domain);
      var acc = (dom && G.accountByDomain(t, dom)) || (r.company && t.accounts.find(function (a) { return a.name.toLowerCase() === r.company.toLowerCase(); })) || null;
      var fields = { crmId: r.dealId || '', name: r.name, stage: r.stage || '', amount: G.toNum(r.amount), company: r.company || (acc ? acc.name : ''), accountId: acc ? acc.id : null, owner: r.owner || '', closeDate: G.toDate(r.closeDate), pipeline: r.pipeline || '' };
      if (!d) { d = Object.assign({ id: G.uid('deal'), source: 'HubSpot export', createdAt: G.now() }, fields); t.deals.push(d); res.added++; }
      else { Object.keys(fields).forEach(function (k) { if (fields[k] !== '' && fields[k] !== null) d[k] = fields[k]; }); d.updatedAt = G.now(); res.updated++; }
    });
    return res;
  };
  G.dealCalls = function (t, deal) { return (t.calls || []).filter(function (c) { return c.dealId === deal.id; }).sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); }); };
  G.dealSummary = function (t, deal, opts) {
    var calls = G.dealCalls(t, deal), analyzed = calls.filter(function (c) { return c.analysis; });
    var meddic = {};
    G.MEDDIC.forEach(function (x) {
      var best = { status: 'unknown', note: '', callId: null };
      analyzed.forEach(function (c) { var e = (c.analysis.meddic || {})[x.key] || {}; var rank = { known: 2, partial: 1 }[e.status] || 0; if (rank > ({ known: 2, partial: 1 }[best.status] || 0) || (rank && rank === ({ known: 2, partial: 1 }[best.status] || 0))) best = { status: e.status, note: e.note || '', callId: c.id }; });
      meddic[x.key] = best;
    });
    var scores = analyzed.map(function (c) { return G.callScore(c).score; });
    var last = analyzed[analyzed.length - 1], lastScore = last ? G.callScore(last) : null;
    var trend = scores.length > 1 ? scores[scores.length - 1] - scores[scores.length - 2] : 0;
    var open = last ? (last.analysis.objections || []).filter(function (o) { return o.handled !== 'yes'; }) : [];
    var now = (opts && opts.now) || Date.now();
    var lastDate = calls.length ? calls[calls.length - 1].date : null, idle = lastDate ? G.daysBetween(lastDate, now) : null;
    var cov = G.MEDDIC.reduce(function (n, x) { return n + ({ known: 1, partial: 0.5 }[meddic[x.key].status] || 0); }, 0) / G.MEDDIC.length;
    var health = null, reasons = [];
    if (lastScore) {
      health = Math.round(lastScore.score * 0.6 + cov * 100 * 0.3 + (idle === null ? 0 : idle <= 14 ? 10 : idle <= 30 ? 5 : 0));
      if (trend > 5) reasons.push({ good: true, text: 'Calls are trending better (+' + trend + ')' });
      if (trend < -5) reasons.push({ good: false, text: 'Latest call scored lower than the one before (' + trend + ')' });
      if (idle !== null && idle > 21) reasons.push({ good: false, text: 'No call in ' + idle + ' days' });
      if (meddic.economicBuyer.status === 'unknown') reasons.push({ good: false, text: 'Economic buyer not identified' });
      if (meddic.champion.status === 'known') reasons.push({ good: true, text: 'Champion identified' });
      if (open.length) reasons.push({ good: false, text: open.length + ' objection(s) still open' });
      if (last.analysis.nextStep && last.analysis.nextStep.agreed) reasons.push({ good: true, text: 'Next step: ' + (last.analysis.nextStep.text || 'agreed') });
    }
    return {
      calls: calls, analyzed: analyzed.length, meddic: meddic, meddicCoverage: cov, lastScore: lastScore, trend: trend, openObjections: open, idle: idle, health: health,
      label: health === null ? (calls.length ? 'Not analyzed' : 'No calls yet') : health >= 70 ? 'Going well' : health >= 45 ? 'Mixed' : 'At risk',
      tone: health === null ? 'muted' : health >= 70 ? 'ok' : health >= 45 ? 'warn' : 'bad', reasons: reasons
    };
  };

  /* ---------- trends across calls ---------- */
  function topicKey(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  G.trendCalls = function (t, f) {
    f = f || {};
    return (t.calls || []).filter(function (c) {
      if (!c.analysis) return false;
      if (f.from && c.date < f.from) return false;
      if (f.to && c.date > f.to) return false;
      if (f.dealId && c.dealId !== f.dealId) return false;
      if (f.rep && !(c.reps || []).some(function (r) { return r === f.rep; })) return false;
      if (f.stage) { var d = c.dealId && (t.deals || []).find(function (x) { return x.id === c.dealId; }); if (!d || d.stage !== f.stage) return false; }
      return true;
    });
  };
  G.trends = function (t, f) {
    var calls = G.trendCalls(t, f);
    var out = { calls: calls.length, kinds: {} };
    Object.keys(G.INSIGHT_KINDS).forEach(function (kind) {
      var map = {};
      calls.forEach(function (c) {
        var seenInCall = {};
        (c.analysis[kind] || []).forEach(function (it) {
          var label = it.topic || it.name || it.text; if (!label) return;
          var k = topicKey(label), e = map[k] || (map[k] = { label: label, calls: [], accounts: [], deals: [], mentions: [], handled: { yes: 0, partly: 0, no: 0 }, severity: 0, types: {} });
          e.mentions.push({ callId: c.id, quote: it.quote || '', note: it.response || it.context || it.note || '', handled: it.handled, date: c.date });
          if (!seenInCall[k]) { seenInCall[k] = 1; e.calls.push(c.id); if (c.accountId && e.accounts.indexOf(c.accountId) < 0) e.accounts.push(c.accountId); if (c.dealId && e.deals.indexOf(c.dealId) < 0) e.deals.push(c.dealId); }
          if (it.handled && e.handled[it.handled] != null) e.handled[it.handled]++;
          if (it.severity) e.severity = Math.max(e.severity, { low: 1, medium: 2, high: 3 }[it.severity] || 0);
          if (it.type) e.types[it.type] = (e.types[it.type] || 0) + 1;
        });
      });
      out.kinds[kind] = Object.keys(map).map(function (k) { var e = map[k]; e.key = k; e.share = calls.length ? e.calls.length / calls.length : 0; return e; })
        .sort(function (a, b) { return b.calls.length - a.calls.length || b.mentions.length - a.mentions.length; });
    });
    return out;
  };
  // Compare with the previous period of the same length: what is new, what grew.
  G.trendChange = function (t, f) {
    if (!f || !f.from || !f.to) return null;
    var len = new Date(f.to) - new Date(f.from), prev = Object.assign({}, f, { from: new Date(new Date(f.from) - len).toISOString(), to: f.from });
    var a = G.trends(t, f), b = G.trends(t, prev), res = {};
    Object.keys(a.kinds).forEach(function (kind) {
      var pm = {}; b.kinds[kind].forEach(function (e) { pm[e.key] = e; });
      res[kind] = {}; a.kinds[kind].forEach(function (e) { var p = pm[e.key]; res[kind][e.key] = p ? { prevCalls: p.calls.length, isNew: false } : { prevCalls: 0, isNew: true }; });
    });
    return { prevCalls: b.calls, kinds: res };
  };
  G.knownTopics = function (t, kind, n) {
    var tr = G.trends(t, {}); return (tr.kinds[kind] || []).slice(0, n || 40).map(function (e) { return e.label; });
  };

  if (typeof module === 'object' && module.exports) module.exports = G;
})(this);
