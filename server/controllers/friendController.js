const Friend = require('../models/Friend');
const User = require('../models/User');
const { asyncHandler } = require('../utils/errors');

exports.sendRequest = async (req, res) => {
  const { recipientId } = req.body;
  if (recipientId === req.user._id.toString()) return res.status(400).json({ success: false, message: 'Cannot friend yourself' });
  const existing = await Friend.findOne({ requester: req.user._id, recipient: recipientId });
  if (existing) return res.status(400).json({ success: false, message: 'Request already exists' });
  const friend = await Friend.create({ requester: req.user._id, recipient: recipientId });
  res.status(201).json({ success: true, friend });
};

exports.acceptRequest = async (req, res) => {
  const friend = await Friend.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id, status: 'pending' },
    { status: 'accepted' },
    { new: true }
  );
  if (!friend) return res.status(404).json({ success: false, message: 'Request not found' });
  res.json({ success: true, friend });
};

exports.rejectRequest = async (req, res) => {
  const friend = await Friend.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id, status: 'pending' },
    { status: 'rejected' },
    { new: true }
  );
  if (!friend) return res.status(404).json({ success: false, message: 'Request not found' });
  res.json({ success: true, friend });
};

exports.removeFriend = async (req, res) => {
  const friend = await Friend.findOneAndDelete({
    $or: [
      { _id: req.params.id, requester: req.user._id },
      { _id: req.params.id, recipient: req.user._id }
    ]
  });
  if (!friend) return res.status(404).json({ success: false, message: 'Friend not found' });
  res.json({ success: true, message: 'Friend removed' });
};

exports.blockUser = async (req, res) => {
  const { userId } = req.body;
  const friend = await Friend.findOneAndUpdate(
    { $or: [{ requester: req.user._id, recipient: userId }, { requester: userId, recipient: req.user._id }] },
    { status: 'blocked' },
    { upsert: true, new: true }
  );
  res.json({ success: true, message: 'User blocked', friend });
};

exports.getFriends = async (req, res) => {
  const friends = await Friend.find({
    $or: [{ requester: req.user._id, status: 'accepted' }, { recipient: req.user._id, status: 'accepted' }]
  }).populate('requester recipient', 'name chessRating profileImage');
  const list = friends.map(f => {
    const other = f.requester._id.toString() === req.user._id.toString() ? f.recipient : f.requester;
    return { _id: f._id, user: other };
  });
  res.json({ success: true, friends: list });
};

exports.getPendingRequests = async (req, res) => {
  const requests = await Friend.find({ recipient: req.user._id, status: 'pending' })
    .populate('requester', 'name chessRating profileImage');
  res.json({ success: true, requests });
};

exports.searchUsers = async (req, res) => {
  const q = req.query.q || '';
  const users = await User.find({
    name: { $regex: q, $options: 'i' },
    _id: { $ne: req.user._id }
  }).select('name chessRating profileImage').limit(20);
  res.json({ success: true, users });
};

// Wrap all exports with asyncHandler to catch promise rejections
Object.keys(module.exports).forEach(key => {
  if (typeof module.exports[key] === 'function') {
    module.exports[key] = asyncHandler(module.exports[key]);
  }
});
