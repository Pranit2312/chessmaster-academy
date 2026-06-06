const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/chesscoaching').then(async () => {
  const res = await mongoose.connection.collection('wallets').updateMany({}, { $set: { balance: 0, escrowBalance: 0, earnings: 0 } });
  console.log('Reset wallets:', res);
  process.exit(0);
}).catch(console.error);
