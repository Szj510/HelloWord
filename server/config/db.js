const mongoose = require('mongoose');
require('dotenv').config(); // 确保在顶层加载dotenv

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Mongoose 6+ 默认就是 true, 但可以显式写上
      // useCreateIndex: true, // Mongoose 6 中已移除
      // useFindAndModify: false // Mongoose 6 中已移除
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;