/* ReBoot – képnézet: nagyítás, húzás, lapozás a lista elemei között.
   Fotók: assets/img/<azonosító>.jpg (+ -2.jpg, -3.jpg), vagy az elem "images" tömbje. Ha nincs fotó, a rajzolt ikon látszik nagyban. */
(function () {
  'use strict';
  var ALL;
  try { ALL = PRODUCTS.concat(PARTS); } catch (e) { return; }
  var byId = {}; ALL.forEach(function (p) { byId[p.id] = p; });
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var cache = {}, ids = [], idx = 0, ph = 0, st = { s: 1, x: 0, y: 0 }, last = null, pts = {}, d0 = 0, drag = null;

  var lb = document.createElement('div');
  lb.className = 'lb'; lb.hidden = true;
  lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Képnézet');
  lb.innerHTML = '<div class="lb-bg" data-close></div><div class="lb-main"><div class="lb-stage"><div class="lb-pan"></div></div>' +
    '<button class="lb-x" type="button" data-close aria-label="Bezárás">&times;</button>' +
    '<button class="lb-nav lb-prev" type="button" data-nav="-1" aria-label="Előző">&lsaquo;</button>' +
    '<button class="lb-nav lb-next" type="button" data-nav="1" aria-label="Következő">&rsaquo;</button>' +
    '<div class="lb-dots"></div>' +
    '<div class="lb-tools"><button type="button" data-z="-1" aria-label="Kicsinyítés">&minus;</button><output>100%</output><button type="button" data-z="1" aria-label="Nagyítás">+</button><button type="button" data-z="0" aria-label="Eredeti méret">&#8634;</button></div></div>' +
    '<div class="lb-cap"></div>';
  document.body.appendChild(lb);
  var pan = lb.querySelector('.lb-pan'), stage = lb.querySelector('.lb-stage'), cap = lb.querySelector('.lb-cap'),
      dots = lb.querySelector('.lb-dots'), out = lb.querySelector('output');

  function probe(p) {
    if (cache[p.id]) return cache[p.id];
    if (p.images && p.images.length) return (cache[p.id] = Promise.resolve(p.images));
    var found = [];
    var try1 = function (n) {
      return new Promise(function (ok) {
        if (n > 3) return ok();
        var src = 'assets/img/' + p.id + (n > 1 ? '-' + n : '') + '.jpg', im = new Image();
        im.onload = function () { found.push(src); try1(n + 1).then(ok); };
        im.onerror = function () { ok(); };
        im.src = src;
      });
    };
    return (cache[p.id] = try1(1).then(function () { return found; }));
  }
  function apply() {
    pan.style.transform = 'translate(' + st.x + 'px,' + st.y + 'px) scale(' + st.s + ')';
    out.textContent = Math.round(st.s * 100) + '%';
    stage.style.cursor = st.s > 1 ? 'grab' : 'zoom-in';
  }
  function zoom(f) {
    st.s = f === 0 ? 1 : Math.min(5, Math.max(1, st.s * f));
    if (st.s === 1) { st.x = 0; st.y = 0; }
    apply();
  }
  function realBtn(p) { return document.querySelector('[data-add="' + p.id + '"]'); }
  function paintCap(p) {
    var b = realBtn(p), n = p.stock;
    cap.innerHTML = '<div><p>' + esc(p.year ? p.year + ' · ' + p.grade + ' fokozat' : p.grade + ' fokozat') + '</p><h3>' + esc(p.name) + '</h3><p>' + esc(p.spec || p.compat || '') + '</p></div>' +
      '<div class="lb-buy"><div><div class="lb-price">' + fmtFt(p.price) + '</div><div class="lb-stock">' + (n === 1 ? 'Utolsó darab' : n + ' db raktáron') + '</div></div>' +
      '<button class="btn small" type="button" data-buy' + (!b || b.disabled ? ' disabled' : '') + '>' + esc(b ? b.textContent : 'Kosárba') + '</button></div>';
  }
  function show() {
    var p = byId[ids[idx]]; if (!p) return;
    st = { s: 1, x: 0, y: 0 }; ph = 0; apply(); paintCap(p);
    pan.innerHTML = '<div class="lb-art">' + iconSVG(p.icon, 'pic') + '</div><p class="lb-note">Fotó hamarosan</p>'; dots.innerHTML = '';
    var mine = p.id;
    probe(p).then(function (list) {
      if (!list || !list.length || ids[idx] !== mine) return;
      var paint = function () {
        pan.innerHTML = '<img src="' + esc(list[ph]) + '" alt="' + esc(p.name) + ' – ' + (ph + 1) + '. kép" draggable="false">';
        dots.innerHTML = list.length > 1 ? list.map(function (_, i) { return '<i' + (i === ph ? ' class="on"' : '') + '></i>'; }).join('') : '';
      };
      paint(); lb._photo = function (dir) { ph = (ph + dir + list.length) % list.length; st = { s: 1, x: 0, y: 0 }; apply(); paint(); };
    });
    lb.querySelector('.lb-prev').hidden = lb.querySelector('.lb-next').hidden = ids.length < 2;
  }
  function nav(dir) { idx = (idx + dir + ids.length) % ids.length; lb._photo = null; show(); }
  function open(id, list, from) {
    ids = list; idx = Math.max(0, list.indexOf(id)); last = from; lb._photo = null;
    lb.hidden = false; show();
    requestAnimationFrame(function () { lb.classList.add('open'); });
    document.querySelector('.page').inert = true; document.body.style.overflow = 'hidden';
    lb.querySelector('.lb-x').focus();
  }
  function close() {
    lb.classList.remove('open');
    setTimeout(function () { lb.hidden = true; }, 260);
    var dr = document.getElementById('drawer');
    if (!dr || !dr.classList.contains('open')) { document.querySelector('.page').inert = false; document.body.style.overflow = ''; }
    if (last && last.focus) last.focus();
  }

  lb.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) return close();
    var n = e.target.closest('[data-nav]'); if (n) return nav(+n.dataset.nav);
    var z = e.target.closest('[data-z]'); if (z) return zoom(z.dataset.z === '0' ? 0 : (z.dataset.z === '1' ? 1.4 : 1 / 1.4));
    if (e.target.closest('[data-buy]')) { var b = realBtn(byId[ids[idx]]); if (b && !b.disabled) b.click(); setTimeout(function () { paintCap(byId[ids[idx]]); }, 60); }
  });
  stage.addEventListener('wheel', function (e) { e.preventDefault(); zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
  stage.addEventListener('dblclick', function () { zoom(st.s > 1 ? 0 : 2.5); });
  stage.addEventListener('pointerdown', function (e) {
    pts[e.pointerId] = e; stage.setPointerCapture(e.pointerId);
    drag = { x: e.clientX - st.x, y: e.clientY - st.y, sx: e.clientX };
    if (Object.keys(pts).length === 2) { var k = Object.keys(pts); d0 = Math.hypot(pts[k[0]].clientX - pts[k[1]].clientX, pts[k[0]].clientY - pts[k[1]].clientY); }
    pan.classList.add('drag');
  });
  stage.addEventListener('pointermove', function (e) {
    if (!pts[e.pointerId]) return; pts[e.pointerId] = e;
    var k = Object.keys(pts);
    if (k.length === 2) {
      var d = Math.hypot(pts[k[0]].clientX - pts[k[1]].clientX, pts[k[0]].clientY - pts[k[1]].clientY);
      if (d0) zoom(d / d0); d0 = d; return;
    }
    if (st.s > 1 && drag) { st.x = e.clientX - drag.x; st.y = e.clientY - drag.y; apply(); }
  });
  var up = function (e) {
    delete pts[e.pointerId]; pan.classList.remove('drag');
    if (drag && st.s === 1 && Math.abs(e.clientX - drag.sx) > 70 && !Object.keys(pts).length) { var dir = e.clientX < drag.sx ? 1 : -1; lb._photo ? lb._photo(dir) : (ids.length > 1 && nav(dir)); }
    drag = null; d0 = 0;
  };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') nav(1);
    else if (e.key === 'ArrowLeft') nav(-1);
    else if (e.key === '+' || e.key === '=') zoom(1.4);
    else if (e.key === '-') zoom(1 / 1.4);
    else if (e.key === '0') zoom(0);
    else if (e.key === 'Tab') {
      var f = [].slice.call(lb.querySelectorAll('button:not([disabled]):not([hidden])')), i = f.indexOf(document.activeElement);
      e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });

  function photoize() {
    [].forEach.call(document.querySelectorAll('.card .art:not([data-ph]), .prow .thumb:not([data-ph])'), function (el) {
      el.setAttribute('data-ph', '1');
      var host = el.closest('.card, .prow'), b = host && host.querySelector('[data-add]'), p = b && byId[b.getAttribute('data-add')];
      if (!p) return;
      probe(p).then(function (list) {
        if (!list || !list.length || !el.isConnected) return;
        var im = new Image(); im.className = 'ph'; im.alt = p.name; im.loading = 'lazy'; im.decoding = 'async'; im.src = list[0];
        el.insertBefore(im, el.firstChild); el.classList.add('has-photo');
      });
    });
  }
  function decorate() {
    photoize();
    [].forEach.call(document.querySelectorAll('.card .art:not([role]), .prow .thumb:not([role])'), function (el) {
      el.setAttribute('role', 'button'); el.tabIndex = 0; el.setAttribute('aria-label', 'Kép nagyítása');
    });
  }
  function trigger(t) {
    var host = t.closest('.card, .prow'), b = host && host.querySelector('[data-add]'); if (!b) return false;
    var list = [].map.call(host.parentElement.querySelectorAll('[data-add]'), function (x) { return x.getAttribute('data-add'); });
    open(b.getAttribute('data-add'), list, t); return true;
  }
  document.addEventListener('click', function (e) { var t = e.target.closest('.card .art, .prow .thumb'); if (t) trigger(t); });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && lb.hidden) { var t = e.target.closest && e.target.closest('.card .art, .prow .thumb'); if (t && trigger(t)) e.preventDefault(); }
  });
  new MutationObserver(decorate).observe(document.body, { childList: true, subtree: true });
  decorate();
})();
