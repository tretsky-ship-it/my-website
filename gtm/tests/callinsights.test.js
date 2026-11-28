const assert = require('assert');
const G = require('../js/callinsights.js'); const CI = G.CI || G;
let pass = 0; const t = (n, f) => { f(); pass++; console.log('ok', n); };
const mk = (id, date, text) => ({ id, title: id, date, reps: ['Jordan Avery'], transcript: text });
const calls = [
  mk('c1', '2026-09-01', '[0:01] Jordan Avery: Hi there.\n[0:05] Pat Lee: How long does onboarding take? The price is too high for us.\n[0:09] Pat Lee: We use FlowStack today.'),
  mk('c2', '2026-10-20', '[0:01] Jordan Avery: Welcome.\n[0:04] Kim Ray: How long does onboarding usually take? Honestly the price is too high.\n[0:08] Kim Ray: Wow, that is really cool.')
];
t('buyer sentences skip team', () => { const s = CI.buyerSentences(calls[0], ['Jordan Avery']); assert(s.length >= 2); assert(s.every(x => x.speaker !== 'Jordan Avery')); });
t('question groups merge similar', () => { const q = CI.questionGroups(calls, ['Jordan Avery']); assert(q.length >= 1); assert.strictEqual(q[0].callCount, 2); });
t('recurring phrases', () => { const p = CI.recurringPhrases(calls, ['Jordan Avery']); assert(p.some(x => x.phrase.indexOf('price is too high') > -1)); });
t('topic trends', () => { const tr = CI.topicTrends(calls, ['Jordan Avery']); assert(tr.topics.length > 0); });
t('mask ids', () => { assert(CI.maskIds('mail a@b.com or 555-123-4567').indexOf('a@b.com') < 0); });
t('validate drops fake quotes', () => {
  const out = { summary: 's', items: [{ section: 'Trend', title: 'x', detail: 'd', audience: 'Product', evidence: [{ callId: 'c1', quote: 'How long does onboarding take?' }] }, { section: 'Trend', title: 'y', detail: 'd', audience: 'Product', evidence: [{ callId: 'c1', quote: 'never said this' }] }] };
  const r = CI.validateInsights(out, calls); assert(r); assert.strictEqual(r.items.length, 1); assert.strictEqual(r.dropped, 1);
});
console.log(pass + ' passed');
