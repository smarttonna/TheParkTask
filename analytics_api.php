<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$storeFile = __DIR__ . '/analytics_store.json';

function loadStore(string $file): array {
  if (!is_file($file)) {
    return [
      'visits' => 0,
      'visitors' => [],
      'totalPlaySec' => 0,
      'attempts' => 0,
      'clears' => 0,
      'demos' => 0,
      'collisions' => 0,
      'scoreSum' => 0,
      'scoreCount' => 0,
      'stages' => [],
      'events' => []
    ];
  }
  $raw = @file_get_contents($file);
  $data = is_string($raw) ? json_decode($raw, true) : null;
  return is_array($data) ? $data : [
    'visits' => 0,
    'visitors' => [],
    'totalPlaySec' => 0,
    'attempts' => 0,
    'clears' => 0,
    'demos' => 0,
    'collisions' => 0,
    'scoreSum' => 0,
    'scoreCount' => 0,
    'stages' => [],
    'events' => []
  ];
}

$store = loadStore($storeFile);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $input = json_decode((string)file_get_contents('php://input'), true);
  if (is_array($input)) {
    $type = (string)($input['type'] ?? '');
    $vid = substr(preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($input['visitorId'] ?? 'anon')), 0, 36);
    if ($vid !== '' && !in_array($vid, $store['visitors'], true)) {
      $store['visitors'][] = $vid;
    }

    $stageId = substr(preg_replace('/[^0-9]/', '', (string)($input['stageId'] ?? '')), 0, 4);
    $stageName = substr(strip_tags((string)($input['stageName'] ?? '')), 0, 48);

    if ($stageId !== '' && !isset($store['stages'][$stageId])) {
      $store['stages'][$stageId] = [
        'id' => $stageId,
        'name' => $stageName,
        'attempts' => 0,
        'clears' => 0,
        'collisions' => 0,
        'bestTime' => null,
        'stars' => 0
      ];
    }

    if ($type === 'visit') {
      $store['visits'] = (int)$store['visits'] + 1;
    } elseif ($type === 'ping') {
      $sec = max(0, min(30, (int)($input['sec'] ?? 5)));
      $store['totalPlaySec'] = (int)$store['totalPlaySec'] + $sec;
    } elseif ($type === 'attempt' && $stageId !== '') {
      $store['attempts'] = (int)$store['attempts'] + 1;
      $store['stages'][$stageId]['attempts']++;
    } elseif ($type === 'demo') {
      $store['demos'] = (int)$store['demos'] + 1;
    } elseif ($type === 'collision' && $stageId !== '') {
      $store['collisions'] = (int)$store['collisions'] + 1;
      $store['stages'][$stageId]['collisions']++;
    } elseif ($type === 'clear' && $stageId !== '') {
      $store['clears'] = (int)$store['clears'] + 1;
      $score = max(0, min(100, (int)($input['score'] ?? 0)));
      $stars = max(1, min(3, (int)($input['stars'] ?? 1)));
      $timeSec = max(0.1, (float)($input['timeSec'] ?? 0));
      $store['scoreSum'] = (int)$store['scoreSum'] + $score;
      $store['scoreCount'] = (int)$store['scoreCount'] + 1;
      $st = &$store['stages'][$stageId];
      $st['clears']++;
      $st['stars'] = max((int)$st['stars'], $stars);
      $st['bestTime'] = $st['bestTime'] === null ? $timeSec : min((float)$st['bestTime'], $timeSec);
    }

    if (!empty($input['label'])) {
      array_unshift($store['events'], [
        'ts' => gmdate('Y-m-d H:i:s') . ' UTC',
        'label' => substr(strip_tags((string)$input['label']), 0, 120)
      ]);
      $store['events'] = array_slice($store['events'], 0, 40);
    }

    @file_put_contents($storeFile, json_encode($store, JSON_PRETTY_PRINT));
  }
}

echo json_encode([
  'visits' => (int)$store['visits'],
  'uniqueVisitors' => count($store['visitors']),
  'totalPlaySec' => (int)$store['totalPlaySec'],
  'attempts' => (int)$store['attempts'],
  'clears' => (int)$store['clears'],
  'demos' => (int)$store['demos'],
  'collisions' => (int)$store['collisions'],
  'avgScore' => $store['scoreCount'] > 0 ? round($store['scoreSum'] / $store['scoreCount']) : 0,
  'stages' => $store['stages'],
  'events' => $store['events']
]);
