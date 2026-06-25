import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGO_URI or MONGODB_URI is not defined in .env');
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(uri);
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    console.error('Make sure MongoDB is running (e.g. mongod) and MONGO_URI is correct.');
    throw error;
  }
};

export default connectDB;
