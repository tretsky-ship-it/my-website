// Release-acceptance checks from the PRD (§5, §7, §9, §10), run against the engine.
// Run: node gtm/tests/engine.test.js
'use strict';
const assert = require('assert');
const G = require('../js/engine.js');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { console.error('  ✗ ' + name + '\n    ' + e.message); process.exitCode = 1; }
}
const NOW = new Date('2026-11-20T12:00:00Z').getTime();

function setup() {
  const t = G.newTenant('Test client');
  t.profile.approver = 'Sam Sponsor';
  const s = { id: 'src1', title: 'Discovery call', type: 'Call notes', date: '2026-11-01', permission: 'internal' };
  t.sources.push(s);
  const icp = G.newDraftFrom(t);
  icp.industries.values = ['Manufacturing'];
  icp.size = { min: 200, max: 2000, basis: ['src1'] };
  icp.geography.values = ['United States'];
  icp.triggers.keywords = ['hiring'];
  icp.disqualifiers.industries = ['Government'];
  icp.personas = [{ id: 'p_fin', name: 'Finance leader', titles: ['CFO', 'VP Finance', 'Controller'], priority: 'primary', question: 'How are you handling invoice volume?' },
                  { id: 'p_ap', name: 'AP manager', titles: ['Accounts Payable'], priority: 'secondary' }];
  icp.weights = Object.assign({}, G.SUGGESTED_WEIGHTS);
  icp.cutoff = 70;
  assert.ok(G.approveICP(t, icp, 'Sam Sponsor').ok);
  return t;
}
const AMAP = { name: 'Company', domain: 'Website', industry: 'Industry', employees: 'Employees', country: 'Country', trigger: 'Trigger', triggerDate: 'Trigger date', triggerUrl: 'Trigger URL', crmId: 'HubSpot ID', lifecycle: 'Status' };
const ROWS = [
  { Company: 'Acme', Website: 'https://www.acme.com/about', Industry: 'Manufacturing', Employees: '500', Country: 'United States', Trigger: 'is hiring a Controller', 'Trigger date': '2026-11-01', 'Trigger URL': 'https://acme.com/jobs/1' },
  { Company: 'Beta', Website: 'beta.io', Industry: 'Manufacturing', Employees: '300', Country: 'United States' },
  { Company: 'Gov', Website: 'city.gov', Industry: 'Government', Employees: '900', Country: 'United States' },
  { Company: 'Cust', Website: 'cust.com', Industry: 'Manufacturing', Employees: '900', Country: 'United States', Status: 'Customer' }
];

console.log('GTM Engine acceptance checks');

test('P04 reimporting the same rows does not duplicate', () => {
  const t = setup();
  const a = G.importAccounts(t, ROWS, AMAP);
  assert.strictEqual(a.added, 4);
  const b = G.importAccounts(t, ROWS, AMAP);
  assert.strictEqual(b.added, 0); assert.strictEqual(b.unchanged, 4);
  assert.strictEqual(t.accounts.length, 4);
  assert.strictEqual(t.accounts[0].domain, 'acme.com');
});

test('P04 subsidiaries and conflicting HubSpot IDs go to manual resolution, once', () => {
  const t = setup();
  G.importAccounts(t, [{ Company: 'Acme', Website: 'acme.com', 'HubSpot ID': '11' }], AMAP);
  const r = G.importAccounts(t, [{ Company: 'Acme EU', Website: 'eu.acme.com' }, { Company: 'Other', Website: 'other.com', 'HubSpot ID': '11' }], AMAP);
  assert.strictEqual(r.conflicts, 2);
  const again = G.importAccounts(t, [{ Company: 'Acme EU', Website: 'eu.acme.com' }], AMAP);
  assert.strictEqual(again.conflicts, 0); assert.strictEqual(again.dupConflicts, 1);
  assert.strictEqual(t.conflicts.length, 2);
});

test('P05 60 known + 25 unresolved enters research; fully evaluated 60 is deprioritised', () => {
  const t = setup();
  const icp = G.activeICP(t);
  icp.weights = { industry: 40, size: 20, trigger: 25, buyer: 15 };
  // Contact present but not a persona -> buyer nomatch, so only trigger (25) is unresolved
  G.importAccounts(t, [{ Company: 'X', Website: 'x.com', Industry: 'Manufacturing', Employees: '400', Country: 'United States' }], AMAP);
  const a = t.accounts[0];
  t.contacts.push({ id: 'c1', accountId: a.id, email: 'x@x.com', title: 'Engineer', verification: 'valid', firstName: 'X', name: 'X' });
  let s = G.scoreAccount(t, a, icp, { now: NOW });
  assert.strictEqual(s.known, 60); assert.strictEqual(s.unresolved, 25); assert.strictEqual(s.status, 'research');
  a.checks.trigger = 'nomatch';
  s = G.scoreAccount(t, a, icp, { now: NOW });
  assert.strictEqual(s.known, 60); assert.strictEqual(s.unresolved, 0); assert.strictEqual(s.status, 'deprioritized');
});

