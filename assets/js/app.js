
/* ---- tiszta függvények: kalkulátor, nyitvatartás, kosár ---- */
const CALC_TYPES = [
  { id: 'laptop', label: 'Laptop', base: 90000 },
  { id: 'desktop', label: 'Asztali gép', base: 60000 },
  { id: 'phone', label: 'Telefon', base: 70000 },
  { id: 'console', label: 'Konzol', base: 45000 },
  { id: 'monitor', label: 'Monitor', base: 25000 },
  { id: 'retro', label: 'Retro gép (25+ éves)', base: 30000 }
];
const CALC_CONDS = [
  { id: 'good', label: 'Hibátlanul működik', mult: 1 },
  { id: 'worn', label: 'Működik, de kopott', mult: 0.75 },
  { id: 'broken', label: 'Hibás', mult: 0.3 }
];
const CALC_ACCS = [
  { id: 'charger', label: 'Töltő vagy tápegység', bonus: 0.05 },
  { id: 'box', label: 'Eredeti doboz', bonus: 0.05 },
  { id: 'invoice', label: 'Számla', bonus: 0.03 }
];
const RETRO_MIN_AGE = 25;

function ageFactor(typeId, age) {
  if (typeId === 'retro') return 0.35 + 0.03 * age;
  return Math.max(0.06, Math.pow(0.5, age / 4));
}

function round500(v) { return Math.round(v / 500) * 500; }

function estimate(typeId, age, condId, accIds) {
  const t = CALC_TYPES.find(function (x) { return x.id === typeId; }) || CALC_TYPES[0];
  const c = CALC_CONDS.find(function (x) { return x.id === condId; }) || CALC_CONDS[0];
  const bonus = (accIds || []).reduce(function (sum, id) {
    const a = CALC_ACCS.find(function (x) { return x.id === id; });
    return sum + (a ? a.bonus : 0);
  }, 0);
  const raw = t.base * ageFactor(t.id, age) * c.mult * (1 + bonus);
  const mid = Math.max(500, round500(raw));
  const low = Math.max(500, round500(raw * 0.88));
  const high = Math.max(low, round500(raw * 1.12));
  return { raw: raw, low: low, mid: mid, high: high, voucher: round500(mid * 1.2) };
}

const HOURS = [[10, 18], [10, 18], [10, 18], [10, 18], [10, 18], [9, 13], null];
const DAYS = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];

function pad2(n) { return String(n).padStart(2, '0'); }

function shopStatus(dayIdx, minutes) {
  const today = HOURS[dayIdx];
  if (today && minutes >= today[0] * 60 && minutes < today[1] * 60) {
    return { open: true, text: 'Most nyitva · ' + pad2(today[1]) + ':00-ig' };
  }
  if (today && minutes < today[0] * 60) {
    return { open: false, text: 'Zárva · ma ' + pad2(today[0]) + ':00-kor nyit' };
  }
  for (let i = 1; i <= 7; i++) {
    const d = (dayIdx + i) % 7;
    const h = HOURS[d];
    if (h) {
      const when = i === 1 ? 'holnap' : DAYS[d].toLowerCase();
      return { open: false, text: 'Zárva · ' + when + ' ' + pad2(h[0]) + ':00-kor nyit' };
    }
  }
  return { open: false, text: 'Zárva' };
}

function budapestNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Budapest', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(new Date());
  const get = function (t) { const p = parts.find(function (x) { return x.type === t; }); return p ? p.value : ''; };
  const map = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  let h = parseInt(get('hour'), 10);
  if (h === 24) h = 0;
  const day = map[get('weekday')];
  return { day: day === undefined ? 0 : day, minutes: h * 60 + (parseInt(get('minute'), 10) || 0) };
}

function groupNum(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); }
function fmtFt(n) { return groupNum(n) + '\u00a0Ft'; }

function cartTotals(cart, products) {
  let count = 0, total = 0;
  Object.keys(cart).forEach(function (id) {
    const p = products.find(function (x) { return x.id === id; });
    if (p && cart[id] > 0) { count += cart[id]; total += cart[id] * p.price; }
  });
  return { count: count, total: total };
}

const DIAG_FEE = 4900;

/* javítási árbecslő: list = a géptípus szolgáltatásai, valueMid = a gép felvásárlási értéke */
function repairQuote(list, ids, valueMid) {
  let low = 0, high = 0, days = 0, count = 0;
  (ids || []).forEach(function (id) {
    const s = list.find(function (x) { return x.id === id; });
    if (s) { low += s.from; high += s.to; days = Math.max(days, s.days); count++; }
  });
  const k = count >= 2 ? 0.9 : 1;
  low = Math.round(low * k / 100) * 100;
  high = Math.round(high * k / 100) * 100;
  const ratio = count && valueMid > 0 ? (low + high) / 2 / valueMid : 0;
  const level = !count ? 'none' : ratio < 0.5 ? 'good' : ratio <= 0.9 ? 'think' : 'swap';
  return { count: count, low: low, high: high, days: days, discount: count >= 2, ratio: ratio, level: level, diag: count ? 0 : DIAG_FEE };
}

function ticketLookup(code, tickets) {
  const norm = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!norm) return null;
  const key = Object.keys(tickets).find(function (k) { return k.replace(/[^A-Z0-9]/g, '') === norm; });
  return key ? Object.assign({ id: key }, tickets[key]) : null;
}

const REPAIR_MAIL_TO = 'joannistzelepakis@gmail.com';
const MIN_DETAIL = 5;
const MAILTO_LIMIT = 6000;

function validateRepair(f) {
  const err = {};
  if (String(f.desc || '').trim().length < MIN_DETAIL) err.desc = 'Írd le legalább egy pontban, mi a baj, mielőtt elküldöd.';
  if (String(f.name || '').trim().length < 2) err.name = 'Add meg a neved.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(f.email || '').trim())) err.email = 'Adj meg egy érvényes e-mail-címet.';
  return err;
}

