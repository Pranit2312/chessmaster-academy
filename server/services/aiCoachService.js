const axios = require('axios');
const { Chess } = require('chess.js');
const OpeningLibrary = require('../models/OpeningLibrary');

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';
const AI_MODEL = process.env.AI_COACH_MODEL || 'mistralai/mistral-7b-instruct';
const AI_API_KEY = process.env.AI_COACH_API_KEY || '';

const FALLBACK_KNOWLEDGE = {
  ratingRanges: { beginner: 'Under 1000', intermediate: '1000-1500', advanced: '1500-2000', expert: '2000+' },
  phases: {
    opening: 'The opening (first 10-15 moves) focuses on developing pieces, controlling the center, and king safety.',
    middlegame: 'The middlegame involves tactical battles, positional maneuvering, and planning.',
    endgame: 'The endgame requires precise calculation and knowledge of key principles like opposition and pawn promotion.'
  },
  tips: {
    opening: ['Control the center with pawns and pieces', 'Develop knights before bishops', 'Castle early for king safety', 'Don\'t move the same piece twice', 'Connect rooks after castling', 'Don\'t bring queen out too early', 'Aim for a strong pawn structure'],
    tactics: ['Look for checks, captures, and threats', 'Practice pins, forks, and skewers', 'Count attackers and defenders before trading', 'Look for double attacks', 'Consider sacrifices for initiative', 'Calculate 3 moves ahead', 'Always ask: what did my opponent just do?'],
    endgame: ['Active king is powerful in endgames', 'Push passed pawns', 'Use opposition in king-pawn endgames', 'Rooks belong behind passed pawns', 'Learn Lucena and Philidor positions', '50-move rule and zugzwang are key concepts']
  },
  openingRecs: {
    beginner: { white: 'Italian Game or London System', black: 'Caro-Kann Defense or Scandinavian Defense' },
    intermediate: { white: 'Queen\'s Gambit or Ruy Lopez', black: 'Sicilian Defense or French Defense' },
    advanced: { white: 'Catalan or English Opening', black: 'King\'s Indian Defense or Nimzo-Indian' },
    expert: { white: 'Ruy Lopez Berlin or QGD Exchange', black: 'Grünfeld Defense or Bogo-Indian' }
  }
};

async function getLLMResponse(messages, userContext) {
  if (!AI_API_KEY) return null;

  try {
    const systemPrompt = `You are a world-class chess coach teaching ${userContext.name || 'a student'} (rating: ${userContext.rating || 'unknown'}, level: ${userContext.skillLevel || 'unknown'}, role: ${userContext.role || 'student'}). Provide concise, accurate chess advice. Cover openings, tactics, strategy, endgames, and game analysis. Respond in 2-4 short paragraphs.`;

    const { data } = await axios.post(OPENROUTER_API, {
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-10)
      ],
      max_tokens: 500,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chesscoaching.app'
      },
      timeout: 15000
    });

    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.warn('LLM coach response failed:', err.message);
    return null;
  }
}

async function analyzePosition(query) {
  const fenRegex = /((?:[rnbqkbnrR NBQKBNRPp1-8]+\/){7}[rnbqkbnrR NBQKBNRPp1-8]+\s[wb]\s[KQkq-]+\s[a-h1-8-]+\s\d+\s\d+)/;
  const match = query.match(fenRegex);
  if (!match) return null;

  const fen = match[1].trim();
  try {
    new Chess(fen);
    const { analyzeFen } = require('./stockfishEngine');
    const result = await analyzeFen(fen, 18);
    if (!result) return null;

    const chess = new Chess(fen);
    const turn = chess.turn() === 'w' ? 'White' : 'Black';
    let analysis = `Stockfish analysis of this position (depth ${result.depth}):\n\n`;
    analysis += `• ${turn} to move\n`;
    if (result.isMate) {
      analysis += `• Checkmate in ${result.mateIn} moves for ${result.mateIn > 0 ? turn : (turn === 'White' ? 'Black' : 'White')}\n`;
    } else {
      const evalStr = result.evalCp > 0 ? `+${(result.evalCp / 100).toFixed(2)}` : (result.evalCp / 100).toFixed(2);
      analysis += `• Evaluation: ${evalStr} (${result.evalCp > 150 ? 'White is winning' : result.evalCp > 50 ? 'White is better' : result.evalCp > -50 ? 'Equal position' : result.evalCp > -150 ? 'Black is better' : 'Black is winning'})\n`;
    }
    analysis += `• Best move: ${result.bestMoveSan || result.bestMoveUci || 'N/A'}\n`;
    if (result.pv && result.pv.length > 0) {
      analysis += `• Main line: ${result.pv.slice(0, 8).join(' ')}\n`;
    }
    return analysis;
  } catch { return null; }
}

async function getOpeningContext(query) {
  const lower = query.toLowerCase();
  const openingKeywords = ['italian', 'sicilian', 'caro', 'ruy lopez', 'queen\'s gambit', 'london',
    'french', 'king\'s indian', 'pirc', 'english', 'opening', 'defense', 'gambit'];
  const hasOpening = openingKeywords.some(k => lower.includes(k));

  if (!hasOpening) return null;

  const openings = await OpeningLibrary.find({}, 'name ecoCode description strategicIdeas tags').limit(10).lean();
  return openings.length > 0 ? openings : null;
}

async function generateCoachResponse(userMessage, history, userContext) {
  const messages = history.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content
  }));
  messages.push({ role: 'user', content: userMessage });

  const llmResponse = await getLLMResponse(messages, userContext);
  if (llmResponse) return llmResponse;

  const positionAnalysis = await analyzePosition(userMessage);
  if (positionAnalysis) return positionAnalysis + '\n\nWould you like me to explain the ideas behind this evaluation or suggest a plan?';

  return buildFallbackResponse(userMessage, userContext);
}

