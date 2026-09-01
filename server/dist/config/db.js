"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = global.prismaClient ||
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
if (process.env.NODE_ENV !== 'production') {
    global.prismaClient = exports.prisma;
}
const connectDB = async () => {
    try {
        await exports.prisma.$connect();
        // Test connection with a lightweight query
        await exports.prisma.$queryRaw `SELECT 1`;
        console.log('✅ MySQL Database Connected successfully via Prisma ORM');
    }
    catch (error) {
        console.error('❌ MySQL Connection Error:', error);
        throw error;
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    try {
        await exports.prisma.$disconnect();
        console.log('🔌 MySQL Database Disconnected');
    }
    catch (error) {
        console.error('Error disconnecting MySQL:', error);
    }
};
exports.disconnectDB = disconnectDB;