test('P05 disqualifiers and existing customers block regardless of score', () => {
  const t = setup();
  G.importAccounts(t, ROWS, AMAP);
  const sc = G.scoreAll(t, null, { now: NOW });
  const by = d => sc[t.accounts.find(a => a.domain === d).id];
  assert.strictEqual(by('city.gov').status, 'excluded');
  assert.strictEqual(by('cust.com').status, 'excluded');
  assert.ok(by('cust.com').reasons[0].includes('customer'));
  assert.strictEqual(by('acme.com').status, 'eligible'); // 40+25+20 = 85
});

test('P06 contact dispositions are explicit', () => {
  const t = setup();
  G.importAccounts(t, ROWS, AMAP);
  const CM = { fullName: 'Name', title: 'Title', email: 'Email', verification: 'Status', companyDomain: 'Domain' };
  G.importContacts(t, [
    { Name: 'Ann Lee', Title: 'VP of Finance', Email: 'ann@acme.com', Status: 'valid' },
    { Name: 'No Mail', Title: 'CFO', Email: '', Status: '', Domain: 'acme.com' },
    { Name: 'Moved', Title: 'CFO', Email: 'moved@gmail.com', Status: 'valid', Domain: 'acme.com' },
    { Name: 'Both', Title: 'CFO and Accounts Payable lead', Email: 'both@acme.com', Status: 'valid' },
    { Name: 'Risky', Title: 'Controller', Email: 'risky@acme.com', Status: 'catch-all' }
  ], CM);
  const st = n => G.contactState(t, t.contacts.find(c => c.name === n));
  assert.strictEqual(st('Ann Lee'), 'ready');
  assert.strictEqual(st('No Mail'), 'missing-email');
  assert.strictEqual(st('Moved'), 'conflicting-employment');
  assert.strictEqual(st('Both'), 'ambiguous-persona');
  assert.strictEqual(st('Risky'), 'unverified');
});

function campaignWithBatch(t) {
  G.importAccounts(t, ROWS, AMAP);
  G.importContacts(t, [{ Name: 'Ann Lee', Title: 'CFO', Email: 'ann@acme.com', Status: 'valid' }, { Name: 'Bo Tan', Title: 'Controller', Email: 'bo@acme.com', Status: 'valid' }],
    { fullName: 'Name', title: 'Title', email: 'Email', verification: 'Status' });
  t.proof.push({ id: 'pr1', text: 'Customers close the books 3 days faster.', verified: false, permission: 'public' });
  const cmp = G.blankCampaign(t); cmp.name = 'Pilot'; cmp.cta = 'Worth a call?'; cmp.proofId = 'pr1'; cmp.sender = 'a@client.com';
  t.campaigns.push(cmp);
  const r = G.createBatch(t, cmp, { now: NOW });
  assert.ok(r.ok, r.why);
  return { cmp, b: r.batch };
}

test('P07 drafts cite sourced facts and withhold unverified proof', () => {
  const t = setup();
  const { b } = campaignWithBatch(t);
  const row = b.rows[0];
  assert.ok(row.personalization && row.personalization.url === 'https://acme.com/jobs/1');
  assert.ok(row.steps[0].body.includes('I noticed Acme is hiring a Controller.'));
  assert.ok(!row.steps[0].body.includes('3 days faster'));
  assert.ok(row.withheld.some(w => w.includes('not verified')));
});

test('P07 a suppressed record produces no draft', () => {
  const t = setup();
  G.importAccounts(t, ROWS, AMAP);
  G.importContacts(t, [{ Name: 'Ann Lee', Title: 'CFO', Email: 'ann@acme.com', Status: 'valid' }], { fullName: 'Name', title: 'Title', email: 'Email', verification: 'Status' });
  G.addSuppression(t, 'ann@acme.com', 'Opted out');
  const cmp = G.blankCampaign(t); t.campaigns.push(cmp);
  const r = G.createBatch(t, cmp, { now: NOW });
  assert.strictEqual(r.ok, false);
});