function buildRepairMail(f) {
  const issues = f.issues || [];
  const lines = [
    'Javítási kérés a ReBoot Tech & Trade oldalról',
    '',
    'Név: ' + String(f.name).trim(),
    'E-mail: ' + String(f.email).trim(),
    'Telefon: ' + (String(f.phone || '').trim() || 'nincs megadva'),
    '',
    'Gép: ' + f.device,
    'Kijelölt hibák: ' + (issues.length ? issues.join('; ') : 'nincs kijelölve'),
  ];
  if (f.estimate) lines.push('Becsült költség: ' + f.estimate);
  lines.push('', 'A hiba részletei:', String(f.desc).trim());
  const body = lines.join('\n').replace(/ /g, ' ');
  const subject = 'Javítási kérés: ' + f.device;
  const make = function (b) {
    return 'mailto:' + REPAIR_MAIL_TO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(b.replace(/\n/g, '\r\n'));
  };
  let cut = body, truncated = false, url = make(cut);
  while (url.length > MAILTO_LIMIT && cut.length > 200) {
    cut = cut.slice(0, Math.floor(cut.length * 0.9));
    truncated = true;
    url = make(cut + '\n[…a levél itt rövidítve lett, a teljes szöveg az oldalon másolható]');
  }
  return { subject: subject, body: body, mailto: url, truncated: truncated, to: REPAIR_MAIL_TO };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { estimate: estimate, shopStatus: shopStatus, cartTotals: cartTotals, ageFactor: ageFactor, fmtFt: fmtFt, groupNum: groupNum, repairQuote: repairQuote, ticketLookup: ticketLookup, validateRepair: validateRepair, buildRepairMail: buildRepairMail };
}
/* ---- adatok: bolt, alkatrészek, szerviz, követés, GYIK ---- */
const SERVICES = {
  laptop: [
    { id: 'battery', label: 'Akkumulátor-csere', from: 12900, to: 24900, days: 1 },
    { id: 'cooling', label: 'Tisztítás és új hőpaszta (túlmelegedés)', from: 6900, to: 9900, days: 1 },
    { id: 'ssd', label: 'SSD-csere és rendszer-átköltöztetés', from: 14900, to: 29900, days: 1 },
    { id: 'screen', label: 'Kijelzőcsere', from: 18900, to: 39900, days: 2 },
    { id: 'keyboard', label: 'Billentyűzet-csere', from: 9900, to: 19900, days: 2 },
    { id: 'board', label: 'Alaplap-szintű hiba (nem tölt, nem indul)', from: 19900, to: 49900, days: 5 },
    { id: 'liquid', label: 'Folyadék okozta kár', from: 14900, to: 59900, days: 5 }
  ],
  desktop: [
    { id: 'clean', label: 'Tisztítás és új hőpaszta', from: 5900, to: 7900, days: 1 },
    { id: 'psu', label: 'Tápegység-csere', from: 8900, to: 18900, days: 1 },
    { id: 'ssd', label: 'SSD-csere és rendszer-átköltöztetés', from: 9900, to: 19900, days: 1 },
    { id: 'ram', label: 'Memória cseréje vagy bővítése', from: 4900, to: 12900, days: 1 },
    { id: 'gpu', label: 'Videókártya-csere', from: 7900, to: 29900, days: 2 },
    { id: 'mobo', label: 'Alaplap-csere', from: 14900, to: 39900, days: 3 },
    { id: 'data', label: 'Adatmentés sérült meghajtóról', from: 9900, to: 39900, days: 3 }
  ],
  phone: [
    { id: 'screen', label: 'Kijelzőcsere', from: 15900, to: 44900, days: 1 },
    { id: 'battery', label: 'Akkumulátor-csere', from: 8900, to: 15900, days: 1 },
    { id: 'port', label: 'Töltőcsatlakozó cseréje', from: 8900, to: 14900, days: 1 },
    { id: 'camera', label: 'Kameracsere', from: 9900, to: 24900, days: 2 },
    { id: 'liquid', label: 'Folyadék okozta kár', from: 9900, to: 34900, days: 3 },
    { id: 'data', label: 'Adatmentés és átköltöztetés', from: 9900, to: 29900, days: 3 }
  ],
  console: [
    { id: 'clean', label: 'Tisztítás és új hőpaszta', from: 6900, to: 10900, days: 1 },
    { id: 'pad', label: 'Kontroller javítása (stick drift, gombok)', from: 4900, to: 9900, days: 1 },
    { id: 'psu', label: 'Tápegység-csere', from: 8900, to: 16900, days: 2 },
    { id: 'hdmi', label: 'HDMI-port cseréje', from: 14900, to: 24900, days: 3 },
    { id: 'drive', label: 'Lemezmeghajtó cseréje', from: 12900, to: 24900, days: 3 },
    { id: 'reball', label: 'Chip-szintű forrasztás (reball)', from: 24900, to: 44900, days: 6 }
  ],
  monitor: [
    { id: 'psu', label: 'Tápegység és kondenzátorok cseréje', from: 5900, to: 12900, days: 2 },
    { id: 'backlight', label: 'Háttérvilágítás cseréje', from: 9900, to: 19900, days: 3 },
    { id: 'input', label: 'Bemenet (HDMI, DVI, VGA) cseréje', from: 7900, to: 14900, days: 3 },
    { id: 'crt', label: 'CRT: képcső beállítása, kondenzátorcsere', from: 9900, to: 19900, days: 4 }
  ],
  retro: [
    { id: 'recap', label: 'Kondenzátor-csere (recap)', from: 9900, to: 24900, days: 3 },
    { id: 'psu', label: 'Tápegység javítása vagy cseréje', from: 6900, to: 14900, days: 2 },
    { id: 'chip', label: 'Hibás IC azonosítása és cseréje', from: 12900, to: 29900, days: 4 },
    { id: 'mem', label: 'RAM- és ROM-teszt, csere', from: 5900, to: 12900, days: 2 },
    { id: 'corrosion', label: 'Elemszivárgás okozta korrózió tisztítása', from: 7900, to: 19900, days: 2 },
    { id: 'yellow', label: 'Műanyag sárgulásának kezelése', from: 8900, to: 16900, days: 3 },
    { id: 'floppy', label: 'Hajlékonylemez-meghajtó szervize', from: 5900, to: 9900, days: 2 }
  ]
};

const STAGES = ['Beérkezett', 'Diagnosztika', 'Árajánlat', 'Javítás', 'Teszt', 'Átvehető'];


