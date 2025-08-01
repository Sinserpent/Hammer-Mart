import dotenv from 'dotenv'
import mongoose from 'mongoose';
dotenv.config()


const connectDB = async () => {
     try {
         const MONGO_URI = process.env.MONGO_URI;
         if (!MONGO_URI) {
             throw new Error('MONGO_URI is not defined in .env file. What are you doing?');
         }
         await mongoose.connect(MONGO_URI);
         console.log('MongoDB connected successfully. Hmph.');
     } catch (err) {
         console.error('MongoDB connection error, you idiot:', err);
         process.exit(1); 
     }
 };

export default connectDB