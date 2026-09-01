import app from './app';
import { connectDB, disconnectDB, prisma } from './config/db';
import { config } from './config/env';
import { seedDatabase } from './seed/seedData';

const startServer = async () => {
  try {
    console.log('🚀 Starting SecureHemas Backend Server (MySQL + Prisma)...');
    await connectDB();

    // Auto-seed if database is completely empty
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('🌱 Empty database detected. Automatically seeding initial demonstration data into MySQL...');
      await seedDatabase();
    }

    const server = app.listen(config.port, () => {
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║                   SECUREHEMAS BACKEND READY                   ║
║  Information Security Policy & Compliance Management System   ║
║  Hemas Hospitals - University Cybersecurity Capstone Demo     ║
╠════════════════════════════════════════════════════════════════╣
║  • REST API:     http://localhost:${config.port}/api                 ║
║  • Health Check: http://localhost:${config.port}/api/health          ║
║  • Client App:   ${config.clientUrl}                        ║
║  • Database:     MySQL 26 (Prisma ORM)                        ║
║  • Environment:  ${config.nodeEnv.padEnd(44)}║
╚════════════════════════════════════════════════════════════════╝
      `);
    });

    const shutdown = async () => {
      console.log('\n🛑 Gracefully shutting down SecureHemas server...');
      server.close(async () => {
        await disconnectDB();
        console.log('HTTP server and MySQL connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