const FAQ = [
  ['Nem nálatok vettem a gépet. Megjavítjátok?', 'Igen. A szerviz bármilyen gépre nyitva áll, nem kell nálunk vásárolnod. Behozhatod személyesen, vagy elküldheted csomagban.'],
  ['Mennyibe kerül a diagnosztika?', 'Ingyenes, ha nálunk javíttatod a gépet. Ha a hibakeresés után nem kéred a javítást, 4 900 Ft. Árat csak a diagnosztika után mondunk, és javítani csak a jóváhagyásod után kezdünk.'],
  ['Mennyi ideig tart a javítás?', 'Az akkucsere, a tisztítás és az SSD-csere többnyire egy munkanap. A kijelzőcsere két napig, az alaplap-szintű hiba legfeljebb egy hétig tarthat. A javítási kóddal az állását bármikor megnézheted.'],
  ['Mi lesz az adataimmal?', 'A legtöbb javításhoz nem kell az adatokhoz nyúlni. Ha mégis, előbb másolatot készítünk, de csak a beleegyezéseddel. Beszámításnál a tárhelyet a szemed láttára töröljük, és kérésre jegyzőkönyvet adunk róla.'],
  ['Milyen garanciát adtok?', 'Eladott gépre és alkatrészre 6 hónap. A javításra is 6 hónap jár, a kicserélt alkatrészre és a munkára egyaránt. Ha a hiba nem a használatból ered, megjavítjuk vagy kicseréljük, végső esetben visszafizetjük az árat.'],
  ['Mi van, ha a javítás drágább, mint a gép?', 'Megmondjuk, mielőtt belekezdenénk. Ilyenkor beszámítjuk a gépet, vagy alkatrésznek megvesszük. A hibás gépért is adunk árat, és ami már semmire sem jó, azt díjmentesen átvesszük és szakszerűen leadjuk.'],
  ['Hogyan számoljátok az árat a retro gépeknél?', 'Itt a kor előny. A 25 évnél idősebb, működő gép gyűjtői felárat kap. A tápegység, az eredeti doboz és a számla szintén emeli az árat.'],
  ['Kerestek nekem egy konkrét gépet vagy alkatrészt?', 'Igen. Írd meg a típust vagy a jelölést, és szólunk, amint beérkezik hozzánk egy példány. A régi csatlakozókhoz, kártyákhoz és meghajtókhoz is gyűjtünk.'],
  ['Visszavihetem, ha mégsem jó?', 'Az eladott gépet 14 napon belül, indoklás nélkül, ha nem sérült, és megvan minden tartozéka.']
];
/* ikonok, 160×120-as vászonra; az osztályok a CSS-ben színeződnek */
const ICONS = {
  cpu: '<rect class="f" x="42" y="22" width="76" height="76"/><rect class="t" x="58" y="38" width="44" height="44"/><path d="M54 22V10M70 22V10M90 22V10M106 22V10M54 98V110M70 98V110M90 98V110M106 98V110M42 40H30M42 58H30M42 78H30M118 40H130M118 58H130M118 78H130"/><circle class="tf" cx="50" cy="30" r="3"/>',
  psu: '<rect class="f" x="24" y="24" width="112" height="72"/><circle cx="62" cy="60" r="26"/><circle class="tf" cx="62" cy="60" r="5"/><path class="t" d="M62 34V86M36 60H88M44 42L80 78M80 42L44 78" stroke-width="2"/><rect class="t" x="104" y="36" width="20" height="12"/><path d="M104 66H124M104 76H124"/>',
  fan: '<rect class="f" x="30" y="10" width="100" height="100"/><circle cx="80" cy="60" r="38"/><circle class="tf" cx="80" cy="60" r="7"/><path class="t" d="M80 53C80 36 92 28 106 32M87 60C104 60 112 72 108 86M80 67C80 84 68 92 54 88M73 60C56 60 48 48 52 34"/><circle class="tf" cx="38" cy="18" r="3"/><circle class="tf" cx="122" cy="18" r="3"/><circle class="tf" cx="38" cy="102" r="3"/><circle class="tf" cx="122" cy="102" r="3"/>',
  board: '<rect class="f" x="26" y="8" width="108" height="104"/><rect class="t" x="42" y="22" width="30" height="30"/><path d="M84 20H120M84 30H120M84 40H120M84 50H120"/><rect class="t" x="42" y="70" width="64" height="10"/><rect class="t" x="42" y="88" width="64" height="10"/><circle class="tf" cx="120" cy="96" r="4"/>',
  battery: '<rect class="f" x="16" y="34" width="116" height="52"/><rect class="f" x="132" y="49" width="12" height="22"/><path class="t" d="M30 46V74M44 46V74M58 46V74"/><path d="M100 50L90 62H104L94 74"/>',
  ssd: '<rect class="f" x="30" y="20" width="100" height="72"/><rect class="t" x="42" y="30" width="38" height="52"/><rect class="tf" x="92" y="32" width="26" height="10"/><path d="M92 54H118M92 64H118"/><path class="t" d="M44 102H116" stroke-width="5" stroke-dasharray="4 4"/>',
  lcd: '<rect class="f" x="14" y="16" width="132" height="82"/><rect class="t" x="24" y="26" width="112" height="62"/><path d="M60 98V108M100 98V108M44 108H116"/>',
  charger: '<rect class="f" x="14" y="38" width="64" height="44"/><path d="M78 60H104C116 60 118 40 130 40H146"/><rect class="f" x="146" y="32" width="12" height="16"/><path class="t" d="M24 50H60M24 60H60M24 70H60"/><path d="M78 52V68"/>',
  ribbon: '<path class="f" d="M10 40H40V80H10Z"/><path class="t" d="M16 46H34M16 54H34M16 62H34M16 70H34"/><path d="M40 48H110M40 56H110M40 64H110M40 72H110"/><rect class="f" x="110" y="40" width="30" height="40"/><rect class="tf" x="118" y="52" width="14" height="16"/>',
  card: '<rect class="f" x="12" y="30" width="136" height="50"/><rect class="t" x="24" y="40" width="30" height="30"/><path d="M70 42H124M70 52H124M70 62H124"/><path class="t" d="M20 90H140" stroke-width="6" stroke-dasharray="3 3"/><path d="M12 30V20H34V30"/>',
  laptop: '<rect class="f" x="30" y="16" width="100" height="68"/><rect class="t" x="40" y="26" width="80" height="48"/><path class="f" d="M12 92H148L140 106H20Z"/><path d="M66 99H94"/>',
  tower: '<rect class="f" x="50" y="10" width="60" height="100"/><rect x="60" y="22" width="40" height="9"/><rect class="t" x="60" y="38" width="40" height="9"/><path d="M60 62H100M60 70H100M60 78H100"/><circle class="f" cx="80" cy="95" r="6"/>',
  crt: '<path class="f" d="M24 12H136V90H24Z"/><rect class="t" x="36" y="22" width="88" height="54"/><path class="t" d="M44 34H116M44 46H116M44 58H116" stroke-width="1.5"/><circle class="tf" cx="118" cy="84" r="2.5"/><path class="f" d="M58 90H102L110 108H50Z"/>',
  c64: '<path class="f" d="M10 98L34 42H150V98Z"/><path class="t" d="M44 60H140M44 72H140M44 84H140" stroke-dasharray="9 5"/><rect class="tf" x="128" y="47" width="14" height="5"/>',
  gameboy: '<rect class="f" x="48" y="8" width="64" height="104"/><rect class="t" x="56" y="16" width="48" height="38"/><path d="M62 82H78M70 74V90"/><circle cx="96" cy="80" r="5"/><circle cx="88" cy="90" r="5"/><path class="t" d="M92 102L106 96"/>',
  keyboard: '<rect class="f" x="8" y="34" width="144" height="54"/><path class="t" d="M18 46H142M18 58H142M18 70H142" stroke-dasharray="10 5"/><path d="M44 79H116"/>',
  floppy: '<path class="f" d="M34 12H114L126 24V108H34Z"/><rect x="56" y="12" width="46" height="30"/><rect class="t" x="86" y="18" width="9" height="18"/><rect class="f" x="46" y="62" width="68" height="46"/><path class="t" d="M54 74H106M54 84H96"/>',
  ram: '<rect class="f" x="8" y="38" width="144" height="46"/><rect class="t" x="22" y="48" width="22" height="16"/><rect class="t" x="50" y="48" width="22" height="16"/><rect class="t" x="88" y="48" width="22" height="16"/><rect class="t" x="116" y="48" width="22" height="16"/><path class="t" d="M12 92H148" stroke-width="6" stroke-dasharray="3 3"/>',
  gpu: '<rect class="f" x="4" y="22" width="8" height="70"/><rect class="f" x="12" y="26" width="140" height="58"/><circle cx="56" cy="55" r="19"/><circle cx="108" cy="55" r="19"/><circle class="tf" cx="56" cy="55" r="5"/><circle class="tf" cx="108" cy="55" r="5"/><path class="t" d="M40 92H140" stroke-width="6" stroke-dasharray="3 3"/>',
  hdd: '<rect class="f" x="30" y="10" width="100" height="100"/><circle cx="80" cy="54" r="30"/><circle class="tf" cx="80" cy="54" r="6"/><path class="t" d="M80 54L112 24"/><circle class="tf" cx="40" cy="20" r="3"/><circle class="tf" cx="120" cy="20" r="3"/><circle class="tf" cx="40" cy="100" r="3"/><circle class="tf" cx="120" cy="100" r="3"/><rect class="t" x="48" y="94" width="40" height="8"/>',
  cable: '<path class="f" d="M8 44H44L38 76H14Z"/><path class="t" d="M18 54H34M20 64H32"/><path d="M44 60C66 60 70 36 90 52S110 60 124 60"/><rect class="f" x="124" y="48" width="30" height="24"/><rect class="tf" x="132" y="55" width="14" height="10"/>',
  phone: '<rect class="f" x="52" y="6" width="56" height="108"/><rect class="t" x="60" y="16" width="40" height="26"/><path d="M72 50H88"/><path class="t" d="M62 66H98M62 78H98M62 90H98M62 102H98" stroke-dasharray="8 4"/>',
  console: '<path class="f" d="M12 62H148V102H12Z"/><path class="f" d="M30 62V46H130V62"/><rect class="t" x="46" y="26" width="68" height="20"/><circle class="tf" cx="28" cy="82" r="4"/><path class="t" d="M52 82H128M52 92H128"/>'
};

function iconSVG(key, cls) {
  return '<svg class="' + (cls || 'pic') + '" viewBox="0 0 160 120" aria-hidden="true">' + (ICONS[key] || '') + '</svg>';
}

