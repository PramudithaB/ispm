import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './env';

let mongoServer: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<string> => {
  let uri = config.mongoUri;

  if (!uri) {
    console.log('ℹ️  No MONGODB_URI provided in .env. Initializing in-memory embedded MongoDB instance...');
    mongoServer = await MongoMemoryServer.create();
    uri = mongoServer.getUri();
  }

  try {
    await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected successfully to: ${uri.startsWith('mongodb+srv') ? 'MongoDB Atlas Cloud' : 'Embedded / Local MongoDB'}`);
    return uri;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    if (!mongoServer) {
      console.log('⚠️ Falling back to embedded MongoDB instance...');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      await mongoose.connect(uri);
      console.log('✅ Connected to embedded fallback MongoDB instance');
      return uri;
    }
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('🔌 MongoDB Disconnected');
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
  }
};
