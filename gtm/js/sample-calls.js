/* Ten fictional SaaS sales calls (six deals) for trying Sales Intelligence and Call insights.
   Every company and person is made up. Each call carries a ready-made analysis built from line references,
   so quotes are always word for word from the transcript. Added and removed as a set. */
(function () {
  'use strict';
  var G = window.GTM, App = window.App;
  var J = 'Jordan Avery', SO = 'Sam Ortiz';
  var DEALS = [
    { k: 'd1', name: 'Brightpath Logistics - Dispatch', company: 'Brightpath Logistics', industry: 'Logistics', stage: 'Contract sent', amount: 38400, owner: J },
    { k: 'd2', name: 'Northwind Dental Group - Scheduling', company: 'Northwind Dental Group', industry: 'Healthcare', stage: 'Negotiation', amount: 32400, owner: J },
    { k: 'd3', name: 'Cobalt Analytics - Enterprise', company: 'Cobalt Analytics', industry: 'Software', stage: 'Contract sent', amount: 86000, owner: SO },
    { k: 'd4', name: 'Harbor Health Partners - Rollout', company: 'Harbor Health Partners', industry: 'Healthcare', stage: 'Demo', amount: 36000, owner: J },
    { k: 'd5', name: 'Summit Freight - Ops', company: 'Summit Freight', industry: 'Logistics', stage: 'Discovery', amount: 18000, owner: J },
    { k: 'd6', name: 'Lumen Retail - Reporting', company: 'Lumen Retail', industry: 'Retail', stage: 'Proposal', amount: 54000, owner: J }
  ];
  // Annotations: [topic, line, ...]. meddic: six letters for Metrics, Economic buyer, Decision criteria,
  // Decision process, Identified pain, Champion; k = known, p = partial, u = unknown.
  var CALLS = [
    { id: 's1', deal: 'd1', days: 54, title: 'Brightpath discovery', b: ['Maria Chen'], lines: [
      [J, 'Thanks for making time, Maria. What made you take the call?'],
      ['Maria Chen', 'We run dispatch for 40 drivers on spreadsheets and it\'s breaking. Every Monday someone spends four hours reconciling routes by hand.'],
      [J, 'What happens when it goes wrong?'],
      ['Maria Chen', 'Customers call asking where their delivery is and nobody knows. That\'s the part that hurts.'],
      ['Maria Chen', 'How long does onboarding take? We can\'t stop operations for a month.'],
      [J, 'Most teams your size are live in two weeks, and we run the setup with you.'],
      ['Maria Chen', 'Does it integrate with HubSpot? That\'s our source of truth for sales.'],
      [J, 'Yes, there\'s a native HubSpot integration that syncs both ways.'],
      ['Maria Chen', 'Okay. My worry is the learning curve. The drivers hate new apps.'],
      [J, 'The driver view is one screen, and we train the dispatch team on site.'],
      ['Maria Chen', 'That would save us hours every week. Our COO, Dan, signs off on anything over 25k.'],
      ['Maria Chen', 'Can we get Dan on a demo next week?'],
      [J, 'Absolutely. I\'ll send times for Tuesday or Wednesday.']],
      a: { sent: 'positive', next: [true, 'Demo with COO Dan', 7], meddic: 'kkppkp', summary: 'Brightpath runs dispatch for 40 drivers on spreadsheets and loses four hours every Monday. Onboarding time and driver adoption are the open questions. A demo with the COO, who signs off over 25k, is booked for next week.',
        pains: [['Manual spreadsheet work', 1], ['Customers lack visibility', 3]], questions: [['Onboarding time', 4], ['CRM integration', 6]],
        objections: [['Team adoption', 8, 'partly', 'One-screen driver view and on-site training']], positives: [['Time savings', 10]],
        notes: { metrics: 'Four hours lost every Monday reconciling routes', economicBuyer: 'COO Dan signs anything over 25k', identifyPain: 'Customers can\'t see delivery status', champion: 'Maria is driving the evaluation' } } },
    { id: 's2', deal: 'd2', days: 48, title: 'Northwind demo', b: ['Greg Patel'], lines: [
      [J, 'Last time you mentioned scheduling across six offices. Let me show you the shared calendar.'],
      ['Greg Patel', 'Okay, that\'s actually pretty slick. Seeing all six offices on one screen is new for us.'],
      [J, 'And reminders go out automatically by text.'],
      ['Greg Patel', 'How much is it, though? Per seat?'],
      [J, 'It\'s per location, starting at 450 a month per office.'],
      ['Greg Patel', 'That\'s too expensive for us. It\'s double what we pay now for our current system.'],
      [J, 'What does your current system cost you in no-shows?'],
      ['Greg Patel', 'Honestly I don\'t know. But the price is the first thing my owner will look at.'],
      ['Greg Patel', 'Is there a discount if we sign an annual contract?'],
      [J, 'There is an annual option. I can put together numbers.'],
      ['Greg Patel', 'Also, I wish it could send reminders in Spanish. Half our patients prefer it.'],
      ['Greg Patel', 'Let me talk to the owner and get back to you.']],
      a: { sent: 'mixed', next: [false, 'Greg will talk to the owner'], meddic: 'uppupu', summary: 'Greg liked the shared calendar across six offices but pushed back hard on price, anchoring to his current system at half the cost. The owner decides and has not been on a call. No next step agreed.',
        positives: [['Shared calendar', 1]], questions: [['Pricing model', 3], ['Contract terms', 8]], objections: [['Price too high', 5, 'partly', 'Asked about the cost of no-shows; offered annual pricing']],
        competitors: [['Current system', 5, 'current vendor']], feedback: [['Spanish reminders', 10, 'missing', 'medium']], risks: ['The owner decides and hasn\'t been involved', 'Price is anchored to the current tool'] } },
    { id: 's3', deal: 'd3', days: 41, title: 'Cobalt security and integration deep dive', b: ['Priya Shah', 'Leo Park'], rep: SO, lines: [
      [SO, 'Today is the security and integration deep dive. Where do you want to start?'],
      ['Priya Shah', 'Security. Do you support SSO with Okta?'],
      [SO, 'Yes, SAML SSO with Okta, Azure AD and Google, plus SCIM provisioning.'],
      ['Leo Park', 'Are you SOC 2 Type II? Our procurement won\'t move without it.'],
      [SO, 'We are. I\'ll send the report under NDA today.'],
      ['Leo Park', 'Where is the data stored? We have EU customers, so US-only hosting is a deal breaker.'],
      [SO, 'You can choose US or EU hosting at setup.'],
      ['Priya Shah', 'Wow, the audit log is better than what we have internally.'],
      ['Priya Shah', 'Is there an API, or does it connect to our warehouse out of the box?'],
      [SO, 'There\'s a REST API and a nightly export to Snowflake or BigQuery.'],
      ['Leo Park', 'The permissions model looks solid. I\'d like role-based access per project though.'],
      ['Priya Shah', 'If the security review passes, our CTO Anika makes the call. She\'ll want to see it.'],
      [SO, 'Let\'s book the review and a session with Anika for the following week.']],
      a: { sent: 'positive', next: [true, 'Security review, then a session with CTO Anika', 9], meddic: 'ukkkpp', summary: 'Cobalt\'s IT and security leads went deep on SSO, SOC 2, data residency and the API, and reacted well to the audit log. The CTO decides once the security review passes; both are booked.',
        questions: [['Security and SSO', 1], ['SOC 2 report', 3], ['Data residency', 5], ['API access', 8]], positives: [['Audit log', 7], ['Permissions model', 10]],
        feedback: [['Role-based access per project', 10, 'missing', 'medium']], notes: { economicBuyer: 'CTO Anika makes the call', decisionCriteria: 'Must pass the security review (SSO, SOC 2, residency)', decisionProcess: 'Security review, then CTO sign-off' } } },
    { id: 's4', deal: 'd4', days: 35, title: 'Harbor Health onboarding questions', b: ['Dana Ruiz'], lines: [
      [J, 'You mentioned last time that timing is the big question.'],
      ['Dana Ruiz', 'Yes. We tried to switch tools two years ago and it was a disaster. Onboarding took four months.'],
      ['Dana Ruiz', 'How long does onboarding take, realistically, for a team of 30?'],
      [J, 'Typically three weeks. We migrate your data and run two training sessions.'],
      ['Dana Ruiz', 'Do we get a dedicated person during setup, or is it a ticket queue?'],
      [J, 'You get a named onboarding manager for the first 90 days.'],
      ['Dana Ruiz', 'That helps. I\'m still worried, my team is stretched thin and won\'t have time for training in January.'],
      [J, 'We can start in February and record every session.'],
      ['Dana Ruiz', 'Can we import our old records from spreadsheets?'],
      [J, 'Yes, our team does the import for you.'],
      ['Dana Ruiz', 'Okay. Send me a proposed timeline and I\'ll share it with the partners.']],
      a: { sent: 'mixed', next: [true, 'Send a proposed onboarding timeline', 3], meddic: 'upppkk', summary: 'Dana is wary after a failed four-month rollout two years ago. Onboarding time, a named onboarding manager and data import were the focus. She will take a timeline to the partners.',
        pains: [['Failed past rollout', 1]], questions: [['Onboarding time', 2], ['Dedicated support', 4], ['Data import', 8]], objections: [['No time for training', 6, 'yes', 'Start in February and record every session']],
        notes: { identifyPain: 'Past rollout took four months', champion: 'Dana is sponsoring internally' } } },
    { id: 's5', deal: 'd1', days: 46, title: 'Brightpath demo with the COO', b: ['Maria Chen', 'Dan Brooks'], lines: [
      [J, 'Dan, Maria walked us through the Monday reconciliation. Here\'s what it looks like in the platform.'],
      ['Dan Brooks', 'So routes update live when a driver finishes a stop?'],
      [J, 'Live, and customers get a tracking link automatically.'],
      ['Dan Brooks', 'Wow. That alone would cut half the calls our support team takes.'],
      ['Maria Chen', 'This is exactly what we need for the dispatch team.'],
      ['Dan Brooks', 'What does it cost for 40 drivers?'],
      [J, 'For your size it\'s about 3,200 a month on an annual plan.'],
      ['Dan Brooks', 'That\'s within what we budgeted. What about contract length? We don\'t love three-year deals.'],
      [J, 'Annual is standard, and you can start with a one-year term.'],
      ['Dan Brooks', 'Good. How fast could we be live? Peak season starts in March.'],
      [J, 'If we sign by mid-January, you\'re live by mid-February.'],
      ['Dan Brooks', 'Let\'s do it. Send the order form and I\'ll get legal to review this week.']],
      a: { sent: 'positive', next: [true, 'Order form to legal this week', 2], meddic: 'kkkkkk', summary: 'The COO saw live route updates and automatic tracking links and called it a cut to half their support calls. Price fits the budget on a one-year term, go-live before March works, and the order form goes to legal this week.',
        questions: [['Live updates', 1], ['Pricing model', 5], ['Contract terms', 7], ['Onboarding time', 9]], positives: [['Live dashboard', 3], ['Dispatch fit', 4]],
        objections: [['Long contracts', 7, 'yes', 'One-year term available']], notes: { metrics: 'Halve support calls; four hours a week back', economicBuyer: 'COO Dan, budget confirmed', decisionProcess: 'Order form, then legal review this week' } } },
    { id: 's6', deal: 'd5', days: 30, title: 'Summit Freight intro', b: ['Ken Wallace'], lines: [
      [J, 'Thanks for jumping on, Ken. What are you hoping to see today?'],
      ['Ken Wallace', 'Honestly, we\'re already looking at FlowStack and they\'re cheaper.'],
      [J, 'Understood. What made you look beyond them?'],
      ['Ken Wallace', 'Their reporting is weak. But your price is double what we pay now, and I can\'t justify that to finance.'],
      [J, 'Our customers usually see payback in about four months.'],
      ['Ken Wallace', 'Maybe, but I\'d need proof. Do you have a customer in freight I can talk to?'],
      [J, 'I\'ll check which references we can share.'],
      ['Ken Wallace', 'Also, does it work offline? Our drivers lose signal on rural routes.'],
      [J, 'Offline mode isn\'t available yet. It\'s on the roadmap.'],
      ['Ken Wallace', 'That\'s a deal breaker for us right now.'],
      ['Ken Wallace', 'I\'ll be honest, I don\'t think this is a fit this quarter.']],
      a: { sent: 'negative', next: [false, ''], meddic: 'uupuuu', summary: 'Summit is comparing a cheaper competitor and sees our price as double. No freight reference was offered, and the missing offline mode is a deal breaker for rural routes. Not a fit this quarter.',
        competitors: [['FlowStack', 1, 'evaluating']], objections: [['Price too high', 3, 'partly', 'Cited four-month payback without proof'], ['Offline mode missing', 9, 'no', 'On the roadmap']],
        questions: [['Customer references', 5, false], ['Offline mode', 7]], feedback: [['Offline mode', 9, 'blocker', 'high']], risks: ['Cheaper competitor in play', 'Offline mode is a hard requirement'] } },
    { id: 's7', deal: 'd2', days: 27, title: 'Northwind follow-up with the owner', b: ['Greg Patel', 'Dr. Lisa Moreno'], lines: [
      [J, 'Dr. Moreno, thanks for joining. I put together the annual numbers Greg asked for.'],
      ['Dr. Lisa Moreno', 'I looked. It\'s still more than double what we pay now.'],
      [J, 'With six offices, one fewer no-show a day per office covers the difference.'],
      ['Dr. Lisa Moreno', 'I hear that, but I\'ve heard those promises before. Our current system works well enough.'],
      ['Greg Patel', 'The Spanish reminders were a big one for us. Is that available yet?'],
      [J, 'Not yet. It\'s planned for next quarter.'],
      ['Dr. Lisa Moreno', 'Then I don\'t see a reason to switch right now. Maybe revisit in the summer.'],
      [J, 'Would a three-month pilot at one office help?'],
      ['Dr. Lisa Moreno', 'Maybe. Send me something in writing, but no promises.']],
      a: { sent: 'negative', next: [true, 'Send a one-office pilot proposal in writing', 5], meddic: 'pkpuuu', summary: 'The owner still sees the price as more than double, doubts the no-show math, and is comfortable with the current system. Missing Spanish reminders removed her reason to switch now. A one-office pilot proposal is the only open path.',
        objections: [['Price too high', 1, 'partly', 'One fewer no-show per office covers it'], ['Status quo is fine', 3, 'no', ''], ['Spanish reminders missing', 6, 'no', 'Planned next quarter']],
        questions: [['Spanish reminders', 4]], competitors: [['Current system', 3, 'current vendor']], feedback: [['Spanish reminders', 4, 'blocker', 'high']], risks: ['Owner is skeptical of ROI claims', 'Comfortable with the status quo'] } },
    { id: 's8', deal: 'd3', days: 20, title: 'Cobalt review with the CTO', b: ['Priya Shah', 'Anika Rao'], rep: SO, lines: [
      [SO, 'Anika, the security review came back clean. Any open questions from your side?'],
      ['Anika Rao', 'One. How do you handle data deletion when a customer leaves?'],
      [SO, 'Data is deleted within 30 days of contract end, and we send a certificate.'],
      ['Anika Rao', 'Good. And uptime? We can\'t have this down during month-end.'],
      [SO, '99.9 percent uptime SLA, with credits if we miss it.'],
      ['Priya Shah', 'The team loved the sandbox. Two of our analysts built reports in an afternoon.'],
      ['Anika Rao', 'That\'s impressive. What about onboarding for 120 users across three regions?'],
      [SO, 'Admins first, then regional sessions. Usually four weeks end to end.'],
      ['Anika Rao', 'Pricing came in above budget. Is there flexibility if we commit to two years?'],
      [SO, 'Yes, a two-year term brings it down about 12 percent.'],
      ['Anika Rao', 'Then send the revised proposal. If legal is fine, we can sign before the end of the month.']],
      a: { sent: 'positive', next: [true, 'Revised two-year proposal; sign by month-end', 4], meddic: 'pkkkkk', summary: 'The security review passed. The CTO asked about data deletion, uptime and onboarding 120 users, and the analysts loved the sandbox. Price was above budget until a two-year term; signature expected by month-end.',
        questions: [['Data deletion', 1], ['Uptime SLA', 3], ['Onboarding time', 6], ['Contract terms', 8]], positives: [['Sandbox', 5]],
        objections: [['Price too high', 8, 'yes', 'Two-year term about 12% lower']], notes: { economicBuyer: 'CTO Anika', decisionProcess: 'Revised proposal, legal, signature by month-end', champion: 'Priya' } } },
    { id: 's9', deal: 'd6', days: 12, title: 'Lumen Retail demo', b: ['Rachel Kim', 'Tom Becker'], lines: [
      [J, 'Rachel, you said campaign reporting takes your team two days a month. Let me show you the live dashboard.'],
      ['Rachel Kim', 'Wait, that updates automatically? Wow, that\'s the whole two days gone.'],
      ['Tom Becker', 'Can I build my own views, or is it fixed out of the box?'],
      [J, 'You can drag any metric onto your own view and share it.'],
      ['Tom Becker', 'That\'s really cool. I can see the team using this every day.'],
      ['Rachel Kim', 'How does it connect to Salesforce? That\'s our source of truth.'],
      [J, 'Native Salesforce connector, set up in about an hour.'],
      ['Rachel Kim', 'What\'s the learning curve? My team is stretched thin.'],
      [J, 'Most people are comfortable after one 45-minute session.'],
      ['Rachel Kim', 'I\'d love a way to schedule reports to Slack every Monday.'],
      [J, 'Slack delivery is built in. I\'ll show you next time.'],
      ['Rachel Kim', 'Great. I want to bring our VP, Carla, into the next call. She owns the budget.']],
      a: { sent: 'positive', next: [true, 'Call with VP Carla, who owns the budget', 7], meddic: 'kpppkk', summary: 'The live dashboard drew the strongest reaction: it removes two days of monthly reporting. Custom views, the Salesforce connector and a short learning curve landed well. Rachel is bringing the VP who owns the budget.',
        pains: [['Manual reporting', 1]], questions: [['Custom views', 2], ['CRM integration', 5], ['Learning curve', 7]], positives: [['Live dashboard', 1], ['Custom views', 4]],
        feedback: [['Scheduled Slack reports', 9, 'confusing', 'low']], notes: { metrics: 'Two days a month on campaign reporting', economicBuyer: 'VP Carla owns the budget', champion: 'Rachel' } } },
    { id: 's10', deal: 'd6', days: 4, title: 'Lumen Retail with the VP', b: ['Rachel Kim', 'Carla Nguyen'], lines: [
      [J, 'Carla, Rachel\'s team saw the live dashboard last week. What matters most to you?'],
      ['Carla Nguyen', 'Cost and time to value. We just went through a painful rollout with another tool.'],
      ['Carla Nguyen', 'The quote is higher than I expected. Why per seat and not per team?'],
      [J, 'Per seat keeps it fair as you grow. For 25 seats we can do a team bundle.'],
      ['Carla Nguyen', 'I\'d want to see that bundle before I take it to finance.'],
      ['Rachel Kim', 'Carla, this would save us hours every week. That\'s real.'],
      ['Carla Nguyen', 'How long does onboarding take for 25 people, honestly?'],
      [J, 'Two weeks, including the Salesforce setup and two training sessions.'],
      ['Carla Nguyen', 'And if adoption is poor after three months? Can we get out?'],
      [J, 'We can add a 90-day opt-out to the first term.'],
      ['Carla Nguyen', 'That makes it easier. Send the bundle and the opt-out terms, and let\'s regroup Friday.']],
      a: { sent: 'mixed', next: [true, 'Send the team bundle and opt-out terms; regroup Friday', 3], meddic: 'kkkpkk', summary: 'The VP cares about cost and time to value after a painful rollout elsewhere. She pushed back on per-seat pricing and asked about onboarding and an exit if adoption is poor. A team bundle and a 90-day opt-out keep it moving; regroup Friday.',
        pains: [['Failed past rollout', 1]], questions: [['Pricing model', 2], ['Onboarding time', 6], ['Contract terms', 8]],
        objections: [['Price too high', 2, 'partly', 'Offered a team bundle'], ['Team adoption', 8, 'yes', '90-day opt-out']], positives: [['Time savings', 5]],
        notes: { decisionCriteria: 'Cost and time to value', economicBuyer: 'VP Carla', champion: 'Rachel' } } }
  ];
  var REPORT = { summary: 'Price is the most common objection and it is usually anchored to a cheaper current tool, but it is overcome when the buyer has seen time saved and is offered term flexibility. Onboarding time comes up on half the calls, sharpened by past failed rollouts. Live, automatic dashboards produce the strongest reactions, while missing offline mode and Spanish reminders are blocking specific deals.',
    items: [
      ['Trend', 'Price pushback is the most common objection', 'Both', 'Buyers compare against what they pay today. Where it was overcome, the rep tied price to hours saved and offered a shorter or longer term, not a discount alone.', [['s2', 5], ['s6', 3], ['s10', 2], ['s8', 8]]],
      ['Trend', 'Onboarding time is asked on half the calls', 'Both', 'Almost always phrased as how long, honestly, and often after a bad rollout elsewhere. A concrete week count plus a named onboarding manager settles it.', [['s1', 4], ['s4', 2], ['s10', 6]]],
      ['Question', 'Does it connect to our CRM?', 'Product', 'HubSpot and Salesforce come up early in discovery as the system of record. Answering with setup time (about an hour) worked well.', [['s1', 6], ['s9', 5]]],
      ['Question', 'Security buyers need SSO and SOC 2 before anything else', 'Product', 'Enterprise evaluations open with SSO, SOC 2 Type II and data residency. Having the report ready under NDA kept Cobalt moving.', [['s3', 1], ['s3', 3], ['s3', 5]]],
      ['Product', 'Offline mode is blocking field-heavy deals', 'Product', 'Validate how many logistics prospects need offline use. It was called a deal breaker on the one call where it came up.', [['s6', 7], ['s6', 9]]],
      ['Product', 'Spanish-language reminders requested twice by the same account', 'Product', 'Raised in the demo and again by the owner as a reason not to switch now. Worth validating demand beyond this account.', [['s2', 10], ['s7', 4]]],
      ['Marketing', 'Live dashboards create the biggest wow moments', 'Marketing', 'Buyers react to things updating automatically and to work disappearing. Lead demos with the live view.', [['s9', 1], ['s5', 3], ['s8', 5]]],
      ['Marketing', 'Buyers describe the pain as hours lost every week', 'Marketing', 'Time, not features, is the language they use. Good hook material.', [['s1', 1], ['s10', 5], ['s1', 10]]],
      ['Watch', 'Cheaper tools and the status quo stall deals', 'Both', 'When there is no champion and the economic buyer is skeptical, price plus an existing tool ends the conversation.', [['s7', 3], ['s6', 1]]],
      ['Watch', 'Past failed rollouts make buyers cautious', 'Both', 'Two buyers opened with a bad switching experience. Address it before they raise it.', [['s4', 1], ['s10', 1]]]
    ] };

  function stamp(i) { var s = i * 13 + 5; return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function transcriptOf(c) { return c.lines.map(function (l, i) { return '[' + stamp(i) + '] ' + l[0] + ': ' + l[1]; }).join('\n'); }
  function buildAnalysis(c) {
    var a = c.a, q = function (i) { return c.lines[i] ? c.lines[i][1] : ''; }, keys = G.MEDDIC.map(function (x) { return x.key; }), st = { k: 'known', p: 'partial', u: 'unknown' };
    var m = {}; keys.forEach(function (k, i) { m[k] = { status: st[a.meddic[i]], note: (a.notes || {})[k] || '', quote: '' }; });
    var due = a.next[2] ? new Date(Date.now() - (c.days - a.next[2]) * 864e5).toISOString().slice(0, 10) : '';
    return {
      summary: a.summary, sentiment: a.sent, nextStep: { agreed: !!a.next[0], text: a.next[1] || '', date: due }, meddic: m,
      objections: (a.objections || []).map(function (o) { return { topic: o[0], quote: q(o[1]), handled: o[2], response: o[3] || '' }; }),
      questions: (a.questions || []).map(function (o) { return { topic: o[0], quote: q(o[1]), answered: o[2] !== false }; }),
      pains: (a.pains || []).map(function (o) { return { topic: o[0], quote: q(o[1]) }; }),
      competitors: (a.competitors || []).map(function (o) { return { topic: o[0], quote: q(o[1]), context: o[2] }; }),
      feedback: (a.feedback || []).map(function (o) { return { topic: o[0], quote: q(o[1]), type: o[2], severity: o[3] }; }),
      positives: (a.positives || []).map(function (o) { return { topic: o[0], quote: q(o[1]) }; }),
      risks: a.risks || []
    };
  }
  App.hasSampleCalls = function (t) { return (t.calls || []).some(function (c) { return c.sampleCall; }); };
  App.addSampleCalls = function (t) {
    t.calls = t.calls || []; t.deals = t.deals || []; t.insightReports = t.insightReports || [];
    if (App.hasSampleCalls(t)) return 0;
    var dmap = {};
    DEALS.forEach(function (d) {
      var x = { id: G.uid('deal'), crmId: 'SAMPLE-' + d.k.toUpperCase(), name: d.name, company: d.company, industry: d.industry, stage: d.stage, amount: d.amount, owner: d.owner, accountId: null, source: 'Sample data', createdAt: G.now(), sampleCall: true };
      t.deals.push(x); dmap[d.k] = x;
    });
    var idMap = {};
    CALLS.forEach(function (c) {
      var rep = c.rep || J, sides = {}; sides[rep] = 'seller'; c.b.forEach(function (n) { sides[n] = 'buyer'; });
      c.lines.forEach(function (l) { if (!sides[l[0]]) sides[l[0]] = l[0] === J || l[0] === SO ? 'seller' : 'buyer'; });
      var date = new Date(Date.now() - c.days * 864e5).toISOString(), tx = transcriptOf(c), d = dmap[c.deal];
      var call = { id: G.uid('call'), title: c.title + ' (sample)', date: date, source: 'Sample call', transcript: tx, sides: sides, reps: [rep], dealId: d.id, accountId: null, segment: DEALS.find(function (x) { return x.k === c.deal; }).industry, createdAt: G.now(), sampleCall: true };
      call.analysis = buildAnalysis(c); call.analyzedAt = G.now();
      var src = { id: G.uid('src'), title: 'Call: ' + call.title, type: 'Transcript', date: date.slice(0, 10), owner: rep, permission: 'internal', url: '', originId: call.id, withdrawn: false, addedAt: G.now(), content: tx, sampleCall: true };
      t.sources.push(src); call.sourceId = src.id; t.calls.push(call); idMap[c.id] = call;
    });
    t.profile.teamNames = G.uniq((t.profile.teamNames || []).concat([J, SO]));
    var calls = CALLS.map(function (c) { return idMap[c.id]; });
    t.insightReports.unshift({ id: G.uid('rep'), createdAt: G.now(), callIds: calls.map(function (c) { return c.id; }), scopeLabel: 'All dates · sample calls', sample: true, sampleCall: true,
      summary: REPORT.summary, dropped: 0,
      items: REPORT.items.map(function (it) {
        var ev = it[4].map(function (e) { var src = CALLS.find(function (c) { return c.id === e[0]; }); return { callId: idMap[e[0]].id, quote: src.lines[e[1]][1] }; });
        return { section: it[0], title: it[1], audience: it[2], detail: it[3], evidence: ev, callCount: G.uniq(ev.map(function (e) { return e.callId; })).length };
      }) });
    G.log(t, 'Operator', 'Added sample calls', CALLS.length + ' calls, ' + DEALS.length + ' deals');
    return CALLS.length;
  };
  App.removeSampleCalls = function (t) {
    var gone = {}; (t.calls || []).forEach(function (c) { if (c.sampleCall) gone[c.id] = 1; });
    t.calls = (t.calls || []).filter(function (c) { return !c.sampleCall; });
    t.deals = (t.deals || []).filter(function (d) { return !d.sampleCall; });
    t.sources = t.sources.filter(function (s) { return !s.sampleCall; });
    t.insightReports = (t.insightReports || []).filter(function (r) { return !r.sampleCall; });
    t.observations = t.observations.filter(function (o) { return !gone[o.callId]; });
    G.log(t, 'Operator', 'Removed sample calls');
  };
})();
