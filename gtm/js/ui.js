/* UI toolkit: storage, formatting, icons, modals, drawer, toasts, tag inputs and the CSV import wizard. */
(function () {
  'use strict';
  var G = window.GTM;
  var App = window.App = { S: { t: null, route: 'home', param: '', ui: {} }, views: {}, act: {}, refreshers: {} };

  /* ---------- storage: one key per client keeps tenants physically separate ---------- */
  var mem = {}, LS = null;
  try { localStorage.setItem('gtm:probe', '1'); localStorage.removeItem('gtm:probe'); LS = localStorage; } catch (e) { LS = null; }
  App.Store = {
    persistent: !!LS,
    get: function (k) { try { var v = LS ? LS.getItem('gtm:' + k) : mem[k]; return v == null ? null : JSON.parse(v); } catch (e) { return null; } },
    set: function (k, v) { var s = JSON.stringify(v); try { if (LS) LS.setItem('gtm:' + k, s); else mem[k] = s; return true; } catch (e) { mem[k] = s; return false; } },
    del: function (k) { try { if (LS) LS.removeItem('gtm:' + k); } catch (e) { } delete mem[k]; },
    index: function () { return this.get('index') || []; },
    load: function (id) { return this.get('tenant:' + id); },
    save: function (t) {
      var ok = this.set('tenant:' + t.id, t);
      var idx = this.index().filter(function (x) { return x.id !== t.id; });
      idx.push({ id: t.id, name: t.profile.name || 'Untitled client', sample: !!t.sample, createdAt: t.createdAt, updatedAt: G.now() });
      idx.sort(function (a, b) { return String(a.createdAt).localeCompare(String(b.createdAt)); });
      this.set('index', idx);
      return ok;
    },
    remove: function (id) {
      this.del('tenant:' + id);
      this.set('index', this.index().filter(function (x) { return x.id !== id; }));
    }
  };
  var saveWarned = false;
  App.save = function () {
    if (!App.S.t) return;
    if (!App.Store.save(App.S.t) && !saveWarned) { saveWarned = true; App.toast('Browser storage is full or blocked. Changes last only until you close this tab. Export your data from Settings.', 'bad'); }
    if (App.renderSide) App.renderSide();
  };

  /* ---------- formatting ---------- */
  var esc = App.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  App.attr = esc;
  App.fmtDate = function (iso) {
    if (!iso) return '—';
    var d = new Date(iso); if (isNaN(d)) return '—';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };
  App.fmtDT = function (iso) {
    if (!iso) return '—';
    var d = new Date(iso); if (isNaN(d)) return '—';
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };
  App.rel = function (iso) {
    if (!iso) return '—';
    var s = (Date.now() - new Date(iso).getTime()) / 1000, f = s < 0, a = Math.abs(s), v, u;
    if (a < 60) return f ? 'in a moment' : 'just now';
    if (a < 3600) { v = Math.round(a / 60); u = 'min'; }
    else if (a < 86400) { v = Math.round(a / 3600); u = 'h'; }
    else if (a < 86400 * 45) { v = Math.round(a / 86400); u = v === 1 ? 'day' : 'days'; }
    else return App.fmtDate(iso);
    return f ? 'in ' + v + ' ' + u : v + ' ' + u + ' ago';
  };
  App.money = function (n, opt) {
    if (n === null || n === undefined || !isFinite(n)) return '—';
    return Number(n).toLocaleString(undefined, { style: 'currency', currency: (opt && opt.cur) || 'USD', maximumFractionDigits: Math.abs(n) < 100 && n % 1 ? 2 : 0 });
  };
  App.num = function (n) { return n === null || n === undefined ? '—' : Number(n).toLocaleString(); };
  App.pct = function (r) {
    var v = G.rate(r);
    return v === null ? null : (v * 100 >= 10 || v === 0 ? Math.round(v * 100) : (v * 100).toFixed(1)) + '%';
  };
  App.rateHTML = function (r, opts) {
    opts = opts || {};
    var p = opts.money ? (r.d ? App.money(r.n / r.d) : null) : App.pct(r);
    if (p === null) return '<span class="na" title="Denominator is zero">Not computable</span>';
    return esc(p) + ' <small class="muted">' + (opts.money ? App.money(r.n) : App.num(r.n)) + ' / ' + App.num(r.d) + '</small>';
  };
  App.badge = function (tone, label, plain) { return '<span class="badge ' + (tone || '') + (plain ? ' plain' : '') + '">' + esc(label) + '</span>'; };
  App.stateBadge = function (map, key) { var s = map[key] || { label: key, tone: 'muted' }; return App.badge(s.tone, s.label); };
  App.initials = function (name) {
    return String(name || '?').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase() || '?';
  };
  App.avatar = function (name, hue) {
    var h = hue != null ? hue : parseInt(G.hash(name || ''), 16) % 360;
    return '<span class="avatar" style="background:hsl(' + h + ' 45% 38%)">' + esc(App.initials(name)) + '</span>';
  };
  App.plural = function (n, one, many) { return App.num(n) + ' ' + (n === 1 ? one : (many || one + 's')); };

  /* ---------- icons ---------- */
  var P = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    setup: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    evidence: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/><path d="M9 8h7M9 12h5"/>',
    icp: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    accounts: '<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4"/>',
    contacts: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M17 3.5a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
    campaign: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    outcomes: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z"/>',
    brief: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    learning: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
    activity: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h0"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    play: '<path d="m6 4 14 8-14 8z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    chev: '<path d="m6 9 6 6 6-6"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>',
    print: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    swap: '<path d="M7 16V4M3 8l4-4 4 4M17 8v12M21 16l-4 4-4-4"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>'
  };
  App.icon = function (n, cls) {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : '') + '>' + (P[n] || P.info) + '</svg>';
  };

  /* ---------- files ---------- */
  // Inside a claude.ai artifact, plain download links are blocked; the platform's "downloads" capability saves files instead.
  App.hosted = !!(window.claude && window.claude.use);
  var dlCap = null;
  if (App.hosted) { try { window.claude.use('downloads').then(function (d) { dlCap = d; }, function () { }); } catch (e) { } }
  function showText(name, text) {
    App.modal({ title: name, sub: 'Saving files is not available here. Copy the contents instead.', wide: true, body: '<textarea readonly rows="14" style="font:12px/1.5 var(--mono)">' + esc(text) + '</textarea>', actions: [{ label: 'Close', cls: 'ghost' }, { label: 'Copy', cls: 'primary', icon: 'copy', onClick: function () { App.copy(text, 'Copied'); } }] });
  }
  App.download = function (name, text, mime) {
    if (App.hosted) {
      if (!dlCap) { showText(name, text); return; }
      dlCap.save({ filename: name, data: text }).then(function () { App.toast('Saved ' + name); }, function (err) {
        var c = err && err.code;
        if (c === 'declined') return;
        if (c === 'rate_limited') { App.toast('Another save is still open. Try again in a moment.', 'bad'); return; }
        showText(name, text);
      });
      return;
    }
    var blob = new Blob([text], { type: mime || 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  App.copy = function (text, msg) {
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); App.toast(msg || 'Copied'); } catch (e) { App.toast('Copy failed. Select the text and copy it manually.', 'bad'); }
      ta.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { App.toast(msg || 'Copied'); }, fallback);
    else fallback();
  };
  App.readFile = function (file) {
    return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsText(file); });
  };
  App.slug = function (s) { return String(s || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'client'; };

  /* ---------- toasts ---------- */
  App.toast = function (msg, tone) {
    var box = document.getElementById('toasts');
    var el = document.createElement('div');
    el.className = 'toast ' + (tone || 'ok');
    el.innerHTML = (tone === 'bad' ? App.icon('alert') : App.icon('check')) + '<span>' + esc(msg) + '</span>';
    box.appendChild(el);
    setTimeout(function () { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(function () { el.remove(); }, 300); }, tone === 'bad' ? 6000 : 3200);
  };

  /* ---------- modal ---------- */
  var modalStack = [];
  App.modal = function (o) {
    var wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = '<div class="scrim" data-close></div><div class="modal' + (o.wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-labelledby="mt' + modalStack.length + '">' +
      '<div class="modal-h"><div class="grow"><h2 id="mt' + modalStack.length + '">' + esc(o.title) + '</h2>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div>' +
      '<button class="btn ghost sm icon" data-close aria-label="Close">' + App.icon('x') + '</button></div>' +
      '<div class="modal-b"></div><div class="modal-f"></div></div>';
    document.body.appendChild(wrap);
    var prevFocus = document.activeElement;
    var m = { root: wrap, body: wrap.querySelector('.modal-b'), foot: wrap.querySelector('.modal-f') };
    m.close = function () {
      wrap.remove(); modalStack.splice(modalStack.indexOf(m), 1);
      if (o.onClose) o.onClose();
      if (prevFocus && prevFocus.focus && document.body.contains(prevFocus)) prevFocus.focus();
    };
    m.setBody = function (html) { m.body.innerHTML = html; };
    m.setActions = function (actions) {
      m.foot.innerHTML = '';
      m.foot.classList.toggle('hidden', !actions || !actions.length);
      (actions || []).forEach(function (a) {
        var b = document.createElement('button');
        b.className = 'btn ' + (a.cls || ''); b.type = 'button'; b.innerHTML = (a.icon ? App.icon(a.icon) : '') + esc(a.label);
        if (a.disabled) b.disabled = true;
        b.addEventListener('click', function () {
          if (!a.onClick) return m.close();
          var r = a.onClick(m);
          if (r !== false) m.close();
        });
        m.foot.appendChild(b);
      });
    };
    m.body.innerHTML = o.body || '';
    m.setActions(o.actions || [{ label: 'Close' }]);
    wrap.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) m.close(); });
    modalStack.push(m);
    if (o.onOpen) o.onOpen(m);
    setTimeout(function () {
      var f = wrap.querySelector('[autofocus]') || wrap.querySelector('.modal-b input:not([type=checkbox]):not([type=file]), .modal-b textarea, .modal-b select') || wrap.querySelector('.modal-f .btn:last-child');
      if (f) f.focus();
    }, 20);
    return m;
  };
  App.topModal = function () { return modalStack[modalStack.length - 1]; };
  App.confirm = function (o) {
    return new Promise(function (res) {
      var done = false;
      App.modal({
        title: o.title, body: '<div>' + (o.body || '') + '</div>',
        onClose: function () { if (!done) res(false); },
        actions: [{ label: o.cancel || 'Cancel', cls: 'ghost' }, { label: o.ok || 'Confirm', cls: o.danger ? 'danger solid' : 'primary', onClick: function () { done = true; res(true); } }]
      });
    });
  };
  App.prompt = function (o) {
    return new Promise(function (res) {
      var done = false;
      App.modal({
        title: o.title, sub: o.sub,
        body: '<div class="field"><label for="pr-in">' + esc(o.label || '') + '</label>' + (o.textarea ? '<textarea id="pr-in" autofocus>' + esc(o.value || '') + '</textarea>' : '<input id="pr-in" autofocus value="' + esc(o.value || '') + '" placeholder="' + esc(o.placeholder || '') + '">') + (o.hint ? '<div class="hint">' + o.hint + '</div>' : '') + '</div>',
        onClose: function () { if (!done) res(null); },
        onOpen: function (m) {
          var inp = m.body.querySelector('#pr-in');
          if (!o.textarea) inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); m.foot.querySelector('.btn.primary').click(); } });
        },
        actions: [{ label: 'Cancel', cls: 'ghost' }, {
          label: o.ok || 'Save', cls: 'primary', onClick: function (m) {
            var v = m.body.querySelector('#pr-in').value.trim();
            if (o.required && !v) { m.body.querySelector('#pr-in').focus(); return false; }
            done = true; res(v);
          }
        }]
      });
    });
  };
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (modalStack.length) { modalStack[modalStack.length - 1].close(); e.preventDefault(); return; }
    if (App.closeDrawer && document.querySelector('.drawer')) { App.closeDrawer(); e.preventDefault(); }
  });

  /* ---------- drawer ---------- */
  var drawerState = null;
  App.drawer = function (o) {
    App.closeDrawer(true);
    var scrim = document.createElement('div'); scrim.className = 'scrim'; scrim.addEventListener('click', function () { App.closeDrawer(); });
    var d = document.createElement('aside'); d.className = 'drawer'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
    document.body.appendChild(scrim); document.body.appendChild(d);
    drawerState = { o: o, el: d, scrim: scrim, prev: document.activeElement };
    App.refreshDrawer();
    setTimeout(function () { var b = d.querySelector('.drawer-h button'); if (b) b.focus(); }, 30);
  };
  App.refreshDrawer = function () {
    if (!drawerState) return;
    var o = drawerState.o, d = drawerState.el;
    var r = o.render();
    if (!r) { App.closeDrawer(); return; }
    var scroll = d.querySelector('.drawer-b') ? d.querySelector('.drawer-b').scrollTop : 0;
    d.innerHTML = '<div class="drawer-h"><div class="grow">' + r.head + '</div><button class="btn ghost sm icon" data-act="close-drawer" aria-label="Close">' + App.icon('x') + '</button></div><div class="drawer-b">' + r.body + '</div>';
    d.querySelector('.drawer-b').scrollTop = scroll;
  };
  App.closeDrawer = function (silent) {
    if (!drawerState) return;
    drawerState.el.remove(); drawerState.scrim.remove();
    var prev = drawerState.prev; drawerState = null;
    if (!silent && prev && prev.focus && document.body.contains(prev)) prev.focus();
  };
  App.act['close-drawer'] = function () { App.closeDrawer(); };

  /* ---------- tag inputs (bound to a path on the tenant) ---------- */
  App.tagInput = function (path, values, o) {
    o = o || {};
    values = values || [];
    return '<div class="tags' + (o.disabled ? ' disabled' : '') + '" data-tags="' + esc(path) + '"' + (o.refresh ? ' data-refresh="' + esc(o.refresh) + '"' : '') + '>' +
      values.map(function (v, i) {
        return '<span class="tag">' + esc(v) + (o.disabled ? '' : '<button type="button" data-act="tag-rm" data-i="' + i + '" aria-label="Remove ' + esc(v) + '">×</button>') + '</span>';
      }).join('') +
      (o.disabled ? (values.length ? '' : '<span class="faint small">None</span>') : '<input class="tag-in" aria-label="' + esc(o.label || 'Add value') + '" placeholder="' + esc(values.length ? '' : (o.placeholder || 'Type and press Enter')) + '">') + '</div>';
  };
  function rerenderTags(box, focus) {
    if (!box.isConnected) return;
    var path = box.getAttribute('data-tags');
    var vals = G.get(App.S.t, path) || [];
    var tmp = document.createElement('div');
    tmp.innerHTML = App.tagInput(path, vals, { refresh: box.getAttribute('data-refresh'), placeholder: 'Type and press Enter' });
    var nb = tmp.firstChild; box.replaceWith(nb);
    if (focus) nb.querySelector('.tag-in').focus();
    var r = nb.getAttribute('data-refresh'); if (r) App.refresh(r);
  }
  function addTag(input) {
    var box = input.closest('.tags'), path = box.getAttribute('data-tags');
    var raw = input.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    input.value = '';
    if (!raw.length || !box.isConnected) return;
    var arr = G.get(App.S.t, path); if (!Array.isArray(arr)) { arr = []; G.set(App.S.t, path, arr); }
    raw.forEach(function (v) { if (!arr.some(function (x) { return x.toLowerCase() === v.toLowerCase(); })) arr.push(v); });
    App.save(); rerenderTags(box, true);
  }
  document.addEventListener('keydown', function (e) {
    var inp = e.target.closest && e.target.closest('.tag-in');
    if (!inp) return;
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(inp); }
    else if (e.key === 'Backspace' && !inp.value) {
      var box = inp.closest('.tags'), arr = G.get(App.S.t, box.getAttribute('data-tags'));
      if (arr && arr.length) { arr.pop(); App.save(); rerenderTags(box, true); }
    }
  });
  document.addEventListener('focusout', function (e) { var inp = e.target.closest && e.target.closest('.tag-in'); if (inp && inp.value.trim()) addTag(inp); });
  document.addEventListener('click', function (e) {
    var box = e.target.closest && e.target.closest('.tags:not(.disabled)');
    if (box && !e.target.closest('button')) { var i = box.querySelector('.tag-in'); if (i) i.focus(); }
  });
  App.act['tag-rm'] = function (el) {
    var box = el.closest('.tags'), arr = G.get(App.S.t, box.getAttribute('data-tags'));
    arr.splice(+el.getAttribute('data-i'), 1); App.save(); rerenderTags(box, true);
  };

  /* ---------- evidence basis picker: sourced, or labeled as an assumption ---------- */
  App.basisPicker = function (path, crit, disabled) {
    var t = App.S.t, b = G.criterionBasis(t, crit);
    var label = b.assumption ? App.badge('warn', 'Assumption') : App.badge('ok', b.label);
    if (disabled) return '<span title="' + esc(b.ids.map(function (id) { return (G.sourceById(t, id) || {}).title; }).join(', ')) + '">' + label + '</span>';
    var srcs = t.sources;
    return '<details class="basis"><summary title="Evidence for this criterion">' + label + '</summary><div class="basis-pop">' +
      '<div class="small muted">Which sources support this? With none, it is shown as an assumption.</div>' +
      (srcs.length ? srcs.map(function (s) {
        var on = (crit.basis || []).indexOf(s.id) > -1;
        return '<label class="check"><input type="checkbox" data-basis="' + esc(path) + '" value="' + esc(s.id) + '"' + (on ? ' checked' : '') + (s.withdrawn ? ' disabled' : '') + '><span>' + esc(s.title) + '<br><small class="muted">' + esc(s.type) + ' · ' + App.fmtDate(s.date) + (s.withdrawn ? ' · withdrawn' : '') + '</small></span></label>';
      }).join('') : '<div class="small">No sources yet. <a href="#/evidence">Add one</a>.</div>') + '</div></details>';
  };
  document.addEventListener('change', function (e) {
    var cb = e.target.closest && e.target.closest('[data-basis]');
    if (!cb) return;
    var path = cb.getAttribute('data-basis'), arr = G.get(App.S.t, path);
    if (!Array.isArray(arr)) { arr = []; G.set(App.S.t, path, arr); }
    var i = arr.indexOf(cb.value);
    if (cb.checked && i < 0) arr.push(cb.value);
    if (!cb.checked && i > -1) arr.splice(i, 1);
    App.save();
    var det = cb.closest('details'), sum = det.querySelector('summary');
    var crit = G.get(App.S.t, path.replace(/\.basis$/, ''));
    var b = G.criterionBasis(App.S.t, crit);
    sum.innerHTML = b.assumption ? App.badge('warn', 'Assumption') : App.badge('ok', b.label);
  });
  document.addEventListener('click', function (e) {
    document.querySelectorAll('details.basis[open]').forEach(function (d) { if (!d.contains(e.target)) d.removeAttribute('open'); });
  });

  /* ---------- bound fields ---------- */
  // <input data-bind="profile.name" data-type="num|bool|int"> writes straight to the tenant on change.
  App.refresh = function (name) { var f = App.refreshers[name]; if (f) f(); };
  document.addEventListener('change', function (e) {
    var el = e.target.closest && e.target.closest('[data-bind]');
    if (!el || !App.S.t) return;
    var path = el.getAttribute('data-bind'), type = el.getAttribute('data-type'), v;
    if (el.type === 'checkbox') v = el.checked;
    else if (type === 'num') v = el.value === '' ? null : G.toNum(el.value);
    else if (type === 'int') v = el.value === '' ? null : G.toInt(el.value);
    else if (type === 'date') v = el.value ? new Date(el.value + 'T12:00:00Z').toISOString() : '';
    else v = el.value;
    G.set(App.S.t, path, v);
    App.save();
    var r = el.getAttribute('data-refresh');
    if (r) r.split(' ').forEach(App.refresh);
    if (el.hasAttribute('data-rerender')) App.rerender();
  });
  App.bindInput = function (path, o) {
    o = o || {};
    var v = G.get(App.S.t, path);
    if (o.type === 'date') v = v ? String(v).slice(0, 10) : '';
    return '<input' + (o.id ? ' id="' + o.id + '"' : '') + ' type="' + (o.inputType || (o.type === 'num' || o.type === 'int' ? 'number' : o.type === 'date' ? 'date' : 'text')) + '" data-bind="' + esc(path) + '"' +
      (o.type ? ' data-type="' + o.type + '"' : '') + (o.refresh ? ' data-refresh="' + o.refresh + '"' : '') + (o.rerender ? ' data-rerender' : '') +
      ' value="' + esc(v == null ? '' : v) + '"' + (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') + (o.disabled ? ' disabled' : '') +
      (o.min != null ? ' min="' + o.min + '"' : '') + (o.cls ? ' class="' + o.cls + '"' : '') + (o.label ? ' aria-label="' + esc(o.label) + '"' : '') + '>';
  };
  App.bindText = function (path, o) {
    o = o || {};
    return '<textarea' + (o.id ? ' id="' + o.id + '"' : '') + ' data-bind="' + esc(path) + '"' + (o.refresh ? ' data-refresh="' + o.refresh + '"' : '') + (o.rows ? ' rows="' + o.rows + '"' : '') + (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') + (o.disabled ? ' disabled' : '') + (o.label ? ' aria-label="' + esc(o.label) + '"' : '') + '>' + esc(G.get(App.S.t, path) || '') + '</textarea>';
  };
  App.bindSelect = function (path, opts, o) {
    o = o || {};
    var v = G.get(App.S.t, path);
    return '<select' + (o.id ? ' id="' + o.id + '"' : '') + ' data-bind="' + esc(path) + '"' + (o.refresh ? ' data-refresh="' + o.refresh + '"' : '') + (o.rerender ? ' data-rerender' : '') + (o.disabled ? ' disabled' : '') + (o.cls ? ' class="' + o.cls + '"' : '') + (o.label ? ' aria-label="' + esc(o.label) + '"' : '') + '>' +
      opts.map(function (x) { var val = typeof x === 'string' ? x : x.value, lab = typeof x === 'string' ? x : x.label; return '<option value="' + esc(val) + '"' + (String(val) === String(v == null ? '' : v) ? ' selected' : '') + '>' + esc(lab) + '</option>'; }).join('') + '</select>';
  };
  App.bindSwitch = function (path, label, o) {
    o = o || {};
    return '<label class="switch"><input type="checkbox" data-bind="' + esc(path) + '"' + (G.get(App.S.t, path) ? ' checked' : '') + (o.refresh ? ' data-refresh="' + o.refresh + '"' : '') + (o.rerender ? ' data-rerender' : '') + (o.disabled ? ' disabled' : '') + '><span class="track"></span><span>' + esc(label) + '</span></label>';
  };

  /* ---------- CSV import wizard ---------- */
  // Step 1: drop a file or paste. Step 2: confirm the auto-mapped columns with a live preview. Step 3: what happened.
  App.importWizard = function (o) {
    var fields = G.FIELDS[o.kind], parsed = null, mapping = {};
    var m = App.modal({ title: o.title, sub: o.sub, wide: true, body: '', actions: [] });
    function step1() {
      m.setBody(
        '<label class="drop" tabindex="0" id="iw-drop">' + App.icon('upload') + '<b>Drop a CSV here, or click to choose</b><span class="small muted">Exports from Databar, Clay, HubSpot, Smartlead and spreadsheets work. Columns are matched for you.</span><input type="file" accept=".csv,text/csv,.txt" class="sr" id="iw-file"></label>' +
        '<details><summary class="small muted" style="cursor:pointer">Or paste CSV text</summary><textarea id="iw-paste" rows="6" placeholder="name,domain,industry&#10;Acme,acme.com,Manufacturing" style="margin-top:8px"></textarea></details>' +
        (o.template ? '<div class="row small"><span class="muted">Need the format?</span><button class="btn sm ghost" type="button" id="iw-tpl">' + App.icon('download') + 'Download a template</button></div>' : '') +
        (o.extra ? '<div id="iw-extra">' + o.extra + '</div>' : '')
      );
      m.setActions([{ label: 'Cancel', cls: 'ghost' }, { label: 'Continue', cls: 'primary', onClick: function () { var p = m.body.querySelector('#iw-paste').value; if (p.trim()) { load(p); } else App.toast('Choose a file or paste CSV text first', 'bad'); return false; } }]);
      var drop = m.body.querySelector('#iw-drop'), file = m.body.querySelector('#iw-file');
      file.addEventListener('change', function () { if (file.files[0]) App.readFile(file.files[0]).then(load); });
      ['dragover', 'dragenter'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
      ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.remove('over'); }); });
      drop.addEventListener('drop', function (e) { e.preventDefault(); var f = e.dataTransfer.files[0]; if (f) App.readFile(f).then(load); });
      drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } });
      var tb = m.body.querySelector('#iw-tpl'); if (tb) tb.addEventListener('click', function () { App.download(o.kind + '-template.csv', o.template); });
    }
    var extraVals = {};
    function grabExtra() {
      var ex = m.body.querySelector('#iw-extra');
      if (ex) ex.querySelectorAll('[name]').forEach(function (el) { extraVals[el.name] = el.type === 'checkbox' ? el.checked : el.value; });
    }
    function load(text) {
      grabExtra();
      parsed = G.parseCSV(text);
      if (!parsed.headers.length || !parsed.rows.length) { App.toast('That file has no rows to import', 'bad'); return; }
      mapping = G.autoMap(parsed.headers, o.kind);
      step2();
    }
    function step2() {
      var opts = '<option value="">— Skip —</option>' + parsed.headers.map(function (h) { return '<option>' + esc(h) + '</option>'; }).join('');
      var matched = fields.filter(function (f) { return mapping[f.key]; }).length;
      m.setBody(
        '<div class="note info">' + App.icon('sparkle') + '<div class="grow"><b>' + App.plural(parsed.rows.length, 'row') + ' found.</b> We matched ' + matched + ' of ' + fields.length + ' fields from your column names. Check them, then import.</div></div>' +
        '<div class="mapgrid">' + fields.map(function (f) {
          return '<div class="from">' + esc(f.label) + (f.required ? ' <span class="req" title="Required">*</span>' : '') + '</div>' +
            '<select data-map="' + f.key + '" aria-label="Column for ' + esc(f.label) + '">' + opts.replace('<option>' + esc(mapping[f.key] || '\u0000') + '</option>', '<option selected>' + esc(mapping[f.key] || '') + '</option>') + '</select>';
        }).join('') + '</div>' +
        '<div><div class="label" style="margin-bottom:6px">Preview (first 5 rows, as they will be read)</div><div class="preview-table" id="iw-prev"></div></div>'
      );
      function prev() {
        var cols = fields.filter(function (f) { return mapping[f.key]; });
        m.body.querySelector('#iw-prev').innerHTML = '<table class="t"><thead><tr>' + cols.map(function (f) { return '<th>' + esc(f.label) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          parsed.rows.slice(0, 5).map(function (r) { return '<tr>' + cols.map(function (f) { return '<td>' + esc(r[mapping[f.key]]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
      }
      prev();
      m.body.querySelectorAll('[data-map]').forEach(function (s) { s.addEventListener('change', function () { mapping[s.getAttribute('data-map')] = s.value; prev(); }); });
      m.setActions([{ label: 'Back', cls: 'ghost', onClick: function () { step1(); return false; } }, {
        label: 'Import ' + App.plural(parsed.rows.length, 'row'), cls: 'primary', onClick: function () {
          var miss = fields.filter(function (f) { return f.required && !mapping[f.key]; });
          if (miss.length) { App.toast('Choose a column for ' + miss.map(function (f) { return f.label; }).join(', '), 'bad'); return false; }
          var res = o.onImport(parsed.rows, mapping, extraVals);
          App.save();
          step3(res);
          if (o.after) o.after(res);
          return false;
        }
      }]);
    }
    function step3(res) {
      m.setBody(o.result(res));
      m.setActions([{ label: 'Import another file', cls: 'ghost', onClick: function () { step1(); return false; } }, { label: 'Done', cls: 'primary' }]);
    }
    step1();
    return m;
  };
  App.resultTiles = function (items) {
    return '<div class="result-grid">' + items.map(function (x) { return '<div class="kpi"><span class="k">' + esc(x[0]) + '</span><span class="v">' + App.num(x[1]) + '</span>' + (x[2] ? '<span class="s">' + esc(x[2]) + '</span>' : '') + '</div>'; }).join('') + '</div>';
  };
})();