/* a logó fogaskereke, két körbe forduló nyíllal */
function gearSVG() {
  const cx = 50, cy = 50, ro = 45, ri = 37, teeth = 8, step = Math.PI * 2 / teeth;
  const pts = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2;
    [[ri, -0.3], [ro, -0.2], [ro, 0.2], [ri, 0.3]].forEach(function (q) {
      const ang = a + q[1] * step * 1.6;
      pts.push((cx + q[0] * Math.cos(ang)).toFixed(1) + ',' + (cy + q[0] * Math.sin(ang)).toFixed(1));
    });
  }
  function pt(r, deg) {
    const a = deg * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }
  function arc(r, a0, a1) {
    const s = pt(r, a0), e = pt(r, a1);
    return 'M' + s[0].toFixed(1) + ' ' + s[1].toFixed(1) + ' A' + r + ' ' + r + ' 0 0 1 ' + e[0].toFixed(1) + ' ' + e[1].toFixed(1);
  }
  function head(r, deg) {
    const a = deg * Math.PI / 180, p = pt(r, deg);
    const tx = -Math.sin(a), ty = Math.cos(a), nx = Math.cos(a), ny = Math.sin(a);
    const q = [[p[0] + tx * 6, p[1] + ty * 6], [p[0] - tx * 1 + nx * 5.5, p[1] - ty * 1 + ny * 5.5], [p[0] - tx * 1 - nx * 5.5, p[1] - ty * 1 - ny * 5.5]];
    return q.map(function (v) { return v[0].toFixed(1) + ',' + v[1].toFixed(1); }).join(' ');
  }
  return '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round" aria-hidden="true">' +
    '<polygon points="' + pts.join(' ') + '"/>' +
    '<circle cx="50" cy="50" r="26" stroke-width="4"/>' +
    '<path d="' + arc(13, 205, 335) + '" stroke-width="4"/><polygon points="' + head(13, 335) + '" fill="currentColor" stroke-width="1"/>' +
    '<path d="' + arc(13, 25, 155) + '" stroke-width="4"/><polygon points="' + head(13, 155) + '" fill="currentColor" stroke-width="1"/>' +
    '</svg>';
}
/* ---- az oldal működése ---- */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s) || document.createElement('input'); }; /* hiányzó elem: ártalmatlan helyettes, így egy közös szkript fut minden oldalon */
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var num = groupNum;
  var fold = function (s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* nincs tárhely, nem baj */ } }
  };

  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }
  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    if (ok) done(); else toast('A másolás nem sikerült. Jelöld ki a szöveget, és másold ki kézzel.');
  }
  function copyText(text, okMsg) {
    var done = function () { toast(okMsg); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
    } else { fallbackCopy(text, done); }
  }

  /* logó */
  $$('[data-gear]').forEach(function (el) { el.innerHTML = gearSVG(); });

  /* ---------- katalógus ---------- */
  var state = { q: '', cat: 'all', sort: 'def' };
  var ALL = PRODUCTS.concat(PARTS);
  var cart = {};
  var resvText = '';

  (function loadCart() {
    try {
      var raw = store.get('reboot-cart');
      if (!raw) return;
      var o = JSON.parse(raw);
      if (!o || typeof o !== 'object') return;
      PRODUCTS.forEach(function (p) {
        var q = o[p.id];
        if (Number.isInteger(q) && q > 0) cart[p.id] = Math.min(q, p.stock);
      });
    } catch (e) { cart = {}; }
  })();
  function saveCart() { store.set('reboot-cart', JSON.stringify(cart)); }

  function renderChips() {
    $('#chips').innerHTML = CATS.map(function (c) {
      var n = c.id === 'all' ? PRODUCTS.length : PRODUCTS.filter(function (p) { return p.cat === c.id; }).length;
      return '<button class="chip" type="button" data-cat="' + c.id + '" aria-pressed="' + (state.cat === c.id) + '">' + esc(c.label) + '<span class="n">' + n + '</span></button>';
    }).join('');
  }

  function visibleProducts() {
    var q = fold(state.q.trim());
    var list = PRODUCTS.filter(function (p) {
      if (state.cat !== 'all' && p.cat !== state.cat) return false;
      if (!q) return true;
      return fold(p.name + ' ' + p.spec + ' ' + p.year).indexOf(q) !== -1;
    });
    var by = {
      pa: function (a, b) { return a.price - b.price; },
      pd: function (a, b) { return b.price - a.price; },
      yo: function (a, b) { return a.year - b.year; },
      yn: function (a, b) { return b.year - a.year; }
    }[state.sort];
    if (by) list = list.slice().sort(by);
    return list;
  }

  var BG_A = '<path d="M0 20H30L40 30H70M0 100H24L34 90H64M160 30H134L124 20H104M160 98H140L130 108H100"/>';
  var BG_B = '<path d="M0 30H26L36 20H66M0 92H30L40 102H72M160 22H130L120 32H98M160 104H138L128 94H104"/>';
  var CAT_NAME = {};
  CATS.forEach(function (c) { CAT_NAME[c.id] = c.label; });

  function cardHTML(p, i) {
    var inCart = cart[p.id] || 0;
    var full = inCart >= p.stock;
    var stockTxt = p.stock === 1 ? 'Utolsó darab' : (p.stock <= 2 ? 'Már csak ' + p.stock + ' db' : p.stock + ' db raktáron');
    var btn = full ? 'Kosárban' : (inCart ? 'Még egyet' : 'Kosárba');
    return '<article class="card">' +
      '<div class="art"><svg class="bgtrace" viewBox="0 0 160 120" preserveAspectRatio="none" aria-hidden="true">' + (i % 2 ? BG_A : BG_B) + '</svg>' +
      iconSVG(p.icon, 'pic') +
      '<span class="grade">' + p.grade + ' fokozat</span></div>' +
      '<div class="card-body">' +
      '<p class="meta">' + p.year + ' · ' + esc(CAT_NAME[p.cat]) + '</p>' +
      '<h3>' + esc(p.name) + '</h3>' +
      '<p class="spec-line">' + esc(p.spec) + '</p>' +
      '<div class="card-foot"><div><span class="price">' + fmtFt(p.price) + '</span><span class="stock' + (p.stock <= 2 ? ' low' : '') + '">' + stockTxt + (inCart ? ' · nálad: ' + inCart : '') + '</span></div>' +
      '<button class="btn small" type="button" data-add="' + p.id + '"' + (full ? ' disabled' : '') + '>' + btn + '</button></div>' +
      '</div></article>';
  }

  function renderCatalog() {
    var list = visibleProducts();
    $('#grid').innerHTML = list.length ? list.map(cardHTML).join('') : '<p class="empty">Nincs találat. Próbálj másik szót, vagy válaszd a „Minden” kategóriát.</p>';
    $('#countLabel').textContent = list.length === PRODUCTS.length ? PRODUCTS.length + ' felújított gép raktáron' : list.length + ' / ' + PRODUCTS.length + ' gép';
  }

  $('#chips').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]');
    if (!b) return;
    state.cat = b.getAttribute('data-cat');
    renderChips(); renderCatalog();
    var again = $('[data-cat="' + state.cat + '"]');
    if (again) again.focus();
  });
  $('#q').addEventListener('input', function (e) { state.q = e.target.value; renderCatalog(); });
  $('#sort').addEventListener('change', function (e) { state.sort = e.target.value; renderCatalog(); });
  $('#grid').addEventListener('click', function (e) {
    var b = e.target.closest('[data-add]');
    if (!b) return;
    addToCart(b.getAttribute('data-add'), true);
  });

  /* ---------- alkatrészek ---------- */
  var pstate = { q: '', cat: 'all', sort: 'def' };
  var PCAT = {};
  PART_CATS.forEach(function (c) { PCAT[c.id] = c.label; });

  function renderPartChips() {
    $('#partChips').innerHTML = PART_CATS.map(function (c) {
      var n = c.id === 'all' ? PARTS.length : PARTS.filter(function (p) { return p.cat === c.id; }).length;
      return '<button class="chip" type="button" data-pcat="' + c.id + '" aria-pressed="' + (pstate.cat === c.id) + '">' + esc(c.label) + '<span class="n">' + n + '</span></button>';
    }).join('');
  }

  function visibleParts() {
    var q = fold(pstate.q.trim());
    var list = PARTS.filter(function (p) {
      if (pstate.cat !== 'all' && p.cat !== pstate.cat) return false;
      if (!q) return true;
      return fold(p.name + ' ' + p.compat + ' ' + PCAT[p.cat]).indexOf(q) !== -1;
    });
    if (pstate.sort === 'pa') list = list.slice().sort(function (a, b) { return a.price - b.price; });
    if (pstate.sort === 'pd') list = list.slice().sort(function (a, b) { return b.price - a.price; });
    return list;
  }

  function partRow(p) {
    var inCart = cart[p.id] || 0;
    var full = inCart >= p.stock;
    var stockTxt = p.stock <= 2 ? 'már csak ' + p.stock + ' db' : p.stock + ' db';
    var btn = full ? 'Kosárban' : (inCart ? 'Még egyet' : 'Kosárba');
    return '<div class="prow"><div class="thumb">' + iconSVG(p.icon, '') + '</div>' +
      '<div><h3>' + esc(p.name) + '</h3><p class="p-compat">' + esc(PCAT[p.cat]) + ' · ' + esc(p.compat) + '</p></div>' +
      '<div class="p-state"><b>' + p.grade + '</b><span' + (p.stock <= 2 ? ' class="low"' : '') + '>' + stockTxt + (inCart ? ' · nálad: ' + inCart : '') + '</span></div>' +
      '<div class="p-buy"><span class="price">' + fmtFt(p.price) + '</span><button class="btn small" type="button" data-add="' + p.id + '"' + (full ? ' disabled' : '') + '>' + btn + '</button></div></div>';
  }

  function renderParts() {
    var list = visibleParts();
    $('#partList').innerHTML = list.length ? list.map(partRow).join('') : '<p class="empty">Nincs találat. Próbálj másik szót, vagy írd meg nekünk, mit keresel.</p>';
    $('#partCount').textContent = list.length === PARTS.length ? PARTS.length + ' alkatrész raktáron' : list.length + ' / ' + PARTS.length + ' alkatrész';
  }

  function refresh() { renderCatalog(); renderParts(); renderCart(); }

  $('#partChips').addEventListener('click', function (e) {
    var b = e.target.closest('[data-pcat]');
    if (!b) return;
    pstate.cat = b.getAttribute('data-pcat');
    renderPartChips(); renderParts();
    var again = $('[data-pcat="' + pstate.cat + '"]');
    if (again) again.focus();
  });
  $('#partQ').addEventListener('input', function (e) { pstate.q = e.target.value; renderParts(); });
  $('#partSort').addEventListener('change', function (e) { pstate.sort = e.target.value; renderParts(); });
  $('#partList').addEventListener('click', function (e) {
    var b = e.target.closest('[data-add]');
    if (!b) return;
    addToCart(b.getAttribute('data-add'), true);
  });
  $('#partAsk').addEventListener('click', function () {
    fillForm('Alkatrész keresése', 'Ezt az alkatrészt keresem:\nGép típusa vagy az alkatrész jelölése:\n');
  });

  /* ---------- kosár ---------- */
  var lastFocus = null;

  function findP(id) { return ALL.filter(function (p) { return p.id === id; })[0]; }

  function addToCart(id, announce) {
    var p = findP(id);
    if (!p) return;
    var q = cart[id] || 0;
    if (q >= p.stock) { toast('Ebből ennyi van raktáron.'); return; }
    cart[id] = q + 1;
    resvText = '';
    saveCart(); refresh();
    if (announce) {
      toast(p.name + ' a kosárban');
      var again = $('[data-add="' + id + '"]');
      if (again && !again.disabled) again.focus();
    }
  }
  function setQty(id, q) {
    var p = findP(id);
    if (!p) return;
    if (q <= 0) delete cart[id]; else cart[id] = Math.min(q, p.stock);
    resvText = '';
    saveCart(); refresh();
  }

  function cartLines() {
    return Object.keys(cart).filter(function (id) { return cart[id] > 0 && findP(id); });
  }

  function summaryText() {
    var t = cartTotals(cart, ALL);
    var code = 'RB-' + Date.now().toString(36).toUpperCase().slice(-6);
    var rows = cartLines().map(function (id) {
      var p = findP(id);
      return cart[id] + ' × ' + p.name + ' · ' + fmtFt(cart[id] * p.price);
    });
    return 'ReBoot foglalás ' + code + '\n' + rows.join('\n') + '\nÖsszesen: ' + fmtFt(t.total);
  }

  function renderCart() {
    var ids = cartLines();
    var t = cartTotals(cart, ALL);
    var badge = $('#cartCount');
    badge.textContent = t.count;
    badge.hidden = t.count === 0;
    var body = $('#cartBody'), foot = $('#cartFoot');

    if (!ids.length) {
      body.innerHTML = '<p class="empty" style="margin-top:18px">A kosarad üres. Válassz a boltból vagy az alkatrészek közül.</p>';
      foot.innerHTML = '<a class="btn" href="bolt.html" data-close>Bolt és alkatrészek</a>';
      return;
    }

    body.innerHTML = ids.map(function (id) {
      var p = findP(id), q = cart[id];
      return '<div class="line">' +
        '<div class="thumb">' + iconSVG(p.icon, '') + '</div>' +
        '<div><div class="nm">' + esc(p.name) + '</div><div class="pr">' + fmtFt(p.price) + ' / db</div>' +
        '<div class="qty"><button type="button" data-dec="' + id + '" aria-label="Kevesebb: ' + esc(p.name) + '">−</button><span>' + q + '</span>' +
        '<button type="button" data-inc="' + id + '" aria-label="Több: ' + esc(p.name) + '"' + (q >= p.stock ? ' disabled' : '') + '>+</button></div></div>' +
        '<div><div class="sum">' + fmtFt(q * p.price) + '</div><button class="rm" type="button" data-rm="' + id + '">Törlés</button></div>' +
        '</div>';
    }).join('');

    if (resvText) {
      foot.innerHTML = '<div class="total"><span>Összesen</span><strong>' + fmtFt(t.total) + '</strong></div>' +
        '<div class="resv" id="resvBox">' + esc(resvText) + '</div>' +
        '<p class="fine">Írd meg ezt a <span class="mono" style="user-select:all">hello@reboot-tech.example</span> címre, vagy mutasd meg a boltban. Ez az oldal bemutató, nem küld megrendelést.</p>' +
        '<button class="btn primary" type="button" id="copyResv">Foglalás másolása</button>' +
        '<button class="btn" type="button" id="toForm">Átteszem az üzenetbe</button>';
    } else {
      foot.innerHTML = '<div class="total"><span>Összesen</span><strong>' + fmtFt(t.total) + '</strong></div>' +
        '<button class="btn primary" type="button" id="makeResv">Foglalás összegzése</button>' +
        '<p class="fine">Az összegzést kimásolhatod, vagy beteheted a kapcsolati űrlapba.</p>';
    }
  }

  function openCart() {
    lastFocus = document.activeElement;
    renderCart();
    $('#backdrop').hidden = false;
    var d = $('#drawer');
    d.inert = false;
    $('.page').inert = true;
    d.classList.add('open');
    document.body.style.overflow = 'hidden';
    $('#closeCart').focus();
  }
  function closeCart() {
    var d = $('#drawer');
    d.classList.remove('open');
    d.inert = true;
    $('.page').inert = false;
    $('#backdrop').hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $('#cartBtn').addEventListener('click', openCart);
  $('#closeCart').addEventListener('click', closeCart);
  $('#backdrop').addEventListener('click', closeCart);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && $('#drawer').classList.contains('open')) closeCart();
  });

  function fillForm(topic, text) {
    if (!document.getElementById('cMsg')) {
      try { sessionStorage.setItem('reboot-pending-form', JSON.stringify({ topic: topic, text: text })); } catch (e) { /* nincs tárhely */ }
      location.href = 'kapcsolat.html#kapcsolat';
      return;
    }
    $('#cTopic').value = topic;
    $('#cMsg').value = text;
    $('#composed').hidden = true;
    $('#kapcsolat').scrollIntoView();
    $('#cName').focus({ preventScroll: true });
  }
  (function () {
    var pend = null;
    try { pend = JSON.parse(sessionStorage.getItem('reboot-pending-form')); sessionStorage.removeItem('reboot-pending-form'); } catch (e) { pend = null; }
    if (pend && document.getElementById('cMsg')) fillForm(pend.topic, pend.text);
  })();

  $('#drawer').addEventListener('click', function (e) {
    var el = e.target.closest('button, a');
    if (!el) return;
    if (el.hasAttribute('data-close')) { closeCart(); return; }
    if (el.hasAttribute('data-inc')) { var a = el.getAttribute('data-inc'); setQty(a, (cart[a] || 0) + 1); return; }
    if (el.hasAttribute('data-dec')) { var b = el.getAttribute('data-dec'); setQty(b, (cart[b] || 0) - 1); return; }
    if (el.hasAttribute('data-rm')) { setQty(el.getAttribute('data-rm'), 0); return; }
    if (el.id === 'makeResv') { resvText = summaryText(); renderCart(); return; }
    if (el.id === 'copyResv') { copyText(resvText, 'Foglalás kimásolva'); return; }
    if (el.id === 'toForm') {
      var txt = resvText;
      closeCart();
      fillForm('Foglalás a kosárból', txt);
    }
  });

  /* ---------- beszámítás ---------- */
  function buildCalc() {
    $('#typeOpts').innerHTML = CALC_TYPES.map(function (t, i) {
      return '<label class="opt"><input type="radio" name="ctype" value="' + t.id + '"' + (i === 0 ? ' checked' : '') + '><span>' + esc(t.label) + '</span></label>';
    }).join('');
    $('#condOpts').innerHTML = CALC_CONDS.map(function (c, i) {
      return '<label class="opt"><input type="radio" name="ccond" value="' + c.id + '"' + (i === 0 ? ' checked' : '') + '><span>' + esc(c.label) + '</span></label>';
    }).join('');
    $('#accOpts').innerHTML = CALC_ACCS.map(function (a) {
      return '<label class="opt"><input type="checkbox" value="' + a.id + '"><span>' + esc(a.label) + '</span></label>';
    }).join('');
  }

  var MAX_SCALE = 120000;
  var lastOffer = '';

  function labelOf(list, id) { return list.filter(function (x) { return x.id === id; })[0].label; }

  function updateCalc() {
    var type = $('input[name="ctype"]:checked').value;
    var cond = $('input[name="ccond"]:checked').value;
    var accs = $$('#accOpts input:checked').map(function (i) { return i.value; });
    var ageEl = $('#age');
    var retro = type === 'retro';
    ageEl.min = retro ? RETRO_MIN_AGE : 0;
    if (+ageEl.value < +ageEl.min) ageEl.value = ageEl.min;
    var age = +ageEl.value;
    $('#ageOut').textContent = age + ' év';
    $('#ageHint').textContent = retro
      ? 'A retro gépek értéke a korral nő. 25 éves kortól gyűjtői felárat számítunk.'
      : 'Nagyjából négyévente feleződik a gép értéke.';

    var e = estimate(type, age, cond, accs);
    var scrap = e.raw < 1500;
    $('#outCash').textContent = scrap ? 'kb. ' + fmtFt(e.mid) : num(e.low) + ' – ' + num(e.high) + '\u00a0Ft';
    $('#outVoucher').textContent = fmtFt(e.voucher);

    var left = Math.min(100, e.low / MAX_SCALE * 100);
    var width = Math.max(0.8, Math.min(100 - left, (e.high - e.low) / MAX_SCALE * 100));
    $('#band').style.left = left + '%';
    $('#band').style.width = width + '%';

    $('#outNote').textContent = scrap
      ? 'Ami már nem javítható, azt elektronikai hulladékként díjmentesen átvesszük.'
      : 'A bolti utalvány a közepes becslés 120%-a. A végleges árat megtekintés után mondjuk meg.';

    var accTxt = accs.length ? accs.map(function (id) { return labelOf(CALC_ACCS, id).toLowerCase(); }).join(', ') : 'nincs';
    lastOffer = 'Beszámítási ajánlatot kérek.\nGép: ' + labelOf(CALC_TYPES, type) + ', ' + age + ' éves, ' + labelOf(CALC_CONDS, cond).toLowerCase() + '.\nTartozék: ' + accTxt + '.\nBecsült ár: ' + (scrap ? 'kb. ' + fmtFt(e.mid) : num(e.low) + ' – ' + num(e.high) + '\u00a0Ft') + '.';
  }

  try { buildCalc(); } catch (e) { /* ez az elem nincs ezen az oldalon */ }
  $('#calcForm').addEventListener('submit', function (e) { e.preventDefault(); });
  $('#calcForm').addEventListener('input', updateCalc);
  $('#calcForm').addEventListener('change', updateCalc);
  $('#askBtn').addEventListener('click', function () { fillForm('Beszámítási ajánlat', lastOffer); });
  try { updateCalc(); } catch (e) { /* ez az elem nincs ezen az oldalon */ }

  /* ---------- szerviz: javítási árbecslő ---------- */
  var svc = { type: 'laptop', age: 6, picked: { battery: true, cooling: true } };
  var svcSummary = null;

  function typeLabel(id) { return labelOf(CALC_TYPES, id); }

  function buildSvcTypes() {
    $('#svcTypes').innerHTML = CALC_TYPES.map(function (t) {
      return '<button class="chip" type="button" data-svctype="' + t.id + '" aria-pressed="' + (svc.type === t.id) + '">' + esc(t.label) + '</button>';
    }).join('');
  }
  function buildSvcList() {
    var list = SERVICES[svc.type] || [];
    $('#svcList').innerHTML = list.map(function (s) {
      return '<label class="svc-row"><input type="checkbox" value="' + s.id + '"' + (svc.picked[s.id] ? ' checked' : '') + '>' +
        '<span class="box" aria-hidden="true"></span><span class="svc-name">' + esc(s.label) + '</span>' +
        '<span class="svc-meta">' + num(s.from) + ' – ' + num(s.to) + ' Ft · ' + s.days + ' nap</span></label>';
    }).join('');
  }

  function updateSvc() {
    var ageEl = $('#svcAge'), retro = svc.type === 'retro';
    ageEl.min = retro ? RETRO_MIN_AGE : 0;
    if (svc.age < +ageEl.min) svc.age = +ageEl.min;
    ageEl.value = svc.age;
    $('#svcAgeOut').textContent = svc.age + ' év';
    $('#svcAgeHint').textContent = retro
      ? 'A retro gépek értéke a korral nő, ezért ritkán érdemes lemondani róluk.'
      : 'A kor csak arra kell, hogy megmondjuk, megéri-e javítani.';

    var list = SERVICES[svc.type] || [];
    var ids = list.filter(function (s) { return svc.picked[s.id]; }).map(function (s) { return s.id; });
    var value = estimate(svc.type, svc.age, 'good', []).mid;
    var q = repairQuote(list, ids, value);
    var pct = Math.round(q.ratio * 100);

    $('#svcCost').textContent = q.count ? num(q.low) + ' – ' + num(q.high) + '\u00a0Ft' : '–';
    $('#svcDays').textContent = q.count ? 'kb. ' + q.days + ' munkanap' : '–';
    $('#svcDiag').textContent = fmtFt(q.diag);

    var adv = {
      none: '<b>Nem tudod, mi a baj?</b>Hozd el, és kiderítjük. A diagnosztika ingyenes, ha nálunk javíttatod, egyébként ' + fmtFt(DIAG_FEE) + '.',
      good: '<b>Megéri javítani</b>A költség a gép felvásárlási értékének kb. ' + pct + '%-a (érték: ' + fmtFt(value) + ').',
      think: '<b>Érdemes mérlegelni</b>A javítás a gép felvásárlási értékének kb. ' + pct + '%-a (érték: ' + fmtFt(value) + '). Ha van másik géped, nézd meg a <a href="felvasarlas.html">beszámítást</a> is.',
      swap: '<b>Valószínűleg nem éri meg</b>A javítás kb. ' + pct + '%-a a gép felvásárlási értékének (érték: ' + fmtFt(value) + '). Kérj <a href="felvasarlas.html">beszámítási ajánlatot</a>, vagy add el alkatrésznek.'
    };
    $('#svcAdvice').innerHTML = adv[q.level];
    $('#svcNote').textContent = 'Az ár alkatrésszel és munkadíjjal együtt értendő' + (q.discount ? ', a több tétel miatti 10% kedvezménnyel.' : '.') + ' A pontos összeget diagnosztika után mondjuk meg, javítani csak a jóváhagyásod után kezdünk.';

    svcSummary = {
      device: typeLabel(svc.type) + ', ' + svc.age + ' éves',
      issues: list.filter(function (s) { return svc.picked[s.id]; }).map(function (s) { return s.label; }),
      estimate: q.count ? num(q.low) + ' – ' + num(q.high) + ' Ft, átfutás kb. ' + q.days + ' munkanap' : ''
    };
    renderAttach();
  }

  function renderAttach() {
    var s = svcSummary, el = $('#svcAttach');
    if (!s || !el) return;
    el.innerHTML = '<span class="att-k">Magunktól hozzáfűzzük</span>' +
      '<span class="att-row"><b>Gép</b><span>' + esc(s.device) + '</span></span>' +
      '<span class="att-row"><b>Kijelölt hibák</b><span>' + (s.issues.length ? esc(s.issues.join('; ')) : 'nincs kijelölve, csak a leírásod megy el') + '</span></span>' +
      (s.estimate ? '<span class="att-row"><b>Becslés</b><span>' + esc(s.estimate) + '</span></span>' : '');
  }

  $('#svcForm').addEventListener('submit', function (e) { e.preventDefault(); });
  $('#svcTypes').addEventListener('click', function (e) {
    var b = e.target.closest('[data-svctype]');
    if (!b) return;
    svc.type = b.getAttribute('data-svctype');
    svc.picked = {};
    $$('[data-svctype]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    buildSvcList(); updateSvc();
  });
  $('#svcList').addEventListener('change', function (e) {
    var i = e.target.closest('input[type="checkbox"]');
    if (!i) return;
    svc.picked[i.value] = i.checked;
    updateSvc();
  });
  $('#svcAge').addEventListener('input', function (e) { svc.age = +e.target.value; updateSvc(); });
  $('#svcAsk').addEventListener('click', function () {
    $('#svcReq').scrollIntoView();
    $('#svcDesc').focus({ preventScroll: true });
  });

  /* ---------- szerviz: részletes kérés és levél ---------- */
  var SVC_FIELDS = { desc: ['#svcDesc', '#svcDescErr'], name: ['#svcName', '#svcNameErr'], email: ['#svcMail', '#svcMailErr'] };
  var mailText = '';

  function readReq() {
    return { desc: $('#svcDesc').value, name: $('#svcName').value, email: $('#svcMail').value, phone: $('#svcPhone').value };
  }
  function showReqErrors(errs, focusFirst) {
    var first = true;
    Object.keys(SVC_FIELDS).forEach(function (k) {
      var el = $(SVC_FIELDS[k][0]), msg = $(SVC_FIELDS[k][1]);
      if (errs[k]) {
        el.setAttribute('aria-invalid', 'true');
        msg.textContent = errs[k];
        if (focusFirst && first) el.focus();
        first = false;
      } else {
        el.removeAttribute('aria-invalid');
        msg.textContent = '';
      }
    });
  }
  function openMail(url) {
    try {
      var a = document.createElement('a');
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
      a.style.display = 'none';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (e) { /* marad a másolható változat */ }
  }

  $('#svcReq').addEventListener('input', function () {
    var errs = validateRepair(readReq());
    Object.keys(SVC_FIELDS).forEach(function (k) {
      var el = $(SVC_FIELDS[k][0]);
      if (el.getAttribute('aria-invalid') === 'true' && !errs[k]) {
        el.removeAttribute('aria-invalid');
        $(SVC_FIELDS[k][1]).textContent = '';
      }
    });
    $('#svcDescCount').textContent = $('#svcDesc').value.length + ' / 1500';
    $('#svcSent').hidden = true;
  });

  $('#svcReq').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = readReq();
    var errs = validateRepair(f);
    showReqErrors(errs, true);
    if (Object.keys(errs).length) { $('#svcSent').hidden = true; return; }
    var m = buildRepairMail({ name: f.name, email: f.email, phone: f.phone, desc: f.desc, device: svcSummary.device, issues: svcSummary.issues, estimate: svcSummary.estimate });
    mailText = m.body;
    $('#svcSentBody').textContent = m.body;
    $('#svcOpenMail').href = m.mailto;
    $('#svcTrunc').hidden = !m.truncated;
    $('#svcSent').hidden = false;
    openMail(m.mailto);
    $('#svcSent').scrollIntoView({ block: 'nearest' });
  });
  $('#svcCopyMail').addEventListener('click', function () { copyText(mailText, 'Levél kimásolva'); });
  $('#svcCopyAddr').addEventListener('click', function () { copyText(REPAIR_MAIL_TO, 'Cím kimásolva'); });

  /* ---------- szerviz: állapotkövető ---------- */
  function renderTicket(code) {
    if (window.REBOOT && REBOOT.api) { REBOOT.ticket(code).then(function (t) { showTicket(t, true); }); return; }
    showTicket(ticketLookup(code, TICKETS), false);
  }
  function showTicket(t, live) {
    var input = $('#tkCode'), err = $('#tkErr');
    if (!t) {
      input.setAttribute('aria-invalid', 'true');
      err.textContent = (live ? 'Ilyen kódot nem találunk. Nézd meg az átvételi lapot, vagy hívj minket.' : 'Ilyen kódot nem találunk. Nézd meg az átvételi lapot, vagy próbáld a példakódok egyikét.');
      return;
    }
    input.removeAttribute('aria-invalid');
    err.textContent = '';
    $$('[data-tk]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-tk') === t.id)); });
    var stages = STAGES.map(function (s, i) {
      var cls = i < t.stage ? 'done' : (i === t.stage ? 'cur' : '');
      return '<li' + (cls ? ' class="' + cls + '"' : '') + (i === t.stage ? ' aria-current="step"' : '') + '>' + esc(s) + '</li>';
    }).join('');
    var log = t.log.map(function (r) { return '<li><time>' + esc(r[0]) + '</time><span>' + esc(r[1]) + '</span></li>'; }).join('');
    $('#tkOut').innerHTML =
      '<div class="tk-top"><h4>' + esc(t.device) + '</h4><span class="tk-code">' + esc(t.id) + (live ? '' : '<span class="tk-example">példa</span>') + '</span></div>' +
      '<ol class="stages" aria-label="A javítás állapota">' + stages + '</ol>' +
      '<dl class="tk-dl"><div><dt>Hiba</dt><dd>' + esc(t.issue) + '</dd></div><div><dt>Jelenlegi állapot</dt><dd>' + esc(STAGES[t.stage]) + '</dd></div>' +
      '<div><dt>Árajánlat</dt><dd>' + esc(t.quote) + '</dd></div><div><dt>Várható</dt><dd>' + esc(t.eta) + '</dd></div></dl>' +
      '<ul class="tk-log">' + log + '</ul>';
  }
  $('#tkChips').innerHTML = (window.REBOOT && REBOOT.api ? [] : Object.keys(TICKETS)).map(function (k) {
    return '<button class="chip" type="button" data-tk="' + k + '" aria-pressed="false">' + k + '</button>';
  }).join('');
  $('#tkChips').addEventListener('click', function (e) {
    var b = e.target.closest('[data-tk]');
    if (!b) return;
    $('#tkCode').value = b.getAttribute('data-tk');
    renderTicket(b.getAttribute('data-tk'));
  });
  $('#tkForm').addEventListener('submit', function (e) { e.preventDefault(); renderTicket($('#tkCode').value); });

  /* ---------- GYIK ---------- */
  $('#faq').innerHTML = FAQ.map(function (q, i) {
    return '<details' + (i === 0 ? ' open' : '') + '><summary>' + esc(q[0]) + '</summary><p class="ans">' + esc(q[1]) + '</p></details>';
  }).join('');

  /* ---------- nyitvatartás ---------- */
  function renderHours() {
    var now = budapestNow();
    $('#hours tbody').innerHTML = DAYS.map(function (d, i) {
      var h = HOURS[i];
      return '<tr' + (i === now.day ? ' class="today"' : '') + '><th scope="row">' + d + '</th><td>' + (h ? pad2(h[0]) + ':00 – ' + pad2(h[1]) + ':00' : 'zárva') + '</td></tr>';
    }).join('');
    var s = shopStatus(now.day, now.minutes);
    var el = $('#status');
    el.textContent = s.text;
    el.className = 'status ' + (s.open ? 'open' : 'closed');
  }
  try { renderHours(); } catch (e) { /* ez az elem nincs ezen az oldalon */ }
  setInterval(renderHours, 60000);

  /* ---------- kapcsolati űrlap ---------- */
  var composedMsg = '';
  $('#contactForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    var name = $('#cName'), mail = $('#cMail'), msg = $('#cMsg');
    function check(el, errEl, valid, text) {
      if (valid) { el.removeAttribute('aria-invalid'); errEl.textContent = ''; return; }
      el.setAttribute('aria-invalid', 'true');
      errEl.textContent = text;
      if (ok) el.focus();
      ok = false;
    }
    check(name, $('#eName'), name.value.trim().length >= 2, 'Add meg a neved.');
    check(mail, $('#eMail'), /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim()), 'Adj meg egy érvényes e-mail-címet.');
    check(msg, $('#eMsg'), msg.value.trim().length >= 5, 'Írj néhány szót az üzenetbe.');
    if (!ok) return;
    composedMsg = 'Tárgy: ' + $('#cTopic').value + '\nNév: ' + name.value.trim() + '\nE-mail: ' + mail.value.trim() + '\n\n' + msg.value.trim();
    $('#composedText').textContent = composedMsg;
    $('#composed').hidden = false;
    $('#composed').scrollIntoView({ block: 'nearest' });
  });
  $('#copyMsg').addEventListener('click', function () { copyText(composedMsg, 'Üzenet kimásolva'); });

  /* ---------- téma ---------- */
  var savedTheme = store.get('reboot-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') root.setAttribute('data-theme', savedTheme);
  var darkMQ = window.matchMedia('(prefers-color-scheme: dark)');
  function isDark() {
    var t = root.getAttribute('data-theme');
    return t ? t === 'dark' : darkMQ.matches;
  }
  var SUN = '<circle cx="12" cy="12" r="5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>';
  var MOON = '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>';
  function syncThemeBtn() { $('#themeBtn svg').innerHTML = isDark() ? SUN : MOON; }
  $('#themeBtn').addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    store.set('reboot-theme', next);
    syncThemeBtn(); drawTraces();
  });
  if (darkMQ.addEventListener) darkMQ.addEventListener('change', function () { syncThemeBtn(); drawTraces(); });

  /* ---------- áramköri nyomvonalak ---------- */
  var cv = $('#traces');
  var ctx = cv.getContext('2d');
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function drawTraces() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = window.innerWidth, H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var cs = getComputedStyle(root);
    var color = cs.getPropertyValue('--trace').trim() || '#9C7648';
    var paper = cs.getPropertyValue('--paper').trim() || '#ECE5D4';
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.lineCap = 'square';
    var band = Math.max(18, Math.min(260, (W - 1160) / 2 + 36));
    var S = 11;

    function pad(x, y, r) {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = paper; ctx.fill();
      ctx.stroke();
    }
    function chip(cx, cy, w, h) {
      ctx.fillStyle = paper; ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
      ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
      for (var i = 0; i < 5; i++) {
        var py = cy - h / 2 + 7 + i * ((h - 14) / 4);
        ctx.beginPath();
        ctx.moveTo(cx - w / 2 - 6, py); ctx.lineTo(cx - w / 2, py);
        ctx.moveTo(cx + w / 2, py); ctx.lineTo(cx + w / 2 + 6, py);
        ctx.stroke();
      }
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(cx - w / 2 + 6, cy - h / 2 + 6, 2, 0, Math.PI * 2); ctx.fill();
    }
    function db9(cx, cy) {
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy - 9); ctx.lineTo(cx + 20, cy - 9); ctx.lineTo(cx + 15, cy + 9); ctx.lineTo(cx - 15, cy + 9); ctx.closePath();
      ctx.fillStyle = paper; ctx.fill(); ctx.stroke();
      ctx.fillStyle = color;
      for (var i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(cx - 12 + i * 6, cy - 3, 1.4, 0, Math.PI * 2); ctx.fill(); }
      for (var j = 0; j < 4; j++) { ctx.beginPath(); ctx.arc(cx - 9 + j * 6, cy + 3.5, 1.4, 0, Math.PI * 2); ctx.fill(); }
    }

    function side(dir, seed) {
      var r = rng(seed);
      var x0 = dir > 0 ? 0 : W;
      var n = Math.max(2, Math.floor(band / S));
      var pads = [];
      ctx.fillStyle = color;
      for (var k = 0; k < n; k++) {
        var x = x0 + dir * (k * S + 6);
        var y = -10;
        ctx.beginPath(); ctx.moveTo(x, y);
        while (y < H + 10) {
          y += 40 + r() * 140;
          ctx.lineTo(x, y);
          if (r() < 0.42) {
            var nx = x + dir * (r() < 0.5 ? -S : S);
            var dist = Math.abs(nx - x0);
            if (dist > 2 && dist < band) { x = nx; y += S; ctx.lineTo(x, y); }
          }
          if (r() < 0.1) {
            pads.push([x, y]);
            y += 30 + r() * 80;
            ctx.moveTo(x, y);
          }
        }
        ctx.stroke();
      }
      pads.forEach(function (p) { pad(p[0], p[1], 3.5); });

      for (var b = 0; b < 8; b++) {
        var by = r() * H;
        var bx = x0 + dir * (Math.floor(r() * n) * S + 6);
        var len = band * (0.3 + 0.6 * r());
        var ex = x0 + dir * Math.min(band, Math.abs(bx - x0) + len);
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex - dir * 6, by); ctx.lineTo(ex, by + 6); ctx.stroke();
        pad(ex, by + 6, 3.5);
      }
      if (band >= 90) {
        chip(x0 + dir * (band - 38), H * (0.28 + r() * 0.12), 28, 44);
        chip(x0 + dir * (band - 38), H * (0.72 + r() * 0.1), 24, 38);
        db9(x0 + dir * (band - 44), H * (0.52 + r() * 0.1));
      }
    }
    side(1, 11);
    side(-1, 29);
  }
  var resizeTimer;
  window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(drawTraces, 150); });

  /* ---------- indulás ---------- */
  try { renderChips(); } catch (e) { /* ez az elem nincs ezen az oldalon */ }
  try { renderCatalog(); } catch (e) { /* ez az elem nincs ezen az oldalon */ }
  try { renderPartChips(); } catch (e) { /* ez az elem nincs ezen az oldalon */ }
  try { renderParts(); } catch (e) { /* ez az elem nincs ezen az oldalon */ }
  try { buildSvcTypes(); } catch (e) { /* ez az elem nincs ezen az oldalon */ }
  try { buildSvcList(); } catch (e) { /* ez az elem nincs ezen az oldalon */ }
  try { updateSvc(); } catch (e) { /* ez az elem nincs ezen az oldalon */ }
  renderTicket('RB-2041');
  try { renderCart(); } catch (e) { /* ez az elem nincs ezen az oldalon */ }
  $('#doorShop').textContent = PRODUCTS.length;
  $('#doorParts').textContent = PARTS.length;
  try { syncThemeBtn(); } catch (e) { /* ez az elem nincs ezen az oldalon */ }
  try { drawTraces(); } catch (e) { /* ez az elem nincs ezen az oldalon */ }
})();
