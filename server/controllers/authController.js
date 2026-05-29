const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Wallet = require('../models/Wallet');

// ======================
// Generate JWT Token
// ======================
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// ======================
// REGISTER USER
// ======================
exports.register = async (req, res, next) => {
  try {
    console.log("📥 Incoming Register Data:", req.body);

    const {
      name,
      email,
      password,
      role,
      age,
      chessRating,
      ratingType,
      experience,
      hourlyRate,
      specializations,
      bio,
      title,
      skillLevel,
      learningGoals,
      country,
      timezone
    } = req.body;

    // ======================
    // BASIC VALIDATION
    // ======================
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields"
      });
    }

    // ======================
    // CHECK EXISTING USER
    // ======================
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email"
      });
    }

    const userRole = role.toLowerCase();

    // ======================
    // CREATE USER OBJECT
    // ======================
    const userData = {
      name,
      email,
      password,
      role: userRole,
      age: age || 0,
      chessRating: chessRating || 0,
      ratingType: ratingType || "Chess.com",
      country: country || "",
      timezone: timezone || "Asia/Kolkata"
    };

    // ======================
    // ROLE BASED DATA
    // ======================
    if (userRole === 'coach') {
      userData.experience = Number(experience) || 0;
      userData.hourlyRate = Number(hourlyRate) || 0;
      userData.specializations = specializations || [];
      userData.bio = bio || '';
      userData.title = title || 'None';
    }

    if (userRole === 'student') {
      userData.skillLevel = skillLevel || 'Beginner';
      userData.learningGoals = learningGoals || '';
    }

    // ======================
    // CREATE USER
    // ======================
    const user = await User.create(userData);

    // ======================
    // CREATE WALLET
    // ======================
    await Wallet.create({ 
      user: user._id,
      role: user.role 
    });

    // ======================
    // GENERATE TOKEN
    // ======================
    const token = generateToken(user._id);

    // ======================
    // RESPONSE
    // ======================
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        age: user.age,
        chessRating: user.chessRating,
        ratingType: user.ratingType
      }
    });

  } catch (error) {
    console.error("🔥 REGISTER ERROR FULL:", error);
    next(error);
  }
};

// ======================
// LOGIN USER
// ======================
exports.login = async (req, res, next) => {
  try {
    console.log("LOGIN START");

    const { email, password } = req.body;

    console.log("EMAIL =", email);

    const user = await User.findOne({ email });

    console.log("USER FOUND =", !!user);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    console.log("CHECKING PASSWORD");

    const isPasswordCorrect = await user.comparePassword(password);

    console.log("PASSWORD MATCH =", isPasswordCorrect);

    const token = generateToken(user._id);

    console.log("TOKEN GENERATED");

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.log("LOGIN CRASHED");
    console.error(error);
    next(error);
  }
};

// ======================
// GET CURRENT USER
// ======================
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    next(error);
  }
};