function buildFallbackResponse(message, userContext) {
  const lower = message.toLowerCase().trim();
  const name = userContext?.name || '';
  const rating = userContext?.rating || 'unknown';
  const level = (userContext?.skillLevel || 'beginner').toLowerCase();

  let response = '';

  if (lower.includes('hello') || lower.includes('hi ') || lower === 'hi' || lower === 'hey' || lower.includes('namaste')) {
    response = `Hello${name ? ' ' + name : ''}! I'm your AI Chess Coach. I can help with openings, tactics, endgames, game analysis, and improvement plans. What would you like to work on today?`;
  }
  else if (lower.includes('opening') && (lower.includes('recommend') || lower.includes('suggest') || lower.includes('play') || lower.includes('what should'))) {
    const recs = FALLBACK_KNOWLEDGE.openingRecs[level] || FALLBACK_KNOWLEDGE.openingRecs.beginner;
    response = `For a ${level} player (rating ${rating}), I recommend:\n\nAs White: ${recs.white}\nAs Black: ${recs.black}\n\nWould you like me to explain the main ideas of any of these openings?`;
  }
  else if (lower.includes('opening') && (lower.includes('principle') || lower.includes('tip') || lower.includes('rule'))) {
    const tips = FALLBACK_KNOWLEDGE.tips.opening;
    response = `Key opening principles:\n${tips.map((t, i) => `${i+1}. ${t}`).join('\n')}\n\nFocus on 1-2 principles per game until they become automatic.`;
  }
  else if (lower.includes('opening') || lower.includes('opening')) {
    response = `In the opening phase, your main goals are:\n• Control the center (e4, d4, e5, d5 squares)\n• Develop all minor pieces quickly\n• Castle for king safety\n• Connect your rooks\n\nWould you like specific opening recommendations or tips on a particular opening?`;
  }
  else if (lower.includes('tactic') || lower.includes('puzzle') || lower.includes('fork') || lower.includes('pin') || lower.includes('skewer')) {
    const tips = FALLBACK_KNOWLEDGE.tips.tactics;
    response = `Tactical training is crucial for improvement. Key concepts:\n${tips.map((t, i) => `${i+1}. ${t}`).join('\n')}\n\nI recommend solving 10-15 puzzles daily. Visit the Puzzles page to practice tactics organized by theme and difficulty.`;
  }
  else if (lower.includes('endgame') || lower.includes('ending')) {
    const tips = FALLBACK_KNOWLEDGE.tips.endgame;
    response = `Endgame fundamentals:\n${tips.map((t, i) => `${i+1}. ${t}`).join('\n')}\n\nPractice endgames in AI Practice mode starting from specific endgame positions.`;
  }
  else if (lower.includes('improve') || lower.includes('get better') || lower.includes('progress') || lower.includes('train') || lower.includes('study')) {
    response = `For a ${level} player, here's a structured improvement plan:\n1. Solve puzzles daily (15-20 min)\n2. Analyze your games (use the Analysis page)\n3. Study 2-3 openings deeply\n4. Practice against AI at slightly above your level\n5. Take structured courses on weakness areas\n\nConsistency matters more than duration. 30-60 min daily beats 4 hours once a week.`;
  }
  else if (lower.includes('analyze') || lower.includes('review my game') || lower.includes('pgn')) {
    response = `To analyze a game:\n1. Go to the Analysis page\n2. Paste your PGN or play through the moves\n3. Our Stockfish engine will find mistakes, blunders, and inaccuracies\n4. Get a phase-by-phase breakdown (opening/middlegame/endgame)\n\nWhat aspect of analysis would you like help with?`;
  }
  else if (lower.includes('rating') || lower.includes('elo') || lower.includes('rank')) {
    response = `Rating ranges: Beginner (under 1000), Intermediate (1000-1500), Advanced (1500-2000), Expert (2000+). Your current level appears to be ${level} (${rating}). To improve your rating, focus on: eliminating blunders, consistent opening repertoire, and endgame fundamentals.`;
  }
  else if (lower.includes('mistake') || lower.includes('blunder') || lower.includes('error')) {
    response = `Common mistakes by ${level} players:\n1. Hanging pieces (not seeing opponent's threats)\n2. Poor pawn structure (doubled/isloated pawns)\n3. Neglecting king safety (castling too late)\n4. Inconsistent opening play\n\nTip: After each opponent move, ask yourself "what is my opponent threatening?"`;
  }
  else if (lower.includes('thank')) {
    response = `You're welcome${name ? ' ' + name : ''}! Keep practicing and analyzing. If you have more questions, I'm here to help.`;
  }
  else if (lower.includes('help') || lower.includes('what can you do') || lower.includes('command')) {
    response = `I can help with:\n• Opening recommendations and principles\n• Tactical training advice\n• Endgame strategies\n• Game analysis guidance\n• Personalized improvement plans\n• Chess rules and concepts\n\nJust ask! Example: "Recommend an opening for me" or "How do I improve?"`;
  }
  else {
    response = `Great question! Based on your level (${level}, rating ${rating}), I suggest focusing on:\n1. Tactical awareness — practice puzzles daily\n2. Opening fundamentals — develop pieces and castle\n3. Endgame basics — learn king and pawn endings\n\nCould you tell me more about what specific area you'd like help with? I can cover openings, tactics, endgames, game analysis, or improvement planning.`;
  }

  return response;
}

module.exports = { generateCoachResponse, getOpeningContext };
