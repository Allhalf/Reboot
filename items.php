<?php
require __DIR__ . '/_db.php';

try {
    $rows = db()->query('SELECT id, kind, cat, name, year_made, spec, grade, price, stock, icon, images
                         FROM items WHERE active = 1 ORDER BY kind, sort_order, name')->fetchAll();
} catch (Throwable $e) {
    out(['ok' => false, 'error' => 'query'], 500);
}

$products = [];
$parts = [];
foreach ($rows as $r) {
    $item = [
        'id' => $r['id'], 'name' => $r['name'], 'cat' => $r['cat'], 'grade' => $r['grade'],
        'price' => (int)$r['price'], 'stock' => (int)$r['stock'], 'icon' => $r['icon'],
    ];
    $imgs = $r['images'] ? json_decode($r['images'], true) : null;
    if (is_array($imgs) && $imgs) $item['images'] = array_values($imgs);
    if ($r['kind'] === 'pc') $products[] = $item + ['year' => (int)$r['year_made'], 'spec' => $r['spec']];
    else                     $parts[]    = $item + ['compat' => $r['spec']];
}
out(['ok' => true, 'products' => $products, 'parts' => $parts]);
