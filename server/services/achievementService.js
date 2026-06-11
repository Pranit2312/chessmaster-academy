const Achievement = require('../models/Achievement');
const { createNotification } = require('../controllers/notificationController');

const ACHIEVEMENT_DEFS = {
  first_booking: { title: 'First Session', description: 'Booked your first coaching session', icon: '📅' },
  first_course: { title: 'First Course', description: 'Enrolled in your first course', icon: '📚' },
  first_tournament: { title: 'First Tournament', description: 'Joined your first tournament', icon: '🏆' },
  tournament_winner: { title: 'Tournament Winner', description: 'Won a tournament', icon: '👑' },
  puzzle_master: { title: 'Puzzle Master', description: 'Solved 100 puzzles correctly', icon: '🧩' },
  coach_favorite: { title: 'Coach Favorite', description: 'Completed 10 sessions with the same coach', icon: '⭐' },
  streak_7: { title: '7-Day Streak', description: 'Used the platform for 7 consecutive days', icon: '🔥' },
  streak_30: { title: '30-Day Streak', description: 'Used the platform for 30 consecutive days', icon: '💪' },
  sessions_100: { title: 'Century', description: 'Completed 100 sessions', icon: '🎯' },
  puzzle_1000: { title: 'Puzzle Grandmaster', description: 'Solved 1000 puzzles correctly', icon: '🧠' }
};

async function checkAndAward(userId, eventType) {
  try {
    const def = ACHIEVEMENT_DEFS[eventType];
    if (!def) return null;
    const existing = await Achievement.findOne({ user: userId, type: eventType });
    if (existing) return existing;
    const achievement = await Achievement.create({
      user: userId,
      type: eventType,
      title: def.title,
      description: def.description,
      icon: def.icon
    });
    await createNotification(userId, 'achievement_unlocked', `Achievement: ${def.title}`, def.description, { achievementId: achievement._id });
    return achievement;
  } catch (e) {
    console.error('Achievement error:', e.message);
    return null;
  }
}

module.exports = { checkAndAward, ACHIEVEMENT_DEFS };
