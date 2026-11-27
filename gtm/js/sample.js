/* A fictional sample client, built by running the real engine steps (import, approve, draft, stage,
   acknowledge, reconcile) so every screen has something to show. All companies use .example domains. */
(function () {
  'use strict';
  var G = window.GTM, App = window.App;
  function ago(d) { return new Date(Date.now() - d * 864e5).toISOString(); }
  function day(d) { return ago(d).slice(0, 10); }

  App.buildSample = function () {
    var t = G.newTenant('Ledgerline (sample)');
    t.sample = true;
    Object.assign(t.profile, {
      website: 'ledgerline.example', offer: 'Accounts-payable automation for mid-market manufacturers',
      geography: 'United States and Canada', outreachOwner: 'Jordan Avery', approver: 'Morgan Lee (VP Marketing)',
      budget: 1500, creditsPerAccount: 6, costPerCredit: 0.12, crm: 'HubSpot', channels: ['Email', 'Calling'],
      sender: 'jordan@ledgerline.example', responseTargetHours: 24,
      notes: 'Pilot: one offer, one persona, email only. Sponsor wants proof claims checked against the won-deal list.'
    });
    var S = function (id, title, type, d, perm, extra) { return Object.assign({ id: id, title: title, type: type, date: day(d), owner: 'Jordan Avery', permission: perm, url: '', originId: '', withdrawn: false, addedAt: ago(d) }, extra || {}); };
    t.sources = [
      S('src_deck', 'Ledgerline sales deck (Q4)', 'Deck', 40, 'public'),
      S('src_kick', 'Discovery call notes: pilot kickoff', 'Call notes', 21, 'internal', { originId: 'mtg-kickoff' }),
      S('src_kick_t', 'Kickoff call transcript', 'Transcript', 21, 'internal', { originId: 'mtg-kickoff' }),
      S('src_won', 'Won/lost deals export (last 18 months)', 'Won/lost export', 18, 'internal'),
      S('src_web', 'ledgerline.example/customers', 'Website', 35, 'public', { url: 'https://ledgerline.example/customers' }),
      S('src_c1', 'Call: Harbor Steel Works', 'Transcript', 6, 'internal', { originId: 'mtg-harbor' }),
      S('src_c2', 'Call: Northfield Plastics', 'Transcript', 9, 'internal', { originId: 'mtg-northfield' }),
      S('src_c3', 'Call: Granite Ridge Metals', 'Transcript', 4, 'internal', { originId: 'mtg-granite' }),
      S('src_c4', 'Call: Cobalt Industrial Supply', 'Call notes', 12, 'internal', { originId: 'mtg-cobalt' }),
      S('src_c5', 'Call: Eastgate Electronics', 'Transcript', 3, 'internal', { originId: 'mtg-eastgate' })
    ];
    t.proof = [
      { id: 'pr_half', text: 'Finance teams using Ledgerline typically cut invoice processing time roughly in half within their first quarter.', sourceId: 'src_won', permission: 'public', verified: true, status: 'active', addedAt: ago(17) },
      { id: 'pr_quote', text: '"We closed the month in four days instead of nine." (Controller, existing customer)', sourceId: 'src_kick', permission: 'internal', verified: true, status: 'active', addedAt: ago(20) },
      { id: 'pr_roi', text: 'Average payback in under six months.', sourceId: 'src_deck', permission: 'public', verified: false, status: 'active', addedAt: ago(30) }
    ];

    // ICP v1: baseline approved, then v2 sharpened after review.
    var v1 = G.newDraftFrom(t);
    v1.industries = { values: ['Manufacturing'], basis: ['src_won'] };
    v1.size = { min: 200, max: 2000, basis: ['src_won', 'src_kick'] };
    v1.geography = { values: ['United States', 'Canada'], basis: ['src_kick'] };
    v1.triggers = { keywords: ['hiring', 'ERP', 'CFO', 'Controller'], recencyDays: 60, basis: [] };
    v1.disqualifiers = { industries: ['Government', 'Education'], keywords: ['bankruptcy'], basis: ['src_kick'] };
    v1.personas = [
      { id: 'per_fin', name: 'Finance leader', priority: 'primary', titles: ['CFO', 'Chief Financial Officer', 'VP Finance', 'Controller', 'Finance Director'],
        pain: 'Invoice volume grows faster than the AP team, so close slips.',
        question: 'When AP headcount grows at your size, is it usually invoice volume outpacing the team, or approvals getting stuck?',
        message: 'Ledgerline lets a mid-market finance team absorb invoice growth without adding AP headcount.' },
      { id: 'per_ap', name: 'AP manager', priority: 'secondary', titles: ['Accounts Payable', 'AP Manager', 'Payables'],
        pain: 'Manual matching and chasing approvals.', question: 'How much of your week goes to chasing invoice approvals?', message: 'Ledgerline matches POs and routes approvals automatically.' }
    ];
    v1.custom = [{ id: 'cu_erp', label: 'Runs a supported ERP (NetSuite, SAP B1, Dynamics)', mandatory: false, filterable: true, basis: ['src_won'] }];
    v1.weights = { industry: 40, size: 25, trigger: 20, buyer: 15 };
    v1.cutoff = 70;
    v1.note = 'Baseline assumptions from kickoff and won deals';
    G.approveICP(t, v1, 'Morgan Lee (VP Marketing)');
    v1.approvedAt = ago(16);
    var v2 = G.newDraftFrom(t, v1);
    v2.industries.values.push('Industrial Distribution');
    v2.note = 'Add Industrial Distribution: 3 of the last 8 won deals were distributors';
    G.approveICP(t, v2, 'Morgan Lee (VP Marketing)');
    v2.approvedAt = ago(14); v1.retiredAt = ago(14);
    t.audit.forEach(function (a, i) { a.at = ago(16 - i * 2); });

    var AC = 'name,domain,industry,employees,country,trigger,trigger date,trigger url,hubspot id,status\n' + [
      ['Harbor Steel Works', 'harborsteel.example', 'Manufacturing', 850, 'United States', 'is hiring an Accounts Payable Manager', day(12), 'https://harborsteel.example/careers/ap-manager', '10021', ''],
      ['Northfield Plastics', 'northfieldplastics.example', 'Manufacturing', 420, 'United States', 'announced an ERP migration to NetSuite', day(20), 'https://northfieldplastics.example/news/netsuite', '10022', ''],
      ['Cobalt Industrial Supply', 'cobaltsupply.example', 'Industrial Distribution', 1200, 'Canada', 'appointed a new CFO', day(30), 'https://cobaltsupply.example/press/new-cfo', '10023', ''],
      ['Granite Ridge Metals', 'graniteridge.example', 'Manufacturing', 1600, 'United States', 'is hiring a Controller', day(8), 'https://graniteridge.example/jobs/controller', '10024', ''],
      ['Eastgate Electronics', 'eastgate.example', 'Electronics Manufacturing', 540, 'United States', 'is hiring a Finance Director', day(35), 'https://eastgate.example/careers/finance-director', '10025', ''],
      ['Pinecrest Packaging', 'pinecrestpack.example', 'Manufacturing', 310, 'United States', '', '', '', '10026', ''],
      ['Redline Fasteners', 'redlinefasteners.example', 'Manufacturing', '', 'United States', 'is hiring two AP clerks', day(5), 'https://redlinefasteners.example/jobs', '', ''],
      ['Keystone Molding', 'keystonemolding.example', 'Manufacturing', 260, 'United States', 'opened a new plant in Ohio', day(15), 'https://keystonemolding.example/news/ohio', '', ''],
      ['Meridian Tooling', 'meridiantooling.example', 'Manufacturing', 150, 'United States', 'is hiring a Controller', day(10), 'https://meridiantooling.example/careers', '', ''],
      ['Summit Foods Co', 'summitfoods.example', 'Food & Beverage', 600, 'United States', '', '', '', '', ''],
      ['Brightwater Distribution', 'brightwater.example', 'Industrial Distribution', 480, 'Mexico', 'is hiring a CFO', day(9), 'https://brightwater.example/careers', '', ''],
      ['Valley County Services', 'valleycounty.example', 'Government', 2000, 'United States', '', '', '', '', ''],
      ['Ironbridge Machining', 'ironbridge.example', 'Manufacturing', 700, 'United States', '', '', '', '10031', 'Customer'],
      ['Atlas Components', 'atlascomponents.example', 'Manufacturing', 950, 'United States', 'is hiring a VP Finance', day(14), 'https://atlascomponents.example/jobs', '10032', 'Open opportunity'],
      ['Harbor Steel Europe', 'eu.harborsteel.example', 'Manufacturing', 140, 'Germany', '', '', '', '', ''],
      ['Delta Works', '', 'Manufacturing', 380, 'United States', '', '', '', '', '']
    ].map(function (r) { return r.map(function (v) { return /,/.test(v) ? '"' + v + '"' : v; }).join(','); }).join('\n');
    var pa = G.parseCSV(AC);
    G.importAccounts(t, pa.rows, G.autoMap(pa.headers, 'accounts'), { source: 'Databar export' });
    t.accounts.forEach(function (a) { a.createdAt = ago(13); a.updatedAt = ago(13); });
    var hs = t.accounts.find(function (a) { return a.domain === 'harborsteel.example'; });
    hs.custom.cu_erp = 'match';

    var CC = 'first name,last name,title,email,company domain,verification,provider,retrieved\n' + [
      ['Dana', 'Ruiz', 'Chief Financial Officer', 'dana.ruiz@harborsteel.example', 'harborsteel.example', 'valid', 'Clay', day(11)],
      ['Leo', 'Park', 'Accounts Payable Manager', 'leo.park@harborsteel.example', 'harborsteel.example', 'valid', 'Clay', day(11)],
      ['Priya', 'Shah', 'VP of Finance', 'priya@northfieldplastics.example', 'northfieldplastics.example', 'valid', 'Clay', day(11)],
      ['Tom', 'Becker', 'Controller', 'tbecker@northfieldplastics.example', 'northfieldplastics.example', 'catch-all', 'Clay', day(11)],
      ['Marc', 'Dubois', 'CFO', 'marc.dubois@cobaltsupply.example', 'cobaltsupply.example', 'valid', 'Clay', day(11)],
      ['Ellen', 'Wu', 'Corporate Controller', 'ellen.wu@graniteridge.example', 'graniteridge.example', 'valid', 'Clay', day(11)],
      ['Raj', 'Patel', 'Controller and Accounts Payable Lead', 'raj.patel@graniteridge.example', 'graniteridge.example', 'valid', 'Clay', day(11)],
      ['Sofia', 'Marin', 'Finance Director', 'sofia.marin@eastgate.example', 'eastgate.example', 'valid', 'Clay', day(11)],
      ['Greg', 'Hill', 'CFO', 'greg.hill@mailbox.example', 'eastgate.example', 'valid', 'Clay', day(11)],
      ['Nora', 'Quinn', 'Operations Manager', 'nora@pinecrestpack.example', 'pinecrestpack.example', 'valid', 'Clay', day(11)],
      ['Ben', 'Ortiz', 'Controller', '', 'keystonemolding.example', '', 'Clay', day(11)]
    ].map(function (r) { return r.join(','); }).join('\n');
    var pc = G.parseCSV(CC);
    G.importContacts(t, pc.rows, G.autoMap(pc.headers, 'contacts'), { provider: 'Clay' });
    t.costs.push(
      { id: G.uid('cost'), at: ago(13), kind: 'Account sourcing', provider: 'Databar', credits: 160, amount: 19.2, estimated: false, note: '16 accounts' },
      { id: G.uid('cost'), at: ago(11), kind: 'Contact enrichment', provider: 'Clay', credits: 66, amount: 7.92, estimated: false, note: '11 contacts across 7 eligible or near-eligible accounts' },
      { id: G.uid('cost'), at: ago(10), kind: 'Model usage', provider: 'AI model', credits: null, amount: 1.4, estimated: false, note: 'Drafting and review, batch 1' },
      { id: G.uid('cost'), at: ago(1), kind: 'Contact enrichment', provider: 'Clay', credits: 36, amount: 4.32, estimated: true, note: 'Approved spend: 6 accounts pending enrichment' },
      { id: G.uid('cost'), at: ago(9), kind: 'Sending', provider: 'Smartlead', credits: null, amount: null, estimated: false, note: 'Seat cost not yet allocated to this client' }
    );
    G.log(t, 'Jordan Avery', 'Imported 16 accounts from Databar export', '14 added, 2 sent to manual resolution');
    G.log(t, 'Jordan Avery', 'Imported 11 contacts from Clay', '');
    t.audit.slice(0, 2).forEach(function (a, i) { a.at = ago(13 - i * 2); });

    var cmp = G.blankCampaign(t);
    Object.assign(cmp, {
      name: 'Finance hiring signal: Q4 pilot', owner: 'Jordan Avery', objective: 'Book held discovery meetings with finance leaders at manufacturers adding finance or AP staff',
      personaId: 'per_fin', pain: 'Invoice growth outpacing the AP team (kickoff call, won-deal notes)',
      hypothesis: 'Finance leaders at companies actively hiring finance or AP staff will take a meeting about absorbing invoice growth without adding headcount.',
      cta: 'Would a 20-minute look at how other manufacturers handle this be useful next week?',
      proofId: 'pr_half', kpi: 'Held meetings', successCriterion: '2 held meetings from the first 25 delivered contacts', windowDays: 30, batchSize: 25,
      senderName: 'Jordan Avery', sender: 'jordan@ledgerline.example', startDate: day(10), budget: 300, createdAt: ago(11)
    });
    cmp.steps = [
      { subject: 'Finance hiring at {{company}}', body: 'Hi {{first_name}},\n\n{{personalization}}\n\n{{question}}\n\n{{proof}}\n\n{{cta}}\n\n{{sender_name}}', delayDays: 0 },
      { subject: 'Re: Finance hiring at {{company}}', body: 'Hi {{first_name}}, one more note in case the timing is better now.\n\nIf invoice volume is the reason for the new role, we can show you what that looks like without the extra hire.\n\n{{cta}}\n\n{{sender_name}}', delayDays: 4 }
    ];
    t.campaigns.push(cmp);
    var r = G.createBatch(t, cmp);
    var b = r.batch; b.createdAt = ago(10);
    G.approveBatch(t, b, 'Morgan Lee (VP Marketing)'); b.approval.at = ago(10);
    G.stageBatch(t, b); b.stagedAt = ago(10);
    var acked = b.rows.filter(function (x) { return x.email.indexOf('eastgate') < 0; }).map(function (x) { return { email: x.email }; });
    G.recordAcks(t, b, acked, { email: 'email' });
    t.enrollments.forEach(function (e) { e.stagedAt = ago(10); if (e.enrolledAt) e.enrolledAt = ago(10); });
    t.audit.slice(0, 4).forEach(function (a) { a.at = ago(10); });

    var EV = [
      ['sl-1001', 'sent', 'dana.ruiz@harborsteel.example', ago(9)], ['sl-1002', 'delivered', 'dana.ruiz@harborsteel.example', ago(9)],
      ['sl-1003', 'sent', 'priya@northfieldplastics.example', ago(9)], ['sl-1004', 'delivered', 'priya@northfieldplastics.example', ago(9)],
      ['sl-1005', 'sent', 'marc.dubois@cobaltsupply.example', ago(9)], ['sl-1006', 'delivered', 'marc.dubois@cobaltsupply.example', ago(9)],
      ['sl-1007', 'sent', 'ellen.wu@graniteridge.example', ago(9)], ['sl-1008', 'delivered', 'ellen.wu@graniteridge.example', ago(9)],
      ['sl-1010', 'positive_reply', 'dana.ruiz@harborsteel.example', ago(7), '', '', 'Yes, happy to look. Thursday works.'],
      ['sl-1011', 'referral', 'priya@northfieldplastics.example', ago(6), '', '', 'Not me, but talk to our AP lead, Jamie Cole.'],
      ['sl-1011', 'referral', 'priya@northfieldplastics.example', ago(6), '', '', 'Not me, but talk to our AP lead, Jamie Cole.'],
      ['sl-1012', 'auto_reply', 'marc.dubois@cobaltsupply.example', ago(6), '', '', 'Out of office until ' + day(-5) + '.'],
      ['sl-1013', 'delivered', 'info@unknownco.example', ago(5)]
    ];
    var HS = [
      ['hs-m-77', 'meeting_booked', 'dana.ruiz@harborsteel.example', ago(6)], ['hs-m-78', 'meeting_held', 'dana.ruiz@harborsteel.example', ago(3)],
      ['hs-d-501', 'opportunity', 'dana.ruiz@harborsteel.example', ago(2), 'D-501', '48000']
    ];
    function load(rows, provider) {
      var csv = 'event id,type,email,occurred at,deal id,amount,text\n' + rows.map(function (r) { return [r[0], r[1], r[2], r[3], r[4] || '', r[5] || '', r[6] ? '"' + r[6] + '"' : ''].join(','); }).join('\n');
      var p = G.parseCSV(csv);
      G.importEvents(t, p.rows, G.autoMap(p.headers, 'events'), { provider: provider });
    }
    load(EV, 'Smartlead'); load(HS, 'HubSpot');
    t.tasks.forEach(function (k) {
      var c = G.contactById(t, k.contactId);
      if (c && c.firstName === 'Dana') { k.status = 'booked'; k.notes = 'Discovery held; opportunity D-501 opened in HubSpot.'; k.hold.acknowledged = true; }
      if (c && c.firstName === 'Priya') { k.status = 'accepted'; }
    });
    t.audit.slice(0, 2).forEach(function (a) { a.at = ago(2); });

    // Learning inbox: observations from calls. Mirrored kickoff notes/transcript count once.
    var O = function (topic, text, src, acc, d, contrary) { return { id: G.uid('obs'), topic: topic, text: text, sourceId: src, account: acc, locator: '', contrary: !!contrary, createdAt: ago(d) }; };
    t.observations = [
      O('Controllers own the AP tooling decision', 'Controller ran the evaluation; CFO only signed.', 'src_c1', 'harborsteel.example', 6),
      O('Controllers own the AP tooling decision', '"I\'d need our controller in the room, she owns this."', 'src_c2', 'northfieldplastics.example', 9),
      O('Controllers own the AP tooling decision', 'Corporate controller asked for the security review packet.', 'src_c3', 'graniteridge.example', 4),
      O('Controllers own the AP tooling decision', 'Kickoff: sponsor says controllers usually champion.', 'src_kick', '', 21),
      O('Controllers own the AP tooling decision', 'Same point in the kickoff transcript.', 'src_kick_t', '', 21),
      O('Controllers own the AP tooling decision', 'CFO made the call alone; controller not involved.', 'src_c4', 'cobaltsupply.example', 12, true),
      O('Migration timing is the main objection', 'Asked who handles migration from the current AP inbox.', 'src_c2', 'northfieldplastics.example', 9),
      O('Migration timing is the main objection', '"We can\'t touch AP until the ERP move is done."', 'src_c5', 'eastgate.example', 3)
    ];
    t.tests.push({ id: G.uid('test'), at: ago(7), hypothesis: 'Lead with the new-hire trigger in the subject line vs. a generic subject', owner: 'Jordan Avery', due: day(-7), status: 'running' });
    return t;
  };
})();
