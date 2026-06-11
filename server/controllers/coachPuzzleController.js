const CoachPuzzle = require('../models/CoachPuzzle');
const { Chess } = require('chess.js');

exports.createPuzzle = async (req, res) => {
  try {
    const { fen, solution, explanation, difficulty, theme, tags, courseLink, lessonLink } = req.body;

    if (!fen || !solution || solution.length === 0) {
      return res.status(400).json({ success: false, message: 'FEN and solution are required' });
    }

    try { new Chess(fen); } catch {
      return res.status(400).json({ success: false, message: 'Invalid FEN position' });
    }

    const puzzle = await CoachPuzzle.create({
      coach: req.user._id,
      fen,
      solution,
      explanation,
      difficulty: difficulty || 'medium',
      theme: theme || 'custom',
      tags: tags || [],
      courseLink: courseLink || undefined,
      lessonLink: lessonLink || undefined
    });

    res.status(201).json({ success: true, puzzle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyPuzzles = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const puzzles = await CoachPuzzle.find({ coach: req.user._id, isActive: true })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await CoachPuzzle.countDocuments({ coach: req.user._id, isActive: true });

    res.json({ success: true, puzzles, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPuzzle = async (req, res) => {
  try {
    const puzzle = await CoachPuzzle.findOne({ _id: req.params.id, isActive: true })
      .populate('coach', 'name')
      .lean();

    if (!puzzle) return res.status(404).json({ success: false, message: 'Puzzle not found' });

    res.json({ success: true, puzzle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePuzzle = async (req, res) => {
  try {
    const { fen, solution, explanation, difficulty, theme, tags } = req.body;
    const puzzle = await CoachPuzzle.findOne({ _id: req.params.id, coach: req.user._id });

    if (!puzzle) return res.status(404).json({ success: false, message: 'Puzzle not found' });

    if (fen) {
      try { new Chess(fen); } catch { return res.status(400).json({ success: false, message: 'Invalid FEN' }); }
      puzzle.fen = fen;
    }
    if (solution) puzzle.solution = solution;
    if (explanation !== undefined) puzzle.explanation = explanation;
    if (difficulty) puzzle.difficulty = difficulty;
    if (theme) puzzle.theme = theme;
    if (tags) puzzle.tags = tags;

    await puzzle.save();
    res.json({ success: true, puzzle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePuzzle = async (req, res) => {
  try {
    const puzzle = await CoachPuzzle.findOne({ _id: req.params.id, coach: req.user._id });
    if (!puzzle) return res.status(404).json({ success: false, message: 'Puzzle not found' });

    puzzle.isActive = false;
    await puzzle.save();
    res.json({ success: true, message: 'Puzzle deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.browsePuzzles = async (req, res) => {
  try {
    const { difficulty, theme, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    if (difficulty) query.difficulty = difficulty;
    if (theme) query.theme = theme;

    const puzzles = await CoachPuzzle.find(query)
      .populate('coach', 'name')
      .sort({ likeCount: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await CoachPuzzle.countDocuments(query);

    res.json({ success: true, puzzles, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.likePuzzle = async (req, res) => {
  try {
    const puzzle = await CoachPuzzle.findOne({ _id: req.params.id, isActive: true });
    if (!puzzle) return res.status(404).json({ success: false, message: 'Puzzle not found' });

    const idx = puzzle.likes.indexOf(req.user._id);
    if (idx > -1) {
      puzzle.likes.splice(idx, 1);
      puzzle.likeCount = Math.max(0, puzzle.likeCount - 1);
    } else {
      puzzle.likes.push(req.user._id);
      puzzle.likeCount += 1;
    }
    await puzzle.save();

    res.json({ success: true, liked: idx === -1, likeCount: puzzle.likeCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.savePuzzle = async (req, res) => {
  try {
    const puzzle = await CoachPuzzle.findOne({ _id: req.params.id, isActive: true });
    if (!puzzle) return res.status(404).json({ success: false, message: 'Puzzle not found' });

    const idx = puzzle.saves.indexOf(req.user._id);
    if (idx > -1) {
      puzzle.saves.splice(idx, 1);
      puzzle.saveCount = Math.max(0, puzzle.saveCount - 1);
    } else {
      puzzle.saves.push(req.user._id);
      puzzle.saveCount += 1;
    }
    await puzzle.save();

    res.json({ success: true, saved: idx === -1, saveCount: puzzle.saveCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