test('P08 editing copy after approval invalidates it', () => {
  const t = setup();
  const { b } = campaignWithBatch(t);
  assert.ok(G.approveBatch(t, b, 'Sam Sponsor').ok);
  assert.strictEqual(G.batchState(t, b), 'approved');
  b.rows[0].steps[0].body += ' P.S.';
  assert.strictEqual(G.batchState(t, b), 'expired-approval');
  assert.strictEqual(G.stageBatch(t, b).ok, false);
});

test('P08 late opt-out is excluded at export; other rows proceed', () => {
  const t = setup();
  const { b } = campaignWithBatch(t);
  G.approveBatch(t, b, 'Sam');
  G.addSuppression(t, 'bo@acme.com', 'Opted out');
  const s = G.stageBatch(t, b);
  assert.ok(s.ok);
  assert.strictEqual(s.rows.length, 1); assert.strictEqual(s.skips.length, 1);
  assert.strictEqual(G.batchState(t, b), 'staged'); // approval still valid
});

test('§10 provider accepts some rows then times out: retry only unresolved, no duplicate enrollment', () => {
  const t = setup();
  const { b, cmp } = campaignWithBatch(t);
  G.approveBatch(t, b, 'Sam');
  G.stageBatch(t, b);
  G.recordAcks(t, b, [{ email: 'ann@acme.com' }], { email: 'email' });
  assert.deepStrictEqual(G.unresolvedRows(t, b).map(r => r.email), ['bo@acme.com']);
  const again = G.stageBatch(t, b);
  assert.strictEqual(again.rows.length, 1);
  G.recordAcks(t, b, [{ email: 'ann@acme.com' }, { email: 'bo@acme.com' }], { email: 'email' });
  assert.strictEqual(t.enrollments.length, 2);
  assert.strictEqual(G.batchState(t, b), 'enrolled');
  // A second batch for the same campaign will not re-enroll them.
  assert.strictEqual(G.createBatch(t, cmp, { now: NOW }).ok, false);
});

test('P09 duplicate webhooks count once; replies create one task; opt-outs suppress', () => {
  const t = setup();
  const { b } = campaignWithBatch(t);
  G.approveBatch(t, b, 'Sam'); G.stageBatch(t, b);
  G.recordAcks(t, b, [{ email: 'ann@acme.com' }, { email: 'bo@acme.com' }], { email: 'email' });
  const EM = { eventId: 'id', type: 'type', email: 'email', occurredAt: 'at', dealId: 'deal', amount: 'amount' };
  const evs = [
    { id: 'e1', type: 'delivered', email: 'ann@acme.com', at: '2026-11-10' },
    { id: 'e2', type: 'delivered', email: 'bo@acme.com', at: '2026-11-10' },
    { id: 'e3', type: 'referral', email: 'ann@acme.com', at: '2026-11-11' },
    { id: 'e3', type: 'referral', email: 'ann@acme.com', at: '2026-11-11' },
    { id: 'e4', type: 'positive_reply', email: 'ann@acme.com', at: '2026-11-12' },
    { id: 'e5', type: 'opt_out', email: 'bo@acme.com', at: '2026-11-12' },
    { id: 'e6', type: 'delivered', email: 'stranger@nowhere.com', at: '2026-11-12' }
  ];
  const r = G.importEvents(t, evs, EM, { provider: 'Smartlead' });
  assert.strictEqual(r.duplicates, 1); assert.strictEqual(r.unmatched, 1);
  const again = G.importEvents(t, evs, EM, { provider: 'Smartlead' });
  assert.strictEqual(again.added, 0);
  const annTasks = t.tasks.filter(x => x.contactId === t.contacts.find(c => c.email === 'ann@acme.com').id);
  assert.strictEqual(annTasks.length, 1);
  assert.ok(annTasks[0].referralTask);
  assert.strictEqual(annTasks[0].createdAt, G.toDate('2026-11-11')); // original response clock kept
  assert.ok(G.suppressionHit(t, 'bo@acme.com'));
  const m = G.metrics(t);
  assert.strictEqual(m.delivered, 2); assert.strictEqual(m.replies, 2); assert.strictEqual(m.positive, 1);
});

test('§9 two contacts on one deal count the opportunity once; zero denominator is not computable', () => {
  const t = setup();
  const empty = G.metrics(t);
  assert.strictEqual(G.rate(empty.rates.reply), null);
  const { b } = campaignWithBatch(t);
  G.approveBatch(t, b, 'Sam'); G.stageBatch(t, b);
  G.recordAcks(t, b, [{ email: 'ann@acme.com' }, { email: 'bo@acme.com' }], { email: 'email' });
  const EM = { eventId: 'id', type: 'type', email: 'email', occurredAt: 'at', dealId: 'deal', amount: 'amount' };
  G.importEvents(t, [
    { id: 'o1', type: 'opportunity', email: 'ann@acme.com', at: '2026-11-15', deal: 'D1', amount: '40000' },
    { id: 'o2', type: 'opportunity', email: 'bo@acme.com', at: '2026-11-15', deal: 'D1', amount: '40000' }
  ], EM, { provider: 'HubSpot' });
  const m = G.metrics(t);
  assert.strictEqual(m.opportunities, 1); assert.strictEqual(m.pipeline, 40000);
});

