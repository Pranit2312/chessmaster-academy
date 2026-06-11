const { Discussion, ForumReply } = require('../models/Forum');
const { asyncHandler } = require('../utils/errors');

exports.getDiscussions = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = { status: 'active' };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }
  const [discussions, total] = await Promise.all([
    Discussion.find(filter).populate('author', 'name profileImage role').sort({ isPinned: -1, createdAt: -1 }).skip(skip).limit(limit),
    Discussion.countDocuments(filter)
  ]);
  res.json({ success: true, discussions, total, page, pages: Math.ceil(total / limit) });
};

exports.getDiscussion = async (req, res) => {
  const discussion = await Discussion.findByIdAndUpdate(
    req.params.id,
    { $inc: { viewCount: 1 } },
    { new: true }
  ).populate('author', 'name profileImage role');
  if (!discussion) return res.status(404).json({ success: false, message: 'Discussion not found' });
  const replies = await ForumReply.find({ discussion: discussion._id, status: 'active', parentReply: null })
    .populate('author', 'name profileImage role').sort({ createdAt: 1 });
  res.json({ success: true, discussion, replies });
};

exports.createDiscussion = async (req, res) => {
  const discussion = await Discussion.create({ ...req.body, author: req.user._id });
  res.status(201).json({ success: true, discussion });
};

exports.updateDiscussion = async (req, res) => {
  const discussion = await Discussion.findOneAndUpdate(
    { _id: req.params.id, author: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!discussion) return res.status(404).json({ success: false, message: 'Discussion not found or unauthorized' });
  res.json({ success: true, discussion });
};

exports.deleteDiscussion = async (req, res) => {
  const discussion = await Discussion.findOneAndUpdate(
    { _id: req.params.id, $or: [{ author: req.user._id }, { status: 'active' }] },
    { status: 'deleted' },
    { new: true }
  );
  if (!discussion) return res.status(404).json({ success: false, message: 'Discussion not found' });
  res.json({ success: true, message: 'Discussion deleted' });
};

exports.likeDiscussion = async (req, res) => {
  const discussion = await Discussion.findById(req.params.id);
  if (!discussion) return res.status(404).json({ success: false, message: 'Discussion not found' });
  const idx = discussion.likes.indexOf(req.user._id);
  if (idx > -1) { discussion.likes.pull(req.user._id); discussion.likesCount = discussion.likes.length; }
  else { discussion.likes.push(req.user._id); discussion.likesCount = discussion.likes.length; }
  await discussion.save();
  res.json({ success: true, likesCount: discussion.likesCount, liked: idx === -1 });
};

exports.pinDiscussion = async (req, res) => {
  const discussion = await Discussion.findByIdAndUpdate(req.params.id, { isPinned: !req.body.unpin }, { new: true });
  if (!discussion) return res.status(404).json({ success: false, message: 'Discussion not found' });
  res.json({ success: true, discussion });
};

exports.getReplies = async (req, res) => {
  const replies = await ForumReply.find({ discussion: req.params.id, status: 'active' })
    .populate('author', 'name profileImage role').sort({ createdAt: 1 });
  res.json({ success: true, replies });
};

exports.createReply = async (req, res) => {
  const reply = await ForumReply.create({ ...req.body, discussion: req.params.id, author: req.user._id });
  await Discussion.findByIdAndUpdate(req.params.id, { $inc: { repliesCount: 1 } });
  res.status(201).json({ success: true, reply });
};

exports.updateReply = async (req, res) => {
  const reply = await ForumReply.findOneAndUpdate(
    { _id: req.params.id, author: req.user._id },
    { content: req.body.content, isEdited: true, $inc: { editCount: 1 } },
    { new: true }
  );
  if (!reply) return res.status(404).json({ success: false, message: 'Reply not found or unauthorized' });
  res.json({ success: true, reply });
};

exports.deleteReply = async (req, res) => {
  const reply = await ForumReply.findOneAndUpdate(
    { _id: req.params.id, author: req.user._id },
    { status: 'deleted' },
    { new: true }
  );
  if (!reply) return res.status(404).json({ success: false, message: 'Reply not found' });
  await Discussion.findByIdAndUpdate(reply.discussion, { $inc: { repliesCount: -1 } });
  res.json({ success: true, message: 'Reply deleted' });
};

exports.markSolution = async (req, res) => {
  const reply = await ForumReply.findById(req.params.id).populate('discussion');
  if (!reply) return res.status(404).json({ success: false, message: 'Reply not found' });
  if (reply.discussion.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only the discussion author can mark a solution' });
  }
  reply.isMarkedAsSolution = !reply.isMarkedAsSolution;
  reply.markedAsSolutionBy = req.user._id;
  await reply.save();
  res.json({ success: true, reply });
};

exports.likeReply = async (req, res) => {
  const reply = await ForumReply.findById(req.params.id);
  if (!reply) return res.status(404).json({ success: false, message: 'Reply not found' });
  const idx = reply.likes.indexOf(req.user._id);
  if (idx > -1) { reply.likes.pull(req.user._id); reply.likesCount = reply.likes.length; }
  else { reply.likes.push(req.user._id); reply.likesCount = reply.likes.length; }
  await reply.save();
  res.json({ success: true, likesCount: reply.likesCount, liked: idx === -1 });
};
