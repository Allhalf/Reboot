/* ReBoot – indító: a termékeket az adatbázis-API-ból tölti be, majd elindítja az oldal szkriptjeit.
   Ha az API nem érhető el (nincs szerver/PHP, nincs bekapcsolva, file://), a beépített bemutató adatok maradnak. */
(function () {
  'use strict';
  var R = window.REBOOT = { api: false, base: 'api/' };
  var gallery = document.currentScript && document.currentScript.hasAttribute('data-gallery');
  var swap = function (arr, next) { arr.splice.apply(arr, [0, arr.length].concat(next)); };
  function apply(d) {
    if (!d || !Array.isArray(d.products) || !Array.isArray(d.parts)) return false;
    swap(PRODUCTS, d.products); swap(PARTS, d.parts); R.api = true; return true;
  }
  function save(d) { try { sessionStorage.setItem('reboot-items', JSON.stringify(d)); } catch (e) { /* nincs tárhely */ } }
  function fetchItems(ms) {
    var ctl = window.AbortController ? new AbortController() : null, t = ctl && setTimeout(function () { ctl.abort(); }, ms);
    return fetch(R.base + 'items.php', { headers: { Accept: 'application/json' }, signal: ctl ? ctl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error('api'); return r.json(); })
      .then(function (j) { clearTimeout(t); if (!j || !j.ok) throw new Error('api'); return j; });
  }
  R.ticket = function (code) {
    return fetch(R.base + 'ticket.php?code=' + encodeURIComponent(code), { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); }).then(function (j) { return j && j.ok ? j.ticket : null; }, function () { return null; });
  };
  function run(list) {
    var i = 0;
    (function next() {
      if (i >= list.length) return;
      var s = document.createElement('script'); s.src = 'assets/js/' + list[i++]; s.onload = next; s.onerror = next; document.body.appendChild(s);
    })();
  }
  var go = function () { run(['app.js'].concat(gallery ? ['gallery.js'] : [])); };
  var cached = null; try { cached = JSON.parse(sessionStorage.getItem('reboot-items')); } catch (e) { cached = null; }
  if (cached && apply(cached)) { go(); fetchItems(4000).then(save, function () {}); }   /* gyors: az előző letöltést használjuk, a frissítés a háttérben megy */
  else fetchItems(2500).then(function (j) { apply(j); save(j); go(); }, go);
})();