test('§8 a mandatory ICP change flags the queued batch and lists who moved out of scope', () => {
  const t = setup();
  const { b } = campaignWithBatch(t);
  G.approveBatch(t, b, 'Sam');
  const next = G.newDraftFrom(t, G.activeICP(t));
  next.disqualifiers.keywords = ['hiring a controller'];
  const r = G.approveICP(t, next, 'Sam');
  assert.ok(r.ok);
  assert.strictEqual(r.impact.newlyExcluded.length, 1);
  assert.strictEqual(G.batchState(t, b), 'needs-review');
  assert.strictEqual(b.needsReview.outOfScope.length, 2);
});

test('§10 conflicting ICP proposals: first advances the version, second needs fresh review', () => {
  const t = setup();
  const v = G.activeICP(t).v;
  const p1 = { id: 'a', topic: 'Logistics', change: { field: 'industries', op: 'add', value: 'Logistics' }, expectedVersion: v, status: 'open' };
  const p2 = { id: 'b', topic: 'Retail', change: { field: 'industries', op: 'add', value: 'Retail' }, expectedVersion: v, status: 'open' };
  t.proposals.push(p1, p2);
  const r1 = G.decideProposal(t, p1, 'approve', 'Sam');
  assert.ok(r1.ok); assert.strictEqual(G.activeICP(t).v, v + 1);
  assert.strictEqual(p2.status, 'needs fresh review');
  const r2 = G.decideProposal(t, p2, 'approve', 'Sam');
  assert.strictEqual(r2.conflict, true);
  assert.ok(G.icpByV(t, v).status === 'retired'); // original preserved
});

test('§6 evidence thresholds count distinct original sources (mirrored copies once)', () => {
  const t = setup();
  t.sources.push({ id: 'n1', originId: 'meet-1' }, { id: 'n2', originId: 'meet-1' }, { id: 'n3' });
  t.observations.push({ id: 'o1', topic: 'Migration', sourceId: 'n1', account: 'acme.com' },
                      { id: 'o2', topic: 'Migration', sourceId: 'n2', account: 'acme.com' },
                      { id: 'o3', topic: 'Migration', sourceId: 'n3', account: 'beta.io' },
                      { id: 'o4', topic: 'Migration', sourceId: 'n3', account: 'beta.io', contrary: true });
  const s = G.topicSummary(t, 'Migration');
  assert.strictEqual(s.distinctSources, 2);
  assert.strictEqual(s.level.label, 'Weak signal');
  assert.strictEqual(s.contrary, 1);
  assert.strictEqual(s.eligible, false);
});

test('P01 tenants share nothing', () => {
  const a = setup(), b = setup();
  G.importAccounts(a, ROWS, AMAP);
  assert.strictEqual(b.accounts.length, 0);
  assert.notStrictEqual(a.id, b.id);
});

test('CSV round-trip, quoting and formula guard', () => {
  const csv = G.toCSV([{ key: 'a' }, { key: 'b' }], [{ a: 'x, "y"', b: '=SUM(A1)' }, { a: '-5', b: 'line\nbreak' }]);
  const p = G.parseCSV(csv);
  assert.strictEqual(p.rows[0].a, 'x, "y"');
  assert.strictEqual(p.rows[0].b, "'=SUM(A1)");
  assert.strictEqual(p.rows[1].a, '-5');
  assert.strictEqual(p.rows[1].b, 'line\nbreak');
});

test('Column auto-mapping recognises common export headers', () => {
  const m = G.autoMap(['Company Name', 'Website', 'Employee Count', 'HubSpot Company ID', 'Lifecycle Stage'], 'accounts');
  assert.strictEqual(m.name, 'Company Name'); assert.strictEqual(m.domain, 'Website');
  assert.strictEqual(m.employees, 'Employee Count'); assert.strictEqual(m.crmId, 'HubSpot Company ID');
  assert.strictEqual(m.lifecycle, 'Lifecycle Stage');
});

console.log('\n' + passed + ' passed' + (process.exitCode ? ', some failed' : ''));
