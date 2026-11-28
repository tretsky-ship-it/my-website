// Sales Intelligence checks: transcript parsing, talk share, call scoring, deal roll-up, trends.
// Run: node gtm/tests/intel.test.js
'use strict';
const assert = require('assert');
const G = require('../js/intel.js');
let passed = 0;
function test(name, fn) { try { fn(); passed++; console.log('  ✓ ' + name); } catch (e) { console.error('  ✗ ' + name + '\n    ' + e.message); process.exitCode = 1; } }
console.log('Sales Intelligence checks');

test('parses "Name: text" lines and merges consecutive turns', () => {
  const p = G.parseTranscript('Jordan Avery: Thanks for joining.\nJordan Avery: Quick agenda.\nPat Lee: Sure, go ahead.\nmore from Pat');
  assert.deepStrictEqual(p.segments.map(s => s.speaker), ['Jordan Avery', 'Pat Lee']);
  assert.ok(p.segments[1].text.includes('more from Pat'));
});
test('parses Fathom/Zoom style "00:01:02 Name: text" and "Name 0:05" headers', () => {
  const a = G.parseTranscript('[00:00:05] Jordan: Hi there\n00:00:12 - Pat Lee: Hello');
  assert.deepStrictEqual(a.speakers.map(s => s.name).sort(), ['Jordan', 'Pat Lee']);
  const b = G.parseTranscript('Jordan Avery  0:05\nWelcome everyone\nPat Lee  0:20\nWe have 4,000 invoices a month');
  assert.deepStrictEqual(b.segments.map(s => s.speaker), ['Jordan Avery', 'Pat Lee']);
  assert.ok(b.segments[1].text.includes('4,000 invoices'));
});
test('parses WebVTT with <v> voice tags', () => {
  const p = G.parseTranscript('WEBVTT\n\n1\n00:00:01.000 --> 00:00:04.000\n<v Jordan Avery>Hello Pat</v>\n\n2\n00:00:05.000 --> 00:00:09.000\n<v Pat Lee>Hi, thanks</v>');
  assert.deepStrictEqual(p.segments.map(s => s.speaker), ['Jordan Avery', 'Pat Lee']);
  assert.strictEqual(p.segments[0].time, '00:00:01');
});
test('talk share uses the sides the operator set', () => {
  const call = { transcript: 'Rep: one two\nBuyer: one two three four five six', sides: { Rep: 'seller', Buyer: 'buyer' } };
  const ts = G.talkShare(call);
  assert.strictEqual(ts.buyer, 6); assert.strictEqual(ts.seller, 2); assert.ok(Math.abs(ts.buyerShare - 0.75) < 1e-9);
  assert.strictEqual(G.guessSide('Jordan Avery', ['Jordan']), 'seller');
  assert.strictEqual(G.guessSide('Pat Lee', ['Jordan Avery']), 'buyer');
});
const good = { nextStep: { agreed: true, text: 'Demo with CFO', date: '2026-12-02' }, sentiment: 'positive', objections: [{ topic: 'Price', handled: 'yes' }],
  meddic: { metrics: { status: 'known' }, economicBuyer: { status: 'known' }, decisionCriteria: { status: 'partial' }, decisionProcess: { status: 'partial' }, identifyPain: { status: 'known' }, champion: { status: 'known' } } };
const bad = { nextStep: { agreed: false }, sentiment: 'negative', objections: [{ topic: 'Price', handled: 'no' }, { topic: 'Timing', handled: 'no' }], meddic: {} };
test('call score: a strong call is "Going well", a weak one "At risk", with reasons', () => {
  const tx = 'Rep: hi\nBuyer: we have a big problem with invoices every month and it is slowing close';
  const g = G.callScore({ transcript: tx, sides: { Rep: 'seller', Buyer: 'buyer' }, analysis: good });
  const b = G.callScore({ transcript: 'Rep: long pitch about everything we do for a very long time\nBuyer: ok', sides: { Rep: 'seller', Buyer: 'buyer' }, analysis: bad });
  assert.strictEqual(g.label, 'Going well'); assert.strictEqual(b.label, 'At risk');
  assert.ok(b.reasons.some(r => /next step/i.test(r.text))); assert.ok(b.reasons.some(r => /open/.test(r.text)));
  assert.strictEqual(G.callScore({ transcript: 'x' }).label, 'Not analyzed');
});
test('deal roll-up keeps the best MEDDIC evidence across calls and flags open objections', () => {
  const t = G.newTenant('T'); t.deals = [{ id: 'd1', name: 'Acme' }];
  t.calls = [
    { id: 'c1', dealId: 'd1', date: '2026-11-01T00:00:00Z', transcript: 'Rep: a\nBuyer: b c d', sides: { Rep: 'seller', Buyer: 'buyer' }, analysis: good },
    { id: 'c2', dealId: 'd1', date: '2026-11-20T00:00:00Z', transcript: 'Rep: a b c d e f\nBuyer: b', sides: { Rep: 'seller', Buyer: 'buyer' }, analysis: bad }
  ];
  const s = G.dealSummary(t, t.deals[0], { now: new Date('2026-11-25').getTime() });
  assert.strictEqual(s.meddic.economicBuyer.status, 'known');
  assert.strictEqual(s.openObjections.length, 2);
  assert.ok(s.trend < 0); assert.ok(s.reasons.some(r => /lower/.test(r.text)));
});
test('trends count calls (not mentions) and accounts, and spot what is new', () => {
  const t = G.newTenant('T');
  t.calls = [
    { id: 'a', date: '2026-11-20T00:00:00Z', accountId: 'x', analysis: { objections: [{ topic: 'Migration effort', quote: 'q1' }, { topic: 'migration effort', quote: 'q2' }], questions: [], pains: [], competitors: [], feedback: [], positives: [] } },
    { id: 'b', date: '2026-11-22T00:00:00Z', accountId: 'y', analysis: { objections: [{ topic: 'Migration Effort' }, { topic: 'Price' }] } },
    { id: 'c', date: '2026-11-05T00:00:00Z', accountId: 'z', analysis: { objections: [{ topic: 'Price' }] } }
  ];
  const tr = G.trends(t, { from: '2026-11-15T00:00:00Z', to: '2026-11-25T00:00:00Z' });
  const mig = tr.kinds.objections.find(e => e.key === 'migration effort');
  assert.strictEqual(tr.calls, 2); assert.strictEqual(mig.calls.length, 2); assert.strictEqual(mig.mentions.length, 3); assert.strictEqual(mig.accounts.length, 2);
  const ch = G.trendChange(t, { from: '2026-11-15T00:00:00Z', to: '2026-11-25T00:00:00Z' });
  assert.strictEqual(ch.kinds.objections['migration effort'].isNew, true);
  assert.strictEqual(ch.kinds.objections['price'].isNew, false);
});
test('HubSpot deal export imports and re-imports without duplicates', () => {
  const t = G.newTenant('T');
  const rows = [{ 'Record ID': '901', 'Deal Name': 'Acme - Pilot', 'Deal Stage': 'Demo', 'Amount': '$12,000' }];
  const m = G.autoMap(Object.keys(rows[0]), 'deals');
  G.importDeals(t, rows, m); const r = G.importDeals(t, rows, m);
  assert.strictEqual(t.deals.length, 1); assert.strictEqual(r.updated, 1); assert.strictEqual(t.deals[0].amount, 12000); assert.strictEqual(t.deals[0].crmId, '901');
});
console.log('\n' + passed + ' passed' + (process.exitCode ? ', some failed' : ''));
