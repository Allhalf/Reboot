/* Bemutató adatok. Ha az adatbázis-API elérhető (api/items.php), a boot.js ezek helyére tölti a valódi adatokat. */
const CATS = [
  { id: 'all', label: 'Minden' },
  { id: 'pc', label: 'Számítógépek' },
  { id: 'retro', label: 'Retro és játék' },
  { id: 'periph', label: 'Perifériák' }
];

const PRODUCTS = [
  { id: 'thinkpad-t440', name: 'ThinkPad T440', cat: 'pc', year: 2014, spec: '14" · i5-4300U · 8 GB · 256 GB SSD', grade: 'B', price: 59900, stock: 3, icon: 'laptop' },
  { id: 'latitude-e6430', name: 'Dell Latitude E6430', cat: 'pc', year: 2012, spec: '14" · i5-3320M · 8 GB · 240 GB SSD', grade: 'C', price: 42900, stock: 2, icon: 'laptop' },
  { id: 'optiplex-7010', name: 'Dell OptiPlex 7010 SFF', cat: 'pc', year: 2013, spec: 'i5-3470 · 8 GB · 240 GB SSD', grade: 'A', price: 44900, stock: 5, icon: 'tower' },
  { id: 'elitedesk-mini', name: 'HP EliteDesk 800 G1 Mini', cat: 'pc', year: 2014, spec: 'i5-4590T · 8 GB · 128 GB SSD · 1,2 literes', grade: 'A', price: 49900, stock: 3, icon: 'tower' },
  { id: 'pentium3', name: 'Pentium III torony', cat: 'retro', year: 2000, spec: 'PIII 800 MHz · 256 MB · Windows 98 SE', grade: 'C', price: 49900, stock: 1, icon: 'tower' },
  { id: 'amiga500', name: 'Amiga 500', cat: 'retro', year: 1987, spec: '1 MB RAM · tápegység · egér · felújított', grade: 'B', price: 89900, stock: 1, icon: 'c64' },
  { id: 'c64c', name: 'Commodore 64C', cat: 'retro', year: 1986, spec: 'tápegységgel és TV-kábellel', grade: 'B', price: 74900, stock: 1, icon: 'c64' },
  { id: 'gbc', name: 'Game Boy Color', cat: 'retro', year: 1998, spec: 'kijelző és gombok tesztelve', grade: 'B', price: 32900, stock: 2, icon: 'gameboy' },
  { id: 'megadrive', name: 'Mega Drive + 2 kontroller', cat: 'retro', year: 1990, spec: 'tápegység, AV-kábel, 2 pad', grade: 'B', price: 39900, stock: 2, icon: 'console' },
  { id: 'ps2', name: 'PlayStation 2 Slim', cat: 'retro', year: 2004, spec: 'tápegység, AV-kábel, 1 kontroller', grade: 'B', price: 29900, stock: 3, icon: 'console' },
  { id: 'nokia3310', name: 'Nokia 3310', cat: 'retro', year: 2000, spec: 'új akkuval és töltővel', grade: 'B', price: 14900, stock: 4, icon: 'phone' },
  { id: 'crt17', name: '17" CRT monitor', cat: 'periph', year: 2003, spec: 'VGA · 1280×1024 · 85 Hz', grade: 'B', price: 19900, stock: 2, icon: 'crt' },
  { id: 'modelm', name: 'Model M billentyűzet', cat: 'periph', year: 1991, spec: 'buckling spring · PS/2 · USB átalakítóval', grade: 'A', price: 24900, stock: 2, icon: 'keyboard' }
];

const PART_CATS = [
  { id: 'all', label: 'Minden' },
  { id: 'cpu', label: 'Processzor' },
  { id: 'mobo', label: 'Alaplap' },
  { id: 'ram', label: 'Memória' },
  { id: 'gpu', label: 'Videókártya' },
  { id: 'store', label: 'Tárhely' },
  { id: 'power', label: 'Tápegység és töltő' },
  { id: 'cool', label: 'Hűtés' },
  { id: 'lap', label: 'Laptop-alkatrész' },
  { id: 'cable', label: 'Kábel és csatlakozó' },
  { id: 'retro', label: 'Retro alkatrész' }
];

