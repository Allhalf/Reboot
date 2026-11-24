<?php
require __DIR__ . '/_db.php';

$code = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string)($_GET['code'] ?? '')));
if ($code === '' || strlen($code) > 16) out(['ok' => false], 404);
usleep(250000); // kis késleltetés: lassítja a kódok találgatását

try {
    $st = db()->prepare("SELECT code, device, issue, stage, quote, eta FROM tickets WHERE REPLACE(code, '-', '') = ? LIMIT 1");
    $st->execute([$code]);
    $t = $st->fetch();
    if (!$t) out(['ok' => false], 404);
    $ev = db()->prepare('SELECT happened_at, note FROM ticket_events WHERE code = ? ORDER BY happened_at, id');
    $ev->execute([$t['code']]);
    $log = [];
    foreach ($ev->fetchAll() as $e) $log[] = [date('m.d. H:i', strtotime($e['happened_at'])), $e['note']];
} catch (Throwable $e) {
    out(['ok' => false, 'error' => 'query'], 500);
}

out(['ok' => true, 'ticket' => [
    'id' => $t['code'], 'device' => $t['device'], 'issue' => $t['issue'], 'stage' => (int)$t['stage'],
    'quote' => $t['quote'], 'eta' => $t['eta'], 'log' => $log,
]]);
