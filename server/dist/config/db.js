"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const env_1 = require("./env");
let mongoServer = null;
const connectDB = async () => {
    let uri = env_1.config.mongoUri;
    if (!uri) {
        console.log('ℹ️  No MONGODB_URI provided in .env. Initializing in-memory embedded MongoDB instance...');
        mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
        uri = mongoServer.getUri();
    }
    try {
        await mongoose_1.default.connect(uri);
        console.log(`✅ MongoDB Connected successfully to: ${uri.startsWith('mongodb+srv') ? 'MongoDB Atlas Cloud' : 'Embedded / Local MongoDB'}`);
        return uri;
    }
    catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        if (!mongoServer) {
            console.log('⚠️ Falling back to embedded MongoDB instance...');
            mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
            uri = mongoServer.getUri();
            await mongoose_1.default.connect(uri);
            console.log('✅ Connected to embedded fallback MongoDB instance');
            return uri;
        }
        throw error;
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    try {
        await mongoose_1.default.disconnect();
        if (mongoServer) {
            await mongoServer.stop();
        }
        console.log('🔌 MongoDB Disconnected');
    }
    catch (error) {
        console.error('Error disconnecting MongoDB:', error);
    }
};
exports.disconnectDB = disconnectDB;