const PARTS = [
  { id: 'i5-4590', name: 'Intel Core i5-4590', cat: 'cpu', compat: 'LGA1150 · 4 mag · 3,3 GHz', grade: 'B', price: 12900, stock: 4, icon: 'cpu' },
  { id: 'r5-2600', name: 'AMD Ryzen 5 2600', cat: 'cpu', compat: 'AM4 · 6 mag · hűtővel', grade: 'B', price: 19900, stock: 3, icon: 'cpu' },
  { id: 'q9550', name: 'Core 2 Quad Q9550', cat: 'cpu', compat: 'LGA775 · retro és régi irodai gépekhez', grade: 'B', price: 5900, stock: 2, icon: 'cpu' },
  { id: 'b85m', name: 'mATX alaplap, B85', cat: 'mobo', compat: 'LGA1150 · 2× DDR3 · SATA3', grade: 'B', price: 14900, stock: 3, icon: 'board' },
  { id: 'b350m', name: 'mATX alaplap, B350', cat: 'mobo', compat: 'AM4 · 2× DDR4 · M.2', grade: 'B', price: 17900, stock: 2, icon: 'board' },
  { id: 'p4-agp', name: 'Socket 478 alaplap', cat: 'mobo', compat: 'AGP · IDE · 2× DDR · retro gépekhez', grade: 'C', price: 8900, stock: 1, icon: 'board' },
  { id: 'ddr3', name: '8 GB DDR3 SO-DIMM', cat: 'ram', compat: 'laptopba · 1600 MHz · 4 menet tesztelve', grade: 'A', price: 6900, stock: 9, icon: 'ram' },
  { id: 'ddr4-16', name: '2×8 GB DDR4 DIMM', cat: 'ram', compat: 'asztali · 3200 MHz · tesztelve', grade: 'A', price: 17900, stock: 5, icon: 'ram' },
  { id: 'sdram', name: '2×128 MB SDRAM PC133', cat: 'ram', compat: 'retro asztali gépekhez', grade: 'B', price: 3900, stock: 6, icon: 'ram' },
  { id: 'gtx960', name: 'GeForce GTX 960 2 GB', cat: 'gpu', compat: 'PCIe 3.0 · 30 perces terhelésteszt', grade: 'B', price: 21900, stock: 2, icon: 'gpu' },
  { id: 'rx570', name: 'Radeon RX 570 4 GB', cat: 'gpu', compat: 'PCIe 3.0 · 8 tűs táp', grade: 'B', price: 24900, stock: 2, icon: 'gpu' },
  { id: 'agp6600', name: 'GeForce 6600 AGP', cat: 'gpu', compat: 'AGP 8× · Windows 98 és XP alá', grade: 'C', price: 9900, stock: 1, icon: 'gpu' },
  { id: 'ssd240', name: '240 GB SATA SSD', cat: 'store', compat: '2,5" · SMART tiszta', grade: 'A', price: 7900, stock: 8, icon: 'ssd' },
  { id: 'nvme500', name: '500 GB NVMe SSD', cat: 'store', compat: 'M.2 2280 · PCIe · SMART tiszta', grade: 'A', price: 11900, stock: 4, icon: 'ssd' },
  { id: 'hdd500', name: '500 GB 2,5" HDD', cat: 'store', compat: 'SATA · 7 mm · SMART tiszta', grade: 'B', price: 5900, stock: 6, icon: 'hdd' },
  { id: 'hdd1t', name: '1 TB 3,5" HDD', cat: 'store', compat: 'SATA · asztali · SMART tiszta', grade: 'B', price: 6900, stock: 5, icon: 'hdd' },
  { id: 'psu500', name: '500 W ATX tápegység', cat: 'power', compat: '80+ Bronze · terhelésteszten átment', grade: 'B', price: 11900, stock: 3, icon: 'psu' },
  { id: 'chg65', name: '65 W laptoptöltő', cat: 'power', compat: 'Lenovo laptopokhoz · szögletes csatlakozó', grade: 'A', price: 6900, stock: 6, icon: 'charger' },
  { id: 'chg90', name: '90 W laptoptöltő', cat: 'power', compat: 'Dell laptopokhoz · kerek csatlakozó', grade: 'A', price: 7900, stock: 4, icon: 'charger' },
  { id: 'cooler', name: 'Processzorhűtő', cat: 'cool', compat: 'LGA115x és LGA1200 · rézmagos', grade: 'B', price: 2900, stock: 6, icon: 'fan' },
  { id: 'fan120', name: '120 mm házventilátor', cat: 'cool', compat: '3 tűs · csendes', grade: 'A', price: 1900, stock: 10, icon: 'fan' },
  { id: 'paste', name: 'Hőpaszta, 4 g', cat: 'cool', compat: 'processzorhoz és videókártyához', grade: 'A', price: 1500, stock: 20, icon: 'fan' },
  { id: 'lcd14', name: '14" HD laptopkijelző', cat: 'lap', compat: '1366×768 · 40 tűs · ThinkPad T-sorozat', grade: 'A', price: 12900, stock: 3, icon: 'lcd' },
  { id: 'bat-t440', name: 'Akkumulátor ThinkPad T440 és T450', cat: 'lap', compat: 'új cellák · 6 hónap garancia', grade: 'A', price: 9900, stock: 4, icon: 'battery' },
  { id: 'kb-t', name: 'Laptop-billentyűzet, magyar kiosztás', cat: 'lap', compat: 'ThinkPad T-sorozat', grade: 'A', price: 8900, stock: 2, icon: 'keyboard' },
  { id: 'serial', name: 'Soros–USB átalakító', cat: 'cable', compat: 'DB9 · 1,8 m · Windows és Linux', grade: 'A', price: 3400, stock: 7, icon: 'cable' },
  { id: 'sata2', name: 'SATA-kábel, 2 db', cat: 'cable', compat: 'zárral · 50 cm', grade: 'A', price: 900, stock: 20, icon: 'cable' },
  { id: 'vga18', name: 'VGA-kábel, 1,8 m', cat: 'cable', compat: 'árnyékolt · ferritgyűrűs', grade: 'A', price: 1500, stock: 8, icon: 'cable' },
  { id: 'isa-snd', name: 'ISA hangkártya, 16 bites', cat: 'retro', compat: 'DOS és Windows 98 alatt', grade: 'C', price: 7900, stock: 2, icon: 'card' },
  { id: 'ide80', name: 'IDE szalagkábel, 80 eres', cat: 'retro', compat: '3 csatlakozó · 45 cm', grade: 'A', price: 1200, stock: 9, icon: 'ribbon' },
  { id: 'fdd', name: '3,5" floppy meghajtó', cat: 'retro', compat: '1,44 MB · tesztelt', grade: 'B', price: 5900, stock: 5, icon: 'floppy' },
  { id: 'floppy10', name: '3,5" floppy, 10 db', cat: 'retro', compat: 'formázott · olvasási teszten átment', grade: 'A', price: 3900, stock: 12, icon: 'floppy' },
  { id: 'c64psu', name: 'Commodore 64 tápegység', cat: 'retro', compat: 'felújított · új kondenzátorok', grade: 'B', price: 14900, stock: 2, icon: 'psu' }
];

