/* GTM Engine: deterministic core.
   Everything that decides eligibility, scoring, dedupe, approval validity and metrics lives here,
   with no DOM access, so it can be tested in Node (see gtm/tests/engine.test.js).
   A "tenant" is one client's complete, isolated record set (the client's GTM Brain). */
(function (root) {
  'use strict';
  var G = {};

  /* ---------- small utilities ---------- */
  G.uid = function (p) {
    return (p || 'id') + '_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  };
  G.now = function () { return new Date().toISOString(); };
  G.clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  G.uniq = function (a) { return Array.from(new Set(a)); };

  /* FNV-1a 32-bit. Used for approval fingerprints and conflict keys, not for security. */
  G.hash = function (str) {
    var h = 0x811c9dc5;
    str = String(str);
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return ('0000000' + h.toString(16)).slice(-8);
  };

  G.normDomain = function (s) {
    if (!s) return '';
    var d = String(s).trim().toLowerCase();
    if (d.indexOf('@') > -1) d = d.split('@').pop();
    d = d.replace(/^[a-z]+:\/\//, '').replace(/^www\./, '');
    d = d.split(/[\/?#]/)[0].split(':')[0].replace(/\.$/, '');
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d) ? d : '';
  };
  G.normEmail = function (s) {
    var e = String(s || '').trim().toLowerCase();
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) ? e : '';
  };
  G.emailDomain = function (e) { return e ? e.split('@')[1] : ''; };
  G.toInt = function (v) {
    if (v === null || v === undefined || v === '') return null;
    var s = String(v).replace(/[, ]/g, '');
    var m = s.match(/^(\d+)(?:-(\d+))?\+?$/); // "200-500" -> midpoint
    if (m) return m[2] ? Math.round((+m[1] + +m[2]) / 2) : +m[1];
    var n = parseInt(s, 10);
    return isFinite(n) ? n : null;
  };
  G.toNum = function (v) {
    if (v === null || v === undefined || v === '') return null;
    var n = parseFloat(String(v).replace(/[$,£€\s]/g, ''));
    return isFinite(n) ? n : null;
  };
  G.toDate = function (v) {
    if (!v) return '';
    var d = new Date(v);
    return isNaN(d) ? '' : d.toISOString();
  };
  G.daysBetween = function (a, b) { return Math.floor((new Date(b) - new Date(a)) / 864e5); };

  /* ---------- CSV ---------- */
  G.parseCSV = function (text) {
    text = String(text || '').replace(/^﻿/, '');
    var rows = [], row = [], f = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
        else f += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(f); rows.push(row); row = []; f = '';
      } else f += c;
    }
    if (f !== '' || row.length) { row.push(f); rows.push(row); }
    rows = rows.filter(function (r) { return r.some(function (x) { return String(x).trim() !== ''; }); });
    if (!rows.length) return { headers: [], rows: [] };
    var headers = rows[0].map(function (h) { return String(h).trim(); });
    return {
      headers: headers,
      rows: rows.slice(1).map(function (r) {
        var o = {};
        headers.forEach(function (h, j) { o[h] = String(r[j] == null ? '' : r[j]).trim(); });
        return o;
      })
    };
  };
  G.toCSV = function (cols, rows) {
    function esc(v) {
      v = v === null || v === undefined ? '' : String(v);
      // Guard against spreadsheet formula injection, but leave plain numbers alone.
      if (/^[=+\-@\t]/.test(v) && !/^-?\d+(\.\d+)?$/.test(v)) v = "'" + v;
      return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }
    return [cols.map(function (c) { return esc(c.label || c.key); }).join(',')]
      .concat(rows.map(function (r) {
        return cols.map(function (c) { return esc(typeof c.get === 'function' ? c.get(r) : r[c.key]); }).join(',');
      })).join('\n');
  };

  /* ---------- import field specs & column auto-mapping ---------- */
  G.FIELDS = {
    accounts: [
      { key: 'name', label: 'Company name', syn: ['company', 'company name', 'account', 'account name', 'organization', 'organisation', 'name'] },
      { key: 'domain', label: 'Website or domain', required: true, syn: ['domain', 'website', 'company domain', 'url', 'site', 'web', 'company website'] },
      { key: 'industry', label: 'Industry', syn: ['industry', 'sector', 'vertical'] },
      { key: 'employees', label: 'Employees', syn: ['employees', 'employee count', 'headcount', 'company size', 'size', 'number of employees'] },
      { key: 'country', label: 'Country', syn: ['country', 'hq country', 'headquarters country', 'location', 'geo'] },
      { key: 'trigger', label: 'Trigger or signal', syn: ['trigger', 'signal', 'trigger event', 'news', 'event'] },
      { key: 'triggerDate', label: 'Trigger date', syn: ['trigger date', 'signal date', 'event date'] },
      { key: 'triggerUrl', label: 'Trigger source URL', syn: ['trigger url', 'signal url', 'source url', 'evidence url', 'trigger source'] },
      { key: 'crmId', label: 'HubSpot company ID', syn: ['hubspot id', 'hubspot company id', 'crm id', 'hs_object_id', 'record id', 'company id'] },
      { key: 'providerId', label: 'Provider ID (e.g. Databar)', syn: ['databar id', 'provider id', 'source id'] },
      { key: 'lifecycle', label: 'CRM status (customer / open deal)', syn: ['lifecycle', 'lifecycle stage', 'crm status', 'status'] }
    ],
    contacts: [
      { key: 'fullName', label: 'Full name', syn: ['name', 'full name', 'contact name', 'contact'] },
      { key: 'firstName', label: 'First name', syn: ['first name', 'firstname', 'first', 'given name'] },
      { key: 'lastName', label: 'Last name', syn: ['last name', 'lastname', 'last', 'surname', 'family name'] },
      { key: 'title', label: 'Job title', syn: ['title', 'job title', 'role', 'position', 'job'] },
      { key: 'email', label: 'Work email', syn: ['email', 'work email', 'email address', 'business email'] },
      { key: 'companyDomain', label: 'Company domain', syn: ['company domain', 'domain', 'website', 'company website', 'account domain'] },
      { key: 'verification', label: 'Email verification', syn: ['verification', 'email status', 'verification status', 'email verification', 'status'] },
      { key: 'provider', label: 'Provider', syn: ['provider', 'source', 'enrichment provider'] },
      { key: 'retrievedAt', label: 'Retrieved date', syn: ['retrieved', 'retrieved at', 'retrieved date', 'enriched at', 'date'] },
      { key: 'linkedin', label: 'LinkedIn URL', syn: ['linkedin', 'linkedin url', 'profile url'] },
      { key: 'crmId', label: 'HubSpot contact ID', syn: ['hubspot id', 'crm id', 'contact id', 'hs_object_id'] }
    ],
    events: [
      { key: 'eventId', label: 'Event ID', syn: ['event id', 'event_id', 'id', 'message id'] },
      { key: 'type', label: 'Event type', required: true, syn: ['type', 'event type', 'event', 'event_type', 'activity'] },
      { key: 'email', label: 'Contact email', syn: ['email', 'contact email', 'lead email', 'to'] },
      { key: 'occurredAt', label: 'Occurred at', syn: ['occurred at', 'occurred_at', 'timestamp', 'date', 'time', 'created at'] },
      { key: 'campaignId', label: 'Campaign ID', syn: ['campaign id', 'campaign_id', 'campaign'] },
      { key: 'dealId', label: 'Deal ID', syn: ['deal id', 'deal_id', 'opportunity id', 'deal'] },
      { key: 'amount', label: 'Amount', syn: ['amount', 'deal amount', 'value'] },
      { key: 'text', label: 'Reply text or note', syn: ['text', 'body', 'reply', 'note', 'notes', 'message'] }
    ],
    acks: [
      { key: 'email', label: 'Email', required: true, syn: ['email', 'lead email', 'email address'] },
      { key: 'status', label: 'Status', syn: ['status', 'result', 'state'] }
    ]
  };
  function nk(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  G.autoMap = function (headers, kind) {
    var fields = G.FIELDS[kind], map = {}, used = {};
    var H = headers.map(function (h) { return { h: h, n: nk(h) }; });
    fields.forEach(function (f) { // pass 1: exact synonym
      var hit = H.find(function (x) { return !used[x.h] && (x.n === nk(f.key) || x.n === nk(f.label) || f.syn.some(function (s) { return nk(s) === x.n; })); });
      if (hit) { map[f.key] = hit.h; used[hit.h] = 1; }
    });
    fields.forEach(function (f) { // pass 2: contains a longer synonym
      if (map[f.key]) return;
      var hit = H.find(function (x) { return !used[x.h] && f.syn.some(function (s) { return s.length >= 5 && x.n.indexOf(nk(s)) > -1; }); });
      if (hit) { map[f.key] = hit.h; used[hit.h] = 1; }
    });
    return map;
  };
  function mapRow(raw, mapping) {
    var o = {};
    Object.keys(mapping).forEach(function (k) { if (mapping[k]) o[k] = (raw[mapping[k]] || '').trim(); });
    return o;
  }
  G.mapRow = mapRow;

  /* ---------- tenant ---------- */
  G.newTenant = function (name) {
    return {
      schema: 1,
      id: G.uid('client'),
      createdAt: G.now(),
      paused: false,
      sample: false,
      profile: {
        name: name || '', website: '', offer: '', geography: '', outreachOwner: '', approver: '',
        budget: null, creditsPerAccount: null, costPerCredit: null, crm: 'HubSpot', channels: ['Email'],
        suppressCustomers: true, suppressOpenOpps: true, sender: '', responseTargetHours: 24, notes: ''
      },
      sources: [], proof: [], icp: [], accounts: [], conflicts: [], contacts: [], suppression: [],
      campaigns: [], batches: [], enrollments: [], events: [], tasks: [], observations: [],
      proposals: [], costs: [], tests: [], audit: []
    };
  };
  G.log = function (t, who, action, detail) {
    t.audit.unshift({ at: G.now(), who: who || 'Operator', action: action, detail: detail || '' });
    if (t.audit.length > 1000) t.audit.length = 1000;
  };

  G.INTAKE = [
    { path: 'profile.name', label: 'Client name' },
    { path: 'profile.offer', label: 'Offer being sold' },
    { path: 'profile.geography', label: 'Target geography' },
    { path: 'profile.outreachOwner', label: 'Outreach owner' },
    { path: 'profile.approver', label: 'Person authorised to approve outreach' },
    { path: 'profile.budget', label: 'Pilot budget' },
    { path: 'profile.crm', label: 'CRM' },
    { path: 'profile.sender', label: 'Sending mailbox' }
  ];
  G.get = function (o, path) {
    return String(path).split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o);
  };
  G.set = function (o, path, v) {
    var ks = String(path).split('.'), last = ks.pop();
    var tgt = ks.reduce(function (a, k) { if (a[k] == null) a[k] = {}; return a[k]; }, o);
    tgt[last] = v;
  };
  G.intakeMissing = function (t) {
    var miss = G.INTAKE.filter(function (f) {
      var v = G.get(t, f.path);
      return v === null || v === undefined || String(v).trim() === '';
    });
    return miss;
  };

  /* ---------- sources & proof ---------- */
  G.sourceById = function (t, id) { return t.sources.find(function (s) { return s.id === id; }); };
  G.sourceUsable = function (t, id) { var s = G.sourceById(t, id); return !!(s && !s.withdrawn); };
  G.proofUsable = function (t, p) {
    if (!p) return { ok: false, why: 'No proof selected' };
    if (p.status === 'retired') return { ok: false, why: 'Proof retired' };
    if (!p.verified) return { ok: false, why: 'Proof not verified' };
    if (p.permission !== 'public') return { ok: false, why: 'Proof is internal-use only' };
    if (p.sourceId && !G.sourceUsable(t, p.sourceId)) return { ok: false, why: 'Proof source missing or withdrawn' };
    return { ok: true };
  };

  /* ---------- ICP versions ---------- */
  G.blankICP = function (v) {
    return {
      v: v || 1, status: 'draft', createdAt: G.now(), note: '',
      approvedBy: '', approvedAt: '', retiredAt: '',
      industries: { values: [], basis: [] },
      size: { min: null, max: null, basis: [] },
      geography: { values: [], basis: [] },
      triggers: { keywords: [], recencyDays: 90, basis: [] },
      disqualifiers: { industries: [], keywords: [], basis: [] },
      personas: [],
      custom: [],
      weights: { industry: null, size: null, trigger: null, buyer: null },
      cutoff: null
    };
  };
  G.SUGGESTED_WEIGHTS = { industry: 40, size: 25, trigger: 20, buyer: 15 };
  G.activeICP = function (t) { return t.icp.find(function (v) { return v.status === 'approved'; }) || null; };
  G.draftICP = function (t) { return t.icp.find(function (v) { return v.status === 'draft'; }) || null; };
  G.icpByV = function (t, v) { return t.icp.find(function (x) { return x.v === v; }) || null; };
  G.icpForScoring = function (t) { return G.activeICP(t) || G.draftICP(t); };
  G.nextV = function (t) { return t.icp.reduce(function (m, x) { return Math.max(m, x.v); }, 0) + 1; };

  G.icpProblems = function (t, icp) {
    var p = [];
    var w = icp.weights;
    ['industry', 'size', 'trigger', 'buyer'].forEach(function (k) {
      if (!isFinite(w[k]) || w[k] === null) p.push('Set a weight for ' + k + ' fit');
    });
    if (!isFinite(icp.cutoff) || icp.cutoff === null) p.push('Set the minimum score (cutoff)');
    if (w.industry > 0 && !icp.industries.values.length) p.push('Add at least one target industry');
    if (w.size > 0 && icp.size.min === null && icp.size.max === null) p.push('Set an employee range');
    if (!icp.personas.length) p.push('Add at least one buyer persona');
    icp.personas.forEach(function (pe) { if (!pe.titles.length) p.push('Persona "' + (pe.name || 'Untitled') + '" needs title keywords'); });
    return p;
  };
  // Every criterion is sourced or labeled an assumption (PRD P03).
  G.criterionBasis = function (t, c) {
    var ids = (c && c.basis || []).filter(function (id) { return G.sourceUsable(t, id); });
    return ids.length ? { label: ids.length + ' source' + (ids.length > 1 ? 's' : ''), assumption: false, ids: ids } : { label: 'Assumption', assumption: true, ids: [] };
  };

  G.approveICP = function (t, icp, by) {
    var probs = G.icpProblems(t, icp);
    if (probs.length) return { ok: false, problems: probs };
    var prev = G.activeICP(t);
    var impact = prev ? G.icpImpact(t, prev, icp) : null;
    if (prev) { prev.status = 'retired'; prev.retiredAt = G.now(); }
    icp.status = 'approved'; icp.approvedBy = by; icp.approvedAt = G.now();
    G.log(t, by, 'Approved ICP v' + icp.v, icp.note || '');
    if (impact) G.flagBatchesForICP(t, icp, impact);
    return { ok: true, impact: impact };
  };
  G.newDraftFrom = function (t, base) {
    var d = base ? G.clone(base) : G.blankICP();
    d.v = G.nextV(t); d.status = 'draft'; d.createdAt = G.now();
    d.approvedBy = ''; d.approvedAt = ''; d.retiredAt = ''; d.note = '';
    d.basedOn = base ? base.v : null;
    t.icp.push(d);
    return d;
  };

  /* ---------- accounts ---------- */
  function parseLifecycle(s) {
    s = String(s || '').toLowerCase();
    return { customer: /customer|client/.test(s), openOpp: /opportunit|open deal|in deal|active deal|negotiat/.test(s) };
  }
  function addConflict(t, c) {
    c.key = G.hash(c.kind + '|' + JSON.stringify(c.row));
    if (t.conflicts.some(function (x) { return x.key === c.key && !x.resolved; })) return false;
    c.id = G.uid('cf'); c.createdAt = G.now(); c.resolved = false;
    t.conflicts.push(c);
    return true;
  }
  G.accountById = function (t, id) { return t.accounts.find(function (a) { return a.id === id; }); };
  G.accountByDomain = function (t, d) {
    return t.accounts.find(function (a) { return a.domain === d || (a.altDomains || []).indexOf(d) > -1; });
  };
  G.blankAccount = function (domain, r) {
    return {
      id: G.uid('acc'), domain: domain, altDomains: [], name: r.name || domain, industry: r.industry || '',
      employees: G.toInt(r.employees), country: r.country || '',
      trigger: { text: r.trigger || '', date: G.toDate(r.triggerDate), url: r.triggerUrl || '' },
      crmId: r.crmId || '', providerIds: r.providerId ? { provider: r.providerId } : {},
      flags: parseLifecycle(r.lifecycle), checks: {}, custom: {}, notes: '',
      mergeLog: [], createdAt: G.now(), updatedAt: G.now()
    };
  };
  G.importAccounts = function (t, rows, mapping, meta) {
    meta = meta || {};
    var res = { added: 0, updated: 0, unchanged: 0, conflicts: 0, dupConflicts: 0 };
    rows.forEach(function (raw) {
      var r = mapRow(raw, mapping);
      var domain = G.normDomain(r.domain);
      if (!domain) {
        if (addConflict(t, { kind: 'account', reason: 'Missing or invalid domain', row: r })) res.conflicts++; else res.dupConflicts++;
        return;
      }
      if (r.crmId) {
        var byCrm = t.accounts.find(function (a) { return a.crmId === r.crmId; });
        if (byCrm && byCrm.domain !== domain && (byCrm.altDomains || []).indexOf(domain) < 0) {
          if (addConflict(t, { kind: 'account', reason: 'HubSpot ID ' + r.crmId + ' is already linked to ' + byCrm.domain, row: r, domain: domain, relatedId: byCrm.id })) res.conflicts++; else res.dupConflicts++;
          return;
        }
      }
      var a = G.accountByDomain(t, domain);
      if (!a) {
        var parent = t.accounts.find(function (x) { return domain.slice(-(x.domain.length + 1)) === '.' + x.domain || x.domain.slice(-(domain.length + 1)) === '.' + domain; });
        if (parent) {
          if (addConflict(t, { kind: 'account', reason: 'Possible subsidiary or regional site of ' + parent.domain, row: r, domain: domain, relatedId: parent.id })) res.conflicts++; else res.dupConflicts++;
          return;
        }
        a = G.blankAccount(domain, r);
        a.importedFrom = meta.source || 'CSV';
        t.accounts.push(a); res.added++;
        return;
      }
      // Re-import: fill or update provided values, keep a merge log, never duplicate.
      var changes = [];
      function upd(field, val, cur) {
        if (val === null || val === undefined || val === '') return;
        if (String(cur) !== String(val)) { changes.push(field + ': ' + (cur || '∅') + ' → ' + val); return true; }
      }
      if (upd('name', r.name, a.name)) a.name = r.name;
      if (upd('industry', r.industry, a.industry)) a.industry = r.industry;
      var emp = G.toInt(r.employees); if (upd('employees', emp, a.employees)) a.employees = emp;
      if (upd('country', r.country, a.country)) a.country = r.country;
      if (upd('trigger', r.trigger, a.trigger.text)) a.trigger.text = r.trigger;
      var td = G.toDate(r.triggerDate); if (upd('trigger date', td, a.trigger.date)) a.trigger.date = td;
      if (upd('trigger URL', r.triggerUrl, a.trigger.url)) a.trigger.url = r.triggerUrl;
      if (upd('HubSpot ID', r.crmId, a.crmId)) a.crmId = r.crmId;
      if (r.providerId && upd('provider ID', r.providerId, a.providerIds.provider)) a.providerIds.provider = r.providerId;
      if (r.lifecycle) {
        var lf = parseLifecycle(r.lifecycle);
        if (lf.customer !== a.flags.customer || lf.openOpp !== a.flags.openOpp) { changes.push('CRM status → ' + r.lifecycle); a.flags = lf; }
      }
      if (changes.length) {
        a.mergeLog.push({ at: G.now(), source: meta.source || 'CSV', changes: changes });
        a.updatedAt = G.now(); res.updated++;
      } else res.unchanged++;
    });
    return res;
  };
  G.resolveConflict = function (t, cf, action, targetId) {
    var r = cf.row;
    if (action === 'separate' && cf.domain) {
      var a = G.blankAccount(cf.domain, r); a.importedFrom = 'Manual resolution';
      if (cf.reason.indexOf('HubSpot ID') === 0) a.crmId = '';
      t.accounts.push(a);
    } else if (action === 'merge' && targetId) {
      var tgt = G.accountById(t, targetId);
      if (tgt && cf.domain && tgt.altDomains.indexOf(cf.domain) < 0) tgt.altDomains.push(cf.domain);
      if (tgt) tgt.mergeLog.push({ at: G.now(), source: 'Manual resolution', changes: ['Merged ' + (cf.domain || r.name) + ' as alternate domain'] });
    } else if (action === 'fix' && targetId) { // targetId carries a corrected domain
      var d = G.normDomain(targetId);
      if (!d) return false;
      var m = {}; Object.keys(r).forEach(function (k) { m[k] = k; });
      var rr = G.clone(r); rr.domain = d;
      cf.resolved = true; cf.resolution = 'fixed domain';
      G.importAccounts(t, [rr], m, { source: 'Manual resolution' });
      return true;
    }
    cf.resolved = true; cf.resolution = action; cf.resolvedAt = G.now();
    return true;
  };

  /* ---------- suppression ---------- */
  G.suppressionHit = function (t, value) {
    value = String(value || '').toLowerCase();
    if (!value) return null;
    var dom = value.indexOf('@') > -1 ? G.emailDomain(value) : value;
    return t.suppression.find(function (s) { return s.value === value || s.value === dom; }) || null;
  };
  G.addSuppression = function (t, value, reason, source) {
    var v = String(value || '').trim().toLowerCase();
    v = v.indexOf('@') > -1 ? G.normEmail(v) : G.normDomain(v);
    if (!v) return false;
    if (t.suppression.some(function (s) { return s.value === v; })) return false;
    t.suppression.push({ value: v, reason: reason || 'Do not contact', source: source || 'Manual', addedAt: G.now() });
    return true;
  };

  /* ---------- personas & contacts ---------- */
  function wordsIn(title, kw) {
    var words = String(kw).toLowerCase().split(/\s+/).filter(Boolean);
    return words.length > 0 && words.every(function (w) {
      return new RegExp('(^|[^a-z0-9])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])').test(title);
    });
  }
  G.matchPersonas = function (title, personas) {
    var tl = String(title || '').toLowerCase();
    if (!tl) return [];
    return personas.filter(function (p) { return p.titles.some(function (k) { return wordsIn(tl, k); }); }).map(function (p) { return p.id; });
  };
  G.contactPersona = function (c, icp) {
    if (!icp) return { id: null, ids: [] };
    if (c.personaId && icp.personas.some(function (p) { return p.id === c.personaId; })) return { id: c.personaId, ids: [c.personaId], manual: true };
    var ids = G.matchPersonas(c.title, icp.personas);
    return { id: ids.length === 1 ? ids[0] : null, ids: ids };
  };
  G.isVerified = function (v) { return /^(valid|verified|deliverable|ok|safe)$/i.test(String(v || '').trim()); };
  G.CONTACT_STATES = {
    ready: { label: 'Ready', tone: 'ok' },
    suppressed: { label: 'Suppressed', tone: 'bad' },
    'missing-email': { label: 'Missing email', tone: 'warn' },
    'conflicting-employment': { label: 'Email domain ≠ company', tone: 'warn' },
    unverified: { label: 'Email not verified', tone: 'warn' },
    'no-persona': { label: 'No persona match', tone: 'warn' },
    'ambiguous-persona': { label: 'Ambiguous persona', tone: 'warn' },
    unmatched: { label: 'No account', tone: 'bad' },
    excluded: { label: 'Excluded by owner', tone: 'muted' }
  };
  G.contactState = function (t, c, icp) {
    icp = icp || G.icpForScoring(t);
    var a = G.accountById(t, c.accountId);
    if (!a) return 'unmatched';
    if (c.excluded) return 'excluded';
    if (G.suppressionHit(t, c.email) || G.suppressionHit(t, a.domain)) return 'suppressed';
    if (!c.email) return 'missing-email';
    var ed = G.emailDomain(c.email);
    if (ed !== a.domain && (a.altDomains || []).indexOf(ed) < 0 && ed.slice(-(a.domain.length + 1)) !== '.' + a.domain && !c.employmentConfirmed) return 'conflicting-employment';
    if (!G.isVerified(c.verification)) return 'unverified';
    var pm = G.contactPersona(c, icp);
    if (!pm.ids.length) return 'no-persona';
    if (!pm.id) return 'ambiguous-persona';
    return 'ready';
  };
  G.importContacts = function (t, rows, mapping, meta) {
    meta = meta || {};
    var res = { added: 0, updated: 0, unchanged: 0, conflicts: 0, dupConflicts: 0 };
    rows.forEach(function (raw) {
      var r = mapRow(raw, mapping);
      var email = G.normEmail(r.email);
      var first = r.firstName || '', last = r.lastName || '';
      var full = r.fullName || [first, last].filter(Boolean).join(' ');
      if (!first && full) { first = full.split(/\s+/)[0]; last = full.split(/\s+/).slice(1).join(' '); }
      var cd = G.normDomain(r.companyDomain);
      var a = (cd && G.accountByDomain(t, cd)) || (email && G.accountByDomain(t, G.emailDomain(email)));
      if (!a) {
        if (addConflict(t, { kind: 'contact', reason: 'No matching account for ' + (cd || G.emailDomain(email) || 'this row'), row: r })) res.conflicts++; else res.dupConflicts++;
        return;
      }
      var c = email ? t.contacts.find(function (x) { return x.email === email; }) : null;
      if (!c && full) c = t.contacts.find(function (x) { return !x.email && x.accountId === a.id && x.name.toLowerCase() === full.toLowerCase(); });
      var fields = {
        name: full, firstName: first, lastName: last, title: r.title || '', email: email,
        verification: r.verification || '', provider: r.provider || meta.provider || '',
        retrievedAt: G.toDate(r.retrievedAt) || G.now(), linkedin: r.linkedin || '', crmId: r.crmId || ''
      };
      if (!c) {
        c = Object.assign({ id: G.uid('ct'), accountId: a.id, createdAt: G.now(), personaId: null, history: [] }, fields);
        t.contacts.push(c); res.added++;
        return;
      }
      var changed = [];
      Object.keys(fields).forEach(function (k) {
        if (k === 'retrievedAt') return;
        if (fields[k] && String(fields[k]) !== String(c[k] || '')) { changed.push(k); c[k] = fields[k]; }
      });
      if (c.accountId !== a.id) { changed.push('account'); c.accountId = a.id; }
      if (changed.length) { c.retrievedAt = fields.retrievedAt; c.history.push({ at: G.now(), source: meta.provider || 'CSV', changed: changed }); res.updated++; }
      else res.unchanged++;
    });
    return res;
  };

  /* ---------- account scoring (PRD §5) ---------- */
  G.COMPONENTS = [
    { key: 'industry', label: 'Industry / product fit' },
    { key: 'size', label: 'Size fit' },
    { key: 'trigger', label: 'Relevant dated trigger' },
    { key: 'buyer', label: 'Identified buyer role' }
  ];
  function ciIncl(a, b) { a = String(a || '').toLowerCase(); b = String(b || '').toLowerCase(); return !!a && !!b && (a.indexOf(b) > -1 || b.indexOf(a) > -1); }
  G.scoreAccount = function (t, a, icp, opts) {
    opts = opts || {};
    icp = icp || G.icpForScoring(t);
    var out = { components: [], known: 0, unresolved: 0, max: 0, status: 'needs-icp', reasons: [], research: [], cutoff: icp ? icp.cutoff : null, v: icp ? icp.v : null };
    if (!icp) return out;
    var now = opts.now || Date.now();
    var w = icp.weights;

    // Hard exclusions override the score.
    var sup = G.suppressionHit(t, a.domain);
    if (sup) out.reasons.push('Suppressed: ' + sup.reason);
    if (a.flags.customer && t.profile.suppressCustomers) out.reasons.push('Existing customer');
    if (a.flags.openOpp && t.profile.suppressOpenOpps) out.reasons.push('Active opportunity in CRM');
    icp.disqualifiers.industries.forEach(function (d) { if (ciIncl(a.industry, d)) out.reasons.push('Disqualified industry: ' + d); });
    var hay = [a.name, a.industry, a.notes, a.trigger.text].join(' ').toLowerCase();
    icp.disqualifiers.keywords.forEach(function (k) { if (k && hay.indexOf(k.toLowerCase()) > -1) out.reasons.push('Disqualifier: ' + k); });
    if (icp.geography.values.length) {
      if (a.checks.geography === 'match') { /* operator verified */ }
      else if (a.checks.geography === 'nomatch') out.reasons.push('Outside target geography');
      else if (!a.country) out.research.push('Country unknown');
      else if (!icp.geography.values.some(function (g) { return ciIncl(a.country, g); })) out.reasons.push('Outside target geography (' + a.country + ')');
    }
    icp.custom.forEach(function (c) {
      var v = a.custom[c.id];
      if (!c.mandatory) return;
      if (v === 'nomatch') out.reasons.push('Fails: ' + c.label);
      else if (v !== 'match') out.research.push('Unchecked requirement: ' + c.label);
    });

    function comp(key, state, reason) {
      var weight = +w[key] || 0;
      var ov = a.checks[key];
      if (ov === 'match' || ov === 'nomatch') { state = ov; reason = 'Verified by operator' + (a.checks[key + 'Note'] ? ': ' + a.checks[key + 'Note'] : ''); }
      var pts = state === 'match' ? weight : 0;
      out.components.push({ key: key, label: G.COMPONENTS.find(function (c) { return c.key === key; }).label, weight: weight, state: state, points: pts, reason: reason });
      out.max += weight;
      if (state === 'match') out.known += weight;
      else if (state === 'unknown') out.unresolved += weight;
    }
    // industry
    if (!icp.industries.values.length) comp('industry', 'unknown', 'No target industries in ICP');
    else if (!a.industry) comp('industry', 'unknown', 'Industry missing');
    else if (icp.industries.values.some(function (v) { return ciIncl(a.industry, v); })) comp('industry', 'match', a.industry);
    else comp('industry', 'nomatch', a.industry + ' is not a target industry');
    // size
    var mn = icp.size.min, mx = icp.size.max;
    if (a.employees === null || a.employees === undefined) comp('size', 'unknown', 'Employee count missing');
    else if ((mn === null || a.employees >= mn) && (mx === null || a.employees <= mx)) comp('size', 'match', a.employees + ' employees');
    else comp('size', 'nomatch', a.employees + ' employees is outside ' + (mn || 0) + '–' + (mx || '∞'));
    // trigger
    var tr = a.trigger || {};
    if (!tr.text) comp('trigger', 'unknown', 'No trigger researched yet');
    else if (!tr.date || !tr.url) comp('trigger', 'unknown', 'Trigger needs a date and source URL');
    else if (icp.triggers.keywords.length && !icp.triggers.keywords.some(function (k) { return tr.text.toLowerCase().indexOf(k.toLowerCase()) > -1; })) comp('trigger', 'nomatch', 'Trigger is not one the ICP lists');
    else {
      var age = G.daysBetween(tr.date, now);
      if (icp.triggers.recencyDays && age > icp.triggers.recencyDays) comp('trigger', 'nomatch', 'Trigger is ' + age + ' days old (limit ' + icp.triggers.recencyDays + ')');
      else comp('trigger', 'match', tr.text);
    }
    // buyer
    var cs = t.contacts.filter(function (c) { return c.accountId === a.id; });
    if (!cs.length) comp('buyer', 'unknown', 'No buyer identified yet');
    else {
      var states = cs.map(function (c) { return G.contactState(t, c, icp); });
      if (states.indexOf('ready') > -1) comp('buyer', 'match', 'Verified ' + cs.filter(function (c, i) { return states[i] === 'ready'; }).map(function (c) { return c.title; })[0]);
      else if (states.some(function (s) { return s === 'ambiguous-persona' || s === 'unverified' || s === 'missing-email' || s === 'conflicting-employment'; })) comp('buyer', 'unknown', 'Contacts need review');
      else comp('buyer', 'nomatch', 'No contact matches a buyer persona');
    }

    var cutoff = icp.cutoff;
    var weightsSet = ['industry', 'size', 'trigger', 'buyer'].every(function (k) { return w[k] !== null && isFinite(w[k]); });
    if (out.reasons.length) out.status = 'excluded';
    else if (!weightsSet || cutoff === null || !isFinite(cutoff)) out.status = 'needs-icp';
    else if (out.research.length) out.status = 'research';
    else if (out.known >= cutoff) out.status = 'eligible';
    else if (out.known + out.unresolved >= cutoff) out.status = 'research';
    else out.status = 'deprioritized';
    if (out.status === 'research') {
      out.components.forEach(function (c) { if (c.state === 'unknown') out.research.push(c.label + ': ' + c.reason); });
    }
    return out;
  };
  // What a "needs research" account is actually missing, in plain words.
  G.plainMissing = function (r) {
    r = String(r || '');
    if (/^Unchecked requirement: /.test(r)) return 'an unchecked requirement (' + r.replace(/^Unchecked requirement: /, '') + ')';
    if (/trigger/i.test(r)) return /date and source/i.test(r) ? 'the date or link for its buying signal' : 'a recent buying signal';
    if (/Employee count/i.test(r)) return 'number of employees';
    if (/Industry missing/i.test(r)) return 'industry';
    if (/Country unknown/i.test(r)) return 'country';
    if (/No target industries/i.test(r)) return 'target industries in the ICP';
    if (/buyer|Contacts need review/i.test(r)) return 'a contact to email';
    return r.replace(/^[^:]*:\s*/, '');
  };
  G.ACCOUNT_STATES = {
    eligible: { label: 'Eligible', tone: 'ok' },
    research: { label: 'Needs research', tone: 'warn' },
    deprioritized: { label: 'Deprioritised', tone: 'muted' },
    excluded: { label: 'Excluded', tone: 'bad' },
    'needs-icp': { label: 'Unscored', tone: 'muted' }
  };
  G.scoreAll = function (t, icp, opts) {
    var m = {};
    t.accounts.forEach(function (a) { m[a.id] = G.scoreAccount(t, a, icp, opts); });
    return m;
  };

  /* ---------- ICP change impact (PRD §8 ICP change review) ---------- */
  G.icpImpact = function (t, oldIcp, newIcp, opts) {
    var res = { newlyEligible: [], newlyExcluded: [], uncertain: [], unchanged: 0, batches: [] };
    t.accounts.forEach(function (a) {
      var o = G.scoreAccount(t, a, oldIcp, opts).status, n = G.scoreAccount(t, a, newIcp, opts).status;
      if (o === n) { res.unchanged++; return; }
      if (n === 'eligible') res.newlyEligible.push({ id: a.id, from: o });
      else if (n === 'excluded' || n === 'deprioritized') res.newlyExcluded.push({ id: a.id, from: o, to: n });
      else res.uncertain.push({ id: a.id, from: o, to: n });
    });
    t.batches.forEach(function (b) {
      var st = G.batchState(t, b);
      if (st === 'enrolled' || st === 'reconciled' || b.archived) return;
      var out = b.rows.filter(function (r) { var a = G.accountById(t, r.accountId); return !a || G.scoreAccount(t, a, newIcp, opts).status !== 'eligible'; }).map(function (r) { return r.contactId; });
      res.batches.push({ id: b.id, outOfScope: out });
    });
    return res;
  };
  G.flagBatchesForICP = function (t, icp, impact) {
    impact.batches.forEach(function (x) {
      var b = G.batchById(t, x.id);
      if (!b) return;
      if (!x.outOfScope.length) { b.history.push({ at: G.now(), what: 'ICP v' + icp.v + ' approved; every row is still eligible' }); return; }
      b.needsReview = { v: icp.v, at: G.now(), outOfScope: x.outOfScope, reason: 'ICP v' + icp.v + ' approved after this batch was drafted' };
    });
  };

  /* ---------- drafting (PRD P07) ---------- */
  G.TOKENS = ['first_name', 'company', 'title', 'personalization', 'question', 'proof', 'cta', 'sender_name', 'trigger'];
  G.renderDraft = function (t, campaign, c, icp) {
    var a = G.accountById(t, c.accountId);
    var persona = icp && icp.personas.find(function (p) { return p.id === campaign.personaId; }) || (icp && icp.personas.find(function (p) { return p.id === G.contactPersona(c, icp).id; }));
    var withheld = [], personalization = null, proof = null;
    var tr = a && a.trigger || {};
    if (tr.text && tr.url && tr.date) personalization = { text: 'I noticed ' + a.name + ' ' + tr.text.replace(/\.$/, '') + '.', url: tr.url, date: tr.date };
    else withheld.push(tr.text ? 'Trigger has no date or source, so it is not stated as fact' : 'No sourced account fact, so the personalization line is omitted');
    var p = t.proof.find(function (x) { return x.id === campaign.proofId; });
    if (campaign.proofId) {
      var pu = G.proofUsable(t, p);
      if (pu.ok) proof = { id: p.id, text: p.text };
      else withheld.push('Proof withheld: ' + pu.why);
    }
    var vals = {
      first_name: c.firstName || (c.name || '').split(' ')[0] || 'there',
      company: a ? a.name : '', title: c.title || '',
      personalization: personalization ? personalization.text : '',
      question: persona && persona.question ? persona.question : '',
      proof: proof ? proof.text : '',
      cta: campaign.cta || '',
      sender_name: campaign.senderName || (t.profile.outreachOwner || ''),
      trigger: personalization ? tr.text : ''
    };
    var unknownTokens = [];
    function fill(s) {
      var out = String(s || '').replace(/\{\{\s*([a-z_]+)\s*\}\}/g, function (m, k) {
        if (k in vals) return vals[k];
        unknownTokens.push(k); return m;
      });
      return out.split('\n').filter(function (line, i, arr) { return !(line.trim() === '' && (arr[i - 1] || '').trim() === ''); }).join('\n').trim();
    }
    var steps = (campaign.steps || []).map(function (s) { return { subject: fill(s.subject), body: fill(s.body), delayDays: s.delayDays || 0 }; });
    return { steps: steps, personalization: personalization, proofId: proof ? proof.id : null, withheld: withheld, unknownTokens: G.uniq(unknownTokens) };
  };

  /* ---------- campaigns, batches, enrollments (PRD P08) ---------- */
  G.campaignById = function (t, id) { return t.campaigns.find(function (c) { return c.id === id; }); };
  G.batchById = function (t, id) { return t.batches.find(function (b) { return b.id === id; }); };
  G.contactById = function (t, id) { return t.contacts.find(function (c) { return c.id === id; }); };
  G.intentKey = function (campaignId, channel, contactId) { return campaignId + '|' + channel + '|' + contactId; };
  G.blankCampaign = function (t) {
    var icp = G.activeICP(t);
    return {
      id: G.uid('cmp'), name: '', owner: t.profile.outreachOwner || '', objective: '', icpVersion: icp ? icp.v : null,
      personaId: icp && icp.personas[0] ? icp.personas[0].id : null, pain: '', hypothesis: '', cta: '', channel: 'Email',
      sender: t.profile.sender || '', senderName: t.profile.outreachOwner || '', proofId: null, kpi: 'Held meetings',
      successCriterion: '', windowDays: 30, batchSize: 25, budget: null, startDate: '', createdAt: G.now(),
      steps: [
        { subject: 'Question about {{company}}', body: 'Hi {{first_name}},\n\n{{personalization}}\n\n{{question}}\n\n{{proof}}\n\n{{cta}}\n\n{{sender_name}}', delayDays: 0 },
        { subject: 'Re: Question about {{company}}', body: 'Hi {{first_name}}, following up in case this is relevant.\n\n{{cta}}\n\n{{sender_name}}', delayDays: 3 }
      ]
    };
  };
  G.batchCandidates = function (t, cmp, opts) {
    var icp = G.activeICP(t);
    var scores = G.scoreAll(t, icp, opts);
    var inOpenBatch = {};
    t.batches.forEach(function (b) {
      if (b.campaignId !== cmp.id || b.archived) return;
      b.rows.forEach(function (r) { inOpenBatch[r.contactId] = true; });
    });
    var take = [], skipped = {};
    function skip(why) { skipped[why] = (skipped[why] || 0) + 1; }
    t.contacts.forEach(function (c) {
      var st = G.contactState(t, c, icp);
      var a = G.accountById(t, c.accountId);
      if (!a) return skip('No account');
      var sc = scores[a.id];
      if (sc.status === 'research') return skip('Company missing: ' + G.plainMissing(sc.research[0]));
      if (sc.status === 'deprioritized') return skip('Company is a weak fit for the ICP (industry or size)');
      if (sc.status === 'excluded') return skip('Company excluded: ' + sc.reasons[0].replace(/\s*\(.*\)$/, ''));
      if (sc.status !== 'eligible') return skip('Company not scored yet (ICP incomplete)');
      if (st !== 'ready') return skip(G.CONTACT_STATES[st].label);
      if (cmp.personaId && G.contactPersona(c, icp).id !== cmp.personaId) return skip('Different persona');
      if (t.enrollments.some(function (e) { return e.key === G.intentKey(cmp.id, cmp.channel, c.id); }) || inOpenBatch[c.id]) return skip('Already in this campaign');
      take.push(c);
    });
    return { contacts: take.slice(0, cmp.batchSize || 25), overflow: Math.max(0, take.length - (cmp.batchSize || 25)), skipped: skipped, icp: icp };
  };
  G.createBatch = function (t, cmp, opts) {
    var cand = G.batchCandidates(t, cmp, opts);
    if (!cand.icp) return { ok: false, why: 'Approve an ICP first' };
    if (!cand.contacts.length) return { ok: false, why: 'No ready contacts for this campaign', skipped: cand.skipped };
    var n = t.batches.filter(function (b) { return b.campaignId === cmp.id; }).length + 1;
    var b = {
      id: G.uid('bat'), campaignId: cmp.id, n: n, icpVersion: cand.icp.v, createdAt: G.now(),
      channel: cmp.channel, sender: cmp.sender, approval: null, history: [], needsReview: null, archived: false,
      skipped: cand.skipped, exportSkips: [],
      rows: cand.contacts.map(function (c) {
        var d = G.renderDraft(t, cmp, c, cand.icp);
        return { contactId: c.id, accountId: c.accountId, email: c.email, steps: d.steps, personalization: d.personalization, proofId: d.proofId, withheld: d.withheld, edited: false };
      })
    };
    t.batches.push(b);
    G.log(t, 'Operator', 'Drafted batch ' + n + ' for ' + (cmp.name || 'campaign'), b.rows.length + ' contacts');
    return { ok: true, batch: b };
  };
  G.batchHash = function (b) {
    return G.hash(JSON.stringify({ ch: b.channel, s: b.sender, r: b.rows.map(function (r) { return [r.contactId, r.email, r.steps]; }) }));
  };
  G.batchIntents = function (t, b) { return t.enrollments.filter(function (e) { return e.batchId === b.id; }); };
  G.batchState = function (t, b) {
    if (b.archived) return 'archived';
    if (b.needsReview) return 'needs-review';
    if (!b.approval) return 'awaiting-approval';
    if (b.approval.hash !== G.batchHash(b)) return 'expired-approval';
    var it = G.batchIntents(t, b);
    if (!it.length) return 'approved';
    var live = b.rows.length - (b.exportSkips || []).length;
    var enrolled = it.filter(function (e) { return e.state === 'enrolled'; }).length;
    if (b.reconciledAt && enrolled >= live) return 'reconciled';
    if (enrolled >= live && live > 0) return 'enrolled';
    return 'staged';
  };
  G.BATCH_STATES = {
    'awaiting-approval': { label: 'Awaiting approval', tone: 'warn' },
    'expired-approval': { label: 'Changed after approval', tone: 'bad' },
    'needs-review': { label: 'Needs review (ICP changed)', tone: 'bad' },
    approved: { label: 'Approved', tone: 'accent' },
    staged: { label: 'Staged', tone: 'accent' },
    enrolled: { label: 'Enrolled', tone: 'ok' },
    reconciled: { label: 'Reconciled', tone: 'ok' },
    archived: { label: 'Archived', tone: 'muted' }
  };
  G.approveBatch = function (t, b, by) {
    if (t.paused) return { ok: false, why: 'Client is paused' };
    if (!by) return { ok: false, why: 'Approver name is required' };
    if (b.needsReview) return { ok: false, why: 'Resolve the ICP change review first' };
    b.approval = { by: by, at: G.now(), hash: G.batchHash(b) };
    b.history.push({ at: G.now(), what: 'Approved by ' + by, hash: b.approval.hash });
    G.log(t, by, 'Approved batch ' + b.n, b.rows.length + ' contacts · fingerprint ' + b.approval.hash);
    return { ok: true };
  };
  // Stage = produce the sender file. Suppression is rechecked right now, and only unenrolled rows are included.
  G.stageBatch = function (t, b) {
    if (t.paused) return { ok: false, why: 'Client is paused' };
    var st = G.batchState(t, b);
    if (['approved', 'staged'].indexOf(st) < 0) return { ok: false, why: 'Batch must be approved first (now: ' + G.BATCH_STATES[st].label + ')' };
    var out = [], skips = [];
    b.rows.forEach(function (r) {
      var c = G.contactById(t, r.contactId);
      var a = G.accountById(t, r.accountId);
      var key = G.intentKey(b.campaignId, b.channel, r.contactId);
      var intent = t.enrollments.find(function (e) { return e.key === key; });
      if (intent && intent.state === 'enrolled') return;
      var hit = G.suppressionHit(t, r.email) || (a && G.suppressionHit(t, a.domain));
      if (hit || (c && c.excluded)) { skips.push({ contactId: r.contactId, reason: hit ? hit.reason : 'Excluded by owner' }); return; }
      if (!intent) { intent = { key: key, contactId: r.contactId, campaignId: b.campaignId, batchId: b.id, channel: b.channel, state: 'staged', stagedAt: G.now() }; t.enrollments.push(intent); }
      out.push({ row: r, contact: c, account: a });
    });
    b.exportSkips = G.uniq((b.exportSkips || []).map(function (s) { return s.contactId; }).concat(skips.map(function (s) { return s.contactId; }))).map(function (id) {
      return skips.find(function (s) { return s.contactId === id; }) || (b.exportSkips || []).find(function (s) { return s.contactId === id; });
    });
    b.stagedAt = G.now();
    b.history.push({ at: G.now(), what: 'Exported ' + out.length + ' rows to sender file' + (skips.length ? ' (' + skips.length + ' skipped by suppression recheck)' : '') });
    G.log(t, 'Operator', 'Staged batch ' + b.n, out.length + ' rows exported, ' + skips.length + ' suppressed at recheck');
    return { ok: true, rows: out, skips: skips };
  };
  G.senderCSV = function (t, b, staged) {
    var maxSteps = b.rows.reduce(function (m, r) { return Math.max(m, r.steps.length); }, 0);
    var cols = [
      { label: 'email', get: function (x) { return x.row.email; } },
      { label: 'first_name', get: function (x) { return x.contact ? x.contact.firstName : ''; } },
      { label: 'last_name', get: function (x) { return x.contact ? x.contact.lastName : ''; } },
      { label: 'company_name', get: function (x) { return x.account ? x.account.name : ''; } }
    ];
    for (var i = 0; i < maxSteps; i++) (function (i) {
      cols.push({ label: 'subject_' + (i + 1), get: function (x) { return x.row.steps[i] ? x.row.steps[i].subject : ''; } });
      cols.push({ label: 'body_' + (i + 1), get: function (x) { return x.row.steps[i] ? x.row.steps[i].body : ''; } });
    })(i);
    cols.push({ label: 'campaign_key', get: function () { return b.campaignId + '-b' + b.n; } });
    return G.toCSV(cols, staged);
  };
  G.recordAcks = function (t, b, rows, mapping) {
    var res = { enrolled: 0, already: 0, unknown: [], rejected: 0 };
    rows.forEach(function (raw) {
      var r = mapRow(raw, mapping);
      var email = G.normEmail(r.email);
      var row = b.rows.find(function (x) { return x.email === email; });
      if (!row) { res.unknown.push(r.email); return; }
      var it = t.enrollments.find(function (e) { return e.key === G.intentKey(b.campaignId, b.channel, row.contactId); });
      if (!it) { res.unknown.push(r.email); return; }
      if (r.status && /fail|reject|error|invalid|bounce/i.test(r.status)) { it.state = 'failed'; it.failReason = r.status; res.rejected++; return; }
      if (it.state === 'enrolled') { res.already++; return; }
      it.state = 'enrolled'; it.enrolledAt = G.now(); res.enrolled++;
    });
    b.history.push({ at: G.now(), what: 'Provider acknowledged ' + res.enrolled + ' new enrollments' + (res.already ? ', ' + res.already + ' already recorded' : '') });
    G.log(t, 'Operator', 'Recorded provider acknowledgement for batch ' + b.n, res.enrolled + ' enrolled');
    return res;
  };
  G.unresolvedRows = function (t, b) {
    var skip = (b.exportSkips || []).map(function (s) { return s.contactId; });
    return b.rows.filter(function (r) {
      if (skip.indexOf(r.contactId) > -1) return false;
      var it = t.enrollments.find(function (e) { return e.key === G.intentKey(b.campaignId, b.channel, r.contactId); });
      return !it || it.state !== 'enrolled';
    });
  };

  /* ---------- outcome events & replies (PRD P09, §8 reply handoff) ---------- */
  G.EVENT_TYPES = {
    sent: 'Sent', delivered: 'Delivered', bounce: 'Bounced', reply: 'Reply (unclassified)', positive_reply: 'Interested reply',
    question: 'Question', referral: 'Referral', objection: 'Objection', negative: 'Not interested', opt_out: 'Opt-out',
    auto_reply: 'Automatic reply', meeting_booked: 'Meeting booked', meeting_held: 'Meeting held',
    opportunity: 'Opportunity created', closed_won: 'Closed won', closed_lost: 'Closed lost'
  };
  G.HUMAN_REPLY = ['reply', 'positive_reply', 'question', 'referral', 'objection', 'negative', 'opt_out'];
  G.normType = function (s) {
    var x = String(s || '').toLowerCase().replace(/[\s-]+/g, '_');
    var alias = {
      email_sent: 'sent', send: 'sent', delivered: 'delivered', email_delivered: 'delivered', bounced: 'bounce', hard_bounce: 'bounce',
      replied: 'reply', reply_received: 'reply', interested: 'positive_reply', positive: 'positive_reply', lead_interested: 'positive_reply',
      unsubscribe: 'opt_out', unsubscribed: 'opt_out', optout: 'opt_out', out_of_office: 'auto_reply', ooo: 'auto_reply', auto: 'auto_reply',
      not_interested: 'negative', meeting: 'meeting_booked', booked: 'meeting_booked', meeting_scheduled: 'meeting_booked',
      held: 'meeting_held', meeting_completed: 'meeting_held', deal_created: 'opportunity', opportunity_created: 'opportunity',
      won: 'closed_won', closedwon: 'closed_won', lost: 'closed_lost'
    };
    x = alias[x] || x;
    return G.EVENT_TYPES[x] ? x : '';
  };
  G.CLASS_OF = { positive_reply: 'interested', question: 'question', referral: 'referral', objection: 'objection', negative: 'negative', opt_out: 'opt-out', auto_reply: 'automatic', reply: 'unclassified' };
  G.TASK_STATES = ['assigned', 'accepted', 'followed up', 'booked', 'closed'];
  G.importEvents = function (t, rows, mapping, meta) {
    meta = meta || {};
    var provider = meta.provider || 'CSV';
    var res = { added: 0, duplicates: 0, invalid: 0, unmatched: 0, tasks: 0, optOuts: 0 };
    rows.forEach(function (raw) {
      var r = mapRow(raw, mapping);
      var type = G.normType(r.type);
      if (!type) { res.invalid++; return; }
      var email = G.normEmail(r.email);
      var occurredAt = G.toDate(r.occurredAt) || G.now();
      var eid = r.eventId || G.hash([type, email, occurredAt, r.dealId || ''].join('|'));
      var key = provider.toLowerCase() + ':' + eid;
      if (t.events.some(function (e) { return e.key === key; })) { res.duplicates++; return; }
      var e = { key: key, provider: provider, eventId: eid, type: type, email: email, occurredAt: occurredAt, receivedAt: G.now(), amount: G.toNum(r.amount), dealId: r.dealId || '', text: r.text || '', contactId: null, campaignId: null, batchId: null, match: 'unmatched' };
      G.matchEvent(t, e, r.campaignId);
      if (e.match === 'unmatched') res.unmatched++;
      t.events.push(e); res.added++;
      var fx = G.eventEffects(t, e);
      res.tasks += fx.task ? 1 : 0; res.optOuts += fx.optOut ? 1 : 0;
    });
    if (res.added) G.log(t, 'Operator', 'Imported ' + res.added + ' outcome events from ' + provider, res.duplicates + ' duplicates ignored, ' + res.unmatched + ' unmatched');
    return res;
  };
  G.matchEvent = function (t, e, campaignHint) {
    var c = e.email ? t.contacts.find(function (x) { return x.email === e.email; }) : null;
    if (!c && e.dealId) {
      var prior = t.events.find(function (x) { return x.dealId === e.dealId && x.contactId; });
      if (prior) { c = G.contactById(t, prior.contactId); }
    }
    if (!c) { e.match = 'unmatched'; return; }
    e.contactId = c.id;
    var ens = t.enrollments.filter(function (x) { return x.contactId === c.id && (!campaignHint || x.campaignId === campaignHint || (G.campaignById(t, x.campaignId) || {}).name === campaignHint); });
    // Attribute to the campaign the contact was enrolled in, even for late events (they update the original cohort).
    ens.sort(function (a, b) { return String(b.stagedAt).localeCompare(String(a.stagedAt)); });
    if (ens.length) { e.campaignId = ens[0].campaignId; e.batchId = ens[0].batchId; e.match = ens.length > 1 && !campaignHint ? 'ambiguous' : 'matched'; }
    else e.match = 'no-campaign';
  };
  G.eventEffects = function (t, e) {
    var fx = {};
    if (!e.contactId) return fx;
    var c = G.contactById(t, e.contactId);
    if (e.type === 'opt_out') { if (G.addSuppression(t, c.email, 'Opted out', 'Reply ' + e.key)) fx.optOut = true; }
    if (e.type === 'bounce') G.addSuppression(t, c.email, 'Hard bounce', 'Event ' + e.key);
    if (G.CLASS_OF[e.type]) {
      var key = e.contactId + '|' + (e.campaignId || '');
      var task = t.tasks.find(function (x) { return x.key === key; });
      var cmp = e.campaignId && G.campaignById(t, e.campaignId);
      var hours = +t.profile.responseTargetHours || 24;
      if (!task) {
        task = {
          id: G.uid('task'), key: key, contactId: e.contactId, campaignId: e.campaignId, createdAt: e.occurredAt,
          due: new Date(new Date(e.occurredAt).getTime() + hours * 36e5).toISOString(),
          assignee: c.owner || (cmp && cmp.owner) || t.profile.outreachOwner || 'Unassigned',
          classification: G.CLASS_OF[e.type], status: e.type === 'opt_out' || e.type === 'auto_reply' ? 'closed' : 'assigned',
          eventKeys: [], notes: '', hold: { at: G.now(), acknowledged: false }
        };
        t.tasks.push(task); fx.task = true;
      } else if (task.classification === 'unclassified' || task.classification === 'automatic') task.classification = G.CLASS_OF[e.type];
      if (task.eventKeys.indexOf(e.key) < 0) task.eventKeys.push(e.key);
      if (e.type === 'referral' && !task.referralTask) task.referralTask = { createdAt: G.now(), note: e.text || 'Research the referred buyer and check eligibility before enrollment', done: false };
      if (e.type === 'auto_reply' && e.text) { var m = e.text.match(/(\d{4}-\d{2}-\d{2})/); if (m) task.reviewDate = m[1]; }
      // Pending automated outreach to this contact is held across channels while the reply is handled.
      t.enrollments.forEach(function (x) { if (x.contactId === e.contactId && !x.hold) x.hold = { at: G.now(), reason: G.EVENT_TYPES[e.type], acknowledged: false }; });
    }
    return fx;
  };
  G.manualMatch = function (t, e, contactId) {
    e.email = (G.contactById(t, contactId) || {}).email || e.email;
    G.matchEvent(t, e);
    if (e.match === 'unmatched') { e.contactId = contactId; e.match = 'no-campaign'; }
    G.eventEffects(t, e);
  };

  /* ---------- metrics (PRD §9) ---------- */
  G.inRange = function (iso, from, to) {
    if (!iso) return false;
    return (!from || iso >= from) && (!to || iso <= to);
  };
  G.metrics = function (t, f) {
    f = f || {};
    var ev = t.events.filter(function (e) {
      if (e.test) return false;
      if (f.campaignId && e.campaignId !== f.campaignId) return false;
      if (f.batchId && e.batchId !== f.batchId) return false;
      return G.inRange(e.occurredAt, f.from, f.to);
    });
    function uniqC(types) { return G.uniq(ev.filter(function (e) { return types.indexOf(e.type) > -1 && e.contactId; }).map(function (e) { return e.contactId; })); }
    var sent = uniqC(['sent']), delivered = uniqC(['delivered']), estimated = false;
    if (!delivered.length && sent.length) { delivered = sent; estimated = true; }
    var bounced = uniqC(['bounce']);
    var replies = uniqC(G.HUMAN_REPLY), positive = uniqC(['positive_reply']), optOuts = uniqC(['opt_out']);
    var booked = uniqC(['meeting_booked']), held = uniqC(['meeting_held']);
    var deals = {};
    ev.forEach(function (e) {
      if (!e.dealId || ['opportunity', 'closed_won', 'closed_lost'].indexOf(e.type) < 0) return;
      var d = deals[e.dealId] || (deals[e.dealId] = { id: e.dealId, amount: null, won: false, lost: false, contacts: [] });
      if (e.amount !== null) d.amount = e.amount;
      if (e.type === 'closed_won') d.won = true;
      if (e.type === 'closed_lost') d.lost = true;
      if (e.contactId && d.contacts.indexOf(e.contactId) < 0) d.contacts.push(e.contactId);
    });
    var dl = Object.keys(deals).map(function (k) { return deals[k]; });
    var priced = dl.filter(function (d) { return d.amount !== null; });
    var costs = t.costs.filter(function (c) { return (!f.campaignId || !c.campaignId || c.campaignId === f.campaignId) && G.inRange(c.at, f.from, f.to); });
    var actual = costs.filter(function (c) { return !c.estimated; }).reduce(function (s, c) { return s + (+c.amount || 0); }, 0);
    var est = costs.filter(function (c) { return c.estimated && !c.superseded; }).reduce(function (s, c) { return s + (+c.amount || 0); }, 0);
    var unpriced = costs.filter(function (c) { return c.amount === null || c.amount === undefined; }).length;
    return {
      messages: ev.filter(function (e) { return e.type === 'sent'; }).length,
      sent: sent.length, delivered: delivered.length, deliveryEstimated: estimated, bounced: bounced.length,
      replies: replies.length, positive: positive.length, optOuts: optOuts.length,
      booked: booked.length, held: held.length,
      opportunities: dl.length, pipeline: priced.reduce(function (s, d) { return s + d.amount; }, 0), unpricedDeals: dl.length - priced.length,
      wonCount: dl.filter(function (d) { return d.won; }).length, won: dl.filter(function (d) { return d.won && d.amount !== null; }).reduce(function (s, d) { return s + d.amount; }, 0),
      costActual: actual, costEstimated: est, unpricedCosts: unpriced,
      unmatched: ev.filter(function (e) { return e.match === 'unmatched'; }).length,
      rates: {
        reply: { n: replies.length, d: delivered.length },
        positive: { n: positive.length, d: delivered.length },
        held: { n: held.length, d: delivered.length },
        show: { n: held.length, d: booked.length },
        costPerHeld: { n: actual, d: held.length }
      }
    };
  };
  G.rate = function (r) { return r && r.d ? r.n / r.d : null; };
  G.accountMetrics = function (t, opts) {
    var icp = G.activeICP(t);
    var sc = G.scoreAll(t, icp, opts);
    var counts = { eligible: 0, research: 0, deprioritized: 0, excluded: 0, 'needs-icp': 0 };
    var eligibleWithContact = 0;
    t.accounts.forEach(function (a) {
      var s = sc[a.id].status; counts[s]++;
      if (s === 'eligible' && t.contacts.some(function (c) { return c.accountId === a.id && G.contactState(t, c, icp) === 'ready'; })) eligibleWithContact++;
    });
    var evaluated = t.accounts.length - counts['needs-icp'];
    var reasons = {};
    t.accounts.forEach(function (a) { sc[a.id].reasons.forEach(function (r) { var k = r.replace(/\s*\(.*\)$/, '').replace(/: .*/, ''); reasons[k] = (reasons[k] || 0) + 1; }); });
    return { counts: counts, total: t.accounts.length, scores: sc, yield: { n: counts.eligible, d: evaluated }, coverage: { n: eligibleWithContact, d: counts.eligible }, exclusionReasons: reasons };
  };

  /* ---------- learning (PRD §6 evidence policy) ---------- */
  G.LEVELS = [
    { min: 10, label: 'Validated learning', tone: 'ok' },
    { min: 5, label: 'Supported pattern', tone: 'accent' },
    { min: 2, label: 'Weak signal', tone: 'warn' },
    { min: 1, label: 'Observation', tone: 'muted' },
    { min: 0, label: 'No evidence', tone: 'muted' }
  ];
  G.level = function (n) { return G.LEVELS.find(function (l) { return n >= l.min; }); };
  G.topicSummary = function (t, topic) {
    var obs = t.observations.filter(function (o) { return o.topic === topic; });
    var support = obs.filter(function (o) { return !o.contrary; });
    // Distinct original sources: mirrored notes and transcripts of one call share an origin ID and count once.
    var origins = G.uniq(support.map(function (o) { var s = G.sourceById(t, o.sourceId); return s ? (s.originId || s.id) : ('obs:' + o.id); }));
    var accounts = G.uniq(support.map(function (o) { return o.account; }).filter(Boolean));
    var perAcc = {};
    support.forEach(function (o) { if (o.account) perAcc[o.account] = (perAcc[o.account] || 0) + 1; });
    var top = Object.keys(perAcc).sort(function (a, b) { return perAcc[b] - perAcc[a]; })[0];
    return {
      topic: topic, observations: obs, supporting: support.length, distinctSources: origins.length, accounts: accounts,
      contrary: obs.filter(function (o) { return o.contrary; }).length,
      concentration: top ? { account: top, share: perAcc[top] / support.length } : null,
      level: G.level(origins.length), eligible: origins.length >= 10
    };
  };
  G.topics = function (t) { return G.uniq(t.observations.map(function (o) { return o.topic; })); };
  G.CHANGE_FIELDS = {
    industries: 'Target industries', disqualifierIndustries: 'Disqualified industries', disqualifierKeywords: 'Disqualifier keywords',
    triggerKeywords: 'Trigger keywords', personaPriority: 'Persona priority', geography: 'Target geography'
  };
  G.applyChange = function (icp, ch) {
    function list(arr) {
      if (ch.op === 'add' && arr.indexOf(ch.value) < 0) arr.push(ch.value);
      if (ch.op === 'remove') { var i = arr.indexOf(ch.value); if (i > -1) arr.splice(i, 1); }
    }
    if (ch.field === 'industries') list(icp.industries.values);
    else if (ch.field === 'disqualifierIndustries') list(icp.disqualifiers.industries);
    else if (ch.field === 'disqualifierKeywords') list(icp.disqualifiers.keywords);
    else if (ch.field === 'triggerKeywords') list(icp.triggers.keywords);
    else if (ch.field === 'geography') list(icp.geography.values);
    else if (ch.field === 'personaPriority') { var p = icp.personas.find(function (x) { return x.id === ch.personaId; }); if (p) p.priority = ch.value; }
  };
  G.describeChange = function (icp, ch) {
    if (ch.field === 'personaPriority') {
      var p = icp && icp.personas.find(function (x) { return x.id === ch.personaId; });
      return 'Set ' + (p ? p.name : 'persona') + ' to ' + ch.value + ' buyer' + (p ? ' (was ' + (p.priority || 'primary') + ')' : '');
    }
    return (ch.op === 'add' ? 'Add "' : 'Remove "') + ch.value + '" ' + (ch.op === 'add' ? 'to ' : 'from ') + G.CHANGE_FIELDS[ch.field].toLowerCase();
  };
  // Workflow 15: check the expected version again inside the write. A conflict returns both versions.
  G.decideProposal = function (t, p, decision, by, reason, opts) {
    if (decision !== 'approve') {
      p.status = decision === 'more' ? 'more evidence requested' : 'rejected';
      p.decidedBy = by; p.decidedAt = G.now(); p.decisionReason = reason || '';
      G.log(t, by, 'Proposal ' + p.status, G.describeChange(G.activeICP(t), p.change));
      return { ok: true };
    }
    var cur = G.activeICP(t);
    if (!cur || cur.v !== p.expectedVersion) {
      p.status = 'conflict'; p.conflictWith = cur ? cur.v : null;
      return { ok: false, conflict: true, current: cur ? cur.v : null, expected: p.expectedVersion };
    }
    var nv = G.clone(cur);
    nv.v = G.nextV(t); nv.basedOn = cur.v; nv.status = 'draft'; nv.note = G.describeChange(cur, p.change) + ' (from learning: ' + p.topic + ')';
    G.applyChange(nv, p.change);
    t.icp.push(nv);
    var r = G.approveICP(t, nv, by);
    if (!r.ok) { t.icp.splice(t.icp.indexOf(nv), 1); return { ok: false, problems: r.problems }; }
    p.status = 'approved'; p.decidedBy = by; p.decidedAt = G.now(); p.decisionReason = reason || ''; p.resultVersion = nv.v;
    // Any other open proposal that expected the old version now needs fresh review.
    t.proposals.forEach(function (x) { if (x !== p && x.status === 'open' && x.expectedVersion === cur.v) x.status = 'needs fresh review'; });
    return { ok: true, version: nv.v, impact: r.impact };
  };

  /* ---------- Databar filter recipe ---------- */
  G.databarRecipe = function (t, icp) {
    var manual = [];
    if (icp.triggers.keywords.length) manual.push({ rule: 'Find a dated, sourced trigger within ' + icp.triggers.recencyDays + ' days matching: ' + icp.triggers.keywords.join(', '), why: 'Triggers need a source URL and date to count as fact' });
    icp.custom.forEach(function (c) { if (!c.filterable) manual.push({ rule: 'Verify "' + c.label + '"' + (c.mandatory ? ' (mandatory)' : ''), why: 'Not available as a provider filter' }); });
    icp.disqualifiers.keywords.forEach(function (k) { manual.push({ rule: 'Exclude accounts mentioning "' + k + '"', why: 'Keyword disqualifier' }); });
    return {
      client: t.profile.name, icpVersion: icp.v, status: icp.status, generatedAt: G.now(),
      filters: {
        industries: icp.industries.values,
        employees: { min: icp.size.min, max: icp.size.max },
        countries: icp.geography.values,
        excludeIndustries: icp.disqualifiers.industries,
        jobTitles: G.uniq([].concat.apply([], icp.personas.map(function (p) { return p.titles; }))),
        customFilters: icp.custom.filter(function (c) { return c.filterable; }).map(function (c) { return c.label; })
      },
      manualResearch: manual,
      suppressDomains: t.suppression.filter(function (s) { return s.value.indexOf('@') < 0; }).map(function (s) { return s.value; }).concat(t.accounts.filter(function (a) { return a.flags.customer || a.flags.openOpp; }).map(function (a) { return a.domain; }))
    };
  };

  /* ---------- Claude context packet (client-scoped, minimal) ---------- */
  G.claudePacket = function (t, cmp, rows) {
    var icp = G.icpByV(t, cmp.icpVersion) || G.activeICP(t);
    var persona = icp && icp.personas.find(function (p) { return p.id === cmp.personaId; });
    var p = t.proof.find(function (x) { return x.id === cmp.proofId; });
    var pu = G.proofUsable(t, p);
    var lines = [
      'You are drafting outbound email for ' + t.profile.name + '. Offer: ' + t.profile.offer + '.',
      'Rules: state as fact only the account facts listed below, each with its source. Anything else (pains, priorities) must be phrased as a question, never asserted. Do not invent proof, numbers, customers or quotes. Return JSON: [{"email":"","steps":[{"subject":"","body":""}],"facts_used":["url"]}].',
      '', 'Persona: ' + (persona ? persona.name + ' (' + persona.titles.join(', ') + ')' : 'any'),
      persona && persona.pain ? 'Likely pain (inference, ask about it): ' + persona.pain : '',
      persona && persona.message ? 'Approved message: ' + persona.message : '',
      pu.ok ? 'Approved public proof: ' + p.text : 'No usable proof. Do not cite results.',
      'CTA: ' + (cmp.cta || ''), 'Hypothesis: ' + (cmp.hypothesis || ''), '', 'Recipients:'
    ];
    (rows || []).forEach(function (r) {
      var c = G.contactById(t, r.contactId), a = G.accountById(t, r.accountId);
      lines.push('- ' + (c ? c.firstName + ', ' + c.title : '') + ' at ' + (a ? a.name : '') + ' <' + r.email + '>' + (r.personalization ? ' | Fact: ' + a.trigger.text + ' (' + r.personalization.url + ', ' + r.personalization.date.slice(0, 10) + ')' : ' | No sourced fact'));
    });
    return lines.filter(function (l) { return l !== ''; }).join('\n').replace(/\nRecipients:/, '\n\nRecipients:');
  };

  if (typeof module === 'object' && module.exports) module.exports = G;
  else root.GTM = G;
})(this);
