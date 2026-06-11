const K_FACTOR = 32;

function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function getCategory(initialMinutes) {
  if (initialMinutes < 3) return 'bullet';
  if (initialMinutes <= 8) return 'blitz';
  if (initialMinutes <= 30) return 'rapid';
  return 'classical';
}

function calculateNewRating(ratingA, ratingB, scoreA) {
  const expected = expectedScore(ratingA, ratingB);
  const newRating = Math.round(ratingA + K_FACTOR * (scoreA - expected));
  return newRating;
}

function getScore(result, color) {
  if (result === '1-0') return color === 'white' ? 1 : 0;
  if (result === '0-1') return color === 'black' ? 1 : 0;
  if (result === '0.5-0.5') return 0.5;
  return 0.5;
}

module.exports = { calculateNewRating, getCategory, getScore, expectedScore };
