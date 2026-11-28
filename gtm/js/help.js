/* Field help: a "?" next to labels that explains exactly what to enter, with an example.
   Help is looked up by the input's id first, then by the label's text, so every screen and dialog
   picks it up automatically as it renders. Edit the wording here. */
(function () {
  'use strict';
  var App = window.App, esc = App.esc;

  var BY_ID = {
    /* Client setup */
    'f-name': 'The client\'s business name as you\'d say it to them, e.g. "Acme Robotics". It appears on exports and the weekly brief.',
    'f-website': 'The client\'s main website, e.g. acmerobotics.com. GTM Engine uses it when suggesting the ICP. Just the domain is fine.',
    'f-offer': 'The one product or service this pilot sells, in a sentence: what it is, who it\'s for and the result. Example: "Predictive maintenance sensors that cut unplanned downtime for packaging plants." Keep it to one offer per pilot.',
    'f-geography': 'Where the client wants to sell, e.g. "United States and Canada" or "Texas and Oklahoma". This is for your reference and GTM Engine\'s suggestions; the hard filter is set on the ICP.',
    'f-crm': 'Where the client tracks deals. Meetings and deals are matched back to this system. Pick "None yet" if they don\'t have one.',
    'f-notes': 'Anything from the discovery call that shapes targeting: who buys today, recent wins and losses, competitors, words to avoid, anything off limits. GTM Engine reads this when suggesting the ICP.',
    'f-outreachOwner': 'The person who runs the campaigns day to day, often you or a VA. Replies with no CRM owner go to them, and their name signs emails by default.',
    'f-approver': 'The person at the client who is allowed to approve who gets contacted and what the emails say, usually the founder or head of sales or marketing. Their name is recorded on every approval.',
    'f-budget': 'The total the client agreed to spend on data and AI for this pilot, in US dollars (e.g. enrichment credits). Enrichment spend is blocked once it would go over this. Leave blank if not agreed yet.',
    'f-creditsPerAccount': 'Roughly how many data-provider credits it takes to find the buyers at one company. Check your Databar or Clay pricing; 5 to 10 is common. Used only to estimate cost before you approve spend.',
    'f-costPerCredit': 'What one provider credit costs you in dollars, e.g. 0.12. Credits per account × cost per credit = estimated cost per company.',
    'f-sender': 'The email inbox the outreach sends from, e.g. jordan@getacme.com. It is recorded on every approved batch, so the approval covers who sends it.',
    'f-responseTargetHours': 'How quickly someone should answer a real (human) reply, in hours. Replies older than this show as overdue. 24 is typical.',
    'sup-in': 'An email address or a whole domain the client never wants contacted: partners, competitors, past complaints. Adding "acme.com" blocks everyone at Acme.',
    'sup-why': 'A short reason, e.g. "Partner" or "Asked not to be contacted". Shown wherever the block applies.',

    /* Sources and proof */
    'sa-x': 'Paste a call transcript or your notes straight from Fireflies, Fathom, Zoom, Gong or anywhere else. Keep speaker names and timestamps if you have them. GTM Engine reads this when suggesting the ICP and personas, and you can open it again from the Sources list.',
    'sa-t': 'A name you\'ll recognise later, e.g. "Discovery call with Pat, Oct 3" or "Won/lost deals 2025".',
    'sa-ty': 'What kind of material this is. Call notes and transcripts are where buyer language and objections usually come from.',
    'sa-d': 'When the material was created or the call happened, not today\'s date. Old sources are easier to spot this way.',
    'sa-o': 'Who provided or owns this material, e.g. the client sponsor or you.',
    'sa-p': '"Public use" means the client allows what\'s in it to be quoted or claimed in outreach. Anything internal (call recordings, private numbers) stays "Internal only" and is never put in emails.',
    'sa-u': 'Optional link to where the original lives, like a Google Drive file or web page.',
    'sa-or': 'Optional. If you have both notes and a transcript of the same call, give them the same ID (e.g. "call-2026-10-03") so they count as one piece of evidence, not two.',
    'sa-f': 'Optional. Text files (.txt, .md, .vtt, .srt, .csv) are stored so you can open them here and GTM Engine can read them. Other files are recorded by name only.',
    'pa-t': 'A result, quote or fact the client is allowed to say, written exactly as it may appear in an email. Example: "Customers cut invoice processing time by half in their first quarter."',
    'pa-s': 'The source that proves it, such as a case study or won-deal list.',
    'pa-p': 'Only "Public use" proof can appear in outreach. Use "Internal only" for anything the client hasn\'t cleared.',
    'pa-v': 'Tick only once you\'ve checked the claim against the source. Unverified proof is held back from emails automatically.',

    /* ICP */
    'w-industry': 'Points for being in one of the target industries.',
    'w-size': 'Points for being inside the employee range.',
    'w-trigger': 'Points for a recent buying signal with a date and a source link, like a job posting or a new executive.',
    'w-buyer': 'Points once you\'ve found a verified contact whose title matches a buyer persona.',
    'icp-note': 'A sentence on what changed and why, e.g. "Added Logistics: 3 of the last 8 wins were logistics companies." It is saved with the approval.',
    'ap-by': 'Who is approving. This should be the client\'s authorised approver from setup.',

    /* Campaign brief */
    'cb-name': 'A short name you\'ll recognise in reports, e.g. "Q1 hiring signal: Finance leaders".',
    'cb-owner': 'Who runs this campaign. Replies go to them when the CRM has no owner.',
    'cb-objective': 'What the client wants in business terms, e.g. "Book 5 held discovery meetings with manufacturing CFOs this month."',
    'cb-personaId': 'Who these emails are written for. Only contacts matched to this persona are drafted.',
    'cb-proofId': 'A result or quote to include as {{proof}}. Only verified, public-use proof is inserted; anything else is left out automatically.',
    'cb-pain': 'The problem this campaign speaks to, and why you believe it, e.g. "AP can\'t keep up with invoice volume (raised in 3 discovery calls)."',
    'cb-hypothesis': 'What you\'re testing, written as "If we tell X about Y, they will Z." Example: "If we tell CFOs who are hiring AP staff they can skip the hire, they\'ll take a 20-minute call."',
    'cb-cta': 'The one small thing you ask the reader to do, inserted as {{cta}}. Example: "Worth a 15-minute call next week?"',
    'cb-channel': 'How the messages are sent. Email (through Smartlead) for the pilot; LinkedIn comes later.',
    'cb-sender': 'The inbox these emails send from. It\'s part of what the approver signs off on.',
    'cb-senderName': 'The name that signs the emails, inserted as {{sender_name}}.',
    'cb-batchSize': 'How many contacts to draft per batch. Smaller batches (around 25) are quicker to review and easier to learn from.',
    'cb-kpi': 'The one number that decides whether this campaign worked.',
    'cb-successCriterion': 'The target for that number, so you know when it\'s a win. Example: "2 held meetings from the first 25 delivered."',
    'cb-windowDays': 'How many days after sending a reply, meeting or deal still counts toward this campaign. 30 is typical.',
    'cb-budget': 'Optional spend cap for this campaign alone, in dollars.',
    'ba-by': 'Who is approving this batch. Their name is recorded with exactly what they approved.',

    'sg-focus': 'Optional. Narrow the suggestions, e.g. "only Ohio and Indiana", "family-owned", "food packaging plants". Leave blank to use the ICP as is.',
    'ca-n': 'The person\'s full name as it appears on their profile.',
    'ca-t': 'Their job title as shown on LinkedIn or the company site. It\'s matched to your buyer personas automatically.',
    'ca-e': 'Their work email if you have it. Don\'t guess email formats: guessed addresses bounce and hurt your sending reputation. Leave blank and find it later.',
    'ca-v': 'Whether the email has been checked by a verification tool. Only verified emails can be included in a batch.',
    'ce-e': 'Their work email, from LinkedIn, the company site, a signature or an enrichment tool. Don\'t guess the format: guessed addresses bounce and hurt your sending reputation.',
    'ce-v': 'Whether a verification tool has checked this address. Only verified emails can go into a batch.',
    'ca-l': 'Optional link to their LinkedIn profile, so anyone can double-check who this is.',

    'cl-x': 'The full call transcript. Speaker names matter: they let GTM Engine measure how much the buyer talked and separate what the buyer said from the seller. Most tools export lines like "Name: text" or "Name 0:05", which both work.',
    'cl-f': 'Upload the transcript file instead of pasting. Fathom, Zoom, Gong, Teams and Meet exports (.txt, .vtt, .srt) all work.',
    'cl-t': 'A name you\'ll recognise, e.g. "Acme discovery call". Defaults to the deal name and date.',
    'cl-d': 'When the call happened. Trends and deal timelines use this date.',
    'cl-deal': 'The HubSpot deal this call belongs to, so it counts toward that deal\'s health and MEDDIC. Create a deal here if it isn\'t in the list yet.',
    'cl-acc': 'Optional. The company from your account list, so trends can count how many different companies raise each issue.',
    'cl-go': 'Analyze straight after saving: questions, objections, pains, competitors, product feedback, MEDDIC and next steps.',
    'lk-d': 'The deal this call belongs to.',

    /* Imports */
    'iw-src': 'Where the list came from, e.g. "Databar export, Nov 20". It\'s kept on each account so you can trace it later.',
    'iw-p': 'Which tool found these contacts, e.g. Clay or Databar.',
    'iw-cr': 'Optional. How many provider credits this list used. Recorded as actual spend.',
    'iw-co': 'Optional. What this list actually cost in dollars. It replaces the earlier estimate from "Approve enrichment spend".',
    'iw-pr': 'Which system these events came from. Event IDs are unique per system, so importing the same file twice doesn\'t double-count.',

    /* Outcomes, brief, learning, costs */
    'lo-c': 'The person this happened with.',
    'lo-t': 'What happened. Pick "Interested reply" for a positive human reply, "Meeting held" only once the meeting actually took place.',
    'lo-d': 'When it happened.',
    'lo-deal': 'For opportunities and closed deals: the HubSpot deal ID, so two contacts on the same deal count once.',
    'lo-amt': 'Deal value in dollars (opportunities and closed deals only).',
    'lo-n': 'Optional. The reply text or a note about the call.',
    'nt-h': 'The single thing to try next and what you expect, e.g. "Controllers reply more than CFOs to the same trigger." The brief is complete once a test has an owner.',
    'nt-o': 'Who is responsible for running the test.',
    'nt-d': 'When to look at the results.',
    'ob-t': 'A short statement of the pattern, e.g. "Migration timing is the main objection." Add every related observation under the same topic so they add up.',
    'ob-x': 'What the buyer said or did. Quote them where you can.',
    'ob-s': 'The call, email or document it came from. Without a source it won\'t count as evidence.',
    'ob-a': 'Optional. The company\'s domain, so you can see whether a pattern comes from many accounts or one loud one.',
    'ob-l': 'Optional. Where in the source, e.g. a timestamp like 12:41 or "paragraph 3".',
    'ob-c': 'Tick if this observation goes against the topic. Contradicting evidence is kept and shown to whoever approves a change.',
    'pp-f': 'Which part of the approved ICP to change.',
    'pp-r': 'Why you want the change. Required when the topic has fewer than 10 independent sources.',
    'co-k': 'What the money was spent on.',
    'co-e': 'Tick if this is an estimate rather than a billed amount. Estimates are shown separately from actual spend.'
  };

  var BY_TEXT = {
    'Connected channels': 'Which ways this client will reach prospects. Email is the pilot channel; LinkedIn comes after the email pilot.',
    'Do-not-contact list': 'People or companies to never contact. Opt-outs and hard bounces are added here automatically. The list is checked again right before every export.',
    'Suppress existing customers': 'On: companies marked as customers in your account import are never contacted.',
    'Suppress accounts with an active opportunity': 'On: companies with an open deal in the CRM are skipped, so outreach doesn\'t interrupt sales.',
    /* ICP criteria (row titles) */
    'Weights': 'How many points each kind of fit is worth. Points only count when the fit is verified. Make the four add up to 100 so a score reads like a percentage. Not sure? Use 40/25/20/15.',
    'Minimum score': 'The verified score a company needs to be "Eligible". With weights that add to 100, 70 means most of the fit must be confirmed before you spend money finding contacts there.',
    'Target industries': 'Industries the client sells to best, using the names your data provider uses (e.g. "Manufacturing", "Logistics"). Partial matches count: "Manufacturing" also matches "Electronics Manufacturing".',
    'Employee range': 'The best-fit company size by number of employees. Leave the maximum blank for no upper limit.',
    'Geography': 'Countries (or states) to include, e.g. "United States". A company outside them is excluded; one with no country on file goes to research.',
    'Trigger keywords': 'Words that suggest a company may be ready to buy now, matched against each account\'s recorded trigger. Examples: "hiring", "new CFO", "ERP migration", "opened a new plant".',
    'Recency': 'How old a trigger can be and still count. A job post from last month is useful; one from two years ago isn\'t. 60 to 90 days is typical.',
    'Industries': 'Industries to never target, whatever their score, e.g. "Government" or "Education".',
    'Keywords': 'Red-flag words. If one appears in a company\'s name, industry, notes or trigger, it is excluded. Examples: "bankruptcy", "acquired".',
    'Title keywords': 'Words that appear in this buyer\'s job title. A contact matches when every word of one entry is in their title, so "VP Finance" also matches "VP of Finance". Add several: CFO, Controller, Finance Director.',
    'Likely pain': 'What you believe frustrates this buyer. It\'s a guess, so emails never state it as fact; it shapes the discovery question instead.',
    'Discovery question': 'A question that asks about the pain without assuming it, inserted into emails as {{question}}. Example: "Is invoice volume growing faster than your AP team?"',
    'Approved message': 'One sentence on how the client helps this buyer. It is reused across campaigns, so get the sponsor\'s OK on the wording.',
    'Mandatory': 'On: a company must meet this to be eligible. If it\'s unknown, the company goes to research.',
    'Provider filter': 'On if your data provider (e.g. Databar) can filter on this. Off: it becomes a manual research step in the filter recipe.',
    'Approver': 'Who is approving. Their name is recorded with the decision.',
    /* Account drawer */
    'Company name': 'The company\'s name as it should appear in emails ({{company}}).',
    'Industry': 'The company\'s industry. Matched against the ICP\'s target and excluded industries.',
    'Employees': 'Number of employees. Used for the size fit.',
    'Country': 'Where the company is based. Used for the geography rule.',
    'Trigger': 'A recent event that suggests they may buy now, written so it reads after the company name: "I noticed Acme is hiring a Controller." Only counts with a date and a source link.',
    'Trigger date': 'When the trigger happened (e.g. the job posting date). Older than the ICP\'s recency limit scores zero.',
    'Trigger source URL': 'A link that proves the trigger, like the job posting or press release. Without it, the trigger is never stated as fact in emails.',
    'HubSpot company ID': 'The company\'s record ID in HubSpot, so meetings and deals match the right account. Find it in the HubSpot company URL.',
    'Research notes': 'What you checked and where, so the next person doesn\'t repeat the work.',
    'Existing customer': 'On: this company already buys from the client and won\'t be contacted (if customer suppression is on).',
    'Active opportunity in CRM': 'On: there\'s an open deal with this company, so it won\'t be contacted (if that suppression is on).',
    /* Import column mapping */
    'Website or domain': 'The company\'s website. This is how accounts are matched, so re-importing the same company updates it instead of duplicating it.',
    'Trigger or signal': 'A buying signal from your data source, e.g. "is hiring a Controller".',
    'Provider ID (e.g. Databar)': 'The company\'s ID in the tool it came from, kept so you can match back later.',
    'CRM status (customer / open deal)': 'A column saying whether the company is already a customer or has an open deal, e.g. HubSpot\'s lifecycle stage. Used for suppression.',
    'Email verification': 'The verification result from your provider, e.g. "valid", "catch-all" or "invalid". Only "valid" or "verified" emails can be sent to.',
    'Retrieved date': 'When the provider found this contact. Old data goes stale, so this is kept.',
    'Company domain': 'The domain of the company the contact works at. Used to attach the contact to the right account.',
    'Event type': 'What happened, e.g. delivered, reply, interested, meeting booked, opportunity. Common names from Smartlead and HubSpot are recognised.',
    'Event ID': 'The system\'s own ID for the event. It\'s how duplicates are spotted, so importing the same file twice counts once.',
    'Deal ID': 'The HubSpot deal ID, so contacts sharing a deal don\'t double-count pipeline.'
  };
  App.HELP_ID = BY_ID; App.HELP_TEXT = BY_TEXT;

  function labelText(el) {
    var n = el.firstChild, s = '';
    while (n && n.nodeType === 3) { s += n.textContent; n = n.nextSibling; }
    if (!s && el.firstChild && el.firstChild.nodeType === 1 && el.firstChild.tagName === 'INPUT') s = el.textContent;
    return s.replace(/\s*\*$/, '').replace(/\s*\((optional|required[^)]*)\)\s*$/i, '').trim();
  }
  function helpFor(el) {
    var id = el.getAttribute('for');
    if (id && BY_ID[id]) return BY_ID[id];
    var inner = el.querySelector && el.querySelector('input[id],select[id],textarea[id]');
    if (inner && BY_ID[inner.id]) return BY_ID[inner.id];
    return BY_TEXT[labelText(el)] || null;
  }
  function tipHTML(text) { return '<span class="tip" tabindex="0" role="button" aria-label="Help: ' + esc(text) + '" data-help="' + esc(text) + '">?</span>'; }

  // Add tips to anything labelled that has help and doesn't have a tip yet.
  var SEL = 'label:not([data-tipped]), .crit .ttl b:not([data-tipped]), .switch > span:last-child:not([data-tipped]), .label:not([data-tipped]), .mapgrid .from:not([data-tipped])';
  function decorate(root) {
    (root || document).querySelectorAll(SEL).forEach(function (el) {
      el.setAttribute('data-tipped', '');
      if (el.classList.contains('switch')) return;
      var target = el, h;
      if (el.matches('.switch > span')) h = BY_TEXT[el.textContent.trim()];
      else if (el.matches('.crit .ttl b, .mapgrid .from')) h = BY_TEXT[labelText(el)];
      else h = helpFor(el);
      if (!h) return;
      target.insertAdjacentHTML('beforeend', ' ' + tipHTML(h));
    });
  }
  App.decorateHelp = decorate;
  var pending = false;
  new MutationObserver(function () {
    if (pending) return; pending = true;
    requestAnimationFrame(function () { pending = false; decorate(document); });
  }).observe(document.documentElement, { childList: true, subtree: true });

  /* One floating bubble, positioned next to the "?" and kept on screen. */
  var box = document.createElement('div');
  box.className = 'tipbox'; box.setAttribute('role', 'tooltip'); box.hidden = true;
  document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(box); });
  if (document.body) document.body.appendChild(box);
  var current = null;
  var shownAt = 0;
  function show(t) {
    current = t; shownAt = Date.now();
    box.textContent = t.getAttribute('data-help');
    box.hidden = false;
    var r = t.getBoundingClientRect(), bw = Math.min(300, window.innerWidth - 24);
    box.style.width = bw + 'px';
    var left = Math.max(12, Math.min(window.innerWidth - bw - 12, r.left + r.width / 2 - bw / 2));
    var bh = box.offsetHeight, top = r.bottom + 8;
    if (top + bh > window.innerHeight - 8) top = Math.max(8, r.top - bh - 8);
    box.style.left = left + 'px'; box.style.top = top + 'px';
  }
  function hide() { box.hidden = true; current = null; }
  document.addEventListener('mouseover', function (e) { var t = e.target.closest && e.target.closest('.tip'); if (t) show(t); });
  document.addEventListener('mouseout', function (e) { var t = e.target.closest && e.target.closest('.tip'); if (t && t === current && document.activeElement !== t) hide(); });
  document.addEventListener('focusin', function (e) { var t = e.target.closest && e.target.closest('.tip'); if (t) show(t); else if (current) hide(); });
  document.addEventListener('focusout', function (e) { if (e.target === current) hide(); });
  // A click on the "?" must not also activate the label's input or checkbox.
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.tip');
    if (t) { e.preventDefault(); e.stopPropagation(); if (document.activeElement !== t) t.focus(); show(t); return; }
    if (current) hide();
  }, true);
  document.addEventListener('keydown', function (e) {
    var t = e.target.closest && e.target.closest('.tip');
    if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); if (box.hidden) show(t); else hide(); }
    if (e.key === 'Escape' && current) { hide(); e.stopPropagation(); }
  }, true);
  window.addEventListener('scroll', function () { if (current && Date.now() - shownAt > 300) hide(); }, true);
})();
