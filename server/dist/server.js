"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const seedData_1 = require("./seed/seedData");
const startServer = async () => {
    try {
        console.log('🚀 Starting SecureHemas Backend Server (MySQL + Prisma)...');
        await (0, db_1.connectDB)();
        // Auto-seed if database is completely empty
        const userCount = await db_1.prisma.user.count();
        if (userCount === 0) {
            console.log('🌱 Empty database detected. Automatically seeding initial demonstration data into MySQL...');
            await (0, seedData_1.seedDatabase)();
        }
        const server = app_1.default.listen(env_1.config.port, () => {
            console.log(`
╔════════════════════════════════════════════════════════════════╗
║                   SECUREHEMAS BACKEND READY                   ║
║  Information Security Policy & Compliance Management System   ║
║  Hemas Hospitals - University Cybersecurity Capstone Demo     ║
╠════════════════════════════════════════════════════════════════╣
║  • REST API:     http://localhost:${env_1.config.port}/api                 ║
║  • Health Check: http://localhost:${env_1.config.port}/api/health          ║
║  • Client App:   ${env_1.config.clientUrl}                        ║
║  • Database:     MySQL 26 (Prisma ORM)                        ║
║  • Environment:  ${env_1.config.nodeEnv.padEnd(44)}║
╚════════════════════════════════════════════════════════════════╝
      `);
        });
        const shutdown = async () => {
            console.log('\n🛑 Gracefully shutting down SecureHemas server...');
            server.close(async () => {
                await (0, db_1.disconnectDB)();
                console.log('HTTP server and MySQL connection closed.');
                process.exit(0);
            });
        };
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