/* szerviz: a típusazonosítók megegyeznek a beszámítás-kalkulátoréval */
/* példa-javítások a követő bemutatásához */
const TICKETS = {
  'RB-2041': {
    device: 'Lenovo ThinkPad T460', issue: 'Nem tölt, az akku gyorsan lemerül', stage: 3,
    quote: '24 900 Ft (akku és tisztítás)', eta: 'holnap 16:00-ig',
    log: [['11.07. 10:12', 'Beérkezett, átvételi lap kiállítva'], ['11.07. 14:40', 'Diagnosztika kész: akku 22 % kapacitás, a töltőport rendben'], ['11.08. 09:05', 'Árajánlatot elfogadta telefonon'], ['11.10. 08:30', 'Akkumulátor-csere folyamatban']]
  },
  'RB-2042': {
    device: 'Dell OptiPlex 3020', issue: 'Nem indul, bekapcsoláskor sípol', stage: 1,
    quote: 'diagnosztika után', eta: 'ma 18:00-ig árajánlat',
    log: [['11.10. 09:20', 'Beérkezett, átvételi lap kiállítva'], ['11.10. 11:05', 'Memóriateszt fut, az első modul hibás lehet']]
  },
  'RB-2043': {
    device: 'Commodore 64C', issue: 'Nincs kép, a tápegység melegszik', stage: 5,
    quote: '16 900 Ft (tápegység és kondenzátorok)', eta: 'átvehető nyitvatartási időben',
    log: [['11.03. 13:30', 'Beérkezett, átvételi lap kiállítva'], ['11.04. 10:00', 'Diagnosztika kész: a tápegység 5 V sínje ingadozik'], ['11.05. 15:20', 'Árajánlatot elfogadta e-mailben'], ['11.09. 12:10', 'Új kondenzátorok beforrasztva, 6 órás próba lefutott'], ['11.09. 16:45', 'Kész, átvehető']]
  }
};
