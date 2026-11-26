/*
 * KRV & Co. capital.krv.co: reading and sharing (MCR, 27/11/2026).
 * Events go to KRAiON Terminal by sendBeacon. The reader is named only by what Terminal verifies (the deck link or the reader
 * pass); otherwise only this browser's random visitor id is sent. Covered by the PDPA consent given at the deck gate.
 */
(function () {
  var EV = 'https://kraion-terminal.vercel.app/api/intake/event';
  var BASE = 'https://capital.krv.co/2027/';
  var q = [];
  function vid() {
    try {
      var v = localStorage.getItem('krvVisitor');
      if (!v) { v = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now(); localStorage.setItem('krvVisitor', v); }
      return v;
    } catch (e) { return ''; }
  }
  function pass() { try { return localStorage.getItem('krvReaderPass') || ''; } catch (e) { return ''; } }
  var inRef = (new URLSearchParams(location.search)).get('ref') || '';
  function flush() {
    if (!q.length) return;
    var b = { visitor: vid(), rp: pass(), t: window.krvDeckToken || '', ref: inRef, events: q.splice(0, 25) };
    try { navigator.sendBeacon(EV, new Blob([JSON.stringify(b)], { type: 'text/plain' })); } catch (e) {}
    if (q.length) flush();
  }
  function track(kind, o) {
    var e = { kind: kind }; if (o) for (var k in o) e[k] = o[k];
    q.push(e); if (q.length >= 20) flush();
  }
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });

  /* Visible time: counted only while the tab is in front. */
  var shown = 0, since = document.visibilityState === 'visible' ? Date.now() : 0;
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && since) { shown += Date.now() - since; since = 0; if (window.krvOnHide) window.krvOnHide(); }
    else if (document.visibilityState === 'visible') since = Date.now();
  }, true);
  function visibleSeconds() { var s = shown + (since ? Date.now() - since : 0); shown = 0; since = document.visibilityState === 'visible' ? Date.now() : 0; return Math.round(s / 1000); }

  /* Share: the link carries this browser's reference, so whoever opens the deck through it is credited to the sharer. */
  function shareUrl() { var v = vid(); return BASE + (v ? '?ref=v.' + encodeURIComponent(v) : ''); }
  var TITLE = 'KRV & Co. · 2027 Capital Programme', TEXT = 'Want to profit from distress, or get paid to prevent it?';
  function toast(t) {
    var e = document.getElementById('ktoast');
    if (!e) { e = document.createElement('div'); e.id = 'ktoast'; e.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#D4A853;color:#0d1f17;font:600 11px/1 Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;padding:11px 16px;z-index:9999;transition:opacity .3s'; document.body.appendChild(e); }
    e.textContent = t; e.style.opacity = '1'; clearTimeout(e._t); e._t = setTimeout(function () { e.style.opacity = '0'; }, 1800);
  }
  var menu = null;
  function closeMenu() { if (menu) { menu.remove(); menu = null; } }
  function openShare(btn) {
    if (menu) { closeMenu(); return; }
    var url = shareUrl(), enc = encodeURIComponent(url), msg = encodeURIComponent(TEXT + ' ' + url);
    var items = [
      ['link', 'Copy Link', null],
      ['email', 'Email', 'mailto:?subject=' + encodeURIComponent(TITLE) + '&body=' + msg],
      ['line', 'LINE', 'https://social-plugins.line.me/lineit/share?url=' + enc],
      ['whatsapp', 'WhatsApp', 'https://wa.me/?text=' + msg],
      ['linkedin', 'LinkedIn', 'https://www.linkedin.com/sharing/share-offsite/?url=' + enc]
    ];
    if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) items.push(['native', 'More…', null]);
    menu = document.createElement('div');
    menu.setAttribute('role', 'menu');
    menu.style.cssText = 'position:fixed;z-index:9998;background:#0d1f17;border:1px solid rgba(212,168,83,.55);min-width:170px;box-shadow:0 8px 24px rgba(0,0,0,.35);font:500 12px/1 Arial,sans-serif;letter-spacing:.06em';
    items.forEach(function (it) {
      var a = document.createElement(it[2] ? 'a' : 'button');
      a.textContent = it[1]; a.setAttribute('role', 'menuitem');
      a.style.cssText = 'display:block;width:100%;text-align:left;padding:11px 14px;color:#f3ecdc;background:none;border:0;border-bottom:1px solid rgba(255,255,255,.08);cursor:pointer;text-decoration:none;font:inherit';
      if (it[2]) { a.href = it[2]; a.target = '_blank'; a.rel = 'noopener'; }
      a.addEventListener('click', function (e) {
        track('share', { channel: it[0] }); flush();
        if (it[0] === 'link') {
          e.preventDefault();
          (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { toast('Link Copied'); }, function () { prompt('Copy this link', url); });
        } else if (it[0] === 'native') {
          e.preventDefault(); navigator.share({ title: TITLE, text: TEXT, url: url }).catch(function () {});
        }
        closeMenu();
      });
      menu.appendChild(a);
    });
    document.body.appendChild(menu);
    var r = btn.getBoundingClientRect(), w = menu.offsetWidth, h = menu.offsetHeight;
    var left = Math.min(Math.max(8, r.right - w), innerWidth - w - 8), top = r.bottom + 6;
    if (top + h > innerHeight - 8) top = Math.max(8, r.top - h - 6);
    menu.style.left = left + 'px'; menu.style.top = top + 'px';
    setTimeout(function () { document.addEventListener('click', function off(ev) { if (menu && !menu.contains(ev.target) && ev.target !== btn) { closeMenu(); } document.removeEventListener('click', off); }); }, 0);
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  window.krv = { track: track, flush: flush, visibleSeconds: visibleSeconds, openShare: openShare, visitor: vid };
})();
