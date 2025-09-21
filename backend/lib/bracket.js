// backend/lib/bracket.js
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function nextPowerOfTwo(n) {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

/**
 * Формирует пары первого раунда.
 * Возвращает массив пар [teamAId, teamBId|null]
 */
function generateFirstRoundPairs(teamIds) {
  const shuffled = shuffle(teamIds);
  const size = nextPowerOfTwo(shuffled.length);
  const byes = size - shuffled.length;

  // дополним массива null'ами (бы для bye)
  for (let i = 0; i < byes; i++) shuffled.push(null);

  const pairs = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    pairs.push([shuffled[i], shuffled[i + 1]]);
  }
  return pairs;
}

module.exports = { generateFirstRoundPairs, shuffle, nextPowerOfTwo };
