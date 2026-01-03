import mongoose from 'mongoose';


const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Atlas Connected');
  } catch (err) {
    console.error('❌ DB Error:', err);
    process.exit(1);
  }
};

export default connectDB;
