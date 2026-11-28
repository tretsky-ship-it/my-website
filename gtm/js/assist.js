/* Claude suggestions: drafts an ICP (firmographics, triggers, disqualifiers, personas) or a campaign brief
   from what the operator has entered. Suggestions land in an editable draft, labelled as assumptions,
   and nothing is approved automatically. Inside claude.ai the page asks Claude directly (the "sample"
   capability); anywhere else it falls back to copy-the-prompt / paste-the-answer. */
(function () {
  'use strict';
  var G = window.GTM, App = window.App, S = App.S, esc = App.esc, I = App.icon, A = App.act;

  var cap = null, capTried = false;
  function getCap() {
    if (capTried) return Promise.resolve(cap);
    capTried = true;
    if (!App.hosted) return Promise.resolve(null);
    try { return window.claude.use('sample').then(function (s) { cap = s; return s; }, function () { return null; }); } catch (e) { return Promise.resolve(null); }
  }
  if (App.hosted) getCap();

  function parseLoose(txt) {
    txt = String(txt || '').trim();
    var fence = txt.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) txt = fence[1];
    var a = txt.indexOf('{'), b = txt.lastIndexOf('}');
    if (a < 0 || b < a) throw new Error('No JSON object found');
    return JSON.parse(txt.slice(a, b + 1));
  }
  function strs(v, max) { return (Array.isArray(v) ? v : []).map(function (x) { return String(x == null ? '' : x).trim(); }).filter(Boolean).slice(0, max || 12); }
  function str(v, n) { return String(v == null ? '' : v).trim().slice(0, n || 600); }
  function int(v) { var n = G.toInt(v); return n === null ? null : Math.max(0, n); }

  /* ---------- what Claude is told about the client ---------- */
  function clientContext(t) {
    var p = t.profile, out = [
      'Client: ' + (p.name || 'unnamed'),
      p.website ? 'Website: ' + p.website : '',
      p.offer ? 'Offer being sold: ' + p.offer : '',
      p.geography ? 'Target geography: ' + p.geography : '',
      p.notes ? 'Discovery notes: ' + p.notes : ''
    ];
    var proof = t.proof.filter(function (x) { return x.status !== 'retired'; }).map(function (x) { return '- ' + x.text; });
    if (proof.length) out.push('Proof on file:\n' + proof.join('\n'));
    var budget = 9000, srcs = [];
    t.sources.filter(function (s) { return !s.withdrawn; }).forEach(function (s) {
      var line = '- ' + s.title + ' (' + s.type + ', ' + (s.date || 'undated') + ')';
      if (s.content && budget > 0) { var c = s.content.slice(0, Math.min(3500, budget)); budget -= c.length; line += ':\n' + c; }
      srcs.push(line);
    });
    if (srcs.length) out.push('Client sources:\n' + srcs.join('\n'));
    var won = t.accounts.filter(function (a) { return a.flags.customer; }).slice(0, 15).map(function (a) { return a.name + ' (' + [a.industry, a.employees ? a.employees + ' employees' : '', a.country].filter(Boolean).join(', ') + ')'; });
    if (won.length) out.push('Existing customers: ' + won.join('; '));
    return out.filter(Boolean).join('\n');
  }
  App.askClaude = function (o) { return ask(o); };
  // Run one AI request without a dialog (for batch work). Rejects {code:'unavailable'} where the page can't reach the AI.
  App.aiJSON = function (prompt) {
    return getCap().then(function (s) {
      if (!s) throw { code: 'unavailable' };
      return s.json(prompt, { modelTier: 'default', cache: false }).catch(function (e) { if (e && e.code === 'invalid_json' && e.text) return parseLoose(e.text); throw e; });
    });
  };
  App.parseLoose = function (x) { return parseLoose(x); };
  App.canSuggest = function (t) { return !!(t.profile.website || t.profile.offer || t.sources.length); };

  /* ---------- generic ask-Claude modal ---------- */
  function ask(o) {
    var m = App.modal({ title: o.title, sub: o.sub, wide: true, body: '', actions: [] });
    var ctl = null;
    function start() {
      getCap().then(function (s) { if (s) live(s); else manual(); });
    }
    function live(s) {
      m.setBody('<div class="note info">' + I('sparkle') + '<div class="grow"><b>GTM Engine is working on it…</b> Usually 15–40 seconds. Based on: ' + esc(o.basis) + '</div></div><pre id="ai-stream" class="small muted" style="white-space:pre-wrap;max-height:240px;overflow:auto;margin:0;font:12px/1.5 var(--mono)"></pre>');
      m.setActions([{ label: 'Cancel', cls: 'ghost', onClick: function () { if (ctl) ctl.abort(); } }]);
      ctl = new AbortController();
      var out = m.body.querySelector('#ai-stream');
      s.json(o.prompt, { modelTier: 'default', signal: ctl.signal, cache: false, onText: function (u) { if (out && out.isConnected) { out.textContent = u.text.slice(-1500); out.scrollTop = out.scrollHeight; } } })
        .then(function (data) { show(data); }, function (e) {
          var code = e && e.code;
          if (code === 'aborted' || (ctl && ctl.signal.aborted)) return;
          if (code === 'not_granted') { manual('AI access was declined for this page, so use the copy-and-paste route instead.'); return; }
          if (code === 'rate_limited') { m.setBody('<div class="note warn">' + I('alert') + '<span class="grow">GTM Engine\'s AI is busy or your usage limit is reached. Wait a minute, then try again.</span></div>'); m.setActions([{ label: 'Close', cls: 'ghost' }, { label: 'Try again', cls: 'primary', onClick: function () { start(); return false; } }]); return; }
          if (code === 'invalid_json' && e.text) { try { show(parseLoose(e.text)); return; } catch (x) { } }
          m.setBody('<div class="note bad">' + I('alert') + '<span class="grow">GTM Engine did not get a usable answer' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</span></div>');
          m.setActions([{ label: 'Use copy and paste', cls: 'ghost', onClick: function () { manual(); return false; } }, { label: 'Try again', cls: 'primary', onClick: function () { start(); return false; } }]);
        });
    }
    function manual(why) {
      m.setBody((why ? '<div class="note warn">' + I('alert') + '<span class="grow">' + esc(why) + '</span></div>' : '<div class="note info">' + I('info') + '<span class="grow">GTM Engine can\'t run this automatically here. Copy this prompt into your AI assistant, then paste its answer below. (In the hosted version of GTM Engine, it runs with one click.)</span></div>') +
        '<div class="field"><label>1. Prompt</label><textarea readonly rows="7" style="font:12px/1.5 var(--mono)">' + esc(o.prompt) + '</textarea></div>' +
        '<div class="field"><label for="ai-paste">2. Paste the answer</label><textarea id="ai-paste" rows="6" placeholder="{ ... }" style="font:12px/1.5 var(--mono)"></textarea></div>');
      m.setActions([{ label: 'Copy prompt', cls: 'ghost', icon: 'copy', onClick: function () { App.copy(o.prompt, 'Prompt copied'); return false; } }, {
        label: 'Use this answer', cls: 'primary', onClick: function () {
          try { show(parseLoose(m.body.querySelector('#ai-paste').value)); } catch (e) { App.toast('That answer has no readable JSON. Paste the whole reply.', 'bad'); }
          return false;
        }
      }]);
    }
    function show(data) {
      var clean = o.clean(data);
      if (clean && clean.empty) {
        m.setBody('<div class="note warn">' + I('info') + '<span class="grow">' + clean.message + '</span></div>');
        m.setActions((clean.actions || []).concat([{ label: 'Try again', cls: 'ghost', onClick: function () { start(); return false; } }, { label: 'Close', cls: 'primary' }]));
        return;
      }
      if (!clean) { m.setBody('<div class="note bad">' + I('alert') + '<span class="grow">GTM Engine\'s answer wasn\'t in a form it could read. Try again; if it keeps happening, ask for fewer at a time.</span></div>'); m.setActions([{ label: 'Close', cls: 'ghost' }, { label: 'Try again', cls: 'primary', onClick: function () { start(); return false; } }]); return; }
      m.setBody(o.preview(clean));
      m.setActions([{ label: 'Ask again', cls: 'ghost', onClick: function () { start(); return false; } }, {
        label: o.applyLabel, cls: 'primary', icon: 'check', onClick: function () {
          var picks = {}; m.body.querySelectorAll('[data-pick]').forEach(function (c) { picks[c.getAttribute('data-pick')] = c.checked; });
          var mode = m.body.querySelector('[name="ai-mode"]:checked');
          o.apply(clean, picks, mode ? mode.value : 'merge');
        }
      }]);
    }
    start();
  }

  /* ================= ICP suggestion ================= */
  function icpPrompt(t) {
    var cur = G.draftICP(t) || G.activeICP(t);
    return 'You are a B2B go-to-market strategist building a first-draft Ideal Customer Profile for an outbound pilot. Use the client information below. If you recognise the company from its website, use what you know, but do not invent customers, numbers or quotes.\n\n' +
      clientContext(t) + '\n' + (cur && cur.personas.length ? '\nCurrent draft personas: ' + cur.personas.map(function (p) { return p.name; }).join(', ') + '\n' : '') +
      '\nReply with ONLY a JSON object in exactly this shape:\n' +
      '{"summary":"2 sentences: who to target and why","industries":["3-6 industry names as a data provider would label them"],"employees":{"min":200,"max":2000},"geography":["countries"],' +
      '"triggers":{"keywords":["4-8 short phrases that would appear in a dated buying signal, e.g. hiring, new CFO, ERP migration"],"recencyDays":90},' +
      '"disqualifiers":{"industries":["industries to exclude"],"keywords":["red-flag words, e.g. bankruptcy"]},' +
      '"personas":[{"name":"short role-group name","priority":"primary or secondary","titles":["5-8 job-title keywords used to match contacts"],"pain":"the likely pain, written as an inference","question":"one discovery question that asks about that pain without asserting it","message":"one-sentence positioning line for this persona"}],' +
      '"custom":[{"label":"another qualifying criterion such as tech stack or funding stage","mandatory":false,"filterable":true}],' +
      '"rationale":"one short paragraph explaining the choices and what to verify"}\n' +
      'Give 2-3 personas (exactly one primary) and 0-3 custom criteria. Use the target geography above if given.';
  }
  function cleanICP(d) {
    if (!d || typeof d !== 'object') return null;
    var c = {
      summary: str(d.summary, 400), rationale: str(d.rationale, 1200),
      industries: strs(d.industries, 8), geography: strs(d.geography, 10),
      employees: { min: int(d.employees && d.employees.min), max: int(d.employees && d.employees.max) },
      triggers: { keywords: strs(d.triggers && d.triggers.keywords, 10), recencyDays: int(d.triggers && d.triggers.recencyDays) || 90 },
      disqualifiers: { industries: strs(d.disqualifiers && d.disqualifiers.industries, 8), keywords: strs(d.disqualifiers && d.disqualifiers.keywords, 8) },
      personas: (Array.isArray(d.personas) ? d.personas : []).slice(0, 4).map(function (p) {
        return { name: str(p && p.name, 60), priority: /second/i.test(p && p.priority) ? 'secondary' : 'primary', titles: strs(p && p.titles, 10), pain: str(p && p.pain, 300), question: str(p && p.question, 300), message: str(p && p.message, 300) };
      }).filter(function (p) { return p.name && p.titles.length; }),
      custom: (Array.isArray(d.custom) ? d.custom : []).slice(0, 4).map(function (x) { return { label: str(x && x.label, 120), mandatory: !!(x && x.mandatory), filterable: !!(x && x.filterable) }; }).filter(function (x) { return x.label; })
    };
    if (c.employees.min !== null && c.employees.max !== null && c.employees.min > c.employees.max) c.employees = { min: c.employees.max, max: c.employees.min };
    var prim = c.personas.filter(function (p) { return p.priority === 'primary'; });
    if (c.personas.length && prim.length !== 1) c.personas.forEach(function (p, i) { p.priority = i ? 'secondary' : 'primary'; });
    if (!c.industries.length && !c.personas.length) return null;
    return c;
  }
  function chips(arr) { return arr.length ? arr.map(function (v) { return '<span class="tag" style="padding-right:8px">' + esc(v) + '</span>'; }).join(' ') : '<span class="faint small">none</span>'; }
  function pick(key, label, body) {
    return '<div class="persona" style="gap:8px"><label class="check"><input type="checkbox" data-pick="' + key + '" checked><b>' + label + '</b></label><div>' + body + '</div></div>';
  }
  function previewICP(c) {
    var t = S.t, d = G.draftICP(t);
    return (c.summary ? '<div class="note info">' + I('sparkle') + '<span class="grow">' + esc(c.summary) + '</span></div>' : '') +
      '<div class="small muted">Untick anything you don\'t want. Everything stays editable and is labelled <b>Assumption</b> until you attach a source. Nothing is approved automatically.</div>' +
      '<div class="grid2">' +
        pick('industries', 'Target industries', chips(c.industries)) +
        pick('size', 'Employee range', esc((c.employees.min != null ? c.employees.min : '…') + ' – ' + (c.employees.max != null ? c.employees.max : '…'))) +
        pick('geography', 'Geography', chips(c.geography)) +
        pick('triggers', 'Trigger keywords · ' + c.triggers.recencyDays + ' days', chips(c.triggers.keywords)) +
        pick('disqualifiers', 'Disqualifiers', chips(c.disqualifiers.industries.concat(c.disqualifiers.keywords))) +
        (c.custom.length ? pick('custom', 'Other criteria', c.custom.map(function (x) { return '<div class="small">' + esc(x.label) + (x.mandatory ? ' <span class="badge warn plain">mandatory</span>' : '') + '</div>'; }).join('')) : '') +
      '</div>' +
      '<div class="label">Buyer personas</div><div class="stack sm">' + c.personas.map(function (p, i) {
        return pick('persona' + i, esc(p.name) + ' <span class="badge ' + (p.priority === 'primary' ? 'accent' : 'muted') + ' plain">' + p.priority + '</span>',
          chips(p.titles) + '<div class="small" style="margin-top:8px"><span class="muted">Likely pain (inference):</span> ' + esc(p.pain) + '</div><div class="small"><span class="muted">Question:</span> ' + esc(p.question) + '</div><div class="small"><span class="muted">Message:</span> ' + esc(p.message) + '</div>');
      }).join('') + '</div>' +
      (c.rationale ? '<details><summary class="small muted" style="cursor:pointer">Why these choices</summary><p class="small" style="margin-top:6px">' + esc(c.rationale) + '</p></details>' : '') +
      (d && (d.industries.values.length || d.personas.length) ? '<div class="row"><label class="check"><input type="radio" name="ai-mode" value="merge" checked> Add to my draft (keep what I already entered)</label><label class="check"><input type="radio" name="ai-mode" value="replace"> Replace the ticked sections</label></div>' : '');
  }
  function applyICP(c, pk, mode) {
    var t = S.t, d = G.draftICP(t), created = false;
    if (!d) { d = G.newDraftFrom(t, G.activeICP(t)); created = true; }
    var rep = mode === 'replace';
    function list(target, vals) {
      if (rep) target.length = 0;
      vals.forEach(function (v) { if (!target.some(function (x) { return x.toLowerCase() === v.toLowerCase(); })) target.push(v); });
    }
    if (pk.industries) list(d.industries.values, c.industries);
    if (pk.size) { if (rep || d.size.min === null) d.size.min = c.employees.min; if (rep || d.size.max === null) d.size.max = c.employees.max; }
    if (pk.geography) list(d.geography.values, c.geography);
    if (pk.triggers) { list(d.triggers.keywords, c.triggers.keywords); if (rep || !d.triggers.recencyDays) d.triggers.recencyDays = c.triggers.recencyDays; }
    if (pk.disqualifiers) { list(d.disqualifiers.industries, c.disqualifiers.industries); list(d.disqualifiers.keywords, c.disqualifiers.keywords); }
    if (pk.custom) { if (rep) d.custom.length = 0; c.custom.forEach(function (x) { if (!d.custom.some(function (y) { return y.label.toLowerCase() === x.label.toLowerCase(); })) d.custom.push({ id: G.uid('cu'), label: x.label, mandatory: x.mandatory, filterable: x.filterable, basis: [] }); }); }
    var chosen = c.personas.filter(function (p, i) { return pk['persona' + i]; });
    if (chosen.length) {
      if (rep) d.personas.length = 0;
      chosen.forEach(function (p) {
        var ex = d.personas.find(function (x) { return x.name.toLowerCase() === p.name.toLowerCase(); });
        if (ex) { list(ex.titles, p.titles); ['pain', 'question', 'message'].forEach(function (k) { if (!ex[k]) ex[k] = p[k]; }); }
        else d.personas.push({ id: G.uid('per'), name: p.name, priority: d.personas.some(function (x) { return x.priority === 'primary'; }) ? 'secondary' : p.priority, titles: p.titles.slice(), pain: p.pain, question: p.question, message: p.message, suggested: true });
      });
    }
    ['industry', 'size', 'trigger', 'buyer'].forEach(function (k) { if (d.weights[k] === null) d.weights[k] = G.SUGGESTED_WEIGHTS[k]; });
    if (d.cutoff === null) d.cutoff = 70;
    if (!d.note) d.note = 'First draft suggested by GTM Engine from the client intake; criteria are assumptions until sourced.';
    G.log(t, 'GTM Engine (suggestion)', 'Suggested ICP v' + d.v + ' criteria', Object.keys(pk).filter(function (k) { return pk[k]; }).length + ' sections ' + (rep ? 'replaced' : 'added'));
    S.ui.icpV = d.v;
    App.save();
    if (S.route === 'icp') App.render(); else App.go('#/icp');
    App.toast((created ? 'Draft v' + d.v + ' created. ' : '') + 'Suggestions added. Review, edit, then approve.');
  }
  App.suggestICP = function () {
    var t = S.t;
    if (!App.canSuggest(t)) { App.toast('Add the client website, offer or a source first, so there is something to go on', 'bad'); App.go('#/setup'); return; }
    var basis = [t.profile.website && 'website', t.profile.offer && 'offer', t.profile.notes && 'discovery notes', t.sources.length && App.plural(t.sources.length, 'source'), t.proof.length && 'proof'].filter(Boolean).join(', ');
    ask({ title: 'Suggest an ICP with GTM Engine', sub: 'A first draft of firmographics, triggers, disqualifiers and buyer personas from your intake.', basis: basis, prompt: icpPrompt(t), clean: cleanICP, preview: previewICP, apply: applyICP, applyLabel: 'Add to ICP draft' });
  };
  A['ai-icp'] = function () { App.suggestICP(); };

  /* ================= Campaign brief suggestion ================= */
  // Drafts the whole brief from the client's sources: objective, persona, proof, pain points (with the
  // source each came from), hypothesis, CTA, success target and a 3-step sequence.
  var KPIS = ['Held meetings', 'Positive replies', 'Sourced pipeline'];
  function briefPrompt(t, c) {
    var icp = G.activeICP(t);
    var personas = icp ? icp.personas : [];
    var proofs = t.proof.filter(function (p) { return G.proofUsable(t, p).ok; });
    var triggers = G.uniq(t.accounts.map(function (a) { return a.trigger.text; }).filter(Boolean)).slice(0, 8);
    var others = t.campaigns.filter(function (x) { return x !== c && x.hypothesis; }).map(function (x) { return '- ' + x.name + ': ' + x.hypothesis; });
    return 'You are a B2B outbound strategist and copywriter. Using the client sources below, draft a complete campaign brief and a 3-step cold email sequence. Ground every pain point in what the sources actually say, and name the source title it came from.\n\n' + clientContext(t) +
      '\n\nBuyer personas to choose from (pick the one the sources give the strongest case for):\n' + (personas.length ? personas.map(function (p, i) { return 'P' + (i + 1) + ': ' + p.name + ' (' + p.priority + '), titles ' + p.titles.slice(0, 5).join(', ') + (p.pain ? '; believed pain: ' + p.pain : '') + (p.message ? '; approved message: ' + p.message : ''); }).join('\n') : 'none') +
      '\n\nApproved public proof to choose from (or none):\n' + (proofs.length ? proofs.map(function (p, i) { return 'R' + (i + 1) + ': ' + p.text; }).join('\n') : 'none available') +
      (icp ? '\n\nICP: industries ' + icp.industries.values.join(', ') + '; buying signals ' + icp.triggers.keywords.join(', ') : '') +
      (triggers.length ? '\nExample account triggers on file: ' + triggers.join('; ') : '') +
      (others.length ? '\nExisting campaigns (test a different angle):\n' + others.join('\n') : '') +
      (c.personaId && personas.some(function (p) { return p.id === c.personaId; }) ? '\nThe operator already chose persona P' + (personas.findIndex(function (p) { return p.id === c.personaId; }) + 1) + '; keep it unless the sources clearly argue otherwise.' : '') +
      '\n\nEmail rules: use only these tokens, exactly: {{first_name}}, {{company}}, {{personalization}} (a sourced fact about the account, filled in automatically), {{question}} (the persona\'s discovery question), {{proof}}, {{cta}}, {{sender_name}}. Never state a fact about the recipient\'s company outside {{personalization}}. Never assert their pain: ask about it. Step 1 under 90 words, plain text, no links. Steps 2 and 3 shorter, each adding a new angle, 3 and 5 days apart.' +
      '\n\nReply with ONLY a JSON object:\n{"name":"short campaign name","objective":"business objective in one sentence","persona":"P1","proof":"R1 or none","painPoints":[{"pain":"specific pain in the buyer\'s words","source":"source title it came from"}],"hypothesis":"If we tell X about Y, they will Z","cta":"one-line low-friction call to action","kpi":"Held meetings, Positive replies or Sourced pipeline","successCriterion":"measurable target for the first 25 delivered","windowDays":30,"steps":[{"subject":"...","body":"...","delayDays":0},{"subject":"...","body":"...","delayDays":3},{"subject":"...","body":"...","delayDays":5}]}';
  }
  function cleanBrief(d) {
    if (!d || typeof d !== 'object') return null;
    var t = S.t, icp = G.activeICP(t), personas = icp ? icp.personas : [];
    var proofs = t.proof.filter(function (p) { return G.proofUsable(t, p).ok; });
    var pm = String(d.persona || '').match(/P(\d+)/i), rm = String(d.proof || '').match(/R(\d+)/i);
    var per = pm ? personas[+pm[1] - 1] : null, pr = rm ? proofs[+rm[1] - 1] : null;
    var pains = (Array.isArray(d.painPoints) ? d.painPoints : []).slice(0, 4).map(function (x) { return typeof x === 'string' ? { pain: str(x, 200), source: '' } : { pain: str(x && x.pain, 200), source: str(x && x.source, 120) }; }).filter(function (x) { return x.pain; });
    var c = {
      name: str(d.name, 80), objective: str(d.objective, 400), hypothesis: str(d.hypothesis, 400), cta: str(d.cta, 200), successCriterion: str(d.successCriterion, 200),
      personaId: per ? per.id : null, personaName: per ? per.name : '', proofId: pr ? pr.id : null, proofText: pr ? pr.text : '',
      pains: pains, pain: pains.length ? pains.map(function (x) { return x.pain + (x.source ? ' (source: ' + x.source + ')' : ''); }).join('; ') : str(d.pain, 400),
      kpi: KPIS.find(function (k) { return k.toLowerCase() === String(d.kpi || '').toLowerCase(); }) || '', windowDays: int(d.windowDays),
      steps: (Array.isArray(d.steps) ? d.steps : []).slice(0, 4).map(function (s, i) { return { subject: str(s && s.subject, 120), body: str(s && s.body, 2000).replace(/\\n/g, '\n'), delayDays: i ? (int(s && s.delayDays) || 3) : 0 }; }).filter(function (s) { return s.body; })
    };
    return c.hypothesis || c.steps.length ? c : null;
  }
  var BRIEF_FIELDS = [['name', 'Campaign name'], ['objective', 'Business objective'], ['hypothesis', 'Hypothesis'], ['cta', 'Call to action'], ['kpi', 'Primary KPI'], ['successCriterion', 'Success criterion']];
  App.suggestBrief = function (cid, isNew) {
    var t = S.t, c = G.campaignById(t, cid);
    if (!G.activeICP(t)) { App.toast('Approve an ICP first', 'bad'); return; }
    var srcN = t.sources.filter(function (s) { return !s.withdrawn && s.content; }).length;
    ask({
      title: isNew ? 'Draft the campaign with GTM Engine' : 'Suggest a brief and sequence',
      sub: 'Built from your sources, personas, proof and ICP. Untick anything you don\'t want; everything stays editable.' + (srcN ? '' : ' Tip: paste call transcripts under Evidence & proof for sharper pain points.'),
      basis: App.plural(srcN, 'source with text', 'sources with text') + ', personas, proof and ICP', prompt: briefPrompt(t, c), clean: cleanBrief,
      preview: function (b) {
        var html = '<div class="small muted">' + (isNew ? 'Everything is ticked. Untick what you\'d rather write yourself.' : 'Ticked fields replace what is in the brief now.') + '</div><div class="grid2">' +
          BRIEF_FIELDS.filter(function (f) { return b[f[0]]; }).map(function (f) { return pick(f[0], f[1], '<div class="small">' + esc(b[f[0]]) + '</div>'); }).join('') +
          (b.personaId ? pick('personaId', 'Persona', '<div class="small">' + esc(b.personaName) + '</div>') : '') +
          pick('proofId', 'Proof to cite', '<div class="small">' + (b.proofId ? esc(b.proofText) : '<span class="muted">None. No usable proof fits, so emails won\'t cite results.</span>') + '</div>') +
          '</div>';
        if (b.pains.length || b.pain) html += pick('pain', 'Pain points from your sources', b.pains.length ? '<ul style="margin:0;padding-left:18px">' + b.pains.map(function (x) { return '<li class="small">' + esc(x.pain) + (x.source ? ' <span class="muted">· ' + esc(x.source) + '</span>' : ' <span class="faint">· no source named</span>') + '</li>'; }).join('') + '</ul>' : '<div class="small">' + esc(b.pain) + '</div>');
        if (b.steps.length) html += pick('steps', 'Email sequence (' + b.steps.length + ' steps)', b.steps.map(function (s, i) { return '<div class="email" style="margin-top:8px"><div class="subj"><small>Step ' + (i + 1) + (s.delayDays ? ' · +' + s.delayDays + 'd' : '') + '</small>' + esc(s.subject) + '</div><div class="body">' + esc(s.body) + '</div></div>'; }).join(''));
        return html;
      },
      applyLabel: isNew ? 'Use this draft' : 'Use in brief',
      apply: function (b, pk) {
        BRIEF_FIELDS.forEach(function (f) { if (pk[f[0]] && b[f[0]]) c[f[0]] = b[f[0]]; });
        if (pk.personaId && b.personaId) c.personaId = b.personaId;
        if (pk.proofId) c.proofId = b.proofId;
        if (pk.pain && b.pain) c.pain = b.pain;
        if (b.windowDays && (pk.kpi || isNew)) c.windowDays = b.windowDays;
        if (pk.steps && b.steps.length) c.steps = b.steps;
        c.channel = 'Email';
        G.log(t, 'GTM Engine (suggestion)', isNew ? 'Drafted new campaign brief' : 'Suggested campaign brief', c.name);
        App.save(); App.render(); App.toast('Brief filled in. Review it, check the live preview, then draft a batch.');
      }
    });
  };
  A['ai-brief'] = function (el) { App.suggestBrief(el.getAttribute('data-id'), false); };
})();
