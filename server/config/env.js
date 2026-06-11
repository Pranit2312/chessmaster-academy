const REQUIRED_VARS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET'
];

const OPTIONAL_WARN = ['CLIENT_URL', 'PORT', 'NODE_ENV'];

function validateEnv() {
  const missing = REQUIRED_VARS.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error('FATAL: Missing required environment variables:');
    missing.forEach(v => console.error(`  - ${v}`));
    console.error('Set them in .env or your environment before starting.');
    process.exit(1);
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('WARNING: JWT_SECRET is less than 32 characters — use a stronger secret in production');
  }

  if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL) {
    console.warn('WARNING: CLIENT_URL not set in production — CORS may block requests');
  }

  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === 'chess_coaching_platform_super_secret_jwt_key_2024_make_it_very_long') {
    console.warn('WARNING: Using default JWT_SECRET in production — set a unique secret');
  }
}

module.exports = { validateEnv };
