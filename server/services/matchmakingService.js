const logger = require('../utils/logger');

const RATING_RANGE = 200;
const RATING_RANGE_MAX = 800;
const RANGE_INCREMENT = 50;

const TIME_CONTROLS = {
  bullet: [
    { initial: 1, increment: 0, label: '1+0' },
    { initial: 2, increment: 1, label: '2+1' },
    { initial: 3, increment: 0, label: '3+0' }
  ],
  blitz: [
    { initial: 3, increment: 2, label: '3+2' },
    { initial: 5, increment: 0, label: '5+0' },
    { initial: 5, increment: 3, label: '5+3' }
  ],
  rapid: [
    { initial: 10, increment: 0, label: '10+0' },
    { initial: 10, increment: 5, label: '10+5' },
    { initial: 15, increment: 10, label: '15+10' }
  ],
  classical: [
    { initial: 30, increment: 0, label: '30+0' },
    { initial: 45, increment: 15, label: '45+15' }
  ]
};

class MatchmakingService {
  constructor() {
    this.queues = {
      bullet: [],
      blitz: [],
      rapid: [],
      classical: []
    };
    this.checkInterval = null;
  }

  getTimeControls(category) {
    return TIME_CONTROLS[category] || TIME_CONTROLS.blitz;
  }

  start() {
    this.checkInterval = setInterval(() => this.processQueues(), 2000);
    this.checkInterval.unref();
    logger.info('Matchmaking service started');
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  joinQueue(userId, username, rating, category, ratingRange, timeControlLabel) {
    const queue = this.queues[category];
    if (!queue) return { error: 'Invalid category' };

    if (queue.find(u => u.userId === userId)) return { error: 'Already in queue' };

    // Normalize time control: if no label specified, use category default
    let tc;
    if (timeControlLabel) {
      tc = TIME_CONTROLS[category]?.find(t => t.label === timeControlLabel);
    }
    if (!tc) {
      tc = TIME_CONTROLS[category]?.[0] || { initial: 5, increment: 3, label: '5+3' };
    }

    queue.push({
      userId,
      username,
      rating,
      ratingRange: ratingRange || RATING_RANGE,
      joinedAt: Date.now(),
      timeControl: { initial: tc.initial, increment: tc.increment },
      timeControlLabel: tc.label
    });

    return { success: true, position: queue.length };
  }

  leaveQueue(userId, category) {
    if (category) {
      this.queues[category] = this.queues[category].filter(u => u.userId !== userId);
    } else {
      Object.keys(this.queues).forEach(key => {
        this.queues[key] = this.queues[key].filter(u => u.userId !== userId);
      });
    }
  }

  isInQueue(userId) {
    for (const [category, queue] of Object.entries(this.queues)) {
      if (queue.find(u => u.userId === userId)) return { inQueue: true, category };
    }
    return { inQueue: false };
  }

  processQueues() {
    Object.keys(this.queues).forEach(category => {
      this.matchPlayers(category);
    });
  }

  matchPlayers(category) {
    const queue = this.queues[category];
    if (queue.length < 2) return;

    const now = Date.now();
    const matched = new Set();

    for (let i = 0; i < queue.length; i++) {
      if (matched.has(i)) continue;
      const playerA = queue[i];
      const waitTime = now - playerA.joinedAt;
      const dynamicRange = Math.min(
        playerA.ratingRange + Math.floor(waitTime / 5000) * RANGE_INCREMENT,
        RATING_RANGE_MAX
      );

      for (let j = i + 1; j < queue.length; j++) {
        if (matched.has(j)) continue;
        const playerB = queue[j];
        const ratingDiff = Math.abs(playerA.rating - playerB.rating);

        // Prefer matching exact same time control, but allow cross-variant within category
        const sameTC = playerA.timeControlLabel === playerB.timeControlLabel;
        const tcBonus = sameTC ? 0 : 100; // wider effective range for cross-variant

        if (ratingDiff <= dynamicRange + tcBonus) {
          matched.add(i);
          matched.add(j);
          // Use the first player's time control for the match
          this.createMatch(playerA, playerB, category);
          break;
        }
      }
    }

    this.queues[category] = queue.filter((_, i) => !matched.has(i));
  }

  createMatch(playerA, playerB, category) {
    const matchEvent = {
      players: [
        { userId: playerA.userId, username: playerA.username, rating: playerA.rating },
        { userId: playerB.userId, username: playerB.username, rating: playerB.rating }
      ],
      timeControl: playerA.timeControl,
      timeControlLabel: playerA.timeControlLabel,
      rated: true,
      category
    };
    if (this.onMatch) this.onMatch(matchEvent);
  }

  getQueueSize(category) {
    if (category) return this.queues[category]?.length || 0;
    const sizes = {};
    Object.keys(this.queues).forEach(key => { sizes[key] = this.queues[key].length; });
    return sizes;
  }

  getQueue(category) {
    return this.queues[category] || [];
  }
}

module.exports = new MatchmakingService();
