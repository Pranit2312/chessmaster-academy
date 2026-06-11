const OpeningLibrary = require('../models/OpeningLibrary');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const { asyncHandler } = require('../utils/errors');

exports.getMarketplace = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = { isMarketplace: true };
  if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };
  if (req.query.difficulty) filter.difficulty = req.query.difficulty;
  const [openings, total] = await Promise.all([
    OpeningLibrary.find(filter).populate('instructor', 'name').sort({ enrollmentCount: -1 }).skip(skip).limit(limit),
    OpeningLibrary.countDocuments(filter)
  ]);
  res.json({ success: true, openings, total, page, pages: Math.ceil(total / limit) });
};

exports.getMarketplaceById = async (req, res) => {
  const opening = await OpeningLibrary.findById(req.params.id).populate('instructor', 'name');
  if (!opening) return res.status(404).json({ success: false, message: 'Opening not found' });
  res.json({ success: true, opening });
};

exports.createMarketplaceListing = async (req, res) => {
  const opening = await OpeningLibrary.create({ ...req.body, isMarketplace: true, instructor: req.user._id });
  res.status(201).json({ success: true, opening });
};

exports.purchaseOpening = async (req, res) => {
  const opening = await OpeningLibrary.findById(req.params.id);
  if (!opening) return res.status(404).json({ success: false, message: 'Opening not found' });
  if (!opening.isMarketplace) return res.status(400).json({ success: false, message: 'Not available for purchase' });

  const wallet = await Wallet.findOne({ user: req.user._id });
  if (!wallet || (wallet.balance || 0) < opening.price) {
    return res.status(400).json({ success: false, message: 'Insufficient balance' });
  }

  wallet.balance -= opening.price;
  await wallet.save();

  await Transaction.create({ user: req.user._id, amount: opening.price, type: 'debit', reason: 'opening_purchase' });

  if (opening.instructor) {
    const coachWallet = await Wallet.findOne({ user: opening.instructor });
    if (coachWallet) {
      const earnings = opening.price * 0.8;
      coachWallet.balance = (coachWallet.balance || 0) + earnings;
      await coachWallet.save();
      await Transaction.create({ user: opening.instructor, amount: earnings, type: 'credit', reason: 'opening_sale' });
    }
  }

  opening.enrollmentCount = (opening.enrollmentCount || 0) + 1;
  await opening.save();

  res.json({ success: true, message: 'Purchased', opening });
};

// Wrap all exports with asyncHandler to catch promise rejections
Object.keys(module.exports).forEach(key => {
  if (typeof module.exports[key] === 'function') {
    module.exports[key] = asyncHandler(module.exports[key]);
  }
});
